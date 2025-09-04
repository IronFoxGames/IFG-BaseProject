import { Powerup } from './Powerup';
import { Card, MatchOperations } from '../core';
import { CardScrambleGameController } from '../game/CardScrambleGameController';
import { PowerupType } from '../core/enums/BoosterType';
import { director } from 'cc';
import { PowerupUsageContext } from '../core/model/PowerupUsageContext';
import { GripCard } from '../game/GripCard';
import { logger } from '../logging';
import { Prefab } from 'cc';
import { instantiate, Node, Animation } from 'cc';
import { RefireGripSelector } from '../game/ui/RefireGripSelector';
import { CardTransformer } from '../game/ui/CardTransformer';
import { SoundManager } from '../audio/SoundManager';
import { TutorialService } from '../services/TutorialService';
import { Vec3 } from 'cc';

export class RefirePowerup extends Powerup {
    private _selectedCardsToBurn: GripCard[] = [];
    private _selectedIndices: number[] = [];
    private _log = logger.child('RefirePowerup');
    private _gripSelectorPrefab: Prefab;
    private _gripSelectorInstance: Node = null;
    private _gripSelectorComponent: RefireGripSelector = null;
    private _savedCardParents: Node[] = [];

    public constructor(gameController: CardScrambleGameController, gripSelectorPrefab: Prefab) {
        super(gameController);
        this._powerupType = PowerupType.Refire;
        this._gripSelectorPrefab = gripSelectorPrefab;
    }

    public PreparePowerup(tutorialService?: TutorialService) {
        if (this._gameController.match.state.deck.length >= 1) {
            this._isPreparing = true;
            this._savedCardParents = [];

            this._gripSelectorInstance = instantiate(this._gripSelectorPrefab);
            this._gripSelectorInstance.parent = this._gameController.uiManager.HUD.node;
            this._gripSelectorComponent = this._gripSelectorInstance.getComponent(RefireGripSelector);
            this._gripSelectorComponent.node.on(RefireGripSelector.OnClosedEvent, this.CancelPreparation, this);
            this._gripSelectorComponent.node.on(RefireGripSelector.OnConfirmedEvent, this._onPowerupUsed, this);
            this._gripSelectorComponent.playOpenAnim();

            let cardsInGrip = this._gameController.currentPlayerHand.getCardsInGrip();
            cardsInGrip.forEach((gripCard) => {
                if (gripCard.selected) {
                    gripCard.unselectCard();
                    gripCard.node.setScale(Vec3.ONE);
                }
                gripCard.setHighlighted(true);
                gripCard.node.on(GripCard.OnHighlightedCardTappedEvent, this._onCardSelected, this);

                this._savedCardParents.push(gripCard.node.parent);
                let pos = gripCard.node.getWorldPosition();
                let scale = gripCard.node.getWorldScale();

                gripCard.node.parent = this._gameController.uiManager.HUD.node;
                gripCard.node.setWorldPosition(pos);
                gripCard.node.setWorldScale(scale);
                gripCard.toggleCardTransformer(true);
            });

            this._gameController.Gameboard.clearCardInGripSelection();

            this._selectedCardsToBurn = [];
            this._selectedIndices = [];
        } else {
            this._log.warn('Deck does not have enough cards to use this powerup');
        }
    }

    public CancelPreparation() {
        if (this._isPreparing) {
            let cardsInGrip = this._gameController.currentPlayerHand.getCardsInGrip();
            cardsInGrip.forEach((gripCard, index) => {
                gripCard.setHighlighted(false);
                gripCard.node.off(GripCard.OnHighlightedCardTappedEvent, this._onCardSelected, this);

                let pos = gripCard.node.getWorldPosition();
                let scale = gripCard.node.getWorldScale();
                gripCard.node.parent = this._savedCardParents[index];
                gripCard.node.setWorldPosition(pos);
                gripCard.node.setWorldScale(scale);
                gripCard.toggleCardTransformer(false);
            });

            this._savedCardParents = [];
            this._selectedCardsToBurn = [];
            this._selectedIndices = [];
            this._gameController.setPowerupActive(false);
            this._isPreparing = false;

            this._gripSelectorComponent.node.off(RefireGripSelector.OnClosedEvent, this.CancelPreparation, this);
            this._gripSelectorComponent.node.off(RefireGripSelector.OnConfirmedEvent, this._onPowerupUsed, this);

            this._gripSelectorComponent.closeMenu(() => {
                this._gripSelectorInstance.destroy();
                this._gripSelectorInstance = null;
                this._gripSelectorComponent = null;

                this._isPreparing = false;

                director.emit(Powerup.OnPowerupPreparedEvent, false);
            });

            SoundManager.instance.stopSoundByName('SFX_Gameplay_RefireBurnLoop');
        }
    }

