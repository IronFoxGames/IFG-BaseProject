import { _decorator, Component, Node, Sprite, SpriteFrame, Animation } from 'cc';
import { tween } from 'cc';
import { Label } from 'cc';
import { Vec3 } from 'cc';
import { AnimationComponent } from 'cc';
import { CCString } from 'cc';
import { logger } from '../../logging';
const { ccclass, property } = _decorator;

export enum RewardState {
    Init,
    Enter,
    Idle,
    Claim
}

@ccclass('DailyReward')
export class DailyReward extends Component {
    @property({ type: AnimationComponent, visible: true })
    private _animationRoot: AnimationComponent;

    @property({ type: CCString, visible: true })
    private _rewardEnterClipName: string = '';

    @property({ type: CCString, visible: true })
    private _rewardIdleClipName: string = '';

    @property({ type: CCString, visible: true })
    private _rewardClaimClipName: string = '';

    @property({ type: Sprite, visible: true })
    private _rewardSprite: Sprite = null;

    @property({ type: Label, visible: true })
    private _rewardAmountLabel: Label = null;

    @property({ type: Node, visible: true })
    private _visibleRoot: Node = null;

    private _state: RewardState = RewardState.Init;
    private _isPremiumUser: boolean = false;
    private _nodeInventoryTarget: Node;
    private _nodeUpsellTweenTarget: Node;
    private _log = logger.child('DailyReward');

    public init(isPremiumUser: boolean) {
        this._isPremiumUser = isPremiumUser;
        this._visibleRoot.active = false;
    }

    public setPrizeSpriteAndAmount(prizeFree: SpriteFrame, prizeFreeAmount: number) {
        this._rewardSprite.spriteFrame = prizeFree;
        this._rewardAmountLabel.string = `${prizeFreeAmount}`;
    }

    public async setState(state: RewardState, skipAnims: boolean = false) {
        if (this._state == state) {
            return;
        }
        this._state = state;
        switch (this._state) {
            case RewardState.Enter:
                this._visibleRoot.active = true;
                await this._awaitAnimation(this._rewardEnterClipName, skipAnims);
                break;
            case RewardState.Idle:
                // Don't await; this anim loops
                this._awaitAnimation(this._rewardIdleClipName, skipAnims);
                break;
            case RewardState.Claim:
                // When fast forwarding to the claimed state coming back to the screen, make sure that the prize is visible as it short circuits some
                // of the claim animation sequence.
                if (!this._visibleRoot.active) {
                    this.scheduleOnce(() => {
                        this._visibleRoot.active = true;
                    });
                }
                this._animationRoot?.stop();
                //await this._awaitAnimation(this._rewardClaimClipName, skipAnims);
                break;
        }
    }

    private _awaitAnimation(animationClipName: string, skipAnim: boolean = false): Promise<void> {
        // Locked doesn't have animations
        if (!this._isPremiumUser || !this._animationRoot) {
            return;
        }

        return new Promise((resolve, reject) => {
            try {
                this._animationRoot.play(animationClipName);

                if (skipAnim) {
                    const state = this._animationRoot.getState(animationClipName);
                    if (state) {
                        state.setTime(state.duration);
                        state.sample();
                    }
                }

                this._animationRoot.once(Animation.EventType.FINISHED, () => {
                    resolve();
                });
            } catch (error) {
                this._log.warn('DailyRewardView: error playing animation clip: ', error);
                reject(error);
            }
        });
    }
}
