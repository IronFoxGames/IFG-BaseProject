import { RequirementType } from './RequirementType';
import { Requirement } from './Requirement';

export class DateRequirement extends Requirement {
    public date: Date;
    public endDate: Date | null;
    public operator: DateOperator;

    constructor(requirementType: RequirementType, date: Date, endDate: Date | null, operator: DateOperator) {
        super(requirementType);
        this.date = date;
        this.endDate = endDate;
        this.operator = operator;
    }

    getType(): RequirementType {
        return RequirementType.Date;
    }

    toString(): string {
        const base = `DateRequirement: ${this.operator} ${this.date.toISOString()}`;
        return this.operator === DateOperator.inRange && this.endDate ? `${base} and before ${this.endDate.toISOString()}` : base;
    }

    static fromObject(obj: any): DateRequirement {
        if (!obj?.date) {
            throw new Error("DateRequirement: 'date' field is required");
        }

        if (!obj?.operator) {
            throw new Error("DateRequirement: 'operator' field is required");
        }

        const date = new Date(obj?.date);
        const operator = obj?.operator as DateOperator;

        // Validate operator
        if (!Object.values(DateOperator).includes(operator)) {
            throw new Error(`DateRequirement: Invalid operator '${operator}'`);
        }

        // Parse optional endDate for inRange operator
        const endDate = obj?.endDate ? new Date(obj?.endDate) : null;

        // Validate endDate if operator is inRange
        if (operator === DateOperator.inRange && !endDate) {
            throw new Error("DateRequirement: 'endDate' is required for 'inRange' operator");
        }

        return new DateRequirement(RequirementType.Date, date, endDate, operator);
    }
}

export enum DateOperator {
    before = 'before',
    after = 'after',
    inRange = 'inRange'
}
