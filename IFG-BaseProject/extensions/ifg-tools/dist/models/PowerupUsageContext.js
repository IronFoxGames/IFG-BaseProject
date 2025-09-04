"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerupUsageContext = void 0;
class PowerupUsageContext {
    constructor(powerupType, usedBeforeTurn, updatedTiles, numAffectedTurns = 0) {
        this.usedBeforeTurn = true;
        this.updatedTiles = [];
        //For clean down
        this.numAffectedTurns = 0;
        this.powerupType = powerupType;
        this.usedBeforeTurn = usedBeforeTurn;
        this.updatedTiles = updatedTiles;
        this.numAffectedTurns = numAffectedTurns;
    }
}
exports.PowerupUsageContext = PowerupUsageContext;
