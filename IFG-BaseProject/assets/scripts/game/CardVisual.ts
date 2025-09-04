import { _decorator, Color, Component, Label, Sprite, SpriteFrame, Node } from 'cc';
import { Card } from '../core';
import { CardType } from '../core/model/Card';

const { ccclass, property } = _decorator;

@ccclass
export class CardVisual extends Component {
    @property(Label)
    label: Label = null!;

    @property(Sprite)
    backgroundSprite: Sprite = null!;

    @property(Sprite)
    rankSprite: Sprite = null!;

    @property(Node)
    burntSpriteNode: Node | null = null;

    @property(SpriteFrame)
    jokerSprite: SpriteFrame = null;

    @property(SpriteFrame)
    wildSprite: SpriteFrame = null;

    @property([SpriteFrame])
    suitSprites: SpriteFrame[] = [];

    @property([SpriteFrame])
    transformedSuitSprites: SpriteFrame[] = [];

    @property([SpriteFrame])
    clubRankSprites: SpriteFrame[] = [];

    @property([SpriteFrame])
    diamondRankSprites: SpriteFrame[] = [];

    @property([SpriteFrame])
    heartRankSprites: SpriteFrame[] = [];

    @property([SpriteFrame])
    spadeRankSprites: SpriteFrame[] = [];

    public static VisualSelectedEvent = 'OnVisualSelected';

    private _card: Card = null;
    private _originalCard: Card = null;
    private _isHighlighted: boolean = false;
    private _gridParent: Node = null;

    public get isHighlighted() {
        return this._isHighlighted;
    }

    public get card() {
        return this._card;
    }

    public get gridParent() {
        return this._gridParent;
    }

    onLoad() {}

    start() {}

    update(deltaTime: number) {}

    public setToCard(card: Card, originalCard: Card = null) {
        this._card = card;
        this._originalCard = originalCard ?? card;

        switch (this._card.type) {
            case CardType.Joker:
                this.backgroundSprite.spriteFrame = this.jokerSprite;
                break;
            case CardType.Wild:
                this.backgroundSprite.spriteFrame = this.wildSprite;
                break;
            case CardType.Regular:
                this.backgroundSprite.spriteFrame = this.suitSprites[this._card.suit];
                if (originalCard && originalCard.isJoker()) {
                    this.backgroundSprite.spriteFrame = this.transformedSuitSprites[this._card.suit];
                }
                break;
        }

        this.label.string = this._card.rankString();

        switch (this._card.suit) {
            case 0:
                this.rankSprite.spriteFrame = this.clubRankSprites[this._card.rank - 1];
                this.rankSprite.node.active = true;
                break;
            case 1:
                this.rankSprite.spriteFrame = this.clubRankSprites[this._card.rank - 1];
                this.rankSprite.node.active = true;
                break;
            case 2:
                this.rankSprite.spriteFrame = this.diamondRankSprites[this._card.rank - 1];
                this.rankSprite.node.active = true;
                break;
            case 3:
                this.rankSprite.spriteFrame = this.heartRankSprites[this._card.rank - 1];
                this.rankSprite.node.active = true;
                break;
            case 4:
                this.rankSprite.spriteFrame = this.spadeRankSprites[this._card.rank - 1];
                this.rankSprite.node.active = true;
                break;
        }
    }

    public setLocked(locked: boolean) {
        //For now, No Op!
        //TOOD: If the cards need to update visibly when they become locked, it should be done here...
        //let color = Color.WHITE;
        //if (locked) {
        //    color = new Color(200, 200, 200, 255);
        //}
        //this.backgroundSprite.color = color;
        //this.rankSprite.color = color;
    }

    public setHighlighted(isHighlighted: boolean) {
        this._isHighlighted = isHighlighted;

        if (isHighlighted) {
            this.backgroundSprite.color = Color.YELLOW;
        } else {
            this.backgroundSprite.color = Color.WHITE;
        }
    }

    public setBurnt(isBurnt: boolean) {
        this.burntSpriteNode.active = isBurnt;
    }

    public setGridParent(parent: Node) {
        this._gridParent = parent;
    }
}
