import { _decorator, Button, Component, Node, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RoomButton')
export class RoomButton extends Component {
    public OnRoomButtonPressed: () => void;

    @property({ type: Sprite, visible: true, group: 'Sprites' })
    private _iconSprite: Sprite;

    @property({ type: Sprite, visible: true, group: 'Sprites' })
    private _shadowSprite: Sprite;

    @property({ type: Node, visible: true, group: 'Nodes' })
    private _lockNode: Node;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _roomButton: Button;

    private _isSelected: boolean;

    public start() {
        this._roomButton.node.on(Button.EventType.CLICK, this._onRoomButtonPressedCallback, this);
    }

    public onDestroy(): void {
        if (this._roomButton?.node) {
            this._roomButton.node.off(Button.EventType.CLICK, this._onRoomButtonPressedCallback, this);
        }
    }

    public init(iconSpriteFrame: SpriteFrame, locked: boolean) {
        this._iconSprite.spriteFrame = iconSpriteFrame;
        this._shadowSprite.spriteFrame = iconSpriteFrame;
        this._lockNode.active = locked;
    }

    public select() {
        if (!this._isSelected) {
            this._isSelected = true;
            this._shadowSprite.node.active = false;
        }
    }

    public deselect() {
        if (this._isSelected) {
            this._isSelected = false;
            this._shadowSprite.node.active = true;
        }
    }

    public disableButton() {
        this._roomButton.interactable = false;
    }

    public enableButton() {
        this._roomButton.interactable = true;
    }

    protected update(deltaTime: number) {}

    private _onRoomButtonPressedCallback() {
        this.OnRoomButtonPressed?.call(this);
    }
}
