import { ProgressBar } from 'cc';
import { _decorator, Component, tween } from 'cc';

const { ccclass, property } = _decorator;
@ccclass('GoalProgressBar')
export class GoalProgressBar extends Component {
    @property({ type: ProgressBar, visible: true })
    private _progressBar: ProgressBar | null = null;

    public start() {
        this.setPercentage(0);
    }

    public setPercentage(percentage: number) {
        tween(this._progressBar)
            .to(
                0.3,
                {
                    progress: percentage
                },
                { easing: 'quadOut' }
            )
            .start();
    }
}
