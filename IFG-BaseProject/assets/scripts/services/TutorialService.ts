import { JsonAsset, resources } from 'cc';
import { AppConfig } from '../config/AppConfig';
import { HandClassification } from '../core/model/HandClassification';
import { Requirement } from '../core/model/requirements/Requirement';
import { RequirementFactory } from '../core/model/requirements/RequirementFactory';
import { logger } from '../logging';
import { GameState } from '../state/StateMachine';
import { ICardScrambleService } from './ICardScrambleService';
import { RequirementsService } from './RequirementsService';
import { UIOverlayService } from './UIOverlayService';

export enum TutorialTriggerType {
    none = 'none',
    onStateChange = 'onStateEnter',
    onGameStart = 'onGameStart',
    onHandPlaced = 'onHandPlaced',
    onCardPlaced = 'onCardPlaced',
    onHandSubmitted = 'onHandSubmitted',
    onHandScoreTallied = 'onHandScoreTallied',
    onMenuOpened = 'onMenuOpened',
    onDialogue = 'onDialogue'
}
export enum TutorialStepType {
    overlay = 'overlay',
    dragInstructor = 'dragInstructor'
}

export class TutorialTrigger {
    public type: TutorialTriggerType = TutorialTriggerType.none;
    public state: GameState = GameState.None;
    public puzzle: string | null = null;
    public hand: number = -1;
    public menuId: string | null = null;
    public dialogueId: string | null = null;
    public handName: string | null = null;
}

export class TutorialMessage {
    public trigger: TutorialTrigger;
    public stepType: TutorialStepType = TutorialStepType.overlay;
    public requirements: Requirement[] = [];
    public id: string;
    public title: string;
    public message: string | null;
    public image: string | null;
    public characterTutorial: boolean = false;
    public characterSpritePath: string | null = null;
    public lightboxShape: TutorialScrimShape = TutorialScrimShape.Full;
    public lightboxDelay: number = 0;
    public cursorAlignment: TutorialCursorAlignment = TutorialCursorAlignment.None;
    public lightboxTarget: string | null;
    public stepAdvance: TutorialStepAdvance;
    public hasFollowup: boolean;
    public triggerSave: boolean;
    public messageOffsetX: number;
    public messageOffsetY: number;
    public dragInstructorCardSlotStart: number;
    public dragInstructorBoardTileIndexTarget: number;
}

export enum TutorialScrimShape {
    Full = 'full', // Full screen scrim
    CurvedRectangle = 'curved-rectangle', // Curved rectangle lightbox around target
    Rectangle = 'rectangle', // Rectange lightbox around target
    Ellipse = 'ellipse' // Ellipse lightbox around target
}

export enum TutorialCursorAlignment {
    None = 'none', // No cursor
    Left = 'left', // Cursor left of control (pointing right)
    Right = 'right', // Cursor right of control (pointing left)
    Top = 'top', // Cursor top of control (pointing down)
    Bottom = 'bottom' // Cursor below control (pointing up)
}

export enum TutorialStepAdvance {
    OkButton = 'ok',
    ControlInteraction = 'control-interaction'
}

export class TutorialService {
    private _config: AppConfig = null;
    private _uiOverlayService: UIOverlayService = null;
    private _cardScrambleService: ICardScrambleService = null;
    private _requirementsService: RequirementsService = null;
    private _tutorialMessages: TutorialMessage[] = [];
    private _log = logger.child('TutorialService');

    public async initialize(
        config: AppConfig,
        cardScrambleService: ICardScrambleService,
        requirementsService: RequirementsService,
        uiOverlayService: UIOverlayService
    ): Promise<void> {
        this._config = config;
        this._cardScrambleService = cardScrambleService;
        this._requirementsService = requirementsService;
        this._uiOverlayService = uiOverlayService;

        this._uiOverlayService.registerOnDialogueTriggeredCallback(this.onDialogue.bind(this));
        await this._loadTutorialData();
    }

