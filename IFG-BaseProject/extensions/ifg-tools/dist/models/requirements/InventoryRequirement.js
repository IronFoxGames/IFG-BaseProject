"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryRequirement = void 0;
const Requirement_1 = require("./Requirement");
const RequirementType_1 = require("./RequirementType");
const ComparisonOperator_1 = require("./ComparisonOperator");
class InventoryRequirement extends Requirement_1.Requirement {
    constructor(requirementType, itemId, itemCount, operator) {
        super(requirementType);
        this.itemId = itemId;
        this.itemCount = itemCount;
        this.operator = operator;
    }
    getType() {
        return RequirementType_1.RequirementType.Inventory;
    }
    toString() {
        return `InventoryRequirement: Item[${this.itemId}] count ${this.operator} ${this.itemCount}`;
    }
    static fromObject(obj) {
        if (!(obj === null || obj === void 0 ? void 0 : obj.itemId)) {
            throw new Error("InventoryRequirement: 'itemId' is required");
        }
        if (typeof (obj === null || obj === void 0 ? void 0 : obj.itemCount) !== 'number') {
            throw new Error("InventoryRequirement: 'itemCount' must be a number");
        }
        if (!(obj === null || obj === void 0 ? void 0 : obj.operator)) {
            throw new Error("InventoryRequirement: 'operator' is required");
        }
        const operator = obj === null || obj === void 0 ? void 0 : obj.operator;
        if (!Object.values(ComparisonOperator_1.ComparisonOperator).includes(operator)) {
            throw new Error(`InventoryRequirement: Invalid operator '${operator}'`);
        }
        return new InventoryRequirement(RequirementType_1.RequirementType.Inventory, obj === null || obj === void 0 ? void 0 : obj.itemId, obj === null || obj === void 0 ? void 0 : obj.itemCount, operator);
    }
}
exports.InventoryRequirement = InventoryRequirement;
