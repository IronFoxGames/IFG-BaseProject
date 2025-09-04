"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChapterCompleteRequirement = void 0;
const Requirement_1 = require("./Requirement");
const RequirementType_1 = require("./RequirementType");
class ChapterCompleteRequirement extends Requirement_1.Requirement {
    constructor(requirementType, chapterId) {
        super(requirementType);
        this.chapterId = chapterId;
    }
    getType() {
        return RequirementType_1.RequirementType.ChapterComplete;
    }
    toString() {
        return `ChapterCompleteRequirement: Chapter[${this.chapterId}] should have all of its tasks completed.`;
    }
    static fromObject(obj) {
        if (!(obj === null || obj === void 0 ? void 0 : obj.chapterId)) {
            throw new Error("ChapterCompleteRequirement: 'chapterId' is required");
        }
        return new ChapterCompleteRequirement(RequirementType_1.RequirementType.ChapterComplete, obj.chapterId);
    }
}
exports.ChapterCompleteRequirement = ChapterCompleteRequirement;
