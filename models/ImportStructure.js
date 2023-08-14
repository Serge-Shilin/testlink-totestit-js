const Section = require("./Section");

class ImportStructure{
    sections;

    /**
     *
     * @param {Section} section
     */
    addSection(section){
        this.sections.push(section);
    }
}

module.exports = ImportStructure;