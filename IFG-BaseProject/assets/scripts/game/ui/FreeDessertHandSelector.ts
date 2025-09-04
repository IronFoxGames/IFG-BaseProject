import { Button } from 'cc';
import { Label } from 'cc';
import { Prefab } from 'cc';
import { _decorator, Component, Node, Animation } from 'cc';
import { HandVisual } from './HandVisual';
import { Card, Hand, HandName } from '../../core';
import { CardVisual } from '../CardVisual';
import { instantiate } from 'cc';
import { NodeIdentifier } from '../../ui/NodeIdentifier';
import { FreeDessertHandOptionView } from './FreeDessertHandOptionView';
import { CCString } from 'cc';
import { TutorialService } from '../../services/TutorialService';
const { ccclass, property } = _decorator;

@ccclass('FreeDessertHandSelector')
export class FreeDessertHandSelector extends Component {
    @property(Node)
    handOptionParent: Node | null = null;

    @property(Prefab)
    handOptionPrefab: Prefab | null = null;

    @property(Button)
    closeButton: Button | null = null;

    @property(Animation)
    menuAnim: Animation | null = null;

    @property(Label)
    confirmedHandName: Label | null = null;

    @property(Label)
    confirmedHandScore: Label | null = null;

    @property(CardVisual)
    cardsInHand: CardVisual[] = [];

    @property({ type: CCString, visible: true })
    private _menuId: string;

    public static OnMenuClosedEvent = 'OnMenuClosedEvent';
    public static OnHandConfirmedEvent = 'OnHandConfirmedEvent';
    public static OnConfirmCompleteEvent = 'OnConfirmCompleteEvent';

    private _handOptions: Node[] = [];
    private _selectedHandType: HandName = HandName.Invalid;
    private _tutorialService: TutorialService;

    protected onLoad(): void {
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this._onMenuClosed, this);
        }
    }

    //for the confirmed hand
    public setHandInfo(handName: string, handScore: number, hand: Card[]) {
        this.confirmedHandName.string = handName;
        this.confirmedHandScore.string = handScore.toString();

        this.cardsInHand.forEach((card, index) => {
            card.setToCard(hand[index]);
        });
    }

    public setHandOptions(handNames: HandName[], handScores: number[]) {
        handNames.forEach((handName, index) => {
            const handOption = instantiate(this.handOptionPrefab);

            let handOptionComponent = handOption.getComponent(FreeDessertHandOptionView);

            const handOptionIdentifier = handOptionComponent.getComponent(NodeIdentifier);

            handOptionIdentifier.setIdentifier(`PuzzleState.FreeDessert.Hand.${handName}`);

            handOptionComponent.setInfo(handName, handScores[index]);
            handOption.on(FreeDessertHandOptionView.OnHandConfirmedEvent, this._onHandConfirmed, this);

            handOption.parent = this.handOptionParent;
            this._handOptions.push(handOption);
        });

        this._allHandOptionsLoaded();
    }

    public playOpenAnim() {
        this._playAnim(0);
    }

    public playConfirmAnim() {
        this._playAnim(1);
    }

    public playCloseAnim() {
        this._playAnim(2);
    }

    public setTutorialService(tutorialService: TutorialService) {
        this._tutorialService = tutorialService;
    }

    private _playAnim(clip: number) {
        const clips = this.menuAnim.clips;

        this._handOptions.forEach((option) => {
            option.getComponent(FreeDessertHandOptionView).toggleButton(false);
        });
        this.closeButton.interactable = false;

        this.menuAnim.play(clips[clip].name);

        this.menuAnim.once(Animation.EventType.FINISHED, () => {
            this._handOptions.forEach((option) => {
                option.getComponent(FreeDessertHandOptionView).toggleButton(true);
            });
            this.closeButton.interactable = true;

            //Sending Events After Animations Finish
            if (clip === 2) {
                //Close Event
                this.node.emit(FreeDessertHandSelector.OnMenuClosedEvent);
            } else if (clip == 1) {
                //Confirm Event
                this.node.emit(FreeDessertHandSelector.OnConfirmCompleteEvent, this._selectedHandType);
            }
        });
    }

    private _onHandConfirmed(handName: HandName) {
        this._selectedHandType = handName;

        this.node.emit(FreeDessertHandSelector.OnHandConfirmedEvent, this._selectedHandType);

        this._handOptions.forEach((hand) => {
            hand.off(FreeDessertHandOptionView.OnHandConfirmedEvent, this._onHandConfirmed, this);
        });

        this.playConfirmAnim();
    }

    private _allHandOptionsLoaded() {
        if (this._menuId && this._menuId !== '') {
            this._tutorialService.onMenuOpened(this._menuId);
        }
    }

    private _onMenuClosed() {
        this.playCloseAnim();
    }
}
