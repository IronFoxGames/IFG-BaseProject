import { Powerup } from './Powerup';
import { Card, MatchOperations } from '../core';
import { CardScrambleGameController } from '../game/CardScrambleGameController';
import { PowerupType } from '../core/enums/BoosterType';
import { director } from 'cc';
import { PowerupUsageContext } from '../core/model/PowerupUsageContext';
import { CardTransformer } from '../game/ui/CardTransformer';
import { instantiate, Node, Animation, Vec3, Prefab, _decorator, tween } from 'cc';
import { PowerupEntry } from '../game/ui/PowerupEntry';
import { Toggle } from 'cc';
import { SoundManager } from '../audio/SoundManager';
import { TutorialService } from '../services/TutorialService';
const { ccclass, property } = _decorator;

@ccclass('JokerPowerup')
export class JokerPowerup extends Powerup {
    private _cardTransformerPrefab: Prefab;
    private _cardSpawnPos: Vec3;
    private _cardTransformerInstance: Node;
    private _cardTransformerComponent: CardTransformer;

    public constructor(gameController: CardScrambleGameController, cardTransformerPrefab: Prefab, powerupEntry: PowerupEntry) {
        super(gameController);
        this._powerupType = PowerupType.Joker;
        this._cardTransformerPrefab = cardTransformerPrefab;
        this._cardSpawnPos = powerupEntry.node.getWorldPosition();
    }

    public PreparePowerup(tutorialService?: TutorialService) {
        this._onApplyPowerup();
    }

    public CancelPreparation() {}

    public ApplyPowerup() {
        SoundManager.instance.playSound('SFX_Gameplay_PowerUpReveal');

        let gripCard = MatchOperations.AddCardToHand(this._gameController, new Card(Card.Joker));

        gripCard.node.children.forEach((child) => {
            child.active = false;
        });

        //delay to ensure the gripCardSlot is in the correct position
        setTimeout(() => {
            this._cardTransformerInstance = instantiate(this._cardTransformerPrefab);
            this._cardTransformerInstance.parent = this._gameController.uiManager.HUD.node;
            this._cardTransformerInstance.setWorldPosition(this._cardSpawnPos);
            this._cardTransformerInstance.setScale(new Vec3(2, 2, 2));
            this._cardTransformerComponent = this._cardTransformerInstance.getComponent(CardTransformer);
            this._cardTransformerComponent.setCard(Card.Joker);
            this._cardTransformerComponent.playJokerActivateAnim();

            this._gameController.currentPlayerHand.setHandInteractable(false);
            this._gameController.blockBoardInteraction(true);
            this._gameController.uiManager.HUD.BlockHUDInteraction(true);

            tween(this._cardTransformerInstance)
                .to(1, { worldPosition: gripCard.node.getWorldPosition() }, { easing: 'quadInOut' })
                .call(() => {
                    this._cardTransformerComponent.playJokerEndAnim();
                    this._cardTransformerComponent.cardAnimator.once(Animation.EventType.FINISHED, () => {
                        this._cardTransformerInstance.destroy();
                        this._cardTransformerInstance = null;
                        this._cardTransformerComponent = null;
                        gripCard.toggleCardTransformer(false);

                        this._gameController.currentPlayerHand.setHandInteractable(true);
                        this._gameController.blockBoardInteraction(false);
                        this._gameController.uiManager.HUD.BlockHUDInteraction(false);

                        let powerupUsageContext = new PowerupUsageContext(this._powerupType, true, null);
                        this._gameController.onPowerupApplicationComplete(powerupUsageContext);

                        this._gameController.updatePlayerHandSlotSpacing();
                    });
                })
                .start();
        }, 50);
    }

    private _onApplyPowerup() {
        this._gameController.uiManager.HUD.onPowerupUsed(this);
    }
}
