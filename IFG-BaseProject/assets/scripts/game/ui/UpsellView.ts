import { Button, Node } from 'cc';
import { _decorator, Component } from 'cc';
import { Label } from 'cc';
import { Sprite } from 'cc';
import { UIElementAnimator } from './UIElementAnimator';
import { CatalogItem } from '../../core/model/CatalogItem';
import { IStore, StoreType, UpsellOffer } from '../../services/IStore';
import { SpriteFrame } from 'cc';
import { ResourceLoader } from '../../utils/ResourceLoader';
import { ItemInfo } from '../../core/model/ItemInfo';
import { ItemConfig } from '../../config/ItemConfig';
import { logger } from '../../logging';
import { ItemAndAmount } from '../../core/model/ItemAndAmount';
const { ccclass, property } = _decorator;

@ccclass('UpsellView')
export class UpsellView extends Component {
    @property({ type: Node, visible: true })
    private _scrim: Node;

    @property({ type: Button, visible: true })
    private _closeButton: Button;

    @property({ type: Button, visible: true })
    private _purchaseButton: Button;

    @property({ type: Label, visible: true })
    private _upsellText: Label;

    @property({ type: Sprite, visible: true })
    private _offerIcon: Sprite;

    @property({ type: Label, visible: true })
    private _offerAmountText: Label;

    @property({ type: Sprite, visible: true })
    private _offerCurrencyIcon: Sprite;

    @property({ type: Label, visible: true })
    private _offerPrice: Label;

    private _onCloseCallback?: (purchaseComplete) => void;

    @property(UIElementAnimator)
    public UIElementAnimators: UIElementAnimator[] = [];

    private _store: IStore;
    private _itemConfig: ItemConfig;
    private _itemInfo: ItemInfo;
    private _offerItemAndAmount: ItemAndAmount;
    private _upsellOffer: UpsellOffer;
    private _catalogItem: CatalogItem;
    private _log = logger.child('UpsellView');
    private _storeType: StoreType;

    protected start(): void {
        this._closeButton.node.on(Button.EventType.CLICK, this._onClosePressed, this);
        this._purchaseButton.node.on(Button.EventType.CLICK, this._onPurchase, this);
    }

    public async show(
        store: IStore,
        itemConfig: ItemConfig,
        itemInfo: ItemInfo,
        upsellOffer: UpsellOffer,
        storeType: StoreType,
        onCloseCallback: (purchaseComplete) => void
    ) {
        this._store = store;
        this._itemConfig = itemConfig;
        this._itemInfo = itemInfo;
        this._upsellOffer = upsellOffer;
        this._storeType = storeType;

        // Hide until ready to animate in
        this.node.active = false;

        if (itemConfig == null || itemInfo == null || upsellOffer == null) {
            this._log.warn('invalid upsell info');
            onCloseCallback?.call(this, false);
            return;
        }

        this._catalogItem = this._upsellOffer.catalogItem;

        // Grab first item that matches the item we're upselling on
        this._offerItemAndAmount = this._catalogItem?.contents?.find((itemAndAmount) => itemAndAmount.id === this._itemInfo.id);
        if (!this._offerItemAndAmount) {
            this._log.warn('no contents with item in upsell catalog item');
            onCloseCallback?.call(this, false);
            return;
        }

        const currencyItemInfo = this._itemConfig.getItemInfo(this._catalogItem.cost.currency);
        if (!currencyItemInfo) {
            this._log.warn('unknown currency in upsell catalog item');
            onCloseCallback?.call(this, false);
            return;
        }
        const upsellItemInfo = this._itemConfig.getItemInfo(this._offerItemAndAmount.id);
        if (!upsellItemInfo) {
            this._log.warn('unknown item in upsell catalog item');
            onCloseCallback?.call(this, false);
            return;
        }

        let offerSprite: SpriteFrame = null;
        try {
            offerSprite = await ResourceLoader.load(this._catalogItem.sprite, SpriteFrame);
        } catch (error) {
            offerSprite = null;
            this._log.warn(`Failed to load bundle icon for upsell: ${upsellItemInfo.id}`, error);
        }

        let itemSprite: SpriteFrame = null;
        try {
            itemSprite = await ResourceLoader.load(upsellItemInfo.sprite, SpriteFrame);
        } catch (error) {
            itemSprite = null;
            this._log.warn(`Failed to load item icon for upsell: ${upsellItemInfo.id}`, error);
        }

        let currencySprite: SpriteFrame = null;
        try {
            currencySprite = await ResourceLoader.load(currencyItemInfo.sprite, SpriteFrame);
        } catch (error) {
            this._log.warn(`Failed to load icon for upsell: ${currencyItemInfo.id}`, error);
        }

        this._upsellText.string = this._formatUpsellText(this._upsellOffer.upsellConfig.upsellText);
        this._offerIcon.spriteFrame = offerSprite ?? itemSprite;
        this._offerAmountText.string = `X ${this._offerItemAndAmount.amount}`;
        this._offerCurrencyIcon.spriteFrame = currencySprite;
        this._offerPrice.string = `${this._catalogItem.cost.amount}`;

        // Show and animate in
        this.node.active = true;
        this._onCloseCallback = onCloseCallback;
        this._playInAnimation();
    }

    private _onClosePressed() {
        this._onCloseCallback?.call(this, false);
        this._playOutAnimation();
    }

    private _onPurchase() {
        this._closeButton.interactable = false;
        this._purchaseButton.interactable = false;
        this._store.purchase(this._catalogItem, this._storeType).then((result) => {
            this._closeButton.interactable = true;
            this._purchaseButton.interactable = true;
            this._onCloseCallback?.call(this, result);
        });
    }

    private _playInAnimation() {
        this.UIElementAnimators.forEach((animator) => {
            animator.PlayInAnimation();
        });
    }

    private _playOutAnimation() {
        this._scrim.active = false;
        this.UIElementAnimators.forEach((animator) => {
            animator.PlayOutAnimation();
        });
    }

    private _formatUpsellText(text: string): string {
        // TODO: support more substitutions when we make this upsell logic more intelligent
        const substitutions: Record<string, string> = {
            itemName: this._itemInfo?.name ?? '',
            itemAmount: `${this._offerItemAndAmount?.amount ?? ''}`,
            offerName: this._catalogItem?.name ?? ''
        };

        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return substitutions[key] ?? match;
        });
    }
}
