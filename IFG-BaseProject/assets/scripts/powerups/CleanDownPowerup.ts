import { director, instantiate, Node, Prefab } from 'cc';
import { SoundManager } from '../audio/SoundManager';
import { CardPlacement } from '../core';
import { BoardModifierType } from '../core/enums/BoardModifierType';
import { PowerupType } from '../core/enums/BoosterType';
import { PowerupUsageContext } from '../core/model/PowerupUsageContext';
import { BoardModifierVisual } from '../game/BoardModifierVisual';
import { BoardTile } from '../game/BoardTile';
import { CardScrambleGameController } from '../game/CardScrambleGameController';
import { PlayedCard } from '../game/PlayedCard';
import { CardTransformer } from '../game/ui/CardTransformer';
import { CleanDownConfirmationView } from '../game/ui/CleanDownConfirmationView';
import { logger } from '../logging';
import { TutorialService } from '../services/TutorialService';
import { Powerup } from './Powerup';

export class CleanDownPowerup extends Powerup {
    private _cleanDownConfirmationPrefab: Prefab;
    private _cleanDownConfirmationInstance: Node;
    private _cardTileIndicesToRemove: number[] = [];
    private _modifiersToRemove: BoardModifierVisual[] = [];
    private _affectedBurnedTiles: BoardTile[] = [];
    private _burntCardsToClean: PlayedCard[] = [];
    private _numAffectedTurns: number = 0;
    private _savedTileParents: Node[] = [];
    private _savedCardParents: Node[] = [];
    private _log = logger.child('CleanDownPowerup');

    public constructor(gameController: CardScrambleGameController, cleanDownPrefab: Prefab) {
        super(gameController);
        this._powerupType = PowerupType.CleanDown;
        this._cleanDownConfirmationPrefab = cleanDownPrefab;
    }

    public PreparePowerup(tutorialService?: TutorialService) {
        this._isPreparing = true;

        this._cleanDownConfirmationInstance = instantiate(this._cleanDownConfirmationPrefab);
        this._cleanDownConfirmationInstance.parent = this._gameController.uiManager.HUD.node;

        this._cleanDownConfirmationInstance.on(CleanDownConfirmationView.OnConfirmPressedEvent, this._onPowerupApplied, this);
        this._cleanDownConfirmationInstance.on(CleanDownConfirmationView.OnCancelPressedEvent, this.CancelPreparation, this);

        this._cardTileIndicesToRemove = this.getTilesToRemove(true);

        this._gameController.Gameboard.boardTiles.forEach((tile) => {
            if (tile.getBoardModifier() && tile.getBoardModifier().type === BoardModifierType.BurnedTile) {
                if (tile.boardModifierVisual) {
                    this._modifiersToRemove.push(tile.boardModifierVisual);
                    this._affectedBurnedTiles.push(tile);
                    this._savedTileParents.push(tile.boardModifierVisual.node.parent);
                    let pos = tile.boardModifierVisual.node.getWorldPosition();
                    let scale = tile.boardModifierVisual.node.getWorldScale();
                    tile.boardModifierVisual.node.parent = this._gameController.uiManager.HUD.node;
                    tile.boardModifierVisual.node.setWorldPosition(pos);
                    tile.boardModifierVisual.node.setWorldScale(scale);
                    tile.boardModifierVisual.playCleanDownIdleAnim();
                }
            }

            if (tile.placedCard) {
                let playedCard = tile.placedCard;

                if (playedCard.IsBurnt && !this._cardTileIndicesToRemove.includes(tile.index) && !this._burntCardsToClean.includes(playedCard)) {
                    this._burntCardsToClean.push(playedCard);
                    this._savedCardParents.push(playedCard.node.parent);
                    let pos = playedCard.node.getWorldPosition();
                    let scale = playedCard.node.getWorldScale();
                    playedCard.node.parent = this._gameController.uiManager.HUD.node;
                    playedCard.node.setWorldPosition(pos);
                    playedCard.node.setWorldScale(scale);
                    playedCard.toggleCardTransformer(true);

                    let cardTransformer = playedCard.getComponentInChildren(CardTransformer);
                    cardTransformer.playCleanDownIdleAnim();
                }
            }
        });

        this._cardTileIndicesToRemove.forEach((tileIndex) => {
            let playedCard = this._gameController.Gameboard.boardTiles[tileIndex].placedCard;

            if (playedCard) {
                let pos = playedCard.node.getWorldPosition();
                let scale = playedCard.node.getWorldScale();
                playedCard.node.parent = this._gameController.uiManager.HUD.node;
                playedCard.node.setWorldPosition(pos);
                playedCard.node.setWorldScale(scale);
                playedCard.toggleCardTransformer(true);

                let cardTransformer = playedCard.getComponentInChildren(CardTransformer);
                cardTransformer.playCleanDownIdleAnim();
            }
        });

        if (this._gameController.giveUpView && this._gameController.giveUpView.node) {
            this._gameController.giveUpView.node.active = false;
        }
        this._gameController.blockBoardInteraction(true);
        this._gameController.uiManager.HUD.BlockHUDInteraction(true);
        this._gameController.currentPlayerHand.setHandInteractable(false);
    }

