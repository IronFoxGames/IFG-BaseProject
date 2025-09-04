import { _decorator, Animation, Component, instantiate, Label, Node, Prefab, Rect, Sprite, SpriteFrame, Vec3 } from 'cc';
import { SoundManager } from '../audio/SoundManager';
import { Card, TileState } from '../core';
import { BoardModifierType } from '../core/enums/BoardModifierType';
import { BoardModifier, HandMultiplierModifier } from '../core/model/BoardModifier';
import { GameBoardTileModel } from '../core/model/GameBoardTileModel';
import { NodeUtilities } from '../utils/NodeUtilities';
import { BoardModifierVisual } from './BoardModifierVisual';
import { Gameboard } from './Gameboard';
import { GripCard } from './GripCard';
import { PlayedCard } from './PlayedCard';
import { DragManager } from './draggables/DragManager';
import { IDragTarget } from './draggables/IDragTarget';
import { IDraggable } from './draggables/IDraggable';

const { ccclass, property } = _decorator;

@ccclass
export class BoardTile extends Component implements IDragTarget {
    @property(Sprite)
    background: Sprite | null = null;

    @property([SpriteFrame])
    backgroundVariants: SpriteFrame[] = [];

    @property(Label)
    debugLabel: Label | null = null;

    @property(Node)
    boardModifierContainer: Node | null = null;

    @property(Prefab)
    placedCardTilePrefab: Prefab;

    @property(Prefab)
    boardModifierPrefab: Prefab;

    @property(Node)
    tileHighlight: Node | null = null;

    @property(Prefab)
    modifierVFXPrefab: Prefab | null = null;

    private _tileModel: GameBoardTileModel;
    private _placedCard: PlayedCard = null;
    private _interactable: boolean = false;
    private _index: number = -1;
    private _animationParentNode: Node = null;
    private _activeCardParentNode: Node = null;
    private _boardModifierVisual: BoardModifierVisual = null;
    private _draggableToClaim: IDraggable = null;
    private _animation: Animation = null;
    private _previousTileAnimClip: number = 0;
    private _nextTurnBurnAnimActive: boolean = false;
    private _modifierVFXInstance: Node = null;
    private _gameboard: Gameboard = null;

    // On mouse enter we want to highlight the tile if the game state indicates a tap would place a
    // card, otherwise we're highlighting the tile when no action is valid which is confusing.
    private _isEligibleForDropOnTap: boolean = false;

    _dragManager: DragManager;
    _worldRect: Rect;

    public get index(): number {
        return this._index;
    }

    private _xIndex: number = -1;

    public get xIndex(): number {
        return this._xIndex;
    }

    private _yIndex: number = -1;

    public get yIndex(): number {
        return this._yIndex;
    }

    public get placedCard() {
        return this._placedCard;
    }

    public get boardModifierVisual() {
        return this._boardModifierVisual;
    }

    onLoad() {
        this.background.node.active = true;
        this.debugLabel.node.active = false;

        this.node.on(Node.EventType.MOUSE_ENTER, this._animateTargetOn, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this._animateTargetOff, this);
        this.node.on(Node.EventType.TOUCH_START, this._onSelect, this);

        this._animation = this.getComponent(Animation);
    }

    start() {}

    public init(
        tileModel: GameBoardTileModel,
        index: number,
        xIndex: number,
        yIndex: number,
        isAnchor: boolean,
        animationParentNode: Node,
        activeCardParentNode: Node,
        dragManager: DragManager,
        gameboard: Gameboard
    ) {
        this._tileModel = tileModel;
        this._index = index;
        this._xIndex = xIndex;
        this._yIndex = yIndex;
        this._animationParentNode = animationParentNode;
        this._activeCardParentNode = activeCardParentNode;
        this._dragManager = dragManager;
        this._gameboard = gameboard;

        this._dragManager.AddDragTarget(this);

        // TODO: might want to data drive this somehow, but for now math out the variant backgrounds
        if (yIndex % 2 == 0) {
            this.background.spriteFrame = this.backgroundVariants[xIndex % 2];
        } else {
            const index = xIndex % 2 === 0 ? 2 : 0;
            this.background.spriteFrame = this.backgroundVariants[index];
        }

        this.debugLabel.string = `${index}`;
        this.setInteractable(false);

        this.tileHighlight.active = false;
    }

    public clearTile() {
        this._placedCard = null;
        this.node.destroyAllChildren();
    }

