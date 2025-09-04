import { _decorator, Component, instantiate, Label, Node, Prefab, Sprite, SpriteFrame, tween, UIOpacity } from 'cc';
import { AppConfig } from '../config/AppConfig';
import { CatalogItem } from '../core/model/CatalogItem';
import { logger } from '../logging';
import { ResourceLoader } from '../utils/ResourceLoader';
import { StoreOfferItem } from './StoreOfferItem';
import { StorePurchaseButton } from './StorePurchaseButton';
const { ccclass, property } = _decorator;

@ccclass('StoreOfferBundle')
export class StoreOfferBundle extends Component {
    @property({ type: Label, visible: true })
    private _itemName: Label;

    @property({ type: Sprite, visible: true })
    private _itemImage: Sprite;

    @property({ type: StoreOfferItem, visible: true })
    private _currencyOfferItem: StoreOfferItem;

    @property({ type: Prefab, visible: true })
    private _storeOfferItemPrefab: Prefab;

    @property({ type: Node, visible: true })
    private _bundleCurrenciesParent: Node;

    @property({ type: Node, visible: true })
    private _bundleItemsParent: Node;

    @property({ type: StorePurchaseButton, visible: true })
    private _purchaseButton: StorePurchaseButton;

    @property({ type: UIOpacity, visible: true })
    private _opacity;

    @property({ type: Node, visible: true })
    private _bundleValueTag: Node;

    @property({ type: Label, visible: true })
    private _bundleValueTagText: Label;

    private _config: AppConfig;
    private _item: CatalogItem;
    private _log = logger.child('StoreOfferBundle');

    protected onLoad(): void {}

    public async init(config: AppConfig, item: CatalogItem, fpoSprite: SpriteFrame, onPurchase: (item: CatalogItem) => void) {
        this._opacity.opacity = 0;
        this._config = config;
        this._item = item;
        this._itemName.string = item.name;

        this._itemName.node.active = false;
        this._purchaseButton.node.active = false;

        this._purchaseButton.init(config.itemConfig, item.cost, () => {
            onPurchase(item);
        });

        try {
            const sprite = await ResourceLoader.load(item.sprite, SpriteFrame);
            this._itemImage.spriteFrame = sprite;
        } catch (error) {
            this._log.error(`Failed to find store image for bundle: ${item.sprite}`, error);
            this._itemImage.spriteFrame = fpoSprite;
        }

        await this._populateRewards(fpoSprite);

        this._itemName.node.active = true;
        this._purchaseButton.node.active = true;

        if (item.valueTag && item.valueTag !== '') {
            this._bundleValueTag.active = true;
            this._bundleValueTagText.string = item.valueTag;
        }
    }

    public async fadeIn(delay: number, duration: number) {
        tween(this._opacity).delay(delay).to(duration, { opacity: 255 }, { easing: 'quadOut' }).start();
    }

    private async _populateRewards(fpoSprite: SpriteFrame) {
        if (!this._item || !this._item.contents || !Array.isArray(this._item.contents)) {
            return;
        }

        this._bundleCurrenciesParent.active = false;

        let itemPrefabs = await Promise.all(
            this._item.contents.map(async (item) => {
                const itemInfo = this._config.itemConfig.getItemInfo(item.id);
                if (!itemInfo) {
                    return null;
                }

                let sprite: SpriteFrame = fpoSprite;
                try {
                    sprite = await ResourceLoader.load(itemInfo.sprite, SpriteFrame);
                } catch (error) {
                    this._log.warn(`Failed to load store image for item: ${itemInfo.sprite}`, error);
                }

                if (itemInfo.isCurrency) {
                    this._bundleCurrenciesParent.active = true;

                    this._currencyOfferItem.init(sprite, `X ${item.amount}`);
                } else {
                    const itemPrefab = instantiate(this._storeOfferItemPrefab);
                    const itemComponent = itemPrefab.getComponent(StoreOfferItem);
                    itemComponent.init(sprite, `X ${item.amount}`);
                    return itemPrefab;
                }
            })
        );

        // Append them in order to the parent container
        itemPrefabs = itemPrefabs.filter((item) => item != null);
        itemPrefabs.forEach((prefab) => {
            prefab.parent = this._bundleItemsParent;
        });
    }
}
