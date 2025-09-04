import { HandName, HandNameTipString, HandNameToSpritePath, HandNameToString } from '../enums/HandName';
import { ObjectiveType } from '../enums/ObjectiveType';
import { Card } from './Card';
import { CardPlacement } from './CardPlacement';
import { HandClassification } from './HandClassification';
import { Turn } from './Turn';

export class ObjectiveParams {
    public objectiveType: ObjectiveType = ObjectiveType.Score;
    public tipText: string = '';
    public tipSprite: string | null = null;

    public equals(other: ObjectiveParams): boolean {
        if (other == null) {
            return false;
        }

        return this === other;
    }

    public static fromObject(obj: any): ObjectiveParams {
        // This will be overridden in subclasses anyway
        throw new Error('Must implement fromObject in subclass');
    }

    public getPipCount(): number {
        throw new Error('ObjectiveParams base class not implemented');
    }

    public getPipsCompleted(score: number, turns: Turn[]): number {
        throw new Error('ObjectiveParams base class not implemented');
    }

    public isObjectiveComplete(score: number, turns: Turn[]): [boolean, number] {
        throw new Error('ObjectiveParams base class not implemented');
    }

    public getString(getPrefix: boolean): string {
        throw new Error('ObjectiveParams base class not implemented');
    }

    public willHandAffectObjective(handClassification: HandClassification, cardsPlayed: CardPlacement[]): boolean {
        throw new Error('ObjectiveParams base class not implemented');
    }
}

export class ScoreObjectiveParams extends ObjectiveParams {
    public score: number = 0;
    public tipText: string = '';
    public tipSprite: string | null = null;

    public equals(other: ScoreObjectiveParams): boolean {
        if (other == null) {
            return false;
        }

        return this.score === other.score;
    }

    public static fromObject(obj: any): ScoreObjectiveParams {
        const params = new ScoreObjectiveParams();
        params.score = obj.score;
        params.objectiveType = obj.objectiveType;
        params.tipText = `Score the target number of points by playing the best hands possible.`;
        return params;
    }

    public getPipCount(): number {
        return 1;
    }

    public getPipsCompleted(score: number, turns: Turn[]): number {
        return this.isObjectiveComplete(score, turns)[0] ? 1 : 0;
    }

    public isObjectiveComplete(score: number, turns: Turn[]): [boolean, number] {
        let progress: number = score / this.score;
        return [score >= this.score, Math.min(progress, 1)];
    }

    public getString(getPrefix: boolean): string {
        if (getPrefix) {
            return ` and score ${this.score} points`;
        }

        return `Score ${this.score} points`;
    }

    public willHandAffectObjective(handClassification: HandClassification, cardsPlayed: CardPlacement[]): boolean {
        if (handClassification.scoreWithModifier > 0) {
            return true;
        }

        return false;
    }
}

export class HandsPlayedObjectiveParams extends ObjectiveParams {
    public hand: HandName = HandName.Invalid;
    public count: number = 0;
    public tipText: string = '';
    public tipSprite: string | null = null;

    public equals(other: HandsPlayedObjectiveParams): boolean {
        if (other == null) {
            return false;
        }

        return this.hand === other.hand && this.count === other.count;
    }

    public static fromObject(obj: any): HandsPlayedObjectiveParams {
        const params = new HandsPlayedObjectiveParams();
        params.objectiveType = obj.objectiveType;
        params.hand = obj.hand;
        params.count = obj.count;
        params.tipText = HandNameTipString(obj.hand);
        params.tipSprite = HandNameToSpritePath(obj.hand);
        return params;
    }

    public getPipCount(): number {
        return this.count;
    }

    public getPipsCompleted(score: number, turns: Turn[]): number {
        return this._getHandsPlayedCount(score, turns);
    }

