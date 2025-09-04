"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemAndAmount = void 0;
class ItemAndAmount {
    constructor(id, amount) {
        this.id = id;
        this.amount = amount;
    }
    static fromObject(obj) {
        if ((obj === null || obj === void 0 ? void 0 : obj.id) == null || (obj === null || obj === void 0 ? void 0 : obj.amount) == null) {
            throw new Error(`Invalid ItemAndAmoun id=${obj === null || obj === void 0 ? void 0 : obj.id} amount=${obj === null || obj === void 0 ? void 0 : obj.amount}`);
        }
        return new ItemAndAmount(obj.id, obj.amount);
    }
}
exports.ItemAndAmount = ItemAndAmount;
