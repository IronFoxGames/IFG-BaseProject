import { Card } from './Card';

export class CardPlacement {
    boardIndex: number = -1;
    card: Card | null = null;
    originalCard?: Card | null = null;

    constructor(boardIndex: number, card: Card, originalCard?: Card | null) {
        this.boardIndex = boardIndex;
        this.card = card === null ? null : new Card(card);
        this.originalCard = originalCard == null ? this.card : new Card(originalCard);
    }

    public static fromObject(obj: any): CardPlacement {
        const card = Card.fromObject(obj.card);
        return new CardPlacement(obj.boardIndex, card);
    }
}