    public isObjectiveComplete(score: number, turns: Turn[]): [boolean, number] {
        let playedCount = this._getHandsPlayedCount(score, turns);

        let progress: number = playedCount / this.count;

        return [playedCount >= this.count, Math.min(progress, 1)];
    }

    public getString(getPrefix: boolean): string {
        let objString = `Play ${HandNameToString(this.hand)} hands`;

        if (getPrefix) {
            objString = ` and play ${HandNameToString(this.hand)} hands`;
        }

        return objString;
    }

    private _getHandsPlayedCount(score: number, turns: Turn[]): number {
        let playedCount = 0;
        for (const turn of turns) {
            if (turn.baseHands && (turn.handName === this.hand || turn.baseHands.includes(this.hand))) {
                playedCount++;
            }
        }
        return playedCount;
    }

    public willHandAffectObjective(handClassification: HandClassification, cardsPlayed: CardPlacement[]): boolean {
        if (handClassification.handName === this.hand || handClassification.baseHandNames.includes(this.hand)) {
            return true;
        }

        return false;
    }
}

export class HandPlayedAnyObjectiveParams extends ObjectiveParams {
    public count: number = 0;
    public tipText: string = '';
    public tipSprite: string | null = null;

    public equals(other: HandPlayedAnyObjectiveParams): boolean {
        if (other == null) {
            return false;
        }

        return this.count === other.count;
    }

    public static fromObject(obj: any): HandPlayedAnyObjectiveParams {
        const params = new HandPlayedAnyObjectiveParams();
        params.objectiveType = obj.objectiveType;
        params.count = obj.count;
        params.tipText =
            obj.tipText !== undefined && obj.tipText !== ''
                ? obj.tipText
                : `Place a line of 5 cards on the board and click "PLAY" to play the Hand.`;
        params.tipSprite = 'help/help_any-hand/spriteFrame';
        return params;
    }

    public getPipCount(): number {
        return this.count;
    }

    public getPipsCompleted(score: number, turns: Turn[]): number {
        return this._getHandsPlayedCount(score, turns);
    }

    public isObjectiveComplete(score: number, turns: Turn[]): [boolean, number] {
        let playedCount = this._getHandsPlayedCount(score, turns);

        let progress: number = playedCount / this.count;

        return [playedCount >= this.count, Math.min(progress, 1)];
    }

    public getString(getPrefix: boolean): string {
        if (this.count === 1) {
            let objString = `Play a Hand`;
            if (getPrefix) {
                objString = ` and play a Hand.`;
            }
            return objString;
        } else {
            let objString = `Play ${this.count} Hands`;

            if (getPrefix) {
                objString = ` and play ${this.count} Hands`;
            }

            return objString;
        }
    }

    private _getHandsPlayedCount(score: number, turns: Turn[]): number {
        let playedCount = 0;
        for (const turn of turns) {
            if (turn.baseHands) {
                playedCount++;
            }
        }
        return playedCount;
    }

    public willHandAffectObjective(handClassification: HandClassification, cardsPlayed: CardPlacement[]): boolean {
        return true;
    }
}

export class TurnLimitObjectiveParams extends ObjectiveParams {
    public turnLimit: number = 0;
    public tipText: string = '';
    public tipSprite: string | null = null;

    public equals(other: TurnLimitObjectiveParams): boolean {
        if (other == null) {
            return false;
        }

        return this.turnLimit === other.turnLimit;
    }

    public static fromObject(obj: any): TurnLimitObjectiveParams {
        const params = new TurnLimitObjectiveParams();
        params.turnLimit = obj.turnLimit;
        params.objectiveType = obj.objectiveType;
        params.tipText = `All other objectives must be completed before ${obj.turnLimit} turns have been played.`;
        params.tipSprite = null;
        return params;
    }

    public getPipCount(): number {
        return 1;
    }

    public getPipsCompleted(score: number, turns: Turn[]): number {
        return this.isObjectiveComplete(score, turns)[0] ? 1 : 0;
    }

