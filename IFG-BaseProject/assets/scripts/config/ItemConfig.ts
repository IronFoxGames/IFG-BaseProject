import { JsonAsset } from 'cc';
import { ItemInfo } from '../core/model/ItemInfo';
import { ResourceLoader } from '../utils/ResourceLoader';
import { ItemType } from '../core/enums/ItemType';

export class ItemConfig {
    public items: ItemInfo[] = [];

    public static async fromObject(obj: any): Promise<ItemConfig> {
        let itemConfig = new ItemConfig();

        // Load items from the main config
        if (Array.isArray(obj.items)) {
            itemConfig.items = obj.items.map((item: any) => ItemInfo.fromObject(item));
        }

        // Load and merge referenced item configs
        if (obj.refs && Array.isArray(obj.refs)) {
            for (const configPath of obj.refs) {
                try {
                    const itemJson = await ResourceLoader.load(configPath, JsonAsset);
                    const childConfig = await ItemConfig.fromObject(itemJson.json);
                    itemConfig.items.push(...childConfig.items);
                } catch (err) {
                    throw new Error(`Failed to load ItemConfig ref ${configPath} with error: ${err}`);
                }
            }
        }

        return itemConfig;
    }

    public getItemInfo(id: string): ItemInfo {
        const itemInfo = this.items.find((item) => item.id === id);

        if (itemInfo === undefined) {
            return null;
        }

        return itemInfo;
    }

    public getItemInfosOfType(type: ItemType) {
        const itemInfos = this.items.filter((item) => item.type === type);
        return itemInfos;
    }

    public getItemInfoForExternalId(externalId: string) {
        const itemInfo = this.items.find((item) => item.externalId === externalId);
        if (!itemInfo) {
            return null;
        }

        return itemInfo;
    }
}
