import { _decorator, Animation, AnimationState, Component, instantiate, Layout, Node, Prefab, Size, UITransform, Vec2, Vec3 } from 'cc';
import { BoardHelpers, Card, CardPlacement, HandClassification, HandName, TileState } from '../core';
import { Event } from '../core/Event';
import { RankedHandScorer } from '../core/RankedHandScorer';
import { BoardModifierType } from '../core/enums/BoardModifierType';
import { CardinalDirection, Direction } from '../core/enums/Direction';
import { HandNameAndTier, HandTier } from '../core/enums/HandName';
import { ObjectiveType } from '../core/enums/ObjectiveType';
import { BoardModifier } from '../core/model/BoardModifier';
import { GameBoardModel } from '../core/model/GameBoardModel';
import { GameBoardTileModel } from '../core/model/GameBoardTileModel';
import { GameObjective } from '../core/model/GameObjective';
import { TilePlacedObjectiveParams } from '../core/model/ObjectiveParams';
import { PlayedHand } from '../core/model/PlayedHand';
import { logger } from '../logging';
import { BoardTile } from './BoardTile';
import { BoardTileBG } from './BoardTileBG';
import { GripCard } from './GripCard';
import { PlayedCard } from './PlayedCard';
import { PlayerHand } from './PlayerHand';
import { DragManager } from './draggables/DragManager';
import { IDraggable } from './draggables/IDraggable';
import { CardTransformer } from './ui/CardTransformer';
import { HandVisual } from './ui/HandVisual';

const { ccclass, property } = _decorator;

type JokerTransformer = (card: Card, node: Node, boardScale: number) => Promise<Card>;

@ccclass
export class Gameboard extends Component {
    // Events
    public static BoardEventHandReady = 'BoardEventHandReady';
    public static BoardEventHandUnready = 'BoardEventHandUnready';
    public static BoardEventTilesChanged = 'BoardEventTilesChanged';
    public static WorkingTileAddedEvent = 'WorkingTileAddedEvent';
    public static WorkingTilesResetEvent = 'WorkingTilesResetEvent';
    private static BOARD_HALF_DIMENSION = Math.floor(BoardHelpers.BOARD_DIMENSION / 2);
    private static BOARD_CENTER_INDEX = Gameboard.BOARD_HALF_DIMENSION * BoardHelpers.BOARD_DIMENSION + Gameboard.BOARD_HALF_DIMENSION;

    @property(Prefab)
    boardTileBGPrefab: Prefab | null = null;
    @property(Prefab)
    boardTilePrefab: Prefab | null = null;

    @property
    tileDimension: number = 48;

    @property(PlayerHand)
    playerHand: PlayerHand = null;

    @property(DragManager)
    dragManager: DragManager | null = null;

    @property(Layout)
    backgroundParent: Layout | null = null;

    @property(Layout)
    gridParent: Layout | null = null;

    @property(UITransform)
    tileAnimationParent: UITransform | null = null;

    @property(Node)
    cardParentNode: Node | null = null;

    @property(Prefab)
    handVisualPrefab: Prefab | null = null;

    @property(Prefab)
    handOutlinePrefab: Prefab | null = null;

    @property(Node)
    handOutlineParent: Node | null = null;

    @property
    boardMaxScale: number = 1;

    @property
    boardMinScale: number = 1;

    @property
    boardMinDimension: number = 5;

    @property
    boardMaxDimension: number = 13;

    // These are override for board dimensions that don't scale nicely with the linear scaling rules we do
    // between max and min board sizes.
    // These should ultimately be exposed so that they can be edited lockstep with the linear sliding rules.
    private readonly _boardSizeOverrides = [
        { height: 10, scale: 1.2 },
        { height: 11, scale: 1.1 }
    ];

    public OnAnythingTouchedEvent: Event = new Event();

    private _gameboardModel: GameBoardModel;
    private _handScorer: RankedHandScorer;
    private _boardTiles: BoardTile[] = [];
    private _midXIndex: number;
    private _midYIndex: number;
    private _selectedCard: GripCard;
    private _cardLimit: number;
    private _handReady: boolean;
    private _currentWorkingTiles: BoardTile[] = [];
    private _currentAnchoringTiles: BoardTile[] = [];
    private _restrictedTilesList: number[] = [];
    private _objectives: GameObjective[] = [];
    private _handTierList: HandNameAndTier[] = [];

    private _handOutlineInstance: Node | null = null;
    private _currentHandOrientation: Direction;

    private _jokerTransformer: JokerTransformer;

    private _log = logger.child('Gameboard');

    public get boardTiles() {
        return this._boardTiles;
    }

    public get currentWorkingTiles() {
        return this._currentWorkingTiles;
    }

    public get gameBoardModel() {
        return this._gameboardModel;
    }

    onLoad() {
        this._midXIndex = Math.floor(BoardHelpers.BOARD_DIMENSION / 2);
        this._midYIndex = Math.floor(BoardHelpers.BOARD_DIMENSION / 2);

        if (this.playerHand) {
            this.playerHand.node.on('hand-card-selected', this._onCardInGripSelected, this);
            this.playerHand.node.on('board-card-selected', this._onCardInGripSelected, this);
            this.playerHand.node.on('hand-card-clear-selection', this._onClearCardInGripSelection, this);
        }

        this.dragManager.setGameboard(this);
        this.playerHand.setGameboard(this, this.tileAnimationParent.node);
        this.playerHand.setDragManager(this.dragManager);
    }

    protected onDestroy(): void {
        if (this.playerHand && this.playerHand.node) {
            this.playerHand.node.off('hand-card-selected', this._onCardInGripSelected, this);
            this.playerHand.node.off('board-card-selected', this._onCardInGripSelected, this);
            this.playerHand.node.off('hand-card-clear-selection', this._onClearCardInGripSelection, this);
        }
    }

    start() {}

    update() {}

