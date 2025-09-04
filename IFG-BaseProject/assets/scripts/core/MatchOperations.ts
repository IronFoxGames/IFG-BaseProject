import { SoundManager } from '../audio/SoundManager';
import { CardScrambleGameController } from '../game/CardScrambleGameController';
import { GripCard } from '../game/GripCard';
import { logger } from '../logging';
import { BoardModifierType } from './enums/BoardModifierType';
import { DeckType } from './enums/DeckType';
import { HandName } from './enums/HandName';
import { TurnType } from './enums/TurnType';
import { BoardModifier, BreakableWallModifier, BurningFoodModifier, HandMultiplierModifier } from './model/BoardModifier';
import { Card } from './model/Card';
import { CardPlacement } from './model/CardPlacement';
import { GameBoardTileModel } from './model/GameBoardTileModel';
import { GameConfig } from './model/GameConfig';
import { Match } from './model/Match';
import { MatchState } from './model/MatchState';
import { PowerupUsageContext } from './model/PowerupUsageContext';
import { Turn } from './model/Turn';
import { Random } from './Random';
import { RankedHandScorer } from './RankedHandScorer';
import { Utils } from './Utils';

export class MatchOperations {
    private static _extraServingsScoreMultiplier: number = 1;
    private static log = logger.child('MatchOperations');

    public static get handScoreMultiplier() {
        return this._extraServingsScoreMultiplier;
    }

    public static NewGame(config: GameConfig, random: Random) {
        const botId: string | null = null;
        const hasBot = botId != null;

        const matchData = new Match();
        matchData.hasBot = hasBot;

        if (config.deckType == DeckType.Default) {
            matchData.state.deck = this.NewDefaultDeck();
            Utils.shuffle(matchData.state.deck, random);
        } else {
            config.customDeck.forEach((card) => {
                matchData.state.deck.push(new Card(card));
            });
            matchData.state.deck.reverse();
        }

        // Deal player hand
        for (let i = 0; i < config.handSize; i++) {
            if (matchData.state.deck.length <= 0) {
                break;
            }
            matchData.state.playerHand.push(matchData.state.deck.pop()!);
        }

        // Deal bot hand
        if (hasBot) {
            for (let i = 0; i < config.handSize; i++) {
                if (matchData.state.deck.length <= 0) {
                    break;
                }
                matchData.state.opponentHand.push(matchData.state.deck.pop()!);
            }
        }

        // Board state has an array of arrays of board modifiers. Each grid tile has
        // by default an empty array of modifiers. Then each tile can have multiple
        // board modifiers
        for (let i = 0; i < 13 * 13; ++i) {
            matchData.state.boardModifiers[i] = [];
        }

        // Board modifiers
        config.boardModifierPlacements?.forEach((placement) => {
            matchData.state.boardModifiers[placement.boardIndex].push(placement.modifier);
        });

        return matchData;
    }

    public static DoPlayerTurn(
        gameController: CardScrambleGameController,
        turn: Turn,
        scorer: RankedHandScorer,
        powerupUsages: PowerupUsageContext[]
    ): void {
        if (gameController.config.hasBot) {
            const turnIndex = gameController.match.state.turn % 2;
            if (turnIndex != 0) {
                MatchOperations.log.error(`Trying to do player turn on bot turn`);
                return;
            }
        }

        this._doTurn(gameController, turn, scorer, gameController.match.state.playerHand, powerupUsages);
    }

    public static DoBotTurn(gameController: CardScrambleGameController, turn: Turn, scorer: RankedHandScorer): void {
        const turnIndex = gameController.match.state.turn % 2;
        if (turnIndex != 1) {
            MatchOperations.log.error(`Trying to do bot turn on player turn`);
            return;
        }

        this._doTurn(gameController, turn, scorer, gameController.match.state.opponentHand, null);
    }

    private static _doTurn(
        gameController: CardScrambleGameController,
        turn: Turn,
        scorer: RankedHandScorer,
        hand: Card[],
        powerupUsages: PowerupUsageContext[]
    ) {
        switch (turn.type) {
            case TurnType.Play:
                this._performPlayTurn(
                    gameController,
                    scorer,
                    turn.cardPlacements,
                    turn.scoredHand,
                    gameController.match.state.playerHand,
                    powerupUsages
                );
                break;
            case TurnType.NoPlay:
                gameController.match.state.turns.push(new Turn(TurnType.NoPlay, null, null, null));
                break;
            default:
                throw new Error('Unknown turn type');
        }
    }

