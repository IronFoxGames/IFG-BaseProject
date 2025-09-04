import { _decorator, Animation, Component, instantiate, Node, Prefab, tween, Vec3 } from 'cc';
import { AppConfig } from '../config/AppConfig';
import { BoardHelpers, Card, CardPlacement, HandClassification, MatchOperations, TileState, Turn } from '../core';
import { Random } from '../core/Random';
import { RankedHandScorer } from '../core/RankedHandScorer';
import { BoardModifierType } from '../core/enums/BoardModifierType';
import { PowerupType } from '../core/enums/BoosterType';
import { Currency } from '../core/enums/Currency';
import { ObjectiveType } from '../core/enums/ObjectiveType';
import { TurnType } from '../core/enums/TurnType';
import { BoardModifier, BreakableWallModifier, BurnedTileModifier } from '../core/model/BoardModifier';
import { GameConfig } from '../core/model/GameConfig';
import { GameModel } from '../core/model/GameModel';
import { ItemInfo } from '../core/model/ItemInfo';
import { Match } from '../core/model/Match';
import { MatchStatistics } from '../core/model/MatchStatistics';
import { TilePlacedObjectiveParams, TurnLimitObjectiveParams } from '../core/model/ObjectiveParams';
import { PlayedHand } from '../core/model/PlayedHand';
import { PowerupUsageContext } from '../core/model/PowerupUsageContext';
import { GameOverResult, ObjectiveProgressData, PuzzleCompleteEventData } from '../core/model/PuzzleCompleteEventData';
import { Gameboard } from '../game/Gameboard';
import { PlayerHand } from '../game/PlayerHand';
import { logger } from '../logging';
import { CleanDownPowerup } from '../powerups/CleanDownPowerup';
import { CookingTheBooksPowerup } from '../powerups/CookingTheBooksPowerup';
import { ExtraServingsPowerup } from '../powerups/ExtraServingsPowerup';
import { FreeDessertPowerup } from '../powerups/FreeDessertPowerup';
import { Plus7CardsPowerup } from '../powerups/Plus7CardsPowerup';
import { Powerup } from '../powerups/Powerup';
import { RefirePowerup } from '../powerups/RefirePowerup';
import { StoreType, UpsellOffer } from '../services/IStore';
import { ResourceChangeContext } from '../services/ResourceChangeContext';
import { Services } from '../state/Services';
import { BoardModifierVisual } from './BoardModifierVisual';
import { BoardTile } from './BoardTile';
import { CardVisual } from './CardVisual';
import { GripCard } from './GripCard';
import { HUDController } from './HUDController';
import { PlayedCard, PlayedCardState } from './PlayedCard';
import { UIManager } from './UIManager';
import { BurningFoodScoreLossIndicator } from './ui/BurningFoodScoreLossIndicator';
import { CardTransformer } from './ui/CardTransformer';
import { GiveUpView } from './ui/GiveUpView';
import { GripCardSlot } from './ui/GripCardSlot';
import { PowerupEntry } from './ui/PowerupEntry';

const { ccclass, property } = _decorator;

enum GameState {
    Loading,
    Initialization,
    PlayerTurn,
    PlayerTurnComplete,
    BotTurn,
    BotTurnComplete,
    GameOver
}

@ccclass('CardScrambleGameController')
export class CardScrambleGameController extends Component {
    // Game events triggered during gameplay
    public static EventOnHandReady = 'EventOnHandReady';
    public static EventOnGameComplete = 'EventOnGameComplete';
    public static EventOnGameQuit = 'EventOnGameQuit';

    @property(Gameboard)
    private gameboard: Gameboard;

    @property(PlayerHand)
    private playerHand: PlayerHand;

    @property(UIManager)
    private UIManager: UIManager;

    @property(Node)
    private powerupScrim: Node;

    @property(Node)
    private interactionBlocker: Node;

    @property(Node)
    tileAnimationParent: Node = null;

    @property(Prefab)
    freeDessertHandSelector: Prefab;

    @property(Prefab)
    refireGripSelector: Prefab;

    @property(Prefab)
    cookingTheBooksGripSelector: Prefab;

    @property(Prefab)
    cleanDownPrefab: Prefab;

    @property(Prefab)
    modifierVFXPrefab: Prefab;

    @property(Prefab)
    burningFoodScoreLossPrefab: Prefab;

    private _config: GameConfig;
    private _appConfig: AppConfig;
    private _random: Random;

    private _handScorer: RankedHandScorer;

    private _currentState: GameState = GameState.Loading;
    private _gameModel: GameModel;
    private _giveUpView: GiveUpView = null;
    private _match: Match;
    private _objectiveCompletionStatus: boolean[] = [];
    private _puzzleId: string = '';
    private _puzzleIndex;
    private _powerupActive: boolean = false;
    private _deckInitialized: boolean = false;
    private _powerupUsages: PowerupUsageContext[] = [];
    private _numPlusSevenCardsPurchased: number = 0;
    private _currentGameOverReason: string;
    private _lastPlayedTurn: Turn = null;
    private _numBurningFoodsExpired: number = 0;
    private _scoreLossSequenceActive: boolean = false;
    private _dragReminderTimer: number = 0;
    private _dragReminderTimeout: number = 0;
    private _dragReminderEnabled: boolean = false;
    private _isDraggingCard: boolean = false;

    private _services: Services;
    private _onLoadCompleteBound = this._onLoadCompleteCallback.bind(this);
    private _loadComplete: boolean = false;
    private _log = logger.child('CardScrambleGameController');
    private _onTeardownCallback: () => void;

    private _turnTimer = 0;

    private _onPowerupAppliedHandler = async (powerup: Powerup, done: () => void = () => {}) => {
        await this._onPowerupApplied(powerup);
        done();
    };

    // For forcing game resolution
    private _forcedGameResult: GameOverResult = null;

    public get match() {
        return this._match;
    }

    public get config() {
        return this._config;
    }

    public get handScorer() {
        return this._handScorer;
    }

    public get currentPlayerHand() {
        return this.playerHand;
    }

    public get random() {
        return this._random;
    }

    public get animationParent() {
        return this.tileAnimationParent;
    }

    public get Gameboard() {
        return this.gameboard;
    }

    public get uiManager() {
        return this.UIManager;
    }

    public get giveUpView() {
        return this._giveUpView;
    }

    public get appConfig() {
        return this._appConfig;
    }

    public showDragInstructor(cardSlotIndex: number = -1, tileIndex: number = -1) {
        const cardPos = this.playerHand.getCardWorldPosition(cardSlotIndex);
        const boardPos = this.gameboard.getPlayableTileWorldPosition(tileIndex);
        if (!boardPos) {
            this._log.warn('No playable tile position found for play reminder');
            return;
        }
        this.UIManager.HUD.showCardDragInstructor(cardPos, boardPos);
    }

    start() {
        // Wait for init() from GameplayState
    }

