const axios = require('axios').default;
const WorkImet = require('./models/WorkItem');
const Section = require('./models/Section');
const { ConcurrencyManager } = require("axios-concurrency");

class TestIT {

    /**
     * Class constructor
     *
     * @param {object}  params Configuration parameters
     * @param {string}  params.host Hostname or IP where TestLink is hosted.
     * @param {int}     params.port Hostname or IP where TestLink is hosted.
     * @param {string}  params.secure Use or not secure connection. If set to true, use http and port 443 if a port was not defined else uses http and port 80.
     * @param {string}  params.projectId
     * @param {string}  params.prefix Prefix url api - default '/api/'
     * @param {string}  params.apiKey The api key to interact with TestLink.
     * */
    constructor(params){
        let defaultParams = {
            host: "localhost",
            port: undefined,
            secure: false,
            prefix: "/api/",
            apiKey: undefined,
            projectId: undefined,
        };
        
        
        let p = Object.assign({}, defaultParams, params);

        this.host = p.host;
        this.secure = p.secure;
        this.port = p.port || (this.secure ? 443 : 80);
        this.prefix = p.prefix;
        this.apiKey = p.apiKey;
        this.baseUrl = (this.secure ? "https://" : "http://") + this.host + ":" + this.port + this.prefix;
        this.projectId = p.projectId;

        this.axios = axios;
        this.axios.defaults.baseURL = this.baseUrl;
        this.axios.defaults.headers.common['Authorization'] = "PrivateToken " + this.apiKey;

        // a concurrency parameter of 1 makes all api requests secuential
        const MAX_CONCURRENT_REQUESTS = 2;

        this.concurrencyManager = ConcurrencyManager(this.axios, MAX_CONCURRENT_REQUESTS);
    }


    /*
    * Create section
    *
    * @param {string}   options.name Name Section
    * @param {string}   options.projectId Project id (not global)
    * @param {string}   options.parentId Parent section id
    * @param {array}    options.preconditionSteps
    * @param {string}   options.preconditionSteps[].action
    * @param {string}   options.preconditionSteps[].expected
    * @param {array}    options.postconditionSteps
    * @param {string}   options.postconditionSteps[].action
    * @param {string}   options.postconditionSteps[].expected
    * 
    *
    * @returns {object}  result Result object.
    */
    
    /**
     * Create section
     * @param {Section} section 
     */
    createSection(section){
        return this.axios.post("/v2/sections", section).catch(error => { throw error});
    }

    /**
     * Create {Test Case},{Check List} or {Shared Step}
     * 
     * @param {WorkItem}  workItem
     */
    createWorkItem(workItem){
        return this.axios.post('/v2/WorkItems', workItem).catch(error => { throw error});
    };

    async createWorkItemSync(workItem){
        return await this.axios.post('/v2/WorkItems', workItem).catch(error => { throw error});
    };
    
    /**
     * Gets a list of all projects
     * 
     * @param {object}  options Options.
     * @param {boolean} options.isDeleted 
     * @param {int}     options.skip Amount of items to be skipped (offset)
     * @param {int}     options.take Amount of items to be taken (limit)
     * @param {string}  options.orderBy SQL-like ORDER BY statement (column1 ASC|DESC , column2 ASC|DESC)
     * @param {string}  options.searchField Property name for searching
     * @param {string}  options.searchValue Value for searching
     *
     * @returns {object}  result Result object.
     */
    getProjects(options){
      return this.axios.get('/v2/projects', {params:options}).then(r => {
          return r.data;
      }).catch(error => { throw error});
    };

    /**
     * @param {string}  projectId
     * @param {object}  options
     * @param {int}     options.skip
     * @param {int}     options.take
     * @param {string}  options.orderBy
     * @param {string}  options.searchField
     * @param {string}  options.searchValue
     */
    getSections(projectId, options){
        return this.axios.get('/v2/projects/' + projectId + '/sections', options).then(r => {
            return r.data;
        }).catch(error => { throw error})
    }

    /**
     * 
     * @param {string} projectId 
     */
    getRootSection(projectId){
        return this.axios.get('/v2/projects/' + projectId + '/sections').then(r => {
            let rootSection;
            r.data.forEach(section => {
                if(section.parentId === null){
                    rootSection = section;
                }
            });
            if(rootSection === undefined){
                throw  new Error("Не смог найти root категорию")
            }
            else
                return rootSection;
        }).catch(error => {throw error})

    }

    /**
     * 
     * @param {object}  json Json string
     * @param {string}  json.projectId Project id in TestIT
     * @param {array}   json.sections Array section
     * @param {string}   json.sections[].id Id section
     * @param {string}   json.sections[].name Name section
     * @param {string}  json.sections[].parentId Id parent folder 
     * @param {array}   json.sections[].workItems Array work
     * 
     */

    importJson(json){
        let self = this;
        this.getRootSection(json.projectId).then(rootSection => {
            self.createTreeSection(json.projectId, json.sections, null, rootSection.id);
        }).catch(error => { throw error})
    }

    createTreeSection(projectId, sections, parentIdLocal, parentIdInHost){
        let self = this;

        sections.forEach(section => {
            //Берем телько те папки которые соответствуют текущему уровню вложенности, папки верхнего уровня parentIdLocal === null
            if(section.parentIdLocal === parentIdLocal){
                section.projectId = projectId;
                section.parentId = parentIdInHost;
                let childSections = sections.filter(el => el.parentIdLocal === section.id);
                return this.createSection(section).then(r => {
                    //Создаем таски
                    if(section.workIrems){
                        section.workIrems.forEach(item => {
                                item.projectId = projectId;
                                item.sectionId = r.id;
                                self.createWorkItem(item);
                            })
                    }
                    if(childSections.length>0){
                        self.createTreeSection(projectId, childSections, section.id, r.id);
                    }
                });
            }
        })
    }

}

module.exports = TestIT;