    public onStateChange(state: GameState) {
        const triggerToMatch = new TutorialTrigger();
        triggerToMatch.type = TutorialTriggerType.onStateChange;
        triggerToMatch.state = state;

        this._findAndQueueTutorialMessages(triggerToMatch);
    }

    public onGameStart(puzzleName: string) {
        const triggerToMatch = new TutorialTrigger();
        triggerToMatch.type = TutorialTriggerType.onGameStart;
        triggerToMatch.puzzle = puzzleName;

        this._findAndQueueTutorialMessages(triggerToMatch);
    }

    public onCardPlaced(puzzleName: string) {
        const triggerToMatch = new TutorialTrigger();
        triggerToMatch.type = TutorialTriggerType.onCardPlaced;
        triggerToMatch.puzzle = puzzleName;

        this._findAndQueueTutorialMessages(triggerToMatch);
    }

    public onHandPlaced(puzzleName: string, handCount: number, handClassification: HandClassification) {
        const triggerToMatch = new TutorialTrigger();
        triggerToMatch.type = TutorialTriggerType.onHandPlaced;
        triggerToMatch.puzzle = puzzleName;
        triggerToMatch.hand = handCount;
        triggerToMatch.handName = handClassification.handName;

        this._findAndQueueTutorialMessages(triggerToMatch);
    }

    public onHandSubmitted(puzzleName: string, handCount: number, handClassification: HandClassification) {
        const triggerToMatch = new TutorialTrigger();
        triggerToMatch.type = TutorialTriggerType.onHandSubmitted;
        triggerToMatch.puzzle = puzzleName;
        triggerToMatch.hand = handCount;
        triggerToMatch.handName = handClassification.handName;

        this._findAndQueueTutorialMessages(triggerToMatch);
    }

    public onHandScoreTallied(puzzleName: string, handCount: number, handClassification: HandClassification) {
        const triggerToMatch = new TutorialTrigger();
        triggerToMatch.type = TutorialTriggerType.onHandScoreTallied;
        triggerToMatch.puzzle = puzzleName;
        triggerToMatch.hand = handCount;
        triggerToMatch.handName = handClassification.handName;

        this._findAndQueueTutorialMessages(triggerToMatch);
    }

    public onMenuOpened(menuId: string) {
        const triggerToMatch = new TutorialTrigger();
        triggerToMatch.type = TutorialTriggerType.onMenuOpened;
        triggerToMatch.menuId = menuId;

        this._findAndQueueTutorialMessages(triggerToMatch);
    }

    public onDialogue(dialogueId: string) {
        const triggerToMatch = new TutorialTrigger();
        triggerToMatch.type = TutorialTriggerType.onDialogue;
        triggerToMatch.dialogueId = dialogueId;

        this._findAndQueueTutorialMessages(triggerToMatch);
    }

    private _findAndQueueTutorialMessages(trigger: TutorialTrigger) {
        const matches: TutorialMessage[] = [];
        this._tutorialMessages.forEach((message) => {
            const t = message.trigger;

            let triggerMatch = true;
            if (t.type !== undefined && t.type !== trigger.type) triggerMatch = false;
            if (t.state !== undefined && t.state !== GameState.None && t.state !== trigger.state) triggerMatch = false;
            if (t.puzzle !== undefined && t.puzzle !== null && t.puzzle !== trigger.puzzle) triggerMatch = false;
            if (t.hand !== undefined && t.hand !== -1 && t.hand !== trigger.hand) triggerMatch = false;
            if (t.handName !== undefined && t.handName !== null && t.handName !== trigger.handName) triggerMatch = false;
            if (t.menuId !== undefined && t.menuId !== null && t.menuId !== trigger.menuId) triggerMatch = false;
            if (t.dialogueId !== undefined && t.dialogueId !== null && t.dialogueId !== trigger.dialogueId) triggerMatch = false;

            if (!triggerMatch) {
                return;
            }
            // Check requirements
            const requirementsSatisfied = this._requirementsService.checkRequirementsMet(message.requirements);
            if (requirementsSatisfied) {
                matches.push(message);
            }
        });

        matches.forEach((message) => {
            this._showMessage(message);
        });
    }

