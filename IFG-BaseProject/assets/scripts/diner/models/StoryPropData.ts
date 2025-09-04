import { Requirement } from '../../core/model/requirements/Requirement';
import { RequirementFactory } from '../../core/model/requirements/RequirementFactory';

export class StoryPropData {
    public id: string = '';
    public visibleUntilRequirments: Requirement[];
    public visibleAfterRequirments: Requirement[];

    public static fromObject(obj: any): StoryPropData {
        const storyPropData = new StoryPropData();

        storyPropData.id = obj.id;

        if (Array.isArray(obj.visibleUntilRequirments)) {
            storyPropData.visibleUntilRequirments = obj.visibleUntilRequirments.map((o: any) => RequirementFactory.fromObject(o));
        }

        if (Array.isArray(obj.visibleAfterRequirments)) {
            storyPropData.visibleAfterRequirments = obj.visibleAfterRequirments.map((o: any) => RequirementFactory.fromObject(o));
        }

        return storyPropData;
    }
}
