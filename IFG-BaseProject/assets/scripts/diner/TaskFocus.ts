import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { ResourceLoader } from '../utils/ResourceLoader';
const { ccclass, property } = _decorator;

@ccclass('TaskFocus')
export class TaskFocus extends Component {
    public get currentState() {
        return this._currentState;
    }

    @property({ type: Sprite, visible: true })
    private _sprite: Sprite;

    @property({ type: UITransform, visible: true })
    private _uiTransform: UITransform;

    private _currentState: boolean;

    public init(spritePath: string) {
        ResourceLoader.load(spritePath, SpriteFrame).then((spriteFrame: SpriteFrame) => {
            this._sprite.spriteFrame = spriteFrame;

            this._uiTransform.contentSize = spriteFrame.originalSize;
        });
    }

    public makeFocused() {
        //TODO: Play some sort of animation..?
        this.node.active = false;

        this._currentState = true;
    }

    protected update(dt: number): void {}
}
