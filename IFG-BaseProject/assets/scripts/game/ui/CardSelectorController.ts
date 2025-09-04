import { _decorator, Button, Node } from 'cc';
import { ViewController } from './ViewController';
import { Card } from '../../core';
import { CardVisual } from '../CardVisual';
import { Vec3 } from 'cc';
import { Tween } from 'cc';
import { tween } from 'cc';
import { UIOpacity } from 'cc';
import { IFGButton } from '../../ui/IFGButton';
import { UITransform } from 'cc';
import { CCInteger } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('CardSelectorController')
export class CardSelectorController extends ViewController {
    @property({ type: Button, visible: true })
    private _confirmButton: Button;

    @property({ type: Button, visible: true })
    private _cancelButton: Button;

    @property({ type: Button, visible: true })
    private _suitSpadesButton: IFGButton;

    @property({ type: Button, visible: true })
    private _suitHeartsButton: IFGButton;

    @property({ type: Button, visible: true })
    private _suitClubsButton: IFGButton;

    @property({ type: Button, visible: true })
    private _suitDiamondsButton: IFGButton;

    @property({ type: Button, visible: true })
    private _rankChangeUpButton: Button;

    @property({ type: Button, visible: true })
    private _rankChangeDownButton: Button;

    @property({ type: [Node], visible: true })
    private _slots: Node[] = [];

    @property({ type: Node, visible: true })
    private _cardRoot: Node;

    @property({ type: [CardVisual], visible: true })
    private _cardVisuals: CardVisual[] = [];

    @property({ type: CardVisual, visible: true })
    private _selectedCard: CardVisual;

    @property({ type: CardVisual, visible: true })
    private _boardCard: CardVisual;

    @property({ type: CCInteger, visible: true })
    private _startingCardRank: number = 7;

    @property({ type: CCInteger, visible: true })
    private _startingCardSuit: number = 4;

    private _onSelectionCallback?: (card: Card) => void;

    private _cardTweens: Tween<Node>[] = [];

    private _cards: Card[] = [];
    private _lastSuitChange = 0;
    private _lastRankChangeDirection = 0;
    private _suitButtons: IFGButton[] = [];
    private _boardCardTween: Tween<Node> = null;
    private _boardCardScale: Vec3 = Vec3.ONE;
    private _boardTileNode: Node = null;
    private _boardScale: number = 1;
    private _initialized = false;
    private _loaded = false;

    protected start(): void {
        this._loaded = true;
        if (this._initialized) {
            this.show();
            this._init();
        }
    }

    public init(boardTileNode: Node, boardScale: number, onSelectionCallback: (card: Card) => void) {
        this._boardTileNode = boardTileNode;
        this._boardScale = boardScale;
        this._onSelectionCallback = onSelectionCallback;
        this._initialized = true;

        if (this._loaded) {
            this.show();
            this._init();
        }
    }

    private _init() {
        // Reposition to be where the card was played.
        const worldPos = this._boardTileNode.getWorldPosition();
        const parentTransform = this.node.getComponent(UITransform)!;
        const anchorOffset = new Vec3(parentTransform.width * parentTransform.anchorX, parentTransform.height * parentTransform.anchorY, 0);
        const localPos = parentTransform.convertToNodeSpaceAR(worldPos).subtract(anchorOffset);
        this._boardCard.node.setPosition(localPos);

        // Scale the card slots to cover the board at the same scale
        this._boardCardScale = new Vec3(this._boardScale, this._boardScale, 1);
        this._boardCard.node.setScale(this._boardCardScale);

        this._confirmButton.node.on(Button.EventType.CLICK, this._onConfirmSelection, this);
        this._cancelButton.node.on(Button.EventType.CLICK, this._onCancel, this);

        this._suitButtons = [this._suitClubsButton, this._suitDiamondsButton, this._suitHeartsButton, this._suitSpadesButton];
        this._suitClubsButton.node.on(Button.EventType.CLICK, this._onSuitChange.bind(this, 1), this);
        this._suitDiamondsButton.node.on(Button.EventType.CLICK, this._onSuitChange.bind(this, 2), this);
        this._suitHeartsButton.node.on(Button.EventType.CLICK, this._onSuitChange.bind(this, 3), this);
        this._suitSpadesButton.node.on(Button.EventType.CLICK, this._onSuitChange.bind(this, 4), this);

        this._rankChangeUpButton.node.on(Button.EventType.CLICK, this._onRankChange.bind(this, 1), this);
        this._rankChangeDownButton.node.on(Button.EventType.CLICK, this._onRankChange.bind(this, -1), this);

        // Setup default card state
        this._cardVisuals.forEach((cardVisual, index) => {
            const card = new Card(this._startingCardRank - 2 + index, this._startingCardSuit);
            this._cards.push(card);
            this._cardVisuals[index].setToCard(card, card);
        });
        this._lastSuitChange = this._startingCardSuit;
        this._suitButtons[this._startingCardSuit - 1].setToggleState(true);
        this._updateBoardCard();
    }

