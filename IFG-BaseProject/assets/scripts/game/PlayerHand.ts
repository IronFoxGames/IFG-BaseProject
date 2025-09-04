import { _decorator, Animation, CCFloat, Component, instantiate, ITweenOption, Layout, Node, Prefab, Rect, tween, Vec3 } from 'cc';
import { AppConfig } from '../config/AppConfig';
import { Card, Hand, MatchOperations } from '../core';
import { BoosterType } from '../core/enums/BoosterType';
import { CardType } from '../core/model/Card';
import { logger } from '../logging';
import { NodeUtilities } from '../utils/NodeUtilities';
import { BoardTile } from './BoardTile';
import { CardScrambleGameController } from './CardScrambleGameController';
import { CardVisual } from './CardVisual';
import { Gameboard } from './Gameboard';
import { GripCard } from './GripCard';
import { HUDController } from './HUDController';
import { DragManager } from './draggables/DragManager';
import { IDragTarget } from './draggables/IDragTarget';
import { IDraggable } from './draggables/IDraggable';
import { CardTransformer } from './ui/CardTransformer';
import { GripCardSlot } from './ui/GripCardSlot';

const { ccclass, property } = _decorator;

@ccclass
export class PlayerHand extends Component implements IDragTarget {
    @property(Prefab)
    tilePrefab: Prefab | null = null;

    @property(Node)
    layoutNode: Node | null = null;

    @property(GripCardSlot)
    cardSlots: GripCardSlot[] = [];

    @property(Prefab)
    cardSlotPrefab: Prefab | null = null;

    @property(Layout)
    cardTrayLayout: Layout = null;

    @property(CCFloat)
    cardTrayDefaultSpacing: number = 5;

    @property(CCFloat)
    cardTrayMinSpacing: number = -13;

    @property(Node)
    cardTrayScrim: Node = null;

    @property(Prefab)
    cardBackPrefab: Prefab | null = null;

    @property({ type: CCFloat, visible: true, tooltip: 'Delay between individual card draws in milliseconds' })
    private _delayBetweenDraws: number = 200;

    @property({
        type: CCFloat,
        visible: true,
        tooltip: 'Speed of the card back animation during sorting. 1 is normal, 2 is double. Negative numbers are in reverse.'
    })
    private sortHandAnimationSpeed: number = -1.5;

    private _cardsInGrip: GripCard[] = [];
    private _currentHand: Hand = null;
    private _activeOpenSlot: GripCardSlot = null;
    private _activeDraggable: IDraggable = null;
    private _gameboard: Gameboard = null;
    private _cardAnimationParent: Node = null;
    private _hudController: HUDController = null;
    private _gameController: CardScrambleGameController = null;
    private _isDrawingCards: boolean = false;
    private _cardAnimReversed: boolean = false;
    private _mouseHoveringOverHand: boolean = false;
    private _cardBackInstance: Node = null;
    private _slotPositions: Vec3[] = [];
    private _loosenYourBeltApplied: boolean = false;
    private _currentSortFunction: (a: GripCardSlot, b: GripCardSlot) => number;
    private _slotSpacingTweenActive: boolean = false;
    private _log = logger.child('PlayerHand');

    _dragManager: DragManager;
    _worldRect: Rect;

    onLoad() {
        this._resetHand();

        this.node.on(Node.EventType.MOUSE_ENTER, this._onMouseEnter, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this._onMouseLeave, this);
    }

    start() {}