    public isObjectiveComplete(score: number, turns: Turn[]): [boolean, number] {
        let progress: number = turns.length / this.turnLimit;

        return [turns.length <= this.turnLimit, Math.min(progress, 1)];
    }

    public getString(getPrefix: boolean): string {
        if (getPrefix) {
            return ` by the end of turn ${this.turnLimit}`;
        }

        return `Win in less than ${this.turnLimit} turns`;
    }

    public willHandAffectObjective(handClassification: HandClassification, cardsPlayed: CardPlacement[]): boolean {
        return true;
    }
}

export class TilePlacedObjectiveParams extends ObjectiveParams {
    public tileIndices: number[] = [];
    public tipText: string = '';
    public tipSprite: string | null = null;

    public equals(other: TilePlacedObjectiveParams): boolean {
        if (other == null) {
            return false;
        }

        return this.tileIndices === other.tileIndices;
    }

    public static fromObject(obj: any): TilePlacedObjectiveParams {
        const params = new TilePlacedObjectiveParams();
        params.tileIndices = obj.tileIndices;
        params.objectiveType = obj.objectiveType;
        params.tipText = `Cover the target tiles`;
        params.tipSprite = 'help/help_target-tiles/spriteFrame';
        return params;
    }

    public getPipCount(): number {
        return this.tileIndices.length;
    }

    public getPipsCompleted(score: number, turns: Turn[]): number {
        return this._getTilesPlaced(score, turns);
    }

    public isObjectiveComplete(score: number, turns: Turn[]): [boolean, number] {
        let tilesPlaced = this._getTilesPlaced(score, turns);

        let progress = tilesPlaced / this.tileIndices.length;
        return [tilesPlaced === this.tileIndices.length, progress];
    }

    public getString(getPrefix: boolean): string {
        if (getPrefix) {
            return ` and cover the target tiles`;
        }

        return `Cover the ${this.tileIndices.length} target tiles`;
    }

    private _getTilesPlaced(score: number, turns: Turn[]): number {
        let foundTiles: number[] = [];

        for (const turn of turns) {
            turn.cardPlacements.forEach((placement) => {
                let tileIndex = this.tileIndices.indexOf(placement.boardIndex);

                if (tileIndex !== -1 && !foundTiles.includes(placement.boardIndex)) {
                    foundTiles.push(this.tileIndices[tileIndex]);
                }
            });
        }

        return foundTiles.length;
    }

    public willHandAffectObjective(handClassification: HandClassification, cardsPlayed: CardPlacement[]): boolean {
        for (const requiredIndex of this.tileIndices) {
            for (const cardPlacement of cardsPlayed) {
                if (cardPlacement.boardIndex === requiredIndex) {
                    return true;
                }
            }
        }

        return false;
    }
}

export class HandPlayedWithScoreObjectiveParams extends ObjectiveParams {
    public hand: HandName = HandName.Invalid;
    public score: number = 0;
    public tipText: string = '';
    public tipSprite: string | null = null;

    public equals(other: HandPlayedWithScoreObjectiveParams): boolean {
        if (other == null) {
            return false;
        }

        return this.hand === other.hand && this.score === other.score;
    }

    public static fromObject(obj: any): HandPlayedWithScoreObjectiveParams {
        const params = new HandPlayedWithScoreObjectiveParams();
        params.hand = obj.hand;
        params.score = obj.score;
        params.objectiveType = obj.objectiveType;
        params.tipText = HandNameTipString(obj.hand);
        params.tipSprite = HandNameToSpritePath(obj.hand);
        return params;
    }

    public getPipCount(): number {
        return 1;
    }

    public getPipsCompleted(score: number, turns: Turn[]): number {
        return this.isObjectiveComplete(score, turns)[0] ? 1 : 0;
    }

