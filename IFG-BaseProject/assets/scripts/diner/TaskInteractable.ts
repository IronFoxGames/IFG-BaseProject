import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { ResourceLoader } from '../utils/ResourceLoader';
import { sp } from 'cc';
import { resources } from 'cc';
import { logger } from '../logging';
import { Button } from 'cc';
const { ccclass, property } = _decorator;

export enum TaskInteractableState {
    Uninteractable = 'uninteractable',
    Interactable = 'interactable',
    InteractedWith = 'interactedWith'
}

@ccclass('TaskInteractable')
export class TaskInteractable extends Component {
    public get currentState() {
        return this._currentState;
    }

    @property({ type: Sprite, visible: true })
    private _sprite: Sprite;

    @property({ type: Node, visible: true })
    private _indicatorNode: Node;

    @property({ type: Button, visible: true })
    private _indicatorButton: Button;

    @property({ type: Sprite, visible: true })
    private _indicatorSprite: Sprite;

    @property({ type: UITransform, visible: true })
    private _uiTransform: UITransform;

    private _currentState: TaskInteractableState = TaskInteractableState.Uninteractable;

    private _onInteractedWith: () => void = null;

    private _log = logger.child('TaskInteractable');

    public init(spritePath: string) {
        this._indicatorNode.active = false;

        ResourceLoader.load(spritePath, SpriteFrame).then((spriteFrame: SpriteFrame) => {
            this._sprite.spriteFrame = spriteFrame;

            this._uiTransform.contentSize = spriteFrame.originalSize;
        });
    }

    public makeInteractable(spritePath: string, onInteractedWith: () => void) {
        if (spritePath) {
            resources.load(spritePath, (err, loadedAsset) => {
                if (err) {
                    this._log.error(`Failed to load sprite at path ${spritePath}: ${err}`);
                    return;
                }
                this._indicatorSprite.spriteFrame = loadedAsset as SpriteFrame;
            });
        }

        this._onInteractedWith = onInteractedWith;

        this._currentState = TaskInteractableState.Interactable;
        this._indicatorNode.active = true;
    }

    protected start(): void {
        this.node.on(Node.EventType.TOUCH_START, this._onInteraction, this);
        this._indicatorButton.node.on(Node.EventType.TOUCH_START, this._onInteraction, this);
    }

    protected update(dt: number): void {}

    private _onInteraction() {
        if (this._currentState != TaskInteractableState.Interactable) {
            return;
        }

        this.node.active = false;

        this._indicatorNode.active = false;

        this._currentState = TaskInteractableState.InteractedWith;

        this._onInteractedWith?.call(this);
    }
}