    public static IsMatchComplete(match: Match): boolean {
        return (
            match.state.turns.length >= 2 &&
            match.state.turns[match.state.turns.length - 1].type === TurnType.NoPlay &&
            match.state.turns[match.state.turns.length - 2].type === TurnType.NoPlay
        );
    }

    public static CalculateScores(match: Match, config: GameConfig): { playerScore: number; opponentScore: number } {
        let playerScore = 0;
        let opponentScore = 0;
        match.state.turns.forEach((turn, i) => {
            if (config.hasBot) {
                if (i % 2 === 0) {
                    playerScore += turn.score;

                    if (playerScore < 0) {
                        playerScore = 0;
                    }
                } else {
                    opponentScore += turn.score;

                    if (opponentScore < 0) {
                        opponentScore = 0;
                    }
                }
            } else {
                playerScore += turn.score;

                if (playerScore < 0) {
                    playerScore = 0;
                }
            }
        });

        return { playerScore, opponentScore };
    }

    // Finds all the cards in this hand - the cards placed plus the adjacent cards on the board
    public static findHandIncludingAnchors(hand: CardPlacement[], board: GameBoardTileModel[], handPlacement: GameBoardTileModel[]): Card[] {
        // Ensure handPlacement is an empty array
        handPlacement.length = 0;
        let minX = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let minY = Number.MAX_VALUE;
        let maxY = Number.MIN_VALUE;

        // Determine boundaries
        hand.forEach((cardPlacement) => {
            const x = cardPlacement.boardIndex % 13;
            const y = Math.floor(cardPlacement.boardIndex / 13);

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);

            if (maxY < 1 && maxY > 0) {
                maxY = 0;
            }
            if (maxX < 1 && maxX > 0) {
                maxX = 0;
            }
        });

        const dx = maxX - minX;
        const dy = maxY - minY;

        if (dx !== 0 && dy !== 0) {
            throw new Error('Card placement not in a straight line');
        }

        // Determine steps based on the direction of the line
        const stepX = Math.min(Math.max(dx, 0), 1);
        const stepY = Math.min(Math.max(dy, 0), 1);

        let handIncludingAnchors: Card[] = [];

        // Single card with no direction inferred; need to walk both horizontal and vertical to find the hand
        if (stepX === 0 && stepY === 0) {
            // Check horizontal first and return if we found it
            handIncludingAnchors = this._populateHandIncludingAnchors(1, 0, minX, minY, hand, board, handPlacement);
            if (handIncludingAnchors.length > hand.length) {
                return handIncludingAnchors;
            }

            // Clear any cards added from horizontal attempt and check vertical
            handPlacement.length = 0;
            handIncludingAnchors = this._populateHandIncludingAnchors(0, 1, minX, minY, hand, board, handPlacement);
        } else {
            handIncludingAnchors = this._populateHandIncludingAnchors(stepX, stepY, minX, minY, hand, board, handPlacement);
        }

