import { _decorator, Component, Node } from 'cc';
import { Powerup } from './Powerup';
import { GripCard } from '../game/GripCard';
import { Prefab } from 'cc';
import { instantiate } from 'cc';
import { CardVisual } from '../game/CardVisual';
import { Card, MatchOperations } from '../core';
import { Vec3 } from 'cc';
import { CardScrambleGameController } from '../game/CardScrambleGameController';
import { PowerupType } from '../core/enums/BoosterType';
import { director } from 'cc';
import { PowerupUsageContext } from '../core/model/PowerupUsageContext';
import { CTBGripSelector } from '../game/ui/CTBGripSelector';
import { SoundManager } from '../audio/SoundManager';
import { TutorialService } from '../services/TutorialService';
const { ccclass, property } = _decorator;

@ccclass('CookingTheBooksPowerup')
export class CookingTheBooksPowerup extends Powerup {
    private _selectedCardToChange: GripCard = null;
    private _gripSelectorPrefab: Prefab;
    private _gripSelectorInstance: Node = null;
    private _gripSelectorComponent: CTBGripSelector = null;
    private _savedCardParents: Node[] = [];
    private _selectedCardPreviousParent: Node;
    private _selectedCardOriginalPos: Vec3;
    private _tweenInProgress: boolean;
    private _newCardRank: number = 0;

    public constructor(gameController: CardScrambleGameController, gripSelector: Prefab) {
        super(gameController);
        this._powerupType = PowerupType.CookingTheBooks;
        this._gripSelectorPrefab = gripSelector;
    }

    public PreparePowerup(tutorialService?: TutorialService) {
        this._isPreparing = true;
        this._savedCardParents = [];

        this._gripSelectorInstance = instantiate(this._gripSelectorPrefab);
        this._gripSelectorInstance.parent = this._gameController.uiManager.HUD.node;
        this._gripSelectorComponent = this._gripSelectorInstance.getComponent(CTBGripSelector);
        this._gripSelectorComponent.node.on(CTBGripSelector.OnClosedEvent, this.CancelPreparation, this);
        this._gripSelectorComponent.node.on(CTBGripSelector.OnConfirmedEvent, this._onPowerupApplied, this);
        this._gripSelectorComponent.node.on(CTBGripSelector.OnCardReturnedEvent, this._onCardReturned, this);
        this._gripSelectorComponent.playOpenAnim();

        let cardsInGrip = this._gameController.currentPlayerHand.getCardsInGrip();
        cardsInGrip.forEach((gripCard, index) => {
            gripCard.setHighlighted(true);
            gripCard.node.on(GripCard.OnHighlightedCardTappedEvent, this._onCardSelected, this);

            this._savedCardParents.push(gripCard.node.parent);
            let pos = gripCard.node.getWorldPosition();
            let scale = gripCard.node.getWorldScale();

            gripCard.node.parent = this._gameController.uiManager.HUD.node;
            gripCard.node.setWorldPosition(pos);
            gripCard.node.setWorldScale(scale);

            gripCard.toggleCardTransformer(true);

            //If Joker or Wild
            if (gripCard.getCard().isJoker() || gripCard.getCard().isWild()) {
                gripCard.setHighlighted(false);
                gripCard.node.off(GripCard.OnHighlightedCardTappedEvent, this._onCardSelected, this);

                let pos = gripCard.node.getWorldPosition();
                let scale = gripCard.node.getWorldScale();
                gripCard.node.parent = this._savedCardParents[index];
                gripCard.node.setWorldPosition(pos);
                gripCard.node.setWorldScale(scale);

                gripCard.toggleCardTransformer(false);
            }
        });
    }

    public CancelPreparation() {
        if (this._isPreparing && !this._tweenInProgress) {
            if (this._gripSelectorComponent.cardToEdit != null) {
                this._onCardReturned(() => {
                    this._cancelPreparation();
                });
            } else {
                this._cancelPreparation();
            }
        }
    }

    private _cancelPreparation() {
        let cardsInGrip = this._gameController.currentPlayerHand.getCardsInGrip();
        cardsInGrip.forEach((gripCard, index) => {
            gripCard.setHighlighted(false);

            if (!gripCard.getCard().isJoker() && !gripCard.getCard().isWild()) {
                gripCard.node.off(GripCard.OnHighlightedCardTappedEvent, this._onCardSelected, this);
            }

            let pos = gripCard.node.getWorldPosition();
            let scale = gripCard.node.getWorldScale();
            gripCard.node.parent = this._savedCardParents[index];
            gripCard.node.setWorldPosition(pos);
            gripCard.node.setWorldScale(scale);
            gripCard.toggleCardTransformer(false);
        });

        this._savedCardParents = [];
        this._gameController.setPowerupActive(false);

        this._gripSelectorComponent.node.off(CTBGripSelector.OnClosedEvent, this.CancelPreparation, this);
        this._gripSelectorComponent.node.off(CTBGripSelector.OnConfirmedEvent, this._onPowerupApplied, this);
        this._gripSelectorComponent.node.off(CTBGripSelector.OnCardReturnedEvent, this._onCardReturned, this);

        this._gripSelectorComponent.closeMenu(() => {
            this._gripSelectorInstance.destroy();
            this._gripSelectorInstance = null;
            this._gripSelectorComponent = null;

            this._isPreparing = false;

            director.emit(Powerup.OnPowerupPreparedEvent, false);
        });
    }