    update(deltaTime: number) {
        if (this._dragManager.IsDragActive() && this._activeOpenSlot !== null && this._mouseHoveringOverHand) {
            const activeDraggableWorldPos: Vec3 = this._activeDraggable.GetNode().getWorldPosition();
            const activeOpenSlotIndex = this.cardSlots.indexOf(this._activeOpenSlot);

            let targetIndex = this.cardSlots.length;
            for (let i = 0; i < this.cardSlots.length; i++) {
                const slotX = this.cardSlots[i].node.getWorldPosition().x;
                if (activeDraggableWorldPos.x < slotX) {
                    targetIndex = i;
                    break;
                }
            }

            // If target slot and active slot don't match; move the slot to the desired idex and
            // swap all card slots to make room
            if (activeOpenSlotIndex !== -1 && targetIndex !== activeOpenSlotIndex) {
                const slot = this.cardSlots[activeOpenSlotIndex];

                // Remove the slot from its current position
                this.cardSlots.splice(activeOpenSlotIndex, 1);

                // Adjust target index if dragging from before target
                if (targetIndex > activeOpenSlotIndex) {
                    targetIndex--;
                }

                // Insert at the new position
                this.cardSlots.splice(targetIndex, 0, slot);
                for (let i = 0; i < this.cardSlots.length; i++) {
                    this.cardSlots[i].node.setSiblingIndex(i);
                }
            }
        }
    }

    public setHandInteractable(interactable: boolean) {
        this.cardTrayScrim.active = !interactable;
    }

    public blockPlayerInteraction(blockBoard: boolean) {
        this._gameController.blockBoardInteraction(blockBoard);
        this._gameController.uiManager.HUD.BlockHUDInteraction(blockBoard);
    }

    public getCardsInGrip(): GripCard[] {
        return this._cardsInGrip;
    }

    public getActiveOpenSlot(): GripCardSlot {
        return this._activeOpenSlot;
    }

    onDestroy(): void {
        this._dragManager.node.off('drag-started', this._onDragStarted, this);
        this._dragManager.node.off('drag-ended', this._onDragEnded, this);
    }

    public onCardInGripSelected(cardTile: GripCard) {
        let cardInGripFound: boolean = false;

        this._cardsInGrip.forEach((element) => {
            if (element === cardTile) {
                element.setSelected(true);
                this.node.emit('hand-card-selected', element);
                cardInGripFound = true;
            } else {
                element.setSelected(false);
            }
        });

        if (!cardInGripFound) {
            this.node.emit('board-card-selected', cardTile);
        }
    }

    public setDragManager(dragManager: DragManager) {
        this._dragManager = dragManager;
        this._dragManager.AddDragTarget(this);

        this._dragManager.node.on('drag-started', this._onDragStarted, this);
        this._dragManager.node.on('drag-ended', this._onDragEnded, this);
    }

    public getDragManager(): DragManager {
        return this._dragManager;
    }

    public setGameboard(gameboard: Gameboard, animationParent: Node) {
        this._gameboard = gameboard;
        this._cardAnimationParent = animationParent;
    }

    public onCardInGripSelectionRemoved() {
        this._cardsInGrip.forEach((element) => {
            element.setSelected(false);
        });

        this.node.emit('hand-card-clear-selection');
    }

    public cardPlayed(cardPlayed: GripCard, cardReturned: GripCard, boardTile: BoardTile, eventString: string, transformedCard: Card = null) {
        let playedCardPreviousDragTarget: IDragTarget = null;

        if (cardPlayed != null) {
            this._cardsInGrip = this._cardsInGrip.filter((card) => card !== cardPlayed);

            cardPlayed.toggleVisuals(false);
            playedCardPreviousDragTarget = cardPlayed.GetActiveTarget();
            cardPlayed.SetActiveTarget(boardTile);
            const cardSlot = cardPlayed.getCardSlot();

            if (cardSlot != null) {
                cardSlot.removeCardFromSlot(boardTile.node);
            } else {
                cardPlayed.node.parent = boardTile.node;
            }

            cardPlayed.node.setPosition(new Vec3());

            const playedCard = transformedCard ? transformedCard : cardPlayed.getCard();
            boardTile.playCard(playedCard, cardPlayed.getCard(), this._gameboard);
            this._gameboard._onTileMutated(boardTile.xIndex, boardTile.yIndex);
        }

        if (cardReturned != null && cardReturned.getCard() != Card.Invalid && cardReturned.getCard() !== cardPlayed.getCard()) {
            if (playedCardPreviousDragTarget !== null) {
                const boardTileTarget = playedCardPreviousDragTarget.GetNode().getComponent(BoardTile);

                //Hack for placing a swapped card onto a tile that is "non interactable"
                if (boardTileTarget !== null && !boardTileTarget.getInteractable()) {
                    boardTileTarget.forceSelect(cardReturned, eventString);
                    return;
                }

                playedCardPreviousDragTarget.ClaimDraggable(cardReturned, eventString);
            }
        }
    }