    public CancelPreparation() {
        if (this._isPreparing) {
            if (this._cleanDownConfirmationInstance) {
                this._cleanDownConfirmationInstance.off(CleanDownConfirmationView.OnConfirmPressedEvent, this._onPowerupApplied, this);
                this._cleanDownConfirmationInstance.off(CleanDownConfirmationView.OnCancelPressedEvent, this.CancelPreparation, this);

                this._cleanDownConfirmationInstance.destroy();
                this._cleanDownConfirmationInstance = null;
            }

            this._modifiersToRemove.forEach((boardModifierVisual, index) => {
                if (boardModifierVisual) {
                    let pos = boardModifierVisual.node.getWorldPosition();
                    let scale = boardModifierVisual.node.getWorldScale();
                    boardModifierVisual.node.parent = this._savedTileParents[index];
                    boardModifierVisual.node.setWorldPosition(pos);
                    boardModifierVisual.node.setWorldScale(scale);
                    boardModifierVisual.stopCleanDownIdleAnim();
                }
            });

            this._burntCardsToClean.forEach((playedCard, index) => {
                let pos = playedCard.node.getWorldPosition();
                let scale = playedCard.node.getWorldScale();
                playedCard.node.parent = this._savedCardParents[index];
                playedCard.node.setWorldPosition(pos);
                playedCard.node.setWorldScale(scale);
                playedCard.toggleCardTransformer(false);
            });

            this._cardTileIndicesToRemove.forEach((tileIndex) => {
                let playedCard = this._gameController.Gameboard.boardTiles[tileIndex].placedCard;

                if (playedCard) {
                    let pos = playedCard.node.getWorldPosition();
                    let scale = playedCard.node.getWorldScale();
                    playedCard.node.parent = this._gameController.Gameboard.boardTiles[tileIndex].node;
                    playedCard.node.setWorldPosition(pos);
                    playedCard.node.setWorldScale(scale);
                    playedCard.toggleCardTransformer(false);
                }
            });

            director.emit(Powerup.OnPowerupPreparedEvent, false);
            if (this._gameController.giveUpView && this._gameController.giveUpView.node) {
                this._gameController.giveUpView.closeView();
            }
            this._gameController.blockBoardInteraction(false);
            this._gameController.uiManager.HUD.BlockHUDInteraction(false);
            this._gameController.currentPlayerHand.setHandInteractable(true);
            this._isPreparing = false;
            this._numAffectedTurns = 0;
        }
    }

