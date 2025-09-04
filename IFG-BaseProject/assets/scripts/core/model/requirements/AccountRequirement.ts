import { EntitlementType } from '../../enums/EntitlementType';
import { ComparisonOperator } from './ComparisonOperator';
import { Requirement } from './Requirement';
import { RequirementType } from './RequirementType';

export class AccountRequirement extends Requirement {
    public entitlement: EntitlementType;
    public operator: ComparisonOperator;

    constructor(requirementType: RequirementType, entitlement: EntitlementType, operator: ComparisonOperator) {
        super(requirementType);
        this.entitlement = entitlement;
        this.operator = operator;
    }

    public getType(): RequirementType {
        return RequirementType.AccountRequirement;
    }

    public toString(): string {
        return `AccountRequirement: Entitlement[${this.entitlement}] Operator[${this.operator}].`;
    }

    public static fromObject(obj: any): AccountRequirement {
        if (!obj?.entitlement) {
            throw new Error("AccountRequirement: 'entitlement' is required");
        }

        const entitlement = obj?.entitlement as EntitlementType;
        if (!Object.values(EntitlementType).includes(entitlement)) {
            throw new Error(`AccountRequirement: Invalid entitlement '${entitlement}'`);
        }

        if (!obj?.operator) {
            throw new Error("AccountRequirement: 'operator' is required");
        }

        const operator = obj?.operator as ComparisonOperator;
        if (!Object.values(ComparisonOperator).includes(operator)) {
            throw new Error(`AccountRequirement: Invalid operator '${operator}'`);
        }

        return new AccountRequirement(RequirementType.AccountRequirement, entitlement, operator);
    }
}
