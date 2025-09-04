import { Card } from './Card';
import { TileState } from '../enums/TileState';
import { BoardModifier } from './BoardModifier';
import { BoardModifierType } from '../enums/BoardModifierType';

export class GameBoardTileModel {
    state: TileState;
    card: Card;
    originalCard: Card;
    turn: number;
    boardModifierList: BoardModifier[];

    constructor() {
        this.state = TileState.Empty;
        this.card = Card.Invalid;
        this.originalCard = Card.Invalid;
        this.boardModifierList = [];
        this.turn = -1;
    }

    placeCard(card: Card, originalCard: Card): void {
        this.card = card;
        this.originalCard = originalCard;
        this.state = TileState.Occupied_Unflipped;
    }

    pickUpCard(): Card {
        if (this.card == Card.Invalid) {
            return Card.Invalid;
        }

        const pickedUpCard = new Card(this.card);
        this.card = Card.Invalid;
        this.originalCard = Card.Invalid;
        this.state = TileState.Empty;
        return pickedUpCard;
    }

    lockCardInPlace(): void {
        if (!this.card.equals(Card.Invalid)) {
            this.state = TileState.Occupied;
        }
    }

    // special case modifier because it's not removable, doesn't expire, and changes board render
    isNullTile() {
        const currentModifier = this.boardModifierList?.[0];
        return currentModifier?.type === BoardModifierType.Null;
    }

    updateModelFromState(tile: GameBoardTileModel | null): void {
        // Update card state
        if (!tile?.card || tile?.card === Card.Invalid) {
            this.card = Card.Invalid;
            this.originalCard = Card.Invalid;
            this.state = TileState.Empty;
            this.turn = -1;
        } else {
            this.card = new Card(tile.card);
            this.originalCard = this.card; // Don't preserve 'original' untransformed card across state changes once it's locked in.
            this.state = TileState.Occupied;
            this.turn = tile.turn;
        }

        // Update modifier state
        this.boardModifierList = [];
        tile?.boardModifierList?.forEach((modifier) => {
            this.boardModifierList.push(modifier);
        });
    }
}
