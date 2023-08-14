class Step{
    constructor(action, expected){
        this.action = action.replace(/"/g, "'").replace(['<ol />', '<ol>', '/<ol>'], "")
            .replace(/\t/g,"").replace(['<br />', '<br/>', '<br>'], "\n");
        this.expected = expected.replace(/"/g, "'").replace(['<ol />', '<ol>', '/<ol>'], "")
            .replace(/\t/g,"").replace(['<br />', '<br/>', '<br>'], "\n");
    }
}

module.exports = Step;
