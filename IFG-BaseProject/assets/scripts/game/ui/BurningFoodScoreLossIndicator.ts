import { _decorator, Animation, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BurningFoodScoreLossIndicator')
export class BurningFoodScoreLossIndicator extends Component {
    @property(Label)
    scoreLabel: Label | null = null;

    private _anim: Animation;

    protected onLoad(): void {
        this._anim = this.getComponent(Animation);
    }

    public playScoreLossAnimation(scoreLossAmount: number, onComplete: () => void) {
        this.scoreLabel.string = `-${scoreLossAmount}`;

        this._anim.play(this._anim.clips[0].name);

        this._anim.once(Animation.EventType.FINISHED, onComplete, this);
    }
}
