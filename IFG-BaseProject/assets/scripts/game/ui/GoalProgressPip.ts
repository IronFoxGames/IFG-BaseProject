import { _decorator, Component, Animation } from 'cc';
import { AnimationComponent } from 'cc';

const { ccclass, property } = _decorator;

export enum GoalPipState {
    Init,
    Incomplete,
    Complete
}

@ccclass('GoalProgressPip')
export class GoalProgressPip extends Component {
    @property({ type: AnimationComponent, visible: true })
    private _animation: AnimationComponent | null = null;

    @property({ visible: true })
    private _pipOffClipName: string = '';

    @property({ visible: true })
    private _pipOnClipName: string = '';

    @property({ visible: true })
    private _pipTransitionClipName: string = '';

    private _pipState: GoalPipState = GoalPipState.Init;

    public start() {
        this.setState(GoalPipState.Incomplete);
    }

    public setState(pipState: GoalPipState) {
        if (this._pipState === pipState) {
            return;
        }
        this._pipState = pipState;

        switch (this._pipState) {
            case GoalPipState.Incomplete:
                this._animation.play(this._pipOffClipName);
                break;
            case GoalPipState.Complete:
                this._animation.play(this._pipTransitionClipName);
                this._animation.once(Animation.EventType.FINISHED, () => {
                    this._animation.play(this._pipOnClipName);
                });
                break;
        }
    }
}