    public ApplyPowerup() {
        this._isPreparing = false;

        if (this._cleanDownConfirmationInstance) {
            this._cleanDownConfirmationInstance.off(CleanDownConfirmationView.OnConfirmPressedEvent, this._onPowerupApplied, this);
            this._cleanDownConfirmationInstance.off(CleanDownConfirmationView.OnCancelPressedEvent, this.CancelPreparation, this);

            this._cleanDownConfirmationInstance.destroy();
            this._cleanDownConfirmationInstance = null;
        }

        SoundManager.instance.playSound('SFX_Gameplay_CleanDown');

        let updatedCardPlacements: CardPlacement[] = [];

        this._modifiersToRemove.forEach((boardModifierVisual, index) => {
            let pos = boardModifierVisual.node.getWorldPosition();
            let scale = boardModifierVisual.node.getWorldScale();
            boardModifierVisual.node.parent = this._savedTileParents[index];
            boardModifierVisual.node.setWorldPosition(pos);
            boardModifierVisual.node.setWorldScale(scale);
        });

        this._burntCardsToClean.forEach((playedCard, index) => {
            let pos = playedCard.node.getWorldPosition();
            let scale = playedCard.node.getWorldScale();
            playedCard.node.parent = this._savedCardParents[index];
            playedCard.node.setWorldPosition(pos);
            playedCard.node.setWorldScale(scale);

            let cardTransformer = playedCard.getComponentInChildren(CardTransformer);
            cardTransformer.playIdleAnim();
        });

        this._cardTileIndicesToRemove.forEach((tileIndex) => {
            let playedCard = this._gameController.Gameboard.boardTiles[tileIndex].placedCard;

            if (playedCard) {
                let pos = playedCard.node.getWorldPosition();
                let scale = playedCard.node.getWorldScale();
                playedCard.node.parent = this._gameController.Gameboard.boardTiles[tileIndex].node;
                playedCard.node.setWorldPosition(pos);
                playedCard.node.setWorldScale(scale);

                let cardTransformer = playedCard.getComponentInChildren(CardTransformer);
                cardTransformer.playIdleAnim();
            }

            updatedCardPlacements.push(new CardPlacement(tileIndex, null));
        });

        this._gameController.uiManager.HUD.enableGiveupButton(false);
        this._gameController.CleanDownBurnedTilesAndCards(this._affectedBurnedTiles, this._burntCardsToClean);
        this._gameController.Gameboard.removeCardsPlayedOnTiles(this._cardTileIndicesToRemove, 0, () => {
            let powerupUsageContext = new PowerupUsageContext(this._powerupType, false, updatedCardPlacements, this._numAffectedTurns);
            this._gameController.onPowerupApplicationComplete(powerupUsageContext);
            this._numAffectedTurns = 0;
        });
    }

    public getTilesToRemove(isRemoving: boolean): number[] {
        let numHandsToRemove = Math.min(5, this._gameController.match.state.turns.length);
        let tilesToRemove: number[] = [];

        for (let i = this._gameController.match.state.turns.length - 1, count = 0; i >= 0 && count < numHandsToRemove; i--, count++) {
            let turn = this._gameController.match.state.turns[i];

            let previousCleanDownUsages = turn.powerupUsages.filter((usage) => usage.powerupType === PowerupType.CleanDown);
            let numIngnoredTurns = 0;
            let ignoredTurnsToCheck = 0;

            if (previousCleanDownUsages && previousCleanDownUsages.length > 0) {
                previousCleanDownUsages.forEach((usage) => {
                    numIngnoredTurns += usage.numAffectedTurns;
                    ignoredTurnsToCheck += usage.numAffectedTurns - 1;
                });

                let indexToCheck = i - 1;
                let checkedCount = 0;

                while (checkedCount < ignoredTurnsToCheck) {
                    let powerupUsagesInIgnoredTurns = this._gameController.match.state.turns[indexToCheck]?.powerupUsages.filter(
                        (usage) => usage.powerupType === PowerupType.CleanDown
                    );

                    if (powerupUsagesInIgnoredTurns && powerupUsagesInIgnoredTurns.length > 0) {
                        powerupUsagesInIgnoredTurns.forEach((usage) => {
                            numIngnoredTurns += usage.numAffectedTurns;
                            ignoredTurnsToCheck += usage.numAffectedTurns - 1;
                        });
                    }

                    checkedCount++;
                    indexToCheck--;
                }
            }

            if (numIngnoredTurns > 0) {
                i -= numIngnoredTurns;
                count--;
                i++;
                continue;
            }

            if (turn.cardPlacements[0].boardIndex < 0) {
                //this is a scored turn with no card placements, skip this turn
                count--;
                continue;
            }

            turn.cardPlacements.forEach((cardPlacement) => {
                tilesToRemove.push(cardPlacement.boardIndex);
            });

            if (isRemoving) {
                this._numAffectedTurns++;
            }
        }

        return tilesToRemove;

        //TODO: TECHDEBT: There might be a much simpler way to do this by just looping backwards through the turns and checking if the cards played on those turns still exist on the board.
        //If they do, then remove them and count that as 1 out of 5
        //If they no longer exist, then ignore that turn
    }

    private async _onPowerupApplied() {
        if (this._gameController.giveUpView && this._gameController.giveUpView.node) {
            await this._gameController.giveUpView.onPowerupUsed(this);
        } else {
            await this._gameController.uiManager.HUD.onPowerupUsed(this);
        }
    }
}
