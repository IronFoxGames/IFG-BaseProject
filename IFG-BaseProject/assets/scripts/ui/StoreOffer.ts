import { _decorator, Button, Component, Label, Node, Sprite, SpriteFrame, tween, UIOpacity } from 'cc';
import { AppConfig } from '../config/AppConfig';
import { CatalogItem } from '../core/model/CatalogItem';
import { logger } from '../logging';
import { ResourceLoader } from '../utils/ResourceLoader';
import { IFGButton } from './IFGButton';
import { StorePurchaseButton } from './StorePurchaseButton';
const { ccclass, property } = _decorator;

@ccclass('StoreOffer')
export class StoreOffer extends Component {
    @property({ type: Label, visible: true })
    private _itemCount: Label;

    @property({ type: Sprite, visible: true })
    private _itemImage: Sprite;

    @property({ type: Sprite, visible: true })
    private _offerImage: Sprite;

    @property({ type: StorePurchaseButton, visible: true })
    private _purchaseButton: StorePurchaseButton;

    @property({ type: Node, visible: true })
    private _singleOfferView: Node;

    @property({ type: Node, visible: true })
    private _moreOffersView: Node;

    @property({ type: IFGButton, visible: true })
    private _moreOffersButton: IFGButton;

    @property({ type: UIOpacity, visible: true })
    private _opacity;

    private _config: AppConfig;
    private _item: CatalogItem;
    private _log = logger.child('StoreOffer');

    public initAsMoreButton(onExpandStore: () => void) {
        this._opacity.opacity = 0;
        this._singleOfferView.active = false;
        this._moreOffersView.active = true;
        this._moreOffersButton.node.on(Button.EventType.CLICK, onExpandStore);
    }

    public initAsEmpty() {
        this._opacity.node.active = false;
        this._singleOfferView.active = false;
        this._moreOffersView.active = false;
    }

    public async init(config: AppConfig, item: CatalogItem, fpoSprite: SpriteFrame, onPurchase: (item: CatalogItem) => void) {
        this._opacity.opacity = 0;
        this._itemCount.node.active = false;
        this._itemImage.node.active = false;
        this._offerImage.node.active = false;
        this._purchaseButton.node.active = false;

        this._config = config;
        this._item = item;
        this._itemCount.string = item.name;
        this._singleOfferView.active = true;
        this._moreOffersView.active = false;

        this._purchaseButton.init(config.itemConfig, item.cost, () => {
            onPurchase(item);
        });

        // Load offer sprite
        let sprite: SpriteFrame = fpoSprite;
        try {
            sprite = await ResourceLoader.load(item.sprite, SpriteFrame);
        } catch (error) {
            this._log.error(`Failed to find store image for bundle: ${item.sprite}`, error);
        }
        this._offerImage.spriteFrame = sprite;

        // Load contents amount and sprite
        const firstItem = this._item?.contents?.[0];
        if (!firstItem) {
            this._log.error(`Store catalog offer does not have contents defined`, item);
            return;
        }

        const itemInfo = this._config.itemConfig.getItemInfo(firstItem.id);
        if (!itemInfo) {
            this._log.error(`Store catalog offer has contents of unknown item`, { offer: item, contentItem: firstItem });
            return;
        }

        sprite = fpoSprite;
        try {
            sprite = await ResourceLoader.load(itemInfo.sprite, SpriteFrame);
        } catch (error) {
            this._log.warn(`Failed to load store image for item: ${itemInfo.sprite}`, error);
        }
        this._itemImage.spriteFrame = sprite;
        this._itemCount.string = `${firstItem.amount}`;

        this._itemCount.node.active = true;
        this._itemImage.node.active = true;
        this._offerImage.node.active = true;
        this._purchaseButton.node.active = true;
    }

    public async fadeIn(delay: number, duration: number) {
        tween(this._opacity).delay(delay).to(duration, { opacity: 255 }, { easing: 'quadOut' }).start();
    }
}