    public isObjectiveComplete(score: number, turns: Turn[]): [boolean, number] {
        let scoreAchieved = 0;

        for (const turn of turns) {
            if (turn.baseHands && (turn.handName === this.hand || turn.baseHands.includes(this.hand))) {
                scoreAchieved += turn.score;

                //Add this because losing score should not affect the objective
                scoreAchieved += turn.scoreLossAmount;
            }
        }

        let progress: number = scoreAchieved / this.score;

        return [scoreAchieved >= this.score, Math.min(progress, 1)];
    }

    public getString(getPrefix: boolean): string {
        if (getPrefix) {
            return ` and score at least ${this.score} points in ${HandNameToString(this.hand)} hands`;
        }

        return `Score at least ${this.score} points in ${HandNameToString(this.hand)} hands`;
    }

    public willHandAffectObjective(handClassification: HandClassification, cardsPlayed: CardPlacement[]): boolean {
        if (
            (handClassification.handName === this.hand || handClassification.baseHandNames.includes(this.hand)) &&
            handClassification.scoreWithModifier >= 0
        ) {
            return true;
        }

        return false;
    }
}

export class CardPlayedObjectiveParams extends ObjectiveParams {
    public rank: number = 0;
    public suit: number = 0;
    public count: number = 0;
    public tipText: string = '';
    public tipSprite: string | null = null;

    public equals(other: CardPlayedObjectiveParams): boolean {
        if (other == null) {
            return false;
        }

        return this.rank === other.rank && this.suit === other.suit && this.count == other.count;
    }

    public static fromObject(obj: any): CardPlayedObjectiveParams {
        const params = new CardPlayedObjectiveParams();
        params.rank = obj.rank;
        params.suit = obj.suit;
        params.count = obj.count;
        params.objectiveType = obj.objectiveType;
        params.tipText = `Play the required amount of specific cards in any hand.`;
        params.tipSprite = null; //TODO: Construct sprite card from rank and suit, cards currently aren't in the resources folder
        return params;
    }

    public getPipCount(): number {
        return this.count;
    }

    public getPipsCompleted(score: number, turns: Turn[]): number {
        return this._getHandsPlayedWithCardCount(score, turns);
    }

    public isObjectiveComplete(score: number, turns: Turn[]): [boolean, number] {
        let handsPlayedWithCard = this._getHandsPlayedWithCardCount(score, turns);

        return [handsPlayedWithCard >= this.count, handsPlayedWithCard / this.count];
    }

    public getString(getPrefix: boolean): string {
        let cardString: string = '';
        let card: Card = new Card(this.rank, this.suit);

        if (this.rank !== 0) {
            cardString += card.rankString();
        }

        switch (this.suit) {
            case 1:
                cardString += Card.C;
                break;
            case 2:
                cardString += Card.D;
                break;
            case 3:
                cardString += Card.H;
                break;
            case 4:
                cardString += Card.S;
                break;
        }

        if (getPrefix) {
            return ` and play ${cardString}s`;
        }

        return `Play ${cardString}s`;
    }

    private _getHandsPlayedWithCardCount(score: number, turns: Turn[]): number {
        let handsPlayedWithCard: number = 0;

        for (const turn of turns) {
            turn.scoredHand.forEach((cardPlacement) => {
                if (this.suit === 0 && this.rank !== 0) {
                    if (cardPlacement.card?.rank === this.rank) {
                        handsPlayedWithCard++;
                    }
                } else if (this.suit !== 0 && this.rank === 0) {
                    if (cardPlacement.card?.suit === this.suit) {
                        handsPlayedWithCard++;
                    }
                } else if (this.suit !== 0 && this.rank !== 0) {
                    if (cardPlacement.card?.suit === this.suit && cardPlacement.card.rank === this.rank) {
                        handsPlayedWithCard++;
                    }
                }
            });
        }

        return handsPlayedWithCard;
    }

