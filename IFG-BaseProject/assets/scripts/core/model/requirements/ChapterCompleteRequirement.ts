import { Requirement } from './Requirement';
import { RequirementType } from './RequirementType';

export class ChapterCompleteRequirement extends Requirement {
    public chapterId: string;

    constructor(requirementType: RequirementType, chapterId: string) {
        super(requirementType);
        this.chapterId = chapterId;
    }

    public getType(): RequirementType {
        return RequirementType.ChapterComplete;
    }

    public toString(): string {
        return `ChapterCompleteRequirement: Chapter[${this.chapterId}] should have all of its tasks completed.`;
    }

    public static fromObject(obj: any): ChapterCompleteRequirement {
        if (!obj?.chapterId) {
            throw new Error("ChapterCompleteRequirement: 'chapterId' is required");
        }

        return new ChapterCompleteRequirement(RequirementType.ChapterComplete, obj.chapterId);
    }
}
