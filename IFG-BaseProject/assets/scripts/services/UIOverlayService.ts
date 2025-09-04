import { JsonAsset, Node, Prefab, director, instantiate } from 'cc';
import { AppConfig } from '../config/AppConfig';
import { Event } from '../core/Event';
import { ItemInfo } from '../core/model/ItemInfo';
import { FadeType, ScreenFader } from '../diner/ui/ScreenFader';
import { CardScrambleGameController } from '../game/CardScrambleGameController';
import { GeneralPopup, PopupLayout, PopupResult, PopupType } from '../game/ui/GeneralPopup';
import { NarrativeDirector } from '../game/ui/NarrativeDirector';
import { UpsellView } from '../game/ui/UpsellView';
import { logger } from '../logging';
import { DialogueSet } from '../narrative/DialogueSet';
import { App } from '../state/App';
import TutorialScrim from '../tutorial/TutorialScrim';
import { ResourceLoader } from '../utils/ResourceLoader';
import { ICardScrambleService } from './ICardScrambleService';
import { IStore, StoreType, UpsellOffer } from './IStore';
import { TutorialMessage, TutorialStepAdvance, TutorialStepType } from './TutorialService';

export enum UIOverlayRequestType {
    Narrative,
    Popup,
    TutorialScrim
}

export class UIOverlayRequest {
    type: UIOverlayRequestType;
    content: string | TutorialMessage;
    onCompleteCallback: () => void;
    sendDialogueSeenEvent: boolean = true;
}

export class UIOverlayService {
    private _app: App = null;
    private _cardScrambleService: ICardScrambleService = null;
    private _store: IStore = null;
    private _appConfig: AppConfig;

    private _generalPopupPrefab: Prefab | null = null;
    private _tutorialScrimPrefab: Prefab | null = null;
    private _narrativeSequencePrefab: Prefab | null = null;
    private _upsellPrefab: Prefab | null = null;
    private _uiNodes: Map<string, Node> = new Map();

    private _popupInstance: GeneralPopup = null;
    private _tutorialScrimInstance: TutorialScrim = null;
    private _narrativeSequenceInstance: NarrativeDirector = null;
    private _upsellViewInstance: UpsellView = null;
    private _rootNode: Node = null;
    private _overlayContainer: Node = null;
    private _screenFader: ScreenFader = null;
    private _dialogueSequences: Map<string, DialogueSet> = new Map();

    private _requestQueue: UIOverlayRequest[] = [];

    private _onDialogueTriggeredEvent = new Event<(dialogueId: string) => void>();
    private _onDialogueSeenEvent: Event = new Event();

    private _gameplayController: CardScrambleGameController;

    private _log = logger.child('UIOverlayService');

    public async initialize(
        app: App,
        cardScrambleService: ICardScrambleService,
        store: IStore,
        config: AppConfig,
        generalPopupPrefab: Prefab,
        tutorialScrimPrefab: Prefab,
        narrativeSequencePrefab: Prefab,
        upsellPrefab: Prefab
    ) {
        this._app = app;
        this._cardScrambleService = cardScrambleService;
        this._store = store;
        this._appConfig = config;
        this._generalPopupPrefab = generalPopupPrefab;
        this._tutorialScrimPrefab = tutorialScrimPrefab;
        this._narrativeSequencePrefab = narrativeSequencePrefab;
        this._upsellPrefab = upsellPrefab;

        // Cache dialogue sequences
        try {
            const assets = await ResourceLoader.loadDir('dialogueSets', JsonAsset);
            for (const asset of assets) {
                let dialogueSet = new DialogueSet();
                if (!dialogueSet.initFromJson(JSON.stringify(asset.json))) {
                    this._log.warn(`Failed to parse dialogue set; skipping`);
                    continue;
                }
                this._dialogueSequences.set(dialogueSet.dialogueId, dialogueSet);
            }
        } catch (err) {
            this._log.error(`Failed to load dialogue sets with err: ${err}`);
        }
    }

    public clearNodesOnStateChange() {
        this._uiNodes.clear();
        if (this._tutorialScrimInstance) {
            this._tutorialScrimInstance.node.destroy();
            this._tutorialScrimInstance = null;
        }

        this._rootNode = null;
        this._overlayContainer = null;
        this._screenFader = null;
    }

    public registerNode(id: string, node: Node) {
        this._uiNodes.set(id, node);
    }

    public unregisterNode(id: string) {
        if (!this._uiNodes.has(id)) {
            return;
        }

        this._uiNodes.delete(id);
    }

    public getNode(id: string) {
        if (!this._uiNodes.has(id)) {
            this._log.warn(`UIOverlayService: Can't find node: ${id}`);
            return;
        }

        return this._uiNodes.get(id);
    }

