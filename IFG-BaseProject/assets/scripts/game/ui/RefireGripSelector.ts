import { Button, Animation } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { logger } from '../../logging';
const { ccclass, property } = _decorator;

@ccclass('RefireGripSelector')
export class RefireGripSelector extends Component {
    @property(Button)
    closeButton: Button | null = null;

    @property(Button)
    confirmButton: Button | null = null;

    @property(Node)
    animScrim: Node | null = null;

    private _animation: Animation;

    public static OnClosedEvent = 'OnClosedEvent';
    public static OnConfirmedEvent = 'OnConfirmedEvent';

    private _log = logger.child('RefireGripSelector');

    protected onLoad(): void {
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this._onClosePressed, this);
        } else {
            this._log.error('Close Button Is Null or Undefined');
        }

        if (this.confirmButton) {
            this.confirmButton.node.on(Button.EventType.CLICK, this._onConfirmPressed, this);
        } else {
            this._log.error('Confirm Button Is Null or Undefined');
        }

        this.confirmButton.node.active = false;

        this._animation = this.getComponent(Animation);
        this.animScrim.active = true;
    }

    public playOpenAnim() {
        this._animation.play(this._animation.clips[0].name);

        this._animation.once(Animation.EventType.FINISHED, () => {
            this.animScrim.active = false;
        });
    }

    public closeMenu(onComplete: () => void = () => {}) {
        this._animation.play(this._animation.clips[1].name);

        this._animation.once(Animation.EventType.FINISHED, () => {
            onComplete();
        });
    }

    public toggleConfirmButton(isOn: boolean) {
        this.confirmButton.node.active = isOn;
    }

    private _onClosePressed() {
        this.node.emit(RefireGripSelector.OnClosedEvent);
    }

    private _onConfirmPressed() {
        this.node.emit(RefireGripSelector.OnConfirmedEvent);
    }
}
