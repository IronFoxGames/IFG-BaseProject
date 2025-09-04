import { Label, Sprite, SpriteFrame, _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('StoreOfferItem')
export class StoreOfferItem extends Component {
    @property({ type: Sprite, visible: true })
    private _itemSprite: Sprite;

    @property({ type: Label, visible: true })
    private _itemAmount: Label;

    public init(itemSprite: SpriteFrame, itemAmount: string) {
        this._itemSprite.spriteFrame = itemSprite;
        this._itemAmount.string = itemAmount;
    }
}