        return handIncludingAnchors;
    }

    private static _populateHandIncludingAnchors(
        stepX: number,
        stepY: number,
        minX: number,
        minY: number,
        hand: CardPlacement[],
        board: GameBoardTileModel[],
        handPlacement: GameBoardTileModel[]
    ): Card[] {
        const handIncludingAnchors: Card[] = [];

        // Go backwards, starting from (and including) the first card
        for (let x = minX, y = minY; x >= 0 && y >= 0; x -= stepX, y -= stepY) {
            const card = this._findCardAtPosition(hand, board, x, y);
            if (card === null) {
                break;
            }

            handPlacement.push(board[y * 13 + x]);
            handIncludingAnchors.push(card);
        }

        // Go forwards, starting from (but not including) the first card
        for (let x = minX + stepX, y = minY + stepY; x < 13 && y < 13; x += stepX, y += stepY) {
            const card = this._findCardAtPosition(hand, board, x, y);
            if (card === null) {
                break;
            }

            handPlacement.push(board[y * 13 + x]);
            handIncludingAnchors.push(card);
        }

        return handIncludingAnchors;
    }

    public static BuildBoardFromTurns(matchState: MatchState, config: GameConfig): GameBoardTileModel[] {
        const board = this._newDefaultBoardState(config.placeAnchor);

        config.startingBoard?.forEach((cardPlacement) => {
            let tileModel = new GameBoardTileModel();
            tileModel.boardModifierList = [];
            tileModel.card = cardPlacement.card;
            tileModel.turn = -1;
            board[cardPlacement.boardIndex] = tileModel;
        });

        matchState.turns.forEach((turn, turnIndex) => {
            turn.powerupUsages?.forEach((powerupUsage) => {
                if (powerupUsage.usedBeforeTurn) {
                    powerupUsage.updatedTiles?.forEach((cardPlacement) => {
                        let tileModel = new GameBoardTileModel();
                        tileModel.boardModifierList = [];
                        tileModel.card = cardPlacement.card;
                        tileModel.turn = turnIndex;
                        board[cardPlacement.boardIndex] = tileModel;

                        if (cardPlacement.card === null) {
                            board[cardPlacement.boardIndex] = null;
                        }
                    });
                }
            });

            turn.cardPlacements?.forEach((cardPlacement) => {
                let tileModel = new GameBoardTileModel();
                tileModel.boardModifierList = [];
                tileModel.card = cardPlacement.card;
                tileModel.turn = turnIndex;
                board[cardPlacement.boardIndex] = tileModel;
            });

            turn.powerupUsages?.forEach((powerupUsage) => {
                if (!powerupUsage.usedBeforeTurn) {
                    powerupUsage.updatedTiles?.forEach((cardPlacement) => {
                        let tileModel = new GameBoardTileModel();
                        tileModel.boardModifierList = [];
                        tileModel.card = cardPlacement.card;
                        tileModel.turn = turnIndex;
                        board[cardPlacement.boardIndex] = tileModel;

                        if (cardPlacement.card === null) {
                            board[cardPlacement.boardIndex] = null;
                        }
                    });
                }
            });
        });

        // Add current state of board modifiers
        matchState.boardModifiers.forEach((modifierList, index) => {
            modifierList.forEach((modifier) => {
                let tileModel = board[index];
                if (!tileModel) {
                    tileModel = new GameBoardTileModel();
                    board[index] = tileModel;
                }
                tileModel.boardModifierList.push(modifier);
            });
        });

        // TODO: Check objectives and highlight any tiles needed to complete objectives

        return board;
    }

    public static NewNoPlayTurn(): Turn {
        return new Turn(TurnType.NoPlay, null, null, null);
    }

    public static NewTurn(
        newCardPlacements: CardPlacement[],
        fullhandCardPlacements: CardPlacement[],
        powerupUsages: PowerupUsageContext[],
        modifiersUsed: BoardModifier[] = []
    ): Turn {
        return new Turn(TurnType.Play, newCardPlacements, fullhandCardPlacements, powerupUsages, modifiersUsed);
    }

    public static DoubleNextHandScoreFromExtraServings() {
        this._extraServingsScoreMultiplier *= 2;
    }

    public static RevertDoubledScoreFromExtraServings() {
        this._extraServingsScoreMultiplier = 1;
    }

    public static BurnAndRedrawCards(gameController: CardScrambleGameController, indicesToBurn: number[]) {
        gameController.match.state.playerHand = gameController.match.state.playerHand.filter((_, index) => !indicesToBurn.includes(index));

        gameController.UpdatePlayerHand(true);
        this.DrawCardsUntilHandFull(gameController);
    }

    public static DrawCardsUntilHandFull(gameController: CardScrambleGameController) {
        while (gameController.match.state.playerHand.length < gameController.config.handSize && gameController.match.state.deck.length > 0) {
            gameController.match.state.playerHand.push(gameController.match.state.deck.pop()!);
        }

        gameController.UpdatePlayerHand(true);
    }

    public static AddCardToHand(gameController: CardScrambleGameController, card: Card): GripCard {
        let gripCard = gameController.AddCardToPlayerHand(new Card(Card.Joker), false);
        gameController.match.state.playerHand.push(card);
        gameController.UpdatePlayerHand(false);

        return gripCard;
    }

    public static ReplaceCardInHand(gameController: CardScrambleGameController, newCard: Card, oldCard: Card, onComplete: () => void) {
        let existingCard = gameController.match.state.playerHand.find((card) => card.rank === oldCard.rank && card.suit === oldCard.suit);

        if (existingCard) {
            gameController.match.state.playerHand[gameController.match.state.playerHand.indexOf(existingCard)] = newCard;
            gameController.UpdatePlayerHand(false);

            onComplete();
        } else {
            MatchOperations.log.error(`Card: ${oldCard.toString()} is not in the player's hand`);
        }
    }

    public static AddCardToDeck(match: Match, card: Card) {
        match.state.deck.push(card);
    }

    private static _performPlayTurn(
        gameController: CardScrambleGameController,
        scorer: RankedHandScorer,
        hand: CardPlacement[],
        fullHand: CardPlacement[],
        playerHand: Card[],
        powerupUsages: PowerupUsageContext[]
    ): void {
        const board = this.BuildBoardFromTurns(gameController.match.state, gameController.config);
        const updatedWallIndices: number[] = [];

        hand.forEach((cardPlacement) => {
            const index = playerHand.findIndex(
                (c) =>
                    c.rank === cardPlacement.originalCard.rank &&
                    c.suit === cardPlacement.originalCard.suit &&
                    c.type === cardPlacement.originalCard.type
            );
            if (index < 0) {
                throw new Error(`Playing card ${cardPlacement.card} not in hand`);
            }
            if (board[cardPlacement.boardIndex] != null && board[cardPlacement.boardIndex]?.card != Card.Invalid) {
                throw new Error(`Playing a card on top of another card ${cardPlacement.card} on ${board[cardPlacement.boardIndex].card}`);
            }
            playerHand.splice(index, 1);
        });

        let handName = HandName.Invalid;
        let specialHandName = HandName.Invalid;
        let baseHands: HandName[] = [];
        let score = 0;
        let scoreMultipliersFromModifiers: number[] = [];
        let handModifiersFromBoard: BoardModifier[] = [];

        fullHand.forEach((cardPlacement) => {
            //apply board modifiers for the played tile
            let modifierList = gameController.match.state.boardModifiers[cardPlacement.boardIndex];
            modifierList.forEach((modifier) => {
                switch (modifier.type) {
                    case BoardModifierType.BurningFood: {
                        const burningfoodModifier = modifier as BurningFoodModifier;
                        gameController.match.state.boardModifiers[cardPlacement.boardIndex] = modifierList.filter(
                            (modifier) => modifier.type !== BoardModifierType.BurningFood
                        );
                        gameController.Gameboard.boardTiles[cardPlacement.boardIndex].removeBoardModifier(BoardModifierType.BurningFood);
                        SoundManager.instance.playSound('SFX_Gameplay_BurningFood_Complete');

                        var adjacentIndices = this.GetAdjacentIndices(cardPlacement.boardIndex, board);

                        adjacentIndices.forEach((adjacentIndex) => {
                            gameController.Gameboard.boardTiles[adjacentIndex].toggleNextTurnBurnAnim(false);
                        });
                        handModifiersFromBoard.push(burningfoodModifier);

                        break;
                    }
                    case BoardModifierType.HandMultiplier: {
                        //TODO: Move multiplier logic to here
                        const handMultiplierModifier = modifier as HandMultiplierModifier;

                        scoreMultipliersFromModifiers.push(handMultiplierModifier.multiplier);

                        gameController.match.state.boardModifiers[cardPlacement.boardIndex] = modifierList.filter(
                            (modifier) => modifier.type !== BoardModifierType.HandMultiplier
                        );

                        handModifiersFromBoard.push(handMultiplierModifier);
                        break;
                    }
                }
            });

            //check adjacent squares for affected modifiers (e.g breakable walls)
            let adjacentTiles = this.GetAdjacentTiles(cardPlacement.boardIndex, board);
            adjacentTiles.forEach((tileModel) => {
                if (tileModel) {
                    tileModel.boardModifierList.forEach((modifier) => {
                        if (modifier.type === BoardModifierType.BreakableWall) {
                            var wallModifier = modifier as BreakableWallModifier;

                            //validate required rank and suit is correct and the wall has not been updated from this hand yet
                            if (wallModifier.requiredRank >= 0 && cardPlacement.card.rank !== wallModifier.requiredRank) {
                                //don't apply, rank is wrong
                            } else if (wallModifier.requiredSuit >= 0 && cardPlacement.card.suit !== wallModifier.requiredSuit) {
                                //don't apply, suit is wrong
                            } else if (updatedWallIndices.includes(wallModifier.boardIndex)) {
                                //don't apply, this wall has already been affected by the played hand
                            } else {
                                //activate breakable wall group
                                let wallGroup = this.FindWallGroup(wallModifier, board);

                                wallGroup.forEach((wall) => {
                                    updatedWallIndices.push(wall.boardIndex);

                                    if (wall.reinforced) {
                                        wall.reinforced = false;
                                    } else {
                                        //Wall breaks here
                                        gameController.match.state.boardModifiers[wall.boardIndex] = gameController.match.state.boardModifiers[
                                            wall.boardIndex
                                        ].filter((modifier) => modifier.type !== BoardModifierType.BreakableWall);

                                        handModifiersFromBoard.push(wallModifier);
                                    }
                                });
                            }
                        }
                    });
                }
            });
        });

        scoreMultipliersFromModifiers.sort((a, b) => b - a);

        if (hand.length > 0) {
            let handPlacement: GameBoardTileModel[] = [];

            const handIncludingAnchors = this.findHandIncludingAnchors(hand, board, handPlacement);
            if (handIncludingAnchors.length !== 5) {
                throw new Error(
                    `Invalid turn: ${hand.map((c) => c.card).join(' ')} results in hand ${handIncludingAnchors.join(' ')} (${handIncludingAnchors.length})`
                );
            }

            const classification = scorer.scoreHand(handIncludingAnchors);
            score = classification.score;
            handName = classification.handName;
            specialHandName = classification.specialHandName;
            baseHands = classification.baseHandNames;
        }

        //Apply hand multiplier modifiers
        scoreMultipliersFromModifiers.forEach((multiplier) => {
            score *= multiplier;
        });

        //Apply Score Multiplier From Powerup
        score *= this._extraServingsScoreMultiplier;
        this._extraServingsScoreMultiplier = 1;

        // Add a new turn to the match state
        let turn = this.NewTurn(hand, fullHand, powerupUsages, handModifiersFromBoard);
        turn.score = score;
        turn.handName = handName;
        turn.specialHandName = specialHandName;
        turn.baseHands = baseHands;

        // Draw new cards
        while (playerHand.length < gameController.config.handSize && gameController.match.state.deck.length > 0) {
            playerHand.push(gameController.match.state.deck.pop()!);
        }

        gameController.match.state.turns.push(turn);
    }

    public static TickModifiers(gameController: CardScrambleGameController, newCardsPlayed: CardPlacement[]) {
        gameController.match.state.boardModifiers.forEach((modifierList, index) => {
            if (!modifierList) {
                return;
            }

            modifierList.forEach((modifier) => {
                if (!modifier || !modifier.expires) {
                    return;
                }

                modifier.expiresTurnCount--;

                if (modifier.expiresTurnCount > 0) {
                    return;
                }

                if (modifier.type === BoardModifierType.BurningFood) {
                    gameController.ApplyBurningFoodModifier(newCardsPlayed, index, modifierList);
                }
            });
        });
    }

    //Used for FreeDessert Powerup Only
    public static ScoreExtraHand(gameController: CardScrambleGameController, cards: Card[], powerupUsages: PowerupUsageContext[]): number {
        let handName = HandName.Invalid;
        let specialHandName = HandName.Invalid;
        let baseHands: HandName[] = [];
        let score = 0;

        const classification = gameController.handScorer.scoreHand(cards);
        score = classification.score;
        handName = classification.handName;
        specialHandName = classification.specialHandName;
        baseHands = classification.baseHandNames;

        // Add a new turn to the match state
        let cardPlacements: CardPlacement[] = [];

        cards.forEach((card) => {
            cardPlacements.push(new CardPlacement(-1, card, card));
        });

        let turn = new Turn(TurnType.Play, cardPlacements, cardPlacements, powerupUsages);
        turn.score = score;
        turn.handName = handName;
        turn.specialHandName = specialHandName;
        turn.baseHands = baseHands;
        gameController.match.state.turns.push(turn);

        gameController.UpdateHUDState();
        gameController.UpdateGoalsUI();

        return score;
    }

    // look for a card on the board or in the card placement list at the given x,y position
    private static _findCardAtPosition(cards: CardPlacement[], board: GameBoardTileModel[], x: number, y: number): Card | null {
        const boardIndex = y * 13 + x;
        const tileModel = board[boardIndex];
        const cardInHand = cards.find((cp) => cp.boardIndex === boardIndex);

        let card = tileModel?.card;
        if (!card || card === Card.Invalid) {
            card = cardInHand?.card;
        }
        return card || null;
    }

    public static NewDefaultDeck(): Card[] {
        const deck: Card[] = [];
        for (let suit = 1; suit <= 4; suit++) {
            for (let rank = 1; rank <= 13; rank++) {
                deck.push(new Card(rank, suit));
            }
        }

        // 2 jokers
        deck.push(new Card(Card.Joker), new Card(Card.Joker));
        return deck;
    }

    private static _newDefaultBoardState(placeAnchor: boolean = true): GameBoardTileModel[] {
        const board = new Array<GameBoardTileModel>(13 * 13).fill(null);

        if (placeAnchor) {
            let tileModel = new GameBoardTileModel();
            tileModel.boardModifierList = [];
            tileModel.card = new Card(Card.Wild);
            tileModel.turn = -1;
            board[6 * 13 + 6] = tileModel;
        }

        return board;
    }

    public static GetAdjacentTiles(indexToCheck: number, board: GameBoardTileModel[]): GameBoardTileModel[] {
        let adjacentTiles: GameBoardTileModel[] = [];
        let boardSize = Math.sqrt(board.length);

        let row = Math.floor(indexToCheck / boardSize);
        let col = indexToCheck % boardSize;

        // Left
        if (col > 0) {
            adjacentTiles.push(board[indexToCheck - 1]);
        }

        // Right
        if (col < boardSize - 1) {
            adjacentTiles.push(board[indexToCheck + 1]);
        }

        // Down
        if (row > 0) {
            adjacentTiles.push(board[indexToCheck - boardSize]);
        }

        // Up
        if (row < boardSize - 1) {
            adjacentTiles.push(board[indexToCheck + boardSize]);
        }

        return adjacentTiles;
    }

    public static GetAdjacentIndices(index: number, board: GameBoardTileModel[]): number[] {
        let adjacentIndices: number[] = [];

        let boardSize = Math.sqrt(board.length);

        let row = Math.floor(index / boardSize);
        let col = index % boardSize;

        // Left
        if (col > 0) {
            adjacentIndices.push(index - 1);
        }

        // Right
        if (col < boardSize - 1) {
            adjacentIndices.push(index + 1);
        }

        // Down
        if (row > 0) {
            adjacentIndices.push(index - boardSize);
        }

        // Up
        if (row < boardSize - 1) {
            adjacentIndices.push(index + boardSize);
        }

        return adjacentIndices;
    }

    public static FindWallGroup(startingWall: BreakableWallModifier, board: GameBoardTileModel[]): BreakableWallModifier[] {
        const wallGroup: BreakableWallModifier[] = [];
        const visitedIndices = new Set<number>();
        const queue: number[] = [startingWall.boardIndex];

        while (queue.length > 0) {
            const currentIndex = queue.shift()!;
            if (visitedIndices.has(currentIndex)) {
                continue;
            }

            visitedIndices.add(currentIndex);

            if (board[currentIndex]) {
                const currentModifier = board[currentIndex].boardModifierList.find(
                    (m) => m.type === BoardModifierType.BreakableWall
                ) as BreakableWallModifier;

                if (
                    currentModifier &&
                    currentModifier.requiredRank === startingWall.requiredRank &&
                    currentModifier.requiredSuit === startingWall.requiredSuit
                ) {
                    wallGroup.push(currentModifier);

                    if (currentModifier.boardIndex === -1) {
                        currentModifier.boardIndex = currentIndex;
                    }

                    const adjacentIndices = this.GetAdjacentIndices(currentIndex, board);
                    for (const tileIndex of adjacentIndices) {
                        if (!visitedIndices.has(tileIndex)) {
                            queue.push(tileIndex);
                        }
                    }
                }
            }
        }

        return wallGroup;
    }
}
