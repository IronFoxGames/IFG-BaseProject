"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorialOperator = exports.TutorialRequirement = void 0;
const Requirement_1 = require("./Requirement");
const RequirementType_1 = require("./RequirementType");
class TutorialRequirement extends Requirement_1.Requirement {
    constructor(requirementType, tutorialId, operator) {
        super(requirementType);
        this.tutorialId = tutorialId;
        this.operator = operator;
    }
    getType() {
        return RequirementType_1.RequirementType.Tutorial;
    }
    toString() {
        return this.operator === TutorialOperator.hasSeen
            ? `TutorialRequirement: Has Seen ${this.tutorialId}`
            : `TutorialRequirement: Has Not Seen ${this.tutorialId}`;
    }
    static fromObject(obj) {
        if (!(obj === null || obj === void 0 ? void 0 : obj.tutorialId)) {
            throw new Error("TutorialRequirement: 'tutorialId' is required");
        }
        if (!(obj === null || obj === void 0 ? void 0 : obj.operator)) {
            throw new Error("TutorialRequirement: 'operator' is required");
        }
        const operator = obj === null || obj === void 0 ? void 0 : obj.operator;
        // Validate operator
        if (!Object.values(TutorialOperator).includes(operator)) {
            throw new Error(`TutorialRequirement: Invalid operator '${operator}'`);
        }
        return new TutorialRequirement(RequirementType_1.RequirementType.Tutorial, obj === null || obj === void 0 ? void 0 : obj.tutorialId, operator);
    }
}
exports.TutorialRequirement = TutorialRequirement;
var TutorialOperator;
(function (TutorialOperator) {
    TutorialOperator["hasSeen"] = "hasSeen";
    TutorialOperator["hasNotSeen"] = "hasNotSeen";
})(TutorialOperator = exports.TutorialOperator || (exports.TutorialOperator = {}));
