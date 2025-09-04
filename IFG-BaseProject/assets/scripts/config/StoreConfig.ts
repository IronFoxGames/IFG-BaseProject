import { CatalogItem } from '../core/model/CatalogItem';
import { resources, JsonAsset } from 'cc';
import { UpsellItemConfig } from '../core/model/UpsellItemConfig';

export class StoreConfig {
    public items: CatalogItem[] = [];
    public upsells: UpsellItemConfig[] = [];

    public static async fromObject(obj: any): Promise<StoreConfig> {
        let store = new StoreConfig();

        // Load items from the main config
        if (Array.isArray(obj.items)) {
            store.items = obj.items.map((item: any) => CatalogItem.fromObject(item));
        }

        // Load items from the main config
        if (Array.isArray(obj.upsells)) {
            store.upsells = obj.upsells.map((item: any) => UpsellItemConfig.fromObject(item));
        }

        // Load and merge referenced store configs
        if (obj.refs && Array.isArray(obj.refs)) {
            for (const storeConfigRef of obj.refs) {
                try {
                    const childStore = await StoreConfig.loadFromResource(storeConfigRef);
                    store.items.push(...childStore.items);
                    store.upsells.push(...childStore.upsells);
                } catch (err) {
                    throw new Error(`Failed to load StoreConfig ref ${storeConfigRef} with err: ${err}`);
                }
            }
        }

        return store;
    }

    private static loadFromResource(ref: string): Promise<StoreConfig> {
        return new Promise((resolve, reject) => {
            resources.load(ref, JsonAsset, (err, jsonAsset) => {
                if (err) {
                    reject(`StoreConfig.loadFromResource(): Failed to load ${ref} with err: ${err}`);
                    return;
                }

                try {
                    const storeConfig = StoreConfig.fromObject(jsonAsset.json as any);
                    resolve(storeConfig);
                } catch (err) {
                    reject(`StoreConfig.loadFromResource(): Failed parsing with err: ${err}`);
                }
            });
        });
    }
}
