import { _decorator, Animation, Component, Label, Node, Sprite, SpriteFrame, tween, UIOpacity, Vec3 } from 'cc';
import { SoundManager } from '../audio/SoundManager';
import { MatchOperations } from '../core';
import { BoardModifierType } from '../core/enums/BoardModifierType';
import { BoardModifier, BreakableWallModifier, HandMultiplierModifier } from '../core/model/BoardModifier';
import { BoardTile } from './BoardTile';
import { Gameboard } from './Gameboard';

const { ccclass, property } = _decorator;

class BindTarget {
    alpha: number;
}

@ccclass
export class BoardModifierVisual extends Component {
    @property(Label)
    countdown: Label | null = null;

    @property(Node)
    blockerNode: Node | null = null;

    @property(Node)
    handMulitplierNode: Node | null = null;

    @property(Label)
    handMultiplierText: Label | null = null;

    @property(Node)
    breakableWallNode: Node | null = null;

    @property(Sprite)
    rankOnlySprite: Sprite | null = null;

    @property(Sprite)
    suitOnlySprite: Sprite | null = null;

    @property(Sprite)
    rankSprite: Sprite | null = null;

    @property(Sprite)
    suitSprite: Sprite | null = null;

    @property(Node)
    breakableWallReinforcedImage: Node | null = null;

    @property(SpriteFrame)
    multiplierSprites: SpriteFrame[] = [];

    @property(SpriteFrame)
    suitSprites: SpriteFrame[] = [];

    @property(SpriteFrame)
    rankSprites: SpriteFrame[] = [];

    @property(Node)
    burningFoodNode: Node | null = null;

    @property(Node)
    burnedTileNode: Node | null = null;

    @property(Node)
    tileHighlight: Node | null = null;

    @property(UIOpacity)
    uiOpacity: UIOpacity | null = null;

    private _boardModifier: BoardModifier = null;
    private _turnCounter: number = -1;
    private _animationParent: Node = null;
    private _modifierAnim: Animation;
    private _boardTile: BoardTile = null;
    private _gameboard: Gameboard;
    private _warningDone: boolean = false;

    onLoad() {
        this._modifierAnim = this.node.getComponent(Animation);
    }

    public init(boardModifier: BoardModifier, animationParentNode: Node, boardTile: BoardTile, gameboard: Gameboard) {
        this._boardModifier = boardModifier;
        this._turnCounter = boardModifier.expiresTurnCount;
        this._animationParent = animationParentNode;
        this._boardTile = boardTile;
        this._gameboard = gameboard;

        // Disable all nodes in prefab
        this.blockerNode.active = false;
        this.handMulitplierNode.active = false;
        this.breakableWallNode.active = false;
        this.burningFoodNode.active = false;
        this.burnedTileNode.active = false;

        // enable the appropriate node depending on modifier type
        switch (this._boardModifier.type) {
            case BoardModifierType.None:
                break;
            case BoardModifierType.BreakableWall: {
                const breakableWallModifier = boardModifier as BreakableWallModifier;
                this.breakableWallNode.active = true;
                this.breakableWallReinforcedImage.active = breakableWallModifier.reinforced;

                this.suitOnlySprite.node.active = breakableWallModifier.requiredRank === -1 && breakableWallModifier.requiredSuit > -1;
                this.rankOnlySprite.node.active = breakableWallModifier.requiredRank > -1 && breakableWallModifier.requiredSuit === -1;
                this.rankSprite.node.active = breakableWallModifier.requiredRank > -1 && breakableWallModifier.requiredSuit > -1;
                this.suitSprite.node.active = breakableWallModifier.requiredRank > -1 && breakableWallModifier.requiredSuit > -1;

                if (this.rankSprite.node.active) {
                    this.rankSprite.spriteFrame = this.rankSprites[breakableWallModifier.requiredRank - 1];
                }

                if (this.rankOnlySprite.node.active) {
                    this.rankOnlySprite.spriteFrame = this.rankSprites[breakableWallModifier.requiredRank - 1];
                }

                if (this.suitSprite.node.active) {
                    this.suitSprite.spriteFrame = this.suitSprites[breakableWallModifier.requiredSuit - 1];
                }

                if (this.suitOnlySprite.node.active) {
                    this.suitOnlySprite.spriteFrame = this.suitSprites[breakableWallModifier.requiredSuit - 1];
                }

                break;
            }
            case BoardModifierType.HandMultiplier: {
                const handMultiplierModifier = boardModifier as HandMultiplierModifier;
                this.handMulitplierNode.active = true;
                this.handMulitplierNode.getComponent(Sprite).spriteFrame =
                    handMultiplierModifier.multiplier === 2 ? this.multiplierSprites[0] : this.multiplierSprites[1];
                this.handMultiplierText.string = `X${handMultiplierModifier.multiplier}`;
                break;
            }
            case BoardModifierType.BurningFood: {
                this.burningFoodNode.active = true;

                this._updateBurningFoodVisuals(boardModifier);

                break;
            }
            case BoardModifierType.BurnedTile:
                this.burnedTileNode.active = true;
                break;
        }

        if (this._boardModifier.expires) {
            this.countdown.node.active = true;
            this.countdown.string = `${this._turnCounter}`;
        }
    }

    public get boardModifier(): BoardModifier {
        return this._boardModifier;
    }

    public get turnCounter(): number {
        return this._turnCounter;
    }

    public decrementCounter() {
        this._turnCounter--;
        this.countdown.string = `${this._turnCounter}`;
    }