    onDestroy() {
        if (this.gameboard.node != null) {
            this.gameboard.node.off(Gameboard.BoardEventHandReady, this._onHandReady, this);
            this.gameboard.node.off(Gameboard.BoardEventHandUnready, this._onHandUnready, this);
            this.gameboard.node.off(Gameboard.BoardEventTilesChanged, this._boardTilesChanged, this);
            this.gameboard.node.off(Gameboard.WorkingTileAddedEvent, this._onWorkingTileAdded, this);
            this.gameboard.node.off(Gameboard.WorkingTilesResetEvent, this._onWorkingTilesReset, this);

            if (this.gameboard.playerHand.node != null) {
                this.gameboard.playerHand.node.off('hand-card-selected', this.UIManager.HUD.onAnythingClicked, this.UIManager.HUD);
                this.gameboard.playerHand.node.off('board-card-selected', this.UIManager.HUD.onAnythingClicked, this.UIManager.HUD);
                this.gameboard.playerHand.node.off('hand-card-clear-selection', this.UIManager.HUD.onAnythingClicked, this.UIManager.HUD);
                this.gameboard.playerHand.getDragManager().node.off('drag-started', this.UIManager.HUD.onAnythingClicked, this.UIManager.HUD);
            }
        }
        if (this.UIManager.node != null) {
            this.UIManager.HUD.node.off(UIManager.UIEventGameOverConfirmed, this._onGameOverConfirmed, this);
        }
        if (this.UIManager.HUD.node != null) {
            this.UIManager.HUD.node.off(HUDController.UIEventHandPlayed, this._onPlayHand, this);
            this.UIManager.HUD.node.off(HUDController.UIEventQuitGame, this._onQuit, this);
            this.UIManager.HUD.node.off(HUDController.UIEventFinishLevel, this._showGiveUpView, this);
            this.UIManager.HUD.node.off(HUDController.UIEventSortHand, this._onSortPlayerHand, this);
            this.UIManager.HUD.node.off(HUDController.UIEventRecallCards, this._onCardsRecalled, this);
            this.UIManager.HUD.node.off(HUDController.UIEventPreparePowerup, this._onPreparePowerup, this);
            this.UIManager.HUD.node.off(HUDController.UIEventCancelPowerup, this._onPowerupPreparationCancelled, this);
            this.UIManager.HUD.node.off(PowerupEntry.OnPowerupSelectedEvent, this._onPowerupAppliedHandler, this);
            this.UIManager.HUD.node.off(PowerupEntry.OnPowerupUpsellEvent, this._onInGameUpsell, this);
        }

        this._onTeardownCallback?.call(this);
    }

    update(deltaTime: number) {
        this._updateState(this._currentState, deltaTime);
    }

    public init(config: GameConfig, appConfig: AppConfig, random: Random, services: Services, puzzleId: string, puzzleIndex: number) {
        this._config = config;
        this._appConfig = appConfig;
        this._random = random;
        this._services = services;
        this._puzzleId = puzzleId;
        this._puzzleIndex = puzzleIndex;
        this._deckInitialized = false;
        this._numPlusSevenCardsPurchased = 0;

        this._dragReminderTimeout = this.appConfig.hintsConfig.dragReminderTimeout;
        if (this._config.dragReminderTimeout > 0) {
            this._dragReminderTimeout = this._config.dragReminderTimeout;
        }
        this._dragReminderEnabled = this.appConfig.hintsConfig.enableDragReminder && this._dragReminderTimeout > 0;

        this.playerHand.init(this.UIManager.HUD, this);
        this._goToState(GameState.Initialization);

        this._services.cardScrambleService.registerOnLoadScreenCompleteCallback(this._onLoadCompleteBound);
        this.UIManager.HUD.UpdatePowerupState(this._services.cardScrambleService.getPowerupCount(PowerupType.Joker));
    }

    private _onLoadCompleteCallback() {
        this._loadComplete = true;

        // Set original deck size so we can count down as cards are dealt visually.
        this.UIManager.HUD.updateDeckCount(this._match.state.deck.length + this._gameModel.playerHand.getCards().length);
        this.UIManager.HUD.updatePlus7CardsPowerupState(this._services.cardScrambleService.getPowerupCount(PowerupType.Plus7Cards));
        this.UIManager.HUD.initDeck(() => {
            this._updatePlayerHands(true, false);
        });
        this._services.cardScrambleService.unregisterOnLoadScreenCompleteCallback(this._onLoadCompleteBound);
    }

    public updatePlayerHandSlotSpacing() {
        this.playerHand.updateCardSlotSpacing(this._gameModel.playerHand.getCards().length, this._appConfig);
    }

    public AddCardToPlayerHand(card: Card, isDrawnFromDeck: boolean): GripCard {
        return this.playerHand.AddCardToHand(card, isDrawnFromDeck);
    }

    public setPowerupActive(isActive: boolean) {
        this._powerupActive = isActive;
        this.powerupScrim.active = isActive;
    }

    public blockBoardInteraction(isBlocked: boolean) {
        this.interactionBlocker.active = isBlocked;
    }

    public forceGameOver(isWin: boolean) {
        this._forcedGameResult = isWin ? GameOverResult.Win : GameOverResult.Lose;
        this._doGameOver(this._forcedGameResult, isWin, this._puzzleIndex === -1);
    }

    private _goToState(newState: GameState) {
        if (this._currentState !== GameState.Loading) {
            this._exitState(this._currentState);
        }

        this._currentState = newState;
        this._enterState(newState);
    }

    private _enterState(state: GameState) {
        switch (state) {
            case GameState.Initialization:
                this._stateInitializationEnter();
                break;
            case GameState.PlayerTurn:
                this._statePlayerTurnEnter();
                break;
            case GameState.PlayerTurnComplete:
                this._statePlayerTurnCompleteEnter();
                break;
            case GameState.BotTurn:
                this._stateBotTurnEnter();
                break;
            case GameState.BotTurnComplete:
                this._stateBotTurnCompleteEnter();
                break;
            case GameState.GameOver:
                this._stateGameOverEnter();
                break;
        }
    }

    private _exitState(state: GameState) {
        switch (state) {
            case GameState.Initialization:
                this._stateInitializationExit();
                break;
            case GameState.PlayerTurn:
                this._statePlayerTurnExit();
                break;
            case GameState.PlayerTurnComplete:
                this._statePlayerTurnCompleteExit();
                break;
            case GameState.BotTurn:
                this._stateBotTurnExit();
                break;
            case GameState.BotTurnComplete:
                this._stateBotTurnCompleteExit();
                break;
            case GameState.GameOver:
                this._stateGameOverExit();
                break;
        }

        this._applyStateChanges();
    }

    private _updateState(state: GameState, deltaTime: number) {
        switch (state) {
            case GameState.Initialization:
                this._stateInitializationUpdate(deltaTime);
                break;
            case GameState.PlayerTurn:
                this._statePlayerTurnUpdate(deltaTime);
                break;
            case GameState.PlayerTurnComplete:
                this._statePlayerTurnCompleteUpdate(deltaTime);
                break;
            case GameState.BotTurn:
                this._stateBotTurnUpdate(deltaTime);
                break;
            case GameState.BotTurnComplete:
                this._stateBotTurnCompleteUpdate(deltaTime);
                break;
            case GameState.GameOver:
                this._stateGameOverUpdate(deltaTime);
                break;
        }
    }

