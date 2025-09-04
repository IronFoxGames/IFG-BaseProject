import { _decorator, Component, Node, CCString, SpriteFrame, Texture2D } from 'cc';
import { ModuleController } from './ModuleController';
import { WallPattern } from './WallPattern';
import { FloorPattern } from './FloorPattern';
import { IDinerNode } from './IDinerNode';
import { DinerNode } from './DinerNode';
import { DinerTextureNode } from './DinerTextureNode';
import { RequirementsService } from '../services/RequirementsService';
import { PropCatalogue } from './PropCatalogue';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { TaskItemSpawnPoint } from './TaskItemSpawnPoint';
import { logger } from '../logging';
import { DoorModule } from './DoorModule';
import { IVisibleEntity } from './IVisibleEntity';
import { TaskInteractableState } from './TaskInteractable';
const { ccclass, property } = _decorator;

@ccclass('Room')
export class Room extends Component {
    public OnFocus: () => void;

    @property({ type: CCString })
    public RoomName = 'Room';

    @property({ type: CCString })
    public RoomId = '';

    @property({ type: SpriteFrame })
    public RoomIconSpriteFrame = null;

    @property({ type: DinerTextureNode })
    public DinerWallPatternNode: DinerTextureNode;

    @property({ type: WallPattern })
    public WallPattern: WallPattern = new WallPattern();

    @property({ type: DinerTextureNode })
    public DinerFloorPatternNode: DinerTextureNode;

    @property({ type: FloorPattern })
    public FloorPattern: FloorPattern = new FloorPattern();

    @property({ type: Node })
    public CameraSnapPoint: Node = null;

    public DinerNodes: IDinerNode[] = [];

    @property({ type: Node, visible: true })
    private _dinerNodeHandle = null;

    @property({ type: [Node], visible: true })
    private _obscuringRoomNodes: Node[] = [];

    @property({ type: [Node], visible: true })
    private _subRoomNodes: Node[] = [];

    private _subRooms: Room[] = [];

    @property({ type: [DoorModule], visible: true })
    private _neighbouringDoorModules: DoorModule[] = [];

    @property({ type: [TaskItemSpawnPoint], visible: true })
    private _taskItemSpawnPoints: TaskItemSpawnPoint[] = [];

    private _cardScrambleService: ICardScrambleService;
    private _moduleManager: ModuleController;

    private _isFake: boolean = false;
    private _log = logger.child('Room');

    public async init(
        cardScrambleService: ICardScrambleService,
        requirementsService: RequirementsService,
        catalogue: PropCatalogue,
        isFake: boolean
    ) {
        this._isFake = isFake;

        this._moduleManager = this.getComponentInChildren(ModuleController);
        this._moduleManager.init();
        this._moduleManager.setCustomWallPattern(this.WallPattern);
        this._moduleManager.setCustomFloorPattern(this.FloorPattern);

        for (const subRoomNode of this._subRoomNodes) {
            const subRoom = subRoomNode.getComponent(Room);

            if (subRoomNode) {
                const subRoom = subRoomNode.getComponent(Room);

                if (subRoom) {
                    subRoom.RoomId = this.RoomId;
                    subRoom.RoomName = `${subRoom.RoomName} (Subroom of ${this.RoomName})`;
                    subRoom.init(cardScrambleService, requirementsService, catalogue, isFake);
                    this._subRooms.push(subRoom);
                } else {
                    this._log.error(`Sub room 'Room' component of ${this.RoomName} was not found...`);
                }
            } else {
                this._log.error(`Sub room node of ${this.RoomName} is null...`);
            }
        }

        if (!this._isFake) {
            this._cardScrambleService = cardScrambleService;

            if (this._dinerNodeHandle) {
                this.DinerNodes = this._dinerNodeHandle.getComponentsInChildren(DinerNode);

                if (this.DinerWallPatternNode) {
                    this.DinerWallPatternNode.OnUpdatePatternTexture = (texture: Texture2D) => {
                        this.WallPattern.TilingTexture = texture;
                        this._moduleManager.setCustomWallPattern(this.WallPattern);

                        for (const subRoom of this._subRooms) {
                            subRoom.WallPattern.TilingTexture = texture;
                            subRoom._moduleManager.setCustomWallPattern(subRoom.WallPattern);
                        }
                    };

                    this.DinerNodes.push(this.DinerWallPatternNode);
                }
                if (this.DinerFloorPatternNode) {
                    this.DinerFloorPatternNode.OnUpdatePatternTexture = (texture: Texture2D) => {
                        this.FloorPattern.TilingTexture = texture;
                        this._moduleManager.setCustomFloorPattern(this.FloorPattern);

                        for (const subRoom of this._subRooms) {
                            subRoom.FloorPattern.TilingTexture = texture;
                            subRoom._moduleManager.setCustomFloorPattern(subRoom.FloorPattern);
                        }
                    };

                    this.DinerNodes.push(this.DinerFloorPatternNode);
                }

                const results = await Promise.all(
                    this.DinerNodes.map((dinerNode) => dinerNode.init(cardScrambleService, requirementsService, catalogue))
                );

                if (!results) {
                    this._log.error(`Failed to initialize nodes in room: ${this.RoomId}.`);
                } else {
                    if (this.isUnlocked()) {
                        this.light();
                    } else {
                        this.dim();
                    }
                }
            }
        }
    }

    public update(deltaTime: number) {}

    public isUnlocked() {
        if (this._isFake) {
            return true;
        }

        return this._cardScrambleService.isRoomUnlocked(this.RoomId);
    }

