import { EntitlementType } from '../core/enums/EntitlementType';
import { AccountRequirement } from '../core/model/requirements/AccountRequirement';
import { ChapterCompleteRequirement } from '../core/model/requirements/ChapterCompleteRequirement';
import { compare as compareNumbers, ComparisonOperator } from '../core/model/requirements/ComparisonOperator';
import { DateOperator, DateRequirement } from '../core/model/requirements/DateRequirement';
import { DialogueOperator, DialogueRequirement } from '../core/model/requirements/DialogueRequirement';
import { InventoryRequirement } from '../core/model/requirements/InventoryRequirement';
import { LevelIdComparisonOperator, LevelIdRequirement } from '../core/model/requirements/LevelIdRequirement';
import { LevelRequirement } from '../core/model/requirements/LevelRequirement';
import { PropHasTagInNodeRequirement } from '../core/model/requirements/PropHasTagInNodeRequirement';
import { PropInNodeRequirement } from '../core/model/requirements/PropInNodeRequirement';
import { QuickPlaySessionsRequirement } from '../core/model/requirements/QuickPlaySessionsRequirement';
import { Requirement } from '../core/model/requirements/Requirement';
import { RequirementType } from '../core/model/requirements/RequirementType';
import { compare as compareStrings } from '../core/model/requirements/StringComparisonOperator';
import { TaskCompleteRequirement } from '../core/model/requirements/TaskCompleteRequirement';
import { TutorialOperator, TutorialRequirement } from '../core/model/requirements/TutorialRequirement';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { IDinerService } from '../services/IDinerService';
import { Logger } from '../slog';

export class RequirementEval {
    static isMet(requirement: Requirement, gameService: ICardScrambleService, dinerService: IDinerService, logger: Logger): boolean {
        if (!requirement) {
            return false;
        }

        let isMet = false;

        switch (requirement.getType()) {
            case RequirementType.Date:
                isMet = this._evalDateRequirement(requirement as DateRequirement, gameService, dinerService, logger);
                break;
            case RequirementType.Level:
                isMet = this._evalLevelRequirement(requirement as LevelRequirement, gameService, dinerService);
                break;
            case RequirementType.LevelId:
                isMet = this._evalLevelIdRequirement(requirement as LevelIdRequirement, gameService, dinerService);
                break;
            case RequirementType.Inventory:
                isMet = this._evalInventoryRequirement(requirement as InventoryRequirement, gameService, dinerService);
                break;
            case RequirementType.Dialogue:
                isMet = this._evalDialogueRequirement(requirement as DialogueRequirement, gameService, dinerService);
                break;
            case RequirementType.PropInNode:
                isMet = this._evalPropInNodeRequirement(requirement as PropInNodeRequirement, gameService, dinerService);
                break;
            case RequirementType.PropHasTagInNode:
                isMet = this._evalPropHasTagInNodeRequirement(requirement as PropHasTagInNodeRequirement, gameService, dinerService);
                break;
            case RequirementType.ChapterComplete:
                isMet = this._evalChapterCompleteRequirement(requirement as ChapterCompleteRequirement, gameService, dinerService);
                break;
            case RequirementType.TaskComplete:
                isMet = this._evalTaskCompleteRequirement(requirement as TaskCompleteRequirement, gameService, dinerService);
                break;
            case RequirementType.AccountRequirement:
                isMet = this._evalAccountRequirement(requirement as AccountRequirement, gameService, dinerService);
                break;
            case RequirementType.Tutorial:
                isMet = this._evalTutorialRequirement(requirement as TutorialRequirement, gameService, dinerService);
                break;
            case RequirementType.QuickPlaySessions:
                isMet = this._evalQuickPlaySessionsRequirement(requirement as QuickPlaySessionsRequirement, gameService, dinerService);
                break;
            default:
                logger.warn('RequirementEval: Unknown Requirement Type: ', { req: requirement });
                return false;
        }

        return isMet;
    }

    private static _evalDateRequirement(
        req: DateRequirement,
        gameService: ICardScrambleService,
        dinerService: IDinerService,
        logger: Logger
    ): boolean {
        const now = new Date();

        switch (req.operator) {
            case DateOperator.before:
                return now < req.date;
            case DateOperator.after:
                return now > req.date;
            case DateOperator.inRange:
                if (!req.endDate) {
                    logger.warn('RequirementEval._evalDateRequirement: Date in range requirement missing end date', { req: req });
                    return false;
                }
                return now >= req.date && now < req.endDate;
            default:
                logger.warn('RequirementEval._evalDateRequirement: Date requirement unknown operator', { req: req });
        }

        return false;
    }

    private static _evalLevelRequirement(req: LevelRequirement, gameService: ICardScrambleService, dinerService: IDinerService) {
        const highestLevelCompleted = gameService.getHighestPuzzleCompleted();
        return compareNumbers(req.operator, highestLevelCompleted, req.level);
    }

