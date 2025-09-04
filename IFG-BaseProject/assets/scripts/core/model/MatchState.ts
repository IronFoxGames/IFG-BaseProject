import { Card } from './Card';
import { Turn } from './Turn';
import { BoardModifier } from './BoardModifier';

export class MatchState {
    turns: Turn[] = [];
    deck: Card[] = [];
    playerHand: Card[] = [];
    opponentHand: Card[] = [];
    boardModifiers: BoardModifier[][] = [];

    constructor(deck: Card[] = [], boardModifiers: BoardModifier[][] = []) {
        this.deck = deck;
        this.boardModifiers = boardModifiers;
    }

    // 0 - host turn, 1 - challenger turn, repeat
    get turn(): number {
        return this.turns.length;
    }
}
