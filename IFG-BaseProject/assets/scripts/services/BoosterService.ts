import { _decorator } from 'cc';
import { BoosterType } from '../core/enums/BoosterType';
import { GameConfig } from '../core/model/GameConfig';
import { Booster } from '../boosters/Booster';
import { ICardScrambleService } from './ICardScrambleService';
import { Random } from '../core/Random';
import { logger } from '../logging';
const { ccclass } = _decorator;

@ccclass('BoosterService')
export class BoosterService {
    private _cardScrambleService: ICardScrambleService;
    private _log = logger.child('BoosterService');

    public init(cardScrambleService: ICardScrambleService) {
        this._cardScrambleService = cardScrambleService;
    }

    public async ApplyBooster(booster: Booster, gameConfig: GameConfig, random: Random): Promise<GameConfig> {
        if (this.CanUseBooster(booster.BoosterType) || gameConfig.freeBooster === booster.BoosterType) {
            if (gameConfig.freeBooster !== booster.BoosterType) {
                await this._cardScrambleService.useBooster(booster.BoosterType);
            }
            return booster.ApplyBooster(gameConfig, random);
        }

        this._log.error(`BoosterService: Cannot Use Booster ${booster.BoosterType.toString()}`);

        return gameConfig;
    }

    public CanUseBooster(boosterType: BoosterType): boolean {
        return this._cardScrambleService.getBoosterCount(boosterType) > 0;
    }
}
