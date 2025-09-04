"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropHasTagInNodeRequirement = void 0;
const Requirement_1 = require("./Requirement");
const RequirementType_1 = require("./RequirementType");
class PropHasTagInNodeRequirement extends Requirement_1.Requirement {
    constructor(requirementType, tag, nodeId) {
        super(requirementType);
        this.tag = tag;
        this.nodeId = nodeId;
    }
    getType() {
        return RequirementType_1.RequirementType.PropHasTagInNode;
    }
    toString() {
        return `PropaHasTagInNodeRequirement: Tag[${this.tag}] should be on prop in Node[${this.nodeId}]`;
    }
    static fromObject(obj) {
        if (!(obj === null || obj === void 0 ? void 0 : obj.tag)) {
            throw new Error("PropaHasTagInNodeRequirement: 'tag' is required");
        }
        if (!(obj === null || obj === void 0 ? void 0 : obj.nodeId)) {
            throw new Error("PropaHasTagInNodeRequirement: 'nodeId' is required");
        }
        return new PropHasTagInNodeRequirement(RequirementType_1.RequirementType.PropHasTagInNode, obj === null || obj === void 0 ? void 0 : obj.tag, obj === null || obj === void 0 ? void 0 : obj.nodeId);
    }
}
exports.PropHasTagInNodeRequirement = PropHasTagInNodeRequirement;
