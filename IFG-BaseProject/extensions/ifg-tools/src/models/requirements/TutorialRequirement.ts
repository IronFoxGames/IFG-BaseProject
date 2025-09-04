import { Requirement } from './Requirement';
import { RequirementType } from './RequirementType';

export class TutorialRequirement extends Requirement {
    public tutorialId: string;
    public operator: TutorialOperator;

    constructor(requirementType: RequirementType, tutorialId: string, operator: TutorialOperator) {
        super(requirementType);
        this.tutorialId = tutorialId;
        this.operator = operator;
    }

    getType(): RequirementType {
        return RequirementType.Tutorial;
    }

    toString(): string {
        return this.operator === TutorialOperator.hasSeen
            ? `TutorialRequirement: Has Seen ${this.tutorialId}`
            : `TutorialRequirement: Has Not Seen ${this.tutorialId}`;
    }

    static fromObject(obj: any): TutorialRequirement {
        if (!obj?.tutorialId) {
            throw new Error("TutorialRequirement: 'tutorialId' is required");
        }

        if (!obj?.operator) {
            throw new Error("TutorialRequirement: 'operator' is required");
        }

        const operator = obj?.operator as TutorialOperator;

        // Validate operator
        if (!Object.values(TutorialOperator).includes(operator)) {
            throw new Error(`TutorialRequirement: Invalid operator '${operator}'`);
        }

        return new TutorialRequirement(RequirementType.Tutorial, obj?.tutorialId, operator);
    }
}

export enum TutorialOperator {
    hasSeen = 'hasSeen',
    hasNotSeen = 'hasNotSeen'
}
