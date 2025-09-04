import { Requirement } from '../../core/model/requirements/Requirement';
import { RequirementFactory } from '../../core/model/requirements/RequirementFactory';

export class PropData {
    public id: string = '';
    public tags: string[] = [];
    public requirements: Requirement[] = [];
    public visibilityRequirements: Requirement[] = [];
    public assetFilePath: string;
    public thumbnailFilePath: string;

    public static fromObject(obj: any): PropData {
        const prop = new PropData();

        prop.id = obj.id;

        if (Array.isArray(obj.tags)) {
            prop.tags = obj.tags;
        }

        if (Array.isArray(obj.requirements)) {
            prop.requirements = obj.requirements.map((o: any) => RequirementFactory.fromObject(o));
        }

        if (Array.isArray(obj.visibilityRequirements)) {
            prop.visibilityRequirements = obj.visibilityRequirements.map((o: any) => RequirementFactory.fromObject(o));
        }

        prop.assetFilePath = obj.assetFilePath;

        prop.thumbnailFilePath = obj.thumbnailFilePath;

        return prop;
    }

    public static validateProp(propTags: string[], nodeTags: string[]): boolean {
        return nodeTags.every((v) => propTags.includes(v));
    }
}