    public init(
        gameboardModel: GameBoardModel,
        handScorer: RankedHandScorer,
        objectives: GameObjective[],
        handTierList: HandNameAndTier[],
        jokerTransformer: JokerTransformer
    ) {
        this._gameboardModel = gameboardModel;
        this._handScorer = handScorer;
        this._objectives = objectives;
        this._handTierList = handTierList;
        this._jokerTransformer = jokerTransformer;

        const startX = 0 - this.tileDimension * this._midXIndex;
        const startY = 0 - this.tileDimension * this._midYIndex;

        // Push tiles into grid top down as this is how they are rendered, so start with y at boardDimensionHeight.
        for (let yIndex = BoardHelpers.BOARD_DIMENSION - 1; yIndex >= 0; yIndex--) {
            for (let xIndex = 0; xIndex < BoardHelpers.BOARD_DIMENSION; xIndex++) {
                const tileIndex = xIndex + yIndex * BoardHelpers.BOARD_DIMENSION;
                const instance = instantiate(this.boardTilePrefab);
                instance.on('board-tile-touch-start', this._onBoardTileTouchStart, this);
                instance.on(
                    'inactive-board-tile-touch-start',
                    () => {
                        this.OnAnythingTouchedEvent?.invoke();
                    },
                    this
                );
                instance.on('board-tile-touch-end', this._onBoardTileTouchEnd, this);
                instance.parent = this.gridParent.node;
                instance.name = `${instance.name}_${tileIndex}`;

                const boardTile: BoardTile = instance.getComponent(BoardTile);

                const boardTileModel = this._gameboardModel.tiles[tileIndex];
                boardTile.init(
                    boardTileModel,
                    tileIndex,
                    xIndex,
                    yIndex,
                    this._isCenter(xIndex, yIndex),
                    this.tileAnimationParent.node,
                    this.cardParentNode,
                    this.dragManager,
                    this
                );
                this._boardTiles.push(boardTile);
            }
        }

        // Sort board tiles so we index by grid index
        this._boardTiles.sort((t1, t2) => t1.index - t2.index);

        // Find board dimensions so we can scale board
        let xMin = BoardHelpers.BOARD_DIMENSION;
        let xMax = 0;
        let yMin = BoardHelpers.BOARD_DIMENSION;
        let yMax = 0;

        // Create background tiles that go one column larger than the playable grid on the left, right, top and bottom
        for (let yIndex = BoardHelpers.BOARD_DIMENSION; yIndex >= -1; yIndex--) {
            for (let xIndex = -1; xIndex < BoardHelpers.BOARD_DIMENSION + 1; xIndex++) {
                const instance = instantiate(this.boardTileBGPrefab);
                instance.parent = this.backgroundParent.node;
                const bgTile: BoardTileBG = instance.getComponent(BoardTileBG);

                const tileModel = this._getTileModel(xIndex, yIndex);
                if (tileModel && !tileModel.isNullTile()) {
                    xMin = Math.min(xMin, xIndex);
                    xMax = Math.max(xMax, xIndex);
                    yMin = Math.min(yMin, yIndex);
                    yMax = Math.max(yMax, yIndex);
                }

                // List of neighbour models starting top, top-right, right, etc going clockwise. Null if no neihgbour.
                const neighbours: GameBoardTileModel[] = [];
                neighbours.push(this._getTileModel(xIndex - 1, yIndex + 1)); // Top-left
                neighbours.push(this._getTileModel(xIndex, yIndex + 1)); // Top
                neighbours.push(this._getTileModel(xIndex + 1, yIndex + 1)); // Top-right
                neighbours.push(this._getTileModel(xIndex + 1, yIndex)); // Right
                neighbours.push(this._getTileModel(xIndex + 1, yIndex - 1)); // Bottom-right
                neighbours.push(this._getTileModel(xIndex, yIndex - 1)); // Bottom
                neighbours.push(this._getTileModel(xIndex - 1, yIndex - 1)); // Bottom-left
                neighbours.push(this._getTileModel(xIndex - 1, yIndex)); // Left
                neighbours.push(tileModel); // Self
                bgTile.init(xIndex, yIndex, this._generateTileBitFlags(neighbours));
            }
        }

        this._setBoardScale(xMin, xMax, yMin, yMax);
        this.resetBoardState();
    }

    private _setBoardScale(xMin: number, xMax: number, yMin: number, yMax: number) {
        const width = xMax - xMin + 1;
        const height = yMax - yMin + 1;
        const largestDim = Math.max(this.boardMinDimension, Math.min(this.boardMaxDimension, Math.max(width, height)));
        this._log.debug(`Board extents xmin ${xMin} xMax ${xMax} yMin ${yMin} yMax ${yMax}; largestDimension for scaling=${largestDim}`);

        const scaleOverride = this._boardSizeOverrides.find((entry) => entry.height === height);

        let scale: number;

        if (scaleOverride) {
            scale = scaleOverride.scale;
            this._log.debug(`Board override scaling = ${scale}`);
        } else {
            scale =
                this.boardMaxScale -
                ((largestDim - this.boardMinDimension) / (this.boardMaxDimension - this.boardMinDimension)) *
                    (this.boardMaxScale - this.boardMinScale);
            this._log.debug(`Board scaling = ${scale}`);
        }

        this.node.setScale(new Vec3(scale, scale, 1));
        this.tileAnimationParent.node.setScale(new Vec3(scale, scale, 1));
    }

    private _getTileModel(xIndex: number, yIndex: number): GameBoardTileModel {
        if (yIndex < 0 || xIndex < 0 || yIndex >= BoardHelpers.BOARD_DIMENSION || xIndex >= BoardHelpers.BOARD_DIMENSION) {
            return null;
        }

        const index = xIndex + yIndex * BoardHelpers.BOARD_DIMENSION;
        return this._gameboardModel.tiles[index];
    }

    private _generateTileBitFlags(neighbours: GameBoardTileModel[]): number {
        return neighbours.reduce((bitFlags, neighbour, index) => {
            if (neighbours && neighbour?.isNullTile() == false) {
                bitFlags |= 1 << index;
            }
            return bitFlags;
        }, 0);
    }

