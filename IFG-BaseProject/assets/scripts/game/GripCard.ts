import { _decorator, instantiate, Component, Prefab, Node, tween, Vec3, director, Rect, Vec2, Sprite } from 'cc';
import { Card } from '../core';
import { CardVisual } from './CardVisual';
import { Camera } from 'cc';
import { EventTouch } from 'cc';
import { IDraggable } from './draggables/IDraggable';
import { DragManager } from './draggables/DragManager';
import { NodeUtilities } from '../utils/NodeUtilities';
import { IDragTarget } from './draggables/IDragTarget';
import { BoardTile } from './BoardTile';
import { SoundManager } from '../audio/SoundManager';
import { GripCardSlot } from './ui/GripCardSlot';
import { PlayerHand } from './PlayerHand';
import { CardScrambleGameController } from './CardScrambleGameController';
import { CardTransformer } from './ui/CardTransformer';

const { ccclass, property } = _decorator;

@ccclass
export class GripCard extends Component implements IDraggable {
    @property
    selectedScale: number = 1.5;

    @property
    selectedTweenDuration: number = 0.6;

    @property
    positionTweenDuration: number = 0.6;

    @property
    dragTimeThreshold: number = 0.5;

    @property
    dragDistanceThreshold: number = 50;

    @property(Prefab)
    cardVisualPrefab: Prefab = null;

    @property(CardTransformer)
    cardTransformer: CardTransformer = null;

    @property
    maxRotationSpeed: number = 250;

    @property
    minRotationSpeed: number = 100;

    @property
    maxDeltaX: number = 20;

    public static OnHighlightedCardTappedEvent = 'OnCardTapped';

    private _cardVisualInstance: CardVisual;
    private _camera: Camera;

    private _card: Card = null;
    private _selected: boolean = false;
    private _holdActive: boolean = false;
    private _holdingFromBoard: boolean = false;
    private _visualsEnabled: boolean = true;
    private _elapsedHoldTime: number = 0;
    private _isDragging: boolean = false;
    private _startingDragPos: Vec3;
    private _slotInGrip: GripCardSlot = null;
    private _cardAnimationParent: Node = null;
    private _gameController: CardScrambleGameController = null;
    private _previousCardSlot: GripCardSlot = null;
    _dragManager: DragManager;
    _worldRect: Rect;
    _activeTarget: IDragTarget;

    private _previousPosition: Vec3 = Vec3.ZERO;
    private _desiredRotation: Vec3 = Vec3.ZERO;
    private _rotationSpeed: number = 250;

    public get cardVisual() {
        return this._cardVisualInstance;
    }

    public get selected() {
        return this._selected;
    }

