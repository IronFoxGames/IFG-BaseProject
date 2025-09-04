import { _decorator, Camera, CameraComponent, Component, director, instantiate, Node, Prefab, Rect, UITransform, view } from 'cc';
import { SoundManager } from '../audio/SoundManager';
import { Booster } from '../boosters/Booster';
import { Level } from '../config/Level';
import { TaskConfig } from '../config/TaskConfig';
import { Currency } from '../core/enums/Currency';
import { Event } from '../core/Event';
import { PopupLayout, PopupResult, PopupType } from '../game/ui/GeneralPopup';
import { SettingsScreenController } from '../game/ui/SettingsScreenController';
import { StoreScreenController } from '../game/ui/StoreScreenController';
import { logger } from '../logging';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { IStore } from '../services/IStore';
import { App } from '../state/App';
import { HowToPlayScreenController } from '../ui/HowToPlayScreenController';
import { PhoneHUD } from '../ui/PhoneHUD';
import { TaskAppScreen } from '../ui/TaskAppScreen';
import { DinerCameraController } from './DinerCameraController';
import { IVisibleEntity } from './IVisibleEntity';
import { PropData } from './models/PropData';
import { PropCatalogue } from './PropCatalogue';
import { Room } from './Room';
import { StoryPropController } from './StoryPropController';
import { Task, TaskState } from './Task';
import { TaskDirector } from './TaskDirector';
import { TaskManager } from './TaskManager';
import { BuildModeTaskContext, BuildModeView } from './ui/BuildModeView';
import { DailyRewardView } from './ui/DailyRewardView';
import { DinerHUDState, DinerHUDView } from './ui/DinerHUDView';
import { PreGameView } from './ui/PreGameView';
import { RoomUnlockAnimation } from './ui/RoomUnlockAnimation';
const { ccclass, property } = _decorator;

enum CullMode {
    CullOffscreen,
    CullNone,
    CullAll
}

@ccclass('DinerSceneController')
export class DinerSceneController extends Component {
    @property({ type: DinerCameraController })
    public DinerCameraController: DinerCameraController;

    @property({ type: [Room] })
    public Rooms: Room[] = [];

    @property({ type: [Room] })
    public FakeRooms: Room[] = [];

    @property({ type: StoryPropController, visible: true })
    private _storyPropController: StoryPropController;

    @property({ type: Camera, visible: true })
    private _mainCamera: Camera;

    @property({ type: DinerHUDView, visible: true, group: 'Views' })
    private _dinerHUDView: DinerHUDView;

    @property({ type: Prefab, visible: true, group: 'Views' })
    private _dailyRewardViewPrefab: Prefab;

    @property({ type: Prefab, visible: true, group: 'Views' })
    private _buildModeViewPrefab: Prefab;

    @property({ type: PreGameView, visible: true, group: 'Views' })
    private _preGameView: PreGameView;

    @property({ type: SettingsScreenController, visible: true, group: 'Views' })
    private _settingsView: SettingsScreenController;

    @property({ type: Prefab, visible: true, group: 'Views' })
    private _storeViewPrefab: Prefab;

    @property({ type: HowToPlayScreenController, visible: true, group: 'Views' })
    private _howToPlayView: HowToPlayScreenController;

    @property({ type: UITransform, visible: true })
    private _uiParent: UITransform = null;

    @property({ type: Node, visible: true })
    private _nodeButtonParentNode: Node = null;

    @property({ type: Prefab, visible: true, group: 'Views' })
    private _phoneHUDPrefab: Prefab;

    @property({ type: Prefab, visible: true, group: 'Views' })
    private _roomUnlockAnimationPrefab: Prefab;

    // Screen instances
    private _buildModeViewInstance: BuildModeView;
    private _storeViewInstance: StoreScreenController;
    private _phoneHUDInstance: PhoneHUD;
    private _roomUnlockAnimationInstance: RoomUnlockAnimation;

    private _currentlySelectedRoomIndex: number = 0;

    private _app: App = null;
    private _store: IStore = null;
    private _cardScrambleService: ICardScrambleService = null;

