import { PowerupType } from '../enums/BoosterType';
import { Card } from './Card';
import { CardPlacement } from './CardPlacement';

export class PowerupUsageContext {
    usedBeforeTurn: boolean = true;
    powerupType: PowerupType;
    updatedTiles: CardPlacement[] = [];
    //For clean down
    numAffectedTurns: number = 0;

    constructor(powerupType: PowerupType, usedBeforeTurn: boolean, updatedTiles: CardPlacement[], numAffectedTurns: number = 0) {
        this.powerupType = powerupType;
        this.usedBeforeTurn = usedBeforeTurn;
        this.updatedTiles = updatedTiles;
        this.numAffectedTurns = numAffectedTurns;
    }
}
