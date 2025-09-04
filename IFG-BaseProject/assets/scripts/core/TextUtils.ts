export class TextUtils {
    public static stringifyCurrencyCount(amount: number): string {
        const trillion = 1000000000000;
        const billion = 1000000000;
        const million = 1000000;
        const thousand = 1000;

        switch (true) {
            case amount >= trillion: {
                return this._simplifyCurrencyCount(amount, trillion, 'T');
            }
            case amount >= billion: {
                return this._simplifyCurrencyCount(amount, billion, 'B');
            }
            case amount >= million: {
                return this._simplifyCurrencyCount(amount, million, 'M');
            }
            case amount >= 10 * thousand: {
                return this._simplifyCurrencyCount(amount, thousand, 'K');
            }
            default: {
                return `${amount}`;
            }
        }
    }

    private static _simplifyCurrencyCount(amount: number, threshold: number, suffix: string): string {
        let simplifiedAmount = amount / threshold;

        if (simplifiedAmount > 10) {
            return `${Math.trunc(simplifiedAmount)}${suffix}`;
        } else {
            return `${simplifiedAmount}${suffix}`;
        }
    }
}
