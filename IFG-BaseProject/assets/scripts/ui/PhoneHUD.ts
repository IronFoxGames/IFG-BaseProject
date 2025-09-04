import { _decorator, Component, Node, Prefab, SpriteFrame } from 'cc';
import { UIElementAnimator } from '../game/ui/UIElementAnimator';
import { logger } from '../logging';
import { PhoneCallScreenUI as CallAppScreen } from './CallAppScreen';
import { TaskAppScreen } from './TaskAppScreen';
const { ccclass, property } = _decorator;

@ccclass('PhoneHUD')
export class PhoneHUD extends Component {
    public static OnPhoneCallEndedEvent = 'OnPhoneCallEndedEvent';
    public static OnPhoneCallAnsweredEvent = 'OnPhoneCallAnsweredEvent';

    @property({ type: Node, visible: true })
    public phoneNode: Node | null = null;

    @property({ type: CallAppScreen, visible: true })
    public callAppScreen: CallAppScreen | null = null;

    @property({ type: TaskAppScreen, visible: true })
    public taskAppScreen: TaskAppScreen;

    @property({ type: Node, visible: true })
    private _backgroundScrim: Node | null = null;

    @property({ type: Node, visible: true })
    private _darkenPhoneNode: Node | null = null;

    @property({ type: Prefab, visible: true })
    private _starPrefab: Prefab | null = null;

    @property({ type: UIElementAnimator, visible: true })
    private _uiElementAnimator: UIElementAnimator | null = null;

    @property(UIElementAnimator)
    public UIElementAnimators: UIElementAnimator[] = [];

    private _log = logger.child('PhoneHUD');

    public init() {
        if (!this.phoneNode) {
            this._log.error('PhoneNode is not set in the PhoneHUD component');
            return;
        }
        if (!this.callAppScreen) {
            this._log.error('CallAppScreen is not set in the PhoneHUD component');
            return;
        }
        if (!this.taskAppScreen) {
            this._log.error('TaskAppScreen is not set in the PhoneHUD component');
            return;
        }
        if (!this._backgroundScrim) {
            this._log.error('BackgroundScrim is not set in the PhoneHUD component');
            return;
        }
        if (!this._darkenPhoneNode) {
            this._log.error('DarkenPhoneNode is not set in the PhoneHUD component');
            return;
        }
        if (!this._starPrefab) {
            this._log.error('StarPrefab is not set in the PhoneHUD component');
            return;
        }
        if (!this._uiElementAnimator) {
            this._log.error('UIElementAnimator is not set in the PhoneHUD component');
            return;
        }

        this._playInAnimation();
    }

    public showPhoneCallScreen() {
        this._showScreen(PhoneScreenType.PhoneCallApp);
    }

    public showTaskScreen() {
        this._showScreen(PhoneScreenType.TaskApp);
    }

    public setPhoneCallIncoming(callerName: string, callerAvatar: SpriteFrame) {
        this.callAppScreen.setCallIncoming(callerName, callerAvatar);
    }

    public dimPhoneCall(active: boolean) {
        this._darkenPhoneNode.active = active;
    }

    protected onLoad(): void {
        this.callAppScreen.init(this._backgroundScrim, this.phoneNode);
    }

    private _showScreen(screenType: PhoneScreenType) {
        this._hideAllScreens();

        switch (screenType) {
            case PhoneScreenType.PhoneCallApp:
                this.callAppScreen.node.active = true;
                break;
            case PhoneScreenType.TaskApp:
                this.taskAppScreen.node.active = true;
                this.taskAppScreen.show();
                this.taskAppScreen.OnCloseButtonPressed = () => {
                    this._playOutAnimation();
                };
                break;
            default:
                this._log.error(`Tried to show an unsupported PhoneScreenType: ${screenType}`);
                break;
        }
    }

    private _hideAllScreens() {
        //Deactivate all screens before showing only the one correct one...
        this.callAppScreen.node.active = false;
        this.taskAppScreen.node.active = false;
    }

    private _playInAnimation() {
        this.UIElementAnimators.forEach((animator) => {
            animator.PlayInAnimation();
        });
    }

    private _playOutAnimation() {
        const animationPromises = this.UIElementAnimators.map((animator) => {
            return animator.PlayOutAnimation();
        });

        Promise.all(animationPromises).then(() => {
            if (this.OnClosedCallback) {
                this.OnClosedCallback();
            }
            this.node.destroy();
        });
    }

    public OnClosedCallback: (() => void) | null = null;
}

enum PhoneScreenType {
    Home = 'home',
    PhoneCallApp = 'phoneCallApp',
    TaskApp = 'taskApp',
    MessageApp = 'messageApp',
    SettingsApp = 'settingsApp'
}