    public setHand(hand: Hand, drawnFromDeck: boolean, appConfig: AppConfig, updatedFromPowerupUsage: boolean) {
        let oldHand: Card[] = [];

        this._cardsInGrip.forEach((gripCard) => {
            oldHand.push(gripCard.getCard());
        });

        if (this._currentHand != null) {
            this._resetHand(hand);
        }

        this._currentHand = hand;

        this._log.debug('Setting Hand of Length: ' + hand.getCards().length);

        const cardsToDraw: Card[] = [];

        hand.getCards().forEach((card: Card) => {
            const index = oldHand.findIndex((cardInOldHand) => cardInOldHand.equals(card));

            if (index === -1) {
                cardsToDraw.push(card);
            } else {
                oldHand.splice(index, 1);
            }
        });

        if (cardsToDraw.length < 1) {
            this.blockPlayerInteraction(false);
            this.setHandInteractable(true);
            return;
        }

        if (!this._isDrawingCards && drawnFromDeck) {
            this.updateSlotPositions();
            this._drawCardsSequentially(cardsToDraw, hand.getCards().length, appConfig);
        } else if (!this._isDrawingCards) {
            cardsToDraw.forEach((card) => {
                this._addCardToHand(card, null, null, false, () => {});
            });

            if (!updatedFromPowerupUsage) {
                this.updateCardSlotSpacing(hand.getCards().length, appConfig);
            }
        }
    }

    public updateCardSlotSpacing(handLength: number, appConfig: AppConfig, onComplete: () => void = () => {}) {
        let targetSpacingX: number;

        if (this._slotSpacingTweenActive) {
            return;
        }

        if (handLength <= 7) {
            this.tweenCardSlotSpacing(this.cardTrayDefaultSpacing, onComplete);
        } else {
            const maxExtraCards = appConfig.maximumHandSize - 7;
            const extraCards = handLength - 7;
            const totalReduction = this.cardTrayDefaultSpacing - this.cardTrayMinSpacing;
            const reductionPerExtraCard = totalReduction / maxExtraCards;
            targetSpacingX = this.cardTrayDefaultSpacing - reductionPerExtraCard * extraCards;

            if (targetSpacingX < this.cardTrayMinSpacing) {
                targetSpacingX = this.cardTrayMinSpacing;
            } else if (targetSpacingX > this.cardTrayDefaultSpacing) {
                targetSpacingX = this.cardTrayDefaultSpacing;
            }

            this.tweenCardSlotSpacing(targetSpacingX, onComplete);
        }
    }

    private tweenCardSlotSpacing(targetSpacingX: number, onComplete: () => void) {
        if (this.cardTrayLayout.spacingX !== targetSpacingX) {
            this._slotSpacingTweenActive = true;
            const tweenableSpacingValue = { value: this.cardTrayLayout.spacingX };

            tween(tweenableSpacingValue)
                .to(
                    0.3,
                    { value: targetSpacingX },
                    {
                        onUpdate: () => {
                            this.cardTrayLayout.spacingX = tweenableSpacingValue.value;
                            this.cardTrayLayout.updateLayout();
                        },
                        easing: 'quadOut'
                    }
                )
                .call(() => {
                    this.cardTrayLayout.spacingX = targetSpacingX;
                    this.cardTrayLayout.updateLayout();
                    this._slotSpacingTweenActive = false;

                    onComplete();
                })
                .start();
        } else {
            onComplete();
            this.cardTrayLayout.updateLayout();
        }
    }

