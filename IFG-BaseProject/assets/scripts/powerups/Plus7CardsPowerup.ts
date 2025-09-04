import { _decorator, Component, Node, Animation } from 'cc';
import { Powerup } from './Powerup';
import { Card, MatchOperations } from '../core';
import { CardScrambleGameController } from '../game/CardScrambleGameController';
import { PowerupType } from '../core/enums/BoosterType';
import { director } from 'cc';
import { PowerupUsageContext } from '../core/model/PowerupUsageContext';
import { CardType } from '../core/model/Card';
import { SoundManager } from '../audio/SoundManager';
import { Utils } from '../core/Utils';
import { TutorialService } from '../services/TutorialService';
const { ccclass, property } = _decorator;

@ccclass('Plus7CardsPowerup')
export class Plus7CardsPowerup extends Powerup {
    private _deckAnim: Animation;
    private _containerAnim: Animation;

    public constructor(gameController: CardScrambleGameController, deckAnimation: Animation, containerAnimation: Animation) {
        super(gameController);
        this._powerupType = PowerupType.Plus7Cards;
        this._deckAnim = deckAnimation;
        this._containerAnim = containerAnimation;
    }

    public PreparePowerup(tutorialService?: TutorialService) {
        this._onApplyPowerup();
    }

    public CancelPreparation() {}

    public ApplyPowerup() {
        SoundManager.instance.playSound('SFX_Gameplay_PowerUpReveal');
        SoundManager.instance.playSound('SFX_Gameplay_DeckAppear');

        const defaultDeck = MatchOperations.NewDefaultDeck();
        defaultDeck.splice(defaultDeck.length - 1, 1);

        for (let i = 0; i < 7; i++) {
            Utils.shuffle(defaultDeck, this._gameController.random);
            MatchOperations.AddCardToDeck(this._gameController.match, defaultDeck[0]);
        }

        this._gameController.currentPlayerHand.setHandInteractable(false);
        this._gameController.uiManager.HUD.BlockHUDInteraction(true);
        this._gameController.UpdateDeckCount();

        this._containerAnim.play(this._containerAnim.clips[1].name);
        this._containerAnim.once(Animation.EventType.FINISHED, () => {
            this._deckAnim.play(this._deckAnim.clips[10].name);

            this._deckAnim.once(Animation.EventType.FINISHED, () => {
                MatchOperations.DrawCardsUntilHandFull(this._gameController);

                this._gameController.uiManager.HUD.BlockHUDInteraction(false);
                let powerupUsageContext = new PowerupUsageContext(this._powerupType, true, null);
                this._gameController.onPowerupApplicationComplete(powerupUsageContext);
            });
        });
    }

    private _onApplyPowerup() {
        if (this._gameController.giveUpView) {
            this._gameController.giveUpView.onPowerupUsed(this);
        }
    }
}