    public onTurnStart(cardLimit: number): number {
        this._cardLimit = cardLimit;
        return this.setInteractableTilesFromBoardState(cardLimit);
    }

    /// Finds all tiles that should be interactable based on the state of the current working tiles list.
    public setInteractableTilesFromWorkingTilesList(lastMutatedTile: BoardTile): void {
        // Cleanse any interactable status on all the tiles before we identify which tiles should now be interactable
        this.setAllTilesNonInteractable();

        // Hack: when there aren't any anchor tiles, avoid zooming in on a single working tile
        if (this._currentWorkingTiles.length === 1) {
            const workingTiles = [...this._currentWorkingTiles];
            workingTiles.push(
                this._boardTiles[Gameboard.BOARD_HALF_DIMENSION * BoardHelpers.BOARD_DIMENSION + Gameboard.BOARD_HALF_DIMENSION + 1]
            );
            this._zoomIn(workingTiles);
        } else {
            this._zoomIn(this._currentWorkingTiles);
        }

        this._currentWorkingTiles.forEach((tileSelectable) => {
            // If the tile is occupied, then the grid special has already been used for a previous hand
            if (tileSelectable.getTileModelState() === TileState.Occupied) {
                tileSelectable.setLockedVisual(true);
            } else {
                tileSelectable.setLockedVisual(false);
            }
        });

        if (this._currentWorkingTiles.length >= 5) {
            // Set all tiles that are unflipped to interactable
            this._currentWorkingTiles.forEach((tileSelectable) => {
                if (tileSelectable.getTileModelState() === TileState.Occupied_Unflipped) {
                    tileSelectable.setInteractable(true);
                }
            });

            this._handReady = true;
            const cardList: Card[] = [];
            const cardPlacements: CardPlacement[] = [];
            const boardModifiers: BoardModifier[] = [];

            this._currentWorkingTiles.forEach((tile) => {
                cardList.push(tile.getCard());
                cardPlacements.push(new CardPlacement(tile.index, tile.getCard()));

                // If the tile is occupied, then the grid special has already been used for a previous hand
                if (tile.getTileModelState() === TileState.Occupied) {
                    boardModifiers.push(new BoardModifier());
                } else {
                    boardModifiers.push(tile.getBoardModifier());
                }
            });

            const handClassification = this._handScorer.scoreHandWithBoardModifiers(cardList, boardModifiers);
            this._toggleHandOutliner(true, handClassification.handName);
            this.node.emit(Gameboard.BoardEventHandReady, handClassification, cardPlacements);

            return;
        }

        if (this._handReady) {
            this._handReady = false;
            this._toggleHandOutliner(false);
            this.node.emit(Gameboard.BoardEventHandUnready, false);
        }

        // Generate an array of bools based on board state
        const board = this._boardTiles.map(
            (tile) => tile.getTileModelState() === TileState.Occupied || tile.getTileModelState() === TileState.Occupied_Unflipped
        );

        const blockedCells = this._boardTiles.map((tile, index) => this._tileIsBlocked(index));
        const nPlaced = this._boardTiles.filter((tile) => tile.getTileModelState() === TileState.Occupied_Unflipped).length;

        // Determine the direction we're working in
        const direction = this._getTilePlacementDirection(lastMutatedTile);

        // Find all the valid placement candidates and make them interactable
        const candidates: number[] = [];

        this._currentWorkingTiles.forEach((tile) => {
            const lastPlay = {
                x: tile.xIndex,
                y: tile.yIndex
            };

            if (direction === Direction.None) {
                candidates.push(
                    ...BoardHelpers.findValidPlacementTilesAfterHavingAlreadyPlacedSomeCards(
                        board,
                        blockedCells,
                        lastPlay,
                        Direction.Horizontal,
                        this._cardLimit - nPlaced
                    )
                );
                candidates.push(
                    ...BoardHelpers.findValidPlacementTilesAfterHavingAlreadyPlacedSomeCards(
                        board,
                        blockedCells,
                        lastPlay,
                        Direction.Vertical,
                        this._cardLimit - nPlaced
                    )
                );
            } else {
                candidates.push(
                    ...BoardHelpers.findValidPlacementTilesAfterHavingAlreadyPlacedSomeCards(
                        board,
                        blockedCells,
                        lastPlay,
                        direction,
                        this._cardLimit - nPlaced
                    )
                );
            }
        });

        const currentWorkingTilesPlusAnchor = [...this._currentWorkingTiles];

        // Find the min/max index of all placed tiles and disallow candidate placements that make the hand too large
        let minIndex = BoardHelpers.BOARD_DIMENSION;
        let maxIndex = 0;
        let minTile: BoardTile | null = null;

        currentWorkingTilesPlusAnchor.forEach((tile) => {
            const index = direction === Direction.Horizontal ? tile.xIndex : tile.yIndex;
            minIndex = Math.min(minIndex, index);
            maxIndex = Math.max(maxIndex, index);
            if (index === minIndex) {
                minTile = tile;
            }
        });

        // Add candidates between any two currently placed tiles
        if (minTile) {
            const step = direction === Direction.Horizontal ? 1 : BoardHelpers.BOARD_DIMENSION;
            for (let i = 0; i < maxIndex - minIndex; ++i) {
                const idx = i * step + this._getTileIndexFromCoordinates(minTile.xIndex, minTile.yIndex);
                candidates.push(idx);
            }
        }

        candidates.forEach((candidate) => {
            const index = direction === Direction.Horizontal ? this._boardTiles[candidate].xIndex : this._boardTiles[candidate].yIndex;
            if (index - minIndex > 4 || maxIndex - index > 4) {
                return;
            }

            this.trySetTileInteractable(candidate);
        });

        // Set all tiles that are unflipped to interactable
        this._currentWorkingTiles.forEach((tileSelectable) => {
            if (tileSelectable.getTileModelState() === TileState.Occupied_Unflipped) {
                tileSelectable.setInteractable(true);
            }
        });
    }

