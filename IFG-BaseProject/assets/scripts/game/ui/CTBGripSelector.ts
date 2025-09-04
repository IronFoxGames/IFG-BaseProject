import { Button, Animation } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { logger } from '../../logging';
import { GripCard } from '../GripCard';
import { Card } from '../../core';
import { CardTransformer } from './CardTransformer';
import { SoundManager } from '../../audio/SoundManager';
const { ccclass, property } = _decorator;

@ccclass('CTBGripSelector')
export class CTBGripSelector extends Component {
    @property(Button)
    private closeButton: Button | null = null;

    @property(Button)
    private confirmButton: Button | null = null;

    @property(Button)
    private plusRankButton: Button | null = null;

    @property(Button)
    private minusRankButton: Button | null = null;

    @property(Button)
    private cardReturnButton: Button | null = null;

    @property(Node)
    private cardParent: Node | null = null;

    @property(CardTransformer)
    private cardTransformer: CardTransformer | null = null;

    @property(Node)
    animScrim: Node | null = null;

    public static OnClosedEvent = 'OnClosedEvent';
    public static OnConfirmedEvent = 'OnConfirmedEvent';
    public static OnCardReturnedEvent = 'OnCardReturnedEvent';

    private _log = logger.child('CTBGripSelector');
    private _cardToEdit: GripCard = null;
    private _originalRank: number;
    private _animation: Animation;

    public get cardToEdit() {
        return this._cardToEdit;
    }

    public get CardParent() {
        return this.cardParent;
    }

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

        if (this.plusRankButton) {
            this.plusRankButton.node.on(Button.EventType.CLICK, this._onRankIncreased, this);
        } else {
            this._log.error('Plus Rank Button Is Null or Undefined');
        }

        if (this.minusRankButton) {
            this.minusRankButton.node.on(Button.EventType.CLICK, this._onRankDecreased, this);
        } else {
            this._log.error('Minus Rank Button Is Null or Undefined');
        }

        if (this.cardReturnButton) {
            this.cardReturnButton.node.on(Button.EventType.CLICK, this._onCardReturned, this);
        } else {
            this._log.error('Card Return Button Is Null or Undefined');
        }

        this.confirmButton.node.active = false;
        this.plusRankButton.node.active = false;
        this.minusRankButton.node.active = false;
        this.cardTransformer.node.active = false;

        this._animation = this.getComponent(Animation);

        this.animScrim.active = true;
    }

    public playOpenAnim() {
        this._animation.play(this._animation.clips[0].name);

        this._animation.once(Animation.EventType.FINISHED, () => {
            this.animScrim.active = false;
        });
    }

    public setCard(card: GripCard) {
        this._cardToEdit = card;

        if (card) {
            this._originalRank = this._cardToEdit.getCard().rank;

            this.cardTransformer.node.active = true;
            this.cardTransformer.setCard(card.getCard());

            this.plusRankButton.node.active = true;
            this.minusRankButton.node.active = true;
        } else {
            this.cardTransformer.node.active = false;
            this.plusRankButton.node.active = false;
            this.minusRankButton.node.active = false;
            this.confirmButton.node.active = false;
        }
    }

    public toggleConfirmButton(isOn: boolean) {
        this.confirmButton.node.active = isOn;
    }

    public closeMenu(onComplete: () => void = () => {}) {
        this._animation.play(this._animation.clips[1].name);

        this._animation.once(Animation.EventType.FINISHED, () => {
            onComplete();
        });
    }

    private _onClosePressed() {
        this.node.emit(CTBGripSelector.OnClosedEvent);
    }

    private _onConfirmPressed() {
        SoundManager.instance.playSound('SFX_Gameplay_PowerUpReveal');
        this.cardTransformer.playCookingTheBooksAnim();
        this.cardTransformer.cardAnimator.once(Animation.EventType.FINISHED, () => {
            //this._cardToEdit.setCard(this.cardTransformer.getCard());
            this.node.emit(CTBGripSelector.OnConfirmedEvent, this.cardTransformer.getCard().rank);
        });
    }

    private _onRankIncreased() {
        let currentCard = this.cardTransformer.getCard();
        let newRank = currentCard.rank + 1;

        if (newRank > 13) {
            newRank = 1;
        }

        this.cardTransformer.setCard(new Card(newRank, currentCard.suit));

        if (newRank === this._originalRank) {
            this.confirmButton.node.active = false;
            this.plusRankButton.node.active = true;
        } else {
            this.confirmButton.node.active = true;
            this.plusRankButton.node.active = false;
        }
        this.minusRankButton.node.active = true;

        this.cardTransformer.playRankUpAnim();
    }

    private _onRankDecreased() {
        let currentCard = this.cardTransformer.getCard();
        let newRank = currentCard.rank - 1;

        if (newRank < 1) {
            newRank = 13;
        }

        this.cardTransformer.setCard(new Card(newRank, currentCard.suit));

        if (newRank === this._originalRank) {
            this.confirmButton.node.active = false;
            this.minusRankButton.node.active = true;
        } else {
            this.confirmButton.node.active = true;
            this.minusRankButton.node.active = false;
        }
        this.plusRankButton.node.active = true;

        this.cardTransformer.playRankDownAnim();
    }

    private _onCardReturned() {
        if (this._cardToEdit) {
            this.cardTransformer.node.active = false;

            this.node.emit(CTBGripSelector.OnCardReturnedEvent);
        }
    }
}
