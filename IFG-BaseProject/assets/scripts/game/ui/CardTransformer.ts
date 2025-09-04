import { _decorator, Animation, AnimationState, Component } from 'cc';
import { SoundManager } from '../../audio/SoundManager';
import { Card } from '../../core';
import { CardVisual } from '../CardVisual';
const { ccclass, property } = _decorator;

@ccclass('CardTransformer')
export class CardTransformer extends Component {
    @property(CardVisual)
    cardVisual: CardVisual | null = null;

    private _currentState: AnimationState;
    private _animator: Animation = null;

    private _currentAnimFinished: boolean = false;

    public get cardAnimator() {
        return this._animator;
    }

    public get currentState() {
        return this._currentState;
    }

    public setCard(card: Card) {
        this.cardVisual.setToCard(card, card);
    }

    public getCard() {
        return this.cardVisual.card;
    }

    public playRefireSelectonAnim(onComplete: () => void = () => {}) {
        this._playAnim(4, onComplete);
    }

    public playRefireConfirmAnim(onComplete: () => void = () => {}) {
        this._playAnim(5, onComplete);
    }

    public playDeucesWildAnim(onComplete: () => void = () => {}) {
        SoundManager.instance.playSound('SFX_Gameplay_PowerUpReveal');
        this._playAnim(3, onComplete);
    }

    public playRankUpAnim(onComplete: () => void = () => {}) {
        this._playAnim(1, onComplete);
    }

    public playRankDownAnim(onComplete: () => void = () => {}) {
        this._playAnim(2, onComplete);
    }

    public playCookingTheBooksAnim(onComplete: () => void = () => {}) {
        this._playAnim(0, onComplete);
    }

    public playIdleAnim(onComplete: () => void = () => {}) {
        this._playAnim(6, onComplete);
    }

    public playLoosenYourBeltAnim(onComplete: () => void = () => {}) {
        SoundManager.instance.playSound('SFX_Gameplay_PowerUpReveal');
        this._playAnim(7, onComplete);
    }

    public playJokerActivateAnim(onComplete: () => void = () => {}) {
        this._playAnim(8, onComplete);
    }

    public playJokerEndAnim(onComplete: () => void = () => {}) {
        this._playAnim(9, onComplete);
    }

    public playCleanDownIdleAnim(onComplete: () => void = () => {}) {
        this._playAnim(10, onComplete);
    }

    public playCleanDownActivateAnim(isCardBeingRemoved: boolean, onComplete: () => void = () => {}) {
        if (isCardBeingRemoved) {
            this._playAnim(11, onComplete);
        } else {
            this._playAnim(15, onComplete);
        }
    }

    public playUnconfirmedAnimation(onComplete: () => void = () => {}) {
        this._playAnim(12, onComplete);
    }

    public playLockedAnimation(onComplete: () => void = () => {}) {
        this._playAnim(13, onComplete);
    }

    public playBurnAnim(onComplete: () => void = () => {}) {
        this._playAnim(14, onComplete);
    }

    private _playAnim(clip: number, onComplete: () => void = () => {}) {
        if (!this._animator) {
            this._animator = this.getComponentInChildren(Animation);
        }

        //Ensures the burn plays in full
        if (this._currentState && this._currentState.name === 'card-burn' && !this._currentAnimFinished) {
            return;
        }

        const clips = this._animator.clips;
        this._animator.play(clips[clip].name);
        this._currentAnimFinished = false;
        this._currentState = this._animator.getState(clips[clip].name);

        this._animator.once(Animation.EventType.FINISHED, () => {
            this._currentAnimFinished = true;
            onComplete();
        });
    }
}