    private static _evalLevelIdRequirement(req: LevelIdRequirement, gameService: ICardScrambleService, dinerService: IDinerService) {
        switch (req.operator) {
            case LevelIdComparisonOperator.complete:
                return gameService.isPuzzleCompletedById(req.levelId);
            case LevelIdComparisonOperator.incomplete:
                return !gameService.isPuzzleCompletedById(req.levelId);
            case LevelIdComparisonOperator.isNext: {
                const nextPuzzle = gameService.getNextPuzzle();
                if (nextPuzzle?.id === req.levelId) {
                    return true;
                }
                return false;
            }
        }
        return false;
    }

    private static _evalInventoryRequirement(req: InventoryRequirement, gameService: ICardScrambleService, dinerService: IDinerService) {
        const countInInventory = gameService.getItemCountInInventory(req.itemId);
        return compareNumbers(req.operator, countInInventory, req.itemCount);
    }

    private static _evalDialogueRequirement(req: DialogueRequirement, gameService: ICardScrambleService, dinerService: IDinerService): boolean {
        return req.operator === DialogueOperator.hasSeen
            ? gameService.hasDialogueBeenSeen(req.dialogueId)
            : !gameService.hasDialogueBeenSeen(req.dialogueId);
    }

    private static _evalPropInNodeRequirement(req: PropInNodeRequirement, gameService: ICardScrambleService, dinerService: IDinerService) {
        const placedPropId = dinerService.getPropIdInNode(req.nodeId);
        return compareStrings(req.operator, req.propId, placedPropId);
    }

    private static _evalPropHasTagInNodeRequirement(
        req: PropHasTagInNodeRequirement,
        gameService: ICardScrambleService,
        dinerService: IDinerService
    ) {
        return dinerService.isPropTaggedInNode(req.tag, req.nodeId);
    }

    private static _evalChapterCompleteRequirement(
        req: ChapterCompleteRequirement,
        gameService: ICardScrambleService,
        dinerService: IDinerService
    ) {
        return gameService.getChapterCompleted(req.chapterId, dinerService.getTaskConfig());
    }

    private static _evalTaskCompleteRequirement(req: TaskCompleteRequirement, gameService: ICardScrambleService, dinerService: IDinerService) {
        const task = dinerService.getTaskConfig().getTask(req.taskId);
        if (!task) {
            return false;
        }
        return gameService.getTaskCompleted(task.data.id, task.data.completionCount);
    }

    private static _evalAccountRequirement(req: AccountRequirement, gameService: ICardScrambleService, dinerService: IDinerService) {
        const entitlement = gameService.getUserEntitlement();

        switch (req.operator) {
            case ComparisonOperator.equal:
                return entitlement === req.entitlement;
            case ComparisonOperator.notEqual:
                return entitlement !== req.entitlement;
            case ComparisonOperator.lessThan:
                switch (req.entitlement) {
                    case EntitlementType.Guest:
                        return false; // Nothing is less than Guest
                    case EntitlementType.Free:
                        return entitlement === EntitlementType.Guest; // Guest is less than Free
                    case EntitlementType.Premium:
                        return entitlement === EntitlementType.Guest || entitlement === EntitlementType.Free; // Guest and Free are less than Premium
                }
                return false;
            case ComparisonOperator.lessThanEqual:
                switch (req.entitlement) {
                    case EntitlementType.Guest:
                        return entitlement === EntitlementType.Guest;
                    case EntitlementType.Free:
                        return entitlement === EntitlementType.Guest || entitlement === EntitlementType.Free;
                    case EntitlementType.Premium:
                        return true;
                }
                return false;
            case ComparisonOperator.greaterThan:
                switch (req.entitlement) {
                    case EntitlementType.Guest:
                        return entitlement === EntitlementType.Free || entitlement === EntitlementType.Premium;
                    case EntitlementType.Free:
                        return entitlement === EntitlementType.Premium;
                    case EntitlementType.Premium:
                        return false;
                }
                return false;
            case ComparisonOperator.greaterThanEqual:
                switch (req.entitlement) {
                    case EntitlementType.Guest:
                        return true;
                    case EntitlementType.Free:
                        return entitlement === EntitlementType.Free || entitlement === EntitlementType.Premium;
                    case EntitlementType.Premium:
                        return entitlement === EntitlementType.Premium;
                }
                return false;
        }
        return false;
    }

    private static _evalTutorialRequirement(req: TutorialRequirement, gameService: ICardScrambleService, dinerService: IDinerService): boolean {
        return req.operator === TutorialOperator.hasSeen
            ? gameService.getTutorialStep(req.tutorialId)
            : !gameService.getTutorialStep(req.tutorialId);
    }

    private static _evalQuickPlaySessionsRequirement(
        req: QuickPlaySessionsRequirement,
        gameService: ICardScrambleService,
        dinerService: IDinerService
    ) {
        const playCount = gameService.getQuickPlaySaveData()?.playCount ?? 0;
        return compareNumbers(req.operator, playCount, req.playCount);
    }
}
