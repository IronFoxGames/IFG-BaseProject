import { _decorator } from 'cc';
import { PowerupType } from '../core/enums/BoosterType';
import { Powerup } from '../powerups/Powerup';
import { ICardScrambleService } from './ICardScrambleService';
import { GameConfig } from '../core/model/GameConfig';
import { logger } from '../logging';
import { TutorialService } from './TutorialService';
const { ccclass } = _decorator;

@ccclass('PowerupService')
export class PowerupService {
    private _cardScrambleService: ICardScrambleService;
    private _tutorialService: TutorialService;
    private _log = logger.child('PowerupService');

    public init(cardScrambleService: ICardScrambleService, tutorialService: TutorialService) {
        this._cardScrambleService = cardScrambleService;
        this._tutorialService = tutorialService;
    }

    public async ApplyPowerup(powerup: Powerup, gameConfig: GameConfig): Promise<boolean> {
        if (this.CanUsePowerup(powerup.PowerupType) || gameConfig.freePowerup === powerup.PowerupType) {
            if (gameConfig.freePowerup !== powerup.PowerupType) {
                await this._cardScrambleService.usePowerup(powerup.PowerupType);
            }

            powerup.ApplyPowerup();
            return true;
        }

        this._log.error(`PowerupService: Cannot Use Powerup ${powerup.PowerupType.toString()}`);
        return false;
    }

    public PreparePowerup(powerup: Powerup, gameConfig: GameConfig) {
        if (this.CanUsePowerup(powerup.PowerupType) || gameConfig.freePowerup === powerup.PowerupType) {
            return powerup.PreparePowerup(this._tutorialService);
        }

        this._log.error(`PowerupService: Cannot Prepare Powerup ${powerup.PowerupType.toString()}`);
    }

    public CancelPowerupPreparation(powerup: Powerup) {
        powerup.CancelPreparation();
    }

    public CanUsePowerup(powerupType: PowerupType): boolean {
        return this._cardScrambleService.getPowerupCount(powerupType) > 0;
    }
}
