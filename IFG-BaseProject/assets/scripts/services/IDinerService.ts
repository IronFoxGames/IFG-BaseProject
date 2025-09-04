import { TaskConfig } from '../config/TaskConfig';
import { RoomAndNodeAndProp } from '../core/model/RoomAndNodeAndProp';
import { DinerSceneController } from '../diner/DinerSceneController';
import { TaskInteractableState } from '../diner/TaskInteractable';
import { TaskItemSpawnPoint } from '../diner/TaskItemSpawnPoint';
import { BuildModeTaskContext } from '../diner/ui/BuildModeView';
import { TaskAppScreen } from '../ui/TaskAppScreen';

export interface IDinerService {
    initialize(): Promise<void>;
    registerSceneControllerInstance(sceneController: DinerSceneController);
    unregisterSceneControllerInstance();

    getPropIdInNode(nodeId: string): string;
    getStateOfInteractableInSpawnPoint(roomId: string, spawnId: string): TaskInteractableState;
    getStateOfFocusInSpawnPoint(roomId: string, spawnId: string): boolean;
    getNextSpawnPointWithActiveInteractable(roomId: string): TaskItemSpawnPoint;
    getTaskItemSpritePath(itemId: string): string;
    isPropTaggedInNode(tag: string, nodeId: string): boolean;
    registerPropSwappedEventCallback(func: () => void);
    unregisterPropSwappedEventCallback(func: () => void);

    registerTaskListOpenedEventCallback(func: () => void);
    unregisterTaskListOpenedEventCallback(func: () => void);

    registerActiveTaskListUpdatedCallback(func: () => void);
    unregisterActiveTaskListUpdatedCallback(func: () => void);

    setCutsceneActive(active: boolean);
    setDinerHUDActive(active: boolean);
    clearAllSpawnPoints();
    spawnInteractableInSpawnPoint(roomId: string, spawnId: string, itemId: string);
    makeInteractableInSpawnPointInteractable(roomId: string, spawnId: string, spritePath: string, onInteractedWith: () => void);
    spawnFocusInSpawnPoint(roomId: string, spawnId: string, itemId: string);
    focusOnSpawnPointWithFocusItem(roomId: string, spawnId: string);
    focusOnSpawnPointWithInteractableItem(roomId: string, spawnId: string);
    focusOnRoomAndUnlock(roomId: string, func: () => void);
    focusOnRoom(roomId: string, func: () => void);
    focusOnNode(roomId: string, nodeId: string, func: () => void);
    forceSwapPropsInLocations(locationAndPropIds: RoomAndNodeAndProp[]);
    shakeCamera(duration, intensity, func: () => void);
    openQuickPlay();
    isSpawnPointOccupied(roomId: string, spawnId: string): boolean;
    clearItemInSpawnPoint(roomId: string, spawnId: string);
    enterBuildModeWithTaskContext(context: BuildModeTaskContext, onSwapPropButtonPressedCallback: () => void);
    setStarsWithheld(stars: number);
    getStarsWithheld(): number;
    registerStarsWithheldEventCallback(func: () => void);
    unregisterStarsWithheldEventCallback(func: () => void);
    getTaskConfig(): TaskConfig;
    getTaskAppScreen(): TaskAppScreen;
    refreshTaskAppScreen();
    closeTaskAppScreen();

    openStore(tags: string[]);
}
