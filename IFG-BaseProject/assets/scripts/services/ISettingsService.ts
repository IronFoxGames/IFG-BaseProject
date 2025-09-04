import { Setting } from '../core/enums/Settings';
import { ICardScrambleService } from './ICardScrambleService';

export interface ISettingsService {
    initialize(cardScrambleService: ICardScrambleService): void;

    getSetting<T>(setting: Setting, defaultValue?: T): T;
    setSetting<T>(setting: Setting, value: T): void;

    saveSettings(): void;

    sendSettingsCTAClickedEvent(eventData: any);

    onSettingChanged(setting: Setting, callback: (newValue: unknown) => void): void;
}
