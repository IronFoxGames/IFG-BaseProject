import { _decorator, Animation, AnimationComponent, CCString, Component, Node, SpriteFrame, tween, Vec3, Widget } from 'cc';
import { logger } from '../../logging';
import { DailyReward, RewardState } from './DailyReward';
const { ccclass, property } = _decorator;

export enum RewardBoxState {
    Init,
    Closed,
    Idle,
    Reveal,
    Flair,
    Vanish,
    Open
}

@ccclass('DailyRewardBox')
export class DailyRewardBox extends Component {
    @property({ type: AnimationComponent, visible: true })
    private _animationRoot: AnimationComponent;

    @property({ type: CCString, visible: true })
    private _boxCloseClipName: string = '';

    @property({ type: CCString, visible: true })
    private _boxIdleClipName: string = '';

    @property({ type: CCString, visible: true })
    private _boxRevealClipName: string = '';

    @property({ type: CCString, visible: true })
    private _boxFlairClipName: string = '';

    @property({ type: CCString, visible: true })
    private _boxVanishClipName: string = '';

    @property({ type: CCString, visible: true })
    private _boxOpenClipName: string = '';

    @property({ type: DailyReward, visible: true })
    private _freeReward: DailyReward = null;

    @property({ type: DailyReward, visible: true })
    private _clubReward: DailyReward = null;

    @property({ type: DailyReward, visible: true })
    private _clubRewardLocked: DailyReward = null;

    @property({ type: Node, visible: true })
    private _clubLogo: Node = null;

    @property({ type: Node, visible: true })
    private _clubLogoLocked: Node = null;

    private _state: RewardBoxState = RewardBoxState.Init;
    private _isPremiumUser: boolean = false;
    private _nodeInventoryTarget: Node;
    private _nodeUpsellTweenTarget: Node;
    private _log = logger.child('DailyRewardBox');

    public init(isPremiumUser: boolean, inventoryTweenTarget: Node, upsellTweenTarget: Node, showLogo: boolean) {
        this._isPremiumUser = isPremiumUser;
        this._nodeInventoryTarget = inventoryTweenTarget;
        this._nodeUpsellTweenTarget = upsellTweenTarget;
        this._freeReward.init(this._isPremiumUser);
        this._clubReward.init(this._isPremiumUser);
        this._clubRewardLocked.init(this._isPremiumUser);
        this._clubReward.node.active = this._isPremiumUser;
        this._clubRewardLocked.node.active = !this._isPremiumUser;
        this._clubLogo.active = showLogo;
        this._clubLogoLocked.active = showLogo;
    }

    public setPrizeSprites(prizeFree: SpriteFrame, prizeFreeAmount: number, prizeClub: SpriteFrame, prizeClubAmount: number) {
        this._freeReward.setPrizeSpriteAndAmount(prizeFree, prizeFreeAmount);
        this._clubReward.setPrizeSpriteAndAmount(prizeClub, prizeClubAmount);
        this._clubRewardLocked.setPrizeSpriteAndAmount(prizeClub, prizeClubAmount);
    }

    public async setState(state: RewardBoxState, skipAnims: boolean = false) {
        if (this._state == state) {
            return;
        }
        this._state = state;
        switch (this._state) {
            case RewardBoxState.Closed:
                await this._awaitAnimation(this._boxCloseClipName, skipAnims);
                break;
            case RewardBoxState.Idle:
                // Don't await; this anim loops
                this._awaitAnimation(this._boxIdleClipName, skipAnims);
                break;
            case RewardBoxState.Reveal:
                this._freeReward.setState(RewardState.Enter);
                this._clubReward.setState(RewardState.Enter);
                this._clubRewardLocked.setState(RewardState.Enter);
                await this._awaitAnimation(this._boxRevealClipName, skipAnims);
                break;
            case RewardBoxState.Flair:
                // Don't await; this anim loops
                this._awaitAnimation(this._boxFlairClipName, skipAnims);
                this._freeReward.setState(RewardState.Idle);
                this._clubReward.setState(RewardState.Idle);
                this._clubRewardLocked.setState(RewardState.Idle);
                break;
            case RewardBoxState.Vanish:
                this._freeReward.setState(RewardState.Claim);
                this._clubReward.setState(RewardState.Claim);
                this._clubRewardLocked.setState(RewardState.Claim);
                await this._rewardTween(skipAnims);
                await this._awaitAnimation(this._boxVanishClipName, skipAnims);
                break;
            case RewardBoxState.Open:
                this._freeReward.setState(RewardState.Enter);
                this._clubReward.setState(RewardState.Enter);
                this._clubRewardLocked.setState(RewardState.Enter);
                await this._awaitAnimation(this._boxOpenClipName, skipAnims);
                break;
            case RewardBoxState.Init:
            default:
                break;
        }
    }

    // 'Fly' the rewards to it's target tween position (off screen up for inventory, pogo modal for free -> club upsell)
    private async _rewardTween(skipAnims: boolean = false): Promise<void> {
        const clubReward = this._isPremiumUser ? this._clubReward : this._clubRewardLocked;
        const clubRewardTarget = this._isPremiumUser ? this._nodeInventoryTarget : this._nodeUpsellTweenTarget;
        const clubRewardTween = this._awaitBoosterTween(clubReward, clubRewardTarget, skipAnims);
        const freeRewardTween = this._awaitBoosterTween(this._freeReward, this._nodeInventoryTarget, skipAnims);
        await Promise.all([freeRewardTween, clubRewardTween]);
    }

    private _awaitAnimation(animationClipName: string, skipAnim: boolean = false): Promise<void> {
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

    private _awaitBoosterTween(reward: DailyReward, targetNode: Node, skipAnim: boolean = false): Promise<void> {
        // Widget will interfere with tweens; so kill it
        reward.getComponent(Widget)?.destroy();

        const worldPos = reward.node.worldPosition;
        reward.node.parent = targetNode;
        reward.node.worldPosition = worldPos;

        const duration = skipAnim ? 0 : 0.5;
        const targetScale = new Vec3(0.5, 0.5, 0.5);

        return new Promise((resolve) => {
            tween(reward.node)
                .to(duration, { position: Vec3.ZERO, scale: targetScale }, { easing: 'quadOut' })
                .call(() => {
                    resolve();
                })
                .start();
        });
    }
}