    private _applyStateChanges() {
        const board = MatchOperations.BuildBoardFromTurns(this._match.state, this._config);
        this._gameModel.updateModelFromState(this._match.state, board);

        this.gameboard.updateVisuals();

        const scores = MatchOperations.CalculateScores(this._match, this._config);
        this.UIManager.HUD.updateState(this._match, scores.playerScore, scores.opponentScore);

        if (this._loadComplete) {
            this._updatePlayerHands(true, false);
        }
    }

    private _updatePlayerHands(drawFromDeck: boolean, updatedFromPowerupUsage: boolean) {
        this.UIManager.HUD.updateDeckCount(this._match.state.deck.length);
        this.UIManager.HUD.updatePlus7CardsPowerupState(this._services.cardScrambleService.getPowerupCount(PowerupType.Plus7Cards));
        this.playerHand.setHand(this._gameModel.playerHand, drawFromDeck, this._appConfig, updatedFromPowerupUsage);
    }

    public UpdateDeckCount() {
        this.UIManager.HUD.updateDeckCount(this._match.state.deck.length);
        this.UIManager.HUD.updatePlus7CardsPowerupState(this._services.cardScrambleService.getPowerupCount(PowerupType.Plus7Cards));

        // TODO: will need to animate cards back in?
    }

    public UpdatePlayerHand(drawFromDeck: boolean) {
        const board = MatchOperations.BuildBoardFromTurns(this._match.state, this._config);
        this._gameModel.updateModelFromState(this._match.state, board);

        this._updatePlayerHands(drawFromDeck, true);
    }

    public UpdateHUDState() {
        const scores = MatchOperations.CalculateScores(this._match, this._config);
        this.UIManager.HUD.updateState(this._match, scores.playerScore, scores.opponentScore);
        this.UpdateGoalsUI();
    }

    public UpdateGoalsUI() {
        const scores = MatchOperations.CalculateScores(this._match, this._config);
        this._updateObjectivesProgress(scores);
    }

    public HighlightAllPlacedCardsOnBoard(highlight: boolean): CardVisual[] {
        const board = this.gameboard.boardTiles;
        let highlightedTiles: CardVisual[] = [];

        board.forEach((tile) => {
            if (tile.getTileModelState() === TileState.Occupied) {
                let cardVisual = tile.getComponentInChildren(CardVisual);

                if (cardVisual) {
                    if (highlight) {
                        cardVisual.setHighlighted(true);
                    } else {
                        cardVisual.setHighlighted(false);
                        cardVisual.setLocked(true);
                    }
                    highlightedTiles.push(cardVisual);
                }
            }
        });

        return highlightedTiles;
    }

    public HighlightCardsFromBoardIndices(boardIndices: number[], highlight: boolean): CardVisual[] {
        const board = this.gameboard.boardTiles;
        let highlightedCards: CardVisual[] = [];

        board.forEach((tile) => {
            if (boardIndices.includes(tile.index)) {
                const cardVisual = tile.getComponentInChildren(CardVisual);

                if (cardVisual) {
                    cardVisual.setHighlighted(highlight);
                    highlightedCards.push(cardVisual);

                    if (!highlight) {
                        cardVisual.setLocked(true);
                    }
                }
            }
        });

        return highlightedCards;
    }

    public tweenHUDHandScore(scoreToDisplay: number, startWorldPos: Vec3, endWorldPos: Vec3 = null) {
        if (endWorldPos) {
            this.UIManager.HUD.tweenHandScore(scoreToDisplay, startWorldPos, endWorldPos);
        } else {
            this.UIManager.HUD.tweenHandScore(scoreToDisplay, startWorldPos);
        }
    }

    public CleanDownBurnedTilesAndCards(tiles: BoardTile[], cards: PlayedCard[]) {
        tiles.forEach((tile) => {
            if (tile.boardModifierVisual) {
                tile.boardModifierVisual.playCleanDownActivateAnim(() => {
                    tile.removeBoardModifier(BoardModifierType.BurnedTile);
                    this._match.state.boardModifiers[tile.index] = this._match.state.boardModifiers[tile.index].filter(
                        (modifier) => modifier.type !== BoardModifierType.BurnedTile
                    );
                });
            }
        });
        cards.forEach((playedCard) => {
            let cardTransformer = playedCard.node.getComponentInChildren(CardTransformer);
            cardTransformer.playCleanDownActivateAnim(false);

            cardTransformer.cardAnimator.once(Animation.EventType.FINISHED, () => {
                playedCard.removeCardStatus(PlayedCardState.Burnt);
                playedCard.toggleCardTransformer(false);
            });
        });
    }

    public ApplyBurningFoodModifier(newCardsPlayed: CardPlacement[], index: number, modifierList: BoardModifier[]) {
        const board = MatchOperations.BuildBoardFromTurns(this._match.state, this._config);
        let shouldShowScoreLossUI: boolean = true;
        this._numBurningFoodsExpired++;
        let prevTurnIdx = this._match.state.turns.length > 0 ? this._match.state.turns.length - 1 : 0;

        this.blockBoardInteraction(true);
        this.uiManager.HUD.BlockHUDInteraction(true);
        this.currentPlayerHand.setHandInteractable(false);
        this.gameboard.boardTiles[index].boardModifierVisual.activateBurningFood(() => {});

        const burnedTileModifier = new BurnedTileModifier();
        this._match.state.boardModifiers[index].push(burnedTileModifier);
        this.gameboard.boardTiles[index].addBoardModifier(burnedTileModifier);
        this._match.state.turns[prevTurnIdx].tilesBurned++;

        this._match.state.boardModifiers[index] = modifierList.filter((modifier) => modifier.type !== BoardModifierType.BurningFood);
        this.gameboard.boardTiles[index].removeBoardModifier(BoardModifierType.BurningFood);

        const adjacentIndices = MatchOperations.GetAdjacentIndices(index, board);
        let numBurnedAdjacentTiles = 0;

        adjacentIndices.forEach((adjacentIndex) => {
            let addBurnedTileModifier: boolean = true;
            let newCardPlacement = newCardsPlayed.find((cp) => cp.boardIndex === adjacentIndex);

            //there is a card on this tile. Don't burn the tile, burn the card
            if (board[adjacentIndex] && board[adjacentIndex].card && !board[adjacentIndex].card.equals(Card.Invalid)) {
                this.gameboard.boardTiles[adjacentIndex].placedCard.addCardStatus(PlayedCardState.Burnt);
                this._match.state.turns[prevTurnIdx].tilesBurned++;
            } else if (newCardPlacement) {
                this.gameboard.boardTiles[newCardPlacement.boardIndex].placedCard.addCardStatus(PlayedCardState.Burnt);
                this._match.state.turns[prevTurnIdx].tilesBurned++;
            } else {
                if (this._match.state.boardModifiers[adjacentIndex].length > 0) {
                    let existingModifiers: BoardModifier[] = this._match.state.boardModifiers[adjacentIndex];
                    existingModifiers.forEach((existingModifier) => {
                        if (existingModifier.type === BoardModifierType.BurningFood) {
                            //this check is to avoid double burning an adjacent food
                            if (adjacentIndex > index && existingModifier.expiresTurnCount === 1) {
                                addBurnedTileModifier = false;
                            } else {
                                shouldShowScoreLossUI = false;
                                this.ApplyBurningFoodModifier(newCardsPlayed, adjacentIndex, existingModifiers);
                            }
                        } else if (existingModifier.type === BoardModifierType.BurnedTile || existingModifier.type === BoardModifierType.Null) {
                            addBurnedTileModifier = false;
                        } else {
                            this._match.state.boardModifiers[adjacentIndex] = existingModifiers.filter(
                                (modifier) => modifier.type !== existingModifier.type
                            );
                            this.gameboard.boardTiles[adjacentIndex].removeBoardModifier(existingModifier.type);
                        }
                    });
                }

                if (addBurnedTileModifier) {
                    numBurnedAdjacentTiles++;
                    let modifier = new BurnedTileModifier();
                    this._match.state.boardModifiers[adjacentIndex].push(modifier);
                    this.gameboard.boardTiles[adjacentIndex].addBoardModifier(modifier);
                    this._match.state.turns[prevTurnIdx].tilesBurned++;

                    if (this.gameboard.boardTiles[adjacentIndex].boardModifierVisual) {
                        this.gameboard.boardTiles[adjacentIndex].boardModifierVisual.activateTileBurn(() => {
                            this.gameboard.setInteractableTilesFromBoardState(this._gameModel.playerHand.getCards().length);

                            this.blockBoardInteraction(false);
                            this.UIManager.HUD.BlockHUDInteraction(false);
                            this.playerHand.setHandInteractable(true);

                            if (shouldShowScoreLossUI && !this._scoreLossSequenceActive) {
                                this._playScoreLossSequence();
                            }
                        });
                    }
                }
            }
        });

        if (shouldShowScoreLossUI && numBurnedAdjacentTiles === 0 && !this._scoreLossSequenceActive) {
            this._playScoreLossSequence();
        }
    }

