"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelIdComparisonOperator = exports.LevelIdRequirement = void 0;
const RequirementType_1 = require("./RequirementType");
const Requirement_1 = require("./Requirement");
class LevelIdRequirement extends Requirement_1.Requirement {
    constructor(requirementType, levelId, operator) {
        super(requirementType);
        this.levelId = levelId;
        this.operator = operator;
    }
    getType() {
        return RequirementType_1.RequirementType.LevelId;
    }
    toString() {
        return `LevelIdRequirement: ${this.operator} ${this.levelId}`;
    }
    static fromObject(obj) {
        if (typeof (obj === null || obj === void 0 ? void 0 : obj.levelId) !== 'string') {
            throw new Error("LevelIdRequirement: 'levelId' must be a string");
        }
        if (!(obj === null || obj === void 0 ? void 0 : obj.operator)) {
            throw new Error("LevelIdRequirement: 'operator' is required");
        }
        // Validate operator
        const operator = obj === null || obj === void 0 ? void 0 : obj.operator;
        if (!Object.values(LevelIdComparisonOperator).includes(operator)) {
            throw new Error(`LevelIdRequirement: Invalid operator '${operator}'`);
        }
        return new LevelIdRequirement(RequirementType_1.RequirementType.LevelId, obj === null || obj === void 0 ? void 0 : obj.levelId, operator);
    }
}
exports.LevelIdRequirement = LevelIdRequirement;
var LevelIdComparisonOperator;
(function (LevelIdComparisonOperator) {
    LevelIdComparisonOperator["complete"] = "complete";
    LevelIdComparisonOperator["incomplete"] = "incomplete";
    LevelIdComparisonOperator["isNext"] = "isNext";
})(LevelIdComparisonOperator = exports.LevelIdComparisonOperator || (exports.LevelIdComparisonOperator = {}));
