import { _decorator, Component, Node, Animation, AnimationState } from 'cc';
import { CardVisual } from '../CardVisual';
import { Card } from '../../core';
import { HandTier } from '../../core/enums/HandName';
import { logger } from '../../logging';
const { ccclass, property } = _decorator;

@ccclass('HandVisual')
export class HandVisual extends Component {
    public static OnHandSelectedEvent = 'OnHandSelected';
    public static OnAnimCompleteEvent = 'OnAnimCompleteEvent';

    @property(CardVisual)
    cards: CardVisual[] = [];

    @property(Node)
    animNode: Node | null = null;

    private _anim: Animation = null;
    private _destroyAfterAnim: boolean = false;
    private _log = logger.child('HandVisual');

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START, this._onHandSelected, this);

        this._anim = this.animNode.getComponent(Animation);
        this._anim.on(Animation.EventType.FINISHED, this._onAnimComplete, this);
    }

    public setCards(cards: Card[]) {
        if (cards.length !== 5) {
            this._log.error(`Error: Hand length must be 5. Recieved length was ${cards.length}`);
            return;
        }

        this.cards.forEach((cardVisual, i) => {
            cardVisual.setToCard(cards[i]);
        });
    }

    private _onHandSelected() {
        this.node.emit(HandVisual.OnHandSelectedEvent, this);
    }

    public playHandAnim(isHorizontal: boolean, destroyAfterPlay: boolean, handTier: HandTier) {
        const clips = this._anim.clips;

        if (isHorizontal) {
            switch (handTier) {
                case HandTier.Low:
                    this._anim.play(clips[0].name);
                    break;
                case HandTier.Mid:
                    this._anim.play(clips[2].name);
                    break;
                case HandTier.High:
                    this._anim.play(clips[4].name);
                    break;
                default:
                    this._anim.play(clips[0].name);
                    break;
            }
        } else {
            switch (handTier) {
                case HandTier.Low:
                    this._anim.play(clips[1].name);
                    break;
                case HandTier.Mid:
                    this._anim.play(clips[3].name);
                    break;
                case HandTier.High:
                    this._anim.play(clips[5].name);
                    break;
                default:
                    this._anim.play(clips[1].name);
                    break;
            }
        }

        this._destroyAfterAnim = destroyAfterPlay;
    }

    private _onAnimComplete(type: Animation.EventType, state: AnimationState) {
        if (this._destroyAfterAnim) {
            this._anim.off(Animation.EventType.FINISHED, this._onAnimComplete, this);
            this.node.emit(HandVisual.OnAnimCompleteEvent);
            this.node.destroy();
        }
    }
}