    private _drawCardsSequentially(cardsToDraw: Card[], handLength: number, appConfig: AppConfig) {
        this._isDrawingCards = true;
        this._gameController.blockBoardInteraction(true);
        this._gameController.uiManager.HUD.BlockHUDInteraction(true);
        this.setHandInteractable(false);

        const nextCard = cardsToDraw[0];
        cardsToDraw.splice(0, 1);

        if (
            this._gameController.config.appliedBoosters.includes(BoosterType.LoosenTheBelt) &&
            cardsToDraw.length === 0 &&
            !this._loosenYourBeltApplied
        ) {
            this._activateLoosenYourBelt(nextCard, () => {
                this._isDrawingCards = false;
                this._hudController.onHandDrawComplete();
                this._gameController.blockBoardInteraction(false);
                this._gameController.uiManager.HUD.BlockHUDInteraction(false);
                this.setHandInteractable(true);
                this.updateCardSlotSpacing(handLength, appConfig, () => {
                    this._checkDeucesWild();
                });
            });

            this._loosenYourBeltApplied = true;
        } else if (cardsToDraw.length > 0) {
            this._addCardToHand(nextCard, null, null, true, () => {});

            setTimeout(() => {
                this._drawCardsSequentially(cardsToDraw, handLength, appConfig);
            }, this._delayBetweenDraws);
        } else {
            this._addCardToHand(nextCard, null, null, true, () => {
                if (cardsToDraw.length == 0) {
                    this._isDrawingCards = false;
                    this._hudController.onHandDrawComplete();
                    this._gameController.blockBoardInteraction(false);
                    this._gameController.uiManager.HUD.BlockHUDInteraction(false);
                    this.setHandInteractable(true);
                    this.updateCardSlotSpacing(handLength, appConfig, () => {
                        this._checkDeucesWild();
                    });
                }
            });
        }
    }

    private _activateLoosenYourBelt(cardToDraw: Card, onComplete: () => void) {
        let instance: Node;

        instance = instantiate(this.tilePrefab);
        instance.on('tile-selected', this.onCardInGripSelected, this);
        instance.on('tile-unselected', this.onCardInGripSelectionRemoved, this);

        const gripCard: GripCard = instance.getComponent(GripCard);
        let attachedSlot = this._attachToNextAvailableSlot(gripCard, null);
        gripCard.init(cardToDraw, this._dragManager, this, this._cardAnimationParent, this._gameController);
        gripCard.SetActiveTarget(this);
        let cardTransformer = gripCard.getComponentInChildren(CardTransformer);

        this._cardsInGrip.push(gripCard);
        this._hudController.drawCardFromLoosenYourBelt();

        this.scheduleOnce(() => {
            instance.setWorldPosition(this._gameController.uiManager.HUD.deckAnimation.node.getWorldPosition());
            gripCard.toggleCardTransformer(true);

            cardTransformer.node.parent = attachedSlot.node;
            cardTransformer.node.setPosition(Vec3.ZERO);
            cardTransformer.playLoosenYourBeltAnim();

            cardTransformer.cardAnimator.once(Animation.EventType.FINISHED, () => {
                cardTransformer.node.parent = gripCard.node;
                cardTransformer.node.setSiblingIndex(0);
                cardTransformer.node.setPosition(Vec3.ZERO);

                gripCard.toggleCardTransformer(true);

                cardTransformer.playJokerActivateAnim();

                tween(gripCard.node)
                    .to(1, { worldPosition: attachedSlot.node.getWorldPosition() }, { easing: 'expoInOut' })
                    .call(() => {
                        gripCard.toggleCardTransformer(false);

                        gripCard.node.parent = attachedSlot.node;
                        gripCard.node.setScale(Vec3.ONE);
                        gripCard.node.setPosition(Vec3.ZERO);
                        onComplete();
                    })
                    .start();
            });
        }, 0);
    }

