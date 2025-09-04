import { SoundManager } from '../audio/SoundManager';
import { TaskConfig } from '../config/TaskConfig';
import { RoomAndNodeAndProp } from '../core/model/RoomAndNodeAndProp';
import { DinerSceneController } from '../diner/DinerSceneController';
import { IDinerNode } from '../diner/IDinerNode';
import { Room } from '../diner/Room';
import { TaskInteractableState } from '../diner/TaskInteractable';
import { TaskItemSpawnPoint } from '../diner/TaskItemSpawnPoint';
import { BuildModeTaskContext } from '../diner/ui/BuildModeView';
import { logger } from '../logging';
import { TaskAppScreen } from '../ui/TaskAppScreen';
import { IDinerService } from './IDinerService';

export class DinerService implements IDinerService {
    private _sceneController: DinerSceneController;
    private _log = logger.child('DinerService');

    async initialize(): Promise<void> {}

    registerSceneControllerInstance(sceneController: DinerSceneController) {
        this._sceneController = sceneController;
    }

    unregisterSceneControllerInstance() {
        this._sceneController = null;
    }

    getPropIdInNode(nodeId: string): string {
        if (this._sceneController !== null) {
            //TODO: This seems a little cursed, we can probably find a better way to do this?
            const dinerRoom = this._sceneController.Rooms.find((room: Room) =>
                room.DinerNodes.find((node: IDinerNode) => node.getData().id === nodeId)
            );

            const dinerNode: IDinerNode = dinerRoom.DinerNodes.find((node: IDinerNode) => node.getData().id === nodeId);

            if (dinerNode === null) {
                this._log.warn(`No node found with id: ${nodeId}`);
                return '';
            } else {
                const propData = dinerNode.getCurrentPropData();
                if (propData) {
                    return propData.id;
                } else {
                    this._log.warn(`Node with id: ${nodeId} has no prop`);
                    return '';
                }
            }
        } else {
            this._log.error(`Attempted to get a prop id in node ${nodeId} with no DinerSceneController registered.`);
            return '';
        }
    }

    getStateOfInteractableInSpawnPoint(roomId: string, spawnId: string): TaskInteractableState {
        if (this._sceneController !== null) {
            return this._sceneController.getRoom(roomId).getItemSpawnPoint(spawnId).getCurrentInteractableState();
        } else {
            this._log.error(
                `Attempted to get an interactable item's state in room ${roomId} at spawn point ${spawnId} with no DinerSceneController registered.`
            );
            return TaskInteractableState.Uninteractable;
        }
    }

    getStateOfFocusInSpawnPoint(roomId: string, spawnId: string): boolean {
        if (this._sceneController !== null) {
            return this._sceneController.getRoom(roomId).getItemSpawnPoint(spawnId).getCurrentFocusState();
        } else {
            this._log.error(
                `Attempted to get a focus item's state in room ${roomId} at spawn point ${spawnId} with no DinerSceneController registered.`
            );
            return false;
        }
    }

    getNextSpawnPointWithActiveInteractable(roomId: string): TaskItemSpawnPoint {
        if (this._sceneController !== null) {
            return this._sceneController.getRoom(roomId).getNextInteractableSpawnPoint();
        } else {
            this._log.error(
                `Attempted to get the next spawn point with an active interactable in room ${roomId} with no DinerSceneController registered.`
            );
            return null;
        }
    }

    getTaskItemSpritePath(itemId: string): string {
        if (this._sceneController !== null) {
            return this._sceneController.getTaskItemSpritePath(itemId);
        } else {
            this._log.error(`Attempted to get a path to sprite ${itemId} with no DinerSceneController registered.`);
            return '';
        }
    }

    isPropTaggedInNode(tag: string, nodeId: string): boolean {
        if (this._sceneController !== null) {
            let dinerNode: IDinerNode = undefined;

            for (const room of this._sceneController.Rooms) {
                if (!room.DinerNodes) {
                    continue;
                }

                dinerNode = room.DinerNodes.find((node: IDinerNode) => node.getData().id === nodeId);

                if (dinerNode != undefined) {
                    break;
                }
            }

            if (dinerNode === undefined) {
                this._log.warn(`No node found with id: ${nodeId}`);
                return false;
            } else {
                const propData = dinerNode.getCurrentPropData();
                if (propData) {
                    return propData.tags.includes(tag);
                } else {
                    this._log.warn(`Node with id: ${nodeId} has no prop`);
                    return false;
                }
            }
        } else {
            this._log.error(`Attempted to get a prop's tag in node ${nodeId} with no DinerSceneController registered.`);
            return false;
        }
    }

