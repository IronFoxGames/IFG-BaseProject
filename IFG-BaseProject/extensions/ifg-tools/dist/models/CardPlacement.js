"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardPlacement = void 0;
const Card_1 = require("./Card");
class CardPlacement {
    constructor(boardIndex, card, originalCard) {
        this.boardIndex = -1;
        this.card = null;
        this.originalCard = null;
        this.boardIndex = boardIndex;
        this.card = card === null ? null : new Card_1.Card(card);
        this.originalCard = originalCard == null ? this.card : new Card_1.Card(originalCard);
    }
    static fromObject(obj) {
        const card = Card_1.Card.fromObject(obj.card);
        return new CardPlacement(obj.boardIndex, card);
    }
}
exports.CardPlacement = CardPlacement;
