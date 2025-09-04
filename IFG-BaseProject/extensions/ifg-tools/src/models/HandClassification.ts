import { HandName } from '../enums/HandName';
import { BoardModifier } from './BoardModifier';
import { Card } from './Card';

export class HandClassification {
    public score: number;
    public name: string;
    public handName: HandName;
    public baseHandNames: HandName[];
    public specialHandName: HandName;
    public scoredCards: Card[];
    public scoreWithModifier: number;

    constructor(
        score: number,
        name: string,
        handName: HandName,
        baseHandNames: HandName[],
        specialHandName: HandName,
        scoredCards: Card[],
        scoreWithModifier?: number
    ) {
        this.score = score;
        this.name = name;
        this.handName = handName;
        this.baseHandNames = baseHandNames;
        this.specialHandName = specialHandName;
        this.scoredCards = scoredCards;
        this.scoreWithModifier = scoreWithModifier ?? score;
    }
}