    private _checkDeucesWild() {
        if (this._gameController.config.appliedBoosters.includes(BoosterType.DeucesWild)) {
            let twosInGrip: GripCard[] = [];

            this._cardsInGrip.forEach((gripCard) => {
                if (gripCard.getCard().rank === 2) {
                    twosInGrip.push(gripCard);
                }
            });

            twosInGrip.forEach((gripCard, index) => {
                gripCard.toggleCardTransformer(true);

                let cardTransformer = gripCard.getComponentInChildren(CardTransformer);
                cardTransformer.playDeucesWildAnim();
                this._gameController.blockBoardInteraction(true);
                this._gameController.uiManager.HUD.BlockHUDInteraction(true);
                this.setHandInteractable(false);

                let newCard = new Card(0, 0, CardType.Wild);
                let oldCard = new Card(gripCard.getCard().rank, gripCard.getCard().suit);

                if (cardTransformer.currentState) {
                    this.scheduleOnce(() => {
                        gripCard.setCard(newCard);
                    }, cardTransformer.currentState.duration / 2);
                }

                cardTransformer.cardAnimator.once(Animation.EventType.FINISHED, () => {
                    gripCard.toggleCardTransformer(false);

                    MatchOperations.ReplaceCardInHand(this._gameController, newCard, oldCard, () => {
                        if (index === twosInGrip.length - 1) {
                            this._gameController.blockBoardInteraction(false);
                            this._gameController.uiManager.HUD.BlockHUDInteraction(false);
                            this.setHandInteractable(true);
                        }
                    });
                });
            });
        }
    }

    public init(hud: HUDController, gameController: CardScrambleGameController) {
        this._hudController = hud;
        this._gameController = gameController;
    }

    public AddCardToHand(card: Card, isDrawnFromDeck: boolean): GripCard {
        return this._addCardToHand(card, null, null, isDrawnFromDeck);
    }

    private _addCardToHand(
        card: Card,
        draggable: IDraggable,
        slotToAttach: GripCardSlot,
        isDrawnFromDeck: boolean,
        onDrawComplete: () => void = () => {},
        addToGripList: boolean = true
    ): GripCard {
        let instance: Node;

        if (draggable !== null) {
            instance = draggable.GetNode();
        } else {
            instance = instantiate(this.tilePrefab);
            instance.on('tile-selected', this.onCardInGripSelected, this);
            instance.on('tile-unselected', this.onCardInGripSelectionRemoved, this);
        }

        const gripCard: GripCard = instance.getComponent(GripCard);
        const attachedSlot = this._attachToNextAvailableSlot(gripCard, slotToAttach);

        if (draggable === null) {
            gripCard.init(card, this._dragManager, this, this._cardAnimationParent, this._gameController);
        }

        gripCard.SetActiveTarget(this);

        if (addToGripList) {
            this._cardsInGrip.push(gripCard);
        }

        if (isDrawnFromDeck) {
            gripCard.node.active = false;
            this._hudController.playDrawCardTween(attachedSlot, card, onDrawComplete);
        }

        return gripCard;
    }

    private _attachToNextAvailableSlot(card: GripCard, slotToAttach: GripCardSlot): GripCardSlot {
        if (slotToAttach !== null) {
            slotToAttach.addCardToSlot(card);
            return slotToAttach;
        }

        for (const cardSlot of this.cardSlots) {
            if (cardSlot.canAddCard()) {
                cardSlot.addCardToSlot(card);
                return cardSlot;
            }
        }

        this._log.debug('No Slot Found');

        //If this is reached, all slots are filled and we need a new slot
        //This should not ever be reached unless we allow for more/less than 7 cards in a hand
        const newSlot = instantiate(this.cardSlotPrefab);
        newSlot.parent = this.layoutNode;

        const gripCardSlot = newSlot.getComponent(GripCardSlot);
        this.cardSlots.push(gripCardSlot);
        gripCardSlot.addCardToSlot(card);

        return gripCardSlot;
    }