    private _playScoreLossSequence() {
        this._scoreLossSequenceActive = true;
        let scoreLossInstance = instantiate(this.burningFoodScoreLossPrefab);
        scoreLossInstance.parent = this.uiManager.HUD.node;
        let scoreLossComponent = scoreLossInstance.getComponent(BurningFoodScoreLossIndicator);

        scoreLossComponent.playScoreLossAnimation(this._appConfig.burningFoodScoreLossAmount * this._numBurningFoodsExpired, () => {
            let scoreLossAmount = this._appConfig.burningFoodScoreLossAmount * this._numBurningFoodsExpired;

            let prevTurnIdx = this._match.state.turns.length > 0 ? this._match.state.turns.length - 1 : 0;
            this._match.state.turns[prevTurnIdx].score -= scoreLossAmount;
            this._match.state.turns[prevTurnIdx].scoreLossAmount = scoreLossAmount;

            tween(scoreLossComponent.scoreLabel.node)
                .to(
                    1,
                    { worldPosition: this.uiManager.HUD.playerScore.node.getWorldPosition(), scale: new Vec3(0.3, 0.3, 0.3) },
                    { easing: 'cubicOut' }
                )
                .call(() => {
                    scoreLossInstance.destroy();
                    this.UpdateHUDState();
                    this._numBurningFoodsExpired = 0;
                    this._scoreLossSequenceActive = false;
                })
                .start();
        });
    }

    private _onHandUnready(handPlayed: boolean) {
        this.UIManager.HUD.setHandReady(false, null);

        if (!handPlayed) {
            this._checkForBreakableWallUpdates(false);
        }

        this.uiManager.HUD.goalsUI.goalEntries.forEach((entry) => {
            entry.SetGoalHighlighted(false);
        });
    }

    private _onHandReady(handClassification: HandClassification, cardList: CardPlacement[]) {
        this.UIManager.HUD.setHandReady(true, handClassification);

        // Tutorial callback
        this._services.tutorialService.onHandPlaced(this._config.name, this._match.state.turns.length, handClassification);

        this._checkForBreakableWallUpdates(true);
        this._checkForObjectiveUpdatesInPlayableHand(handClassification, cardList);
    }

    private _checkForBreakableWallUpdates(handReady: boolean) {
        const board = MatchOperations.BuildBoardFromTurns(this._match.state, this._config);

        if (!handReady) {
            this.gameboard.boardTiles.forEach((tile) => {
                let modifierVisual = tile.boardModifierContainer.getComponentInChildren(BoardModifierVisual);

                //static anim
                if (modifierVisual) {
                    modifierVisual.playWallAnim(2);
                }
            });

            return;
        }

        this.gameboard.currentWorkingTiles.forEach((tile) => {
            let adjacentTiles = MatchOperations.GetAdjacentTiles(tile.index, board);
            adjacentTiles.forEach((tileModel) => {
                if (tileModel) {
                    tileModel.boardModifierList.forEach((modifier) => {
                        if (modifier.type === BoardModifierType.BreakableWall) {
                            var wallModifier = modifier as BreakableWallModifier;

                            //validate required rank and suit is correct and the wall has not been updated from this hand yet
                            if (wallModifier.requiredRank >= 0 && tile.getCard().rank !== wallModifier.requiredRank) {
                                //don't apply, rank is wrong
                            } else if (wallModifier.requiredSuit >= 0 && tile.getCard().suit !== wallModifier.requiredSuit) {
                                //don't apply, suit is wrong
                            } else {
                                let wallGroup = MatchOperations.FindWallGroup(wallModifier, board);

                                wallGroup.forEach((wall) => {
                                    let modifierVisual =
                                        this.gameboard.boardTiles[wall.boardIndex]?.boardModifierContainer.getComponentInChildren(
                                            BoardModifierVisual
                                        );

                                    //idle anim
                                    if (modifierVisual) {
                                        modifierVisual.playWallAnim(0);
                                    }
                                });
                            }
                        }
                    });
                }
            });
        });
    }

    private _checkForTargetTileUpdates() {
        let targetIndices: number[] = [];
        this._config.objectives.forEach((objective) => {
            objective.objectiveDataList.forEach((param) => {
                if (param.objectiveType === ObjectiveType.TilePlacement) {
                    const tileObjective = param as TilePlacedObjectiveParams;

                    tileObjective.tileIndices.forEach((index) => {
                        targetIndices.push(index);
                    });
                }
            });
        });

        this.gameboard.currentWorkingTiles.forEach((tile) => {
            if (targetIndices.includes(tile.index)) {
                let modifierVFXInstance = instantiate(this.modifierVFXPrefab);
                modifierVFXInstance.parent = this.animationParent;
                modifierVFXInstance.setWorldPosition(tile.node.getWorldPosition());

                const modifierAnim = modifierVFXInstance.getComponentInChildren(Animation);
                modifierAnim.play(modifierAnim.clips[0].name);
            }
        });
    }

    private _boardTilesChanged(numTiles: number) {
        this.UIManager.HUD.enableRecallCardsButton(numTiles > 0);
        this._services.tutorialService.onCardPlaced(this._config.name);

        const numCardsToPlay = BoardHelpers.HAND_SIZE - numTiles;
        this.UIManager.HUD.setCardPlayedStatus(numCardsToPlay);
    }

