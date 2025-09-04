import { Card } from './Card';

export class Hand {
    private cards: Card[] = [];

    addCard(card: Card): void {
        this.cards.push(card);
    }

    removeCard(card: Card): Card {
        const index = this.cards.findIndex((c) => c.equals(card));
        if (index !== -1) {
            return this.cards.splice(index, 1)[0];
        }
        return Card.Invalid;
    }

    getCards(): Card[] {
        return [...this.cards];
    }

    updateModelFromState(hand: Card[]): void {
        this.cards = hand.map((card) => new Card(card));
    }
}