    public updateVisuals() {
        this.resetBoardState();

        let highlightedTiles = this.getHighlightIndicesFromObjectives();

        this._boardTiles.forEach((tile) => {
            tile.updateVisuals(this);

            if (highlightedTiles.includes(tile.index)) {
                tile.setHighlighted(true);
            } else {
                tile.setHighlighted(false);
            }
        });
    }

    private getHighlightIndicesFromObjectives(): number[] {
        let indices: number[] = [];

        this._objectives.forEach((objective) => {
            objective.objectiveDataList.forEach((param) => {
                if (param.objectiveType === ObjectiveType.TilePlacement) {
                    let tileParam = param as TilePlacedObjectiveParams;

                    tileParam.tileIndices.forEach((tileIndex) => {
                        indices.push(tileIndex);
                    });
                }
            });
        });

        return indices;
    }

    // When removing tiles; there are cases where we need to clean up some anchoring tiles we've
    // identified. If a hand crosses multiple anchored tiles, then when removing an adjacent working
    // tile to an anchor should remove that anchor iff there is another anchor already and no remaining
    // working tiles are adjacent to the anchor.
    private _cleanupAnchoringTiles() {
        // Only one anchor? Don't remove anything
        if (this._currentAnchoringTiles.length <= 1) {
            return;
        }

        const getCoords = (index: number) => this._getCoordinatesFromIndex(index);

        this._currentAnchoringTiles = this._currentAnchoringTiles.filter((anchorTile) => {
            const anchorCoords = getCoords(anchorTile.index);
            const isAdjacentToWorking = this._currentWorkingTiles.some((workingTile) => {
                const workingCoords = getCoords(workingTile.index);
                const dx = Math.abs(anchorCoords.x - workingCoords.x);
                const dy = Math.abs(anchorCoords.y - workingCoords.y);
                return dx + dy === 1;
            });

            if (!isAdjacentToWorking) {
                // Also remove from working tiles
                const workingIndex = this._currentWorkingTiles.indexOf(anchorTile);
                if (workingIndex !== -1) {
                    this._currentWorkingTiles.splice(workingIndex, 1);
                }
                return false; // remove from anchoring
            }

            return true; // keep anchor
        });
    }

    public _onTileMutated(x: number, y: number): void {
        const currentIndex = this._getTileIndexFromCoordinates(x, y);
        const lastMutatedTile = this._boardTiles[currentIndex];

        if (this._currentWorkingTiles.indexOf(lastMutatedTile) !== -1) {
            if (lastMutatedTile.getTileModelState() === TileState.Empty) {
                this._currentWorkingTiles = this._currentWorkingTiles.filter((tile) => tile !== lastMutatedTile);

                if (this._currentWorkingTiles.every((tile) => this._currentAnchoringTiles.indexOf(tile) !== -1)) {
                    // The player has picked up all of their cards and the state of the interactable tiles needs to be reset
                    this.resetBoardState();
                    this._toggleHandOutliner(false);
                } else {
                    // The player has only picked up one card, re-evaluate interactable tiles based on surrounding cards
                    const anchoringPre = this._currentAnchoringTiles.map((t) => t.index).join(',');
                    this._cleanupAnchoringTiles();
                    const anchoringPost = this._currentAnchoringTiles.map((t) => t.index).join(',');
                    this._log.debug(`Anchor tiles: ${anchoringPre} -> ${anchoringPost}`);
                    this.setInteractableTilesFromWorkingTilesList(lastMutatedTile);
                }
            } else if (lastMutatedTile.getTileModelState() === TileState.Occupied_Unflipped) {
                this.setInteractableTilesFromWorkingTilesList(lastMutatedTile);
            }
        } else {
            if (lastMutatedTile.getTileModelState() === TileState.Occupied_Unflipped) {
                this._currentWorkingTiles.push(lastMutatedTile);
                this.node.emit(Gameboard.WorkingTileAddedEvent);

                // Check all directions for anchoring tiles...
                this._tryAddToListOfAnchoringTiles(currentIndex, CardinalDirection.West);
                this._tryAddToListOfAnchoringTiles(currentIndex, CardinalDirection.East);
                this._tryAddToListOfAnchoringTiles(currentIndex, CardinalDirection.South);
                this._tryAddToListOfAnchoringTiles(currentIndex, CardinalDirection.North);
            }

            this.setInteractableTilesFromWorkingTilesList(lastMutatedTile);
        }

        this.node.emit(Gameboard.BoardEventTilesChanged, this._currentWorkingTiles.length);
    }

    // TODO CSB:
    // private void _zoomIn()
    // {
    //     if (_isZoomedIn)
    //     {
    //         return;
    //     }
    //
    //     _zoomOutTimer = 0.0f;
    //     _isZoomedIn = true;
    //
    //     var targetScale = _initialTileRootScale * _zoomScale;
    //     targetPos *= _zoomScale;
    //
    //     // Clamp the position
    //     targetPos.x = Mathf.Clamp(targetPos.x, _tileRootZoomBounds.xMin, _tileRootZoomBounds.xMax);
    //     targetPos.y = Mathf.Clamp(targetPos.y, _tileRootZoomBounds.yMin, _tileRootZoomBounds.yMax);
    //
    //     // Tween
    //     _tileRoot.LeanScale(targetScale, _zoomDuration).setEaseOutQuad();
    //     _tileRoot.LeanMoveLocal(targetPos, _zoomDuration).setEaseOutQuad();
    // }

