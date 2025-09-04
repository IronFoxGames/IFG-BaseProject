import { Card } from './model/Card';
import { Deck } from './model/Deck';
import { HandAnalyzer } from './HandAnalyzer';
import { HandClassification } from './model/HandClassification';
import { HandName, HandNameToString } from './enums/HandName';
import { BoardModifier, HandMultiplierModifier } from './model/BoardModifier';
import { BoardModifierType } from './enums/BoardModifierType';
import { logger } from '../logging';

class CardAndBoardModifier {
    card: Card;
    boardModifier: BoardModifier;

    constructor(card: Card, boardModifier: BoardModifier) {
        this.card = card;
        this.boardModifier = boardModifier;
    }

    compareTo(other: CardAndBoardModifier): number {
        return this.card.compareTo(other.card);
    }
}

export class RankedHandScorer {
    public static readonly Lowball: ReadonlyArray<Card> = [new Card(2, 1), new Card(3, 1), new Card(4, 1), new Card(5, 2), new Card(7, 3)];

    public static readonly PaiGow: ReadonlyArray<Card> = [new Card(1, 1), new Card(9, 1), new Card(11, 1), new Card(12, 2), new Card(13, 3)];

    public static readonly Wheel: ReadonlyArray<Card> = [new Card(1, 1), new Card(2, 1), new Card(3, 1), new Card(4, 2), new Card(5, 3)];

    public static readonly Broadway: ReadonlyArray<Card> = [new Card(1, 1), new Card(10, 1), new Card(11, 1), new Card(12, 2), new Card(13, 3)];

    public static readonly SteelWheel: ReadonlyArray<Card> = [new Card(1, 1), new Card(2, 1), new Card(3, 1), new Card(4, 1), new Card(5, 1)];

    public static readonly RoyalFlush: ReadonlyArray<Card> = [
        new Card(1, 4),
        new Card(10, 4),
        new Card(11, 4),
        new Card(12, 4),
        new Card(13, 4)
    ];

    public static readonly HandBaseValues: Map<HandName, number> = new Map([
        [HandName.Singleton, 1000],
        [HandName.OnePair, 1150],
        [HandName.TwoPair, 1400],
        [HandName.ThreeOfAKind, 1950],
        [HandName.Straight, 2250],
        [HandName.Flush, 2750],
        [HandName.FullHouse, 3350],
        [HandName.FourOfAKind, 4000],
        [HandName.StraightFlush, 4500],
        [HandName.FiveOfAKind, 5250],
        [HandName.RoyalFlush, 5650]
    ]);

    public static readonly ThreeJokerModifierPermutations: number[][] = [
        [0, 1, 2],
        [0, 2, 1],

        [1, 0, 2],
        [1, 2, 0],

        [2, 0, 1],
        [2, 1, 0]
    ];

    public static readonly FourJokerModifierPermutations: number[][] = [
        [0, 1, 2, 3],
        [0, 1, 3, 2],
        [0, 2, 1, 3],
        [0, 2, 3, 1],
        [0, 3, 1, 2],
        [0, 3, 2, 1],

        [1, 0, 2, 3],
        [1, 0, 3, 2],
        [1, 2, 0, 3],
        [1, 2, 3, 0],
        [1, 3, 0, 2],
        [1, 3, 2, 0],

        [2, 0, 1, 3],
        [2, 0, 3, 1],
        [2, 1, 0, 3],
        [2, 1, 3, 0],
        [2, 3, 0, 1],
        [2, 3, 1, 0],

        [3, 0, 1, 2],
        [3, 0, 2, 1],
        [3, 1, 0, 2],
        [3, 1, 2, 0],
        [3, 2, 0, 1],
        [3, 2, 1, 0]
    ];

