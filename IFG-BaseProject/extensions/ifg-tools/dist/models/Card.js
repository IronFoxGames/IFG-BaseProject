"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = exports.CardType = void 0;
var CardType;
(function (CardType) {
    CardType["Invalid"] = "invalid";
    CardType["Regular"] = "regular";
    CardType["Joker"] = "joker";
    CardType["Wild"] = "wild";
    CardType["Crown"] = "crown";
})(CardType = exports.CardType || (exports.CardType = {}));
class Card {
    constructor(rankOrCard, suit, type = CardType.Regular) {
        this.type = CardType.Regular;
        if (rankOrCard instanceof Card) {
            this.rank = rankOrCard.rank;
            this.suit = rankOrCard.suit;
            this.type = rankOrCard.type;
        }
        else {
            this.rank = rankOrCard;
            this.suit = suit;
            this.type = type !== null && type !== void 0 ? type : CardType.Regular;
            // Old joker/wild catcher
            if (!type && (rankOrCard == 0 || this.suit == 0)) {
                throw new Error(`Initializing a card without type rankOrCard=${rankOrCard} suit=${suit} type=${type}`);
            }
        }
    }
    static lessThan(left, right) {
        return left.compareTo(right) < 0;
    }
    static greaterThan(left, right) {
        return left.compareTo(right) > 0;
    }
    static lessThanOrEqual(left, right) {
        return left.compareTo(right) <= 0;
    }
    static greaterThanOrEqual(left, right) {
        return left.compareTo(right) >= 0;
    }
    static equalsOperator(left, right) {
        return left.equals(right);
    }
    static notEqualsOperator(left, right) {
        return !left.equals(right);
    }
    isJoker() {
        return this.type === CardType.Joker;
    }
    isWild() {
        return this.type === CardType.Wild;
    }
    isCrownCard() {
        return this.type === CardType.Crown;
    }
    static updateRank(currentRank, increaseAmount) {
        let newRank = currentRank + increaseAmount;
        if (newRank >= 14) {
            newRank = 1;
        }
        if (newRank <= 0) {
            newRank = 13;
        }
        return newRank;
    }
    setSuit(suit) {
        this.suit = suit;
    }
    changeSuit(change) {
        const totalSuits = Card.Suits.length;
        this.suit = ((((this.suit - 1 + change) % totalSuits) + totalSuits) % totalSuits) + 1;
    }
    changeRank(change) {
        const totalRanks = Card.Ranks.length;
        this.rank = ((((this.rank - 1 + change) % totalRanks) + totalRanks) % totalRanks) + 1;
    }
    toString() {
        switch (this.type) {
            case CardType.Joker:
                return 'Joker';
            case CardType.Invalid:
                return 'Invalid';
            case CardType.Wild:
                return 'Wild';
            case CardType.Crown:
                return `${Card.Ranks[this.rank - 1]}♛`;
            case CardType.Regular:
                return `${Card.Ranks[this.rank - 1]}${Card.Suits[this.suit - 1]}`;
        }
        return '<unknown>';
    }
    rankString() {
        return this.rank === -1 || this.rank === 0 ? '' : `${Card.Ranks[this.rank - 1]}`.toUpperCase();
    }
    equals(other) {
        return this.rank === other.rank && this.suit === other.suit && this.type === other.type;
    }
    rankEquals(other) {
        return this.rank === other.rank;
    }
    suitEquals(other) {
        return this.suit === other.suit;
    }
    compareTo(other) {
        const rankComparison = this.rank - other.rank;
        if (rankComparison !== 0)
            return rankComparison;
        return this.suit - other.suit;
    }
    static fromObject(obj) {
        return new Card(obj.rank, obj.suit, obj.type);
    }
}
exports.Card = Card;
Card.C = '♣';
Card.D = '♦';
Card.H = '♥';
Card.S = '♠';
Card.Suits = [Card.C, Card.D, Card.H, Card.S];
Card.Ranks = ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k'];
Card.Invalid = new Card(-1, -1, CardType.Invalid);
Card.Wild = new Card(0, 0, CardType.Wild);
Card.Joker = new Card(0, 0, CardType.Joker);
Card.AceOfSpades = new Card(1, 4, CardType.Regular);
