"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hand = void 0;
const Card_1 = require("./Card");
class Hand {
    constructor() {
        this.cards = [];
    }
    addCard(card) {
        this.cards.push(card);
    }
    removeCard(card) {
        const index = this.cards.findIndex((c) => c.equals(card));
        if (index !== -1) {
            return this.cards.splice(index, 1)[0];
        }
        return Card_1.Card.Invalid;
    }
    getCards() {
        return [...this.cards];
    }
    updateModelFromState(hand) {
        this.cards = hand.map((card) => new Card_1.Card(card));
    }
}
exports.Hand = Hand;
