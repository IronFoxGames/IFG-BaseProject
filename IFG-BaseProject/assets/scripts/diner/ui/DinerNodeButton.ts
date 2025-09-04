import { _decorator, Button, Component, Node, Sprite } from 'cc';
import { IDinerNode } from '../IDinerNode';
const { ccclass, property } = _decorator;

@ccclass('DinerNodeButton')
export class DinerNodeButton extends Component {
    public OnNodeButtonPressed: () => void;

    public DinerNode: IDinerNode;

    @property({ type: Sprite, visible: true })
    private _iconSprite: Sprite = null;

    public init(dinerNode: IDinerNode, parentNode: Node) {
        this.DinerNode = dinerNode;
        this._iconSprite.spriteFrame = this.DinerNode.getIconSpriteFrame();

        this.node.parent = parentNode;
        this.node.worldPosition = this.DinerNode.getNodeButtonTarget().worldPosition;
        this.node.on(Button.EventType.CLICK, this._onNodeButtonPressedCallback, this);
    }

    protected onDestroy(): void {}

    private _onNodeButtonPressedCallback() {
        this.OnNodeButtonPressed?.call(this);
    }
}