    public static readonly FiveJokerModifierPermutations: number[][] = [
        [0, 1, 2, 3, 4],
        [0, 1, 2, 4, 3],
        [0, 1, 3, 2, 4],
        [0, 1, 3, 4, 2],
        [0, 1, 4, 2, 3],
        [0, 1, 4, 3, 2],

        [0, 2, 1, 3, 4],
        [0, 2, 1, 4, 3],
        [0, 2, 3, 1, 4],
        [0, 2, 3, 4, 1],
        [0, 2, 4, 1, 3],
        [0, 2, 4, 3, 1],

        [0, 3, 1, 2, 4],
        [0, 3, 1, 4, 2],
        [0, 3, 2, 1, 4],
        [0, 3, 2, 4, 1],
        [0, 3, 4, 1, 2],
        [0, 3, 4, 2, 1],

        [0, 4, 1, 2, 3],
        [0, 4, 1, 3, 2],
        [0, 4, 2, 1, 3],
        [0, 4, 2, 3, 1],
        [0, 4, 3, 1, 2],
        [0, 4, 3, 2, 1],

        [1, 0, 2, 3, 4],
        [1, 0, 2, 4, 3],
        [1, 0, 3, 2, 4],
        [1, 0, 3, 4, 2],
        [1, 0, 4, 2, 3],
        [1, 0, 4, 3, 2],

        [1, 2, 0, 3, 4],
        [1, 2, 0, 4, 3],
        [1, 2, 3, 0, 4],
        [1, 2, 3, 4, 0],
        [1, 2, 4, 0, 3],
        [1, 2, 4, 3, 0],

        [1, 3, 0, 2, 4],
        [1, 3, 0, 4, 2],
        [1, 3, 2, 0, 4],
        [1, 3, 2, 4, 0],
        [1, 3, 4, 0, 2],
        [1, 3, 4, 2, 0],

        [1, 4, 0, 2, 3],
        [1, 4, 0, 3, 2],
        [1, 4, 2, 0, 3],
        [1, 4, 2, 3, 0],
        [1, 4, 3, 0, 2],
        [1, 4, 3, 2, 0],

        [2, 0, 1, 3, 4],
        [2, 0, 1, 4, 3],
        [2, 0, 3, 1, 4],
        [2, 0, 3, 4, 1],
        [2, 0, 4, 1, 3],
        [2, 0, 4, 3, 1],

        [2, 1, 0, 3, 4],
        [2, 1, 0, 4, 3],
        [2, 1, 3, 0, 4],
        [2, 1, 3, 4, 0],
        [2, 1, 4, 0, 3],
        [2, 1, 4, 3, 0],

        [2, 3, 0, 1, 4],
        [2, 3, 0, 4, 1],
        [2, 3, 1, 0, 4],
        [2, 3, 1, 4, 0],
        [2, 3, 4, 0, 1],
        [2, 3, 4, 1, 0],

        [2, 4, 0, 1, 3],
        [2, 4, 0, 3, 2],
        [2, 4, 1, 0, 3],
        [2, 4, 1, 3, 0],
        [2, 4, 3, 0, 1],
        [2, 4, 3, 1, 0],

        [3, 0, 1, 2, 4],
        [3, 0, 1, 4, 2],
        [3, 0, 2, 1, 4],
        [3, 0, 2, 4, 1],
        [3, 0, 4, 1, 2],
        [3, 0, 4, 2, 1],

        [3, 1, 0, 2, 4],
        [3, 1, 0, 4, 2],
        [3, 1, 2, 0, 4],
        [3, 1, 2, 4, 0],
        [3, 1, 4, 0, 2],
        [3, 1, 4, 2, 0],

        [3, 2, 0, 1, 4],
        [3, 2, 0, 4, 1],
        [3, 2, 1, 0, 4],
        [3, 2, 1, 4, 0],
        [3, 2, 4, 0, 1],
        [3, 2, 4, 1, 0],

        [3, 4, 0, 1, 2],
        [3, 4, 0, 2, 1],
        [3, 4, 1, 0, 2],
        [3, 4, 1, 2, 0],
        [3, 4, 2, 0, 1],
        [3, 4, 2, 1, 0],

        [4, 0, 1, 2, 3],
        [4, 0, 1, 3, 2],
        [4, 0, 2, 1, 3],
        [4, 0, 2, 3, 1],
        [4, 0, 3, 1, 2],
        [4, 0, 3, 2, 1],

        [4, 1, 0, 2, 3],
        [4, 1, 0, 3, 2],
        [4, 1, 2, 0, 3],
        [4, 1, 2, 3, 0],
        [4, 1, 3, 0, 2],
        [4, 1, 3, 2, 0],

        [4, 2, 0, 1, 3],
        [4, 2, 0, 3, 1],
        [4, 2, 1, 0, 3],
        [4, 2, 1, 3, 0],
        [4, 2, 3, 0, 1],
        [4, 2, 3, 1, 0],

        [4, 3, 0, 1, 2],
        [4, 3, 0, 2, 1],
        [4, 3, 1, 0, 2],
        [4, 3, 1, 2, 0],
        [4, 3, 2, 0, 1],
        [4, 3, 2, 1, 0]
    ];

    private _log = logger.child('RankedHandScorer');

    scoreHand(cards: Card[]): HandClassification {
        const boardModifiers: BoardModifier[] = [null, null, null, null, null];
        return this.scoreHandWithBoardModifiers(cards, boardModifiers);
    }