    public playCard(card: Card, originalCard: Card, gameboard: Gameboard) {
        this._tileModel.placeCard(card, originalCard);
        this._createCardVisual(card, originalCard, gameboard, true, () => {
            //if the card was played on a multiplier modifier, play the vfx for the modifier after the drop animation finishes for the card
            const modifier = this.getBoardModifier();

            if (modifier.type === BoardModifierType.HandMultiplier) {
                const multiplierModifier = modifier as HandMultiplierModifier;
                this._modifierVFXInstance = instantiate(this.modifierVFXPrefab);
                this._modifierVFXInstance.parent = this.node;
                this._modifierVFXInstance.setPosition(Vec3.ZERO);

                let vfxAnim = this._modifierVFXInstance.getComponentInChildren(Animation);
                const clips = vfxAnim.clips;

                gameboard.playerHand.blockPlayerInteraction(true);

                let pos = this._modifierVFXInstance.getWorldPosition();
                this._modifierVFXInstance.parent = gameboard.tileAnimationParent.node;
                this._modifierVFXInstance.setWorldPosition(pos);

                if (multiplierModifier.multiplier === 2) {
                    vfxAnim.play(clips[1].name);
                } else {
                    vfxAnim.play(clips[2].name);
                }

                vfxAnim.once(Animation.EventType.FINISHED, () => {
                    gameboard.playerHand.blockPlayerInteraction(false);
                    this._modifierVFXInstance.destroy();
                    this._modifierVFXInstance = null;
                });
            }
        });

        SoundManager.instance.playSound('SFX_Gameplay_CardPlaced');
    }

    public pickUpCard(): Card {
        const card = this._tileModel.pickUpCard();
        if (card != Card.Invalid) {
            this._placedCard.node.destroy();
            this._placedCard = null;
        }
        return card;
    }

    public lockCardInPlace() {
        this._tileModel.lockCardInPlace();

        const gripCardChild = this.node.getComponentInChildren(GripCard);

        if (gripCardChild) {
            gripCardChild.node.destroy();
        }
    }

    public getCard(): Card {
        return this._tileModel.card;
    }

    public getOriginalCard(): Card {
        return this._tileModel.originalCard;
    }

    public setCard(card: Card) {
        this._tileModel.placeCard(card, card);
        this._tileModel.lockCardInPlace();
    }

    public isDeadTile(): boolean {
        if (this._tileModel.boardModifierList) {
            const deadModifier = this._tileModel.boardModifierList.find(
                (m) => m.type === BoardModifierType.Null || m.type === BoardModifierType.BurnedTile
            );

            if (deadModifier) {
                return true;
            }
        }

        return false;
    }

    public getBoardModifier(): BoardModifier {
        return this._tileModel?.boardModifierList?.[0] !== undefined ? this._tileModel.boardModifierList[0] : new BoardModifier();
    }

    public addBoardModifier(modifier: BoardModifier) {
        this._tileModel?.boardModifierList.push(modifier);

        if (modifier.type === BoardModifierType.BurnedTile) {
            this.toggleNextTurnBurnAnim(false);
        }

        this._updateBoardModifierVisuals();
    }

    public removeBoardModifier(modifierType: BoardModifierType) {
        let modifier = this._tileModel?.boardModifierList?.find((mod) => mod.type === modifierType);
        let modifierIndex: number = -1;

        if (modifier) {
            modifierIndex = this._tileModel?.boardModifierList?.indexOf(modifier);
        }

        if (modifierIndex !== -1) {
            this._tileModel?.boardModifierList?.splice(modifierIndex, 1);
        }

        this._updateBoardModifierVisuals();
    }

    public setInteractable(interactable: boolean) {
        const clips = this._animation.clips;

        if (!this._interactable && interactable) {
            this._animation.play(clips[6].name);
            this._previousTileAnimClip = 6;
        } else if (this._interactable && !interactable) {
            this._animation.play(clips[1].name);
            this._previousTileAnimClip = 1;
        }

        this._interactable = interactable;
    }

    public getInteractable() {
        return this._interactable;
    }

    public setEligbleForDropOnTap(eligibleForDropOnTap) {
        this._isEligibleForDropOnTap = eligibleForDropOnTap;
    }

    public setLockedVisual(locked: boolean): void {
        // TODO CSB:
    }

    public getTileModelState(): TileState {
        return this._tileModel.state;
    }

    public updateVisuals(gameboard: Gameboard) {
        switch (this._tileModel.state) {
            case TileState.Empty:
                if (this._placedCard) {
                    this._placedCard.node?.destroy();
                    this._placedCard = null;
                }
                break;
            case TileState.Occupied:
                if (!this._placedCard) {
                    this._createCardVisual(this._tileModel.card, null, gameboard);
                }
                this._placedCard.setCardLocked(true);
                break;
            case TileState.Occupied_Unflipped:
                if (this._placedCard) {
                    this._placedCard.setCardLocked(false);
                }
                // TODO:
                break;
        }

        this._updateBoardModifierVisuals();
    }

    public setHighlighted(isHighlighted: boolean) {
        this.tileHighlight.active = isHighlighted;
    }

    private _createBoardModifierVisual(boardModifier: BoardModifier) {
        const prefab = instantiate(this.boardModifierPrefab);
        if (!prefab) {
            throw new Error(`Failed to initialize board modifier`);
        }
        prefab.parent = this.boardModifierContainer;

        this._boardModifierVisual = prefab.getComponent(BoardModifierVisual);
        this._boardModifierVisual.init(boardModifier, this._animationParentNode, this, this._gameboard);
    }