    public async playHand(handClassification: HandClassification): Promise<PlayedHand> {
        return new Promise((resolve, reject) => {
            try {
                if (this._currentWorkingTiles.length !== 5) {
                    throw new Error('A hand was played with more/less than five Working Tiles accounted for.');
                }

                //play hand VFX
                const handVisualInstance = instantiate(this.handVisualPrefab);
                handVisualInstance.parent = this.tileAnimationParent.node;

                let sortedTiles = [...this._currentWorkingTiles];
                sortedTiles.sort((a, b) => a.index - b.index);

                handVisualInstance.setWorldPosition(sortedTiles[2].node.getWorldPosition());
                let handDirection = this._getCurrentHandDirection(sortedTiles);

                const cardsInHand: Card[] = [];

                sortedTiles.forEach((tile) => {
                    let card = tile.getCard();

                    if (card) {
                        cardsInHand.push(card);
                    }
                });

                if (handDirection === Direction.Vertical) {
                    cardsInHand.reverse();
                }

                const handNameAndTier = this._handTierList.find((hand) => hand.HandName === handClassification.handName);

                if (!handNameAndTier) {
                    this._log.error('Gameboard: Cannot find tier for given Hand');
                    return;
                }

                const handTier: HandTier = handNameAndTier.Tier;
                const handVisualComponent = handVisualInstance.getComponent(HandVisual);
                handVisualComponent.setCards(cardsInHand);
                handVisualComponent.playHandAnim(handDirection === Direction.Horizontal, true, handTier);

                this._handOutlineInstance.parent = handVisualInstance;
                this._handOutlineInstance.setSiblingIndex(0);
                this._handOutlineInstance.setPosition(Vec3.ZERO);
                let handOutlineAnim = this._handOutlineInstance.getComponentInChildren(Animation);
                const outlineClips = handOutlineAnim.clips;

                switch (handTier) {
                    case HandTier.Low:
                        handOutlineAnim.play(outlineClips[3].name);
                        break;
                    case HandTier.Mid:
                        handOutlineAnim.play(outlineClips[7].name);
                        break;
                    case HandTier.High:
                        handOutlineAnim.play(outlineClips[11].name);
                        break;
                }

                this._gameboardModel.lastPlayedHand = this._currentWorkingTiles.map((tile) => tile.getCard()).join(' ');

                const placedCards: CardPlacement[] = [];
                this._currentWorkingTiles.forEach((tile) => {
                    if (tile.getTileModelState() === TileState.Occupied_Unflipped) {
                        placedCards.push(this._cardPlacementFromTile(tile));
                        tile.lockCardInPlace();
                    }
                });

                const board = this._boardTiles.map((tile) => tile.getTileModelState() === TileState.Occupied);

                const playedHand = new PlayedHand(
                    placedCards,
                    this._currentWorkingTiles.map((tile) => this._cardPlacementFromTile(tile)),
                    handClassification
                );

                this.clearTileLists();
                this._handReady = false;
                this.node.emit(Gameboard.BoardEventHandUnready, true);
                this.setAllTilesNonInteractable();

                handVisualComponent.node.on(
                    HandVisual.OnAnimCompleteEvent,
                    () => {
                        resolve(playedHand);
                    },
                    this
                );
            } catch (error) {
                this._log.error('Error in Gameboard.playHand:', error);
                reject(error);
            }
        });
    }

    public getPlayableTileWorldPosition(tileIndex: number = -1): Vec3 | null {
        let targetTile: BoardTile = null;

        // Specific tile
        if (tileIndex >= 0 && tileIndex < this._boardTiles.length) {
            targetTile = this._boardTiles[tileIndex];
        } else {
            // Pick randomly from playable tiles
            const playableTiles: BoardTile[] = [];
            this._boardTiles.forEach((tile) => {
                if (tile.getInteractable() && tile.getTileModelState() === TileState.Empty) {
                    playableTiles.push(tile);
                }
            });

            if (playableTiles.length < 1) {
                return null;
            }

            // Pick a random tile
            const randTile = Math.random();
            const index = Math.floor(randTile * playableTiles.length);
            targetTile = playableTiles[index];
        }

        if (!targetTile) {
            return null;
        }

        return targetTile.node.getWorldPosition();
    }

    private _toggleHandOutliner(isOn: boolean, handName: HandName = HandName.Invalid) {
        if (isOn && !this._handOutlineInstance) {
            this._handOutlineInstance = instantiate(this.handOutlinePrefab);
            this._handOutlineInstance.parent = this.handOutlineParent;

            let sortedTiles = [...this._currentWorkingTiles];
            sortedTiles.sort((a, b) => a.index - b.index);

            this._handOutlineInstance.setWorldPosition(sortedTiles[2].node.getWorldPosition());
            this._currentHandOrientation = this._getCurrentHandDirection(sortedTiles);
            let outlineTransform = this._handOutlineInstance.getComponent(UITransform);

            //move cards in hand to front layer
            sortedTiles.forEach((tile) => {
                let playedCard = tile.placedCard;
                if (playedCard) {
                    let currentWorldPos = playedCard.node.getWorldPosition();
                    playedCard.node.parent = this.cardParentNode;
                    playedCard.node.setWorldPosition(currentWorldPos);
                }
            });

            if (this._currentHandOrientation === Direction.Horizontal) {
                outlineTransform.setContentSize(new Size(outlineTransform.contentSize.x * 5, outlineTransform.contentSize.y));
            } else {
                outlineTransform.setContentSize(new Size(outlineTransform.contentSize.x, outlineTransform.contentSize.y * 5));
            }

            let handOutlineAnim = this._handOutlineInstance.getComponentInChildren(Animation);
            const clips = handOutlineAnim.clips;

            handOutlineAnim.on(Animation.EventType.FINISHED, this._onAnimationComplete, this);

            const handTier: HandTier = this._handTierList.find((hand) => hand.HandName == handName).Tier;

            switch (handTier) {
                case HandTier.Low:
                    handOutlineAnim.play(clips[0].name);
                    break;
                case HandTier.Mid:
                    handOutlineAnim.play(clips[4].name);
                    break;
                case HandTier.High:
                    handOutlineAnim.play(clips[8].name);
                    break;
            }
        } else if (!isOn && this._handOutlineInstance) {
            this._handOutlineInstance.getComponentInChildren(Animation).off(Animation.EventType.FINISHED, this._onAnimationComplete, this);
            this._handOutlineInstance.destroy();
            this._handOutlineInstance = null;

            for (const child of this.cardParentNode.children) {
                const playedCard = child.getComponent(PlayedCard);
                playedCard.resetParentToGrid();
            }
        }
    }

