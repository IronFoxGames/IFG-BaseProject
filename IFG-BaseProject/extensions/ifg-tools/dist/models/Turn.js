"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Turn = void 0;
const HandName_1 = require("../enums/HandName");
const TurnType_1 = require("../enums/TurnType");
class Turn {
    constructor(type, cardPlacements, fullHandPlacements, powerupUsages, modifiersUsed = []) {
        this.type = TurnType_1.TurnType.Play;
        this.cardPlacements = [];
        this.scoredHand = [];
        this.score = 0;
        this.handName = HandName_1.HandName.Invalid; // Assuming HandName.Invalid as default
        this.specialHandName = HandName_1.HandName.Invalid; // Assuming HandName.Invalid as default
        this.baseHands = [];
        this.powerupUsages = [];
        this.modifiersUsed = [];
        this.scoreLossAmount = 0;
        this.type = type;
        this.cardPlacements = cardPlacements;
        this.scoredHand = fullHandPlacements;
        this.powerupUsages = powerupUsages;
        this.modifiersUsed = modifiersUsed;
    }
}
exports.Turn = Turn;