    public scoreHandWithBoardModifiers(cards: Card[], boardModifiers: BoardModifier[]): HandClassification {
        if (cards.length !== boardModifiers.length) {
            throw new Error(`Card and BoardModifier lists need to be the same size (cards=${cards.length}, modifiers=${boardModifiers.length}`);
        }

        const cardsAndBoardModifiers: CardAndBoardModifier[] = [];
        const handsToScore: CardAndBoardModifier[][] = [];

        for (let i = 0; i < cards.length; ++i) {
            cardsAndBoardModifiers.push(new CardAndBoardModifier(new Card(cards[i]), boardModifiers[i]));
        }

        cardsAndBoardModifiers.sort((a, b) => {
            const suitComparison = a.card.suit - b.card.suit;
            if (suitComparison !== 0) {
                return suitComparison;
            }

            return a.card.rank - b.card.rank;
        });

        const identifiableCards = cardsAndBoardModifiers.map((cs) => cs.card);
        const wildCount = identifiableCards.reduce((count, card, index) => {
            if (card.equals(Card.Wild)) {
                return index + 1;
            }
            return count;
        }, 0);

        const handIdentity = HandAnalyzer.analyze(identifiableCards);

        switch (wildCount) {
            default:
            case 0:
                handsToScore.push(cardsAndBoardModifiers);
                break;
            case 1:
                for (const card of Deck.allCards) {
                    const temp = [
                        new CardAndBoardModifier(card, cardsAndBoardModifiers[0].boardModifier), // Replace index 0
                        ...cardsAndBoardModifiers.slice(1) // Preserve the rest
                    ];
                    const hand2 = cardsAndBoardModifiers.map((c) => c.card).join(' ');
                    if (HandAnalyzer.evaluate(temp.map((cs) => cs.card)) === handIdentity) {
                        handsToScore.push(temp);
                    }
                }
                break;
            case 2:
                for (const c0 of Deck.allCards) {
                    for (const c1 of Deck.allCards) {
                        const temp1 = [
                            new CardAndBoardModifier(c0, cardsAndBoardModifiers[0].boardModifier), // Replace index 0
                            new CardAndBoardModifier(c1, cardsAndBoardModifiers[1].boardModifier), // Replace index 1
                            ...cardsAndBoardModifiers.slice(2) // Preserve the rest
                        ];
                        const temp2 = [
                            new CardAndBoardModifier(c0, cardsAndBoardModifiers[1].boardModifier), // Replace index 0
                            new CardAndBoardModifier(c1, cardsAndBoardModifiers[0].boardModifier), // Replace index 1
                            ...cardsAndBoardModifiers.slice(2) // Preserve the rest
                        ];
                        if (HandAnalyzer.evaluate(temp1.map((cs) => cs.card)) === handIdentity) {
                            handsToScore.push(temp1);
                        }
                        if (HandAnalyzer.evaluate(temp2.map((cs) => cs.card)) === handIdentity) {
                            handsToScore.push(temp2);
                        }
                    }
                }
                break;
            case 3:
                {
                    switch (handIdentity) {
                        case HandName.StraightFlush: {
                            // Optimization: StraightFlush
                            // Find the highest ranks of same suit that satisfy a straight flush
                            const realCards = cardsAndBoardModifiers.slice(3);
                            const [a, b] = realCards;
                            const suit = a.card.suit;

                            // Try highest to lowest possible straight starting points
                            for (let start = 10; start >= 1; start--) {
                                const straightRanks = [];
                                for (let i = 0; i < 5; i++) {
                                    let r = start + i;
                                    if (r > 13) r -= 13; // wrap around for A-2-3-4-5
                                    straightRanks.push(r);
                                }

                                // Build candidate straight flush hand
                                const straightFlush = straightRanks.map((rank) => new Card(rank, suit));

                                // Make sure both real cards are in the straight
                                const containsA = straightFlush.some((card) => card.rank === a.card.rank && card.suit === suit);
                                const containsB = straightFlush.some((card) => card.rank === b.card.rank && card.suit === suit);
                                if (!containsA || !containsB) continue;

                                // Fill in wild targets: which of the 5 are not covered by real cards?
                                const wildTargets = straightFlush.filter(
                                    (card) => !realCards.some((real) => real.card.rank === card.rank && real.card.suit === card.suit)
                                );

                                if (wildTargets.length !== 3) continue;

                                // Assign wilds (first 3 cardsAndBoardModifiers)
                                const temp = [
                                    new CardAndBoardModifier(wildTargets[0], cardsAndBoardModifiers[0].boardModifier),
                                    new CardAndBoardModifier(wildTargets[1], cardsAndBoardModifiers[1].boardModifier),
                                    new CardAndBoardModifier(wildTargets[2], cardsAndBoardModifiers[2].boardModifier),
                                    ...realCards
                                ];

                                // Confirm it really is a Straight Flush
                                if (HandAnalyzer.evaluate(temp.map((cs) => cs.card)) === HandName.StraightFlush) {
                                    handsToScore.push(temp);
                                    break; // Highest straight flush found
                                }
                            }
                            break;
                        }
                        case HandName.FiveOfAKind:
                        case HandName.FourOfAKind: {
                            // Optimization: 4ofK + 5ofK
                            // Find the highest rank and swap the 3 wilds for that rank
                            const wilds = cardsAndBoardModifiers.slice(0, 3);
                            const realCards = cardsAndBoardModifiers.slice(3);
                            const bestReal = realCards.reduce((a, b) => (a.card.rank > b.card.rank ? a : b));
                            const targetRank = bestReal.card.rank;
                            const targetCards = wilds.map(
                                (wild) => new CardAndBoardModifier(new Card(targetRank, 1), wild.boardModifier) // suit irrelevant
                            );
                            handsToScore.push([...targetCards, ...realCards]);
                            break;
                        }
                        default:
                            this._log.warn(`Falling back to unoptimized brute force hand eval for 3 wilds: `, {
                                handIdentity: handIdentity,
                                cards: cardsAndBoardModifiers
                            });
                            for (const c0 of Deck.allCards) {
                                for (const c1 of Deck.allCards) {
                                    for (const c2 of Deck.allCards) {
                                        for (const p of RankedHandScorer.ThreeJokerModifierPermutations) {
                                            const temp = [
                                                new CardAndBoardModifier(c0, cardsAndBoardModifiers[p[0]].boardModifier), // Replace index 0
                                                new CardAndBoardModifier(c1, cardsAndBoardModifiers[p[1]].boardModifier), // Replace index 1
                                                new CardAndBoardModifier(c2, cardsAndBoardModifiers[p[2]].boardModifier), // Replace index 2
                                                ...cardsAndBoardModifiers.slice(3) // Preserve the rest
                                            ];
                                            if (HandAnalyzer.evaluate(temp.map((cs) => cs.card)) === handIdentity) {
                                                handsToScore.push(temp);
                                            }
                                        }
                                    }
                                }
                            }
                            break;
                    }
                }
                break;
            case 4:
                if (handIdentity === HandName.StraightFlush) {
                    if (cardsAndBoardModifiers[4].card.rank >= 10 || cardsAndBoardModifiers[4].card.rank === 1) {
                        const royalFlush: Card[] = [];
                        RankedHandScorer.RoyalFlush.forEach((val) => royalFlush.push(Object.assign({}, val)));

                        for (const c of royalFlush) {
                            c.suit = cardsAndBoardModifiers[4].card.suit;
                        }

                        const c = cardsAndBoardModifiers[4].card;
                        let identifiableCardIndex = royalFlush.findIndex((card) => c.equals(card));

                        if (identifiableCardIndex > -1) {
                            royalFlush.splice(identifiableCardIndex, 1);
                        } else {
                            this._log.error('Could not get index for an identifiable card.');
                        }

                        for (const p of RankedHandScorer.FourJokerModifierPermutations) {
                            const temp = [
                                new CardAndBoardModifier(royalFlush[0], cardsAndBoardModifiers[p[0]].boardModifier), // Replace index 0
                                new CardAndBoardModifier(royalFlush[1], cardsAndBoardModifiers[p[1]].boardModifier), // Replace index 1
                                new CardAndBoardModifier(royalFlush[2], cardsAndBoardModifiers[p[2]].boardModifier), // Replace index 2
                                new CardAndBoardModifier(royalFlush[3], cardsAndBoardModifiers[p[3]].boardModifier), // Replace index 3
                                ...cardsAndBoardModifiers.slice(4) // Preserve the rest
                            ];
                            handsToScore.push(temp);
                        }
                    } else if (cardsAndBoardModifiers[4].card.rank === 2) {
                        const steelWheel: Card[] = [];
                        RankedHandScorer.SteelWheel.forEach((val) => steelWheel.push(Object.assign({}, val)));

                        for (const c of steelWheel) {
                            c.suit = cardsAndBoardModifiers[4].card.suit;
                        }

                        const c = cardsAndBoardModifiers[4].card;
                        let identifiableCardIndex = steelWheel.findIndex((card) => c.equals(card));

                        if (identifiableCardIndex > -1) {
                            steelWheel.splice(identifiableCardIndex, 1);
                        } else {
                            this._log.error('Could not get index for an identifiable card.');
                        }

                        for (const p of RankedHandScorer.FourJokerModifierPermutations) {
                            const temp = [
                                new CardAndBoardModifier(steelWheel[0], cardsAndBoardModifiers[p[0]].boardModifier), // Replace index 0
                                new CardAndBoardModifier(steelWheel[1], cardsAndBoardModifiers[p[1]].boardModifier), // Replace index 1
                                new CardAndBoardModifier(steelWheel[2], cardsAndBoardModifiers[p[2]].boardModifier), // Replace index 2
                                new CardAndBoardModifier(steelWheel[3], cardsAndBoardModifiers[p[3]].boardModifier), // Replace index 3
                                ...cardsAndBoardModifiers.slice(4) // Preserve the rest
                            ];
                            handsToScore.push(temp);
                        }
                    } else {
                        //TODO: Five Of A Kind is better than Straight Flush now, if the player only has one card and four Jokers, then should it just push four more of the same rank?
                        for (const p of RankedHandScorer.FourJokerModifierPermutations) {
                            const temp = [
                                new CardAndBoardModifier(
                                    new Card(cardsAndBoardModifiers[4].card.rank + 1, cardsAndBoardModifiers[4].card.suit),
                                    cardsAndBoardModifiers[p[0]].boardModifier
                                ), // Replace index 0
                                new CardAndBoardModifier(
                                    new Card(cardsAndBoardModifiers[4].card.rank + 2, cardsAndBoardModifiers[4].card.suit),
                                    cardsAndBoardModifiers[p[1]].boardModifier
                                ), // Replace index 1
                                new CardAndBoardModifier(
                                    new Card(cardsAndBoardModifiers[4].card.rank + 3, cardsAndBoardModifiers[4].card.suit),
                                    cardsAndBoardModifiers[p[2]].boardModifier
                                ), // Replace index 2
                                new CardAndBoardModifier(
                                    new Card(cardsAndBoardModifiers[4].card.rank + 4, cardsAndBoardModifiers[4].card.suit),
                                    cardsAndBoardModifiers[p[3]].boardModifier
                                ), // Replace index 3
                                ...cardsAndBoardModifiers.slice(4) // Preserve the rest
                            ];

                            handsToScore.push(temp);
                        }
                    }
                }
                /* // Originally added this because I thought a Five Of A Kind could be made with one card and four jokers, and it would always be more than a straight flush, but the hand analyzer never identifies them, is this correct?
                if (handIdentity === HandName.FiveOfAKind) {
                    const identifiableCard = cardsAndBoardModifiers[4];
                    const temp = [
                        new CardAndBoardModifier(new Card(identifiableCard.card.rank, 1), cardsAndBoardModifiers[0].boardModifier), // Replace index 0
                        new CardAndBoardModifier(new Card(identifiableCard.card.rank, 2), cardsAndBoardModifiers[1].boardModifier), // Replace index 1
                        new CardAndBoardModifier(new Card(identifiableCard.card.rank, 3), cardsAndBoardModifiers[2].boardModifier), // Replace index 2
                        new CardAndBoardModifier(new Card(identifiableCard.card.rank, 4), cardsAndBoardModifiers[3].boardModifier), // Replace index 3
                        ...cardsAndBoardModifiers.slice(4) // Preserve the rest
                    ];
                    handsToScore.push(temp);
                }*/
                break;
            case 5:
                if (handIdentity === HandName.StraightFlush) {
                    const royalFlush = [];
                    RankedHandScorer.RoyalFlush.forEach((val) => royalFlush.push(Object.assign({}, val)));

                    for (const p of RankedHandScorer.FiveJokerModifierPermutations) {
                        const temp = [
                            new CardAndBoardModifier(royalFlush[0], cardsAndBoardModifiers[p[0]].boardModifier), // Replace index 0
                            new CardAndBoardModifier(royalFlush[1], cardsAndBoardModifiers[p[1]].boardModifier), // Replace index 1
                            new CardAndBoardModifier(royalFlush[2], cardsAndBoardModifiers[p[2]].boardModifier), // Replace index 2
                            new CardAndBoardModifier(royalFlush[3], cardsAndBoardModifiers[p[3]].boardModifier), // Replace index 3
                            new CardAndBoardModifier(royalFlush[4], cardsAndBoardModifiers[p[4]].boardModifier) // Replace index 4
                        ];
                        handsToScore.push(temp);
                    }
                }
                break;
        }

        let highestScore = 0;
        let highestScoreWithBoardModifiers = 0;
        let highestHandName = '';
        let highestHandType = HandName.Invalid;
        let specialHandType = HandName.Invalid;
        let highestScoredCards: Card[] = [];

        const baseHands: HandName[] = [];

        for (const handToScore of handsToScore) {
            let totalScore = 0;
            let totalScoreWithBoardModifiers = 0;
            let currentHandName = HandNameToString(HandName.Invalid);
            let currentHandType = HandName.Invalid;
            let currentSpecialHandType = HandName.Invalid;
            let scoredCards: Card[] = [];

            baseHands.length = 0;

            switch (handIdentity) {
                case HandName.Invalid: {
                    this._log.error('Cannot score an invalid hand.');
                    break;
                }
                case HandName.Singleton: {
                    baseHands.push(HandName.Singleton);

                    const isLowball = this.isSpecialHand(handToScore, RankedHandScorer.Lowball);
                    if (isLowball) {
                        currentSpecialHandType = HandName.Lowball;
                    }

                    const isPaiGow = this.isSpecialHand(handToScore, RankedHandScorer.PaiGow);
                    if (isPaiGow) {
                        currentSpecialHandType = HandName.PaiGow;
                    }

                    currentHandName = HandNameToString(HandName.Singleton);
                    currentHandType = HandName.Singleton;

                    const handScoreSingleton = this.getPointValueAndScoredCardsFromHand(handToScore, HandName.Singleton);
                    totalScore = handScoreSingleton[0];
                    totalScoreWithBoardModifiers = handScoreSingleton[1];
                    scoredCards = handScoreSingleton[2];
                    break;
                }
                case HandName.OnePair: {
                    currentHandName = HandNameToString(HandName.OnePair);
                    currentHandType = HandName.OnePair;

                    handToScore.sort((a, b) => a.compareTo(b));

                    const handScoreOnePair = this.getPointValueAndScoredCardsFromHand(handToScore, HandName.OnePair);
                    totalScore = handScoreOnePair[0];
                    totalScoreWithBoardModifiers = handScoreOnePair[1];
                    scoredCards = handScoreOnePair[2];
                    break;
                }
                case HandName.TwoPair: {
                    currentHandName = HandNameToString(HandName.TwoPair);
                    currentHandType = HandName.TwoPair;

                    handToScore.sort((a, b) => a.compareTo(b));

                    const handScoreTwoPair = this.getPointValueAndScoredCardsFromHand(handToScore, HandName.TwoPair);
                    totalScore = handScoreTwoPair[0];
                    totalScoreWithBoardModifiers = handScoreTwoPair[1];
                    scoredCards = handScoreTwoPair[2];
                    break;
                }
                case HandName.ThreeOfAKind: {
                    currentHandName = HandNameToString(HandName.ThreeOfAKind);
                    currentHandType = HandName.ThreeOfAKind;

                    handToScore.sort((a, b) => a.compareTo(b));

                    const handScoreThreeOfAKind = this.getPointValueAndScoredCardsFromHand(handToScore, HandName.ThreeOfAKind);
                    totalScore = handScoreThreeOfAKind[0];
                    totalScoreWithBoardModifiers = handScoreThreeOfAKind[1];
                    scoredCards = handScoreThreeOfAKind[2];
                    break;
                }
                case HandName.Straight: {
                    baseHands.push(HandName.Straight);

                    const isWheel = this.isSpecialHand(handToScore, RankedHandScorer.Wheel);
                    if (isWheel) {
                        currentSpecialHandType = HandName.Wheel;
                    }

                    const isBroadway = this.isSpecialHand(handToScore, RankedHandScorer.Broadway);
                    if (isBroadway) {
                        currentSpecialHandType = HandName.Broadway;
                    }

                    currentHandName = HandNameToString(HandName.Straight);
                    currentHandType = HandName.Straight;

                    const handScoreStraight = this.getPointValueAndScoredCardsFromHand(handToScore, HandName.Straight);
                    totalScore = handScoreStraight[0];
                    totalScoreWithBoardModifiers = handScoreStraight[1];
                    scoredCards = handScoreStraight[2];
                    break;
                }
                case HandName.Flush: {
                    currentHandName = HandNameToString(HandName.Flush);
                    currentHandType = HandName.Flush;

                    const handScoreFlush = this.getPointValueAndScoredCardsFromHand(handToScore, HandName.Flush);
                    totalScore = handScoreFlush[0];
                    totalScoreWithBoardModifiers = handScoreFlush[1];
                    scoredCards = handScoreFlush[2];
                    break;
                }
                case HandName.FullHouse: {
                    currentHandName = HandNameToString(HandName.FullHouse);
                    currentHandType = HandName.FullHouse;

                    const handScoreFullHouse = this.getPointValueAndScoredCardsFromHand(handToScore, HandName.FullHouse);
                    totalScore = handScoreFullHouse[0];
                    totalScoreWithBoardModifiers = handScoreFullHouse[1];
                    scoredCards = handScoreFullHouse[2];
                    break;
                }
                case HandName.FourOfAKind: {
                    baseHands.push(HandName.FourOfAKind);

                    if (this.hasTwoOrMoreOfTheSameRank(handToScore, 2)) {
                        currentSpecialHandType = HandName.QuadDeuces;
                    }

                    if (this.hasTwoOrMoreOfTheSameRank(handToScore, 1)) {
                        currentSpecialHandType = HandName.QuadAces;
                    }

                    currentHandName = HandNameToString(HandName.FourOfAKind);
                    currentHandType = HandName.FourOfAKind;

                    handToScore.sort((a, b) => a.compareTo(b));

                    const handScoreFourOfAKind = this.getPointValueAndScoredCardsFromHand(handToScore, HandName.FourOfAKind);
                    totalScore = handScoreFourOfAKind[0];
                    totalScoreWithBoardModifiers = handScoreFourOfAKind[1];
                    scoredCards = handScoreFourOfAKind[2];
                    break;
                }
                case HandName.StraightFlush: {
                    baseHands.push(HandName.Flush);
                    baseHands.push(HandName.Straight);
                    baseHands.push(HandName.StraightFlush);

                    const isSteelWheel = this.isSpecialHand(handToScore, RankedHandScorer.SteelWheel);
                    if (isSteelWheel) {
                        currentSpecialHandType = HandName.SteelWheel;
                    }

                    const isRoyalFlush = this.isSpecialHand(handToScore, RankedHandScorer.RoyalFlush);
                    if (isRoyalFlush) {
                        currentHandName = HandNameToString(HandName.RoyalFlush);
                        currentHandType = HandName.RoyalFlush;
                        currentSpecialHandType = HandName.RoyalFlush;

                        const handScoreRoyalFlush = this.getPointValueAndScoredCardsFromHand(handToScore, HandName.RoyalFlush);
                        totalScore = handScoreRoyalFlush[0];
                        totalScoreWithBoardModifiers = handScoreRoyalFlush[1];
                        scoredCards = handScoreRoyalFlush[2];
                        break;
                    }

                    currentHandName = HandNameToString(HandName.StraightFlush);
                    currentHandType = HandName.StraightFlush;

                    const handScoreStraightFlush = this.getPointValueAndScoredCardsFromHand(handToScore, HandName.StraightFlush);
                    totalScore = handScoreStraightFlush[0];
                    totalScoreWithBoardModifiers = handScoreStraightFlush[1];
                    scoredCards = handScoreStraightFlush[2];
                    break;
                }
                case HandName.FiveOfAKind: {
                    baseHands.push(HandName.FiveOfAKind);

                    if (handToScore[0].card.rank == 1) {
                        currentSpecialHandType = HandName.QuintAces;
                    }

                    currentHandName = HandNameToString(HandName.FiveOfAKind);
                    currentHandType = HandName.FiveOfAKind;

                    const handScoreFiveOfAKind = this.getPointValueAndScoredCardsFromHand(handToScore, HandName.FiveOfAKind);
                    totalScore = handScoreFiveOfAKind[0];
                    totalScoreWithBoardModifiers = handScoreFiveOfAKind[1];
                    scoredCards = handScoreFiveOfAKind[2];
                    break;
                }
            }

            // Compare scores
            if (totalScore > highestScore || (totalScore === highestScore && totalScoreWithBoardModifiers > highestScoreWithBoardModifiers)) {
                highestScore = totalScore;
                highestScoreWithBoardModifiers = totalScoreWithBoardModifiers;
                highestHandName = currentHandName;
                highestHandType = currentHandType;
                specialHandType = currentSpecialHandType;
                highestScoredCards = scoredCards;
            }
        }

        //If there were wilds involved in the hand, then we need to put them back in the scored cards list to be animated...
        if (wildCount > 0) {
            let correctedHighestScoredCards: Card[] = [];

            for (const c of identifiableCards) {
                if (!c.equals(Card.Wild)) {
                    let identifiableCardIndex = highestScoredCards.findIndex((card) => c.equals(card));
                    correctedHighestScoredCards.push(highestScoredCards.splice(identifiableCardIndex, 1)[0]);
                }
            }

            for (let i = 0; i < wildCount; i++) {
                correctedHighestScoredCards.push(Card.Wild);
            }

            highestScoredCards = correctedHighestScoredCards;
        }

        return new HandClassification(
            highestScore,
            highestHandName,
            highestHandType,
            baseHands,
            specialHandType,
            highestScoredCards,
            highestScoreWithBoardModifiers
        );
    }

