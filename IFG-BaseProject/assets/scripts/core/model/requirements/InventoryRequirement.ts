import { Requirement } from './Requirement';
import { RequirementType } from './RequirementType';
import { ComparisonOperator } from './ComparisonOperator';

export class InventoryRequirement extends Requirement {
    public itemId: string;
    public itemCount: number;
    public operator: ComparisonOperator;

    constructor(requirementType: RequirementType, itemId: string, itemCount: number, operator: ComparisonOperator) {
        super(requirementType);
        this.itemId = itemId;
        this.itemCount = itemCount;
        this.operator = operator;
    }

    getType(): RequirementType {
        return RequirementType.Inventory;
    }

    toString(): string {
        return `InventoryRequirement: Item[${this.itemId}] count ${this.operator} ${this.itemCount}`;
    }

    static fromObject(obj: any): InventoryRequirement {
        if (!obj?.itemId) {
            throw new Error("InventoryRequirement: 'itemId' is required");
        }

        if (typeof obj?.itemCount !== 'number') {
            throw new Error("InventoryRequirement: 'itemCount' must be a number");
        }

        if (!obj?.operator) {
            throw new Error("InventoryRequirement: 'operator' is required");
        }

        const operator = obj?.operator as ComparisonOperator;

        if (!Object.values(ComparisonOperator).includes(operator)) {
            throw new Error(`InventoryRequirement: Invalid operator '${operator}'`);
        }

        return new InventoryRequirement(RequirementType.Inventory, obj?.itemId, obj?.itemCount, operator);
    }
}