    public toggleNextTurnBurnAnim(isActive: boolean) {
        if (
            isActive &&
            !this._nextTurnBurnAnimActive &&
            !this._tileModel?.boardModifierList?.find((mod) => mod.type === BoardModifierType.BurnedTile)
        ) {
            this._modifierVFXInstance = instantiate(this.modifierVFXPrefab);
            this._modifierVFXInstance.parent = this.node;
            this._modifierVFXInstance.setPosition(Vec3.ZERO);

            let anim = this._modifierVFXInstance.getComponentInChildren(Animation);
            anim.play('BurningFood-Cascadeburn');
            this._nextTurnBurnAnimActive = true;
        } else if (!isActive) {
            this.scheduleOnce(() => {
                if (this._modifierVFXInstance) {
                    this._modifierVFXInstance.destroy();
                    this._modifierVFXInstance = null;
                    this._nextTurnBurnAnimActive = false;
                }
            }, 0);
        }
    }

    private _updateBoardModifierVisuals() {
        const currentModifier = this._tileModel.boardModifierList?.[0];

        // Special case for null modifier; don't render tile
        if (currentModifier && currentModifier?.type === BoardModifierType.Null) {
            this.background.enabled = false;
            return;
        }

        if (currentModifier) {
            if (currentModifier.type != this._boardModifierVisual?.boardModifier?.type) {
                // Different modifier type; create
                if (!this._boardModifierVisual) {
                    this._createBoardModifierVisual(currentModifier);
                } else if (currentModifier.type !== BoardModifierType.BurnedTile) {
                    this._boardModifierVisual.expireModifier(() => {
                        this._boardModifierVisual.node.destroy();
                        this._boardModifierVisual = null;

                        this._createBoardModifierVisual(currentModifier);
                    });
                }
            } else {
                // Update state?
                this._boardModifierVisual.updateVisuals(currentModifier);
            }
        } else if (this._boardModifierVisual) {
            let modifierVisual = this._boardModifierVisual;
            this._boardModifierVisual = null;
            modifierVisual.expireModifier(() => {
                modifierVisual.node.destroy();
            });
        }
    }

    private _createCardVisual(
        card: Card,
        originalCard: Card,
        gameboard: Gameboard,
        animate: boolean = false,
        onAnimComplete: () => void = () => {}
    ) {
        const instance = instantiate(this.placedCardTilePrefab);
        this._placedCard = instance.getComponent(PlayedCard);
        this._placedCard.setCardPlaced(
            card,
            originalCard,
            animate,
            this._animationParentNode,
            this.node,
            this._activeCardParentNode,
            gameboard,
            onAnimComplete
        );
    }

    private _onSelect(eventString: string) {
        //Default String
        if (eventString !== 'board-tile-touch-start' && eventString !== 'board-tile-touch-end') {
            eventString = 'board-tile-touch-start';
        }

        if ((eventString === 'board-tile-touch-start' && !this._dragManager.IsDragActive()) || eventString === 'board-tile-touch-end') {
            if (this._interactable && this._dragManager.canInteract()) {
                this.node.emit(eventString, this, this._draggableToClaim);
                this._draggableToClaim = null;
            } else {
                eventString = 'inactive-board-tile-touch-start';
                this.node.emit(eventString);
            }
        }
    }

    //This is only for swapping a card onto a tile that becomes non interactable during the swap
    public forceSelect(draggable: IDraggable, eventString: string) {
        if (eventString !== 'board-tile-touch-start' && eventString !== 'board-tile-touch-end') {
            eventString = 'board-tile-touch-start';
        }

        if ((eventString === 'board-tile-touch-start' && !this._dragManager.IsDragActive()) || eventString === 'board-tile-touch-end') {
            this.node.emit(eventString, this, draggable);
        }
    }

    private _animateTargetOn() {
        if (this._interactable === false || !this._isEligibleForDropOnTap) {
            return;
        }

        const clips = this._animation.clips;
        this._animation.play(clips[2].name);
        this._previousTileAnimClip = 2;
    }

    private _animateTargetOff() {
        if (this._interactable === false || this._previousTileAnimClip !== 2) {
            return;
        }

        const clips = this._animation.clips;
        this._animation.play(clips[3].name);
        this._previousTileAnimClip = 3;
    }

    public ClaimDraggable(draggable: IDraggable, eventString: string) {
        this._draggableToClaim = draggable;
        this._onSelect(eventString);
    }

    public CanClaim(): boolean {
        return this._interactable;
    }

    public UpdateWorldRect() {
        this._worldRect = NodeUtilities.GetWorldBoundingBox(this.node);
    }

    public GetWorldRect(): Rect {
        this.UpdateWorldRect();
        return this._worldRect;
    }

    public GetNode() {
        return this.node;
    }
}