    private _propCatalogue: PropCatalogue = null;

    private _taskManager: TaskManager = null;
    private _taskDirector: TaskDirector = null;
    private _starsWithheld: number = 0;
    private _taskListOpened: Event = new Event();
    private _log = logger.child('DinerSceneController');

    private _onPlayPressed: (boosters: Booster[]) => void;
    private _onQuickPlayPressed: (boosters: Booster[]) => void;
    private _onCheckDialoguesToPlay: () => void;
    private _onTeardownCallback: () => void;

    private _cullMode = CullMode.CullOffscreen;

    // Keyboard controls to test culling; keeping for debugging purposes.
    // protected onLoad() {
    //     input.on(
    //         Input.EventType.KEY_DOWN,
    //         (event: EventKeyboard) => {
    //             if (event.keyCode === KeyCode.DIGIT_1) {
    //                 this._cullMode = CullMode.CullOffscreen;
    //             } else if (event.keyCode === KeyCode.DIGIT_2) {
    //                 this._cullMode = CullMode.CullNone;
    //                 const allVisibleEntities: IVisibleEntity[] = this.Rooms.flatMap((room) => room?.getVisibleEntities() || []);
    //                 allVisibleEntities.forEach((entity) => {
    //                     entity.setVisible(true);
    //                 });
    //             } else {
    //                 this._cullMode = CullMode.CullAll;
    //                 const allVisibleEntities: IVisibleEntity[] = this.Rooms.flatMap((room) => room?.getVisibleEntities() || []);
    //                 allVisibleEntities.forEach((entity) => {
    //                     entity.setVisible(false);
    //                 });
    //             }
    //         },
    //         this
    //     );
    // }