    registerPropSwappedEventCallback(func: () => void) {
        if (this._sceneController !== null) {
            this._sceneController.registerPropSwappedEventCallback(func);
        } else {
            this._log.error(`Attempted to register a callback to OnSwapButtonPressed with no DinerSceneController registered.`);
        }
    }

    unregisterPropSwappedEventCallback(func: () => void) {
        if (this._sceneController !== null) {
            this._sceneController.unregisterPropSwappedEventCallback(func);
        } else {
            this._log.error(`Attempted to unregister a callback from OnSwapButtonPressed with no DinerSceneController registered.`);
        }
    }

    registerTaskListOpenedEventCallback(func: () => void) {
        if (this._sceneController !== null) {
            this._sceneController.registerTaskListOpenedEventCallback(func);
        } else {
            this._log.error(`Attempted to register a callback to OnTaskListOpened with no DinerSceneController registered.`);
        }
    }

    unregisterTaskListOpenedEventCallback(func: () => void) {
        if (this._sceneController !== null) {
            this._sceneController.unregisterTaskListOpenedEventCallback(func);
        } else {
            this._log.error(`Attempted to unregister a callback from OnTaskListOpened with no DinerSceneController registered.`);
        }
    }

    registerActiveTaskListUpdatedCallback(func: () => void) {
        if (this._sceneController !== null) {
            this._sceneController.registerActiveTaskListUpdatedCallback(func);
        } else {
            this._log.error(`Attempted to register a callback to ActiveTaskListUpdated with no DinerSceneController registered.`);
        }
    }

    unregisterActiveTaskListUpdatedCallback(func: () => void) {
        if (this._sceneController !== null) {
            this._sceneController.unregisterActiveTaskListUpdatedCallback(func);
        } else {
            this._log.error(`Attempted to unregister a callback from ActiveTaskListUpdated with no DinerSceneController registered.`);
        }
    }

    setCutsceneActive(active: boolean) {
        if (this._sceneController !== null) {
            this._sceneController.DinerCameraController.setCutseneActive(active);
        } else {
            this._log.error(`Attempted to set cutscene active with no DinerSceneController registered.`);
        }
    }

    setDinerHUDActive(active: boolean) {
        if (this._sceneController !== null) {
            if (active) {
                this._sceneController.showDinerHUD();
            } else {
                this._sceneController.hideDinerHUD();
            }
        } else {
            this._log.error(`Attempted to hide the diner HUD with no DinerSceneController registered.`);
        }
    }

    clearAllSpawnPoints() {
        if (this._sceneController !== null) {
            for (const room of this._sceneController.Rooms) {
                room.clearAllSpawnPoints();
            }
        } else {
            this._log.error(`Attempted to clear all spawn points with no DinerSceneController registered.`);
        }
    }

    spawnInteractableInSpawnPoint(roomId: string, spawnId: string, itemId: string) {
        if (this._sceneController !== null) {
            const spritePath = this._sceneController.getTaskItemSpritePath(itemId);
            this._sceneController.getRoom(roomId).getItemSpawnPoint(spawnId).instanceInteractacbleItem(spritePath);
        } else {
            this._log.error(
                `Attempted to spawn an interactable item with sprite ${itemId} in room ${roomId} at spawn point ${spawnId} with no DinerSceneController registered.`
            );
        }
    }

    makeInteractableInSpawnPointInteractable(roomId: string, spawnId: string, spritePath: string, onInteractedWith: () => void) {
        if (this._sceneController !== null) {
            this._sceneController
                .getRoom(roomId)
                .getItemSpawnPoint(spawnId)
                .makeCurrentInteractableItemInteractable(spritePath, onInteractedWith);
        } else {
            this._log.error(
                `Attempted to make an interactable item in room ${roomId} at spawn point ${spawnId} interactable with no DinerSceneController registered.`
            );
        }
    }

