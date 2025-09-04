"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogueOperator = exports.DialogueRequirement = void 0;
const Requirement_1 = require("./Requirement");
const RequirementType_1 = require("./RequirementType");
class DialogueRequirement extends Requirement_1.Requirement {
    constructor(requirementType, dialogueId, operator) {
        super(requirementType);
        this.dialogueId = dialogueId;
        this.operator = operator;
    }
    getType() {
        return RequirementType_1.RequirementType.Dialogue;
    }
    toString() {
        return this.operator === DialogueOperator.hasSeen
            ? `DialogueRequirement: Has Seen ${this.dialogueId}`
            : `DialogueRequirement: Has Not Seen ${this.dialogueId}`;
    }
    static fromObject(obj) {
        if (!(obj === null || obj === void 0 ? void 0 : obj.dialogueId)) {
            throw new Error("DialogueRequirement: 'dialogueId' is required");
        }
        if (!(obj === null || obj === void 0 ? void 0 : obj.operator)) {
            throw new Error("DialogueRequirement: 'operator' is required");
        }
        const operator = obj === null || obj === void 0 ? void 0 : obj.operator;
        // Validate operator
        if (!Object.values(DialogueOperator).includes(operator)) {
            throw new Error(`DialogueRequirement: Invalid operator '${operator}'`);
        }
        return new DialogueRequirement(RequirementType_1.RequirementType.Dialogue, obj === null || obj === void 0 ? void 0 : obj.dialogueId, operator);
    }
}
exports.DialogueRequirement = DialogueRequirement;
var DialogueOperator;
(function (DialogueOperator) {
    DialogueOperator["hasSeen"] = "hasSeen";
    DialogueOperator["hasNotSeen"] = "hasNotSeen";
})(DialogueOperator = exports.DialogueOperator || (exports.DialogueOperator = {}));
