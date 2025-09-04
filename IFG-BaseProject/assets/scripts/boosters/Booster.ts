import { _decorator, Component, Node } from 'cc';
import { BoosterType } from '../core/enums/BoosterType';
import { GameConfig } from '../core/model/GameConfig';
import { Random } from '../core/Random';
const { ccclass, property } = _decorator;

@ccclass('Booster')
export abstract class Booster {
    protected _boosterType: BoosterType;

    public get BoosterType() {
        return this._boosterType;
    }

    public abstract ApplyBooster(gameConfig: GameConfig, random: Random): GameConfig;
}