    public updateVisuals(currentModifierState: BoardModifier) {
        if (this._boardModifier.expires && this._turnCounter != currentModifierState.expiresTurnCount) {
            this._turnCounter = currentModifierState.expiresTurnCount;
            this._tweenStateChange(() => {
                this.countdown.string = `${this._turnCounter}`;
            });
        }

        if (currentModifierState.type === BoardModifierType.BreakableWall) {
            const breakableWallModifier = currentModifierState as BreakableWallModifier;

            if (this.breakableWallReinforcedImage.active && !breakableWallModifier.reinforced) {
                this._tweenWallReinforcementCleared(() => {
                    this.breakableWallReinforcedImage.active = false;
                });
            }
        } else if (currentModifierState.type === BoardModifierType.BurningFood) {
            this.burningFoodNode.active = true;

            this._updateBurningFoodVisuals(currentModifierState);
        }
    }

    private _updateBurningFoodVisuals(burningFoodModifier: BoardModifier) {
        if (burningFoodModifier.expiresTurnCount > 3) {
            this._modifierAnim.play('BurningFood-LowIdle');
        } else if (burningFoodModifier.expiresTurnCount > 1) {
            this._modifierAnim.play('BurningFood-MidIdle');
        } else if (burningFoodModifier.expiresTurnCount === 1) {
            this._modifierAnim.play('BurningFood-ExtremeIdle');
            
            if (!this._warningDone) {
                this._warningDone = true;
                SoundManager.instance.playSound('SFX_Gameplay_BurningFood_Warning');
            }

            const adjacentIndices = MatchOperations.GetAdjacentIndices(this._boardTile.index, this._gameboard.gameBoardModel.tiles);

            adjacentIndices.forEach((adjacentIndex) => {
                if (this._gameboard.boardTiles[adjacentIndex].isDeadTile()) {
                    return;
                }

                this._gameboard.boardTiles[adjacentIndex].toggleNextTurnBurnAnim(true);
            });
        }
    }

    public playWallAnim(clip: number) {
        const clips = this._modifierAnim.clips;

        this._modifierAnim.play(clips[clip].name);
    }

    public playCleanDownIdleAnim() {
        this._modifierAnim.play('cleandown-burned-idle');
    }

    public stopCleanDownIdleAnim() {
        this._modifierAnim.stop();
        this.tileHighlight.active = false;
    }

    public playCleanDownActivateAnim(onComplete: () => void) {
        this._modifierAnim.play('cleandown-burned-activate');

        this._modifierAnim.once(Animation.EventType.FINISHED, onComplete, this);
    }

    public activateTileBurn(onComplete: () => void = () => {}) {
        //Deactivate the pulsing burn anim when it becomes fully burnt
        this._gameboard.boardTiles[this._boardTile.index].toggleNextTurnBurnAnim(false);

        this._modifierAnim.play('Tile-Burn');
        this._modifierAnim.once(Animation.EventType.FINISHED, onComplete);
    }

    public activateBurningFood(onComplete: () => void = () => {}) {
        const adjacentIndices = MatchOperations.GetAdjacentIndices(this._boardTile.index, this._gameboard.gameBoardModel.tiles);

        adjacentIndices.forEach((adjacentIndex) => {
            this._gameboard.boardTiles[adjacentIndex].toggleNextTurnBurnAnim(false);
        });

        this._modifierAnim.play('BurningFood-Activate');
        SoundManager.instance.playSound('SFX_Gameplay_RefireIgnite');
        this._modifierAnim.once(Animation.EventType.FINISHED, onComplete);
    }

    public expireModifier(onCompleteCallback: () => void) {
        this._turnCounter = 0;
        this.countdown.string = `${this._turnCounter}`;

        if (this._boardModifier.type === BoardModifierType.BreakableWall) {
            this.playWallAnim(1);

            this._modifierAnim.once(Animation.EventType.FINISHED, () => {
                onCompleteCallback();
            });
        } else {
            this._tweenModifierCleared(onCompleteCallback);
        }
    }

    private _tweenStateChange(onFlipCounterCallback: () => void) {
        const previousParent = this.node.parent;
        this.node.parent = this._animationParent;
        this.node.setWorldPosition(previousParent.getWorldPosition());
        tween(this.node)
            .to(
                0.5,
                {
                    scale: new Vec3(1.2, 1.2, 1.2)
                },
                { easing: 'elasticInOut' }
            )
            .call(() => {
                onFlipCounterCallback();
            })
            .to(
                0.5,
                {
                    scale: new Vec3(1.0, 1.0, 1.0)
                },
                { easing: 'elasticInOut' }
            )
            .call(() => {
                this.node.parent = previousParent;
                this.node.setPosition(Vec3.ZERO);
            })
            .start();
    }

    private _tweenModifierCleared(onCompleteCallback: () => void) {
        tween(this.node)
            .to(
                0.5,
                {
                    scale: new Vec3(1.2, 1.2, 1.2)
                },
                { easing: 'elasticInOut' }
            )
            .call(() => {
                tween(this.uiOpacity)
                    .to(0.5, {
                        opacity: 0
                    })
                    .call(onCompleteCallback)
                    .start();
            })
            .start();
    }

    private _tweenWallReinforcementCleared(onCompleteCallback: () => void) {
        tween(this.node)
            .to(0.1, { eulerAngles: new Vec3(0, 0, 5) })
            .to(0.1, { eulerAngles: new Vec3(0, 0, -5) })
            .to(0.1, { eulerAngles: new Vec3(0, 0, 5) })
            .to(0.1, { eulerAngles: new Vec3(0, 0, -5) })
            .to(0.1, { eulerAngles: new Vec3(0, 0, 0) })
            .to(0.1, { scale: new Vec3(1.2, 1.2, 1.2) })
            .call(onCompleteCallback)
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .start();
    }
}
