"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropInNodeRequirement = void 0;
const Requirement_1 = require("./Requirement");
const StringComparisonOperator_1 = require("./StringComparisonOperator");
const RequirementType_1 = require("./RequirementType");
class PropInNodeRequirement extends Requirement_1.Requirement {
    constructor(requirementType, propId, nodeId, operator) {
        super(requirementType);
        this.propId = propId;
        this.nodeId = nodeId;
        this.operator = operator;
    }
    getType() {
        return RequirementType_1.RequirementType.PropInNode;
    }
    toString() {
        return `PropInNodeRequirement: Prop[${this.propId}] should ${this.operator} prop in Node[${this.nodeId}]`;
    }
    static fromObject(obj) {
        if (!(obj === null || obj === void 0 ? void 0 : obj.propId)) {
            throw new Error("PropInNodeRequirement: 'propId' is required");
        }
        if (!(obj === null || obj === void 0 ? void 0 : obj.nodeId)) {
            throw new Error("PropInNodeRequirement: 'nodeId' is required");
        }
        if (!(obj === null || obj === void 0 ? void 0 : obj.operator)) {
            throw new Error("PropInNodeRequirement: 'operator' is required");
        }
        const operator = obj === null || obj === void 0 ? void 0 : obj.operator;
        if (!Object.values(StringComparisonOperator_1.StringComparisonOperator).includes(operator)) {
            throw new Error(`PropInNodeRequirement: Invalid operator '${operator}'`);
        }
        return new PropInNodeRequirement(RequirementType_1.RequirementType.PropInNode, obj === null || obj === void 0 ? void 0 : obj.propId, obj === null || obj === void 0 ? void 0 : obj.nodeId, operator);
    }
}
exports.PropInNodeRequirement = PropInNodeRequirement;