    private async _onPlayHand(handClassification: HandClassification) {
        this._checkForTargetTileUpdates();
        this.blockBoardInteraction(true);
        this.uiManager.HUD.BlockHUDInteraction(true);

        this._services.tutorialService.onHandSubmitted(this._config.name, this._match.state.turns.length, handClassification);
        this.playerHand.setHandInteractable(false);
        const playedHand = await this.gameboard.playHand(handClassification);
        this._endPlayerTurn(playedHand);

        // Tutorial callback
        this._services.tutorialService.onHandScoreTallied(this._config.name, this._match.state.turns.length - 1, handClassification);
    }

    private _onCardsRecalled() {
        this.gameboard.recallCardsToGrip();
        this.gameboard.updateVisuals();
    }

    private _onSortPlayerHand(sortFunction: (a: GripCardSlot, b: GripCardSlot) => number) {
        this.playerHand.sortHand(sortFunction);
    }

    private async _onPowerupApplied(powerup: Powerup) {
        this._giveUpView = null;
        this.UIManager.HUD.enableGiveupButton(false);

        if (powerup.PowerupType === PowerupType.Joker) {
            this.currentPlayerHand.setHandInteractable(false);
            this.blockBoardInteraction(true);
            this.uiManager.HUD.BlockHUDInteraction(true);
        }

        let powerupApplied = await this._services.powerupService.ApplyPowerup(powerup, this._config);
        await this.UIManager.HUD.UpdatePowerupState(this._services.cardScrambleService.getPowerupCount(PowerupType.Joker));

        if (powerup.PowerupType != PowerupType.Plus7Cards && powerup.PowerupType != PowerupType.CleanDown) {
            this._statePlayerTurnEnter();
        }

        if (!powerupApplied) {
            this.currentPlayerHand.setHandInteractable(true);
            this.uiManager.HUD.BlockHUDInteraction(false);
        }
    }

    public onPowerupApplicationComplete(powerupUsage: PowerupUsageContext) {
        if (powerupUsage.usedBeforeTurn) {
            this._powerupUsages.push(powerupUsage);
        } else {
            this._match.state.turns[this._match.state.turns.length - 1].powerupUsages.push(powerupUsage);
        }

        this._statePlayerTurnEnter();

        // Update powerup entry state
        this.UIManager.HUD.UpdatePowerupState(this._services.cardScrambleService.getPowerupCount(PowerupType.Joker));
    }

    public onFreeDessertApplicationComplete() {
        this._goToState(GameState.PlayerTurnComplete);
    }

    public async getNextUpsell(item: ItemInfo): Promise<UpsellOffer> {
        let numScopedPurchases = 0;
        if (item.id === PowerupType.Plus7Cards) {
            numScopedPurchases = this._numPlusSevenCardsPurchased;
        }

        const upsellOffer = await this._services.store.getNextUpsell(item.id, numScopedPurchases);
        return upsellOffer;
    }

    private _onGiveUpUpsell(item: ItemInfo) {
        return this._onUpsell(item, 'giveupupsell');
    }

    private _onInGameUpsell(item: ItemInfo) {
        return this._onUpsell(item, 'ingameupsell');
    }

    private async _onUpsell(item: ItemInfo, storeType: StoreType) {
        const upsellOffer = await this.getNextUpsell(item);
        if (!upsellOffer) {
            this._log.warn('Failed to find upsell offer', { item: item });
            return;
        }

        const upsellResult = await this._services.UIOverlayService.showUpsellForItem(item, upsellOffer, storeType);
        if (upsellResult) {
            // Increment count purchased this round
            if (item.id === PowerupType.Plus7Cards) {
                this._numPlusSevenCardsPurchased++;
            }
            this.UIManager.HUD.UpdatePowerupState(this._services.cardScrambleService.getPowerupCount(PowerupType.Joker));

            if (this._giveUpView) {
                this._giveUpView.updatePowerupVisuals();
                this._giveUpView.usePowerupAfterPurchase();
            }
        }
    }

    private _onPreparePowerup(powerup: Powerup) {
        this._services.powerupService.PreparePowerup(powerup, this._config);
    }

    private _onPowerupPreparationCancelled(powerup: Powerup) {
        this._services.powerupService.CancelPowerupPreparation(powerup);
    }

    private _onCanNotPlayHand() {
        this._endPlayerTurn(null);
    }

    private _onQuit() {
        // Capture game state, but mark the result as a quit
        const result = this._buildGameOverEvent();
        result.Status = GameOverResult.Quit;
        this.node.emit(CardScrambleGameController.EventOnGameQuit, result);
    }

    private _onGameOverConfirmed() {
        const result = this._buildGameOverEvent();

        // Technically the game doesn't evaluate as a loss anymore as the user needs to go through the
        // give up flow. If we get here with a None status, it means the game is still active, but the user
        // has given up, so treat it as a loss for all followup actions.
        if (result.Status === GameOverResult.None) {
            result.Status = GameOverResult.Lose;
        }

        // TODO: The forced game outcome above was intended for the cheat menu but apparently is now
        // used in the give up flow. Fix.

        // Override the result if we forced an outcome
        if (this._forcedGameResult != null) {
            result.Status = this._forcedGameResult;
            result.ObjectivesComplete = this._forcedGameResult == GameOverResult.Win ? true : false;
        }

        // TODO: In too many places we're overriding game status for quickplay. We should just pass
        // around the proper status from the beginning.
        const isQuickPlay = this._puzzleIndex === -1 && this._config.objectives.length === 0;
        if (isQuickPlay && result.Status !== GameOverResult.Quit) {
            result.Status = GameOverResult.Win;
        }

        this.node.emit(CardScrambleGameController.EventOnGameComplete, result);
    }

    private _endPlayerTurn(playedHand: PlayedHand) {
        this._lastPlayedTurn =
            playedHand == null
                ? MatchOperations.NewNoPlayTurn()
                : MatchOperations.NewTurn(playedHand.newCardPlacements, playedHand.hand, this._powerupUsages);
        MatchOperations.DoPlayerTurn(this, this._lastPlayedTurn, this._handScorer, this._powerupUsages);

        // TODO CSB: animations board.AnimateHand(playedHand, onAnimCompleteAction);
        this._powerupUsages = [];

        if (this._currentState != GameState.GameOver) {
            this._goToState(GameState.PlayerTurnComplete);
        }
    }

    private _updateObjectivesProgress(scores: { playerScore: number; opponentScore: number }): number {
        let numObjectivesComplete = 0;
        let objectivesProgress: number[][] = [];
        let objectivesPipsComplete: number[][] = [];
        this._config.objectives.forEach((objective, index) => {
            if (this._objectiveCompletionStatus[index] || objective.isObjectiveComplete(scores.playerScore, this._match.state.turns)) {
                numObjectivesComplete++;

                this._objectiveCompletionStatus[index] = true;
            }

            let subObjectiveProgress: number[] = [];
            let subObjectivePipsComplete: number[] = [];

            objective.objectiveDataList.forEach((param) => {
                const paramCompletion = param.isObjectiveComplete(scores.playerScore, this._match.state.turns);
                subObjectiveProgress.push(paramCompletion[1]);
                const pipsCompleted = param.getPipsCompleted(scores.playerScore, this._match.state.turns);
                subObjectivePipsComplete.push(pipsCompleted);
            });

            objectivesProgress.push(subObjectiveProgress);
            objectivesPipsComplete.push(subObjectivePipsComplete);
        });

        this.UIManager.HUD.UpdateGoalsUI(this._config.objectives, objectivesProgress, objectivesPipsComplete, scores.playerScore);
        return numObjectivesComplete;
    }