    private _onAnimationComplete(type: Animation.EventType, state: AnimationState) {
        let handOutlineAnim = this._handOutlineInstance.getComponentInChildren(Animation);

        if (handOutlineAnim) {
            const clips = handOutlineAnim.clips;

            switch (state.clip.name) {
                case clips[0].name:
                    //low tier ready anim, transition to idle state here

                    if (this._currentHandOrientation === Direction.Horizontal) {
                        handOutlineAnim.play(clips[1].name);
                    } else {
                        handOutlineAnim.play(clips[2].name);
                    }

                    break;

                case clips[4].name:
                    //mid tier ready anim, transition to idle state here

                    if (this._currentHandOrientation === Direction.Horizontal) {
                        handOutlineAnim.play(clips[5].name);
                    } else {
                        handOutlineAnim.play(clips[6].name);
                    }

                    break;

                case clips[8].name:
                    //high tier ready anim, transition to idle state here

                    if (this._currentHandOrientation === Direction.Horizontal) {
                        handOutlineAnim.play(clips[9].name);
                    } else {
                        handOutlineAnim.play(clips[10].name);
                    }

                    break;

                case clips[3].name:
                    //play anim complete, turn off outliner
                    this._toggleHandOutliner(false);

                    break;

                case clips[7].name:
                    //play anim complete, turn off outliner
                    this._toggleHandOutliner(false);
                    break;

                case clips[11].name:
                    //play anim complete, turn off outliner
                    this._toggleHandOutliner(false);
                    break;
            }
        }
    }

    private _getCurrentHandDirection(tiles: BoardTile[]): Direction {
        if (tiles.length < 5) {
            this._log.warn('Gameboard: Hand must have 5 cards to check direction. Current Length = ' + tiles.length);
            return;
        }

        let indexToCheck = tiles[2].index;

        if (tiles[1].index === indexToCheck - 1 || tiles[3].index === indexToCheck + 1) {
            return Direction.Horizontal;
        } else {
            return Direction.Vertical;
        }
    }

    private clearTileLists() {
        this._currentWorkingTiles = [];
        this._currentAnchoringTiles = [];

        this.node.emit(Gameboard.WorkingTilesResetEvent);
    }

    private _zoomIn(tiles: BoardTile[]) {
        if (tiles == null || tiles.length < 1) {
            return;
        }

        // TODO CSB:
        // Average the position of focus tiles
        // var targetPos = Vector3.zero;
        // foreach (var tile in tiles)
        // {
        //     targetPos -= tile.transform.localPosition;
        // }
        // targetPos /= tiles.Count;
        //
        // this._zoomIn(targetPos);
    }

    public setRestrictedTilesForTurn(restrictedTiles: number[]) {
        this._restrictedTilesList = restrictedTiles;
    }

    private resetBoardState() {
        this.clearTileLists();

        this.setInteractableTilesFromBoardState(this._cardLimit);
    }

    // Sets the tile at a given index to interactable if it's not in an Occupied state
    private trySetTileInteractable(index: number): boolean {
        // Check if the tile is restricted (used mainly by FTUE levels to force play in specific grid squares)
        if (this._restrictedTilesList && this._restrictedTilesList.length > 0) {
            if (this._restrictedTilesList.includes(index)) {
                return false;
            }
        }

        const gameboardTileModel = this._gameboardModel.tiles[index];
        const tileModifier = gameboardTileModel?.boardModifierList?.[0];
        if (
            tileModifier?.type === BoardModifierType.BreakableWall ||
            tileModifier?.type === BoardModifierType.Null ||
            tileModifier?.type === BoardModifierType.BurnedTile
        ) {
            return false;
        }

        const playedCardOnTile = this._boardTiles[index].placedCard;

        if (playedCardOnTile && playedCardOnTile.IsBurnt) {
            return true;
        }

        // Check if the tile at the given index is in the Empty state
        if (this._boardTiles[index].getTileModelState() === TileState.Empty) {
            this._boardTiles[index].setInteractable(true);
            return true;
        }

        return false;
    }

    private setAllTilesNonInteractable(): void {
        this._boardTiles.forEach((tile) => {
            tile.setInteractable(false);
        });
    }

    private _tryAddToListOfAnchoringTiles(baseIndex: number, direction: CardinalDirection) {
        let index: number;
        let coords = this._getCoordinatesFromIndex(baseIndex);

        if (coords.x > 0 && direction === CardinalDirection.West) {
            index = baseIndex - 1;
        } else if (coords.x < BoardHelpers.BOARD_DIMENSION - 1 && direction === CardinalDirection.East) {
            index = baseIndex + 1;
        } else if (coords.y > 0 && direction === CardinalDirection.South) {
            index = baseIndex - BoardHelpers.BOARD_DIMENSION;
        } else if (coords.y < BoardHelpers.BOARD_DIMENSION - 1 && direction === CardinalDirection.North) {
            index = baseIndex + BoardHelpers.BOARD_DIMENSION;
        } else {
            return;
        }

        if (
            this._boardTiles[index].getTileModelState() == TileState.Occupied &&
            this._currentAnchoringTiles.indexOf(this._boardTiles[index]) === -1
        ) {
            this._currentAnchoringTiles.push(this._boardTiles[index]);
            this._currentWorkingTiles.push(this._boardTiles[index]);

            this._tryAddToListOfAnchoringTiles(index, direction);
        }
    }

    private _tileIsOccupied(tile: BoardTile) {
        return tile.getTileModelState() === TileState.Occupied;
    }

    private _tileIsBlocked(index: number) {
        const gameboardTileModel = this._gameboardModel.tiles[index];
        const tileModifier = gameboardTileModel?.boardModifierList?.[0];
        if (
            tileModifier?.type === BoardModifierType.BreakableWall ||
            tileModifier?.type === BoardModifierType.Null ||
            tileModifier?.type === BoardModifierType.BurnedTile
        ) {
            return true;
        }

        const playedCardOnTile = this._boardTiles[index].placedCard;

        if (playedCardOnTile && playedCardOnTile.IsBurnt) {
            return true;
        }
    }