    spawnFocusInSpawnPoint(roomId: string, spawnId: string, itemId: string) {
        if (this._sceneController !== null) {
            let spritePath = this._sceneController.getTaskItemSpritePath(itemId);
            this._sceneController.getRoom(roomId).getItemSpawnPoint(spawnId).instanceFocusItem(spritePath);
        } else {
            this._log.error(
                `Attempted to spawn a focus item with sprite ${itemId} in room ${roomId} at spawn point ${spawnId} with no DinerSceneController registered.`
            );
        }
    }

    focusOnSpawnPointWithFocusItem(roomId: string, spawnId: string) {
        if (this._sceneController !== null) {
            let spawnPoint = this._sceneController.getRoom(roomId).getItemSpawnPoint(spawnId);
            this._sceneController.DinerCameraController.tweenCameraToPosition(spawnPoint.node.worldPosition, () => {
                spawnPoint.makeCurrentFocusItemFocused();
            });
        } else {
            this._log.error(`Attempted to focus on spawn point ${spawnId} in room ${roomId} with no DinerSceneController registered.`);
        }
    }

    focusOnSpawnPointWithInteractableItem(roomId: string, spawnId: string) {
        if (this._sceneController !== null) {
            let spawnPoint = this._sceneController.getRoom(roomId).getItemSpawnPoint(spawnId);
            this._sceneController.DinerCameraController.tweenCameraToPosition(spawnPoint.node.worldPosition, () => {}, 0.5, 0);
        } else {
            this._log.error(`Attempted to focus on spawn point ${spawnId} in room ${roomId} with no DinerSceneController registered.`);
        }
    }

    focusOnRoomAndUnlock(roomId: string, func: () => void) {
        if (this._sceneController !== null) {
            let room = this._sceneController.getRoom(roomId);
            this._sceneController.DinerCameraController.tweenCameraToPosition(room.CameraSnapPoint.worldPosition, () => {
                SoundManager.instance.playSound('SFX_Diner_RoomUnlock');
                this._sceneController.playRoomUnlockAnimation(roomId, () => {
                    room.unlock(func);
                });
            });
        } else {
            this._log.error(`Attempted to focus on room ${roomId} and unlock it with no DinerSceneController registered.`);
        }
    }

    async focusOnRoom(roomId: string, onComplete: () => void): Promise<void> {
        if (this._sceneController !== null) {
            const room = this._sceneController.getRoom(roomId);
            if (!room) {
                this._log.error(`Room with ID ${roomId} not found.`);
                onComplete();
                return;
            }

            await new Promise<void>((resolve) => {
                this._sceneController.DinerCameraController.tweenCameraToPosition(room.CameraSnapPoint.worldPosition, () => {
                    resolve();
                    onComplete();
                });
            });
        } else {
            this._log.error(`Attempted to focus on room ${roomId} with no DinerSceneController registered.`);
        }
    }

    async focusOnNode(roomId: string, nodeId: string, onComplete: () => void): Promise<void> {
        if (this._sceneController !== null) {
            const room = this._sceneController.getRoom(roomId);
            if (!room) {
                this._log.error(`Room with ID ${roomId} not found.`);
                onComplete();
                return;
            }

            //Find the node by name in the hierarchy, it is always one of th nodes inside the /Nodes node child of the room node
            const roomNode = room.getDinerNode(nodeId);

            if (!roomNode) {
                this._log.error(`Node with ID ${nodeId} not found in room ${roomId}.`);
                onComplete();
                return;
            }

            await new Promise<void>((resolve) => {
                this._sceneController.DinerCameraController.tweenCameraToPosition(roomNode.getCameraSnapPointPosition(), () => {
                    resolve();
                    onComplete();
                });
            });
        }
    }

    async forceSwapPropsInLocations(locationAndPropIds: RoomAndNodeAndProp[]) {
        if (this._sceneController !== null) {
            for (const lpi of locationAndPropIds) {
                await this._sceneController
                    .getRoom(lpi.roomId)
                    .getDinerNode(lpi.nodeId)
                    .swapToProp(this._sceneController.getPropFromCatalogue(lpi.propId), false);
            }
        } else {
            this._log.error(`Attempted to force swap props with no DinerSceneController registered.`);
        }
    }