    public setGameplayController(gameplayController: CardScrambleGameController) {
        this._gameplayController = gameplayController;
    }

    public getDialogueSets(): Map<string, DialogueSet> {
        return this._dialogueSequences;
    }

    public showGeneralPopup(
        type: PopupType,
        title: string,
        text: string,
        spritePath: string | null,
        callback: (result: PopupResult) => void,
        layout: PopupLayout,
        okText: string = 'Okay',
        cancelText: string = 'Cancel',
        otherText: string = 'Maybe',
        menuId: string = ''
    ) {
        if (this._rootNode == null) {
            let root = this._findRootNode();
            if (root == null) {
                this._log.error('UIOverlayService: Failed to find root node');
                return;
            }
            this._rootNode = root;
        }

        if (this._popupInstance) {
            this._log.warn(`Popup already being shown. TODO: queuing...`);
            return;
        }

        if (this._overlayContainer == null) {
            let overlay = this._findOverlayContainer();
            if (overlay == null) {
                this._log.error('UIOverlayService: Failed to find overlay container');
                return;
            }
            this._overlayContainer = overlay;
        }

        this._popupInstance = instantiate(this._generalPopupPrefab).getComponent(GeneralPopup);
        this._popupInstance.node.parent = this._overlayContainer;
        this._popupInstance.show(
            type,
            title,
            text,
            spritePath,
            layout,
            okText,
            cancelText,
            otherText,
            this._app.Services.tutorialService,
            menuId,
            (result: PopupResult) => {
                this._popupInstance = null;
                if (callback) {
                    callback(result);
                }
            }
        );
    }

