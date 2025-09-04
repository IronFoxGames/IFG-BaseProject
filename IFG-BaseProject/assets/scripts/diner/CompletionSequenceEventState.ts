import { Event } from '../core/Event';
import { IDinerService } from '../services/IDinerService';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { UIOverlayService } from '../services/UIOverlayService';
import { CompletionSequenceEvent } from './CompletionSequenceEvent';
import { CompletionSequenceEventType } from './CompletionSequenceEventType';
import { DialogueCompletionSequenceEvent } from './DialogueCompletionSequenceEvent';
import { InteractableCompletionSequenceEvent } from './InteractableCompletionSequenceEvent';
import { TaskInteractableState } from './TaskInteractable';
import { FocusCompletionSequenceEvent } from './FocusCompletionSequenceEvent';
import { BuildModeTaskContext } from './ui/BuildModeView';
import { PlacePropCompletionSequenceEvent } from './PlacePropCompletionSequenceEvent';
import { PropSwappedEventData } from '../core/model/PropSwappedEventData';
import { ForceSwapPropsCompletionSequenceEvent } from './ForceSwapPropsCompletionSequenceEvent';
import { UnlockRoomCompletionSequenceEvent } from './UnlockRoomCompletionSequenceEvent';
import { logger } from '../logging';
import { PopupLayout, PopupResult, PopupType } from '../game/ui/GeneralPopup';
import { EndgamePopUpCompletionSequenceEvent } from './EndgamePopUpCompletionSequenceEvent';
import { NoneCompletionSequenceEvent } from './NoneCompletionSequenceEvent';
import { NoneCompletionSequenceEventData } from './models/NoneCompletionSequenceEventData';

export class CompletionSequenceEventState {
    private _event: CompletionSequenceEvent;
    private _cardScrambleService: ICardScrambleService;
    private _uiOverlayService: UIOverlayService;
    private _dinerService: IDinerService;

    private _eventType: CompletionSequenceEventType;
    private _completionCriteriaMet: boolean = false;

    private _log = logger.child('CompletionSequenceEventState');

    constructor(
        event: CompletionSequenceEvent,
        cardScrambleService: ICardScrambleService,
        uiOverlayService: UIOverlayService,
        dinerService: IDinerService
    ) {
        if (!event) {
            this._log.error('CompletionSequenceEventState: event is null or undefined, using None event fallback.');
            event = new NoneCompletionSequenceEvent(new NoneCompletionSequenceEventData(CompletionSequenceEventType.None));
        }

        this._event = event;
        this._cardScrambleService = cardScrambleService;
        this._uiOverlayService = uiOverlayService;
        this._dinerService = dinerService;
        this._eventType = event.getType();
        this._completionCriteriaMet = false;
    }

