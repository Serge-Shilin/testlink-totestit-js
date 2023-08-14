class ConsoleUtil{
    static successLog(msg){
        console.log("\x1b[32m%s: \x1b[0m", msg);
    }

    static errorLog(msg){
        console.log("\x1b[31m%s: \x1b[0m", msg);
    }
}

module.exports = ConsoleUtil;
