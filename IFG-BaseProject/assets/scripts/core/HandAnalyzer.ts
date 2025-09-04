import { Card } from './model/Card';
import { Deck } from './model/Deck';
import { HandName, HandRank } from './enums/HandName';

export class HandAnalyzer {
    public static analyze(cards: Card[]): HandName {
        if (cards.length !== 5) return HandName.Invalid;

        //Sorts cards in hand by suit and then by rank
        cards.sort((a, b) => {
            const suitComparison = a.suit - b.suit;
            if (suitComparison !== 0) {
                return suitComparison;
            }

            return a.rank - b.rank;
        });

        if (cards[0] === Card.Invalid) return HandName.Invalid;

        const wildCount = cards.reduce((count, card, index) => {
            if (card.equals(Card.Wild)) {
                return index + 1;
            }
            return count;
        }, 0);

        if (new Set(cards.slice(wildCount)).size + wildCount !== 5) return HandName.Invalid;

        if (wildCount > 0) {
            return HandAnalyzer.bestHandFromCombinations(cards, wildCount);
        }

        return HandAnalyzer.evaluate(cards);
    }

    static evaluate(hand: Card[]): HandName {
        const frequencyMap = hand.reduce(
            (acc, card) => {
                acc[card.rank] = (acc[card.rank] || 0) + 1;
                return acc;
            },
            {} as { [key: number]: number }
        );

        const frequencies: number[] = [];
        for (const rank in frequencyMap) {
            if (Object.prototype.hasOwnProperty.call(frequencyMap, rank)) {
                frequencies.push(frequencyMap[rank]);
            }
        }

        frequencies.sort((a, b) => b - a);

        const [f0, f1] = [frequencies[0], frequencies[1] || 0];

        const isFlush: boolean = hand.every((card) => card.suit === hand[4].suit || card.suit === 0);

        const ranks = hand.map((card) => card.rank);
        ranks.sort((a, b) => a - b);

        // Check for a regular straight by verifying that all ranks are consecutive
        const isRegularStraight = Math.max(...ranks) - Math.min(...ranks) === 4;

        // Check for Ace-high straight (10, J, Q, K, A represented by ranks [10, 11, 12, 13, 1])
        const isAceHighStraight = ranks.join(',') === '1,10,11,12,13';

        const isStraight = new Set(ranks).size === 5 && (isRegularStraight || isAceHighStraight);

        return this.getHandName(isFlush, isStraight, f0, f1);
    }

    static getHandName(isFlush: boolean, isStraight: boolean, f0: number, f1: number): HandName {
        if (f0 === 5) return HandName.FiveOfAKind;
        if (isFlush && isStraight) return HandName.StraightFlush;
        if (f0 === 4) return HandName.FourOfAKind;
        if (f0 === 3 && f1 === 2) return HandName.FullHouse;
        if (isFlush) return HandName.Flush;
        if (isStraight) return HandName.Straight;
        if (f0 === 3) return HandName.ThreeOfAKind;
        if (f0 === 2 && f1 === 2) return HandName.TwoPair;
        if (f0 === 2) return HandName.OnePair;
        return HandName.Singleton;
    }

    private static bestHandFromCombinations(cards: Card[], wildCount: number): HandName {
        const allCards = Deck.allCards;
        let bestHand = HandName.Invalid;

        if (wildCount >= 4) {
            return HandName.StraightFlush;
        } else if (wildCount === 3) {
            // Optimization: 3 wilds can only be a 4 of a kind of better:
            const realCards = cards.filter((c) => !c.isWild());
            if (realCards.length !== 2) return HandName.Invalid;

            const [a, b] = realCards;
            const sameSuit = a.suit === b.suit;
            const sameRank = a.rank === b.rank;
            const rankDiff = Math.abs(a.rank - b.rank);
            const areConsecutive = rankDiff <= 4 || (a.rank === 1 && b.rank >= 10) || (b.rank === 1 && a.rank >= 10); // Ace wrap

            if (sameSuit && areConsecutive) {
                return HandName.StraightFlush;
            } else if (sameRank) {
                return HandName.FiveOfAKind;
            } else {
                return HandName.FourOfAKind;
            }
        } else if (wildCount === 2) {
            for (const c0 of allCards) {
                for (const c1 of allCards) {
                    const evaluatedHand = HandAnalyzer.evaluate(HandAnalyzer.replaceWilds(cards, [c0, c1]));
                    if (HandRank[evaluatedHand] > HandRank[bestHand]) {
                        bestHand = evaluatedHand;
                    }
                }
            }
        } else if (wildCount === 1) {
            for (const c0 of allCards) {
                const evaluatedHand = HandAnalyzer.evaluate(HandAnalyzer.replaceWilds(cards, [c0]));
                if (HandRank[evaluatedHand] > HandRank[bestHand]) {
                    bestHand = evaluatedHand;
                }
            }
        }

        return bestHand;
    }

    private static replaceWilds(cards: Card[], replacements: Card[]): Card[] {
        const newCards = [...cards];
        replacements.forEach((replacement, index) => {
            newCards[index] = replacement;
        });
        return newCards;
    }
}