    public begin() {
        switch (this._eventType) {
            case CompletionSequenceEventType.Dialogue: {
                this._dinerService.closeTaskAppScreen();
                this._uiOverlayService.showNarrativeSequence(
                    (this._event as DialogueCompletionSequenceEvent).eventData.dialogueId,
                    () => {
                        this._completionCriteriaMet = true;
                    },
                    false
                );
                break;
            }
            case CompletionSequenceEventType.FocusOnItem: {
                const data = (this._event as FocusCompletionSequenceEvent).eventData;
                this._dinerService.closeTaskAppScreen();

                this._dinerService.setCutsceneActive(true);
                this._dinerService.focusOnSpawnPointWithFocusItem(data.roomId, data.spawnId);

                break;
            }
            case CompletionSequenceEventType.InteractableItems: {
                const data = (this._event as InteractableCompletionSequenceEvent).eventData;
                this._dinerService.closeTaskAppScreen();

                const iconItem = this._cardScrambleService.getItem(data.iconId);
                if (!iconItem) {
                    this._log.error(`No icon found for id: ${data.iconId}`);
                }

                let spritePath = null;
                if (!iconItem.sprite) {
                    this._log.error(`No sprite path found for icon id: ${data.iconId}`);
                } else {
                    spritePath = iconItem.sprite;
                }

                for (const spawnId of data.spawnIds) {
                    this._dinerService.makeInteractableInSpawnPointInteractable(data.roomId, spawnId, spritePath, () => {
                        const spawnPoint = this._dinerService.getNextSpawnPointWithActiveInteractable(data.roomId);
                        if (spawnPoint !== null) {
                            this._dinerService.focusOnSpawnPointWithInteractableItem(data.roomId, spawnPoint.id);
                        }
                    });
                }

                this._dinerService.setDinerHUDActive(false);

                this._dinerService.focusOnSpawnPointWithInteractableItem(data.roomId, data.spawnIds[0]);

                break;
            }
            case CompletionSequenceEventType.PlaceProp: {
                const data = (this._event as PlacePropCompletionSequenceEvent).eventData;
                this._dinerService.closeTaskAppScreen();

                let context = new BuildModeTaskContext();

                context.NodeId = data.nodeId;
                context.RoomId = data.roomId;
                context.PropTags = data.propTags;

                this._dinerService.enterBuildModeWithTaskContext(context, () => {
                    this._completionCriteriaMet = true;
                });

                this._dinerService.focusOnNode(data.roomId, data.nodeId, () => {});

                break;
            }
            case CompletionSequenceEventType.ForceSwapProps: {
                const data = (this._event as ForceSwapPropsCompletionSequenceEvent).eventData;
                this._dinerService.closeTaskAppScreen();

                this._dinerService.forceSwapPropsInLocations(data.locationAndPropIds).then(() => {
                    this._completionCriteriaMet = true;
                });

                break;
            }
            case CompletionSequenceEventType.UnlockRoom: {
                const data = (this._event as UnlockRoomCompletionSequenceEvent).eventData;
                this._dinerService.closeTaskAppScreen();

                this._dinerService.setCutsceneActive(true);
                this._dinerService.focusOnRoomAndUnlock(data.roomId, () => {
                    this._completionCriteriaMet = true;
                });

                break;
            }
            case CompletionSequenceEventType.EndGamePopUp: {
                const data = (this._event as EndgamePopUpCompletionSequenceEvent).eventData;
                this._dinerService.closeTaskAppScreen();

                this._uiOverlayService.showGeneralPopup(
                    PopupType.OK_Other,
                    data.title,
                    data.message,
                    data.spritePath,
                    (result) => {
                        this._completionCriteriaMet = true;
                        if (result === PopupResult.Other) {
                            this._dinerService.openQuickPlay();
                        }
                    },
                    PopupLayout.Horizontal,
                    'Okay',
                    null,
                    'Quick Play'
                );
                break;
            }
            case CompletionSequenceEventType.None: {
                this._completionCriteriaMet = true;
                break;
            }
            default: {
                this._log.error(`Attempted to begin a Completion Sequence Event with an unsupported type: ${this._eventType}`);
                break;
            }
        }
    }

    public tick() {
        switch (this._eventType) {
            case CompletionSequenceEventType.Dialogue: {
                //No op!
                break;
            }
            case CompletionSequenceEventType.FocusOnItem: {
                const data = (this._event as FocusCompletionSequenceEvent).eventData;

                if (this._dinerService.getStateOfFocusInSpawnPoint(data.roomId, data.spawnId)) {
                    this._completionCriteriaMet = true;
                }

                break;
            }
            case CompletionSequenceEventType.InteractableItems: {
                const data = (this._event as InteractableCompletionSequenceEvent).eventData;

                let requiredInteractions = data.spawnIds.length;

                let interactionCount = 0;

                for (const spawnId of data.spawnIds) {
                    interactionCount +=
                        this._dinerService.getStateOfInteractableInSpawnPoint(data.roomId, spawnId) === TaskInteractableState.InteractedWith
                            ? 1
                            : 0;
                }

                if (interactionCount >= requiredInteractions) {
                    this._completionCriteriaMet = true;
                }

                break;
            }
            case CompletionSequenceEventType.PlaceProp: {
                //No op!
                break;
            }
            case CompletionSequenceEventType.UnlockRoom: {
                //No op!
                break;
            }
            case CompletionSequenceEventType.ForceSwapProps: {
                //No op!
                break;
            }
            case CompletionSequenceEventType.EndGamePopUp: {
                //No op!
                break;
            }
            case CompletionSequenceEventType.None: {
                //No op!
                break;
            }
            default: {
                this._log.error('Attempted to tick a Completion Sequence Event with an unsupported type...');
                break;
            }
        }
    }

