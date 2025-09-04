import { _decorator, Button, Component, EventHandler, Label, Node } from 'cc';
import { AppConfig } from '../../config/AppConfig';
import { Setting } from '../../core/enums/Settings';
import { logger } from '../../logging';
import { ISettingsService } from '../../services/ISettingsService';
import { Services } from '../../state/Services';
import { SoundSettingControl } from '../../ui/SoundSettingControl';
import { PopupLayout, PopupResult, PopupType } from './GeneralPopup';
import { UIElementAnimator } from './UIElementAnimator';

const { ccclass, property } = _decorator;

@ccclass('SettingsScreenController')
export class SettingsScreenController extends Component {
    @property({ type: Button, visible: true, group: 'Buttons' })
    private _closeButton: Button;
    @property({ type: Button, visible: true, group: 'Buttons' })
    private _quitPuzzleButton: Button;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _howToPlayButton: Button;

    // Sound Controls

    @property({ type: SoundSettingControl, visible: true, group: 'Options' })
    private _musicControl: SoundSettingControl;

    @property({ type: SoundSettingControl, visible: true, group: 'Options' })
    private _sfxControl: SoundSettingControl;

    @property({ type: Node, visible: true })
    private _scrim: Node;

    // Build info
    @property({ type: Label, visible: true })
    private _buildNumberLabel: Label;
    @property({ type: Label, visible: true })
    private _buildDateLabel: Label;

    @property(UIElementAnimator)
    public UIElementAnimators: UIElementAnimator[] = [];

    private _settings: ISettingsService;
    private _services: Services;
    private _log = logger.child('SettingsScreenController');

    private _onCloseSettingsCallback?: () => void;
    private _onQuitGameCallback?: () => void;
    private _onHowToPlayCallback?: () => void;

    private static readonly _className: string = 'SettingsScreenController';

    public show(
        isInGameplay: boolean,
        config: AppConfig,
        services: Services,
        onCloseCallback: () => void,
        onQuitGameCallback: () => void,
        onHowToPlayCallback: () => void
    ) {
        this._services = services;
        this._settings = services.settingsService;

        if (this.node) {
            this.node.active = true;
        } else {
            this._log.error('Node is not defined!');
        }

        if (isInGameplay) {
            this._howToPlayButton.node.active = false;
        } else {
            this._howToPlayButton.node.active = true;
        }

        this._quitPuzzleButton.node.active = isInGameplay;

        const musicEnabled = this._settings.getSetting<boolean>(Setting.MusicEnabled, true);
        const currentMusicVolume = this._settings.getSetting<number>(Setting.MusicVolume, 0.5);
        this._musicControl.setInitialSettings(musicEnabled, currentMusicVolume);

        const sfxEnabled = this._settings.getSetting<boolean>(Setting.SFXEnabled, true);
        const currentSFXVolume = this._settings.getSetting<number>(Setting.SFXVolume, 0.5);
        this._sfxControl.setInitialSettings(sfxEnabled, currentSFXVolume);

        this._buildNumberLabel.string = `Build: ${config.buildNumber}`;
        this._buildDateLabel.string = `${config.timestamp}`;

        this._scrim.active = true;

        this._onCloseSettingsCallback = onCloseCallback;
        this._onQuitGameCallback = onQuitGameCallback;
        this._onHowToPlayCallback = onHowToPlayCallback;

        this._playInAnimation();
    }

    public hide() {
        if (this.node) {
            this.node.active = false;
        } else {
            this._log.error('Node is not defined!');
        }
    }

    public onCloseButtonPressedCallback() {
        this._settings.saveSettings();
        this._onCloseSettingsCallback?.call(this);
        this._playOutAnimation();
    }

    public onHowToPlayButtonPressed() {
        this._settings.saveSettings();
        this.onCloseButtonPressedCallback();
        this._onHowToPlayCallback?.call(this);
    }

    public onQuitGameButtonPressedCallback() {
        this.showQuitConfirmation();
        this._playOutAnimation();
    }

    public showQuitConfirmation() {
        this._services.UIOverlayService.showGeneralPopup(
            PopupType.OK_Cancel,
            'Quit Puzzle',
            `Are you sure you want to quit?`,
            null,
            (result) => {
                if (result === PopupResult.Cancel) {
                    this._onQuitGameCallback?.call(this);
                }
            },
            PopupLayout.Vertical,
            'Continue',
            'Quit'
        );
    }

    protected start(): void {
        this._addEventHandler(this._closeButton.clickEvents, 'onCloseButtonPressedCallback');
        this._addEventHandler(this._quitPuzzleButton.clickEvents, 'onQuitGameButtonPressedCallback');
        this._addEventHandler(this._howToPlayButton.clickEvents, 'onHowToPlayButtonPressed');

        this._musicControl.OnSettingChanged = (enabled, volume) => this._onMusicChange(enabled, volume);
        this._sfxControl.OnSettingChanged = (enabled, volume) => this._onSFXChange(enabled, volume);
    }

    private _onMusicChange(enabled: boolean, volume: number) {
        this._settings.setSetting<boolean>(Setting.MusicEnabled, enabled);
        this._settings.setSetting<number>(Setting.MusicVolume, volume);

        this._services.cardScrambleService.sendGa4Event({
            game_event_type: 'click',
            game_event_location: 'settings-sound'
        });
    }

    private _onSFXChange(enabled: boolean, volume: number) {
        this._settings.setSetting<boolean>(Setting.SFXEnabled, enabled);
        this._settings.setSetting<number>(Setting.SFXVolume, volume);

        this._services.cardScrambleService.sendGa4Event({
            game_event_type: 'click',
            game_event_location: 'settings-sound'
        });
    }

    private _addEventHandler(eventHandlerList: EventHandler[], callbackName: string) {
        const eventHandler = new EventHandler();
        eventHandler.target = this.node;
        eventHandler.component = SettingsScreenController._className;
        eventHandler.handler = callbackName;
        eventHandlerList.push(eventHandler);
    }

    private _playInAnimation() {
        this.UIElementAnimators.forEach((animator) => {
            animator.PlayInAnimation();
        });
    }

    private _playOutAnimation() {
        this._scrim.active = false;
        this.UIElementAnimators.forEach((animator) => {
            animator.PlayOutAnimation();
        });
    }
}
