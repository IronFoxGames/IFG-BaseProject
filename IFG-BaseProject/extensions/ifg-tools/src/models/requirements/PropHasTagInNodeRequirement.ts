import { Requirement } from './Requirement';
import { RequirementType } from './RequirementType';

export class PropHasTagInNodeRequirement extends Requirement {
    public tag: string;
    public nodeId: string;

    constructor(requirementType: RequirementType, tag: string, nodeId: string) {
        super(requirementType);
        this.tag = tag;
        this.nodeId = nodeId;
    }
    public getType(): RequirementType {
        return RequirementType.PropHasTagInNode;
    }

    public toString(): string {
        return `PropaHasTagInNodeRequirement: Tag[${this.tag}] should be on prop in Node[${this.nodeId}]`;
    }

    public static fromObject(obj: any): PropHasTagInNodeRequirement {
        if (!obj?.tag) {
            throw new Error("PropaHasTagInNodeRequirement: 'tag' is required");
        }

        if (!obj?.nodeId) {
            throw new Error("PropaHasTagInNodeRequirement: 'nodeId' is required");
        }

        return new PropHasTagInNodeRequirement(RequirementType.PropHasTagInNode, obj?.tag, obj?.nodeId);
    }
}
