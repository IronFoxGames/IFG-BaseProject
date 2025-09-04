"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchState = void 0;
class MatchState {
    constructor(deck = [], boardModifiers = []) {
        this.turns = [];
        this.deck = [];
        this.playerHand = [];
        this.opponentHand = [];
        this.boardModifiers = [];
        this.deck = deck;
        this.boardModifiers = boardModifiers;
    }
    // 0 - host turn, 1 - challenger turn, repeat
    get turn() {
        return this.turns.length;
    }
}
exports.MatchState = MatchState;
