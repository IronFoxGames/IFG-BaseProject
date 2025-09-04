"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelRequirement = void 0;
const ComparisonOperator_1 = require("./ComparisonOperator");
const RequirementType_1 = require("./RequirementType");
const Requirement_1 = require("./Requirement");
class LevelRequirement extends Requirement_1.Requirement {
    constructor(requirementType, level, operator) {
        super(requirementType);
        this.level = level;
        this.operator = operator;
    }
    getType() {
        return RequirementType_1.RequirementType.Level;
    }
    toString() {
        return `LevelRequirement: ${this.operator} ${this.level}`;
    }
    static fromObject(obj) {
        if (typeof (obj === null || obj === void 0 ? void 0 : obj.level) !== 'number') {
            throw new Error("LevelRequirement: 'level' must be a number");
        }
        if (!(obj === null || obj === void 0 ? void 0 : obj.operator)) {
            throw new Error("LevelRequirement: 'operator' is required");
        }
        const operator = obj === null || obj === void 0 ? void 0 : obj.operator;
        // Validate operator
        if (!Object.values(ComparisonOperator_1.ComparisonOperator).includes(operator)) {
            throw new Error(`LevelRequirement: Invalid operator '${operator}'`);
        }
        return new LevelRequirement(RequirementType_1.RequirementType.Level, obj === null || obj === void 0 ? void 0 : obj.level, operator);
    }
}
exports.LevelRequirement = LevelRequirement;
