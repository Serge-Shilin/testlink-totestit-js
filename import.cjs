const argv = require('minimist')(process.argv.slice(2));
const {TestLink} = require('testlink-xmlrpc');
const TestIT = require('./testIt');
const Section = require('./models/Section');
const Step = require('./models/Step');
const WorkItem = require('./models/WorkItem');
const ConsoleUtil = require('./ConsoleUtil');
const {Details} = require("testlink-xmlrpc/build/constants");

/**
 * Получаем из TestLink все тест-кейсы из папки с id testLinkSuiteId и импортируем их в папку TestIt с id testItSectionId
 * @param {TestIT} _testIt
 * @param {TestLink} _testLink
 * @param {int} testLinkSuiteId
 * @param {string} testItSectionId
 */
async function importTestCases(_testIt, _testLink, testLinkSuiteId, testItSectionId) {

    let testCases = undefined;

    try {
        testCases = await _testLink.getTestCasesForTestSuite({
            testsuiteid: testLinkSuiteId,
            details: "full"
        });
        ConsoleUtil.successLog(`Успешно получены тест-кейсы ${testCases.length}`);
    } catch (e) {
        testCases = await _testLink.getTestCasesForTestSuite({
            testsuiteid: testLinkSuiteId,
            details: "full"
        });
        ConsoleUtil.successLog(`Успешно получены тест-кейсы СО ВТОРОГО РАЗА ${testCases.length}`);
    }

    ConsoleUtil.successLog(`Walking through testCases: ${testCases.length}`);

    for (let i = 0; i < testCases.length; i++) {
        let testCase = testCases[i];
        ConsoleUtil.successLog(` importing test Case ${testCase.name}`);

        // Берем только те тест-кейсы, которые находятся в непосредственной вложенности в данной папке,
        // Тест-кейсы из подпапок не учитываем
        if (testCase.parent_id === testLinkSuiteId) {

            // Формируем объект "Тест-кейс"
            let workItem = new WorkItem(
                testCase.name,
                testCase.summary.replace(/<[^>]*>?/gm, '').replaceAll("&nbsp;", ' ')
                    .replace(/"/g, "'")
                    .replace(/&quot;/g, '\"').trim(),
                testIt.projectId,
                testItSectionId,
                testCase.estimated_exec_duration,
                0,
                0,
                testCase.importance
            );

            workItem.addTag("ImportTestLink");

            // Берем все предусловия из TestLink
            workItem.addPreconditionStep(testCase.preconditions);

            // Берем все пост-условия из TestLink
            workItem.addPostconditionStep(testCase.postconditions);

            if (testCase?.steps.length) {

                // Берем все шаги из TestLink
                testCase.steps.forEach(step => {
                    let stepIt = new Step(step.actions, step.expected_results);

                    workItem.addStep(stepIt);
                });
            }

            // Создаем тест-кейс в TestIt
            try {
                let result = _testIt.createWorkItemSync(workItem);
                ConsoleUtil.successLog(`Успешно создан тест-кейс ${workItem.name}`);
            } catch (e) {
                ConsoleUtil.successLog(`Ошибка при импорте тест-кейса ${workItem.name}`);
                console.log(e);
                sleep(2000);

                try {
                    let result = _testIt.createWorkItemSync(workItem);
                    ConsoleUtil.successLog(`Успешно создан тест-кейс ПОВТОРНАЯ ПОПЫТКА ${workItem.name}`);
                } catch (e) {
                    ConsoleUtil.errorLog(`Повторная ошибка при импорте тест-кейса ${workItem.name}`);
                    console.log(e);
                }
            }
        }
    }
}

/**
 * Получаем из TestLink все подпапки из папки с id testLinkSuiteId и импортируем их в папку TestIt с id testItSectionId
 * @param {TestIT} _testIt
 * @param {TestLink} _testLink
 * @param {int} testLinkSuiteId
 * @param {string} testItSectionId
 */
async function importSubFolders(_testIt, _testLink, testLinkSuiteId, testItSectionId) {
    // Получаем список дочерних папок из TestLink
    _testLink.getTestSuitesForTestSuite({testsuiteid: testLinkSuiteId}).then(result => {

        let suites;

        if (result.id) {
            let key = result.id;
            suites = {key: result};
        } else {
            suites = result;
        }

        let arraySuites = Object.values(suites);
        return importFolderAndTestcase(_testIt, _testLink, arraySuites, testItSectionId).catch(e => {
            throw e
        })
    }).catch(e => {
        throw e
    });
}

/**
 *
 * @param {TestIT} _testIt
 * @param {*} _testLink
 * @param {array} testSuites Тест-кейсы из TestLink
 * @param {string} parentSectionId Id папки TestIT где будет происходить создание
 */
async function importFolderAndTestcase(_testIt, _testLink, testSuites, parentSectionId) {
    for (let suite of testSuites) {

        let section = new Section(suite.name, _testIt.projectId, parentSectionId);

        try {
            // Создаем папку в TestIt
            const result = await _testIt.createSection(section);
            const testItSection = result?.data;

            if (testItSection && testItSection.id) {

                ConsoleUtil.successLog(`Успешно создана папка ${result.data.name}`);
                section.id = testItSection.id;

                // Получение и создание тест-кейсов из TestLink в только что созданную папку
                await importTestCases(_testIt, _testLink, suite.id, section.id);

                // Получение и создание всех подпапок из TestLink в только что созданную папку
                await importSubFolders(_testIt, _testLink, suite.id, section.id);
            }
        } catch (e) {
            ConsoleUtil.errorLog(`Ошибка при создании папки`);
            ConsoleUtil.errorLog(e)
        }
    }
}

// Проверка на все передаваемые параметры
if (
    argv["testlinkhost"] === undefined ||
    argv["testlinkport"] === undefined ||
    argv["testlinksecure"] === undefined ||
    argv["testlinkapiKey"] === undefined ||
    argv["testithost"] === undefined ||
    argv["testitapiKey"] === undefined
) {
    throw new Error("Переданы не все обязательные параметры");
}

// Создаем модель TestLink
let testLink;
testLink = new TestLink({
    host: argv["testlinkhost"], // "10.60.5.205",
    port: argv["testlinkport"], // Set if you are not using default port
    secure: false, // Use https, if you are using http, set to false.
    apiKey: argv["testlinkapiKey"], // API KEY в TestLink. Get it from user profile.
    rpcPath: 'testlink/lib/api/xmlrpc/v1/xmlrpc.php'
});
testLink.projectId = argv["testlinkprojectId"]; // ID export project from TestLink.

// Создаем модель TestIt
let testIt;
testIt = new TestIT({
    host: argv["testithost"], // "10.70.37.192",
    apiKey: argv["testitapiKey"], // API KEY в TestIT. Его можно получить в профиле пользователя.
    projectId: argv["testitprojectId"], // ID проекта для импорта в TestIt
});

// Метод для получения списка проектов
if (argv["getProjects"]) {
    // Получаем список проектов TestLink
    testLink.getProjects().then(result => {
        ConsoleUtil.successLog("Список проектов Testlink:");
        result.forEach(project => {
            console.log("  Id: %s", project.id);
            console.log("  Name: %s \n", project.name);
        })
    }).catch(function (error) {
        ConsoleUtil.errorLog("Ошибка при получении списка проектов TestLink:");
        console.log(error);
    });

    // Получаем список проектов TestIt
    testIt.getProjects({isDeleted: false}).then(result => {
        ConsoleUtil.successLog("Список проектов TestIt:");
        result.forEach(project => {
            console.log("  Id: %s", project.id);
            console.log("  Name: %s \n", project.name);
        })

    }).catch(function (error) {
        ConsoleUtil.errorLog("Ошибка при получении списка проектов TestIt:");
        console.log(error);
    });
}
// Метод для импорта
else {
    if (argv["testlinkprojectId"] === undefined || argv["testitprojectId"] === undefined) {
        throw new Error("Переданы не все обязательные параметры");
    }

    // Получение root папки в TestIt
    testIt.getRootSection(testIt.projectId).then(result => {
        let rootFolderID = result.id;
        ConsoleUtil.successLog(`Начат импорт из TestLink проекта ${testLink.projectId} в TestIt проект ${testIt.projectId}:`);
        // Получение root папки в TestLink
        testLink.getFirstLevelTestSuitesForTestProject({testprojectid: testLink.projectId}).then(suites => {
            if (suites.length > 0) {
                importFolderAndTestcase(testIt, testLink, suites, rootFolderID).then().catch(e => {
                    ConsoleUtil.errorLog("Ошибка импорта")
                });
            }
        }).catch(e => {
            ConsoleUtil.errorLog("Ошибка получения root директории TestLink:");
            console.log(e);
        });
    }).catch(e => {
        ConsoleUtil.errorLog("Ошибка получения root директории TestIt:");
        console.log(e);
    });

    function sleep(milliseconds) {
        const date = Date.now();
        let currentDate = null;
        do {
            currentDate = Date.now();
        } while (currentDate - date < milliseconds);
    }
}