    private _checkForObjectiveUpdatesInPlayableHand(handClassification: HandClassification, cardList: CardPlacement[]) {
        this._config.objectives.forEach((objective, index) => {
            let objectiveAffectedByHand: boolean = true;

            for (const param of objective.objectiveDataList) {
                if (!param.willHandAffectObjective(handClassification, cardList)) {
                    objectiveAffectedByHand = false;
                    break;
                }
            }

            this.uiManager.HUD.goalsUI.goalEntries[index].SetGoalHighlighted(objectiveAffectedByHand);
        });
    }

    private _evaluateGameOver(): GameOverResult {
        const numObjectives = this._config.objectives.length;

        const scores = MatchOperations.CalculateScores(this._match, this._config);
        let numObjectivesComplete = this._updateObjectivesProgress(scores);

        if (numObjectives < 1) {
            // Freeplay; no objectives
            return GameOverResult.None;
        }

        this._log.trace(`_evaluateGameOver ${numObjectivesComplete}/${numObjectives}`);
        if (numObjectivesComplete === numObjectives) {
            return GameOverResult.Win;
        }

        //Check for failure by turn limit for primary objectives
        for (const param of this._config.objectives[0].objectiveDataList) {
            if (param.objectiveType === ObjectiveType.TurnLimit && this._match.state.turns.length > 0) {
                let turnLimitParam = param as TurnLimitObjectiveParams;

                let prevScore = scores.playerScore - this._match.state.turns[this._match.state.turns.length - 1].score;
                let prevTurns = [...this._match.state.turns];
                prevTurns.splice(prevTurns.length - 1, 1);

                if (
                    this._match.state.turns.length - turnLimitParam.turnLimit === 0 &&
                    !this._config.objectives[0].isObjectiveComplete(prevScore, prevTurns)
                ) {
                    return GameOverResult.Lose;
                }
            }
        }

        return GameOverResult.None;
    }

    private _buildGameOverEvent(): PuzzleCompleteEventData {
        const result = this._evaluateGameOver();
        const scores = MatchOperations.CalculateScores(this._match, this._config);
        const stats = MatchStatistics.calculateStatistics(this._match.state);

        let objectivesComplete = true;

        this._objectiveCompletionStatus.forEach((objectiveComplete: boolean) => {
            if (!objectiveComplete) {
                objectivesComplete = false;
            }
        });

        let objProgressList: ObjectiveProgressData[] = [];

        this._config.objectives.forEach((mainObjective, i) => {
            let objectiveProgressData = new ObjectiveProgressData();
            objectiveProgressData.GoalID = i;
            objectiveProgressData.GoalCompleted = mainObjective.isObjectiveComplete(scores.playerScore, this._match.state.turns) ? 1 : 0;
            //Assuming only one sub-objective, no compound objectives
            objectiveProgressData.ObjectiveType = mainObjective.objectiveDataList[0].objectiveType;
            objectiveProgressData.GoalProgression = mainObjective.objectiveDataList[0].isObjectiveComplete(
                scores.playerScore,
                this._match.state.turns
            )[1];

            objProgressList.push(objectiveProgressData);
        });
        return new PuzzleCompleteEventData(result, objectivesComplete, scores.playerScore, stats, objProgressList);
    }

    private _transitionToNextState() {
        const hasBot = this._config.hasBot;

        if (hasBot && this._lastNTurnsWereNoPlay(2)) {
            this._goToState(GameState.GameOver);
            return;
        } else if (!hasBot && this._lastNTurnsWereNoPlay(1)) {
            this._goToState(GameState.GameOver);
            return;
        }

        let nextState = GameState.PlayerTurn;
        if (hasBot) {
            nextState = this._gameModel.turn % 2 === 0 ? GameState.PlayerTurn : GameState.BotTurn;
        }

        this._goToState(nextState);
    }

    private _lastNTurnsWereNoPlay(numTurns: number) {
        if (this._match.state.turns.length < numTurns) {
            return false;
        }

        for (let turnIndexOffset = numTurns; turnIndexOffset > 0; --turnIndexOffset) {
            if (this._match.state.turns[this._match.state.turns.length - turnIndexOffset].type !== TurnType.NoPlay) {
                return false;
            }
        }

        return true;
    }

