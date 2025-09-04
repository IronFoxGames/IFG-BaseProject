import { RequirementType } from './RequirementType';
import { Requirement } from './Requirement';

export class LevelIdRequirement extends Requirement {
    public levelId: string;
    public operator: LevelIdComparisonOperator;

    constructor(requirementType: RequirementType, levelId: string, operator: LevelIdComparisonOperator) {
        super(requirementType);
        this.levelId = levelId;
        this.operator = operator;
    }

    getType(): RequirementType {
        return RequirementType.LevelId;
    }

    toString(): string {
        return `LevelIdRequirement: ${this.operator} ${this.levelId}`;
    }

    static fromObject(obj: any): LevelIdRequirement {
        if (typeof obj?.levelId !== 'string') {
            throw new Error("LevelIdRequirement: 'levelId' must be a string");
        }

        if (!obj?.operator) {
            throw new Error("LevelIdRequirement: 'operator' is required");
        }

        // Validate operator
        const operator = obj?.operator as LevelIdComparisonOperator;
        if (!Object.values(LevelIdComparisonOperator).includes(operator)) {
            throw new Error(`LevelIdRequirement: Invalid operator '${operator}'`);
        }

        return new LevelIdRequirement(RequirementType.LevelId, obj?.levelId, operator);
    }
}

export enum LevelIdComparisonOperator {
    complete = 'complete',
    incomplete = 'incomplete',
    isNext = 'isNext'
}
