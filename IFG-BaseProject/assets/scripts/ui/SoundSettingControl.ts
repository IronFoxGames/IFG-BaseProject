import { _decorator, Button, Color, Component, EventHandler, Label, Slider, Sprite, Toggle } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundSettingControl')
export class SoundSettingControl extends Component {
    public OnSettingChanged: (enabled: boolean, value: number) => void;

    @property
    public ButtonStep: number = 0.1;

    @property({ type: Toggle, visible: true })
    private _toggleButton: Toggle;

    @property({ type: Button, visible: true })
    private _increaseButton: Button;

    @property({ type: Button, visible: true })
    private _decreaseButton: Button;

    @property({ type: Button, visible: true })
    private _sliderHandleButton: Button;

    @property({ type: Slider, visible: true })
    private _slider: Slider;

    @property({ type: Label, visible: true })
    private _percentageLabel: Label;

    @property({ type: Color, visible: true })
    private _sliderColor: Color = new Color(255, 255, 255, 255);

    private _settingEnabled: boolean = true;
    private _progress: number = 1;
    private _sliderSprite: Sprite = null;
    private _sliderHandleSprite: Sprite = null;

    private static readonly _className: string = 'SoundSettingControl';

    onLoad() {
        this._sliderSprite = this._slider.node.getComponent(Sprite);
        this._sliderHandleSprite = this._sliderHandleButton.node.getComponent(Sprite);
    }

    start() {
        this._addEventHandler(this._increaseButton.clickEvents, 'onIncreaseButtonPress');
        this._addEventHandler(this._decreaseButton.clickEvents, 'onDecreaseButtonPress');
        this._addEventHandler(this._slider.slideEvents, 'onSliderChange');
        this._addEventHandler(this._toggleButton.checkEvents, 'onToggleChange');

        this._slider.progress = this._progress;

        this._updateState(false);
    }

    public setInitialSettings(enabled: boolean, progress: number) {
        this._settingEnabled = enabled;
        this._progress = progress;
        this._updateState(false);
    }

    public onToggleChange() {
        this._settingEnabled = !this._toggleButton.isChecked;

        // If the setting is re-enabled set the progress to 20%, if not set it to 0
        if (this._settingEnabled) {
            this._progress = 0.2;
            this._slider.progress = this._progress;
        } else {
            this._progress = 0;
            this._slider.progress = 0;
        }

        this._updateState();
    }

    public onIncreaseButtonPress() {
        // Move to the nearest step if not already aligned, otherwise increase by one step
        const nextStep = Math.ceil(this._progress / this.ButtonStep) * this.ButtonStep;
        this._progress = this._progress < nextStep ? nextStep : Math.min(1, this._progress + this.ButtonStep);
        this._settingEnabled = true;
        this._slider.progress = this._progress;

        // Re-enable the setting if the player moves the slider
        if (this._progress > 0) {
            this._toggleButton.isChecked = false;
        }

        this._updateState();
    }

    public onDecreaseButtonPress() {
        // Move to the nearest step if not already aligned, otherwise decrease by one step
        const prevStep = Math.floor(this._progress / this.ButtonStep) * this.ButtonStep;
        this._progress = this._progress > prevStep ? prevStep : Math.max(0, this._progress - this.ButtonStep);
        this._slider.progress = this._progress;

        // Disable the setting if the player moves the slider to 0
        if (this._progress === 0) {
            this._toggleButton.isChecked = true;
        }

        this._updateState();
    }

    public onSliderChange() {
        this._progress = this._slider.progress;

        // Re-enable the setting if the player moves the slider
        if (this._progress > 0) {
            this._toggleButton.isChecked = false;
        }

        this._updateState();
    }

    private _updateState(changed: boolean = true) {
        this._toggleButton.isChecked = !this._settingEnabled;

        //If the setting is disabled, set the text to OFF, and gray out the slider
        if (this._settingEnabled) {
            this._percentageLabel.string = `${Math.round(this._progress * 100)}%`;
            this._sliderHandleSprite.grayscale = false;
            this._sliderSprite.color = this._sliderColor;
        } else {
            this._percentageLabel.string = 'OFF';
            this._sliderHandleSprite.grayscale = true;
            this._sliderSprite.color = new Color(180, 180, 180, 255);
        }

        //If the slider is at min or max disable the min or max arrow button
        if (this._progress <= 0) {
            this._decreaseButton.interactable = false;
        } else {
            this._decreaseButton.interactable = true;
        }

        if (this._progress >= 1) {
            this._increaseButton.interactable = false;
        } else {
            this._increaseButton.interactable = true;
        }

        if (changed) {
            this.OnSettingChanged?.call(this, this._settingEnabled, this._progress);
        }
    }

    private _addEventHandler(eventHandlerList: EventHandler[], callbackName: string) {
        const eventHandler = new EventHandler();
        eventHandler.target = this.node;
        eventHandler.component = SoundSettingControl._className;
        eventHandler.handler = callbackName;
        eventHandlerList.push(eventHandler);
    }
}