    shakeCamera(duration, intensity, onComplete: () => void) {
        if (this._sceneController !== null) {
            this._sceneController.DinerCameraController.shakeCamera(duration, intensity, () => {
                onComplete();
            });
        } else {
            this._log.error(`Attempted to shake the camera with no DinerSceneController registered.`);
        }
    }

    openQuickPlay() {
        if (this._sceneController !== null) {
            this._sceneController.openQuickPlay();
        } else {
            this._log.error(`Attempted to open quick play with no DinerSceneController registered.`);
        }
    }

    isSpawnPointOccupied(roomId: string, spawnId: string): boolean {
        if (this._sceneController !== null) {
            return this._sceneController.getRoom(roomId).getItemSpawnPoint(spawnId).isOccupied;
        } else {
            this._log.error(
                `Attempted to check if spawn point ${spawnId} in room ${roomId} was occupied with no DinerSceneController registered.`
            );
            return false;
        }
    }

    clearItemInSpawnPoint(roomId: string, spawnId: string) {
        if (this._sceneController !== null) {
            this._sceneController.getRoom(roomId).getItemSpawnPoint(spawnId).clearCurrentItem();
        } else {
            this._log.error(`Attempted to clear an item in room ${roomId} at spawn point ${spawnId} with no DinerSceneController registered.`);
        }
    }

    enterBuildModeWithTaskContext(context: BuildModeTaskContext, onSwapPropButtonPressedCallback: () => void) {
        if (this._sceneController !== null) {
            this._sceneController.enterBuildModeWithContext(context, onSwapPropButtonPressedCallback);
        } else {
            this._log.error(`Attempted to enter build mode with context: ${context} with no DinerSceneController registered.`);
        }
    }

    setStarsWithheld(stars: number) {
        if (this._sceneController !== null) {
            this._sceneController.setStarsWitheld(stars);
        } else {
            this._log.error(`Attempted to set "_starsWithheld" with no DinerSceneController registered.`);
        }
    }

    getStarsWithheld(): number {
        if (this._sceneController !== null) {
            return this._sceneController.getStarsWithheld();
        } else {
            this._log.error(`Attempted to get "_starsWithheld" with no DinerSceneController registered.`);
            return 0;
        }
    }

    registerStarsWithheldEventCallback(func: () => void) {
        if (this._sceneController !== null) {
            this._sceneController.registerStarsWithheldEventCallback(func);
        } else {
            this._log.error(`Attempted to register a callback to OnStarsWithheld with no DinerSceneController registered.`);
        }
    }

    unregisterStarsWithheldEventCallback(func: () => void) {
        if (this._sceneController !== null) {
            this._sceneController.unregisterStarsWithheldEventCallback(func);
        } else {
            this._log.error(`Attempted to unregister a callback from OnStarsWithheld with no DinerSceneController registered.`);
        }
    }

    getTaskConfig(): TaskConfig {
        if (this._sceneController !== null) {
            return this._sceneController.getTaskConfig();
        } else {
            this._log.error(`Attempted to get a task config with no DinerSceneController registered.`);
            return null;
        }
    }

    getTaskAppScreen(): TaskAppScreen {
        if (this._sceneController !== null) {
            return this._sceneController.getPhoneTaskScreen();
        } else {
            this._log.error(`Attempted to get the task app screen with no DinerSceneController registered.`);
            return null;
        }
    }

    closeTaskAppScreen() {
        if (this._sceneController !== null) {
            this._sceneController._closePhoneTaskScreen();
        } else {
            this._log.error(`Attempted to close the task app screen with no DinerSceneController registered.`);
        }
    }

    refreshTaskAppScreen() {
        if (this._sceneController !== null) {
            this._sceneController.refreshTaskAppScreen();
        } else {
            this._log.error(`Attempted to refresh the task app screen with no DinerSceneController registered.`);
        }
    }

    openStore(tags: string[]) {
        if (this._sceneController == null) {
            this._log.error(`Attempted to open store with no DinerSceneController registered.`);
            return;
        }
        this._sceneController.openStore(tags);
    }
}
