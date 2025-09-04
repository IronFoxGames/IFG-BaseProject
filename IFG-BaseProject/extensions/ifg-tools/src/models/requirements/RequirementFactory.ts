import { Requirement } from './Requirement';
import { DateRequirement } from './DateRequirement';
import { InventoryRequirement } from './InventoryRequirement';
import { DialogueRequirement } from './DialogueRequirement';
import { LevelRequirement } from './LevelRequirement';
import { LevelIdRequirement } from './LevelIdRequirement';
import { PropInNodeRequirement } from './PropInNodeRequirement';
import { PropHasTagInNodeRequirement } from './PropHasTagInNodeRequirement';
import { ChapterCompleteRequirement } from './ChapterCompleteRequirement';
import { TaskCompleteRequirement } from './TaskCompleteRequirement';
import { RequirementType } from './RequirementType';
import { AccountRequirement } from './AccountRequirement';
import { TutorialRequirement } from './TutorialRequirement';
import { QuickPlaySessionsRequirement } from './QuickPlaySessionsRequirement';

export class RequirementFactory {
    static fromObject(obj: any): Requirement {
        // The 'requirementData' sub-object is no longer required, but support it until we clean up all data
        const reqRoot = obj.requirementData ?? obj;

        if (!reqRoot) {
            throw new Error('Missing requirement root object');
        }

        if (!reqRoot.requirementType) {
            throw new Error('Missing requirement type field in requirement data');
        }

        let requirement = null;
        try {
            switch (reqRoot.requirementType) {
                case RequirementType.Date:
                    requirement = DateRequirement.fromObject(reqRoot);
                    break;
                case RequirementType.Level:
                    requirement = LevelRequirement.fromObject(reqRoot);
                    break;
                case RequirementType.LevelId:
                    requirement = LevelIdRequirement.fromObject(reqRoot);
                    break;
                case RequirementType.Inventory:
                    requirement = InventoryRequirement.fromObject(reqRoot);
                    break;
                case RequirementType.Dialogue:
                    requirement = DialogueRequirement.fromObject(reqRoot);
                    break;
                case RequirementType.PropInNode:
                    requirement = PropInNodeRequirement.fromObject(reqRoot);
                    break;
                case RequirementType.PropHasTagInNode:
                    requirement = PropHasTagInNodeRequirement.fromObject(reqRoot);
                    break;
                case RequirementType.ChapterComplete:
                    requirement = ChapterCompleteRequirement.fromObject(reqRoot);
                    break;
                case RequirementType.TaskComplete:
                    requirement = TaskCompleteRequirement.fromObject(reqRoot);
                    break;
                case RequirementType.AccountRequirement:
                    requirement = AccountRequirement.fromObject(reqRoot);
                    break;
                case RequirementType.Tutorial:
                    requirement = TutorialRequirement.fromObject(reqRoot);
                    break;
                case RequirementType.QuickPlaySessions:
                    requirement = QuickPlaySessionsRequirement.fromObject(reqRoot);
                    break;
                default:
                    throw new Error(`Unknown requirement type: ${reqRoot.requirementType}`);
            }
        } catch (err) {
            throw new Error(`Failed to parse requirement data with err = ${err}`);
        }

        return requirement;
    }
}