    private addModifiersToScore(score: number, modifiers: BoardModifier[]): number {
        let scoreWithModifiers = score;

        modifiers.forEach((modifier) => {
            switch (modifier.type) {
                case BoardModifierType.HandMultiplier: {
                    let handMultiplierModifier = modifier as HandMultiplierModifier;

                    scoreWithModifiers *= handMultiplierModifier.multiplier;
                    break;
                }
            }
        });

        return scoreWithModifiers;
    }

    private getPointValueAndScoredCardsFromHand(cards: CardAndBoardModifier[], baseHandName: HandName): [number, number, Card[]] {
        let score: number = 0;
        let scoreWithModifiers: number = 0;
        let scoredCards: Card[] = [];
        let handBaseScore: number = RankedHandScorer.HandBaseValues.get(baseHandName);
        let modifiersToApply: BoardModifier[] = [];

        let sumAllFiveCards = (cards: CardAndBoardModifier[]): [number, number, Card[]] => {
            //Get the sum of the cards ranks with and without multipliers...
            cards.forEach((card) => {
                score += this.getPointValueFromCardRank(card.card);
                scoreWithModifiers += this.getPointValueFromCardRank(card.card);
                scoredCards.push(card.card);

                if (card.boardModifier) {
                    modifiersToApply.push(card.boardModifier);
                }
            });

            //Add the base value of the hand...
            score += handBaseScore;
            scoreWithModifiers += handBaseScore;
            if (modifiersToApply.length > 0) {
                scoreWithModifiers = this.addModifiersToScore(scoreWithModifiers, modifiersToApply);
            }

            return [score, scoreWithModifiers, scoredCards];
        };

        switch (baseHandName) {
            case HandName.Singleton: {
                //Highest card only!
                //Identify the card with the highest point value...

                cards.forEach((card) => {
                    var pointValue = this.getPointValueFromCardRank(card.card);
                    if (pointValue > score) {
                        //Store the highest found value...
                        score = pointValue;
                        scoreWithModifiers = pointValue;
                        //Make sure this is the only card in the list of scored cards...
                        scoredCards.pop();
                        scoredCards.push(card.card);
                    }

                    if (card.boardModifier) {
                        modifiersToApply.push(card.boardModifier);
                    }
                });

                //Add the base value of the hand...
                score += handBaseScore;
                scoreWithModifiers += handBaseScore;
                if (modifiersToApply.length > 0) {
                    scoreWithModifiers = this.addModifiersToScore(scoreWithModifiers, modifiersToApply);
                }

                return [score, scoreWithModifiers, scoredCards];
            }
            case HandName.OnePair: {
                //Just the pair!
                //Identify the indices of the paired cards...
                let a = -1;

                for (let i = 0; i < cards.length - 1; i++) {
                    if (cards[i].card.rankEquals(cards[i + 1].card)) {
                        a = i;
                    }
                }

                cards.forEach((card) => {
                    if (card.boardModifier) {
                        modifiersToApply.push(card.boardModifier);
                    }
                });

                //Calculate the point value of the paired cards and add the base value...
                score = this.getPointValueFromCardRank(cards[a].card) + this.getPointValueFromCardRank(cards[a + 1].card);
                scoreWithModifiers = score;

                score += handBaseScore;
                scoreWithModifiers += handBaseScore;

                if (modifiersToApply.length > 0) {
                    scoreWithModifiers = this.addModifiersToScore(scoreWithModifiers, modifiersToApply);
                }

                //Push the cards into the list of scored cards...
                scoredCards.push(cards[a].card);
                scoredCards.push(cards[a + 1].card);

                return [score, scoreWithModifiers, scoredCards];
            }
            case HandName.TwoPair: {
                //Both pairs!
                //Identify the indices of the paired cards...
                let a = -1;
                let b = -1;

                for (let i = 0; i < cards.length - 1; i++) {
                    if (cards[i].card.rank === cards[i + 1].card.rank) {
                        if (a !== -1) {
                            b = i;
                        } else {
                            a = i;
                        }
                    }
                }

                cards.forEach((card) => {
                    if (card.boardModifier) {
                        modifiersToApply.push(card.boardModifier);
                    }
                });

                //Calculate the point value of the paired cards and add the base value...
                score =
                    this.getPointValueFromCardRank(cards[a].card) +
                    this.getPointValueFromCardRank(cards[a + 1].card) +
                    this.getPointValueFromCardRank(cards[b].card) +
                    this.getPointValueFromCardRank(cards[b + 1].card);
                scoreWithModifiers = score;

                score += handBaseScore;
                scoreWithModifiers += handBaseScore;
                if (modifiersToApply.length > 0) {
                    scoreWithModifiers = this.addModifiersToScore(scoreWithModifiers, modifiersToApply);
                }

                //Push the cards into the list of scored cards...
                scoredCards.push(cards[a].card);
                scoredCards.push(cards[a + 1].card);
                scoredCards.push(cards[b].card);
                scoredCards.push(cards[b + 1].card);

                return [score, scoreWithModifiers, scoredCards];
            }
            case HandName.ThreeOfAKind: {
                //Only the three matching cards!
                //Identify the indices of the matching cards...
                let a = -1;

                for (let i = 0; i < cards.length - 2; i++) {
                    if (cards[i].card.rank === cards[i + 2].card.rank) {
                        a = i;
                    }
                }

                cards.forEach((card) => {
                    if (card.boardModifier) {
                        modifiersToApply.push(card.boardModifier);
                    }
                });

                //Calculate the point value of the matching cards and add the base value...
                score =
                    this.getPointValueFromCardRank(cards[a].card) +
                    this.getPointValueFromCardRank(cards[a + 1].card) +
                    this.getPointValueFromCardRank(cards[a + 2].card);
                scoreWithModifiers = score;

                score += handBaseScore;
                scoreWithModifiers += handBaseScore;
                if (modifiersToApply.length > 0) {
                    scoreWithModifiers = this.addModifiersToScore(scoreWithModifiers, modifiersToApply);
                }

                //Push the cards into the list of scored cards...
                scoredCards.push(cards[a].card);
                scoredCards.push(cards[a + 1].card);
                scoredCards.push(cards[a + 2].card);

                return [score, scoreWithModifiers, scoredCards];
            }
            case HandName.Straight: {
                //All five cards!
                return sumAllFiveCards(cards);
            }
            case HandName.Flush: {
                //All five cards!
                return sumAllFiveCards(cards);
            }
            case HandName.FullHouse: {
                //All five cards!
                return sumAllFiveCards(cards);
            }
            case HandName.FourOfAKind: {
                //Only the four matching cards!
                //Identify the indices of the matching cards...
                let a = -1;

                for (let i = 0; i < cards.length - 3; i++) {
                    if (cards[i].card.rank === cards[i + 3].card.rank) {
                        a = i;
                    }
                }

                cards.forEach((card) => {
                    if (card.boardModifier) {
                        modifiersToApply.push(card.boardModifier);
                    }
                });

                //Calculate the point value of the matching cards and add the base value...
                score =
                    this.getPointValueFromCardRank(cards[a].card) +
                    this.getPointValueFromCardRank(cards[a + 1].card) +
                    this.getPointValueFromCardRank(cards[a + 2].card) +
                    this.getPointValueFromCardRank(cards[a + 3].card);
                scoreWithModifiers = score;

                score += handBaseScore;
                scoreWithModifiers += handBaseScore;
                if (modifiersToApply.length > 0) {
                    scoreWithModifiers = this.addModifiersToScore(scoreWithModifiers, modifiersToApply);
                }

                //Push the cards into the list of scored cards...
                scoredCards.push(cards[a].card);
                scoredCards.push(cards[a + 1].card);
                scoredCards.push(cards[a + 2].card);
                scoredCards.push(cards[a + 3].card);

                return [score, scoreWithModifiers, scoredCards];
            }
            case HandName.StraightFlush: {
                //All five cards!
                return sumAllFiveCards(cards);
            }
            case HandName.FiveOfAKind: {
                //All five cards!
                return sumAllFiveCards(cards);
            }
            case HandName.RoyalFlush: {
                //All five cards!
                return sumAllFiveCards(cards);
            }
            default: {
                this._log.error('Tried to summate an unsupported hand name...');
                return [-1, -1, []];
            }
        }
    }

