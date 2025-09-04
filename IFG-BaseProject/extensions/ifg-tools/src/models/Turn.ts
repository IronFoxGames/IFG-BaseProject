import { HandName } from '../enums/HandName';
import { TurnType } from '../enums/TurnType';
import { BoardModifier } from './BoardModifier';
import { CardPlacement } from './CardPlacement';
import { PowerupUsageContext } from './PowerupUsageContext';

export class Turn {
    type: TurnType = TurnType.Play;
    cardPlacements: CardPlacement[] = [];
    scoredHand: CardPlacement[] = [];
    score: number = 0;
    handName: HandName = HandName.Invalid; // Assuming HandName.Invalid as default
    specialHandName: HandName = HandName.Invalid; // Assuming HandName.Invalid as default
    baseHands: HandName[] = [];
    powerupUsages: PowerupUsageContext[] = [];
    modifiersUsed: BoardModifier[] = [];
    scoreLossAmount: number = 0;

    constructor(
        type: TurnType,
        cardPlacements: CardPlacement[],
        fullHandPlacements: CardPlacement[],
        powerupUsages: PowerupUsageContext[],
        modifiersUsed: BoardModifier[] = []
    ) {
        this.type = type;
        this.cardPlacements = cardPlacements;
        this.scoredHand = fullHandPlacements;
        this.powerupUsages = powerupUsages;
        this.modifiersUsed = modifiersUsed;
    }
}
