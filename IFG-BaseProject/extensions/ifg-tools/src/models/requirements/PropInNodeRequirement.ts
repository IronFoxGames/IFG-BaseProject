import { Requirement } from './Requirement';
import { StringComparisonOperator } from './StringComparisonOperator';
import { RequirementType } from './RequirementType';

export class PropInNodeRequirement extends Requirement {
    public propId: string;
    public nodeId: string;
    public operator: StringComparisonOperator;

    constructor(requirementType: RequirementType, propId: string, nodeId: string, operator: StringComparisonOperator) {
        super(requirementType);
        this.propId = propId;
        this.nodeId = nodeId;
        this.operator = operator;
    }

    public getType(): RequirementType {
        return RequirementType.PropInNode;
    }

    public toString(): string {
        return `PropInNodeRequirement: Prop[${this.propId}] should ${this.operator} prop in Node[${this.nodeId}]`;
    }

    public static fromObject(obj: any): PropInNodeRequirement {
        if (!obj?.propId) {
            throw new Error("PropInNodeRequirement: 'propId' is required");
        }

        if (!obj?.nodeId) {
            throw new Error("PropInNodeRequirement: 'nodeId' is required");
        }

        if (!obj?.operator) {
            throw new Error("PropInNodeRequirement: 'operator' is required");
        }

        const operator = obj?.operator as StringComparisonOperator;

        if (!Object.values(StringComparisonOperator).includes(operator)) {
            throw new Error(`PropInNodeRequirement: Invalid operator '${operator}'`);
        }

        return new PropInNodeRequirement(RequirementType.PropInNode, obj?.propId, obj?.nodeId, operator);
    }
}