    public async init(
        app: App,
        onPlayPressed: (boosters: Booster[]) => void,
        onQuickPlayPressed: (boosters: Booster[]) => void,
        onPlayLevelPressed: (puzzle: Level, boosters: Booster[]) => void,
        onCheckDialoguesToPlay: () => void
    ) {
        this._onPlayPressed = onPlayPressed;
        this._onQuickPlayPressed = onQuickPlayPressed;
        this._onCheckDialoguesToPlay = onCheckDialoguesToPlay;
        this._propCatalogue = new PropCatalogue();
        this._taskManager = new TaskManager();
        this._taskDirector = new TaskDirector();

        this._app = app;
        this._cardScrambleService = app.Services.cardScrambleService;
        this._store = app.Services.store;

        this._app.Services.dinerService.registerSceneControllerInstance(this);

        await this._propCatalogue.init(app.Services.store, app.Services.cardScrambleService);

        const results = await Promise.all(
            this.Rooms.map((room) =>
                room.init(this._app.Services.cardScrambleService, this._app.Services.requirementsService, this._propCatalogue, false)
            )
        );

        if (!results) {
            this._log.error('Failed to initialize rooms.');
        }

        this.Rooms.forEach((room) => room.openNeighbouringDoors());

        this.FakeRooms.map((room) =>
            room.init(this._app.Services.cardScrambleService, this._app.Services.requirementsService, this._propCatalogue, true)
        );

        let onNewAvailableTaskFoundCallback = this._dinerHUDView.onNewAvailableTaskFoundCallback.bind(this._dinerHUDView);
        let onNewCollectableTaskFoundCallback = this._dinerHUDView.onNewCollectableTaskFoundCallback.bind(this._dinerHUDView);
        let onPurgeTaskNotificationsCallback = this._dinerHUDView.onPurgeTaskNotificationsCallback.bind(this._dinerHUDView);
        let onTaskCompletedCallback = this._dinerHUDView.onTaskCompletedCallback.bind(this._dinerHUDView);

        this._taskManager.NewAvailableTaskFound.subscribe(onNewAvailableTaskFoundCallback);
        this._taskManager.NewCollectableTaskFound.subscribe(onNewCollectableTaskFoundCallback);
        this._taskManager.PurgeTaskNotificiations.subscribe(onPurgeTaskNotificationsCallback);
        this._taskManager.TaskCompleted.subscribe(onTaskCompletedCallback);

        this._taskManager.init(
            this._app.Services.cardScrambleService,
            this._app.Services.requirementsService,
            this._app.Services.dinerService,
            this._app.getAppConfig().taskConfig,
            this._propCatalogue
        );

        // Debug build validation
        this._debugValidate();

        this._taskDirector.OnCompletionSequneceComplete.subscribe(() => {
            this._onCheckDialoguesToPlay?.call(this);
            this._dinerHUDView.setHUDState(DinerHUDState.Shown);
        });

        this._taskDirector.init(this._app.Services.cardScrambleService, this._app.Services.UIOverlayService, this._app.Services.dinerService);

        await this._storyPropController.init(this._app.Services.requirementsService);

        this._dinerHUDView.OnSettingsButtonPressed = () => this._onSettingsButtonPressedCallback();
        this._dinerHUDView.OnTasksButtonPressed = () => this._onTasksButtonPressedCallback();
        this._dinerHUDView.OnDailyRewardButtonPressed = () => this._onDailyRewardButtonPressedCallback();
        this._dinerHUDView.OnBuildModeButtonPressed = () => this._onBuildButtonPressedCallback();
        this._dinerHUDView.OnPlayButtonPressed = () => this._onPlayButtonPressedCallback(onPlayPressed);
        this._dinerHUDView.OnQuickPlayButtonPressed = () => this._onQuickPlayButtonPressedCallback(onQuickPlayPressed);
        this._dinerHUDView.OnStoreButtonPressed = () => this._onStoreButtonPressedCallback();
        this._dinerHUDView.OnPlatformStoreButtonPressed = () => this._onStoreButtonPressedCallback();
        this._dinerHUDView.OnGetMoreGems = () => this.openGemStore();
        this._dinerHUDView.OnGetMoreCoins = () => this.openCoinStore();
        this._dinerHUDView.OnGetMoreEnergy = () => this.openEnergyStore();
        this._settingsView.onHowToPlayButtonPressed = () => this._onHowToPlayButtonPressedCallback();
        this._dinerHUDView.init(this._app.Services, this._app.getLevelList(), this._app.getAppConfig().hudConfig, this);

        let onDialogueSeenCallback = () => {
            this._taskManager.updateActiveTasks();
            this._dinerHUDView.onEvaluateAllButtonRequirements();
        };

        this._app.Services.UIOverlayService.registerOnDialogueSeeenEventCallback(onDialogueSeenCallback);

        this._preGameView.init(
            app.Services.cardScrambleService,
            app.Services.UIOverlayService,
            app.Services.tutorialService,
            app.Services.requirementsService,
            this._app.getAppConfig().itemConfig,
            this._app.getAppConfig().hudConfig,
            this._app.Services.store
        );

        this._dinerHUDView.setHUDState(DinerHUDState.Shown);
        this._preGameView.hide();
        this._settingsView.hide();
        this._howToPlayView.hide();

        this._onTeardownCallback = () => {
            if (this._taskManager) {
                this._taskManager.NewAvailableTaskFound.unsubscribe(onNewAvailableTaskFoundCallback);
                this._taskManager.NewCollectableTaskFound.unsubscribe(onNewCollectableTaskFoundCallback);
                this._taskManager.PurgeTaskNotificiations.unsubscribe(onPurgeTaskNotificationsCallback);
                this._taskManager.TaskCompleted.unsubscribe(onTaskCompletedCallback);
            }
            this._app.Services.UIOverlayService.unregisterOnDialogueSeeenEventCallback(onDialogueSeenCallback);
            if (this._app && this._app.Services) {
                this._app.Services.dinerService.unregisterSceneControllerInstance();
            }
        };

        //For launch, always reveal the dining room when we enter the diner...
        let diningRoomIndex = -1;
        this.Rooms.forEach((room, index) => {
            if (room.RoomId === 'dining-room') {
                diningRoomIndex = index;
            }
        });

        if (diningRoomIndex === -1) {
            this._log.error('Dining Room index not found in DinerSceneController...');
        } else {
            this.Rooms[diningRoomIndex].revealToCamera();
        }

        //Play the intro dialogue if it's the first time playing
        const nextPuzzle = this._app.Services.cardScrambleService.getNextPuzzle();
        if (nextPuzzle?.index === 0) {
            this._app.Services.UIOverlayService.showNarrativeSequence(this._app.getAppConfig().introDialogue, null, true);
        }
    }

