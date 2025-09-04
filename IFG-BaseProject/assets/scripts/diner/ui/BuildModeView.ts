import { _decorator, Button, CCString, Component, EventTouch, Input, input, instantiate, Node, Prefab } from 'cc';
import { SoundManager } from '../../audio/SoundManager';
import { Currency } from '../../core/enums/Currency';
import { Requirement } from '../../core/model/requirements/Requirement';
import { logger } from '../../logging';
import { ICardScrambleService } from '../../services/ICardScrambleService';
import { IDebugService } from '../../services/IDebugService';
import { RequirementsService } from '../../services/RequirementsService';
import { TutorialService } from '../../services/TutorialService';
import { UIOverlayService } from '../../services/UIOverlayService';
import { DinerCameraController } from '../DinerCameraController';
import { DinerSceneController } from '../DinerSceneController';
import { IDinerNode } from '../IDinerNode';
import { PropCatalogue } from '../PropCatalogue';
import { PropInstanceData } from '../PropInstanceData';
import { Room } from '../Room';
import { PropData } from '../models/PropData';
import { DinerNodeButton } from './DinerNodeButton';
import { PropSelectorView } from './PropSelectorView';
import { ResourceWidget } from './ResourceWidget';
import { RoomSelectorView } from './RoomSelectorView';
const { ccclass, property } = _decorator;

export class BuildModeTaskContext {
    public RoomId: string | null = null;
    public NodeId: string | null = null;
    public PropTags: string[] = [];
}

@ccclass('BuildModeView')
export class BuildModeView extends Component {
    public OnExitButtonPressed: () => void;

    @property({ type: Button, visible: true })
    public _exitButton: Button;

    @property({ type: RoomSelectorView, visible: true })
    private _roomSelectorView: RoomSelectorView;

    @property({ type: PropSelectorView, visible: true })
    private _propSelectorView: PropSelectorView;

    @property({ type: ResourceWidget, visible: true })
    private _normalCurrencyResourceWidget: ResourceWidget;

    @property({ type: ResourceWidget, visible: true })
    private _premiumCurrencyResourceWidget: ResourceWidget;

    @property({ type: ResourceWidget, visible: true })
    private _starsResourceWidget: ResourceWidget;

    @property({ type: Prefab, visible: true })
    private _nodeButtonPrefab: Prefab;

    @property({ type: CCString, visible: true })
    private _menuId: string;

    private _dinerSceneController: DinerSceneController;
    private _dinerCameraController: DinerCameraController;
    private _propCatalogue: PropCatalogue;
    private _cardScrambleService: ICardScrambleService;
    private _requirementsService: RequirementsService;

    private _rooms: Room[] = [];
    private _fakeRooms: Room[] = [];
    private _nodeButtonParent: Node;
    private _nodeButtons: Node[] = [];
    private _currentRoomIndex: number = 0;
    private _buildModeTaskContext: BuildModeTaskContext = null;
    private _debugService: IDebugService;

    private _log = logger.child('BuildModeView');

    private _onTeardownCallback: () => void;