    public sortHand(sortFunction: (a: GripCardSlot, b: GripCardSlot) => number) {
        const cardSlots: Node[] = [];
        const handCenterPosition = this.node.getWorldPosition();
        this._currentSortFunction = sortFunction;

        this.cardSlots.forEach((slot) => {
            if (slot.activeCard) {
                cardSlots.push(slot.node);
                this._slotPositions.push(slot.node.getWorldPosition());
            }
        });

        this._gameController.uiManager.HUD.setSortButtonInteractable(false);
        this._gameController.blockBoardInteraction(true);
        this._gameController.uiManager.HUD.BlockHUDInteraction(true);
        this.setHandInteractable(false);
        this.layoutNode.getComponent(Layout).enabled = false;

        this._tweenMultipleNodes(cardSlots, 0.15, { worldPosition: handCenterPosition }, { easing: 'circIn' }, () => {
            this._cardBackInstance = instantiate(this.cardBackPrefab);
            this._cardBackInstance.parent = this._gameController.animationParent;
            this._cardBackInstance.setWorldPosition(handCenterPosition);

            const inactiveSlots: GripCardSlot[] = [];
            const slotParent = this.cardSlots[0].node.parent;

            this.cardSlots
                .slice()
                .reverse()
                .forEach((slot) => {
                    if (!slot.activeCard) {
                        inactiveSlots.push(slot);
                        slot.node.parent = this.node;
                        this.cardSlots.splice(this.cardSlots.indexOf(slot), 1);
                    }
                });

            this._cardBackInstance.getComponentInChildren(CardVisual).setToCard(this.cardSlots[this.cardSlots.length - 1].activeCard.getCard());

            inactiveSlots
                .slice()
                .reverse()
                .forEach((slot) => {
                    slot.node.parent = slotParent;
                    this.cardSlots.push(slot);
                    inactiveSlots.splice(inactiveSlots.indexOf(slot), 1);
                });

            const cardBackAnim = this._cardBackInstance.getComponent(Animation);
            const animState = cardBackAnim.getState(cardBackAnim.clips[1].name);
            animState.speed = this.sortHandAnimationSpeed;
            animState.time = animState.duration;
            animState.play();
            this._cardAnimReversed = true;

            cardBackAnim.on(Animation.EventType.FINISHED, this._onCardBackAnimComplete, this);

            this.cardSlots.forEach((slot) => {
                if (slot.activeCard) {
                    slot.activeCard.node.active = false;
                }
            });
        });
    }

    private _onCardBackAnimComplete() {
        if (!this._cardBackInstance) {
            return;
        }

        const cardBackAnim = this._cardBackInstance.getComponent(Animation);

        const inactiveSlots: GripCardSlot[] = [];
        const slotParent = this.cardSlots[0].node.parent;

        this.cardSlots
            .slice()
            .reverse()
            .forEach((slot) => {
                if (!slot.activeCard && !slot.node.active) {
                    inactiveSlots.push(slot);
                    slot.node.parent = this.node;
                    this.cardSlots.splice(this.cardSlots.indexOf(slot), 1);
                }
            });

        if (this._cardAnimReversed) {
            this.cardSlots.sort(this._currentSortFunction);
            this._cardBackInstance.getComponentInChildren(CardVisual).setToCard(this.cardSlots[this.cardSlots.length - 1].activeCard.getCard());

            const animState = cardBackAnim.getState(cardBackAnim.clips[1].name);
            animState.speed = 1.2;
            animState.time = 0;
            animState.play();
            this._cardAnimReversed = false;

            inactiveSlots
                .slice()
                .reverse()
                .forEach((slot) => {
                    slot.node.parent = slotParent;
                    this.cardSlots.push(slot);
                    inactiveSlots.splice(inactiveSlots.indexOf(slot), 1);
                });
        } else {
            this.cardSlots.forEach((slot) => {
                if (slot.activeCard) {
                    slot.activeCard.node.active = true;
                }
            });

            cardBackAnim.off(Animation.EventType.FINISHED, this._onCardBackAnimComplete, this);
            this._cardBackInstance.destroy();
            this._cardBackInstance = null;

            this.cardSlots.forEach((slot, i) => {
                slot.node.setSiblingIndex(i);

                tween(slot.node)
                    .to(0.15, { worldPosition: this._slotPositions[i] }, { easing: 'circInOut' })
                    .call(() => {
                        this.layoutNode.getComponent(Layout).enabled = true;
                        this._gameController.blockBoardInteraction(false);
                        this._gameController.uiManager.HUD.BlockHUDInteraction(false);
                        this.setHandInteractable(true);
                        this._gameController.uiManager.HUD.setSortButtonInteractable(true);

                        inactiveSlots
                            .slice()
                            .reverse()
                            .forEach((slot) => {
                                slot.node.parent = slotParent;
                                this.cardSlots.push(slot);
                                inactiveSlots.splice(inactiveSlots.indexOf(slot), 1);
                            });
                    })
                    .start();
            });
        }
    }