    public ApplyPowerup() {
        this._isPreparing = false;

        let newCard = new Card(this._newCardRank, this._selectedCardToChange.getCard().suit);
        let oldCard = new Card(this._selectedCardToChange.getCard().rank, this._selectedCardToChange.getCard().suit);

        this._selectedCardToChange.setCard(newCard);

        this._onCardReturned(() => {
            let cardsInGrip = this._gameController.currentPlayerHand.getCardsInGrip();
            cardsInGrip.forEach((gripCard, index) => {
                gripCard.setHighlighted(false);

                if (!gripCard.getCard().isJoker() && !gripCard.getCard().isWild()) {
                    gripCard.node.off(GripCard.OnHighlightedCardTappedEvent, this._onCardSelected, this);
                }

                let pos = gripCard.node.getWorldPosition();
                let scale = gripCard.node.getWorldScale();
                gripCard.node.parent = this._savedCardParents[index];
                gripCard.node.setWorldPosition(pos);
                gripCard.node.setWorldScale(scale);
                gripCard.toggleCardTransformer(false);
            });

            this._gameController.setPowerupActive(false);

            this._savedCardParents = [];
            let powerupUsageContext = new PowerupUsageContext(this._powerupType, true, null);
            this._gameController.onPowerupApplicationComplete(powerupUsageContext);

            if (this._gripSelectorComponent) {
                this._gripSelectorComponent.node.off(CTBGripSelector.OnClosedEvent, this.CancelPreparation, this);
                this._gripSelectorComponent.node.off(CTBGripSelector.OnConfirmedEvent, this._onPowerupApplied, this);
                this._gripSelectorComponent.node.off(CTBGripSelector.OnCardReturnedEvent, this._onCardReturned, this);

                this._gripSelectorComponent.closeMenu(() => {
                    if (this._gripSelectorInstance) {
                        this._gripSelectorInstance.destroy();
                        this._gripSelectorInstance = null;
                        this._gripSelectorComponent = null;
                    }
                });
            }

            MatchOperations.ReplaceCardInHand(this._gameController, newCard, oldCard, () => {});

            director.emit(Powerup.OnPowerupPreparedEvent, false);
        });
    }

    private _onCardSelected(selectedCard: GripCard) {
        if (this._tweenInProgress) {
            return;
        }

        this._selectedCardToChange = selectedCard;

        SoundManager.instance.playSound('SFX_Gameplay_CardDrawn');

        if (this._gripSelectorComponent.cardToEdit != null) {
            this._onCardReturned(() => {
                this._selectedCardPreviousParent = selectedCard.node.parent;
                this._selectedCardOriginalPos = selectedCard.node.getWorldPosition();

                this._tweenInProgress = true;
                selectedCard.tweenPosition(
                    this._gripSelectorComponent.CardParent.getWorldPosition(),
                    () => {
                        this._gripSelectorComponent.setCard(selectedCard);
                        selectedCard.node.active = false;

                        let pos = selectedCard.node.getWorldPosition();
                        selectedCard.node.parent = this._selectedCardPreviousParent;
                        selectedCard.node.setWorldPosition(pos);

                        this._tweenInProgress = false;
                    },
                    selectedCard.node.parent
                );
            });
        } else {
            this._selectedCardPreviousParent = selectedCard.node.parent;
            this._selectedCardOriginalPos = selectedCard.node.getWorldPosition();

            this._tweenInProgress = true;
            selectedCard.tweenPosition(
                this._gripSelectorComponent.CardParent.getWorldPosition(),
                () => {
                    this._gripSelectorComponent.setCard(selectedCard);
                    selectedCard.node.active = false;

                    let pos = selectedCard.node.getWorldPosition();
                    selectedCard.node.parent = this._selectedCardPreviousParent;
                    selectedCard.node.setWorldPosition(pos);
                    this._tweenInProgress = false;
                },
                selectedCard.node.parent
            );
        }
    }

    private _onCardReturned(onComplete: () => void = () => {}) {
        if (this._tweenInProgress) {
            return;
        }

        let cardToReturn = this._gripSelectorComponent.cardToEdit;
        this._selectedCardPreviousParent = cardToReturn.node.parent;
        this._gripSelectorComponent.setCard(null);
        cardToReturn.node.active = true;

        this._tweenInProgress = true;
        cardToReturn.tweenPosition(
            this._selectedCardOriginalPos,
            () => {
                let pos = cardToReturn.node.getWorldPosition();
                cardToReturn.node.parent = this._selectedCardPreviousParent;
                cardToReturn.node.setWorldPosition(pos);

                this._tweenInProgress = false;
                onComplete();
            },
            cardToReturn.node.parent
        );
    }

    private async _onPowerupApplied(newRank: number) {
        this._newCardRank = newRank;
        await this._gameController.uiManager.HUD.onPowerupUsed(this);
    }
}
