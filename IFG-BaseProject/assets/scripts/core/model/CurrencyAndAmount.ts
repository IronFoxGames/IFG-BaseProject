import { Currency } from '../enums/Currency';

export class CurrencyAndAmount {
    public currency: Currency;
    public amount: number;

    constructor(currency: Currency, amount: number) {
        this.currency = currency;
        this.amount = amount;
    }

    public static fromObject(obj: any): CurrencyAndAmount {
        if (obj?.currency == null || obj?.amount == null) {
            throw new Error('Invalid CurrencyAndAmount, missing currency or amount field');
        }

        const currency = Object.values(Currency).includes(obj.currency) ? (obj.currency as Currency) : Currency.None;
        if (currency == Currency.None) {
            throw new Error(`Invalid CurrencyAndAmount currency unknown ${obj.currency}`);
        }

        return new CurrencyAndAmount(currency, obj?.amount || 0);
    }
}
