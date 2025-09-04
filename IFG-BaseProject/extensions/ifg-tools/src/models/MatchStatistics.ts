import { BoardModifierType } from '../enums/BoardModifierType';
import { HandName } from '../enums/HandName';
import { TurnType } from '../enums/TurnType';
import { CardType } from './Card';
import { MatchState } from './MatchState';

// A lot of these stat fields map to win codes with Pogo: https://docs.google.com/spreadsheets/d/13ygaeb9EsuQPu6y0ndLcWVt62Meu6RiaXnN65ueQb4g/edit?gid=0#gid=0
// Please do not change names or casing without consulting this doc.
export class MatchStatistics {
    // Counts for cards and hands played
    cardsLeft = 0;
    cardsPlayed = 0;
    handsPlayed = 0;
    clubs_acePlayed = 0;
    clubs_twoPlayed = 0;
    clubs_threePlayed = 0;
    clubs_fourPlayed = 0;
    clubs_fivePlayed = 0;
    clubs_sixPlayed = 0;
    clubs_sevenPlayed = 0;
    clubs_eightPlayed = 0;
    clubs_ninePlayed = 0;
    clubs_tenPlayed = 0;
    clubs_jackPlayed = 0;
    clubs_queenPlayed = 0;
    clubs_kingPlayed = 0;
    hearts_acePlayed = 0;
    hearts_twoPlayed = 0;
    hearts_threePlayed = 0;
    hearts_fourPlayed = 0;
    hearts_fivePlayed = 0;
    hearts_sixPlayed = 0;
    hearts_sevenPlayed = 0;
    hearts_eightPlayed = 0;
    hearts_ninePlayed = 0;
    hearts_tenPlayed = 0;
    hearts_jackPlayed = 0;
    hearts_queenPlayed = 0;
    hearts_kingPlayed = 0;
    spades_acePlayed = 0;
    spades_twoPlayed = 0;
    spades_threePlayed = 0;
    spades_fourPlayed = 0;
    spades_fivePlayed = 0;
    spades_sixPlayed = 0;
    spades_sevenPlayed = 0;
    spades_eightPlayed = 0;
    spades_ninePlayed = 0;
    spades_tenPlayed = 0;
    spades_jackPlayed = 0;
    spades_queenPlayed = 0;
    spades_kingPlayed = 0;
    diamonds_acePlayed = 0;
    diamonds_twoPlayed = 0;
    diamonds_threePlayed = 0;
    diamonds_fourPlayed = 0;
    diamonds_fivePlayed = 0;
    diamonds_sixPlayed = 0;
    diamonds_sevenPlayed = 0;
    diamonds_eightPlayed = 0;
    diamonds_ninePlayed = 0;
    diamonds_tenPlayed = 0;
    diamonds_jackPlayed = 0;
    diamonds_queenPlayed = 0;
    diamonds_kingPlayed = 0;
    jokerTileUsed = 0;
    wildTileUsed = 0;
    singletonPlayed = 0;
    lowballPlayed = 0;
    paiGowPlayed = 0;
    onePairPlayed = 0;
    twoPairPlayed = 0;
    threeOfAKindPlayed = 0;
    straightPlayed = 0;
    wheelPlayed = 0;
    broadwayPlayed = 0;
    flushPlayed = 0;
    fullHousePlayed = 0;
    quadsPlayed = 0;
    quadAcesPlayed = 0;
    quintsPlayed = 0;
    quintAcesPlayed = 0;
    straightFlushPlayed = 0;
    steelWheelPlayed = 0;
    royalFlushPlayed = 0;

    // Scores for hands played
    singletonScore = 0;
    lowballScore = 0;
    paiGowScore = 0;
    onePairScore = 0;
    twoPairScore = 0;
    threeOfAKindScore = 0;
    straightScore = 0;
    wheelScore = 0;
    broadwayScore = 0;
    flushScore = 0;
    fullHouseScore = 0;
    quadsScore = 0;
    quadAcesScore = 0;
    quintsScore = 0;
    quintAcesScore = 0;
    straightFlushScore = 0;
    steelWheelScore = 0;
    royalFlushScore = 0;

    // Counts for board modifiers used
    handScoreModifierUsed = 0;
    handScoreMultiplierUsed = 0;
    handScoreAdditiveUsed = 0;
    wallTileUsed = 0;

