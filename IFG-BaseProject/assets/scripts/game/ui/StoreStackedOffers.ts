import { SpriteFrame, _decorator, Component } from 'cc';
import { StoreOffer } from '../../ui/StoreOffer';
import { CatalogItem } from '../../core/model/CatalogItem';
import { AppConfig } from '../../config/AppConfig';
const { ccclass, property } = _decorator;

@ccclass('StoreStackedOffer')
export class StoreStackedOffer extends Component {
    @property({ type: StoreOffer, visible: true })
    private _offerTop: StoreOffer;

    @property({ type: StoreOffer, visible: true })
    private _offerBottom: StoreOffer;

    public async init(
        config: AppConfig,
        topItem: CatalogItem,
        bottomItem: CatalogItem,
        fpoSprite: SpriteFrame,
        topIsExpandButton: boolean,
        bottomIsExpandButton: boolean,
        onExpandStore: () => void,
        onPurchase: (item: CatalogItem) => void
    ) {
        if (topIsExpandButton) {
            this._offerTop.initAsMoreButton(onExpandStore);
        } else {
            await this._offerTop.init(config, topItem, fpoSprite, onPurchase);
        }

        if (bottomIsExpandButton) {
            this._offerBottom.initAsMoreButton(onExpandStore);
        } else if (bottomItem == null) {
            this._offerBottom.initAsEmpty();
        } else {
            await this._offerBottom.init(config, bottomItem, fpoSprite, onPurchase);
        }
    }

    public fadeIn(delay1: number, delay2: number, duration: number) {
        this._offerTop.fadeIn(delay1, duration);
        this._offerBottom.fadeIn(delay2, duration);
    }
}
