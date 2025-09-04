import { _decorator, Component, Node, CCString, Animation, RichText } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('InfoTooltip')
export class InfoTooltip extends Component {
    @property({ type: RichText, visible: true })
    private _richText: RichText;

    @property({ type: Animation, visible: true })
    private _animation: Animation;

    @property({ type: CCString, visible: true })
    private _showAnimationClipName: string = 'tooltip-opening';

    @property({ type: CCString, visible: true })
    private _hideAnimationClipName: string = 'tooltip-closing';

    private _lastClipPlayed: string = 'none';

    public init(): void {
        this._animation.on(Animation.EventType.FINISHED, this.onAnimationFinished, this);
        this.node.active = false;
    }

    public show(message: string) {
        this.node.active = true;
        this._richText.string = message;
        this._animation.play(this._showAnimationClipName);
        this._lastClipPlayed = this._showAnimationClipName;
    }

    public hide() {
        this._animation.play(this._hideAnimationClipName);
        this._lastClipPlayed = this._hideAnimationClipName;
    }

    protected onDestroy(): void {
        this._animation.off(Animation.EventType.FINISHED, this.onAnimationFinished, this);
    }

    private onAnimationFinished() {
        if (this._lastClipPlayed === this._hideAnimationClipName) {
            this.node.active = false;
        }
    }
}
