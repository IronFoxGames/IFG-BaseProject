"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountRequirement = void 0;
const EntitlementType_1 = require("../../enums/EntitlementType");
const ComparisonOperator_1 = require("./ComparisonOperator");
const Requirement_1 = require("./Requirement");
const RequirementType_1 = require("./RequirementType");
class AccountRequirement extends Requirement_1.Requirement {
    constructor(requirementType, entitlement, operator) {
        super(requirementType);
        this.entitlement = entitlement;
        this.operator = operator;
    }
    getType() {
        return RequirementType_1.RequirementType.AccountRequirement;
    }
    toString() {
        return `AccountRequirement: Entitlement[${this.entitlement}] Operator[${this.operator}].`;
    }
    static fromObject(obj) {
        if (!(obj === null || obj === void 0 ? void 0 : obj.entitlement)) {
            throw new Error("AccountRequirement: 'entitlement' is required");
        }
        const entitlement = obj === null || obj === void 0 ? void 0 : obj.entitlement;
        if (!Object.values(EntitlementType_1.EntitlementType).includes(entitlement)) {
            throw new Error(`AccountRequirement: Invalid entitlement '${entitlement}'`);
        }
        if (!(obj === null || obj === void 0 ? void 0 : obj.operator)) {
            throw new Error("AccountRequirement: 'operator' is required");
        }
        const operator = obj === null || obj === void 0 ? void 0 : obj.operator;
        if (!Object.values(ComparisonOperator_1.ComparisonOperator).includes(operator)) {
            throw new Error(`AccountRequirement: Invalid operator '${operator}'`);
        }
        return new AccountRequirement(RequirementType_1.RequirementType.AccountRequirement, entitlement, operator);
    }
}
exports.AccountRequirement = AccountRequirement;
