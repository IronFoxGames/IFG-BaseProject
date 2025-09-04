"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickPlaySessionsRequirement = void 0;
const ComparisonOperator_1 = require("./ComparisonOperator");
const RequirementType_1 = require("./RequirementType");
const Requirement_1 = require("./Requirement");
class QuickPlaySessionsRequirement extends Requirement_1.Requirement {
    constructor(requirementType, playCount, operator) {
        super(requirementType);
        this.playCount = playCount;
        this.operator = operator;
    }
    getType() {
        return RequirementType_1.RequirementType.QuickPlaySessions;
    }
    toString() {
        return `QuickPlaySessionsRequirement: ${this.operator} ${this.playCount}`;
    }
    static fromObject(obj) {
        if (typeof (obj === null || obj === void 0 ? void 0 : obj.playCount) !== 'number') {
            throw new Error("QuickPlaySessionsRequirement: 'playCount' must be a number");
        }
        if (!(obj === null || obj === void 0 ? void 0 : obj.operator)) {
            throw new Error("QuickPlaySessionsRequirement: 'operator' is required");
        }
        const operator = obj === null || obj === void 0 ? void 0 : obj.operator;
        // Validate operator
        if (!Object.values(ComparisonOperator_1.ComparisonOperator).includes(operator)) {
            throw new Error(`QuickPlaySessionsRequirement: Invalid operator '${operator}'`);
        }
        return new QuickPlaySessionsRequirement(RequirementType_1.RequirementType.QuickPlaySessions, obj === null || obj === void 0 ? void 0 : obj.playCount, operator);
    }
}
exports.QuickPlaySessionsRequirement = QuickPlaySessionsRequirement;
