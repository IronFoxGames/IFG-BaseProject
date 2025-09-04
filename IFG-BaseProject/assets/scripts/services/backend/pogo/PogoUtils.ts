import { Currency } from '../../../core/enums/Currency';

export class PogoUtils {
    public static PogoToScrambleCurrency(currency: string): Currency {
        if (currency === '_PG') {
            return Currency.Gems;
        } else if (currency === 'CARD_SCRAMBLE_COINS') {
            return Currency.Coins;
        }

        return Currency.None;
    }

    public static ScrambleToPogoCurrency(currency: Currency): string {
        if (currency === Currency.Gems) {
            return '_PG';
        } else if (currency === Currency.Coins) {
            return 'CARD_SCRAMBLE_COINS';
        }

        return '';
    }
}
