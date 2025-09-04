import { RankedHandScorer } from '../assets/scripts/core/RankedHandScorer';
import { Card, CardType } from '../assets/scripts/core/model/Card';
import { HandName } from '../assets/scripts/core/enums/HandName';
import { BoardModifier, HandMultiplierModifier } from '../assets/scripts/core/model/BoardModifier';

describe('ScoreTests', () => {
    let rhs: RankedHandScorer;

    const boardModifiers2X: BoardModifier[] = [new HandMultiplierModifier(2, false, 0), null, null, null, null];

    const boardModifiers3X: BoardModifier[] = [
        new HandMultiplierModifier(2, false, 0),
        null,
        new HandMultiplierModifier(2, false, 0),
        null,
        new HandMultiplierModifier(3, false, 0)
    ];

    beforeEach(() => {
        rhs = new RankedHandScorer();
    });

    test('Test Singletons', () => {
        let hand = [
            new Card(2, 1), // Rank 2, Suit 1
            new Card(3, 1),
            new Card(4, 2),
            new Card(5, 3),
            new Card(8, 2)
        ];

        expect(rhs.scoreHand(hand).score).toBe(1080);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining([new Card(8, 2)]));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(2160);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(12960);

        hand = [new Card(3, 3), new Card(4, 3), new Card(5, 2), new Card(6, 1), new Card(9, 2)];
        expect(rhs.scoreHand(hand).score).toBe(1090);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining([new Card(9, 2)]));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(2180);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(13080);

        // Lowball
        hand = RankedHandScorer.Lowball.map((card) => new Card(card.rank, card.suit));
        expect(rhs.scoreHand(hand).specialHandName).toBe(HandName.Lowball);
        expect(rhs.scoreHand(hand).score).toBe(1070);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining([new Card(7, 3)]));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(2140);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(12840);

        // PaiGow
        hand = RankedHandScorer.PaiGow.map((card) => new Card(card.rank, card.suit));
        expect(rhs.scoreHand(hand).specialHandName).toBe(HandName.PaiGow);
        expect(rhs.scoreHand(hand).score).toBe(1140);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining([new Card(1, 1)]));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(2280);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(13680);
    });

    test('Test Duplicate Cards', () => {
        let hand = [
            new Card(2, 1), //Duplicates
            new Card(2, 1), //Duplicates
            new Card(3, 1),
            new Card(4, 1),
            new Card(5, 2)
        ];

        let allDuplicatesHand = [new Card(2, 1), new Card(2, 1), new Card(2, 1), new Card(2, 1), new Card(2, 1)];

        expect(rhs.scoreHand(hand).handName).toBe(HandName.OnePair);
        expect(rhs.scoreHand(hand).score).toBe(1190);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining([new Card(2, 1), new Card(2, 1)]));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(2380);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(14280);

        expect(rhs.scoreHand(allDuplicatesHand).handName).toBe(HandName.FiveOfAKind);
        expect(rhs.scoreHand(allDuplicatesHand).score).toBe(5350);
        expect(rhs.scoreHand(allDuplicatesHand).scoredCards).toEqual(
            expect.arrayContaining([new Card(2, 1), new Card(2, 1), new Card(2, 1), new Card(2, 1), new Card(2, 1)])
        );
        expect(rhs.scoreHandWithBoardModifiers(allDuplicatesHand, boardModifiers2X).scoreWithModifier).toBe(10700);
        expect(rhs.scoreHandWithBoardModifiers(allDuplicatesHand, boardModifiers3X).scoreWithModifier).toBe(64200);
    });

    test('Test One Pairs', () => {
        let hand = [new Card(2, 1), new Card(2, 2), new Card(3, 1), new Card(4, 1), new Card(5, 1)];
        expect(rhs.scoreHand(hand).score).toBe(1190);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.OnePair);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining([new Card(2, 1), new Card(2, 1)]));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(2380);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(14280);

        hand = [new Card(1, 3), new Card(1, 4), new Card(13, 4), new Card(12, 4), new Card(11, 4)];
        expect(rhs.scoreHand(hand).score).toBe(1430);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.OnePair);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining([new Card(1, 3), new Card(1, 4)]));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(2860);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(17160);
    });

    test('Test Two Pairs', () => {
        let hand = [new Card(2, 1), new Card(3, 1), new Card(2, 2), new Card(3, 2), new Card(4, 1)];
        expect(rhs.scoreHand(hand).score).toBe(1500);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.TwoPair);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(
            expect.arrayContaining([new Card(2, 1), new Card(2, 2), new Card(3, 1), new Card(3, 2)])
        );
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(3000);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(18000);

        hand = [new Card(1, 4), new Card(1, 3), new Card(13, 4), new Card(13, 3), new Card(12, 4)];
        expect(rhs.scoreHand(hand).score).toBe(1940);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.TwoPair);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(
            expect.arrayContaining([new Card(1, 4), new Card(1, 3), new Card(13, 4), new Card(13, 3)])
        );
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(3880);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(23280);
    });

    test('Test Three of a Kinds', () => {
        // Setup hand for the first case
        let hand = [new Card(2, 1), new Card(2, 2), new Card(2, 3), new Card(3, 1), new Card(4, 1)];

        expect(rhs.scoreHand(hand).score).toBe(2010);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.ThreeOfAKind);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining([new Card(2, 1), new Card(2, 2), new Card(2, 3)]));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(4020);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(24120);

        // Setup hand for the second case
        hand = [new Card(1, 2), new Card(1, 3), new Card(1, 4), new Card(13, 4), new Card(12, 4)];

        expect(rhs.scoreHand(hand).score).toBe(2370);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.ThreeOfAKind);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining([new Card(1, 2), new Card(1, 3), new Card(1, 4)]));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(4740);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(28440);
    });

    test('Test Straights', () => {
        // First Straight case
        let hand = [new Card(2, 1), new Card(3, 2), new Card(4, 3), new Card(5, 1), new Card(6, 2)];
        expect(rhs.scoreHand(hand).score).toBe(2450);

        // Second Straight case
        hand = [new Card(13, 1), new Card(12, 2), new Card(11, 3), new Card(10, 1), new Card(9, 2)];
        expect(rhs.scoreHand(hand).score).toBe(2800);

        // Third Straight case
        hand = [new Card(Card.Wild), new Card(4, 4), new Card(6, 4), new Card(2, 3), new Card(3, 1)];
        expect(rhs.scoreHand(hand).score).toBe(2450);

        // Fourth Straight case
        hand = [new Card(2, 4), new Card(3, 1), new Card(4, 4), new Card(5, 1), new Card(6, 4)];
        expect(rhs.scoreHand(hand).score).toBe(2450);

        // Fifth Straight case
        hand = [new Card(5, 3), new Card(7, 4), new Card(6, 4), new Card(8, 1), new Card(Card.Wild)];
        expect(rhs.scoreHand(hand).score).toBe(2600);

        // Sixth case - Wheel straight
        hand = RankedHandScorer.Wheel.map((card) => new Card(card.rank, card.suit));
        expect(rhs.scoreHand(hand).score).toBe(2530);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.Straight);
        expect(rhs.scoreHand(hand).specialHandName).toBe(HandName.Wheel);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(hand);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(5060);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(30360);

        // Seventh case - Broadway straight
        hand = RankedHandScorer.Broadway.map((card) => new Card(card.rank, card.suit));
        expect(rhs.scoreHand(hand).score).toBe(2850);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.Straight);
        expect(rhs.scoreHand(hand).specialHandName).toBe(HandName.Broadway);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(hand);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(5700);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(34200);
    });

    test('Test Flushes', () => {
        // First flush case
        let hand = [new Card(2, 1), new Card(3, 1), new Card(4, 1), new Card(5, 1), new Card(7, 1)];
        expect(rhs.scoreHand(hand).score).toBe(2960);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.Flush);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(hand);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(5920);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(35520);

        // Second flush case
        hand = [new Card(1, 4), new Card(13, 4), new Card(12, 4), new Card(11, 4), new Card(9, 4)];
        expect(rhs.scoreHand(hand).score).toBe(3340);

        // Third flush case
        hand = [new Card(4, 3), new Card(5, 3), new Card(6, 3), new Card(7, 3), new Card(10, 3)];
        expect(rhs.scoreHand(hand).score).toBe(3070);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.Flush);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(hand);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(6140);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(36840);
    });

    test('Test Full Houses', () => {
        // First full house case
        let hand = [new Card(2, 1), new Card(2, 2), new Card(2, 3), new Card(3, 1), new Card(3, 2)];
        expect(rhs.scoreHand(hand).score).toBe(3470);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.FullHouse);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining(hand));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(6940);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(41640);

        // Second full house case
        hand = [new Card(1, 1), new Card(1, 2), new Card(1, 3), new Card(13, 1), new Card(13, 2)];
        expect(rhs.scoreHand(hand).score).toBe(4030);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.FullHouse);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining(hand));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(8060);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(48360);

        // Third full house case
        hand = [new Card(3, 2), new Card(3, 1), new Card(3, 4), new Card(6, 2), new Card(6, 1)];
        expect(rhs.scoreHand(hand).score).toBe(3560);
    });

    test('Test Four of a Kinds', () => {
        // First four of a kind (Quad Aces)
        let hand = [new Card(1, 1), new Card(1, 2), new Card(1, 3), new Card(1, 4), new Card(2, 1)];
        expect(rhs.scoreHand(hand).score).toBe(4560);

        // Second four of a kind with a wild (Quad Aces with Wild)
        hand = [new Card(1, 1), new Card(1, 2), new Card(1, 3), new Card(Card.Wild), new Card(2, 1)];
        expect(rhs.scoreHand(hand).score).toBe(4560);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.FourOfAKind);
        expect(rhs.scoreHand(hand).specialHandName).toBe(HandName.QuadAces);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(
            expect.arrayContaining([new Card(1, 1), new Card(1, 2), new Card(1, 3), new Card(Card.Wild)])
        );
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(9120);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(54720);

        // Third four of a kind (Quad Deuces)
        hand = [new Card(2, 1), new Card(2, 2), new Card(2, 3), new Card(2, 4), new Card(1, 4)];
        expect(rhs.scoreHand(hand).score).toBe(4080);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.FourOfAKind);
        expect(rhs.scoreHand(hand).specialHandName).toBe(HandName.QuadDeuces);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(
            expect.arrayContaining([new Card(2, 1), new Card(2, 2), new Card(2, 3), new Card(2, 4)])
        );
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(8160);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(48960);

        // Fourth four of a kind with rank 3
        hand = [new Card(3, 1), new Card(3, 2), new Card(3, 3), new Card(3, 4), new Card(2, 2)];
        expect(rhs.scoreHand(hand).score).toBe(4120);

        // Fifth four of a kind with Kings (Quad Kings)
        hand = [new Card(13, 1), new Card(13, 2), new Card(13, 3), new Card(13, 4), new Card(1, 1)];
        expect(rhs.scoreHand(hand).score).toBe(4520);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.FourOfAKind);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(
            expect.arrayContaining([new Card(13, 1), new Card(13, 2), new Card(13, 3), new Card(13, 4)])
        );
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(9040);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(54240);

        // Sixth four of a kind with Kings and a wild
        hand = [new Card(13, 1), new Card(13, 2), new Card(13, 3), new Card(Card.Wild), new Card(1, 1)];
        expect(rhs.scoreHand(hand).score).toBe(4520);
    });

    test('Test Five of a Kinds', () => {
        // First five of a kind case with fours and a wild
        let hand = [new Card(3, 1), new Card(3, 2), new Card(3, 3), new Card(3, 4), new Card(Card.Wild)];
        expect(rhs.scoreHand(hand).score).toBe(5400);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.FiveOfAKind);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(hand);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(10800);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(64800);

        // Second five of a kind case with aces and a wild
        hand = [new Card(1, 1), new Card(1, 2), new Card(1, 3), new Card(1, 4), new Card(Card.Wild)];
        expect(rhs.scoreHand(hand).score).toBe(5950);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.FiveOfAKind);
        expect(rhs.scoreHand(hand).specialHandName).toBe(HandName.QuintAces);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(hand);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(11900);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(71400);
    });

    test('Test Straight Flushes', () => {
        // Steel Wheel straight flush
        let hand = RankedHandScorer.SteelWheel.map((card) => new Card(card.rank, card.suit));
        expect(rhs.scoreHand(hand).score).toBe(4780);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.StraightFlush);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining(hand));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(9560);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(57360);

        // Royal Flush straight flush
        hand = RankedHandScorer.RoyalFlush.map((card) => new Card(card.rank, card.suit));
        expect(rhs.scoreHand(hand).score).toBe(6250);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.RoyalFlush);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining(hand));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(12500);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(75000);

        // Regular straight flush with ranks 2 through 6
        hand = [new Card(2, 1), new Card(3, 1), new Card(4, 1), new Card(5, 1), new Card(6, 1)];
        expect(rhs.scoreHand(hand).score).toBe(4700);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.StraightFlush);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining(hand));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(9400);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(56400);

        // High straight flush with ranks 9 through King
        hand = [new Card(13, 4), new Card(12, 4), new Card(11, 4), new Card(10, 4), new Card(9, 4)];
        expect(rhs.scoreHand(hand).score).toBe(5050);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.StraightFlush);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(expect.arrayContaining(hand));
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(10100);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(60600);
    });

    test('Test Double Wilds', () => {
        // Hand with two kings and two wilds, resulting in quad kings
        const hand = [
            new Card(13, 1),
            new Card(13, 2),
            new Card(Card.Wild),
            new Card(Card.Wild),
            new Card(1, 1) // Extra card
        ];
        expect(rhs.scoreHand(hand).score).toBe(4520);
        expect(rhs.scoreHand(hand).handName).toBe(HandName.FourOfAKind);
        expect(rhs.scoreHand(hand).scoredCards).toEqual(
            expect.arrayContaining([new Card(13, 1), new Card(13, 2), new Card(Card.Wild), new Card(Card.Wild)])
        );
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers2X).scoreWithModifier).toBe(9040);
        expect(rhs.scoreHandWithBoardModifiers(hand, boardModifiers3X).scoreWithModifier).toBe(54240);
    });

    test('Test Quad And Quint Wilds', () => {
        const royalFlushHand = [new Card(10, 1), new Card(Card.Wild), new Card(Card.Wild), new Card(Card.Wild), new Card(Card.Wild)];

        const steelWheelHand = [new Card(2, 2), new Card(Card.Wild), new Card(Card.Wild), new Card(Card.Wild), new Card(Card.Wild)];

        const straightFlushHand = [new Card(7, 3), new Card(Card.Wild), new Card(Card.Wild), new Card(Card.Wild), new Card(Card.Wild)];

        const royalFlushAllWilds = [new Card(Card.Wild), new Card(Card.Wild), new Card(Card.Wild), new Card(Card.Wild), new Card(Card.Wild)];

        expect(rhs.scoreHand(royalFlushHand).handName).toBe(HandName.RoyalFlush);
        expect(rhs.scoreHand(royalFlushHand).specialHandName).toBe(HandName.RoyalFlush);
        expect(rhs.scoreHand(royalFlushHand).scoredCards).toEqual(
            expect.arrayContaining([new Card(10, 1), new Card(Card.Wild), new Card(Card.Wild), new Card(Card.Wild), new Card(Card.Wild)])
        );
        expect(rhs.scoreHand(royalFlushHand).scoredCards).toEqual(expect.arrayContaining(royalFlushHand));
        expect(rhs.scoreHand(royalFlushHand).score).toBe(6250);
        expect(rhs.scoreHandWithBoardModifiers(royalFlushHand, boardModifiers2X).scoreWithModifier).toBe(12500);
        expect(rhs.scoreHandWithBoardModifiers(royalFlushHand, boardModifiers3X).scoreWithModifier).toBe(75000);

        expect(rhs.scoreHand(steelWheelHand).handName).toBe(HandName.StraightFlush);
        expect(rhs.scoreHand(steelWheelHand).specialHandName).toBe(HandName.SteelWheel);
        expect(rhs.scoreHand(steelWheelHand).scoredCards).toEqual(expect.arrayContaining(steelWheelHand));
        expect(rhs.scoreHand(steelWheelHand).score).toBe(4780);
        expect(rhs.scoreHandWithBoardModifiers(steelWheelHand, boardModifiers2X).scoreWithModifier).toBe(9560);

        expect(rhs.scoreHand(straightFlushHand).handName).toBe(HandName.StraightFlush);
        expect(rhs.scoreHand(straightFlushHand).scoredCards).toEqual(expect.arrayContaining(straightFlushHand));
        expect(rhs.scoreHand(straightFlushHand).score).toBe(4950);
        expect(rhs.scoreHandWithBoardModifiers(straightFlushHand, boardModifiers2X).scoreWithModifier).toBe(9900);

        expect(rhs.scoreHand(royalFlushAllWilds).handName).toBe(HandName.RoyalFlush);
        expect(rhs.scoreHand(royalFlushAllWilds).specialHandName).toBe(HandName.RoyalFlush);
        expect(rhs.scoreHand(royalFlushAllWilds).scoredCards).toEqual(expect.arrayContaining(royalFlushAllWilds));
        expect(rhs.scoreHand(royalFlushAllWilds).score).toBe(6250);
        expect(rhs.scoreHandWithBoardModifiers(royalFlushAllWilds, boardModifiers2X).scoreWithModifier).toBe(12500);
    });

    test('Test Crown Suit', () => {
        const hand = [
            new Card(10, 1),
            new Card(7, 1),
            new Card(2, 1),
            new Card(4, 0, CardType.Crown), //Crown
            new Card(6, 0, CardType.Crown) //Crown
        ];

        const hand2 = [
            new Card(3, 2),
            new Card(4, 2),
            new Card(5, 2),
            new Card(6, 2),
            new Card(7, 0, CardType.Crown) //Crown
        ];

        const allCrownHand = [new Card(1, 0), new Card(6, 0), new Card(6, 0), new Card(6, 0), new Card(10, 0)];

        const royalFlushHand = [
            new Card(1, 3),
            new Card(10, 3),
            new Card(11, 0, CardType.Crown), //Crown
            new Card(12, 0, CardType.Crown), //Crown
            new Card(13, 0, CardType.Crown) //Crown
        ];

        const nonFlushHand = [
            new Card(2, 1),
            new Card(2, 2),
            new Card(2, 3),
            new Card(3, 0, CardType.Crown), //Crown
            new Card(5, 0, CardType.Crown) //Crown
        ];

        const flushWithWilds = [
            new Card(Card.Wild),
            new Card(Card.Wild),
            new Card(2, 4),
            new Card(5, 0, CardType.Crown), //Crown
            new Card(9, 0, CardType.Crown) //Crown
        ];

        const straightFlushWithWilds = [
            new Card(Card.Wild),
            new Card(Card.Wild),
            new Card(4, 3),
            new Card(5, 0, CardType.Crown), //Crown
            new Card(6, 0, CardType.Crown) //Crown
        ];

        const onePairWithWild = [
            new Card(Card.Wild),
            new Card(5, 0, CardType.Crown), //Crown
            new Card(7, 1),
            new Card(11, 2),
            new Card(1, 3)
        ];

        const royalFlush = [
            new Card(Card.Wild),
            new Card(13, 0, CardType.Crown), //Crown
            new Card(12, 1),
            new Card(11, 0, CardType.Crown), //Crown
            new Card(10, 1)
        ];

        expect(rhs.scoreHand(hand).handName).toBe(HandName.Flush);
        expect(rhs.scoreHand(hand2).handName).toBe(HandName.StraightFlush);
        expect(rhs.scoreHand(allCrownHand).handName).toBe(HandName.Flush);
        expect(rhs.scoreHand(royalFlushHand).handName).toBe(HandName.RoyalFlush);
        expect(rhs.scoreHand(nonFlushHand).handName).toBe(HandName.ThreeOfAKind);
        expect(rhs.scoreHand(flushWithWilds).handName).toBe(HandName.Flush);
        expect(rhs.scoreHand(straightFlushWithWilds).handName).toBe(HandName.StraightFlush);
        expect(rhs.scoreHand(onePairWithWild).handName).toBe(HandName.OnePair);
        expect(rhs.scoreHand(royalFlush).handName).toBe(HandName.RoyalFlush);
    });
});
