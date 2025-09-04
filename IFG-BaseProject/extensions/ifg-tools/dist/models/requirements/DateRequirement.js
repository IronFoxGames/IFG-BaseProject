"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateOperator = exports.DateRequirement = void 0;
const RequirementType_1 = require("./RequirementType");
const Requirement_1 = require("./Requirement");
class DateRequirement extends Requirement_1.Requirement {
    constructor(requirementType, date, endDate, operator) {
        super(requirementType);
        this.date = date;
        this.endDate = endDate;
        this.operator = operator;
    }
    getType() {
        return RequirementType_1.RequirementType.Date;
    }
    toString() {
        const base = `DateRequirement: ${this.operator} ${this.date.toISOString()}`;
        return this.operator === DateOperator.inRange && this.endDate ? `${base} and before ${this.endDate.toISOString()}` : base;
    }
    static fromObject(obj) {
        if (!(obj === null || obj === void 0 ? void 0 : obj.date)) {
            throw new Error("DateRequirement: 'date' field is required");
        }
        if (!(obj === null || obj === void 0 ? void 0 : obj.operator)) {
            throw new Error("DateRequirement: 'operator' field is required");
        }
        const date = new Date(obj === null || obj === void 0 ? void 0 : obj.date);
        const operator = obj === null || obj === void 0 ? void 0 : obj.operator;
        // Validate operator
        if (!Object.values(DateOperator).includes(operator)) {
            throw new Error(`DateRequirement: Invalid operator '${operator}'`);
        }
        // Parse optional endDate for inRange operator
        const endDate = (obj === null || obj === void 0 ? void 0 : obj.endDate) ? new Date(obj === null || obj === void 0 ? void 0 : obj.endDate) : null;
        // Validate endDate if operator is inRange
        if (operator === DateOperator.inRange && !endDate) {
            throw new Error("DateRequirement: 'endDate' is required for 'inRange' operator");
        }
        return new DateRequirement(RequirementType_1.RequirementType.Date, date, endDate, operator);
    }
}
exports.DateRequirement = DateRequirement;
var DateOperator;
(function (DateOperator) {
    DateOperator["before"] = "before";
    DateOperator["after"] = "after";
    DateOperator["inRange"] = "inRange";
})(DateOperator = exports.DateOperator || (exports.DateOperator = {}));