    public complete(onSequenceCompletedEvent: Event) {
        switch (this._eventType) {
            case CompletionSequenceEventType.Dialogue: {
                onSequenceCompletedEvent.subscribe(() => {
                    this._cardScrambleService.onDialogueSeen((this._event as DialogueCompletionSequenceEvent).eventData.dialogueId);
                });
                break;
            }
            case CompletionSequenceEventType.FocusOnItem: {
                onSequenceCompletedEvent.subscribe(() => {
                    const data = (this._event as FocusCompletionSequenceEvent).eventData;

                    this._dinerService.clearItemInSpawnPoint(data.roomId, data.spawnId);

                    this._dinerService.setCutsceneActive(false);
                });
                break;
            }
            case CompletionSequenceEventType.InteractableItems: {
                onSequenceCompletedEvent.subscribe(() => {
                    const data = (this._event as InteractableCompletionSequenceEvent).eventData;

                    for (const spawnId of data.spawnIds) {
                        this._dinerService.clearItemInSpawnPoint(data.roomId, spawnId);
                    }
                    this._dinerService.setDinerHUDActive(true);
                });
                break;
            }
            case CompletionSequenceEventType.PlaceProp: {
                onSequenceCompletedEvent.subscribe(() => {
                    const data = (this._event as PlacePropCompletionSequenceEvent).eventData;

                    let propId = this._dinerService.getPropIdInNode(data.nodeId);
                    this._cardScrambleService.onPropSwapped(data.nodeId, new PropSwappedEventData(propId));
                });
                break;
            }
            case CompletionSequenceEventType.ForceSwapProps: {
                onSequenceCompletedEvent.subscribe(() => {
                    const data = (this._event as ForceSwapPropsCompletionSequenceEvent).eventData;

                    for (const ids of data.locationAndPropIds) {
                        this._cardScrambleService.onPropSwapped(ids.nodeId, new PropSwappedEventData(ids.propId));
                    }
                });
                break;
            }
            case CompletionSequenceEventType.UnlockRoom: {
                onSequenceCompletedEvent.subscribe(() => {
                    const data = (this._event as UnlockRoomCompletionSequenceEvent).eventData;

                    this._cardScrambleService.unlockRoom(data.roomId);

                    this._dinerService.setCutsceneActive(false);
                });
                break;
            }
            case CompletionSequenceEventType.EndGamePopUp: {
                this._dinerService.setCutsceneActive(false);
                break;
            }
            case CompletionSequenceEventType.None: {
                const taskAppScreen = this._dinerService.getTaskAppScreen();

                let taskListUpdatedCallback = () => {
                    this._dinerService.refreshTaskAppScreen();
                    taskAppScreen.enableAllEntriesAndCloseButton();

                    this._dinerService.unregisterActiveTaskListUpdatedCallback(taskListUpdatedCallback);
                };

                this._dinerService.registerActiveTaskListUpdatedCallback(taskListUpdatedCallback);
                break;
            }
            default: {
                this._log.error('Attempted to complete a Completion Sequence Event with an unsupported type...');
                break;
            }
        }
    }

    public completionCriteriaMet(): boolean {
        return this._completionCriteriaMet;
    }
}
