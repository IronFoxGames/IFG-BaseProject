import { ComparisonOperator } from './ComparisonOperator';
import { RequirementType } from './RequirementType';
import { Requirement } from './Requirement';

export class QuickPlaySessionsRequirement extends Requirement {
    public playCount: number;
    public operator: ComparisonOperator;

    constructor(requirementType: RequirementType, playCount: number, operator: ComparisonOperator) {
        super(requirementType);
        this.playCount = playCount;
        this.operator = operator;
    }

    getType(): RequirementType {
        return RequirementType.QuickPlaySessions;
    }

    toString(): string {
        return `QuickPlaySessionsRequirement: ${this.operator} ${this.playCount}`;
    }

    static fromObject(obj: any): QuickPlaySessionsRequirement {
        if (typeof obj?.playCount !== 'number') {
            throw new Error("QuickPlaySessionsRequirement: 'playCount' must be a number");
        }

        if (!obj?.operator) {
            throw new Error("QuickPlaySessionsRequirement: 'operator' is required");
        }

        const operator = obj?.operator as ComparisonOperator;

        // Validate operator
        if (!Object.values(ComparisonOperator).includes(operator)) {
            throw new Error(`QuickPlaySessionsRequirement: Invalid operator '${operator}'`);
        }

        return new QuickPlaySessionsRequirement(RequirementType.QuickPlaySessions, obj?.playCount, operator);
    }
}
