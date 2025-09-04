import { _decorator, Component, Node } from 'cc';
import { Booster } from './Booster';
import { GameConfig } from '../core/model/GameConfig';
import { DeckType } from '../core/enums/DeckType';
import { Card, MatchOperations } from '../core';
import { BoosterType } from '../core/enums/BoosterType';
import { Utils } from '../core/Utils';
import { Random } from '../core/Random';
import { logger } from '../logging';
const { ccclass, property } = _decorator;

@ccclass('DeucesWildBooster')
export class DeucesWildBooster extends Booster {
    private _log = logger.child('Booster.DeucesWild');

    public constructor() {
        super();
        this._boosterType = BoosterType.DeucesWild;
    }

    public ApplyBooster(gameConfig: GameConfig, random: Random): GameConfig {
        this._log.info('Applying DeucesWild Booster');

        gameConfig.appliedBoosters.push(BoosterType.DeucesWild);

        // SFX hooked up alongside animation in the CardTransformer

        return gameConfig;
    }
}