    public registerPropSwappedEventCallback(func: () => void) {
        // TODO:
        // this._buildModeView.registerPropSwappedEventCallback(func);
    }

    public unregisterPropSwappedEventCallback(func: () => void) {
        // TODO:
        //this._buildModeView.unregisterPropSwappedEventCallback(func);
    }

    public registerTaskListOpenedEventCallback(func: () => void) {
        this._taskListOpened.subscribe(func);
    }

    public unregisterTaskListOpenedEventCallback(func: () => void) {
        this._taskListOpened.unsubscribe(func);
    }

    public registerActiveTaskListUpdatedCallback(func: () => void) {
        this._taskManager.ActiveTasksUpdatedAndVerified.subscribe(func);
    }

    public unregisterActiveTaskListUpdatedCallback(func: () => void) {
        this._taskManager.ActiveTasksUpdatedAndVerified.unsubscribe(func);
    }

    public spendTaskStars(stars: number, burstTarget: Node, onBurstComplete: () => void) {
        this._dinerHUDView.burstResourceWidget(Currency.Stars, stars, burstTarget, this.node, onBurstComplete);
    }

    public setStarsWitheld(stars: number) {
        this._starsWithheld = stars;
    }

    public getStarsWithheld(): number {
        return this._starsWithheld;
    }

    public async getStarsBalance(): Promise<number> {
        try {
            const balance = await this._cardScrambleService.getCurrencyBalance(Currency.Stars);
            return Number(balance);
        } catch (error) {
            this._log.error('Failed to get stars balance:', error);
            return 0;
        }
    }

    public getTaskItemSpritePath(itemId: string): string {
        let itemInfo = this._app.getAppConfig().itemConfig.getItemInfo(itemId);

        if (itemInfo === null) {
            this._log.error(`Could not find a Task Item Sprite with id: ${itemId}`);
        }

        return itemInfo.sprite;
    }

    public getPropFromCatalogue(propId: string): PropData {
        return this._propCatalogue.getPropWithId(propId);
    }

    public registerStarsWithheldEventCallback(func: () => void) {
        this._taskDirector.OnStarsWithheld.subscribe(func);
    }

    public unregisterStarsWithheldEventCallback(func: () => void) {
        this._taskDirector.OnStarsWithheld.unsubscribe(func);
    }

    public getRoom(roomId: string): Room {
        let room = this.Rooms.find((room: Room) => room.RoomId === roomId);

        if (room !== undefined) {
            return room;
        } else {
            this._log.error(`Could not get room with id: ${roomId}.`);
            return null;
        }
    }

    public getTaskConfig(): TaskConfig {
        return this._app.getAppConfig().taskConfig;
    }

    public enterBuildModeWithContext(context: BuildModeTaskContext, onSwapPropButtonPressedCallback: () => void) {
        const buildModeNode = instantiate(this._buildModeViewPrefab);
        buildModeNode.parent = this._uiParent.node;

        this._buildModeViewInstance = buildModeNode.getComponent(BuildModeView);
        this._buildModeViewInstance.OnExitButtonPressed = () => {
            this._onExitButtonPressedCallback();
        };
        this._buildModeViewInstance.init(
            (roomIndex: number) => this._onGoToRoomButtonPressedCallback(roomIndex),
            onSwapPropButtonPressedCallback,
            this,
            this.Rooms,
            this.FakeRooms,
            this._nodeButtonParentNode,
            this.DinerCameraController,
            this._app.Services.requirementsService,
            this._app.Services.UIOverlayService,
            this._app.Services.cardScrambleService,
            this._app.Services.tutorialService,
            this._app.Services.debugService,
            this._propCatalogue,
            this._currentlySelectedRoomIndex,
            context
        );
    }

