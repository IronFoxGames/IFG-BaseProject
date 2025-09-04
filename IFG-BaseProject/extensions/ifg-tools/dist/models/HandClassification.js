"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandClassification = void 0;
class HandClassification {
    constructor(score, name, handName, baseHandNames, specialHandName, scoredCards, scoreWithModifier) {
        this.score = score;
        this.name = name;
        this.handName = handName;
        this.baseHandNames = baseHandNames;
        this.specialHandName = specialHandName;
        this.scoredCards = scoredCards;
        this.scoreWithModifier = scoreWithModifier !== null && scoreWithModifier !== void 0 ? scoreWithModifier : score;
    }
}
exports.HandClassification = HandClassification;
