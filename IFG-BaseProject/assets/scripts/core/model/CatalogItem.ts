import { Currency } from '../enums/Currency';
import { CurrencyAndAmount } from './CurrencyAndAmount';
import { ItemAndAmount } from './ItemAndAmount';

export class CatalogItem {
    public id: string = '';
    public externalIds: string[] = [];
    public name: string = '';
    public description: string = '';
    public valueTag: string = '';
    public cost: CurrencyAndAmount = new CurrencyAndAmount(Currency.None, 0);
    public sprite: string = '';
    public contents: ItemAndAmount[] = [];
    public tags: string[] = [];
    public stack: boolean = false;
    public priority: number = 0;
    public collapsedVisible: boolean = false;
    public isUpsell: boolean = false;
    public maxPurchaseCount: number = 0;

    public static fromItem(catalogItem: CatalogItem) {
        let item = new CatalogItem();
        item.id = catalogItem.id;
        item.externalIds = [...catalogItem.externalIds];
        item.name = catalogItem.name;
        item.description = catalogItem.description;
        item.valueTag = catalogItem.valueTag;
        item.cost = new CurrencyAndAmount(catalogItem.cost.currency, catalogItem.cost.amount);
        catalogItem.contents.forEach((contentItem) => {
            item.contents.push(new ItemAndAmount(contentItem.id, contentItem.amount));
        });
        item.sprite = catalogItem.sprite;
        item.tags = [...catalogItem.tags];
        item.stack = catalogItem.stack;
        item.priority = catalogItem.priority;
        item.collapsedVisible = catalogItem.collapsedVisible;
        item.isUpsell = catalogItem.isUpsell;
        item.maxPurchaseCount = catalogItem.maxPurchaseCount;
        return item;
    }

    public static fromAsset(id: string, assetId: string, name: string, cost: CurrencyAndAmount, spritePath: string, tags: string[]) {
        let item = new CatalogItem();
        item.id = id;
        item.externalIds = [];
        item.name = name;
        item.description = '';
        item.valueTag = '';
        item.cost = cost;
        item.contents = [new ItemAndAmount(assetId, 1)];
        item.sprite = spritePath;
        item.tags = tags;
        item.stack = false;
        item.priority = 0;
        item.collapsedVisible = false;
        item.isUpsell = false;
        item.maxPurchaseCount = 0;
        return item;
    }

    public static fromObject(obj: any): CatalogItem {
        if (
            obj == null ||
            obj?.id == null ||
            obj?.name == null ||
            obj?.description == null ||
            obj?.cost == null ||
            obj?.sprite == null ||
            obj?.contents == null ||
            !Array.isArray(obj.contents || !Array.isArray(obj.tags))
        ) {
            throw new Error(`Invalid item[id=${obj?.id}]; missing id, name, description, cost, sprite or contents`);
        }

        let item = null;

        try {
            item = new CatalogItem();
            item.id = obj?.id || '';
            if (Array.isArray(obj.externalIds)) {
                item.externalIds = obj.externalIds.map((id: string) => id);
            } else {
                item.externalIds = [];
            }
            item.name = obj?.name || '';
            item.description = obj?.description || '';
            item.valueTag = obj?.valueTag || '';
            item.cost = CurrencyAndAmount.fromObject(obj.cost);
            item.sprite = obj?.sprite || '';
            if (Array.isArray(obj.contents)) {
                item.contents = obj.contents.map((item: any) => ItemAndAmount.fromObject(item));
            }
            if (Array.isArray(obj.tags)) {
                item.tags = obj.tags.map((tag: string) => tag);
            }
            item.stack = obj?.stack ?? false;
            item.priority = obj?.priority ?? 0;
            item.collapsedVisible = obj?.collapsedVisible ?? false;
            item.isUpsell = obj?.isUpsell ?? false;
            item.maxPurchaseCount = obj?.maxPurchaseCount ?? 0;
        } catch (err) {
            throw new Error(`Invalid CatalogItem; failed to parse with err: ${err}`);
        }

        return item;
    }
}
