"use strict";
// core/models/PlayedHand.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayedHand = void 0;
class PlayedHand {
    constructor(placements, hand, handClassification) {
        this.newCardPlacements = placements;
        this.hand = hand;
        this.handClassification = handClassification;
    }
}
exports.PlayedHand = PlayedHand;
