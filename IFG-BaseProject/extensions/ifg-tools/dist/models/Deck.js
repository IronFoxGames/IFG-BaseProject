"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deck = void 0;
const Card_1 = require("./Card");
class Deck {
    constructor() {
        // Initialize the deck with the default contents
        this.currentCards = [...Deck.allCards];
        this.currentCards.push(new Card_1.Card(Card_1.Card.Joker), new Card_1.Card(Card_1.Card.Joker));
    }
    static generateAllCards() {
        const cards = [];
        for (let suit = 1; suit <= 4; suit++) {
            for (let rank = 1; rank <= 13; rank++) {
                cards.push(new Card_1.Card(rank, suit));
            }
        }
        return cards;
    }
    shuffle() {
        const random = Math.random;
        for (let i = 0; i < this.currentCards.length; i++) {
            const j = Math.floor(random() * (this.currentCards.length - i)) + i;
            [this.currentCards[i], this.currentCards[j]] = [this.currentCards[j], this.currentCards[i]];
        }
    }
    updateModelFromState(deck) {
        this.currentCards = deck.map((card) => new Card_1.Card(card));
    }
}
exports.Deck = Deck;
Deck.allCards = Deck.generateAllCards();
