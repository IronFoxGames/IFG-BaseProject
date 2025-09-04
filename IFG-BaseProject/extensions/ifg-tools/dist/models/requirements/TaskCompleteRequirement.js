"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskCompleteRequirement = void 0;
const Requirement_1 = require("./Requirement");
const RequirementType_1 = require("./RequirementType");
class TaskCompleteRequirement extends Requirement_1.Requirement {
    constructor(requirementType, taskId) {
        super(requirementType);
        this.taskId = taskId;
    }
    getType() {
        return RequirementType_1.RequirementType.TaskComplete;
    }
    toString() {
        return `TaskCompleteRequirement: Chapter[${this.taskId}] should have all of its tasks completed.`;
    }
    static fromObject(obj) {
        if (!(obj === null || obj === void 0 ? void 0 : obj.taskId)) {
            throw new Error("TaskCompleteRequirement: 'taskId' is required");
        }
        return new TaskCompleteRequirement(RequirementType_1.RequirementType.TaskComplete, obj === null || obj === void 0 ? void 0 : obj.taskId);
    }
}
exports.TaskCompleteRequirement = TaskCompleteRequirement;
