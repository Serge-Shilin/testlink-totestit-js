const Step = require('./Step');
const WorkItem = require('./WorkItem');

class Section{

    constructor(name, projectId, parentId){
        this.name = name;
        this.projectId = projectId;
        this.parentId = parentId;
        this.workItems = Array();


        this.preconditionSteps = [];
        this.postconditionSteps = [];
        this.isDeleted;
        this.createdDate;
        this.modifiedDate;
        this.createdById;
        this.modifiedById;
    }

    /**
     *
     * @param {WorkItem} workItem
     */
    addWorkItem(workItem){
        this.workItems.push(workItem)
    }
}
module.exports = Section;