    public playRoomUnlockAnimation(roomId: string, onAnimationEnded: () => void) {
        if (this._roomUnlockAnimationInstance) {
            this._log.warn('attempting to double open the room unlock animation');
            return;
        }

        const roomUnlockAnimation = instantiate(this._roomUnlockAnimationPrefab);
        roomUnlockAnimation.parent = this._uiParent.node;
        this._roomUnlockAnimationInstance = roomUnlockAnimation.getComponent(RoomUnlockAnimation);

        this._roomUnlockAnimationInstance.initializeAndPlay(this.getRoom(roomId).RoomName, () => {
            onAnimationEnded.call(this);

            this._roomUnlockAnimationInstance.node.destroy();
            this._roomUnlockAnimationInstance = null;
        });
    }

    public refreshButtonRequirements() {
        this._dinerHUDView.onEvaluateAllButtonRequirements();
    }

    protected update(deltaTime: number) {
        this._taskDirector?.tickCurrentCompletionSequenceState();
        this._cullDinerEntities();
    }

    protected onDestroy(): void {
        this._onTeardownCallback?.call(this);
    }

    private _cullDinerEntities() {
        if (this._cullMode !== CullMode.CullOffscreen) {
            return;
        }

        const cameraBounds = this._getCameraWorldBounds();
        const allVisibleEntities: IVisibleEntity[] = this.Rooms.flatMap((room) => room?.getVisibleEntities() || []);
        allVisibleEntities.forEach((entity) => {
            const boundingRect = entity.getBoundingRect();
            let isVisible =
                boundingRect.xMax > cameraBounds.x &&
                boundingRect.x < cameraBounds.x + cameraBounds.width &&
                boundingRect.yMax > cameraBounds.y &&
                boundingRect.y < cameraBounds.y + cameraBounds.height;
            entity.setVisible(isVisible);
        });
    }

    private _getCameraWorldBounds(): Rect {
        const camera = director.getScene().getChildByPath('DinerRooms/DinerCamera').getComponent(CameraComponent);
        const cameraNode = camera.node;
        const camWorldPos = cameraNode.getWorldPosition();

        // Get canvas resolution (design or visible)
        const designSize = view.getDesignResolutionSize();
        const aspect = designSize.width / designSize.height;

        const orthoHeight = camera.orthoHeight; // half-height in world units
        const orthoWidth = orthoHeight * aspect;

        const x = camWorldPos.x - orthoWidth;
        const y = camWorldPos.y - orthoHeight;

        return new Rect(x, y, orthoWidth * 2, orthoHeight * 2);
    }

    private _onSettingsButtonPressedCallback() {
        if (this._taskDirector.isTaskSequenceRunning()) {
            return;
        }

        this._settingsView.show(
            false,
            this._app.getAppConfig(),
            this._app.Services,
            () => {},
            () => {},
            () => {
                this._onHowToPlayButtonPressedCallback();
            }
        );
    }

    public _onHowToPlayButtonPressedCallback() {
        if (this._taskDirector.isTaskSequenceRunning()) {
            return;
        }

        this._howToPlayView.node.active = false;

        this._howToPlayView.show(false, this._app.Services, () => {
            this._howToPlayView.hide();
        });
    }

    private _onTasksButtonPressedCallback() {
        if (this._taskDirector.isTaskSequenceRunning()) {
            return;
        }

        this.openPhoneTaskScreen();
    }

