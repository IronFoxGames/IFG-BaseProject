import { Powerup } from './Powerup';
import { MatchOperations } from '../core';
import { PowerupType } from '../core/enums/BoosterType';
import { CardScrambleGameController } from '../game/CardScrambleGameController';
import { director } from 'cc';
import { PowerupUsageContext } from '../core/model/PowerupUsageContext';
import { HUDController } from '../game/HUDController';
import { SoundManager } from '../audio/SoundManager';
import { TutorialService } from '../services/TutorialService';

export class ExtraServingsPowerup extends Powerup {
    private isApplied: boolean = false;

    public constructor(gameController: CardScrambleGameController) {
        super(gameController);
        this._powerupType = PowerupType.ExtraServings;
    }

    public PreparePowerup(tutorialService?: TutorialService) {
        this.isApplied = false;

        MatchOperations.DoubleNextHandScoreFromExtraServings();
        this._gameController.uiManager.HUD.toggleExtraServingsVFX(true);
    }

    public CancelPreparation() {
        director.emit(Powerup.OnPowerupPreparedEvent, false);

        if (!this.isApplied) {
            MatchOperations.RevertDoubledScoreFromExtraServings();
            this._gameController.uiManager.HUD.toggleExtraServingsVFX(false);
        }
    }

    public ApplyPowerup() {
        SoundManager.instance.playSound('SFX_Gameplay_ExtraServings');
        this.isApplied = true;
        let powerupUsageContext = new PowerupUsageContext(this._powerupType, true, null);
        this._gameController.onPowerupApplicationComplete(powerupUsageContext);
    }
}
