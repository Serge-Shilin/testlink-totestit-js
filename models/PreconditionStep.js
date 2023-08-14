class PreconditionStep{
    constructor(action, expected){
        this.action = action.replace(/"/g, "'").replace(/\\n/g, '').replace(/\n/g, "<br />");
        this.expected = expected.replace(/"/g, "'").replace(/\n/g, "<br />");
    }
}

module.exports = PreconditionStep;