    public revealToCamera() {
        for (const roomNode of this._obscuringRoomNodes) {
            this._lowerWalls(roomNode);
        }
    }

    public getDinerNode(nodeId: string): IDinerNode {
        let node = this.DinerNodes.find((node: IDinerNode) => node.getData().id === nodeId);

        if (node !== undefined) {
            return node;
        } else {
            for (const subRoom of this._subRooms) {
                node = subRoom.DinerNodes.find((node: IDinerNode) => node.getData().id === nodeId);

                if (node !== undefined) {
                    return node;
                }
            }

            this._log.error(`Could not get node with id: ${nodeId}.`);
            return null;
        }
    }

    public getItemSpawnPoint(spawnId: string): TaskItemSpawnPoint {
        if (this._taskItemSpawnPoints === undefined || this._taskItemSpawnPoints.length == 0) {
            this._log.error(`Could not get spawn point with id: ${spawnId}. The room ${this.RoomId} has no spawn points listed.`);
            return null;
        }

        let spawn = this._taskItemSpawnPoints.find((spawn: TaskItemSpawnPoint) => spawn.id === spawnId);

        if (spawn !== undefined) {
            return spawn;
        } else {
            for (const subRoom of this._subRooms) {
                spawn = subRoom._taskItemSpawnPoints.find((spawn: TaskItemSpawnPoint) => spawn.id === spawnId);

                if (spawn !== undefined) {
                    return spawn;
                }
            }

            this._log.error(`Could not get spawn point with id: ${spawnId}.`);
            return null;
        }
    }

    public getNextInteractableSpawnPoint(): TaskItemSpawnPoint {
        if (this._taskItemSpawnPoints === undefined || this._taskItemSpawnPoints.length == 0) {
            this._log.error(`Could not get next interactable spawn point. The room ${this.RoomId} has no spawn points listed.`);
            return null;
        }

        let spawn = this._taskItemSpawnPoints.find(
            (spawn: TaskItemSpawnPoint) => spawn.getCurrentInteractableState() === TaskInteractableState.Interactable
        );

        if (spawn !== undefined) {
            return spawn;
        } else {
            for (const subRoom of this._subRooms) {
                spawn = subRoom._taskItemSpawnPoints.find(
                    (spawn: TaskItemSpawnPoint) => spawn.getCurrentInteractableState() === TaskInteractableState.Interactable
                );

                if (spawn !== undefined) {
                    return spawn;
                }
            }

            this._log.error(`Could not find a spawn point with an active interactable.`);
            return null;
        }
    }

    public clearAllSpawnPoints() {
        for (const spawn of this._taskItemSpawnPoints) {
            spawn?.clearCurrentItem();
        }

        for (const subRoom of this._subRooms) {
            subRoom.clearAllSpawnPoints();
        }
    }

    public unlock(onUnlocked: () => void) {
        const animationDuration: number = 1;
        for (const dinerNode of this.DinerNodes) {
            dinerNode.playLightingAnimation(animationDuration, null);
        }

        for (const subRoom of this._subRooms) {
            subRoom.unlock(() => {});
        }

        this._moduleManager.playLightingAnimation(animationDuration, onUnlocked);
    }

    public getSpawnPointIds(): string[] {
        if (!this._taskItemSpawnPoints) {
            return [];
        }

        return this._taskItemSpawnPoints.map((spawn) => spawn.id);
    }

    public light() {
        if (this.isUnlocked()) {
            this._moduleManager.lightModules();
            for (const dinerNode of this.DinerNodes) {
                dinerNode.lightCurrentProp();
            }

            for (const subRoom of this._subRooms) {
                subRoom.light();
            }
        }
    }

    public dim() {
        this._moduleManager.dimModules();
        for (const dinerNode of this.DinerNodes) {
            dinerNode.dimCurrentProp();
        }

        for (const subRoom of this._subRooms) {
            subRoom.dim();
        }
    }

    public reset() {
        this._raiseWalls(this);
    }

    public openNeighbouringDoors() {
        for (const door of this._neighbouringDoorModules) {
            if (!door) {
                this._log.error(`Null door entry found in _neighbouringDoorModules in ${this.RoomName}.`);
            }

            if (this.isUnlocked()) {
                door?.unlock();
            }
        }
    }

    public getVisibleEntities(): IVisibleEntity[] {
        let subRoomEntities = [];
        this._subRooms.forEach((subRoom) => {
            const entities = subRoom.getVisibleEntities();
            subRoomEntities.push(entities);
        });
        const dinerNodeVisibleEntities = this.DinerNodes.map((dinerNode) => dinerNode?.getVisibleEntity()).filter((entity) => entity !== null);

        if (!this._moduleManager) {
            return dinerNodeVisibleEntities;
        }
        const visibleEntities = [...this._moduleManager.DoorModules, ...this._moduleManager.WallModules, ...dinerNodeVisibleEntities];
        return visibleEntities;
    }

    private _lowerWalls(roomNode: Node) {
        const room = roomNode.getComponent(Room);

        if (room.isUnlocked()) {
            if (!room._moduleManager.lowerWalls()) {
                this._log.error(`${room.name} has one or more null wall module entries...`);
            }
        }

        for (const subRoom of room._subRooms) {
            subRoom._lowerWalls(subRoom.node);
        }
    }

    private _raiseWalls(room: Room) {
        if (!room._moduleManager.raiseWalls()) {
            this._log.error(`${room.name} has one or more null wall module entries...`);
        }

        for (const subRoom of room._subRooms) {
            subRoom._raiseWalls(subRoom);
        }
    }
}
