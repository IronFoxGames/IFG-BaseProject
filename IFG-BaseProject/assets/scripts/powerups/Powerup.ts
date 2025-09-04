import { PowerupType } from '../core/enums/BoosterType';
import { CardScrambleGameController } from '../game/CardScrambleGameController';
import { TutorialService } from '../services/TutorialService';

export abstract class Powerup {
    public static OnPowerupPreparedEvent = 'OnPowerupPreparedEvent';

    protected _powerupType: PowerupType;
    protected _gameController: CardScrambleGameController;
    protected _isPreparing: boolean;

    public constructor(gameController: CardScrambleGameController) {
        this._gameController = gameController;
    }

    public get PowerupType() {
        return this._powerupType;
    }

    public abstract PreparePowerup(tutorialService?: TutorialService);
    public abstract CancelPreparation();
    public abstract ApplyPowerup();
}
