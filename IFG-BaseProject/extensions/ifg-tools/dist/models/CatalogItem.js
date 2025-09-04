"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogItem = void 0;
const Currency_1 = require("../enums/Currency");
const CurrencyAndAmount_1 = require("./CurrencyAndAmount");
const ItemAndAmount_1 = require("./ItemAndAmount");
class CatalogItem {
    constructor() {
        this.id = '';
        this.externalIds = [];
        this.name = '';
        this.description = '';
        this.valueTag = '';
        this.cost = new CurrencyAndAmount_1.CurrencyAndAmount(Currency_1.Currency.None, 0);
        this.sprite = '';
        this.contents = [];
        this.tags = [];
        this.stack = false;
        this.priority = 0;
        this.collapsedVisible = false;
        this.isUpsell = false;
        this.maxPurchaseCount = 0;
    }
    static fromItem(catalogItem) {
        let item = new CatalogItem();
        item.id = catalogItem.id;
        item.externalIds = [...catalogItem.externalIds];
        item.name = catalogItem.name;
        item.description = catalogItem.description;
        item.valueTag = catalogItem.valueTag;
        item.cost = new CurrencyAndAmount_1.CurrencyAndAmount(catalogItem.cost.currency, catalogItem.cost.amount);
        catalogItem.contents.forEach((contentItem) => {
            item.contents.push(new ItemAndAmount_1.ItemAndAmount(contentItem.id, contentItem.amount));
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
    static fromAsset(id, assetId, name, cost, spritePath, tags) {
        let item = new CatalogItem();
        item.id = id;
        item.externalIds = [];
        item.name = name;
        item.description = '';
        item.valueTag = '';
        item.cost = cost;
        item.contents = [new ItemAndAmount_1.ItemAndAmount(assetId, 1)];
        item.sprite = spritePath;
        item.tags = tags;
        item.stack = false;
        item.priority = 0;
        item.collapsedVisible = false;
        item.isUpsell = false;
        item.maxPurchaseCount = 0;
        return item;
    }
    static fromObject(obj) {
        var _a, _b, _c, _d, _e;
        if (obj == null ||
            (obj === null || obj === void 0 ? void 0 : obj.id) == null ||
            (obj === null || obj === void 0 ? void 0 : obj.name) == null ||
            (obj === null || obj === void 0 ? void 0 : obj.description) == null ||
            (obj === null || obj === void 0 ? void 0 : obj.cost) == null ||
            (obj === null || obj === void 0 ? void 0 : obj.sprite) == null ||
            (obj === null || obj === void 0 ? void 0 : obj.contents) == null ||
            !Array.isArray(obj.contents || !Array.isArray(obj.tags))) {
            throw new Error(`Invalid item[id=${obj === null || obj === void 0 ? void 0 : obj.id}]; missing id, name, description, cost, sprite or contents`);
        }
        let item = null;
        try {
            item = new CatalogItem();
            item.id = (obj === null || obj === void 0 ? void 0 : obj.id) || '';
            if (Array.isArray(obj.externalIds)) {
                item.externalIds = obj.externalIds.map((id) => id);
            }
            else {
                item.externalIds = [];
            }
            item.name = (obj === null || obj === void 0 ? void 0 : obj.name) || '';
            item.description = (obj === null || obj === void 0 ? void 0 : obj.description) || '';
            item.valueTag = (obj === null || obj === void 0 ? void 0 : obj.valueTag) || '';
            item.cost = CurrencyAndAmount_1.CurrencyAndAmount.fromObject(obj.cost);
            item.sprite = (obj === null || obj === void 0 ? void 0 : obj.sprite) || '';
            if (Array.isArray(obj.contents)) {
                item.contents = obj.contents.map((item) => ItemAndAmount_1.ItemAndAmount.fromObject(item));
            }
            if (Array.isArray(obj.tags)) {
                item.tags = obj.tags.map((tag) => tag);
            }
            item.stack = (_a = obj === null || obj === void 0 ? void 0 : obj.stack) !== null && _a !== void 0 ? _a : false;
            item.priority = (_b = obj === null || obj === void 0 ? void 0 : obj.priority) !== null && _b !== void 0 ? _b : 0;
            item.collapsedVisible = (_c = obj === null || obj === void 0 ? void 0 : obj.collapsedVisible) !== null && _c !== void 0 ? _c : false;
            item.isUpsell = (_d = obj === null || obj === void 0 ? void 0 : obj.isUpsell) !== null && _d !== void 0 ? _d : false;
            item.maxPurchaseCount = (_e = obj === null || obj === void 0 ? void 0 : obj.maxPurchaseCount) !== null && _e !== void 0 ? _e : 0;
        }
        catch (err) {
            throw new Error(`Invalid CatalogItem; failed to parse with err: ${err}`);
        }
        return item;
    }
}
exports.CatalogItem = CatalogItem;
