import { JsonAsset } from 'cc';
import { PropData } from './models/PropData';
import { ResourceLoader } from '../utils/ResourceLoader';
import { IStore } from '../services/IStore';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { PropInstanceData } from './PropInstanceData';
import { logger } from '../logging';

export class PropCatalogue {
    private _cardScrambleService: ICardScrambleService;
    private _store: IStore;
    private _propInstanceData: PropInstanceData[] = [];
    private _propData: PropData[] = [];
    private _log = logger.child('PropCatalogue');

    public async init(store: IStore, cardScrambleService: ICardScrambleService) {
        this._cardScrambleService = cardScrambleService;
        this._store = store;

        try {
            const propData = await ResourceLoader.loadDir('diner/props/', JsonAsset);
            propData.forEach((data: JsonAsset) => {
                try {
                    this._propData.push(PropData.fromObject(data.json));
                } catch (parseError) {
                    this._log.error(`Error parsing prop data in file: ${data.name || '[unknown name]'}`, parseError);
                }
            });
        } catch (error) {
            this._log.error('Error loading prop data directory:', error);
        }

        // Consolidate store catalog data with prop data
        const catalogItems = await this._store.getCatalog();
        catalogItems.forEach((catalogItem) => {
            if (catalogItem.tags.includes('diner')) {
                const propId = catalogItem?.contents?.[0]?.id;
                if (!propId) {
                    this._log.warn('Store item for diner decoration does not map to prop Id.', catalogItem);
                    return;
                }

                const propData = this.getPropWithId(propId);
                if (!propData) {
                    this._log.warn(`Cannot find prop ${propId} for store catalog entry: `, catalogItem);
                    return;
                }

                const isOwned = this._cardScrambleService.getItemCountInInventory(propId) > 0;
                const instance = new PropInstanceData(isOwned, propData, catalogItem);
                this._propInstanceData.push(instance);
            }
        });
    }

    public getAllPropsWithTags(tags: string[]): PropInstanceData[] {
        let validProps: PropInstanceData[] = [];

        this._propInstanceData.forEach((propInstanceData) => {
            if (PropData.validateProp(propInstanceData.data.tags, tags)) {
                validProps.push(propInstanceData);
            }
        });

        return validProps;
    }

    public getPropWithId(id: string): PropData {
        return this._propData.find((p) => p.id === id);
    }

    public async purchaseProp(propInstanceData: PropInstanceData): Promise<boolean> {
        if (propInstanceData.isOwned) {
            this._log.warn(`Trying to buy already owned prop instance`, propInstanceData);
            return true;
        }

        const purchaseResult = await this._store.purchase(propInstanceData.storeData, 'decorationstore');
        if (purchaseResult) {
            propInstanceData.isOwned = true;
        }

        return purchaseResult;
    }
}