    // State: Initialization
    private _stateInitializationEnter() {
        this._log.debug('GameController: Entered Initialization state.');

        this._handScorer = new RankedHandScorer();
        this._gameModel = new GameModel();
        this._match = MatchOperations.NewGame(this._config, this._random);
        const board = MatchOperations.BuildBoardFromTurns(this._match.state, this._config);
        this._gameModel.updateModelFromState(this._match.state, board);

        // Gameboard init and event registration
        this.gameboard.init(
            this._gameModel.gameBoard,
            this._handScorer,
            this._config.objectives,
            this._appConfig.handTierList,
            this._jokerTransformer.bind(this)
        );
        this.gameboard.node.on(Gameboard.BoardEventHandReady, this._onHandReady, this);
        this.gameboard.node.on(Gameboard.BoardEventHandUnready, this._onHandUnready, this);
        this.gameboard.node.on(Gameboard.BoardEventTilesChanged, this._boardTilesChanged, this);
        this.gameboard.node.on(Gameboard.WorkingTileAddedEvent, this._onWorkingTileAdded, this);
        this.gameboard.node.on(Gameboard.WorkingTilesResetEvent, this._onWorkingTilesReset, this);

        this.gameboard.playerHand.node.on('hand-card-selected', () => {
            this.UIManager.HUD.onAnythingClicked();
            this._cancelDragInstructor();
        });
        this.gameboard.playerHand.node.on('board-card-selected', () => {
            this.UIManager.HUD.onAnythingClicked();
            this._cancelDragInstructor();
        });
        this.gameboard.playerHand.node.on('hand-card-clear-selection', () => {
            this.UIManager.HUD.onAnythingClicked();
            this._cancelDragInstructor();
        });
        this.gameboard.playerHand.getDragManager().node.on('drag-started', () => {
            this.UIManager.HUD.onAnythingClicked();
            this._cancelDragInstructor();
            this._isDraggingCard = true;
        });
        this.gameboard.playerHand.getDragManager().node.on('drag-ended', () => {
            this.UIManager.HUD.onAnythingClicked();
            this._cancelDragInstructor();
            this._isDraggingCard = false;
        });

        let onAnythingTouchedCallback = this.UIManager.HUD.onAnythingClicked.bind(this.UIManager.HUD);

        this.gameboard.OnAnythingTouchedEvent.subscribe(onAnythingTouchedCallback);

        // UI init and event registration
        this.UIManager.HUD.node.on(HUDController.UIEventHandPlayed, this._onPlayHand, this);
        this.UIManager.HUD.node.on(HUDController.UIEventSettings, this._openSettings, this);
        this.UIManager.HUD.node.on(HUDController.UIEventHowToPlay, this._openHowToPlay, this);
        this.UIManager.HUD.node.on(HUDController.UIEventQuitGame, this._onQuit, this);
        this.UIManager.HUD.node.on(HUDController.UIEventFinishLevel, this._showGiveUpView, this);
        this.UIManager.HUD.node.on(HUDController.UIEventSortHand, this._onSortPlayerHand, this);
        this.UIManager.HUD.node.on(HUDController.UIEventRecallCards, this._onCardsRecalled, this);
        this.UIManager.HUD.node.on(HUDController.UIEventPreparePowerup, this._onPreparePowerup, this);
        this.UIManager.HUD.node.on(HUDController.UIEventCancelPowerup, this._onPowerupPreparationCancelled, this);
        this.UIManager.HUD.node.on(PowerupEntry.OnPowerupSelectedEvent, this._onPowerupAppliedHandler, this);
        this.UIManager.HUD.node.on(PowerupEntry.OnPowerupUpsellEvent, this._onInGameUpsell, this);
        this.UIManager.node.on(UIManager.UIEventGameOverConfirmed, this._onGameOverConfirmed, this);

        for (let i = 0; i < this._config.objectives.length; i++) {
            this._objectiveCompletionStatus.push(false);
        }
        this.UIManager.HUD.InitGoalsUI(this._config.objectives, this._services.cardScrambleService);

        //TODO: Detect restricted powerups from the level and don't add those ones when we have that as an option in the level editor
        let powerupsToOffer: Powerup[] = [];
        powerupsToOffer.push(new ExtraServingsPowerup(this));
        powerupsToOffer.push(new RefirePowerup(this, this.refireGripSelector));
        powerupsToOffer.push(new CookingTheBooksPowerup(this, this.cookingTheBooksGripSelector));

        this.UIManager.HUD.InitPowerupsUI(
            this,
            this._services.cardScrambleService,
            this._services.UIOverlayService,
            this._services.requirementsService,
            powerupsToOffer,
            this._appConfig.itemConfig,
            this._services.tutorialService
        );

        let endgamePowerupsToOffer: Powerup[] = [];
        endgamePowerupsToOffer.push(new FreeDessertPowerup(this, this.freeDessertHandSelector));
        endgamePowerupsToOffer.push(new CleanDownPowerup(this, this.cleanDownPrefab));

        this.UIManager.HUD.setEndGamePowerups(endgamePowerupsToOffer);

        this.UIManager.HUD.setAppConfig(this._appConfig);

        this._onTeardownCallback = () => {
            this.gameboard.OnAnythingTouchedEvent.unsubscribe(onAnythingTouchedCallback);
        };
    }

    private _stateInitializationExit() {
        this._log.debug('GameController: Exiting Initialization state.');
    }

    private _stateInitializationUpdate(deltaTime: number) {
        this._transitionToNextState();
    }

    // State: PlayerTurn
    private _statePlayerTurnEnter() {
        this._log.debug('GameController: Entered Player Turn state.');
        this.playerHand.setHandInteractable(true);
        const numTilesPlayable = this.gameboard.onTurnStart(this._gameModel.playerHand.getCards().length);

        // If there are no plays, end the turn
        if (numTilesPlayable === 0) {
            this._log.info('GameController: No turns available; ending turn.');
            //Check if there are no less than 3 cards left in the player hand and none in the deck
            if (this._match.state.deck.length <= 0 && this._gameModel.playerHand.getCards().length < 3) {
                this._currentGameOverReason = 'No More Cards';
            } else {
                this._currentGameOverReason = 'No More Moves';
            }

            this.UIManager.HUD.enableGiveupButton(true, this._currentGameOverReason);
        } else {
            this.UIManager.HUD.enableGiveupButton(false);
        }

        this._turnTimer = 0;
        this._dragReminderTimer = 0;
    }

    private _statePlayerTurnExit() {
        this._log.debug('GameController: Exiting Player Turn state.');
    }

    private _cancelDragInstructor() {
        this._dragReminderTimer = 0;
        this.UIManager.HUD.stopCardDragInstructor();
    }

    private _statePlayerTurnUpdate(deltaTime: number) {
        this._turnTimer += deltaTime;

        if (!this.UIManager.HUD.isDragInstructorPlaying()) {
            this._dragReminderTimer += deltaTime;
            if (this._dragReminderEnabled && !this._isDraggingCard && this._dragReminderTimer > this._dragReminderTimeout) {
                this._dragReminderTimer = 0;
                this.showDragInstructor();
            }
        }
    }

    // State: PlayerTurnComplete
    private _statePlayerTurnCompleteEnter() {
        this._log.debug('GameController: Entered Player Turn Complete state.');

        let prevTurnIdx = this._match.state.turns.length > 0 ? this._match.state.turns.length - 1 : 0;
        //if the last turn was a FreeDessert extra turn, don't tick modifiers
        if (
            this._match.state.turns[prevTurnIdx].powerupUsages &&
            this._match.state.turns[prevTurnIdx].powerupUsages.find((powerupUsage) => powerupUsage.powerupType === PowerupType.FreeDessert)
        ) {
            return;
        }

        MatchOperations.TickModifiers(this, this._lastPlayedTurn.cardPlacements);
    }

    private _statePlayerTurnCompleteExit() {
        this._log.debug('GameController: Exiting Player Turn Complete state.');
    }

    private _statePlayerTurnCompleteUpdate(deltaTime: number) {
        if (this._giveUpView === null) {
            const evalStatus = this._evaluateGameOver();

            this._log.debug('GameOver EvalStatus: ' + evalStatus.toString());

            if (evalStatus === GameOverResult.None) {
                this._log.debug('Continuing...');
                this._transitionToNextState();
            } else if (evalStatus === GameOverResult.Win) {
                this._log.debug(`Ending Game`);
                this._goToState(GameState.GameOver);
            } else {
                this.UIManager.HUD.enableGiveupButton(false);
            }
        }
    }

    private async _showGiveUpView() {
        let powerupToOffer: Powerup;

        if (this._currentGameOverReason === 'No More Moves') {
            powerupToOffer = new CleanDownPowerup(this, this.cleanDownPrefab);

            //check if cleandown is valid
            let cleanDownPowerup = powerupToOffer as CleanDownPowerup;
            let tilesToRemove = cleanDownPowerup.getTilesToRemove(false);

            if (tilesToRemove.length < 1) {
                powerupToOffer = new Plus7CardsPowerup(this, this.UIManager.HUD.deckAnimation, this.UIManager.HUD.plus7Anim);
                this._currentGameOverReason = 'No More Cards';
            }
        } else if (this._currentGameOverReason === 'No More Cards') {
            powerupToOffer = new Plus7CardsPowerup(this, this.UIManager.HUD.deckAnimation, this.UIManager.HUD.plus7Anim);
        }

        let itemInfo = this._appConfig.itemConfig.getItemInfo(powerupToOffer.PowerupType);
        if (
            !this._services.requirementsService.checkRequirementsMet(itemInfo?.requirements) &&
            !this._services.cardScrambleService.cheatAllPowerups
        ) {
            this._log.debug(`Level Requirement For ${powerupToOffer.PowerupType} Not Met. Skipping GiveUpView And Ending Level`);
            this.forceGameOver(false);
            return;
        }

        this._giveUpView = await this.UIManager.showGiveUpView(
            this._services.cardScrambleService,
            this._services.UIOverlayService,
            this._services.requirementsService,
            this._config,
            this._services.tutorialService,
            this._appConfig.itemConfig,
            this._currentGameOverReason,
            powerupToOffer,
            this
        );

        this._giveUpView.node.on(GiveUpView.OnLevelFinishedEvent, this._onLevelFinished, this);
        this._giveUpView.node.on(GiveUpView.UIEventPreparePowerup, this._onPreparePowerup, this);
        this._giveUpView.node.on(GiveUpView.UIEventCancelPowerup, this._onPowerupPreparationCancelled, this);
        this._giveUpView.node.on(PowerupEntry.OnPowerupSelectedEvent, this._onPowerupAppliedHandler, this);
        this._giveUpView.node.on(GiveUpView.OnPowerupUpsell, this._onGiveUpUpsell, this);
    }

