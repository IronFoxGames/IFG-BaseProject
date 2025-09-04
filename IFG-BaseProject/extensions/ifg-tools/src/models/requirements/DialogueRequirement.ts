import { Requirement } from './Requirement';
import { RequirementType } from './RequirementType';

export class DialogueRequirement extends Requirement {
    public dialogueId: string;
    public operator: DialogueOperator;

    constructor(requirementType: RequirementType, dialogueId: string, operator: DialogueOperator) {
        super(requirementType);
        this.dialogueId = dialogueId;
        this.operator = operator;
    }

    getType(): RequirementType {
        return RequirementType.Dialogue;
    }

    toString(): string {
        return this.operator === DialogueOperator.hasSeen
            ? `DialogueRequirement: Has Seen ${this.dialogueId}`
            : `DialogueRequirement: Has Not Seen ${this.dialogueId}`;
    }

    static fromObject(obj: any): DialogueRequirement {
        if (!obj?.dialogueId) {
            throw new Error("DialogueRequirement: 'dialogueId' is required");
        }

        if (!obj?.operator) {
            throw new Error("DialogueRequirement: 'operator' is required");
        }

        const operator = obj?.operator as DialogueOperator;

        // Validate operator
        if (!Object.values(DialogueOperator).includes(operator)) {
            throw new Error(`DialogueRequirement: Invalid operator '${operator}'`);
        }

        return new DialogueRequirement(RequirementType.Dialogue, obj?.dialogueId, operator);
    }
}

export enum DialogueOperator {
    hasSeen = 'hasSeen',
    hasNotSeen = 'hasNotSeen'
}
