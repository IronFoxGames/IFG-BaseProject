export enum CardType {
    Invalid = 'invalid',
    Regular = 'regular',
    Joker = 'joker',
    Wild = 'wild',
    Crown = 'crown'
}

export class Card {
    public static readonly C = '♣';
    public static readonly D = '♦';
    public static readonly H = '♥';
    public static readonly S = '♠';

    public static readonly Suits = [Card.C, Card.D, Card.H, Card.S];
    public static readonly Ranks = ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k'];

    public static readonly Invalid = new Card(-1, -1, CardType.Invalid);
    public static readonly Wild = new Card(0, 0, CardType.Wild);
    public static readonly Joker = new Card(0, 0, CardType.Joker);
    public static readonly AceOfSpades = new Card(1, 4, CardType.Regular);

    public rank: number;
    public suit: number;
    public type: CardType = CardType.Regular;

    constructor(rankOrCard: number | Card, suit?: number, type: CardType = CardType.Regular) {
        if (rankOrCard instanceof Card) {
            this.rank = rankOrCard.rank;
            this.suit = rankOrCard.suit;
            this.type = rankOrCard.type;
        } else {
            this.rank = rankOrCard;
            this.suit = suit!;
            this.type = type ?? CardType.Regular;

            // Old joker/wild catcher
            if (!type && (rankOrCard == 0 || this.suit == 0)) {
                throw new Error(`Initializing a card without type rankOrCard=${rankOrCard} suit=${suit} type=${type}`);
            }
        }
    }

    public static lessThan(left: Card, right: Card): boolean {
        return left.compareTo(right) < 0;
    }

    public static greaterThan(left: Card, right: Card): boolean {
        return left.compareTo(right) > 0;
    }

    public static lessThanOrEqual(left: Card, right: Card): boolean {
        return left.compareTo(right) <= 0;
    }

    public static greaterThanOrEqual(left: Card, right: Card): boolean {
        return left.compareTo(right) >= 0;
    }

    public static equalsOperator(left: Card, right: Card): boolean {
        return left.equals(right);
    }

    public static notEqualsOperator(left: Card, right: Card): boolean {
        return !left.equals(right);
    }

    public isJoker() {
        return this.type === CardType.Joker;
    }

    public isWild() {
        return this.type === CardType.Wild;
    }

    public isCrownCard(): boolean {
        return this.type === CardType.Crown;
    }

    public static updateRank(currentRank: number, increaseAmount: number): number {
        let newRank = currentRank + increaseAmount;

        if (newRank >= 14) {
            newRank = 1;
        }
        if (newRank <= 0) {
            newRank = 13;
        }

        return newRank;
    }

    public setSuit(suit: number) {
        this.suit = suit;
    }

    public changeSuit(change: number) {
        const totalSuits = Card.Suits.length;
        this.suit = ((((this.suit - 1 + change) % totalSuits) + totalSuits) % totalSuits) + 1;
    }

    public changeRank(change: number) {
        const totalRanks = Card.Ranks.length;
        this.rank = ((((this.rank - 1 + change) % totalRanks) + totalRanks) % totalRanks) + 1;
    }

    public toString(): string {
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

    public rankString(): string {
        return this.rank === -1 || this.rank === 0 ? '' : `${Card.Ranks[this.rank - 1]}`.toUpperCase();
    }

    public equals(other: Card): boolean {
        return this.rank === other.rank && this.suit === other.suit && this.type === other.type;
    }

    public rankEquals(other: Card): boolean {
        return this.rank === other.rank;
    }

    public suitEquals(other: Card): boolean {
        return this.suit === other.suit;
    }

    public compareTo(other: Card): number {
        const rankComparison = this.rank - other.rank;
        if (rankComparison !== 0) return rankComparison;
        return this.suit - other.suit;
    }

    public static fromObject(obj: any): Card {
        return new Card(obj.rank, obj.suit, obj.type);
    }
}
