import { _decorator, Component, Node } from 'cc';
import { Booster } from './Booster';
import { GameConfig } from '../core/model/GameConfig';
import { BoosterType } from '../core/enums/BoosterType';
import { Random } from '../core/Random';
import { logger } from '../logging';
const { ccclass, property } = _decorator;

@ccclass('LoosenTheBeltBooster')
export class LoosenTheBeltBooster extends Booster {
    private _log = logger.child('Booster.LoosenTheBelt');
    public constructor() {
        super();
        this._boosterType = BoosterType.LoosenTheBelt;
    }

    public ApplyBooster(gameConfig: GameConfig, random: Random = null): GameConfig {
        this._log.info('Applying LoosenTheBelt Booster');
        gameConfig.handSize += 1;
        gameConfig.appliedBoosters.push(BoosterType.LoosenTheBelt);

        // SFX hooked up alongside animation in the CardTransformer

        return gameConfig;
    }
}