    public ApplyPowerup() {
        this._log.info('Applying Refire Powerup');
        this._isPreparing = false;

        this._selectedCardsToBurn.forEach((gripCard) => {
            let cardTransformer = gripCard.getComponentInChildren(CardTransformer);
            cardTransformer.playRefireConfirmAnim();
        });

        SoundManager.instance.stopSoundByName('SFX_Gameplay_RefireBurnLoop');
        SoundManager.instance.playSound('SFX_Gameplay_RefireBurn');

        this._selectedCardsToBurn[0]
            .getComponentInChildren(CardTransformer)
            .getComponentInChildren(Animation)
            .once(Animation.EventType.FINISHED, () => {
                let cardsInGrip = this._gameController.currentPlayerHand.getCardsInGrip();
                cardsInGrip.forEach((gripCard, index) => {
                    gripCard.setHighlighted(false);
                    gripCard.node.off(GripCard.OnHighlightedCardTappedEvent, this._onCardSelected, this);

                    let pos = gripCard.node.getWorldPosition();
                    let scale = gripCard.node.getWorldScale();
                    gripCard.node.parent = this._savedCardParents[index];
                    gripCard.node.setWorldPosition(pos);
                    gripCard.node.setWorldScale(scale);
                    gripCard.toggleCardTransformer(false);
                });

                MatchOperations.BurnAndRedrawCards(this._gameController, this._selectedIndices);

                let powerupUsageContext = new PowerupUsageContext(this._powerupType, true, null);
                this._gameController.onPowerupApplicationComplete(powerupUsageContext);

                this._savedCardParents = [];
                this._selectedCardsToBurn = [];
                this._selectedIndices = [];
                this._gameController.setPowerupActive(false);
                this._isPreparing = false;

                director.emit(Powerup.OnPowerupPreparedEvent, false);

                this._gripSelectorComponent.node.off(RefireGripSelector.OnClosedEvent, this.CancelPreparation, this);
                this._gripSelectorComponent.node.off(RefireGripSelector.OnConfirmedEvent, this._onPowerupUsed, this);

                this._gripSelectorComponent.closeMenu(() => {
                    this._gripSelectorInstance.destroy();
                    this._gripSelectorInstance = null;
                    this._gripSelectorComponent = null;

                    this._isPreparing = false;

                    director.emit(Powerup.OnPowerupPreparedEvent, false);
                });
            });
    }

    private _onCardSelected(selectedCard: GripCard) {
        let cardsInGrip = this._gameController.currentPlayerHand.getCardsInGrip();
        let cardIndex = cardsInGrip.indexOf(selectedCard);
        let cardTransformer = selectedCard.getComponentInChildren(CardTransformer);

        if (this._selectedCardsToBurn.includes(selectedCard)) {
            this._selectedCardsToBurn.splice(this._selectedCardsToBurn.indexOf(selectedCard), 1);
            this._selectedIndices.splice(this._selectedIndices.indexOf(cardIndex), 1);
            cardTransformer.playIdleAnim();
            SoundManager.instance.playSound('SFX_Gameplay_RefireExtinguish');
            if (this._selectedCardsToBurn.length === 0) {
                SoundManager.instance.stopSoundByName('SFX_Gameplay_RefireBurnLoop');
            }
        } else {
            SoundManager.instance.playSound('SFX_Gameplay_RefireIgnite');
            if (this._selectedCardsToBurn.length === 0) {
                SoundManager.instance.playSound('SFX_Gameplay_RefireBurnLoop');
            }
            this._selectedCardsToBurn.push(selectedCard);
            this._selectedIndices.push(cardIndex);
            cardTransformer.playRefireSelectonAnim();
        }

        if (this._selectedCardsToBurn.length > 0) {
            this._gripSelectorComponent.toggleConfirmButton(true);
        } else {
            this._gripSelectorComponent.toggleConfirmButton(false);
        }
    }

    private async _onPowerupUsed() {
        await this._gameController.uiManager.HUD.onPowerupUsed(this);
    }
}
