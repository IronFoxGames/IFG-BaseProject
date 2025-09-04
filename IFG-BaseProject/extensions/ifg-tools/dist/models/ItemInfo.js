"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemInfo = void 0;
const ItemType_1 = require("../enums/ItemType");
const RequirementFactory_1 = require("./requirements/RequirementFactory");
class ItemInfo {
    constructor(id, externalId, type, sprite, name, tooltip, requirements, isCurrency) {
        this.id = id;
        this.externalId = externalId !== null && externalId !== void 0 ? externalId : null;
        this.type = type;
        this.sprite = sprite;
        this.name = name;
        this.tooltip = tooltip;
        this.requirements = requirements;
        this.isCurrency = isCurrency;
    }
    static fromObject(obj) {
        var _a;
        if (!obj || typeof obj.id !== 'string' || obj.type == null || obj.sprite == null || typeof obj.sprite !== 'string' || obj.name == null) {
            throw new Error('Invalid ItemInfo');
        }
        if (!Object.values(ItemType_1.ItemType).includes(obj.type)) {
            throw new Error(`Invalid ItemInfo[${obj.id}] - ItemType is invalid: ${obj.type}`);
        }
        let reqs = [];
        if (Array.isArray(obj.requirements)) {
            reqs = obj.requirements.map((o) => RequirementFactory_1.RequirementFactory.fromObject(o));
        }
        return new ItemInfo(obj.id, obj.externalId, obj.type, obj.sprite, obj.name, (_a = obj.tooltip) !== null && _a !== void 0 ? _a : '', reqs, obj.isCurrency || false);
    }
}
exports.ItemInfo = ItemInfo;