    protected start() {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    protected update(deltaTime: number) {}

    protected onDestroy() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    public init(
        onGoToRoomButtonPressed: (roomIndex: number) => void,
        onSwapPropButtonPressed: () => void,
        dinerSceneController: DinerSceneController,
        rooms: Room[],
        fakeRooms: Room[],
        nodeButtonParent: Node,
        dinerCameraController: DinerCameraController,
        requirementsService: RequirementsService,
        uiOverlayService: UIOverlayService,
        cardScrambleService: ICardScrambleService,
        tutorialService: TutorialService,
        debugService: IDebugService,
        catalogue: PropCatalogue,
        startRoomIndex: number,
        buildModeContext: BuildModeTaskContext = null
    ) {
        this._dinerSceneController = dinerSceneController;
        this._dinerCameraController = dinerCameraController;
        this._propCatalogue = catalogue;
        this._cardScrambleService = cardScrambleService;
        this._requirementsService = requirementsService;
        this._debugService = debugService;
        this._rooms = rooms;
        this._fakeRooms = fakeRooms;
        this._nodeButtonParent = nodeButtonParent;
        this._currentRoomIndex = startRoomIndex;
        this._buildModeTaskContext = buildModeContext;

        if (this._buildModeTaskContext) {
            const roomIndex = this._getRoomIndexByRoomId(this._buildModeTaskContext.RoomId);
            if (roomIndex < 0) {
                // Unrecognized room Id, clear out build mode task context to prevent user getting stuck doing an impossible task
                this._log.warn('BuildModeView unknown room ', { context: this._buildModeTaskContext });
                this._buildModeTaskContext = null;
            } else {
                this._currentRoomIndex = roomIndex;
            }
        }

        const taskContextDoesNotExist = this._buildModeTaskContext == null;

        this._exitButton.node.on(Button.EventType.CLICK, this._onExitButtonPressed, this);
        this._exitButton.node.active = taskContextDoesNotExist;

        this._roomSelectorView.OnGoToRoomButtonPressed = (index) => {
            onGoToRoomButtonPressed(index);
            this._onRoomChange(index);
        };
        this._roomSelectorView.init(rooms, this._currentRoomIndex);
        this._roomSelectorView.setEnabled(taskContextDoesNotExist);

        this._propSelectorView.OnSwapProp = () => {
            onSwapPropButtonPressed();
            this._onPropSwapped();
        };
        this._propSelectorView.init(
            this._dinerSceneController,
            this._cardScrambleService,
            this._propCatalogue,
            requirementsService,
            uiOverlayService
        );

        this._propSelectorView.node.active = false;

        this._starsResourceWidget.init();
        this._normalCurrencyResourceWidget.init();
        this._premiumCurrencyResourceWidget.init();
        // TODO GEM ICON: needs to get updated here
        this._updateCurrencyWidgetCounts();

        this._normalCurrencyResourceWidget.disableGetMore();
        this._premiumCurrencyResourceWidget.disableGetMore();

        let onCurrencyUpdatedCallback = this._updateCurrencyWidgetCounts.bind(this);

        this._cardScrambleService.registerOnCurrencyUpdateEventCallback(onCurrencyUpdatedCallback);

        this._onTeardownCallback = () => {
            this._cardScrambleService.unregisterOnCurrencyUpdateEventCallback(onCurrencyUpdatedCallback);
        };

        if (this._menuId && this._menuId !== '') {
            tutorialService.onMenuOpened(this._menuId);
        }

        SoundManager.instance.playSound('SFX_BuildMode_RoomSwitch');
    }

    public setCurrentRoomTitle(title: string) {
        this._roomSelectorView.setCurrentRoomTitle(title);
    }

    public createNewNodeButton(dinerNode: IDinerNode) {
        if (this._buildModeTaskContext && dinerNode.getData().id !== this._buildModeTaskContext.NodeId) {
            return;
        }

        let buttonPrefab = instantiate(this._nodeButtonPrefab);
        this._nodeButtons.push(buttonPrefab);

        let button = buttonPrefab.getComponent(DinerNodeButton);
        button.init(dinerNode, this._nodeButtonParent);
        button.OnNodeButtonPressed = this._onNodeSelected.bind(this, dinerNode);

        // Select the node automatically if we have a build mode context
        if (this._buildModeTaskContext) {
            this._onNodeSelected(dinerNode);
        }
    }

    private _updateCurrencyWidgetCounts() {
        if (!this._cardScrambleService) {
            return;
        }

        this._cardScrambleService.getCurrencyBalances().then((currencyBalances) => {
            try {
                currencyBalances.forEach((currencyBalance) => {
                    switch (currencyBalance.currency) {
                        case Currency.Stars:
                            this._starsResourceWidget.setResourceCounter(currencyBalance.amount - this._dinerSceneController.getStarsWithheld());
                            break;
                        case Currency.Coins:
                            this._normalCurrencyResourceWidget.setResourceCounter(currencyBalance.amount);
                            break;
                        case Currency.Gems:
                            this._premiumCurrencyResourceWidget.setResourceCounter(currencyBalance.amount);
                            break;
                    }
                });
            } catch (err) {
                this._log.error(err);
            }
        });
    }

    public clearAllNodeButtons() {
        this._nodeButtons.forEach((button) => {
            button.destroy();
        });
        this._nodeButtons = [];
    }

    public registerPropSwappedEventCallback(func: () => void) {
        this._propSelectorView.PropSwappedEvent.subscribe(func);
    }

    public unregisterPropSwappedEventCallback(func: () => void) {
        this._propSelectorView.PropSwappedEvent.unsubscribe(func);
    }

    private _onExitButtonPressed() {
        this._propSelectorView.hide(() => {
            this._propSelectorView.cleanupForNextUsage();

            this._onTeardownCallback?.call(this);

            this.clearAllNodeButtons();
            this._rooms.forEach(this._resetRoom);
            this._rooms.forEach(this._lightRoom);
            this._fakeRooms.forEach(this._resetRoom);
            this._fakeRooms.forEach(this._lightRoom);

            // For launch, always reveal the dining room when build mode is exited...
            this._rooms[this._getRoomIndexByRoomId('dining-room')].revealToCamera();

            this.OnExitButtonPressed?.call(this);
        });
    }

    private onTouchEnd(event: EventTouch) {
        //TODO: Figure out if the click position was somewhere outside of the _propSelectorView, fire an event to hide the view and end any prop preview on the node.
    }

    private _onRoomChange(index: number) {
        SoundManager.instance.playSound('SFX_BuildMode_RoomSwitch');
        this._currentRoomIndex = index;

        this._propSelectorView.switch();

        var room = this._rooms[index];

        this.clearAllNodeButtons();
        this.setCurrentRoomTitle(room.RoomName);

        const isUnlocked = this._cardScrambleService.isRoomUnlocked(room.RoomId);

        if (isUnlocked) {
            room.DinerNodes.forEach((dinerNode: IDinerNode) => {
                const reqsMet = this._reqsMet(dinerNode.getRequirements());

                let involvedInCurrentTaskContext: boolean = false;

                if (this._buildModeTaskContext) {
                    involvedInCurrentTaskContext = dinerNode.getData().id === this._buildModeTaskContext.NodeId;
                }

                const nodeVisible = reqsMet || involvedInCurrentTaskContext;

                if (!nodeVisible) {
                    return;
                }
                this.createNewNodeButton(dinerNode);
            });
        }

        this._rooms.forEach(this._resetRoom);
        this._rooms.forEach(this._dimRoom);
        this._fakeRooms.forEach(this._resetRoom);
        this._fakeRooms.forEach(this._dimRoom);

        this._dinerCameraController.onSnapCameraToPosition(room.CameraSnapPoint.worldPosition);
        room.revealToCamera();
        room.light();
        room.OnFocus?.call(room);
    }

    private _onNodeSelected(dinerNode: IDinerNode) {
        //Set up the Prop Selector View...
        this._propSelectorView.cleanupForNextUsage();

        this._propSelectorView.setSelectedDinerNode(dinerNode);

        this._propSelectorView.show();

        //Find all valid props for this node from the catalogue...
        const validProps = this._propCatalogue.getAllPropsWithTags(dinerNode.getTags());

        const taskContextDoesNotExist = this._buildModeTaskContext == null;

        let visibleProps: PropInstanceData[];

        if (taskContextDoesNotExist) {
            //Outside of the task context, we need to hide props based on their visibility requirements...
            visibleProps = validProps.filter((propInstanceData) => this._reqsMet(propInstanceData.data.visibilityRequirements));
        } else {
            //With a task context, we only want to hide props that are invalid for this task...
            visibleProps = validProps.filter((propInstanceData) => this._getPropValidForBuildTaskContext(propInstanceData));
        }

        if (!dinerNode.getIsStatic()) {
            //Create an entry for the "none" option if the node isn't static.
            this._propSelectorView.createNewPropEntry(null, taskContextDoesNotExist);
        }

        //Create prop entries for each visible prop...
        visibleProps.forEach((propInstanceData) => {
            this._propSelectorView.createNewPropEntry(propInstanceData, taskContextDoesNotExist);
        });
    }

    private _onPropSwapped() {
        // The build mode context will only allow swapping specific props, so on prop swap, we can exit here
        if (this._buildModeTaskContext) {
            this._onExitButtonPressed();
        }
    }

    private _getRoomIndexByRoomId(roomId: string) {
        let roomIndex = -1;
        this._rooms.forEach((room, index) => {
            if (room.RoomId === roomId) {
                roomIndex = index;
            }
        });
        return roomIndex;
    }

    private _getPropValidForBuildTaskContext(propInstanceData: PropInstanceData) {
        if (this._buildModeTaskContext == null) {
            return true;
        }

        return PropData.validateProp(propInstanceData.data.tags, this._buildModeTaskContext.PropTags);
    }

    private _reqsMet(reqs: Requirement[]): boolean {
        return this._debugService.isCheatActive('allDecorationsUnlocked') || this._requirementsService.checkRequirementsMet(reqs);
    }

    private _resetRoom(room: Room) {
        room.reset();
    }

    private _dimRoom(room: Room) {
        room.dim();
    }

    private _lightRoom(room: Room) {
        room.light();
    }
}