    private async _onDailyRewardButtonPressedCallback() {
        if (this._taskDirector.isTaskSequenceRunning()) {
            return;
        }

        const dailyRewardPrefab = instantiate(this._dailyRewardViewPrefab);
        if (dailyRewardPrefab == null) {
            this._log.error('failed to load daily reward prefab');
            return;
        }
        dailyRewardPrefab.parent = this._uiParent.node;
        dailyRewardPrefab.active = false;

        const dailyRewardView = dailyRewardPrefab.getComponent(DailyRewardView);

        const claimState = await this._app.Services.cardScrambleService.getDailyRewardPrizes();
        await dailyRewardView.init(
            this._app.Services.cardScrambleService,
            this._app.Services.UIOverlayService,
            this._app.getAppConfig(),
            this._app.Services.store,
            claimState
        );
        dailyRewardView.OnContinueButtonPressed = async () => {
            await dailyRewardView.hide();
            dailyRewardView.node.destroy();
            this._onCheckDialoguesToPlay?.call(this);
            this._dinerHUDView.setHUDState(DinerHUDState.Shown);
        };

        await dailyRewardView.show();
        this._dinerHUDView.setHUDState(DinerHUDState.Hidden);
    }

    private _populateTaskAppScreen(taskAppScreen: TaskAppScreen) {
        taskAppScreen.clearAllTaskEntries();

        taskAppScreen.setChapterInfo(this._taskManager.CurrentChapterName, this._taskManager.CurrentChapterProgress);

        for (const task of this._taskManager.ActiveTasks) {
            taskAppScreen.createNewTaskEntry(task);
        }

        if (this._taskManager.ActiveTasks.length === 0) {
            taskAppScreen.showNoTasksNotification(true);
        } else {
            taskAppScreen.showNoTasksNotification(false);
        }
    }

    private _onBuildButtonPressedCallback() {
        if (this._taskDirector.isTaskSequenceRunning()) {
            return;
        }

        this._dinerHUDView?.setHUDState(DinerHUDState.Hidden);

        const buildModeNode = instantiate(this._buildModeViewPrefab);
        buildModeNode.parent = this._uiParent.node;

        const taskContext = null;

        this._buildModeViewInstance = buildModeNode.getComponent(BuildModeView);
        this._buildModeViewInstance.OnExitButtonPressed = () => {
            this._onExitButtonPressedCallback();
        };
        this._buildModeViewInstance.init(
            (roomIndex: number) => this._onGoToRoomButtonPressedCallback(roomIndex),
            () => {},
            this,
            this.Rooms,
            this.FakeRooms,
            this._nodeButtonParentNode,
            this.DinerCameraController,
            this._app.Services.requirementsService,
            this._app.Services.UIOverlayService,
            this._app.Services.cardScrambleService,
            this._app.Services.tutorialService,
            this._app.Services.debugService,
            this._propCatalogue,
            this._currentlySelectedRoomIndex,
            taskContext
        );
    }

    private _onExitButtonPressedCallback() {
        if (this._buildModeViewInstance) {
            this._buildModeViewInstance.node.destroy();
            this._buildModeViewInstance = null;
        }

        if (this._taskDirector.isTaskSequenceRunning()) {
            return; //This function is called to close the build view as normal after a prop is selected in a task context, so the above needs to happen no matter what.
        }

        this._dinerHUDView?.show();
    }

    private _onGoToRoomButtonPressedCallback(roomIndex: number) {
        if (this._taskDirector.isTaskSequenceRunning()) {
            return;
        }

        this._currentlySelectedRoomIndex = roomIndex;
    }

    private _onStoreButtonPressedCallback() {
        if (this._taskDirector.isTaskSequenceRunning()) {
            return;
        }

        this.openStore();
    }

    private _onPlatformStoreButtonPressedCallback() {
        if (this._taskDirector.isTaskSequenceRunning()) {
            return;
        }

        this._app.Services.store.showPlatformStore();
    }

