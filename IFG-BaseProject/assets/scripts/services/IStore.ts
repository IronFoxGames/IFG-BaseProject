import { AppConfig } from '../config/AppConfig';
import { CatalogItem } from '../core/model/CatalogItem';
import { CurrencyAndAmount } from '../core/model/CurrencyAndAmount';
import { UpsellItemConfig } from '../core/model/UpsellItemConfig';
import { IBackend } from './IBackend';
import { UIOverlayService } from './UIOverlayService';

const StoreType = ['store', 'decorationstore', 'dailyreward', 'pregameupsell', 'giveupupsell', 'ingameupsell'] as const;
export type StoreType = (typeof StoreType)[number];

export class UpsellOffer {
    private _itemId: string;
    private _upsellConfig: UpsellItemConfig;
    private _catalogItem: CatalogItem;

    public get itemId() {
        return this._itemId;
    }

    public get upsellConfig() {
        return this._upsellConfig;
    }

    public get catalogItem() {
        return this._catalogItem;
    }

    constructor(itemId: string, upsellConfig: UpsellItemConfig, catalogItem: CatalogItem) {
        this._itemId = itemId;
        this._upsellConfig = upsellConfig;
        this._catalogItem = catalogItem;
    }
}

export interface IStore {
    initialize(config: AppConfig, overlayService: UIOverlayService, backend: IBackend): Promise<void>;

    showPlatformStore();
    getCurrencyBalances(): Promise<CurrencyAndAmount[]>;
    getCatalog(): Promise<CatalogItem[]>;
    getCatalogItem(id: string): Promise<CatalogItem>;
    getUpsellConfig(itemId: string): UpsellItemConfig;
    getNextUpsell(itemId: string, numInRoundPurchases: number): Promise<UpsellOffer | null>;
    purchase(catalogItem: CatalogItem, storeType: StoreType): Promise<boolean>;
}
