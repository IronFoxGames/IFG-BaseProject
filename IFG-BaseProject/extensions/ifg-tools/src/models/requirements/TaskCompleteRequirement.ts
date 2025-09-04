import { Requirement } from './Requirement';
import { RequirementType } from './RequirementType';

export class TaskCompleteRequirement extends Requirement {
    public taskId: string;

    constructor(requirementType: RequirementType, taskId: string) {
        super(requirementType);
        this.taskId = taskId;
    }

    public getType(): RequirementType {
        return RequirementType.TaskComplete;
    }

    public toString(): string {
        return `TaskCompleteRequirement: Chapter[${this.taskId}] should have all of its tasks completed.`;
    }

    public static fromObject(obj: any): TaskCompleteRequirement {
        if (!obj?.taskId) {
            throw new Error("TaskCompleteRequirement: 'taskId' is required");
        }

        return new TaskCompleteRequirement(RequirementType.TaskComplete, obj?.taskId);
    }
}