    private _onLevelFinished() {
        if (this._giveUpView) {
            this._giveUpView.node.off(GiveUpView.OnLevelFinishedEvent, this._onLevelFinished, this);
            this._giveUpView.node.off(GiveUpView.UIEventPreparePowerup, this._onPreparePowerup, this);
            this._giveUpView.node.off(GiveUpView.UIEventCancelPowerup, this._onPowerupPreparationCancelled, this);
            this._giveUpView.node.off(PowerupEntry.OnPowerupSelectedEvent, this._onPowerupAppliedHandler, this);
            this._giveUpView.node.off(GiveUpView.OnPowerupUpsell, this._onGiveUpUpsell, this);
            this._giveUpView = null;
        }
        this.forceGameOver(false);
    }

    // State: BotTurn
    private _stateBotTurnEnter() {
        this._log.debug('GameController: Entered Bot Turn state.');

        // TODO: bot logic

        const turn = MatchOperations.NewNoPlayTurn();
        MatchOperations.DoBotTurn(this, turn, this._handScorer);

        this._goToState(GameState.BotTurnComplete);
    }

    private _stateBotTurnExit() {
        this._log.debug('GameController: Exiting Bot Turn state.');
    }

    private _stateBotTurnUpdate(deltaTime: number) {}

    // State: BotTurnComplete
    private _stateBotTurnCompleteEnter() {
        this._log.debug('GameController: Entered Bot Turn Complete state.');
    }

    private _stateBotTurnCompleteExit() {
        this._log.debug('GameController: Exiting Bot Turn Complete state.');
    }

    private _stateBotTurnCompleteUpdate(deltaTime: number) {
        this._transitionToNextState();
    }

    // State: GameOver
    private _stateGameOverEnter() {
        this._log.debug('GameController: Entered Game Over state.');

        let evalStatus = this._evaluateGameOver();

        let receiveAwards = true;

        // For story mode, check if we've got rewards before and if all objectives are completed
        const isQuickPlay = this._puzzleIndex === -1 && this._config.objectives.length === 0;
        if (!isQuickPlay) {
            const isCompleted = this._services.cardScrambleService.isPuzzleCompletedById(this._puzzleId);
            if (isCompleted) {
                receiveAwards = false;
            }
            this._config.objectives.forEach((objective, index) => {
                if (!this._objectiveCompletionStatus[index]) {
                    receiveAwards = false;
                }
            });
        }

        this._doGameOver(evalStatus, receiveAwards, isQuickPlay);
    }

    private _stateGameOverExit() {
        this._log.debug('GameController: Exiting Game Over state.');
    }

    private async _doGameOver(gameStatus: GameOverResult, receiveAwards: boolean, isQuickPlay: boolean) {
        let starsEarned = 0;
        let coinsEarned = 0;

        let result: GameOverResult = gameStatus;

        const matchData = this._buildGameOverEvent();
        const totalHands = matchData.Stats.handsPlayed;
        const totalScore = matchData.Score;
        const highScore = this._services.cardScrambleService.getQuickPlaySaveData().highscore;

        const context: ResourceChangeContext = {
            type: 'level',
            levelId: this._puzzleId
        };

        // If the currency isn't client authoritative, the gain calls below will effectively no-op.
        // To find the new total predictively grab totals before the gains, and send the total + gain
        // to the game over screen.
        let totalStars = await this._services.cardScrambleService.getCurrencyBalance(Currency.Stars);
        let totalCoins = await this._services.cardScrambleService.getCurrencyBalance(Currency.Coins);

        if (isQuickPlay) {
            //Quickplay mode
            result = GameOverResult.Win; // Always win when quick play?
            coinsEarned = this._appConfig.puzzleRewardConfig.quickPlayCompletionAmount;
            await this._services.cardScrambleService.gainCurrency(Currency.Coins, coinsEarned, context);
        } else if (receiveAwards) {
            // Story mode - won
            starsEarned = this._appConfig.puzzleRewardConfig.storyWinStarAmount;
            await this._services.cardScrambleService.gainCurrency(Currency.Stars, starsEarned, context);

            coinsEarned = this._appConfig.puzzleRewardConfig.storyWinCoinAmount;
            await this._services.cardScrambleService.gainCurrency(Currency.Coins, coinsEarned, context);
        } else {
            // Story mode - lost
            coinsEarned = this._appConfig.puzzleRewardConfig.storyLossCoinAmount;
            await this._services.cardScrambleService.gainCurrency(Currency.Coins, coinsEarned, context);
        }

        this.UIManager.showGameOverScreen(
            result,
            starsEarned,
            coinsEarned,
            totalStars + starsEarned,
            totalCoins + coinsEarned,
            totalHands,
            totalScore,
            isQuickPlay,
            highScore,
            this._services,
            this._appConfig
        );
    }

    private _stateGameOverUpdate(deltaTime: number) {}

    private _openSettings() {
        this.UIManager.showSettings(this._appConfig, this._services, () => this._onQuit());
    }

    private _openHowToPlay() {
        this.UIManager.showHowToPlay(this._services);
    }

    private _openStore() {
        this.UIManager.showStore(this._appConfig, this._services.store, null, this._services.cardScrambleService);
    }

    private _openCoinStore() {
        this.UIManager.showStore(this._appConfig, this._services.store, ['coins'], this._services.cardScrambleService);
    }

    private _openEnergyStore() {
        this.UIManager.showStore(this._appConfig, this._services.store, ['energy'], this._services.cardScrambleService);
    }

    private _onWorkingTileAdded() {
        this.UIManager.HUD.TogglePowerupsFromCardsPlayed(false);
        this.UIManager.HUD.SetSortingButtonsEnabled(false);
    }

    private _onWorkingTilesReset() {
        this.UIManager.HUD.TogglePowerupsFromCardsPlayed(true);
        this.UIManager.HUD.SetSortingButtonsEnabled(true);
    }

    private async _jokerTransformer(card: Card, tileNode: Node, boardScale: number): Promise<Card> {
        return this.UIManager.showCardSelector(tileNode, boardScale);
    }
}
