const Step = require('./Step');
const Link = require('./Link');

class WorkItem{
    /**
     * 
     * @param {string} name 
     * @param {string} summary
     * @param {string} projectId 
     * @param {string} sectionId 
     * @param {int} duration 
     * @param {int} entityTypeName 0 - default (TestCases) | 1 - TestCases | 2 - CheckLists | 3 - SharedSteps
     * @param {int} state 0 - default (NotReady) | 1 - NotReady | 2 - Ready | 3 - NeedsWork
     * @param {int} priority 0 - default (Low) | 1 - low | 2 - Medium | 3 - High
     */
    constructor(name, summary, projectId, sectionId, duration, entityTypeName, state, priority){
        this.name = name;
        this.description = summary;
        this.projectId = projectId;
        this.sectionId = sectionId;

        this.setDuration(duration);
        this.setEntityTypeName(entityTypeName);
        this.setState(state);
        this.setPriority(priority);

        this.steps = Array();
        this.preconditionSteps = Array();
        this.postconditionSteps = Array();
        this.attributes = {};
        this.tags = Array();
        this.links = Array() 
    }

    /**
     * Set priority
     * @param {int} index  0 - default (Low) | 1 - low | 2 - Medium | 3 - High
     */
    setPriority(index){
        switch(index){
            case "1":
                this.priority = "Low";
            case "2":
                this.priority = "Medium";
            case "3":
                this.priority = "High";
            default:
                this.priority = "Low";
        }
    }

    /**
     * Set state
     * @param {int} index  0 - default (NotReady) | 1 - NotReady | 2 - Ready | 3 - NeedsWork
     */
    setState(index){
        switch(index){
            case 1:
                this.state = "NotReady";
            case 2:
                this.state = "Ready";
            case 3:
                this.state = "NeedsWork";
            default:
                this.state = "NotReady";
        }
    }

    /**
     * Set work type
     * @param {int} index  0 - default (TestCases) | 1 - TestCases | 2 - CheckLists | 3 - SharedSteps
     */
    setEntityTypeName(index){
        switch(index){
            case 1:
                this.entityTypeName = "TestCases";
            case 2:
                this.entityTypeName = "CheckLists";
            case 3:
                this.entityTypeName = "SharedSteps";
            default:
                this.entityTypeName = "TestCases";
        }
    }

    setDuration(duration){
        this.duration = 60*duration;
        if(this.duration === 0)
        this.duration = 60
    }

    /**
     * @param {Step} step 
     */
    addStep(Step){
        this.steps.push(Step);
    }

    /**
     *
     * @param {PreconditionStep} preconditionStep
     */
    addPreconditionStep(PreconditionStep){
        if (PreconditionStep){
            this.preconditionSteps.push(new Step("", PreconditionStep));
        }
    }

    /**
     *
     * @param {PostconditionStep} postconditionStep
     */
    addPostconditionStep(PostconditionStep){
        if (PostconditionStep) {
            this.postconditionSteps.push(new Step("", PostconditionStep));
        }
    }

    /**
     * @param {Link} link 
     */
    addLink(link){
        this.links.push(link);
    }

    /**
     *
     * @param {string} tag
     */
    addTag(tag){
        let objTag = {name: tag};
        this.tags.push(objTag);
    }
}

module.exports = WorkItem;