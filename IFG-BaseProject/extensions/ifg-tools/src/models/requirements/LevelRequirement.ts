import { ComparisonOperator } from './ComparisonOperator';
import { RequirementType } from './RequirementType';
import { Requirement } from './Requirement';

export class LevelRequirement extends Requirement {
    public level: number;
    public operator: ComparisonOperator;

    constructor(requirementType: RequirementType, level: number, operator: ComparisonOperator) {
        super(requirementType);
        this.level = level;
        this.operator = operator;
    }

    getType(): RequirementType {
        return RequirementType.Level;
    }

    toString(): string {
        return `LevelRequirement: ${this.operator} ${this.level}`;
    }

    static fromObject(obj: any): LevelRequirement {
        if (typeof obj?.level !== 'number') {
            throw new Error("LevelRequirement: 'level' must be a number");
        }

        if (!obj?.operator) {
            throw new Error("LevelRequirement: 'operator' is required");
        }

        const operator = obj?.operator as ComparisonOperator;

        // Validate operator
        if (!Object.values(ComparisonOperator).includes(operator)) {
            throw new Error(`LevelRequirement: Invalid operator '${operator}'`);
        }

        return new LevelRequirement(RequirementType.Level, obj?.level, operator);
    }
}