    public async showLeaveGameConfirmation(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.showGeneralPopup(
                PopupType.OK_Cancel,
                'Leaving Game',
                `Are you sure you want to leave the game?`,
                null,
                async (result: PopupResult) => {
                    switch (result) {
                        case PopupResult.OK: {
                            resolve(true);
                            break;
                        }
                        default: {
                            resolve(false);
                            break;
                        }
                    }
                },
                PopupLayout.Vertical,
                'Yes',
                'No'
            );
        });
    }

    public fadeScreen(fadeType: FadeType, duration: number, callback: () => void) {
        switch (fadeType) {
            case FadeType.FADE_IN:
                this._findScreenFader().fadeIn(duration, callback);
                break;
            case FadeType.FADE_OUT:
                this._findScreenFader().fadeOut(duration, callback);
                break;
            case FadeType.FADE_OUT_IN:
                this._findScreenFader().fadeOutIn(duration, callback);
                break;
            default:
                this._log.error(`UIOverlayService: Unknown fade type ${fadeType}`);
                break;
        }
    }

    public showTutorialScrim(tutorialMessage: TutorialMessage, callback: () => void, sendDialogueSeenEvent: boolean = true) {
        this._log.debug(`showTutorialScrim(${tutorialMessage.title}, ${tutorialMessage.message})`);

        if (this._isShowingOverlay()) {
            this._log.debug(`showTutorialScrim(${tutorialMessage.title}, ${tutorialMessage.message}) Queuing...`);
            this._queueTutorialScrim(tutorialMessage, callback, sendDialogueSeenEvent);
            return;
        }

        // Some tutorial steps aren't overlays. We still trigger through the OverlayService as it takes
        // care of queueing overlays and we want the non-overlay steps to respect the tutorial queue.
        if (tutorialMessage.stepType === TutorialStepType.dragInstructor) {
            if (!this._gameplayController) {
                this._log.warn('Tutorial wants to show drag instructor, but no gameplay controller is set');
                return;
            }

            this._gameplayController.showDragInstructor(
                tutorialMessage.dragInstructorCardSlotStart,
                tutorialMessage.dragInstructorBoardTileIndexTarget
            );
            if (callback) {
                callback();
            }
            return;
        }

        // Find the overlay container to attach the scrim to.
        if (this._overlayContainer == null) {
            let overlay = this._findOverlayContainer();
            if (overlay == null) {
                this._log.error('UIOverlayService: Failed to find overlay container');
                return;
            }
            this._overlayContainer = overlay;
        }

        // If there's a lightbox target, find the node to target
        let lightboxTarget = null;
        if (tutorialMessage.lightboxTarget) {
            lightboxTarget = this.getNode(tutorialMessage.lightboxTarget);
            if (!lightboxTarget) {
                this._log.warn(`TutorialScrim cannot find lightbox target ${tutorialMessage.lightboxTarget}`);
                return;
            }
        }

        // Reuse the previous scrim or create the scrim
        if (!this._tutorialScrimInstance) {
            const tutorialScrimInstance: Node = instantiate(this._tutorialScrimPrefab);
            if (!tutorialScrimInstance) {
                this._log.error(`TutorialScrim failed to instantiate`);
                return;
            }
            tutorialScrimInstance.parent = this._overlayContainer;
            this._tutorialScrimInstance = tutorialScrimInstance.getComponent(TutorialScrim);
        }

        this._tutorialScrimInstance.initialize(tutorialMessage, lightboxTarget, () => {
            // If there's no followup; tear down the scrim
            let teardownScrim = !tutorialMessage.hasFollowup;

            // Alternatively; if this an OK button tutorial scrim; and hasFollowup is true, then
            // we should already have the next tutorial in the request queue. If we don't; then still tear down
            // so user isn't softlocked. But also log warning, as this might be a bug in our data.
            // This can only be done for OK step advance scrims, as others are dependent on subsequent actions
            // like opening a menu to add the next step to the queue. So we can't detect those the same way.
            if (
                tutorialMessage.hasFollowup &&
                tutorialMessage.stepAdvance === TutorialStepAdvance.OkButton &&
                !this._queueHasTutorialMessage()
            ) {
                this._log.warn(`Tutorial should have another step; but it is not in the queue. Closing scrim [${tutorialMessage.id}]`);
                teardownScrim = true;
            }

            if (teardownScrim) {
                this._overlayContainer.removeChild(this._tutorialScrimInstance.node);
                this._tutorialScrimInstance.node.destroy();
                this._tutorialScrimInstance = null;
            }
            if (callback) {
                callback();
            }
            this._showNextFromQueue();
        });
    }

    public showNarrativeSequence(narrativeSequenceId: string, onComplete: () => void = () => {}, sendDialogueSeenEvent: boolean = true): void {
        this._app.Services.dinerService.setCutsceneActive(true);
        this._app.Services.dinerService.setDinerHUDActive(false);

        this._log.debug(`showNarrativeSequence(${narrativeSequenceId})`);
        if (this._isShowingOverlay()) {
            this._log.debug(`showNarrativeSequence(${narrativeSequenceId})  Queuing...`);
            this._queueNarrativeSequence(narrativeSequenceId, onComplete, sendDialogueSeenEvent);
            return;
        }

        // Find the overlay container to attach the scrim to.
        if (this._overlayContainer == null) {
            let overlay = this._findOverlayContainer();
            if (overlay == null) {
                this._log.error('UIOverlayService: Failed to find overlay container');
                return;
            }
            this._overlayContainer = overlay;
        }

        const sequence = this._dialogueSequences.get(narrativeSequenceId);
        if (!sequence) {
            this._log.error(`Dialogue not found id: ${narrativeSequenceId}`);
            return;
        }

        const narrativeSequence = instantiate(this._narrativeSequencePrefab);
        if (!narrativeSequence) {
            this._log.error(`NarrativeDirector failed to instantiate`);
            return;
        }
        narrativeSequence.parent = this._overlayContainer;
        this._narrativeSequenceInstance = narrativeSequence.getComponent(NarrativeDirector);

        this._narrativeSequenceInstance.Init(this._cardScrambleService, this, this._app);
        narrativeSequence.on(
            'dialogue-complete',
            () => {
                this._overlayContainer.removeChild(this._narrativeSequenceInstance.node);
                this._narrativeSequenceInstance = null;
                if (onComplete) {
                    onComplete();
                }
                this._app.Services.dinerService.setCutsceneActive(false);
                this._app.Services.dinerService.setDinerHUDActive(true);
                this._showNextFromQueue();
            },
            this
        );

        this._onDialogueTriggeredEvent?.invoke(narrativeSequenceId);
        this._narrativeSequenceInstance.PlayDialogueSequence(sequence, sendDialogueSeenEvent, () => {
            this._onDialogueSeenEvent?.invoke();
        });
    }

    public isNarrativeSequenceActive(): boolean {
        return this._narrativeSequenceInstance != null;
    }

    public showUpsellForItem(itemInfo: ItemInfo, upsellOffer: UpsellOffer, storeType: StoreType): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this._upsellViewInstance != null) {
                this._log.warn('Already showing an upsell');
                resolve(false);
                return;
            }

            const upsellPrefab = instantiate(this._upsellPrefab);
            if (upsellPrefab == null) {
                this._log.error('Failed to load upsell prefab');
                resolve(false);
                return;
            }

            if (this._overlayContainer == null) {
                let overlay = this._findOverlayContainer();
                if (overlay == null) {
                    this._log.error('UIOverlayService: Failed to find overlay container');
                    return;
                }
                this._overlayContainer = overlay;
            }

            if (!this._overlayContainer) {
                resolve(false);
                return;
            }

            upsellPrefab.parent = this._overlayContainer;
            this._upsellViewInstance = upsellPrefab.getComponent(UpsellView);
            this._upsellViewInstance.show(this._store, this._appConfig.itemConfig, itemInfo, upsellOffer, storeType, (success: boolean) => {
                this._upsellViewInstance.node.destroy();
                this._upsellViewInstance = null;
                resolve(success);
            });
        });
    }

    public registerOnDialogueTriggeredCallback(func: (string) => void) {
        this._onDialogueTriggeredEvent.subscribe(func);
    }

    public unregisterOnDialogueTriggeredCallback(func: (string) => void) {
        this._onDialogueTriggeredEvent.unsubscribe(func);
    }

    public registerOnDialogueSeeenEventCallback(func: () => void) {
        this._onDialogueSeenEvent.subscribe(func);
    }

    public unregisterOnDialogueSeeenEventCallback(func: () => void) {
        this._onDialogueSeenEvent.unsubscribe(func);
    }

    public isTutorialScrimActive(): boolean {
        return this._isShowingOverlay();
    }

    private _isShowingOverlay(): boolean {
        return (
            this._narrativeSequenceInstance != null ||
            (this._tutorialScrimInstance != null && !this._tutorialScrimInstance.readyForNextMessage())
        );
    }

    private _queueTutorialScrim(tutorialMessage: TutorialMessage, callback: () => void, sendDialogueSeenEvent: boolean = true) {
        const request = new UIOverlayRequest();
        request.type = UIOverlayRequestType.TutorialScrim;
        request.content = tutorialMessage;
        request.onCompleteCallback = callback;
        request.sendDialogueSeenEvent = sendDialogueSeenEvent;

        this._requestQueue.push(request);
    }

    private _queueNarrativeSequence(narrativeSequenceId: string, callback: () => void, sendDialogueSeenEvent: boolean = true) {
        const request = new UIOverlayRequest();
        request.type = UIOverlayRequestType.Narrative;
        request.content = narrativeSequenceId;
        request.onCompleteCallback = callback;
        request.sendDialogueSeenEvent = sendDialogueSeenEvent;

        this._requestQueue.push(request);
    }

    private _showNextFromQueue() {
        if (this._requestQueue.length == 0) {
            return;
        }

        const next = this._requestQueue[0];
        this._requestQueue.splice(0, 1);

        switch (next.type) {
            case UIOverlayRequestType.TutorialScrim:
                this.showTutorialScrim(next.content as TutorialMessage, next.onCompleteCallback, next.sendDialogueSeenEvent);
                break;
            case UIOverlayRequestType.Narrative:
                this.showNarrativeSequence(next.content as string, next.onCompleteCallback, next.sendDialogueSeenEvent);
                break;
            case UIOverlayRequestType.Popup:
                // TODO:
                break;
        }
    }

    private _queueHasTutorialMessage(): boolean {
        return this._requestQueue.some((req) => req.type === UIOverlayRequestType.TutorialScrim);
    }

    private _findRootNode() {
        if (this._rootNode != null) {
            return this._rootNode;
        }
        let rootNode = director.getScene()?.getChildByName('Canvas') || director.getScene();
        return rootNode;
    }

    private _findScreenFader() {
        if (this._screenFader != null) {
            return this._screenFader;
        }

        if (this._rootNode == null) {
            let root = this._findRootNode();
            if (root == null) {
                this._log.error('UIOverlayService: Failed to find root node');
                return null;
            }
            this._rootNode = root;
        }
        // Find the screen fader node
        let screenFader = UIOverlayService._searchNodeRecursive(this._rootNode, 'ScreenFader');
        if (screenFader == null) {
            this._log.error('UIOverlayService: Failed to find screen fader');
            return null;
        }
        this._screenFader = screenFader.getComponent(ScreenFader);
        return this._screenFader;
    }

    private _findOverlayContainer() {
        if (this._overlayContainer != null) {
            return this._overlayContainer;
        }

        if (this._rootNode == null) {
            let root = this._findRootNode();
            if (root == null) {
                this._log.error('UIOverlayService: Failed to find root node');
                return null;
            }
            this._rootNode = root;
        }
        let overlayContainer = UIOverlayService._searchNodeRecursive(this._rootNode, 'SafeZone');
        return overlayContainer;
    }

    public getOverlayContainer() {
        return this._findOverlayContainer();
    }

    private static _searchNodeRecursive(parentNode: Node, nodeName: string): Node | null {
        if (parentNode.name === nodeName) {
            return parentNode;
        }

        for (const child of parentNode.children) {
            const result = this._searchNodeRecursive(child, nodeName);
            if (result) {
                return result;
            }
        }

        return null;
    }
}
