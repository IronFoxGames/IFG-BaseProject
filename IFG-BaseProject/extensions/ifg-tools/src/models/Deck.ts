import { Card } from './Card';

export class Deck {
    public static readonly allCards: Card[] = Deck.generateAllCards();
    private currentCards: Card[];

    constructor() {
        // Initialize the deck with the default contents
        this.currentCards = [...Deck.allCards];
        this.currentCards.push(new Card(Card.Joker), new Card(Card.Joker));
    }

    private static generateAllCards(): Card[] {
        const cards: Card[] = [];
        for (let suit = 1; suit <= 4; suit++) {
            for (let rank = 1; rank <= 13; rank++) {
                cards.push(new Card(rank, suit));
            }
        }
        return cards;
    }

    shuffle(): void {
        const random = Math.random;

        for (let i = 0; i < this.currentCards.length; i++) {
            const j = Math.floor(random() * (this.currentCards.length - i)) + i;
            [this.currentCards[i], this.currentCards[j]] = [this.currentCards[j], this.currentCards[i]];
        }
    }

    updateModelFromState(deck: Card[]): void {
        this.currentCards = deck.map((card) => new Card(card));
    }
}
