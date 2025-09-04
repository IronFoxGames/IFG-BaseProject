"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchStatistics = void 0;
const BoardModifierType_1 = require("../enums/BoardModifierType");
const HandName_1 = require("../enums/HandName");
const TurnType_1 = require("../enums/TurnType");
const Card_1 = require("./Card");
// A lot of these stat fields map to win codes with Pogo: https://docs.google.com/spreadsheets/d/13ygaeb9EsuQPu6y0ndLcWVt62Meu6RiaXnN65ueQb4g/edit?gid=0#gid=0
// Please do not change names or casing without consulting this doc.
class MatchStatistics {
    constructor() {
        // Counts for cards and hands played
        this.cardsLeft = 0;
        this.cardsPlayed = 0;
        this.handsPlayed = 0;
        this.clubs_acePlayed = 0;
        this.clubs_twoPlayed = 0;
        this.clubs_threePlayed = 0;
        this.clubs_fourPlayed = 0;
        this.clubs_fivePlayed = 0;
        this.clubs_sixPlayed = 0;
        this.clubs_sevenPlayed = 0;
        this.clubs_eightPlayed = 0;
        this.clubs_ninePlayed = 0;
        this.clubs_tenPlayed = 0;
        this.clubs_jackPlayed = 0;
        this.clubs_queenPlayed = 0;
        this.clubs_kingPlayed = 0;
        this.hearts_acePlayed = 0;
        this.hearts_twoPlayed = 0;
        this.hearts_threePlayed = 0;
        this.hearts_fourPlayed = 0;
        this.hearts_fivePlayed = 0;
        this.hearts_sixPlayed = 0;
        this.hearts_sevenPlayed = 0;
        this.hearts_eightPlayed = 0;
        this.hearts_ninePlayed = 0;
        this.hearts_tenPlayed = 0;
        this.hearts_jackPlayed = 0;
        this.hearts_queenPlayed = 0;
        this.hearts_kingPlayed = 0;
        this.spades_acePlayed = 0;
        this.spades_twoPlayed = 0;
        this.spades_threePlayed = 0;
        this.spades_fourPlayed = 0;
        this.spades_fivePlayed = 0;
        this.spades_sixPlayed = 0;
        this.spades_sevenPlayed = 0;
        this.spades_eightPlayed = 0;
        this.spades_ninePlayed = 0;
        this.spades_tenPlayed = 0;
        this.spades_jackPlayed = 0;
        this.spades_queenPlayed = 0;
        this.spades_kingPlayed = 0;
        this.diamonds_acePlayed = 0;
        this.diamonds_twoPlayed = 0;
        this.diamonds_threePlayed = 0;
        this.diamonds_fourPlayed = 0;
        this.diamonds_fivePlayed = 0;
        this.diamonds_sixPlayed = 0;
        this.diamonds_sevenPlayed = 0;
        this.diamonds_eightPlayed = 0;
        this.diamonds_ninePlayed = 0;
        this.diamonds_tenPlayed = 0;
        this.diamonds_jackPlayed = 0;
        this.diamonds_queenPlayed = 0;
        this.diamonds_kingPlayed = 0;
        this.jokerTileUsed = 0;
        this.wildTileUsed = 0;
        this.singletonPlayed = 0;
        this.lowballPlayed = 0;
        this.paiGowPlayed = 0;
        this.onePairPlayed = 0;
        this.twoPairPlayed = 0;
        this.threeOfAKindPlayed = 0;
        this.straightPlayed = 0;
        this.wheelPlayed = 0;
        this.broadwayPlayed = 0;
        this.flushPlayed = 0;
        this.fullHousePlayed = 0;
        this.quadsPlayed = 0;
        this.quadAcesPlayed = 0;
        this.quintsPlayed = 0;
        this.quintAcesPlayed = 0;
        this.straightFlushPlayed = 0;
        this.steelWheelPlayed = 0;
        this.royalFlushPlayed = 0;
        // Scores for hands played
        this.singletonScore = 0;
        this.lowballScore = 0;
        this.paiGowScore = 0;
        this.onePairScore = 0;
        this.twoPairScore = 0;
        this.threeOfAKindScore = 0;
        this.straightScore = 0;
        this.wheelScore = 0;
        this.broadwayScore = 0;
        this.flushScore = 0;
        this.fullHouseScore = 0;
        this.quadsScore = 0;
        this.quadAcesScore = 0;
        this.quintsScore = 0;
        this.quintAcesScore = 0;
        this.straightFlushScore = 0;
        this.steelWheelScore = 0;
        this.royalFlushScore = 0;
        // Counts for board modifiers used
        this.handScoreModifierUsed = 0;
        this.handScoreMultiplierUsed = 0;
        this.handScoreAdditiveUsed = 0;
        this.wallTileUsed = 0;
    }
    static calculateStatistics(matchState) {
        var _a, _b;
        const stats = new MatchStatistics();
        stats.cardsLeft = (_b = (_a = matchState === null || matchState === void 0 ? void 0 : matchState.deck) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
        matchState.turns.forEach((turn) => {
            if (turn.type !== TurnType_1.TurnType.NoPlay) {
                stats.handsPlayed += 1;
            }
        });
        matchState.turns.forEach((turn) => {
            //Skip 'no play' turns
            if (turn.type == TurnType_1.TurnType.NoPlay) {
                return;
            }
            if (!turn.scoredHand) {
                return;
            }
            // Count cards played
            stats.cardsPlayed += turn.cardPlacements.length;
            // Count scored hand so any pre-placed cards are counted + connecting
            // cards are multple counted for each hand they are used in as opposed
            // to using cardPlacements which only includes new cards.
            // turn.cardPlacements.forEach((placement) => {
            turn.scoredHand.forEach((placement) => {
                var _a;
                // Use the original card which is a wild or joker before transformation
                const card = (_a = placement === null || placement === void 0 ? void 0 : placement.originalCard) !== null && _a !== void 0 ? _a : placement === null || placement === void 0 ? void 0 : placement.card;
                if (!card) {
                    return;
                }
                // Count card ranks (1-13)
                switch (card.rank) {
                    case 0:
                        if (card.type === Card_1.CardType.Joker) {
                            stats.jokerTileUsed++;
                        }
                        else if (card.type === Card_1.CardType.Wild) {
                            stats.wildTileUsed++;
                        }
                        break;
                    case 1:
                        if (card.suit === 1) {
                            stats.clubs_acePlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_acePlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_acePlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_acePlayed++;
                        }
                        break;
                    case 2:
                        if (card.suit === 1) {
                            stats.clubs_twoPlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_twoPlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_twoPlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_twoPlayed++;
                        }
                        break;
                    case 3:
                        if (card.suit === 1) {
                            stats.clubs_threePlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_threePlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_threePlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_threePlayed++;
                        }
                        break;
                    case 4:
                        if (card.suit === 1) {
                            stats.clubs_fourPlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_fourPlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_fourPlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_fourPlayed++;
                        }
                        break;
                    case 5:
                        if (card.suit === 1) {
                            stats.clubs_fivePlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_fivePlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_fivePlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_fivePlayed++;
                        }
                        break;
                    case 6:
                        if (card.suit === 1) {
                            stats.clubs_sixPlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_sixPlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_sixPlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_sixPlayed++;
                        }
                        break;
                    case 7:
                        if (card.suit === 1) {
                            stats.clubs_sevenPlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_sevenPlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_sevenPlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_sevenPlayed++;
                        }
                        break;
                    case 8:
                        if (card.suit === 1) {
                            stats.clubs_eightPlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_eightPlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_eightPlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_eightPlayed++;
                        }
                        break;
                    case 9:
                        if (card.suit === 1) {
                            stats.clubs_ninePlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_ninePlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_ninePlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_ninePlayed++;
                        }
                        break;
                    case 10:
                        if (card.suit === 1) {
                            stats.clubs_tenPlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_tenPlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_tenPlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_tenPlayed++;
                        }
                        break;
                    case 11:
                        if (card.suit === 1) {
                            stats.clubs_jackPlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_jackPlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_jackPlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_jackPlayed++;
                        }
                        break;
                    case 12:
                        if (card.suit === 1) {
                            stats.clubs_queenPlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_queenPlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_queenPlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_queenPlayed++;
                        }
                        break;
                    case 13:
                        if (card.suit === 1) {
                            stats.clubs_kingPlayed++;
                        }
                        else if (card.suit === 2) {
                            stats.diamonds_kingPlayed++;
                        }
                        else if (card.suit === 3) {
                            stats.hearts_kingPlayed++;
                        }
                        else if (card.suit === 4) {
                            stats.spades_kingPlayed++;
                        }
                        break;
                }
            });
            turn.modifiersUsed.forEach((modifier) => {
                if (modifier.type === BoardModifierType_1.BoardModifierType.HandMultiplier) {
                    //stats.handScoreModifierUsed++;
                    stats.handScoreMultiplierUsed++;
                }
                else if (modifier.type === BoardModifierType_1.BoardModifierType.BreakableWall) {
                    stats.wallTileUsed++;
                }
            });
            this._updateHandCount(stats, turn.handName, turn.score);
            // Also count and tally the special hand name for achivements; however don't count Royal Flush as we
            // already show that special hand type as the main hand type already and this would double count it.
            if (turn.specialHandName !== HandName_1.HandName.Invalid && turn.specialHandName !== HandName_1.HandName.RoyalFlush) {
                this._updateHandCount(stats, turn.specialHandName, turn.score);
            }
        });
        return stats;
    }
    static _updateHandCount(stats, handPlayed, handScore) {
        // Increment hand counts and scores
        switch (handPlayed) {
            case HandName_1.HandName.Singleton:
                stats.singletonPlayed++;
                stats.singletonScore += handScore;
                break;
            case HandName_1.HandName.Lowball:
                stats.lowballPlayed++;
                stats.lowballScore += handScore;
                break;
            case HandName_1.HandName.PaiGow:
                stats.paiGowPlayed++;
                stats.paiGowScore += handScore;
                break;
            case HandName_1.HandName.OnePair:
                stats.onePairPlayed++;
                stats.onePairScore += handScore;
                break;
            case HandName_1.HandName.TwoPair:
                stats.twoPairPlayed++;
                stats.twoPairScore += handScore;
                break;
            case HandName_1.HandName.ThreeOfAKind:
                stats.threeOfAKindPlayed++;
                stats.threeOfAKindScore += handScore;
                break;
            case HandName_1.HandName.Straight:
                stats.straightPlayed++;
                stats.straightScore += handScore;
                break;
            case HandName_1.HandName.Wheel:
                stats.wheelPlayed++;
                stats.wheelScore += handScore;
                break;
            case HandName_1.HandName.Broadway:
                stats.broadwayPlayed++;
                stats.broadwayScore += handScore;
                break;
            case HandName_1.HandName.Flush:
                stats.flushPlayed++;
                stats.flushScore += handScore;
                break;
            case HandName_1.HandName.FullHouse:
                stats.fullHousePlayed++;
                stats.fullHouseScore += handScore;
                break;
            case HandName_1.HandName.FourOfAKind:
                stats.quadsPlayed++;
                stats.quadsScore += handScore;
                break;
            case HandName_1.HandName.QuadAces:
                stats.quadAcesPlayed++;
                stats.quadAcesScore += handScore;
                break;
            case HandName_1.HandName.FiveOfAKind:
                stats.quintsPlayed++;
                stats.quintsScore += handScore;
                break;
            case HandName_1.HandName.QuintAces:
                stats.quintAcesPlayed++;
                stats.quintAcesScore += handScore;
                break;
            case HandName_1.HandName.StraightFlush:
                stats.straightFlushPlayed++;
                stats.straightFlushScore += handScore;
                break;
            case HandName_1.HandName.SteelWheel:
                stats.steelWheelPlayed++;
                stats.steelWheelScore += handScore;
                break;
            case HandName_1.HandName.RoyalFlush:
                stats.royalFlushPlayed++;
                stats.royalFlushScore += handScore;
                break;
        }
    }
}
exports.MatchStatistics = MatchStatistics;