    public async show() {
        await super.show();
    }

    public async hide(): Promise<void> {
        await super.hide();
        this.node.destroy();
    }

    private _onSuitChange(suit: number) {
        if (this._lastSuitChange > 0) {
            this._suitButtons[this._lastSuitChange - 1].setToggleState(false);
        }

        this._cards.forEach((card, index) => {
            const cardVisual = this._cardVisuals[index];
            card.setSuit(suit);
            cardVisual.setToCard(card, card);
        });
        this._lastSuitChange = suit;

        this._updateBoardCard();
    }

    private _onRankChange(direction: number) {
        // Stop and snap any current tweens
        this._cards.forEach((card, index) => {
            const cardVisual = this._cardVisuals[index];
            const node = cardVisual.node;
            if (this._cardTweens[index]) {
                this._cardTweens[index].stop();
                this._cardTweens[index] = null;
                // Snap to final position before starting next tween
                node.setPosition(Vec3.ZERO);
                card.changeRank(this._lastRankChangeDirection);
                cardVisual.setToCard(card, card);
            }
        });
        this._cards.forEach((card, index) => {
            const slot = this._slots[index];
            const cardVisual = this._cardVisuals[index];
            const node = cardVisual.node;
            const targetIndex = index - direction;

            slot.setScale(new Vec3(0.9, 0.9, 0.9));
            slot.getComponent(UIOpacity).opacity = 200;

            // Tween to neighbour position
            let moveToPos = node.worldPosition;
            if (targetIndex >= 0 && targetIndex < this._cardVisuals.length) {
                moveToPos = this._cardVisuals[targetIndex].node.worldPosition.clone();
            }
            // Tween toward the neighbor card's position
            this._lastRankChangeDirection = direction;
            this._cardTweens[index] = tween(node)
                .to(0.1, { worldPosition: moveToPos }, { easing: 'quadOut' })
                .call(() => {
                    this._cardTweens[index] = null;
                    // Snap back to original position
                    node.setPosition(Vec3.ZERO);
                    card.changeRank(this._lastRankChangeDirection);
                    cardVisual.setToCard(card, card);
                    if (index == 2) {
                        slot.setScale(new Vec3(1.1, 1.1, 1.1));
                        slot.getComponent(UIOpacity).opacity = 255;
                    }

                    this._updateBoardCard();
                })
                .start();
        });
    }

    private async _updateBoardCard() {
        this._boardCard.setToCard(new Card(this._selectedCard.card));

        this._boardCardTween?.stop();
        this._boardCard.node.setScale(this._boardCardScale);

        this._boardCardTween = tween(this._boardCard.node)
            .parallel(
                // Shake (rotation)
                tween()
                    .repeat(
                        3,
                        tween()
                            .to(0.05, { eulerAngles: new Vec3(0, 0, 5) })
                            .to(0.05, { eulerAngles: new Vec3(0, 0, -5) })
                    )
                    .to(0.1, { eulerAngles: new Vec3(0, 0, 0) }, { easing: 'quadOut' }),

                // Scale relative to current
                tween()
                    .by(0.1, { scale: new Vec3(0.5, 0.5, 0) }, { easing: 'quadInOut' })
                    .by(0.1, { scale: new Vec3(-0.3, -0.3, 0) }, { easing: 'quadInOut' })
            )
            .start();
    }

    private async _onConfirmSelection() {
        this._onSelectionCallback?.call(this, this._selectedCard.card);
        await this.hide();
    }

    private async _onCancel() {
        this._onSelectionCallback?.call(this, null);
        await this.hide();
    }
}