    public setInteractableTilesFromBoardState(cardLimit: number): number {
        let count = 0;

        // Cleanse any interactable status on all the tiles before we identify which tiles should now be interactable
        this.setAllTilesNonInteractable();

        // Generate an array of booleans based on board state
        const board = this._boardTiles.map((tile) => this._tileIsOccupied(tile));
        const blockedCells = this._boardTiles.map((_tile, index) => this._tileIsBlocked(index));

        // Find all the valid placement candidates and make them interactable
        const candidates = BoardHelpers.findValidPlacementTilesForFirstCardOfHandWithLimit(board, blockedCells, cardLimit);

        // If there are no candidates AND no played cards, try to set the center tile to playable
        const hasPlayedCards = board.some((value) => value === true);
        if (!hasPlayedCards && candidates.length === 0) {
            candidates.push(Gameboard.BOARD_CENTER_INDEX);
        }

        candidates.forEach((candidate) => {
            if (this.trySetTileInteractable(candidate)) {
                count++;
            }
        });

        return count;
    }

    // Returns the direction of the hand played so far to determine which board grid tiles are placeable.
    private _getTilePlacementDirection(lastMutatedTile: BoardTile): Direction {
        let direction = Direction.None;

        // If playing off a current anchor, compare the coords of the last tile against the first anchor tile
        if (this._currentAnchoringTiles.length > 0) {
            if (this._currentAnchoringTiles[0].yIndex === lastMutatedTile.yIndex) {
                direction = Direction.Horizontal;
            } else if (this._currentAnchoringTiles[0].xIndex === lastMutatedTile.xIndex) {
                direction = Direction.Vertical;
            } else {
                this._log.error('The working tile and anchoring tiles are not axis aligned.');
                throw new Error('InvalidOperationException');
            }
        }
        // If we don't have any anchors (a scenario without an anchor) compare the current working tiles to one another if we have enough tiles down.
        else if (this._currentWorkingTiles.length > 1) {
            if (this._currentWorkingTiles[0].yIndex === this._currentWorkingTiles[1].yIndex) {
                direction = Direction.Horizontal;
            } else if (this._currentWorkingTiles[0].xIndex === this._currentWorkingTiles[1].xIndex) {
                direction = Direction.Vertical;
            } else {
                this._log.error('The working tile and anchoring tiles are not axis aligned.');
                throw new Error('InvalidOperationException');
            }
        }
        // If we don't have any anchors (a scenario without an anchor) and only one tile, then if it's not the center tile, compare it to the middle tile.
        else if (
            this._currentWorkingTiles.length === 1 &&
            (this._currentWorkingTiles[0].xIndex !== Gameboard.BOARD_HALF_DIMENSION ||
                this._currentWorkingTiles[0].yIndex !== Gameboard.BOARD_HALF_DIMENSION)
        ) {
            if (this._currentWorkingTiles[0].yIndex === Gameboard.BOARD_HALF_DIMENSION) {
                direction = Direction.Horizontal;
            } else if (this._currentWorkingTiles[0].xIndex === Gameboard.BOARD_HALF_DIMENSION) {
                direction = Direction.Vertical;
            } else {
                this._log.error('The working tile and anchoring tiles are not axis aligned.');
                throw new Error('InvalidOperationException');
            }
        }

        return direction;
    }

    public onBoardTileTapComplete(tappedCard: GripCard, boardTile: BoardTile) {
        if (this._selectedCard == null) {
            this.playerHand.ClaimDraggable(tappedCard, null);
            tappedCard.setSelected(false);
        } else {
            const currentCardToPlay: Card = this._selectedCard?.getCard();
            if (currentCardToPlay == Card.Invalid) {
                this._log.error('Error: Attempting to play an invalid card');
                return;
            }

            this._selectedCard.tweenPosition(boardTile.node.getWorldPosition(), () => {
                this._cardPlayed(this._selectedCard, tappedCard, boardTile, 'board-tile-touch-end');
                this._onClearCardInGripSelection();
            });
        }
    }

    private _onBoardTileTouchStart(boardTile: BoardTile) {
        this.OnAnythingTouchedEvent?.invoke();
        if (boardTile.getTileModelState() == TileState.Occupied_Unflipped) {
            let cardOnTile = boardTile.getComponentInChildren(GripCard);

            if (cardOnTile !== null) {
                boardTile.pickUpCard();
                this._onTileMutated(boardTile.xIndex, boardTile.yIndex);
                cardOnTile.node.parent = this.tileAnimationParent.node;
                cardOnTile.node.setWorldPosition(boardTile.node.getWorldPosition());
                cardOnTile.toggleVisuals(true);
                cardOnTile.beginHoldFromBoard(boardTile);

                return;
            }
        } else if (boardTile.getTileModelState() == TileState.Empty && this._selectedCard != null) {
            const currentCardToPlay: Card = this._selectedCard?.getCard();
            if (currentCardToPlay == Card.Invalid) {
                this._log.error('Error: Attempting to play an invalid card');
                return;
            }

            this._selectedCard.tweenPosition(boardTile.node.getWorldPosition(), () => {
                this._cardPlayed(this._selectedCard, null, boardTile, null);
                this._onClearCardInGripSelection();
            });
        } else {
            return;
        }
    }

    private _onBoardTileTouchEnd(boardTile: BoardTile, draggableToPlace: IDraggable) {
        const currentCardToPlay: Card = this._selectedCard?.getCard();
        if (currentCardToPlay == Card.Invalid) {
            this._log.error('Error: Attempting to play an invalid card');
            return;
        }

        const eventString = boardTile.getTileModelState() === TileState.Empty ? null : 'board-tile-touch-end';

        //manually place another card that is not the selected card onto this tile
        if (draggableToPlace !== null) {
            const gripCardToPlay: GripCard = draggableToPlace.GetNode().getComponent(GripCard);
            this._cardPlayed(gripCardToPlay, null, boardTile, eventString);
        } else if (this._selectedCard != null) {
            this._cardPlayed(this._selectedCard, null, boardTile, eventString);
        }

        this._onClearCardInGripSelection();
    }

