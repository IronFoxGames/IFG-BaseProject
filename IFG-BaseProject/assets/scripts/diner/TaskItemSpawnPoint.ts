import { _decorator, Component, Node, Prefab, instantiate, CCString } from 'cc';
import { TaskInteractable, TaskInteractableState } from './TaskInteractable';
import { TaskFocus } from './TaskFocus';
import { logger } from '../logging';
import { SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

export enum TaskItemType {
    None = 'none',
    Interactable = 'interactable',
    Focus = 'focus'
}

@ccclass('TaskItemSpawnPoint')
export class TaskItemSpawnPoint extends Component {
    public get isOccupied(): boolean {
        return this._occupied;
    }

    @property({ type: CCString })
    public id: string = 'unnamed';

    @property({ type: Prefab, visible: true })
    private _interactablePrefab: Prefab;

    @property({ type: Prefab, visible: true })
    private _focusPrefab: Prefab;

    private _occupied: boolean = false;
    private _currentItemType: TaskItemType = TaskItemType.None;
    private _currentItemNode: Node = null;

    private _currentInteractable: TaskInteractable = null;
    private _currentFocus: TaskFocus = null;

    private _log = logger.child('TaskItemSpawnPoint');

    public instanceInteractacbleItem(spritePath: string) {
        if (this._occupied) {
            this._log.error(
                `Attempted to instantiate item with sprite ${spritePath} in spawn point named ${this.id} while it's already occupied!`
            );
            return;
        }

        this._currentItemNode = instantiate(this._interactablePrefab);

        this._currentItemType = TaskItemType.Interactable;

        this._currentItemNode.parent = this.node;

        this._currentInteractable = this._currentItemNode.getComponent(TaskInteractable);

        this._currentInteractable.init(spritePath);

        this._occupied = true;
    }

    public instanceFocusItem(spritePath: string) {
        if (this._occupied) {
            this._log.error(
                `Attempted to instantiate item with sprite ${spritePath} in spawn point named ${this.id} while it's already occupied!`
            );
            return;
        }

        this._currentItemNode = instantiate(this._focusPrefab);

        this._currentItemType = TaskItemType.Focus;

        this._currentItemNode.parent = this.node;

        this._currentFocus = this._currentItemNode.getComponent(TaskFocus);

        this._currentFocus.init(spritePath);

        this._occupied = true;
    }

    public clearCurrentItem() {
        this._currentItemNode?.destroy();

        this._currentItemNode = null;

        this._currentItemType = TaskItemType.None;

        this._currentInteractable = null;

        this._currentFocus = null;

        this._occupied = false;
    }

    public getCurrentInteractableState(): TaskInteractableState {
        if (this._occupied) {
            if (this._currentItemType != TaskItemType.Interactable) {
                this._log.error('Checking the state of an interactable item in a spawn point that has a focus item in it...');
                return TaskInteractableState.Uninteractable;
            }
            return this._currentInteractable.currentState;
        } else {
            this._log.warn('Checking the state of an interactable item in a spawn point that is not occupied...');
            return TaskInteractableState.Uninteractable;
        }
    }

    public getCurrentFocusState(): boolean {
        if (this._occupied) {
            if (this._currentItemType != TaskItemType.Focus) {
                this._log.error('Checking the state of a focus item in a spawn point that has an interactable item in it...');
                return false;
            }
            return this._currentFocus.currentState;
        } else {
            this._log.warn('Checking the state of an interactable item in a spawn point that is not occupied...');
            return false;
        }
    }

    public makeCurrentInteractableItemInteractable(spritePath: string, onInteractedWith: () => void = null) {
        if (this._occupied) {
            if (this._currentItemType != TaskItemType.Interactable) {
                this._log.error('Tried to change the state of an interactable item in a spawn point that has a focus item in it...');
                return;
            }
            this._currentInteractable.makeInteractable(spritePath, onInteractedWith);
        } else {
            this._log.warn('Tried to change the state of an interactable item in a spawn point that is not occupied...');
        }
    }

    public makeCurrentFocusItemFocused() {
        if (this._occupied) {
            if (this._currentItemType != TaskItemType.Focus) {
                this._log.error('Tried to change the state of a focus item in a spawn point that has an interactable in it...');
                return;
            }
            this._currentFocus.makeFocused();
        } else {
            this._log.warn('Tried to change the state of a focus item in a spawn point that is not occupied...');
        }
    }
}
