// core/models/PlayedHand.ts

import {CardPlacement} from './CardPlacement';
import {HandClassification} from './HandClassification';

export class PlayedHand {
    public readonly newCardPlacements: CardPlacement[];
    public readonly hand: CardPlacement[];
    public readonly handClassification: HandClassification;

    constructor(placements: CardPlacement[], hand: CardPlacement[], handClassification: HandClassification) {
        this.newCardPlacements = placements;
        this.hand = hand;
        this.handClassification = handClassification;
    }
}