    static calculateStatistics(matchState: MatchState): MatchStatistics {
        const stats = new MatchStatistics();

        stats.cardsLeft = matchState?.deck?.length ?? 0;

        matchState.turns.forEach((turn) => {
            if (turn.type !== TurnType.NoPlay) {
                stats.handsPlayed += 1;
            }
        });

        matchState.turns.forEach((turn) => {
            //Skip 'no play' turns
            if (turn.type == TurnType.NoPlay) {
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
                // Use the original card which is a wild or joker before transformation
                const card = placement?.originalCard ?? placement?.card;
                if (!card) {
                    return;
                }

                // Count card ranks (1-13)
                switch (card.rank) {
                    case 0:
                        if (card.type === CardType.Joker) {
                            stats.jokerTileUsed++;
                        } else if (card.type === CardType.Wild) {
                            stats.wildTileUsed++;
                        }
                        break;
                    case 1:
                        if (card.suit === 1) {
                            stats.clubs_acePlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_acePlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_acePlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_acePlayed++;
                        }
                        break;
                    case 2:
                        if (card.suit === 1) {
                            stats.clubs_twoPlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_twoPlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_twoPlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_twoPlayed++;
                        }
                        break;
                    case 3:
                        if (card.suit === 1) {
                            stats.clubs_threePlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_threePlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_threePlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_threePlayed++;
                        }
                        break;
                    case 4:
                        if (card.suit === 1) {
                            stats.clubs_fourPlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_fourPlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_fourPlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_fourPlayed++;
                        }
                        break;
                    case 5:
                        if (card.suit === 1) {
                            stats.clubs_fivePlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_fivePlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_fivePlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_fivePlayed++;
                        }
                        break;
                    case 6:
                        if (card.suit === 1) {
                            stats.clubs_sixPlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_sixPlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_sixPlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_sixPlayed++;
                        }
                        break;
                    case 7:
                        if (card.suit === 1) {
                            stats.clubs_sevenPlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_sevenPlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_sevenPlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_sevenPlayed++;
                        }
                        break;
                    case 8:
                        if (card.suit === 1) {
                            stats.clubs_eightPlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_eightPlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_eightPlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_eightPlayed++;
                        }
                        break;
                    case 9:
                        if (card.suit === 1) {
                            stats.clubs_ninePlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_ninePlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_ninePlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_ninePlayed++;
                        }
                        break;
                    case 10:
                        if (card.suit === 1) {
                            stats.clubs_tenPlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_tenPlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_tenPlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_tenPlayed++;
                        }
                        break;
                    case 11:
                        if (card.suit === 1) {
                            stats.clubs_jackPlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_jackPlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_jackPlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_jackPlayed++;
                        }
                        break;
                    case 12:
                        if (card.suit === 1) {
                            stats.clubs_queenPlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_queenPlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_queenPlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_queenPlayed++;
                        }
                        break;
                    case 13:
                        if (card.suit === 1) {
                            stats.clubs_kingPlayed++;
                        } else if (card.suit === 2) {
                            stats.diamonds_kingPlayed++;
                        } else if (card.suit === 3) {
                            stats.hearts_kingPlayed++;
                        } else if (card.suit === 4) {
                            stats.spades_kingPlayed++;
                        }
                        break;
                }
            });

            turn.modifiersUsed.forEach((modifier) => {
                if (modifier.type === BoardModifierType.HandMultiplier) {
                    //stats.handScoreModifierUsed++;
                    stats.handScoreMultiplierUsed++;
                } else if (modifier.type === BoardModifierType.BreakableWall) {
                    stats.wallTileUsed++;
                }
            });

            this._updateHandCount(stats, turn.handName, turn.score);

            // Also count and tally the special hand name for achivements; however don't count Royal Flush as we
            // already show that special hand type as the main hand type already and this would double count it.
            if (turn.specialHandName !== HandName.Invalid && turn.specialHandName !== HandName.RoyalFlush) {
                this._updateHandCount(stats, turn.specialHandName, turn.score);
            }
        });

        return stats;
    }

    private static _updateHandCount(stats: MatchStatistics, handPlayed: HandName, handScore: number) {
        // Increment hand counts and scores
        switch (handPlayed) {
            case HandName.Singleton:
                stats.singletonPlayed++;
                stats.singletonScore += handScore;
                break;
            case HandName.Lowball:
                stats.lowballPlayed++;
                stats.lowballScore += handScore;
                break;
            case HandName.PaiGow:
                stats.paiGowPlayed++;
                stats.paiGowScore += handScore;
                break;
            case HandName.OnePair:
                stats.onePairPlayed++;
                stats.onePairScore += handScore;
                break;
            case HandName.TwoPair:
                stats.twoPairPlayed++;
                stats.twoPairScore += handScore;
                break;
            case HandName.ThreeOfAKind:
                stats.threeOfAKindPlayed++;
                stats.threeOfAKindScore += handScore;
                break;
            case HandName.Straight:
                stats.straightPlayed++;
                stats.straightScore += handScore;
                break;
            case HandName.Wheel:
                stats.wheelPlayed++;
                stats.wheelScore += handScore;
                break;
            case HandName.Broadway:
                stats.broadwayPlayed++;
                stats.broadwayScore += handScore;
                break;
            case HandName.Flush:
                stats.flushPlayed++;
                stats.flushScore += handScore;
                break;
            case HandName.FullHouse:
                stats.fullHousePlayed++;
                stats.fullHouseScore += handScore;
                break;
            case HandName.FourOfAKind:
                stats.quadsPlayed++;
                stats.quadsScore += handScore;
                break;
            case HandName.QuadAces:
                stats.quadAcesPlayed++;
                stats.quadAcesScore += handScore;
                break;
            case HandName.FiveOfAKind:
                stats.quintsPlayed++;
                stats.quintsScore += handScore;
                break;
            case HandName.QuintAces:
                stats.quintAcesPlayed++;
                stats.quintAcesScore += handScore;
                break;
            case HandName.StraightFlush:
                stats.straightFlushPlayed++;
                stats.straightFlushScore += handScore;
                break;
            case HandName.SteelWheel:
                stats.steelWheelPlayed++;
                stats.steelWheelScore += handScore;
                break;
            case HandName.RoyalFlush:
                stats.royalFlushPlayed++;
                stats.royalFlushScore += handScore;
                break;
        }
    }
}
