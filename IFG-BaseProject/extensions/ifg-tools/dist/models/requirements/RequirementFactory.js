"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirementFactory = void 0;
const DateRequirement_1 = require("./DateRequirement");
const InventoryRequirement_1 = require("./InventoryRequirement");
const DialogueRequirement_1 = require("./DialogueRequirement");
const LevelRequirement_1 = require("./LevelRequirement");
const LevelIdRequirement_1 = require("./LevelIdRequirement");
const PropInNodeRequirement_1 = require("./PropInNodeRequirement");
const PropHasTagInNodeRequirement_1 = require("./PropHasTagInNodeRequirement");
const ChapterCompleteRequirement_1 = require("./ChapterCompleteRequirement");
const TaskCompleteRequirement_1 = require("./TaskCompleteRequirement");
const RequirementType_1 = require("./RequirementType");
const AccountRequirement_1 = require("./AccountRequirement");
const TutorialRequirement_1 = require("./TutorialRequirement");
const QuickPlaySessionsRequirement_1 = require("./QuickPlaySessionsRequirement");
class RequirementFactory {
    static fromObject(obj) {
        var _a;
        // The 'requirementData' sub-object is no longer required, but support it until we clean up all data
        const reqRoot = (_a = obj.requirementData) !== null && _a !== void 0 ? _a : obj;
        if (!reqRoot) {
            throw new Error('Missing requirement root object');
        }
        if (!reqRoot.requirementType) {
            throw new Error('Missing requirement type field in requirement data');
        }
        let requirement = null;
        try {
            switch (reqRoot.requirementType) {
                case RequirementType_1.RequirementType.Date:
                    requirement = DateRequirement_1.DateRequirement.fromObject(reqRoot);
                    break;
                case RequirementType_1.RequirementType.Level:
                    requirement = LevelRequirement_1.LevelRequirement.fromObject(reqRoot);
                    break;
                case RequirementType_1.RequirementType.LevelId:
                    requirement = LevelIdRequirement_1.LevelIdRequirement.fromObject(reqRoot);
                    break;
                case RequirementType_1.RequirementType.Inventory:
                    requirement = InventoryRequirement_1.InventoryRequirement.fromObject(reqRoot);
                    break;
                case RequirementType_1.RequirementType.Dialogue:
                    requirement = DialogueRequirement_1.DialogueRequirement.fromObject(reqRoot);
                    break;
                case RequirementType_1.RequirementType.PropInNode:
                    requirement = PropInNodeRequirement_1.PropInNodeRequirement.fromObject(reqRoot);
                    break;
                case RequirementType_1.RequirementType.PropHasTagInNode:
                    requirement = PropHasTagInNodeRequirement_1.PropHasTagInNodeRequirement.fromObject(reqRoot);
                    break;
                case RequirementType_1.RequirementType.ChapterComplete:
                    requirement = ChapterCompleteRequirement_1.ChapterCompleteRequirement.fromObject(reqRoot);
                    break;
                case RequirementType_1.RequirementType.TaskComplete:
                    requirement = TaskCompleteRequirement_1.TaskCompleteRequirement.fromObject(reqRoot);
                    break;
                case RequirementType_1.RequirementType.AccountRequirement:
                    requirement = AccountRequirement_1.AccountRequirement.fromObject(reqRoot);
                    break;
                case RequirementType_1.RequirementType.Tutorial:
                    requirement = TutorialRequirement_1.TutorialRequirement.fromObject(reqRoot);
                    break;
                case RequirementType_1.RequirementType.QuickPlaySessions:
                    requirement = QuickPlaySessionsRequirement_1.QuickPlaySessionsRequirement.fromObject(reqRoot);
                    break;
                default:
                    throw new Error(`Unknown requirement type: ${reqRoot.requirementType}`);
            }
        }
        catch (err) {
            throw new Error(`Failed to parse requirement data with err = ${err}`);
        }
        return requirement;
    }
}
exports.RequirementFactory = RequirementFactory;
