"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyAndAmount = void 0;
const Currency_1 = require("../enums/Currency");
class CurrencyAndAmount {
    constructor(currency, amount) {
        this.currency = currency;
        this.amount = amount;
    }
    static fromObject(obj) {
        if ((obj === null || obj === void 0 ? void 0 : obj.currency) == null || (obj === null || obj === void 0 ? void 0 : obj.amount) == null) {
            throw new Error('Invalid CurrencyAndAmount, missing currency or amount field');
        }
        const currency = Object.values(Currency_1.Currency).includes(obj.currency) ? obj.currency : Currency_1.Currency.None;
        if (currency == Currency_1.Currency.None) {
            throw new Error(`Invalid CurrencyAndAmount currency unknown ${obj.currency}`);
        }
        return new CurrencyAndAmount(currency, (obj === null || obj === void 0 ? void 0 : obj.amount) || 0);
    }
}
exports.CurrencyAndAmount = CurrencyAndAmount;