    private async _onPlayButtonPressedCallback(onPlayPressed: (boosters: Booster[]) => void) {
        if (this._taskDirector.isTaskSequenceRunning()) {
            return;
        }

        const puzzle = this._app.Services.cardScrambleService.getNextPuzzle();

        if (puzzle && !this._app.Services.requirementsService.checkRequirementsMet(puzzle.requirements)) {
            this.openPhoneTaskScreen();
            return;
        }

        if (
            this._app.Services.cardScrambleService.checkGuestLimitAndShowPopup(
                this._app.Services.requirementsService,
                this._app.Services.UIOverlayService
            )
        ) {
            return;
        }

        this._preGameView.OnPlayButtonPressed = onPlayPressed;

        this._preGameView.OnCloseButtonPressed = () => {
            this._preGameView.hide();
            this._dinerHUDView.setHUDState(DinerHUDState.Shown);
        };

        if (puzzle === null) {
            this._app.Services.UIOverlayService.showGeneralPopup(
                PopupType.OK_Other,
                'More Coming Soon!',
                this._app.getAppConfig().endOfStoryMessage,
                'dialogueSprites/Viola-Happy/spriteFrame',
                (result) => {
                    if (result === PopupResult.Other) {
                        this._app.Services.dinerService.openQuickPlay();
                    }
                },
                PopupLayout.Horizontal,
                'Okay',
                null,
                'Quick Play'
            );
        } else {
            await this._preGameView.setPuzzleDetails(puzzle);
            this._dinerHUDView.setHUDState(DinerHUDState.Hidden);
            this._preGameView.show();
        }
    }

    private async _onQuickPlayButtonPressedCallback(
        onQuickPlayPressed: (boosters: Booster[]) => void,
        overrideTaskSequenceBlocker: boolean = false
    ) {
        if (this._taskDirector.isTaskSequenceRunning() && !overrideTaskSequenceBlocker) {
            return;
        }

        if (
            this._app.Services.cardScrambleService.checkGuestLimitAndShowPopup(
                this._app.Services.requirementsService,
                this._app.Services.UIOverlayService
            )
        ) {
            return;
        }

        this._preGameView.OnPlayButtonPressed = onQuickPlayPressed;

        this._preGameView.OnCloseButtonPressed = () => {
            this._preGameView.hide();
            this._dinerHUDView.setHUDState(DinerHUDState.Shown);
        };

        this._preGameView.setQuickPlayDetails();

        this._dinerHUDView.setHUDState(DinerHUDState.Hidden);
        this._preGameView.show();
    }

    public async openStore(tags: string[] = []): Promise<void> {
        if (this._storeViewInstance != null) {
            this._storeViewInstance.node.destroy();
            this._storeViewInstance = null;
        }

        return new Promise((resolve, reject) => {
            const storeViewNode = instantiate(this._storeViewPrefab);
            storeViewNode.parent = this._uiParent.node;
            this._storeViewInstance = storeViewNode.getComponent(StoreScreenController);
            if (!this._storeViewInstance) {
                this._log.error(`failed to load store view`);
                return;
            }

            this._storeViewInstance.init(
                this._app.getAppConfig(),
                this._app.Services.store,
                tags,
                this._app.Services.cardScrambleService,
                () => {
                    this._storeViewInstance.node.destroy();
                    this._storeViewInstance = null;
                    resolve();
                }
            );
        });
    }

    public async openCoinStore(): Promise<void> {
        return this.openStore(['coins']);
    }

    public async openEnergyStore(): Promise<void> {
        return this.openStore(['energy']);
    }

    public openGemStore() {
        return this._app.Services.cardScrambleService.redirectToPremiumCurrencyStore();
    }

