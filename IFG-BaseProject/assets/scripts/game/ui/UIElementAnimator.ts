import { _decorator, Component, Animation, AnimationClip, Node } from 'cc';
import { logger } from '../../logging';

const { ccclass, property } = _decorator;

@ccclass('UIElementAnimator')
export class UIElementAnimator extends Component {
    @property(Animation)
    public AnimationComponent: Animation;

    @property(AnimationClip)
    public InClip: AnimationClip | null = null;

    @property(AnimationClip)
    public OutClip: AnimationClip | null = null;

    @property(AnimationClip)
    public SkipInClip: AnimationClip | null = null;

    @property(AnimationClip)
    public SkipOutClip: AnimationClip | null = null;

    private _inStateName: string | null = null;
    private _outStateName: string | null = null;
    private _skipInStateName: string | null = null;
    private _skipOutStateName: string | null = null;
    private _previouslyPlayedStateName: string | null = null;
    private _log = logger.child('UIElementAnimator');

    public onLoad() {
        if (this.InClip) {
            this._inStateName = this.InClip.name;
            this.AnimationComponent.addClip(this.InClip);
        }

        if (this.OutClip) {
            this._outStateName = this.OutClip.name;
            this.AnimationComponent.addClip(this.OutClip);
        }

        if (this.SkipInClip) {
            this._skipInStateName = this.SkipInClip.name;
            this.AnimationComponent.addClip(this.SkipInClip);
        }

        if (this.SkipOutClip) {
            this._skipOutStateName = this.SkipOutClip.name;
            this.AnimationComponent.addClip(this.SkipOutClip);
        }

        this._previouslyPlayedStateName = this._outStateName;
    }

    public async PlayInAnimation(): Promise<void> {
        if (!this._inStateName) return;
        try {
            await this._playAnimation(this._inStateName);
        } catch (err) {
            this._log.error(`UIElementAnimator.PlayInAnimation failed for [${this._inStateName}]`, err);
        }
    }

    public async PlayOutAnimation(): Promise<void> {
        if (!this._outStateName) return;
        try {
            await this._playAnimation(this._outStateName);
        } catch (err) {
            this._log.error(`UIElementAnimator.PlayOutAnimation failed for [${this._outStateName}]`, err);
        }
    }

    public SkipCurrentAnimation() {
        this.AnimationComponent.stop();
        if (!this._previouslyPlayedStateName) {
            return;
        }

        switch (this._previouslyPlayedStateName) {
            case this._inStateName:
                this._log.debug('Skipping in animation...');
                this.AnimationComponent.play(this._skipInStateName);
                break;
            case this._outStateName:
                this._log.debug('Skipping out animation...');
                this.AnimationComponent.play(this._skipOutStateName);
                break;
            default:
                throw new Error('Unsupported animation clip name was passed to SkipCurrentAnimation...');
        }
    }

    private _playAnimation(stateName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.AnimationComponent.play(stateName);
                const onFinished = () => {
                    this.AnimationComponent.off(Animation.EventType.FINISHED, onFinished, this);
                    this._previouslyPlayedStateName = stateName;
                    resolve();
                };

                this.AnimationComponent.once(Animation.EventType.FINISHED, onFinished, this);
            } catch (err) {
                this._log.error(`Failed to play animation [${stateName}]`, err);
                reject(err);
            }
        });
    }
}