    private _tweenNodeWithPromise(node: Node, duration: number, properties: Partial<Node>, easingProp: ITweenOption): Promise<void> {
        return new Promise((resolve) => {
            tween(node)
                .to(duration, properties, easingProp)
                .call(() => resolve())
                .start();
        });
    }

    private async _tweenMultipleNodes(
        nodes: Node[],
        duration: number,
        properties: Partial<Node>,
        easingProp: ITweenOption,
        onComplete: () => void
    ) {
        const allTweens = nodes.map((n) => this._tweenNodeWithPromise(n, duration, properties, easingProp));
        await Promise.all(allTweens);
        onComplete();
    }

    public updateSlotPositions() {
        const activeCardSlots: GripCardSlot[] = [];
        const disabledCardSlots: GripCardSlot[] = [];
        const newCardSlotsArray: GripCardSlot[] = [];

        this.cardSlots.forEach((slot) => {
            if (slot.node.active) {
                activeCardSlots.push(slot);
            } else {
                disabledCardSlots.push(slot);
            }
        });

        activeCardSlots.forEach((slot, i) => {
            newCardSlotsArray.push(slot);
            slot.node.setSiblingIndex(i);
        });

        disabledCardSlots.forEach((slot, i) => {
            newCardSlotsArray.push(slot);
            slot.node.setSiblingIndex(i + activeCardSlots.length);
        });

        this.cardSlots = newCardSlotsArray;
    }

    private _resetHand(newHand: Hand = null) {
        this.node.emit('hand-card-clear-selection');

        let newHandCopy: Card[] = [];
        if (newHand) {
            newHand.getCards().forEach((card) => {
                newHandCopy.push(new Card(card.rank, card.suit, card.type));
            });
        }

        if (newHand && this._currentHand) {
            this._currentHand.getCards().forEach((card) => {
                let existingCard = newHand.getCards().find((cardInHand) => cardInHand.equals(card));
                if (!existingCard) {
                    this._currentHand.removeCard(card);
                }
            });

            this.layoutNode.children.forEach((cardSlot) => {
                const slot = cardSlot.getComponent(GripCardSlot);

                if (!slot.canAddCard()) {
                    let existingCard = newHandCopy.find((cardInHand) => cardInHand.equals(slot.activeCard.getCard()));

                    if (!existingCard) {
                        const removedCard = slot.removeCardFromSlot(this.node);

                        const cardIndex = this._cardsInGrip.indexOf(removedCard);

                        if (cardIndex !== -1) {
                            this._cardsInGrip.splice(cardIndex, 1);
                        }

                        removedCard.node.destroy();
                    } else {
                        newHandCopy.splice(newHandCopy.indexOf(existingCard), 1);
                    }
                }
            });

            return;
        }

        this.layoutNode.children.forEach((cardSlot) => {
            const slot = cardSlot.getComponent(GripCardSlot);

            if (!slot.canAddCard()) {
                const removedCard = slot.removeCardFromSlot(this.node);
                removedCard.node.destroy();
            }
        });
    }

