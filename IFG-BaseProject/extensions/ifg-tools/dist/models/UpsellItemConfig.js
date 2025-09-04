"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsellItemConfig = void 0;
class UpsellItemConfig {
    constructor() {
        this.itemId = '';
        this.catalogItemIds = [];
        this.upsellText = '';
    }
    static fromObject(obj) {
        if ((obj === null || obj === void 0 ? void 0 : obj.itemId) == null || (obj === null || obj === void 0 ? void 0 : obj.catalogItemIds) == null || (obj === null || obj === void 0 ? void 0 : obj.upsellText) == null) {
            throw new Error(`Invalid UpsellItemConfig[id=${obj === null || obj === void 0 ? void 0 : obj.itemId}]: missing catalogItemIds or upsellText`);
        }
        let item = new UpsellItemConfig();
        item.itemId = (obj === null || obj === void 0 ? void 0 : obj.itemId) || '';
        if (Array.isArray(obj.catalogItemIds)) {
            item.catalogItemIds = obj.catalogItemIds.map((id) => id);
        }
        else {
            item.catalogItemIds = [];
        }
        item.upsellText = (obj === null || obj === void 0 ? void 0 : obj.upsellText) || '';
        return item;
    }
}
exports.UpsellItemConfig = UpsellItemConfig;
