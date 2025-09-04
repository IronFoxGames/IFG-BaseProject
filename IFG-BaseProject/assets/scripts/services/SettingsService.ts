import { Setting } from '../core/enums/Settings';
import { ICardScrambleService } from './ICardScrambleService';
import { ISettingsService } from './ISettingsService';

type SettingChangeCallback = (newValue: unknown) => void;

export class SettingsService implements ISettingsService {
    private _settings: Map<string, unknown> = new Map();
    private _listeners: Map<string, SettingChangeCallback[]> = new Map();

    private _cardScrambleService: ICardScrambleService = null;

    public initialize(cardScrambleService: ICardScrambleService): void {
        this._cardScrambleService = cardScrambleService;
        this._settings = this._cardScrambleService.getSettings();
    }

    public getSetting<T>(setting: Setting, defaultValue?: T): T {
        return (this._settings.has(setting) ? this._settings.get(setting) : defaultValue) as T;
    }

    public setSetting<T>(setting: Setting, value: T): void {
        this._settings.set(setting, value);
        this._notifyListeners(setting, value);
    }

    public saveSettings(): void {
        this._cardScrambleService.saveSettings(this._settings);
    }

    public onSettingChanged(setting: Setting, callback: (newValue: unknown) => void): void {
        if (!this._listeners.has(setting)) {
            this._listeners.set(setting, []);
        }
        this._listeners.get(setting)?.push(callback);
    }

    public sendSettingsCTAClickedEvent(eventData: any) {
        this._cardScrambleService.sendGa4Event(eventData);
    }

    private _notifyListeners(setting: Setting, newValue: unknown): void {
        if (this._listeners.has(setting)) {
            this._listeners.get(setting)?.forEach((callback) => {
                callback(newValue);
            });
        }
    }
}