    private _showMessage(message: TutorialMessage) {
        if (this._cardScrambleService.getTutorialStep(message.id)) {
            return;
        }

        this._log.debug('Showing tutorial message: ', { message: message });

        try {
            this._cardScrambleService.sendGa4Event({
                game_event_type: 'ftue',
                game_event_location: `ftueEvent_${message.id}_started`
            });
            this._uiOverlayService.showTutorialScrim(message, () => {
                this._cardScrambleService.sendGa4Event({
                    game_event_type: 'ftue',
                    game_event_location: `ftueEvent_${message.id}_completed` });
                this._cardScrambleService.saveTutorialStep(message.id, message.triggerSave);
            });
        } catch (ex) {
            this._log.error(`Exception ex=`, { exception: ex });
        }
    }

    private async _loadTutorialData(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.load('config/tutorial', JsonAsset, (err, jsonAsset) => {
                if (err) {
                    this._log.error('TutorialService._loadTutorialData(): Failed to load config/tutorial: ', err);
                    reject(err);
                    return;
                }
                try {
                    const tutorialData = jsonAsset.json;
                    if (!tutorialData.events || !Array.isArray(tutorialData.events)) {
                        this._log.error(`Missing tutorial data or tutorial events is not an array.`);
                        return;
                    }
                    tutorialData.events.forEach((eventData) => {
                        if (!eventData.trigger) {
                            this._log.warn(`Event data missing trigger`);
                            return;
                        }
                        if (!eventData.trigger) {
                            this._log.warn(`Event data missing trigger`);
                            return;
                        }
                        let event = new TutorialMessage();
                        event.trigger = Object.assign(new TutorialTrigger(), eventData?.trigger);
                        event.stepType = eventData?.stepType ?? TutorialStepType.overlay;
                        event.id = eventData?.id ?? null;
                        event.title = eventData?.title;
                        event.message = eventData?.message ?? null;
                        event.image = eventData?.image;
                        event.characterTutorial = eventData?.characterTutorial ?? false;
                        event.characterSpritePath = eventData?.characterSpritePath ?? null;
                        event.lightboxShape = eventData?.lightboxShape ?? TutorialScrimShape.Full;
                        event.lightboxDelay = eventData?.lightboxDelay ?? 0;
                        event.cursorAlignment = eventData?.cursorAlignment ?? TutorialCursorAlignment.None;
                        event.lightboxTarget = eventData?.lightboxTarget ?? null;
                        event.stepAdvance = eventData.stepAdvance ?? TutorialStepAdvance.OkButton;
                        event.hasFollowup = eventData.hasFollowup ?? false;
                        event.triggerSave = eventData.triggerSave ?? false;
                        event.messageOffsetX = eventData.messageOffsetX ?? 0;
                        event.messageOffsetY = eventData.messageOffsetY ?? 0;
                        event.dragInstructorCardSlotStart = eventData.dragInstructorCardSlotStart ?? 0;
                        event.dragInstructorBoardTileIndexTarget = eventData.dragInstructorBoardTileIndexTarget ?? 0;

                        if (Array.isArray(eventData.requirements)) {
                            event.requirements = eventData.requirements.map((o: unknown) => RequirementFactory.fromObject(o));
                        }

                        // Validate
                        if (event.id == null) {
                            this._log.warn(`Tutorial event missing id: `, eventData);
                            return;
                        }

                        this._tutorialMessages.push(event);
                    });

                    resolve();
                } catch (err) {
                    this._log.error('TutorialService._loadTutorialData(): Error during tutorial service initialization: ', err);
                    reject(err);
                }
            });
        });
    }
}