    private _onDragStarted() {
        let slotToActivate = this.cardSlots.find((slot) => slot.node.active === false);

        if (slotToActivate != null) {
            slotToActivate.node.active = true;
            this._activeOpenSlot = slotToActivate;
            this._activeDraggable = this._dragManager.getActiveDraggable();
        }
    }

    private _onDragEnded(droppedOnBoard: boolean, cardReplaced: boolean) {
        this._activeOpenSlot = null;
        this._activeDraggable = null;

        if (droppedOnBoard && !cardReplaced) {
            for (const cardSlot of this.cardSlots) {
                if (cardSlot.canAddCard() && cardSlot.node.active) {
                    cardSlot.node.active = false;
                    return;
                }
            }
        }
    }

    public returnCardsToHand(cardsReturned: GripCard[]) {
        const availableSlots = this.cardSlots.filter((slot) => slot.canAddCard());

        if (availableSlots.length < cardsReturned.length) {
            this._log.error('PlayerHand: Error returning cards. Not enough available slots');
            return;
        }

        cardsReturned.forEach((card, index) => {
            availableSlots[index].node.active = true;

            card.tweenPosition(availableSlots[index].node.getWorldPosition(), () => {
                this._addCardToHand(cardsReturned[index].getCard(), cardsReturned[index], availableSlots[index], false);
            });
        });
    }

    public ClaimDraggable(draggable: IDraggable, eventString: string) {
        const gripCardToPlay: GripCard = draggable.GetNode().getComponent(GripCard);
        const activeSlot = this.cardSlots.find((slot) => slot.node.active === true && slot.canAddCard());

        if (activeSlot === null || activeSlot === undefined) {
            for (const cardSlot of this.cardSlots) {
                if (cardSlot.canAddCard()) {
                    cardSlot.node.active = true;

                    gripCardToPlay.tweenPosition(cardSlot.node.getWorldPosition(), () => {
                        this._addCardToHand(gripCardToPlay.getCard(), draggable, cardSlot, false);
                    });
                    return;
                }
            }
        } else {
            gripCardToPlay.tweenPosition(activeSlot.node.getWorldPosition(), () => {
                if (draggable.GetActiveTarget() === this) {
                    this._addCardToHand(gripCardToPlay.getCard(), draggable, activeSlot, false, () => {}, false);
                } else {
                    this._addCardToHand(gripCardToPlay.getCard(), draggable, activeSlot, false);
                }
            });

            return;
        }

        this._log.error('PlayerHand: Error, No Available Slot to return to');
    }

    public CanClaim(): boolean {
        return true;
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

    private _onMouseEnter() {
        this._mouseHoveringOverHand = true;
    }

    private _onMouseLeave() {
        this._mouseHoveringOverHand = false;
    }

    // Sort functions
    public static SortByRank(a: GripCardSlot, b: GripCardSlot): number {
        const rankA = a.activeCard.getCard().rank;
        const rankB = b.activeCard.getCard().rank;

        if (rankA === 1 && rankB === 0) return -1;
        if (rankA === 0 && rankB === 1) return 1;
        if (rankA === 1 || rankA === 0) return 1;
        if (rankB === 1 || rankB === 0) return -1;

        return rankA - rankB;
    }

    public static SortBySuit(a: GripCardSlot, b: GripCardSlot): number {
        const suitA = a.activeCard.getCard().suit;
        const suitB = b.activeCard.getCard().suit;

        if (suitA === 0) return 1;
        if (suitB === 0) return -1;

        return suitA - suitB;
    }

    public static Shuffle(): number {
        return Math.random() - 0.5;
    }

    public getCardWorldPosition(cardIndex: number | null): Vec3 {
        if (!cardIndex || cardIndex < 0 || cardIndex > this.cardSlots.length) {
            // Pick first slot that has a card
            cardIndex = this.cardSlots.findIndex((cs) => cs.activeCard !== null);
        }

        cardIndex = Math.max(cardIndex, 0);
        return this.cardSlots[cardIndex].node.getWorldPosition();
    }
}