    private _cardPlayed(cardPlayed: GripCard, cardReturned: GripCard, boardTile: BoardTile, eventString: string) {
        const isJoker = cardPlayed?.getCard()?.isJoker() ?? false;
        if (!isJoker) {
            let cardOnTile: GripCard = cardReturned;
            if (!cardOnTile && boardTile.getTileModelState() === TileState.Occupied_Unflipped) {
                cardOnTile = boardTile.getComponentInChildren(GripCard);
                boardTile.pickUpCard();
                cardOnTile.setSelected(false);
                cardOnTile.toggleVisuals(true);
            }

            this.playerHand.cardPlayed(cardPlayed, cardOnTile, boardTile, eventString);
            return;
        }

        // Transform the card first
        cardPlayed.toggleVisuals(false);
        cardPlayed.node.worldPosition = boardTile.node.getWorldPosition();
        this._jokerTransformer(cardPlayed.getCard(), boardTile.node, this.node.getScale().x).then((card) => {
            if (!card) {
                this.playerHand.ClaimDraggable(cardPlayed, eventString);
                cardPlayed.toggleVisuals(true);
                return;
            }

            let cardOnTile: GripCard = cardReturned;
            if (!cardOnTile && boardTile.getTileModelState() === TileState.Occupied_Unflipped) {
                cardOnTile = boardTile.getComponentInChildren(GripCard);
                boardTile.pickUpCard();
                cardOnTile.setSelected(false);
                cardOnTile.toggleVisuals(true);
            }
            this.playerHand.cardPlayed(cardPlayed, cardOnTile, boardTile, eventString, card);
        });
    }

    public recallCardsToGrip() {
        let cardsToReturn: GripCard[] = [];

        this._currentWorkingTiles.forEach((tile) => {
            if (tile.getTileModelState() === TileState.Occupied_Unflipped) {
                const cardOnTile = tile.getComponentInChildren(GripCard);
                tile.pickUpCard();

                cardOnTile.setSelected(false);
                cardOnTile.toggleVisuals(true);

                cardsToReturn.push(cardOnTile);
            }
        });

        this._toggleHandOutliner(false);
        this.resetBoardState();
        this._handReady = false;

        this.node.emit(Gameboard.BoardEventHandUnready, false);
        this.node.emit(Gameboard.BoardEventTilesChanged, this._currentWorkingTiles.length);

        this.playerHand.returnCardsToHand(cardsToReturn);
    }

    //For CleanDown Powerup Only
    public removeCardsPlayedOnTiles(tilesToRemove: number[], currentIndex: number = 0, onComplete: () => void) {
        if (tilesToRemove.length < 1) {
            this._log.warn('Trying to remove 0 cards, skipping execution');
            this.setInteractableTilesFromBoardState(this._cardLimit);
            this.playerHand.setHandInteractable(true);
            this.playerHand.blockPlayerInteraction(false);

            onComplete();
            return;
        }

        let playedCard = this._boardTiles[tilesToRemove[currentIndex]].placedCard;
        this.playerHand.setHandInteractable(false);
        this.playerHand.blockPlayerInteraction(true);

        if (playedCard) {
            let cardTransformer = playedCard.node.getComponentInChildren(CardTransformer);
            cardTransformer.playCleanDownActivateAnim(true);

            cardTransformer.cardAnimator.once(Animation.EventType.FINISHED, () => {
                let xIndex = this._boardTiles[tilesToRemove[currentIndex]].xIndex;
                let yIndex = this._boardTiles[tilesToRemove[currentIndex]].yIndex;

                this._boardTiles[tilesToRemove[currentIndex]].pickUpCard();
                this._onTileMutated(xIndex, yIndex);

                if (currentIndex >= tilesToRemove.length - 1) {
                    this.setInteractableTilesFromBoardState(this._cardLimit);
                    this.playerHand.setHandInteractable(true);
                    this.playerHand.blockPlayerInteraction(false);

                    onComplete();
                }
            });

            if (currentIndex + 1 < tilesToRemove.length) {
                this.scheduleOnce(() => {
                    this.removeCardsPlayedOnTiles(tilesToRemove, currentIndex + 1, onComplete);
                }, 0.1);
            }
        }
    }

    private _onCardInGripSelected(cardTile: GripCard) {
        this._selectedCard = cardTile;
        this._boardTiles.forEach((tile) => {
            tile.setEligbleForDropOnTap(true);
        });
    }

    public clearCardInGripSelection() {
        this._onClearCardInGripSelection();
    }

    private _onClearCardInGripSelection() {
        this._selectedCard = null;
        this._boardTiles.forEach((tile) => {
            tile.setEligbleForDropOnTap(false);
        });
    }

    private _isCenter(xIndex: number, yIndex: number): boolean {
        return this._midXIndex == xIndex && this._midYIndex == yIndex;
    }

    private _getTileIndexFromCoordinates(x: number, y: number): number {
        return x + BoardHelpers.BOARD_DIMENSION * y;
    }

    private _getCoordinatesFromIndex(index: number): Vec2 {
        let y = Math.floor(index / BoardHelpers.BOARD_DIMENSION);
        let x = index % BoardHelpers.BOARD_DIMENSION;

        return new Vec2(x, y);
    }

    private _cardPlacementFromTile(tile: BoardTile): CardPlacement {
        if (tile.getTileModelState() == TileState.Empty) {
            this._log.error('Creating card placement from empty tile.');
            throw new Error('Creating card placement from empty tile');
        }
        return new CardPlacement(this._getTileIndexFromCoordinates(tile.xIndex, tile.yIndex), tile.getCard(), tile.getOriginalCard());
    }
}