    public willHandAffectObjective(handClassification: HandClassification, cardsPlayed: CardPlacement[]): boolean {
        for (const cardPlacement of cardsPlayed) {
            if (cardPlacement?.card?.rank === this.rank && cardPlacement.card.suit === this.suit) {
                return true;
            }
        }

        return false;
    }
}

export class CardPlayedWithHandObjectiveParams extends ObjectiveParams {
    public rank: number = 0;
    public suit: number = 0;
    public count: number = 0;
    public hand: HandName = HandName.Invalid;
    public tipText: string = '';
    public tipSprite: string | null = null;

    public equals(other: CardPlayedWithHandObjectiveParams): boolean {
        if (other == null) {
            return false;
        }

        return this.rank === other.rank && this.suit === other.suit && this.count == other.count && this.hand === other.hand;
    }

    public static fromObject(obj: any): CardPlayedWithHandObjectiveParams {
        const params = new CardPlayedWithHandObjectiveParams();
        params.rank = obj.rank;
        params.suit = obj.suit;
        params.count = obj.count;
        params.hand = obj.hand;
        params.objectiveType = obj.objectiveType;
        params.tipText = `Play the required card in the specified hand. The card does not need to be an active part of that hand. Multiples of the card will each count.`;
        params.tipSprite = HandNameToSpritePath(obj.hand);
        return params;
    }

    public getPipCount(): number {
        return this.count;
    }

    public getPipsCompleted(score: number, turns: Turn[]): number {
        return this._getHandsPlayedWithCardCount(score, turns);
    }

    public isObjectiveComplete(score: number, turns: Turn[]): [boolean, number] {
        let handsPlayedWithCard = this._getHandsPlayedWithCardCount(score, turns);

        return [handsPlayedWithCard >= this.count, handsPlayedWithCard / this.count];
    }

    public getString(getPrefix: boolean): string {
        let cardString: string = '';
        let card: Card = new Card(this.rank, this.suit);

        if (this.rank !== 0) {
            cardString += card.rankString();
        }

        switch (this.suit) {
            case 1:
                cardString += Card.C;
                break;
            case 2:
                cardString += Card.D;
                break;
            case 3:
                cardString += Card.H;
                break;
            case 4:
                cardString += Card.S;
                break;
        }

        if (getPrefix) {
            return ` and play ${cardString}s in ${HandNameToString(this.hand)} hands`;
        }

        return `Play ${cardString}s in ${HandNameToString(this.hand)} hands`;
    }

    private _getHandsPlayedWithCardCount(score: number, turns: Turn[]): number {
        let handsPlayedWithCard: number = 0;

        for (const turn of turns) {
            turn.scoredHand.forEach((cardPlacement) => {
                let cardPlayed: boolean = false;

                if (this.suit === 0 && this.rank !== 0) {
                    if (cardPlacement.card?.rank === this.rank) {
                        cardPlayed = true;
                    }
                } else if (this.suit !== 0 && this.rank === 0) {
                    if (cardPlacement.card?.suit === this.suit) {
                        cardPlayed = true;
                    }
                } else if (this.suit !== 0 && this.rank !== 0) {
                    if (cardPlacement.card?.suit === this.suit && cardPlacement.card.rank === this.rank) {
                        cardPlayed = true;
                    }
                }

                if (cardPlayed) {
                    if (turn.handName === this.hand) {
                        handsPlayedWithCard++;
                    }
                }
            });
        }

        return handsPlayedWithCard;
    }

    public willHandAffectObjective(handClassification: HandClassification, cardsPlayed: CardPlacement[]): boolean {
        let doesHandMatch = false;
        let doesCardMatch = false;

        if (handClassification.handName === this.hand || handClassification.baseHandNames.includes(this.hand)) {
            doesHandMatch = true;
        }

        for (const cardPlacement of cardsPlayed) {
            if (cardPlacement?.card?.rank === this.rank && cardPlacement.card.suit === this.suit) {
                doesCardMatch = true;
            }
        }

        return doesHandMatch && doesCardMatch;
    }
}