    public openPhoneTaskScreen(newTask?: boolean) {
        if (this._phoneHUDInstance != null) {
            this._log.warn('attempting to double open the phone');
            return;
        }

        const phoneHUDNode = instantiate(this._phoneHUDPrefab);

        phoneHUDNode.parent = this._uiParent.node;
        this._phoneHUDInstance = phoneHUDNode.getComponent(PhoneHUD);

        this._phoneHUDInstance.init();

        if (!this._phoneHUDInstance) {
            this._log.error(`failed to load phone HUD`);
            return;
        }
        this._phoneHUDInstance.taskAppScreen.init(
            this._app.Services.cardScrambleService,
            this._app.Services.dinerService,
            this._app.Services.tutorialService,
            newTask
        );

        this._phoneHUDInstance.OnClosedCallback = () => {
            this._closePhoneTaskScreen();
            this._dinerHUDView.setHUDState(DinerHUDState.Shown);
        };

        this._phoneHUDInstance.taskAppScreen.OnTaskEntryActionButtonPressed = async (task: Task, starDestinationNode: Node) => {
            // If they're a guest and past the guest limit, show that popup
            if (
                this._app.Services.cardScrambleService.checkGuestLimitAndShowPopup(
                    this._app.Services.requirementsService,
                    this._app.Services.UIOverlayService
                )
            ) {
                return;
            }

            if (task.state !== TaskState.Collectable) {
                this._app.Services.UIOverlayService.showGeneralPopup(
                    PopupType.OK_Cancel,
                    'Get Stars!',
                    `You don't have enough stars. Play the next puzzle now?`,
                    null,
                    (result) => {
                        if (result === PopupResult.OK) {
                            this._closePhoneTaskScreen();
                            this._onPlayButtonPressedCallback(this._onPlayPressed);
                        }
                    },
                    PopupLayout.Vertical,
                    'Play',
                    'Cancel',
                    null,
                    'popUp.NotEnoughStars'
                );
            } else if (task.data.completionSequences.length > 0) {
                //Enter a new task completion state...
                this._phoneHUDInstance.taskAppScreen.disableAllEntriesAndCloseButton();
                this._taskDirector.instanceAndBeginCompletionSequenceState(task, this._taskManager, (onBurstComplete: () => void = null) => {
                    this.spendTaskStars(task.data.starCost, starDestinationNode, onBurstComplete);
                });
            } else {
                //This task has no completion sequences, so we just need to save the changes to task progress
                this._phoneHUDInstance.taskAppScreen.disableAllEntriesAndCloseButton();
                this.spendTaskStars(task.data.starCost, starDestinationNode, async () => {
                    await this._taskManager.incrementAndSaveTaskCompletion(task);
                    this._taskDirector.OnCompletionSequneceBegin.invoke();
                    this._taskDirector.OnCompletionSequneceComplete.invoke();
                    this._closePhoneTaskScreen();
                });
            }
        };

        this._populateTaskAppScreen(this._phoneHUDInstance.taskAppScreen);

        this._dinerHUDView.setHUDState(DinerHUDState.TaskView);

        this._phoneHUDInstance.showTaskScreen();

        this._taskListOpened.invoke();

        if (newTask) {
            SoundManager.instance.playSound('SFX_UI_TaskNotification');
            this._phoneHUDInstance.taskAppScreen.animateTasksIn();
        }
    }

    public openQuickPlay() {
        this._onQuickPlayButtonPressedCallback.call(this, this._onQuickPlayPressed, true);
    }

    public _closePhoneTaskScreen() {
        if (this._phoneHUDInstance) {
            this._phoneHUDInstance.node.destroy();
        }
        this._phoneHUDInstance = null;
    }

    public refreshTaskAppScreen() {
        this._log.debug('Refreshing Task App Screen...');
        if (this._phoneHUDInstance && this._phoneHUDInstance.taskAppScreen) {
            this._phoneHUDInstance.taskAppScreen.clearAllTaskEntries();
            this._populateTaskAppScreen(this._phoneHUDInstance.taskAppScreen);
        } else {
            this._log.warn('Task App Screen is not available to refresh.');
        }
    }

    public getPhoneTaskScreen(): TaskAppScreen {
        if (this._phoneHUDInstance && this._phoneHUDInstance.taskAppScreen) {
            return this._phoneHUDInstance.taskAppScreen;
        } else {
            this._log.warn('Phone Task Screen is not available.');
            return null;
        }
    }

    private async _debugValidate() {
        // Get all Dialogue Ids
        const dialogueSets = this._app.Services.UIOverlayService.getDialogueSets();
        const dialogueIds: string[] = Array.from(dialogueSets.keys());
        this._taskManager.debugValidate(this._app.getAppConfig().itemConfig, dialogueIds, this.Rooms);
    }

    hideDinerHUD() {
        this._dinerHUDView.setHUDState(DinerHUDState.Hidden);
    }

    showDinerHUD() {
        this._dinerHUDView.setHUDState(DinerHUDState.Shown);
    }
}
