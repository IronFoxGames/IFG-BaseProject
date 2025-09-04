import { Sprite } from 'cc';
import { Tween } from 'cc';
import { SpriteFrame } from 'cc';
import { Button } from 'cc';
import { Label } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { SoundManager } from '../audio/SoundManager';
import { tween } from 'cc';
import { Vec3 } from 'cc';
import { PhoneHUD } from './PhoneHUD';
import { Quat } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PhoneCallScreenUI')
export class PhoneCallScreenUI extends Component {
    @property(Label)
    callerNameLabel: Label | null = null;

    @property(Label)
    callAlertLabel: Label | null = null;

    @property(Label)
    callTimerLabel: Label | null = null;

    @property(Sprite)
    callerAvatarSprite: Sprite | null = null;

    @property(Button)
    answerCallButton: Button | null = null;

    @property(Button)
    endCallButton: Button | null = null;

    private _elapsedCallTime: number = 0;
    private _isCallActive: boolean = false;

    private _incomingCallTween: Tween<Node> = null;
    private _backgroundScrim: Node;
    private _phoneNode: Node;

    protected onLoad(): void {
        this.answerCallButton.node.on(Button.EventType.CLICK, this.setCallActive, this);
        this.endCallButton.node.on(Button.EventType.CLICK, this._endCall, this);
    }

    protected update(dt: number): void {
        if (this._isCallActive) {
            this._elapsedCallTime += dt;
            this.callTimerLabel.string = this.convertTimeToString(this._elapsedCallTime);
        }
    }

    public init(backgroundScrim: Node, phoneNode: Node) {
        this._backgroundScrim = backgroundScrim;
        this._phoneNode = phoneNode;
    }

    public setCallIncoming(callerName: string, callerAvatar: SpriteFrame) {
        this.callerNameLabel.string = callerName;
        this.callerAvatarSprite.spriteFrame = callerAvatar;

        this.callAlertLabel.node.active = true;
        this.callTimerLabel.node.active = false;

        this.answerCallButton.node.active = true;
        this.endCallButton.node.active = false;

        this._backgroundScrim.active = true;

        SoundManager.instance.playSound('SFX_Dialogue_PhoneRing');

        this._incomingCallTween = tween(this._phoneNode)
            .repeatForever(
                tween(this._phoneNode)
                    .to(0.05, { eulerAngles: new Vec3(0, 0, -2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, 2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, -2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, 2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, -2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, 2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, -2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, 2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, -2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, 2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, -2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, 2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, -2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, 2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, -2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, 2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, -2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, 2.5) })
                    .to(0.05, { eulerAngles: new Vec3(0, 0, 0) })
                    .delay(0.65)
            )
            .start();
    }

    private setCallActive() {
        this.node.emit(PhoneHUD.OnPhoneCallAnsweredEvent);

        this.callAlertLabel.node.active = false;
        this.callTimerLabel.node.active = true;

        this.setAnswerButtonVisible(false);
        this.setEndCallButtonVisible(true);

        this.callTimerLabel.string = '00:00';
        this._elapsedCallTime = 0;
        this._isCallActive = true;

        this._backgroundScrim.active = false;

        SoundManager.instance.stopSoundByName('SFX_Dialogue_PhoneRing');

        if (this._incomingCallTween) {
            this._incomingCallTween.stop();
            this._incomingCallTween = null;
            this._phoneNode.setRotation(Quat.IDENTITY);
        }
    }

    public setAnswerButtonVisible(visible: boolean) {
        this.answerCallButton.node.active = visible;
    }

    public setEndCallButtonVisible(visible: boolean) {
        this.endCallButton.node.active = visible;
    }

    private _endCall() {
        this.node.emit(PhoneHUD.OnPhoneCallEndedEvent);
    }

    private convertTimeToString(time: number): string {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);

        const minStr = minutes.toString().padStart(2, '0');
        const secStr = seconds.toString().padStart(2, '0');

        return `${minStr}:${secStr}`;
    }
}