    onLoad() {
        this._card = null;
        this._selected = false;

        this.node.on(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
    }

    start() {
        this._camera = director.getScene()?.getComponentInChildren(Camera) || null;
    }

    update(deltaTime: number) {
        if (this._holdActive && !this._isDragging) {
            if (this._elapsedHoldTime >= this.dragTimeThreshold) {
                this.OnDragStart();
            }

            this._elapsedHoldTime += deltaTime;
        }

        if (this._holdActive) {
            let deltaX = this.node.getPosition().x - this._previousPosition.x;
            deltaX = Math.max(-20, deltaX);
            deltaX = Math.min(20, deltaX);

            this._rotationSpeed = this.minRotationSpeed + (Math.abs(deltaX) / this.maxDeltaX) * (this.maxRotationSpeed - this.minRotationSpeed);

            this._desiredRotation = new Vec3(0, 0, -deltaX * 2);
            this._previousPosition = this.node.getPosition();

            if (Math.abs(deltaX) < 2) {
                this._rotationSpeed = this.maxRotationSpeed;
                this._desiredRotation = Vec3.ZERO;
            }

            if (this.node.eulerAngles.z > this._desiredRotation.z) {
                this.node.setRotationFromEuler(
                    new Vec3(this.node.eulerAngles.x, this.node.eulerAngles.y, this.node.eulerAngles.z - this._rotationSpeed * deltaTime)
                );
            } else if (this.node.eulerAngles.z < this._desiredRotation.z) {
                this.node.setRotationFromEuler(
                    new Vec3(this.node.eulerAngles.x, this.node.eulerAngles.y, this.node.eulerAngles.z + this._rotationSpeed * deltaTime)
                );
            }

            if (Math.abs(this._desiredRotation.z) <= 1 && Math.abs(this.node.eulerAngles.z) < 2) {
                this.node.setRotationFromEuler(Vec3.ZERO);
            }
        }
    }

    public init(
        card: Card,
        dragManager: DragManager,
        initialDragTarget: IDragTarget,
        animationParent: Node,
        gameController: CardScrambleGameController
    ) {
        this._card = card;
        this._dragManager = dragManager;
        this._activeTarget = initialDragTarget;
        this._cardAnimationParent = animationParent;
        this._gameController = gameController;

        this._cardVisualInstance = instantiate(this.cardVisualPrefab)?.getComponent(CardVisual);
        if (this._cardVisualInstance) {
            this._cardVisualInstance.node.parent = this.node;
            this._cardVisualInstance.setToCard(card, card);
        }

        this.cardTransformer.setCard(card);
    }

    public isSelected(): boolean {
        return this._selected;
    }

    public setSelected(selected: boolean) {
        this._selected = selected;

        if (this._selected) {
            this._animateSelect();
        } else {
            this._animateDeselect();
        }
    }

    public getCard(): Card {
        return this._card;
    }

    public setCard(card: Card) {
        this._card = card;

        if (this._cardVisualInstance) {
            this._cardVisualInstance.setToCard(card, card);
        }

        this.cardTransformer.setCard(card);
    }

    public setCardSlot(cardSlot: GripCardSlot) {
        this._previousCardSlot = this._slotInGrip;
        this._slotInGrip = cardSlot;
    }

    public resetPreviousCardSlot() {
        const tempSlot = this._slotInGrip;
        this._previousCardSlot.addCardToSlot(this);
        this._previousCardSlot = tempSlot;
    }

    public getCardSlot(): GripCardSlot {
        return this._slotInGrip;
    }

    public unselectCard() {
        this._selected = false;
    }

    private _onSelect() {
        if (this._dragManager.canInteract() || this._selected) {
            this._selected = !this._selected;

            if (this._selected) {
                this.node.emit('tile-selected', this);
            } else {
                this.node.emit('tile-unselected');
            }
        }
    }

    private _animateSelect() {
        tween(this.node)
            .to(
                this.selectedTweenDuration,
                {
                    scale: new Vec3(this.selectedScale, this.selectedScale, this.selectedScale)
                },
                { easing: 'bounceOut' }
            )
            .start();
    }

    private _animateDeselect() {
        tween(this.node)
            .to(
                this.selectedTweenDuration,
                {
                    scale: Vec3.ONE
                },
                { easing: 'bounceOut' }
            )
            .start();
    }

    public tweenPosition(endPos: Vec3, onComplete: () => void, parentOverride: Node = this._cardAnimationParent) {
        const startingWorldPos = this.node.getWorldPosition();
        this.node.parent = parentOverride;
        this.node.setWorldPosition(startingWorldPos);
        this._dragManager.setTweenActive(true);
        this._gameController.blockBoardInteraction(true);
        this._gameController.uiManager.HUD.BlockHUDInteraction(true);

        tween(this.node)
            .to(this.positionTweenDuration, { worldPosition: endPos }, { easing: 'quintOut' })
            .call(() => {
                this._dragManager.setTweenActive(false);
                onComplete();
                this._gameController.blockBoardInteraction(false);
                this._gameController.uiManager.HUD.BlockHUDInteraction(false);
            })
            .start();
    }

    public setHighlighted(highlighted: boolean) {
        this._cardVisualInstance.setHighlighted(highlighted);
    }

    public toggleVisuals(visualsOn: boolean) {
        let cardSprites = this.node.getComponentsInChildren(Sprite);

        cardSprites.forEach((sprite) => {
            sprite.enabled = visualsOn;
        });

        this._visualsEnabled = visualsOn;
    }

    public toggleCardTransformer(active: boolean) {
        this.node.children.forEach((child) => {
            child.active = !active;
        });

        this.cardTransformer.playIdleAnim();
        this.cardTransformer.node.active = active;
    }

    public beginHoldFromBoard(originTarget: IDragTarget) {
        this._activeTarget = originTarget;
        this._holdingFromBoard = true;
        this._onTouchStart();
    }

    private _onTouchStart() {
        if (this._visualsEnabled && this._dragManager.canInteract() && !this._holdActive && !this._cardVisualInstance.isHighlighted) {
            SoundManager.instance.playSound('SFX_Gameplay_CardPlaced');
            this._holdActive = true;
            this._elapsedHoldTime = 0;
            this._isDragging = false;
            this._startingDragPos = this.node.getWorldPosition();
        }
    }

    private _onTouchCancel() {
        if (this._holdActive) {
            if (this._isDragging) {
                this.OnDragEnd();
            }

            this._holdActive = false;
            this._holdingFromBoard = false;

            this.node.setRotationFromEuler(Vec3.ZERO);
        }
    }

    private _onTouchEnd() {
        if (this._holdActive) {
            if (this._isDragging) {
                this.OnDragEnd();
            } else {
                //This is a tap
                if (this._holdingFromBoard) {
                    this._dragManager.CardTappedFromBoard(this, this._activeTarget.GetNode().getComponent(BoardTile));
                } else if (this._cardVisualInstance.isHighlighted) {
                    this.node.emit(GripCard.OnHighlightedCardTappedEvent, this);
                } else {
                    this._onSelect();
                    this.node.setWorldPosition(this._startingDragPos);
                }
            }

            this._holdActive = false;
            this._holdingFromBoard = false;

            this.node.setRotationFromEuler(Vec3.ZERO);
        } else if (this._cardVisualInstance.isHighlighted) {
            this.node.emit(GripCard.OnHighlightedCardTappedEvent, this);
        }
    }

    OnDragStart() {
        if (!this._isDragging) {
            this._isDragging = true;

            if (!this._selected) {
                this._onSelect();
            }

            this._dragManager.BeginDrag(this, this._startingDragPos);
        }
    }

    OnDragEnd() {
        this._isDragging = false;

        this._dragManager.EndDrag();

        if (this._selected) {
            this._onSelect();
        }
    }

    CancelDrag() {
        this._isDragging = false;
        this._holdActive = false;
        this.node.setRotationFromEuler(Vec3.ZERO);

        const boardTileTarget = this._activeTarget.GetNode().getComponent(BoardTile);

        //If the tile to return to is non interactable, make sure it can still be placed back onto it
        if (boardTileTarget !== null && !boardTileTarget.getInteractable()) {
            this.tweenPosition(boardTileTarget.node.getWorldPosition(), () => {
                boardTileTarget.forceSelect(this, 'board-tile-touch-end');
            });
        } else if (boardTileTarget === null || boardTileTarget === undefined) {
            //target is the player hand, find the slot to tween towards
            const playerHandTarget: PlayerHand = this._activeTarget.GetNode().getComponent(PlayerHand);

            if (playerHandTarget) {
                const slotTweenTarget = playerHandTarget.getActiveOpenSlot();

                if (slotTweenTarget) {
                    this._activeTarget.ClaimDraggable(this, 'board-tile-touch-end');
                }
            }
        } else {
            this.tweenPosition(this._activeTarget.GetNode().getWorldPosition(), () => {
                this._activeTarget.ClaimDraggable(this, 'board-tile-touch-end');
            });
        }

        if (this._selected) {
            this._onSelect();
        }

        this._dragManager.OnDragCancelled(this._activeTarget);
    }

    GetActiveTarget(): IDragTarget {
        return this._activeTarget;
    }

    SetActiveTarget(dragTarget: IDragTarget) {
        this._activeTarget = dragTarget;
    }

    public GetNode(): Node {
        return this.node;
    }

    public UpdateWorldRect() {
        this._worldRect = NodeUtilities.GetWorldBoundingBox(this.node);
    }

    public GetWorldRect(): Rect {
        this.UpdateWorldRect();
        return this._worldRect;
    }

    private _onTouchMove(event: EventTouch) {
        if (this._holdActive) {
            const worldPos = new Vec3();
            const localPos = new Vec3();
            const screenPos = new Vec3(event.getLocationX(), event.getLocationY(), 0);
            this._camera.screenToWorld(screenPos, worldPos);
            this.node.parent?.inverseTransformPoint(localPos, worldPos);
            this.node.setPosition(localPos.x, localPos.y, 0);

            if (!this._isDragging) {
                if (Vec2.distance(this._startingDragPos, this.node.getWorldPosition()) >= this.dragDistanceThreshold) {
                    this.OnDragStart();
                }
            }
        }
    }
}
