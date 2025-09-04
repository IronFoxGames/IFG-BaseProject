import { _decorator, Animation, Component, instantiate, Node, Prefab, tween, Vec3 } from 'cc';
import { Card } from '../core';
import { logger } from '../logging';
import { CardVisual } from './CardVisual';
import { Gameboard } from './Gameboard';
import { CardTransformer } from './ui/CardTransformer';

const { ccclass, property } = _decorator;

@ccclass
export class PlayedCard extends Component {
    @property
    placedDropScale: number = 1.5;

    @property
    selectedTweenDuration: number = 0.6;

    @property(Prefab)
    cardVisualPrefab: Prefab = null;

    @property(CardTransformer)
    cardTransformer: CardTransformer = null;

    private _log = logger.child('PlayedCard');

    private _cardVisualInstance: CardVisual;
    private _animationParent: Node = null;
    private _activeCardParent: Node = null;
    private _gridParent: Node = null;
    private _gameboard: Gameboard = null;
    private _cardStatusList: PlayedCardState[] = [];

    public get CardStatusList() {
        return this._cardStatusList;
    }

    public get IsBurnt() {
        return this._cardStatusList.includes(PlayedCardState.Burnt);
    }

    onLoad() {}

    start() {}

    update(deltaTime: number) {}

    public setCardPlaced(
        card: Card,
        originalCard: Card,
        animate: boolean = false,
        animationParentNode: Node,
        gridParentNode: Node,
        activeCardParentNode: Node,
        gameboard: Gameboard,
        onAnimComplete: () => void = () => {}
    ) {
        this.node.active = true;

        this._animationParent = animationParentNode;
        this._gridParent = gridParentNode;
        this._activeCardParent = activeCardParentNode;

        if (this._gameboard === null && gameboard !== null) {
            this._gameboard = gameboard;
        }

        this._cardVisualInstance = instantiate(this.cardVisualPrefab)?.getComponent(CardVisual);
        if (this._cardVisualInstance) {
            this._cardVisualInstance.node.parent = this.node;
            this._cardVisualInstance.setToCard(card, originalCard);
        }

        // The drop animation expands and all the sprites are near one another so layering is tricky:
        // Move new (dropped cards) to a node rendered later than the board grid until it settles, then move it
        // back to the grid so that it's behind any future card drops.
        if (animate) {
            this.node.parent = animationParentNode;
            this.node.setWorldPosition(gridParentNode.getWorldPosition());
            this._animateDrop(() => {
                if (this._gameboard.currentWorkingTiles.length === 5) {
                    this.node.parent = activeCardParentNode;
                    this.node.setWorldPosition(gridParentNode.getWorldPosition());

                    this.toggleCardTransformer(true);

                    this.cardTransformer.playUnconfirmedAnimation();
                    this.cardTransformer.cardAnimator.once(Animation.EventType.FINISHED, () => {
                        onAnimComplete();
                    });
                } else {
                    this.node.parent = gridParentNode;
                    this.node.setPosition(Vec3.ZERO);

                    this.toggleCardTransformer(true);

                    this.cardTransformer.playUnconfirmedAnimation();
                    this.cardTransformer.cardAnimator.once(Animation.EventType.FINISHED, () => {
                        onAnimComplete();
                    });
                }
            });
        } else {
            if (this._gameboard && this._gameboard.currentWorkingTiles.length === 5) {
                this.node.parent = activeCardParentNode;
            } else {
                this.node.parent = gridParentNode;
            }
        }

        this.cardTransformer.setCard(card);
    }

    public setCardLocked(locked: boolean) {
        if (this._cardVisualInstance) {
            this.node.parent = this._gridParent;
            this.node.setWorldPosition(this._gridParent.getWorldPosition());
            this._cardVisualInstance.setLocked(locked);
            this.cardTransformer.playLockedAnimation();
            this.cardTransformer.cardAnimator.once(Animation.EventType.FINISHED, () => {
                this.toggleCardTransformer(false);
            });
        }
    }

    public addCardStatus(status: PlayedCardState) {
        if (this._cardStatusList.includes(status)) {
            this._log.warn(`${status.toString()} is already in the status list. Ignoring.`);
            return;
        }

        this._cardStatusList.push(status);

        if (status == PlayedCardState.Burnt) {
            this.burnCard();
        }
    }

    public removeCardStatus(status: PlayedCardState) {
        if (!this._cardStatusList.includes(status)) {
            this._log.warn(`Cannot remove ${status.toString()} from status list. It does not exist in the list`);
            return;
        }

        var index = this._cardStatusList.indexOf(status);

        if (index !== -1) {
            this._cardStatusList.splice(index, 1);

            if (status === PlayedCardState.Burnt) {
                this._cardVisualInstance.setBurnt(false);
            }
        }
    }

    public burnCard() {
        this.toggleCardTransformer(true);

        this.cardTransformer.playBurnAnim(() => {
            this._cardVisualInstance.setBurnt(true);
            this.toggleCardTransformer(false);
        });
    }

    public toggleCardTransformer(active: boolean) {
        this.node.children.forEach((child) => {
            child.active = !active;
        });

        this.cardTransformer.playIdleAnim();
        this.cardTransformer.node.active = active;
    }

    public resetParentToGrid() {
        this.node.parent = this._gridParent;
        this.node.setWorldPosition(this._gridParent.getWorldPosition());
    }

    public playDropAnimation(onComplete: () => void) {
        this.node.parent = this._animationParent;
        this.node.setWorldPosition(this._gridParent.getWorldPosition());
        this._animateDrop(() => {
            this.node.parent = this._gridParent;
            this.node.setPosition(Vec3.ZERO);
            onComplete();
        });
    }

    private _animateDrop(completeCallback: () => void) {
        this.node.setScale(new Vec3(this.placedDropScale, this.placedDropScale, this.placedDropScale));
        tween(this.node)
            .to(
                this.selectedTweenDuration,
                {
                    scale: new Vec3(1, 1, 1)
                },
                { easing: 'bounceOut' }
            )
            .call(() => {
                completeCallback();
            })
            .start();
    }
}

export enum PlayedCardState {
    Default = 'Default',
    Burnt = 'Burnt'
}
