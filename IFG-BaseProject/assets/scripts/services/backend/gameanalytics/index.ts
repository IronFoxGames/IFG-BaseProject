import { Static } from '@sinclair/typebox';
import { EDITOR } from 'cc/env';
import type { GameAnalytics as GA } from '../../../../thirdParty/GameAnalytics/GameAnalytics.d.ts';
import { GameAnalyticsConfig } from '../../../core/types/runtime/definitions';

export * from '../../../../thirdParty/GameAnalytics/Enums';

export let GameAnalytics: typeof GA = null;

export function initialize(config: Static<typeof GameAnalyticsConfig>, resourceCurrencies: string[], resourceItemTypes: string[]) {
    if (EDITOR) {
        return;
    }
    if (!config.enabled) {
        return;
    }

    const w = window as unknown as {
        gameanalytics: {
            GameAnalytics: typeof GA;
        };
    };

    GameAnalytics = w.gameanalytics.GameAnalytics;

    GameAnalytics.setEnabledVerboseLog(config.verboseLog);
    GameAnalytics.setEnabledInfoLog(config.infoLog);
    GameAnalytics.configureAvailableResourceCurrencies(resourceCurrencies); // max 50
    GameAnalytics.configureAvailableResourceItemTypes(resourceItemTypes); // max 20
    GameAnalytics.initialize(config.key, config.secret);
}

// convert digits to english spelling, remove everything else that isn't a-zA-Z
export function sanitizeResource(input: string): string {
    const digitToWord: Record<string, string> = {
        '0': 'zero',
        '1': 'one',
        '2': 'two',
        '3': 'three',
        '4': 'four',
        '5': 'five',
        '6': 'six',
        '7': 'seven',
        '8': 'eight',
        '9': 'nine'
    };

    return input
        .split('')
        .map((char) => {
            if (digitToWord[char]) {
                return digitToWord[char];
            } else if (/[a-zA-Z]/.test(char)) {
                return char;
            } else {
                return '';
            }
        })
        .join('');
}