    private getPointValueFromCardRank(card: Card): number {
        if (card.rank < 1) {
            this._log.error('Tried to get point value from non-regular card:', card);
            return -1;
        } else if (card.rank < 2) {
            return 140;
        } else {
            return card.rank * 10;
        }
    }

    private getPointValueFromCardAndModifierRank(cardAndModifier: CardAndBoardModifier): number {
        return this.getPointValueFromCardRank(cardAndModifier.card) * this.boardModifierCardMultiplier(cardAndModifier.boardModifier);
    }

    private boardModifierCardMultiplier(boardModifier: BoardModifier): number {
        // TODO CSB: I think we'll probably have tile multipliers...
        /*
        switch (special) {
            case GridSpecial.DoubleTileScore:
                return 2;
            case GridSpecial.TripleTileScore:
                return 3;
            default:
                return 1;
        }
        */
        return 1;
    }

    private getBespokeHandScoreWithBoardModifiers(score: number, modifier: BoardModifier): number {
        if (modifier == null || modifier.type === BoardModifierType.None) {
            return score;
        }

        // TODO CSB: I think we will have an equivalent modifier type...
        // if (special === GridSpecial.LimitedScore) {
        //     return 100;
        // }

        let multiplier = 1.0;
        switch (modifier.type) {
            case BoardModifierType.HandMultiplier:
                multiplier = (modifier as HandMultiplierModifier).multiplier;
                break;
        }
        return Math.floor(score * multiplier);
    }

    private isSpecialHand(hand: CardAndBoardModifier[], specialHand: ReadonlyArray<Card>): boolean {
        const handCards = hand.map((c) => c.card);

        for (const cardInSpecialHand of specialHand) {
            if (!handCards.some((cardInHand) => cardInSpecialHand.rank === cardInHand.rank)) {
                return false;
            }
        }

        return true;
    }

    private hasTwoOrMoreOfTheSameRank(hand: CardAndBoardModifier[], rank: number): boolean {
        const handCards = hand.map((c) => c.card);
        const firstIndex = handCards.findIndex((card) => card.rank === rank);
        const lastIndex = (() => {
            for (let i = handCards.length - 1; i >= 0; i--) {
                if (handCards[i].rank === rank) {
                    return i;
                }
            }
            return -1;
        })();

        return firstIndex !== lastIndex;
    }
}
