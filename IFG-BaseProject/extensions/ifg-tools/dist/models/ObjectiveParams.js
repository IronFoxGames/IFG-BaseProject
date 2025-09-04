"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardPlayedWithHandObjectiveParams = exports.CardPlayedObjectiveParams = exports.HandPlayedWithScoreObjectiveParams = exports.TilePlacedObjectiveParams = exports.TurnLimitObjectiveParams = exports.HandPlayedAnyObjectiveParams = exports.HandsPlayedObjectiveParams = exports.ScoreObjectiveParams = exports.ObjectiveParams = void 0;
const HandName_1 = require("../enums/HandName");
const ObjectiveType_1 = require("../enums/ObjectiveType");
const Card_1 = require("./Card");
class ObjectiveParams {
    constructor() {
        this.objectiveType = ObjectiveType_1.ObjectiveType.Score;
        this.tipText = '';
        this.tipSprite = null;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        return this === other;
    }
    static fromObject(obj) {
        // This will be overridden in subclasses anyway
        throw new Error('Must implement fromObject in subclass');
    }
    getPipCount() {
        throw new Error('ObjectiveParams base class not implemented');
    }
    getPipsCompleted(score, turns) {
        throw new Error('ObjectiveParams base class not implemented');
    }
    isObjectiveComplete(score, turns) {
        throw new Error('ObjectiveParams base class not implemented');
    }
    getString(getPrefix) {
        throw new Error('ObjectiveParams base class not implemented');
    }
    willHandAffectObjective(handClassification, cardsPlayed) {
        throw new Error('ObjectiveParams base class not implemented');
    }
}
exports.ObjectiveParams = ObjectiveParams;
class ScoreObjectiveParams extends ObjectiveParams {
    constructor() {
        super(...arguments);
        this.score = 0;
        this.tipText = '';
        this.tipSprite = null;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        return this.score === other.score;
    }
    static fromObject(obj) {
        const params = new ScoreObjectiveParams();
        params.score = obj.score;
        params.objectiveType = obj.objectiveType;
        params.tipText = `Score the target number of points by playing the best hands possible.`;
        return params;
    }
    getPipCount() {
        return 1;
    }
    getPipsCompleted(score, turns) {
        return this.isObjectiveComplete(score, turns)[0] ? 1 : 0;
    }
    isObjectiveComplete(score, turns) {
        let progress = score / this.score;
        return [score >= this.score, Math.min(progress, 1)];
    }
    getString(getPrefix) {
        if (getPrefix) {
            return ` and score ${this.score} points`;
        }
        return `Score ${this.score} points`;
    }
    willHandAffectObjective(handClassification, cardsPlayed) {
        if (handClassification.scoreWithModifier > 0) {
            return true;
        }
        return false;
    }
}
exports.ScoreObjectiveParams = ScoreObjectiveParams;
class HandsPlayedObjectiveParams extends ObjectiveParams {
    constructor() {
        super(...arguments);
        this.hand = HandName_1.HandName.Invalid;
        this.count = 0;
        this.tipText = '';
        this.tipSprite = null;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        return this.hand === other.hand && this.count === other.count;
    }
    static fromObject(obj) {
        const params = new HandsPlayedObjectiveParams();
        params.objectiveType = obj.objectiveType;
        params.hand = obj.hand;
        params.count = obj.count;
        params.tipText = (0, HandName_1.HandNameTipString)(obj.hand);
        params.tipSprite = (0, HandName_1.HandNameToSpritePath)(obj.hand);
        return params;
    }
    getPipCount() {
        return this.count;
    }
    getPipsCompleted(score, turns) {
        return this._getHandsPlayedCount(score, turns);
    }
    isObjectiveComplete(score, turns) {
        let playedCount = this._getHandsPlayedCount(score, turns);
        let progress = playedCount / this.count;
        return [playedCount >= this.count, Math.min(progress, 1)];
    }
    getString(getPrefix) {
        let objString = `Play ${(0, HandName_1.HandNameToString)(this.hand)} hands`;
        if (getPrefix) {
            objString = ` and play ${(0, HandName_1.HandNameToString)(this.hand)} hands`;
        }
        return objString;
    }
    _getHandsPlayedCount(score, turns) {
        let playedCount = 0;
        for (const turn of turns) {
            if (turn.baseHands && (turn.handName === this.hand || turn.baseHands.includes(this.hand))) {
                playedCount++;
            }
        }
        return playedCount;
    }
    willHandAffectObjective(handClassification, cardsPlayed) {
        if (handClassification.handName === this.hand || handClassification.baseHandNames.includes(this.hand)) {
            return true;
        }
        return false;
    }
}
exports.HandsPlayedObjectiveParams = HandsPlayedObjectiveParams;
class HandPlayedAnyObjectiveParams extends ObjectiveParams {
    constructor() {
        super(...arguments);
        this.count = 0;
        this.tipText = '';
        this.tipSprite = null;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        return this.count === other.count;
    }
    static fromObject(obj) {
        const params = new HandPlayedAnyObjectiveParams();
        params.objectiveType = obj.objectiveType;
        params.count = obj.count;
        params.tipText =
            obj.tipText !== undefined && obj.tipText !== ''
                ? obj.tipText
                : `Place a line of 5 cards on the board and click \"PLAY\" to play the Hand.`;
        params.tipSprite = 'help/help_any-hand/spriteFrame';
        return params;
    }
    getPipCount() {
        return this.count;
    }
    getPipsCompleted(score, turns) {
        return this._getHandsPlayedCount(score, turns);
    }
    isObjectiveComplete(score, turns) {
        let playedCount = this._getHandsPlayedCount(score, turns);
        let progress = playedCount / this.count;
        return [playedCount >= this.count, Math.min(progress, 1)];
    }
    getString(getPrefix) {
        if (this.count === 1) {
            let objString = `Play a Hand`;
            if (getPrefix) {
                objString = ` and play a Hand.`;
            }
            return objString;
        }
        else {
            let objString = `Play ${this.count} Hands`;
            if (getPrefix) {
                objString = ` and play ${this.count} Hands`;
            }
            return objString;
        }
    }
    _getHandsPlayedCount(score, turns) {
        let playedCount = 0;
        for (const turn of turns) {
            if (turn.baseHands) {
                playedCount++;
            }
        }
        return playedCount;
    }
    willHandAffectObjective(handClassification, cardsPlayed) {
        return true;
    }
}
exports.HandPlayedAnyObjectiveParams = HandPlayedAnyObjectiveParams;
class TurnLimitObjectiveParams extends ObjectiveParams {
    constructor() {
        super(...arguments);
        this.turnLimit = 0;
        this.tipText = '';
        this.tipSprite = null;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        return this.turnLimit === other.turnLimit;
    }
    static fromObject(obj) {
        const params = new TurnLimitObjectiveParams();
        params.turnLimit = obj.turnLimit;
        params.objectiveType = obj.objectiveType;
        params.tipText = `All other objectives must be completed before ${obj.turnLimit} turns have been played.`;
        params.tipSprite = null;
        return params;
    }
    getPipCount() {
        return 1;
    }
    getPipsCompleted(score, turns) {
        return this.isObjectiveComplete(score, turns)[0] ? 1 : 0;
    }
    isObjectiveComplete(score, turns) {
        let progress = turns.length / this.turnLimit;
        return [turns.length <= this.turnLimit, Math.min(progress, 1)];
    }
    getString(getPrefix) {
        if (getPrefix) {
            return ` by the end of turn ${this.turnLimit}`;
        }
        return `Win in less than ${this.turnLimit} turns`;
    }
    willHandAffectObjective(handClassification, cardsPlayed) {
        return true;
    }
}
exports.TurnLimitObjectiveParams = TurnLimitObjectiveParams;
class TilePlacedObjectiveParams extends ObjectiveParams {
    constructor() {
        super(...arguments);
        this.tileIndices = [];
        this.tipText = '';
        this.tipSprite = null;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        return this.tileIndices === other.tileIndices;
    }
    static fromObject(obj) {
        const params = new TilePlacedObjectiveParams();
        params.tileIndices = obj.tileIndices;
        params.objectiveType = obj.objectiveType;
        params.tipText = `Cover the target tiles`;
        params.tipSprite = 'help/help_target-tiles/spriteFrame';
        return params;
    }
    getPipCount() {
        return this.tileIndices.length;
    }
    getPipsCompleted(score, turns) {
        return this._getTilesPlaced(score, turns);
    }
    isObjectiveComplete(score, turns) {
        let tilesPlaced = this._getTilesPlaced(score, turns);
        let progress = tilesPlaced / this.tileIndices.length;
        return [tilesPlaced === this.tileIndices.length, progress];
    }
    getString(getPrefix) {
        if (getPrefix) {
            return ` and cover the target tiles`;
        }
        return `Cover the ${this.tileIndices.length} target tiles`;
    }
    _getTilesPlaced(score, turns) {
        let foundTiles = [];
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
    willHandAffectObjective(handClassification, cardsPlayed) {
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
exports.TilePlacedObjectiveParams = TilePlacedObjectiveParams;
class HandPlayedWithScoreObjectiveParams extends ObjectiveParams {
    constructor() {
        super(...arguments);
        this.hand = HandName_1.HandName.Invalid;
        this.score = 0;
        this.tipText = '';
        this.tipSprite = null;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        return this.hand === other.hand && this.score === other.score;
    }
    static fromObject(obj) {
        const params = new HandPlayedWithScoreObjectiveParams();
        params.hand = obj.hand;
        params.score = obj.score;
        params.objectiveType = obj.objectiveType;
        params.tipText = (0, HandName_1.HandNameTipString)(obj.hand);
        params.tipSprite = (0, HandName_1.HandNameToSpritePath)(obj.hand);
        return params;
    }
    getPipCount() {
        return 1;
    }
    getPipsCompleted(score, turns) {
        return this.isObjectiveComplete(score, turns)[0] ? 1 : 0;
    }
    isObjectiveComplete(score, turns) {
        let scoreAchieved = 0;
        for (const turn of turns) {
            if (turn.baseHands && (turn.handName === this.hand || turn.baseHands.includes(this.hand))) {
                scoreAchieved += turn.score;
                //Add this because losing score should not affect the objective
                scoreAchieved += turn.scoreLossAmount;
            }
        }
        let progress = scoreAchieved / this.score;
        return [scoreAchieved >= this.score, Math.min(progress, 1)];
    }
    getString(getPrefix) {
        if (getPrefix) {
            return ` and score at least ${this.score} points in ${(0, HandName_1.HandNameToString)(this.hand)} hands`;
        }
        return `Score at least ${this.score} points in ${(0, HandName_1.HandNameToString)(this.hand)} hands`;
    }
    willHandAffectObjective(handClassification, cardsPlayed) {
        if ((handClassification.handName === this.hand || handClassification.baseHandNames.includes(this.hand)) &&
            handClassification.scoreWithModifier >= 0) {
            return true;
        }
        return false;
    }
}
exports.HandPlayedWithScoreObjectiveParams = HandPlayedWithScoreObjectiveParams;
class CardPlayedObjectiveParams extends ObjectiveParams {
    constructor() {
        super(...arguments);
        this.rank = 0;
        this.suit = 0;
        this.count = 0;
        this.tipText = '';
        this.tipSprite = null;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        return this.rank === other.rank && this.suit === other.suit && this.count == other.count;
    }
    static fromObject(obj) {
        const params = new CardPlayedObjectiveParams();
        params.rank = obj.rank;
        params.suit = obj.suit;
        params.count = obj.count;
        params.objectiveType = obj.objectiveType;
        params.tipText = `Play the required amount of specific cards in any hand.`;
        params.tipSprite = null; //TODO: Construct sprite card from rank and suit, cards currently aren't in the resources folder
        return params;
    }
    getPipCount() {
        return this.count;
    }
    getPipsCompleted(score, turns) {
        return this._getHandsPlayedWithCardCount(score, turns);
    }
    isObjectiveComplete(score, turns) {
        let handsPlayedWithCard = this._getHandsPlayedWithCardCount(score, turns);
        return [handsPlayedWithCard >= this.count, handsPlayedWithCard / this.count];
    }
    getString(getPrefix) {
        let cardString = '';
        let card = new Card_1.Card(this.rank, this.suit);
        if (this.rank !== 0) {
            cardString += card.rankString();
        }
        switch (this.suit) {
            case 1:
                cardString += Card_1.Card.C;
                break;
            case 2:
                cardString += Card_1.Card.D;
                break;
            case 3:
                cardString += Card_1.Card.H;
                break;
            case 4:
                cardString += Card_1.Card.S;
                break;
        }
        if (getPrefix) {
            return ` and play ${cardString}s`;
        }
        return `Play ${cardString}s`;
    }
    _getHandsPlayedWithCardCount(score, turns) {
        let handsPlayedWithCard = 0;
        for (const turn of turns) {
            turn.scoredHand.forEach((cardPlacement) => {
                var _a, _b, _c;
                if (this.suit === 0 && this.rank !== 0) {
                    if (((_a = cardPlacement.card) === null || _a === void 0 ? void 0 : _a.rank) === this.rank) {
                        handsPlayedWithCard++;
                    }
                }
                else if (this.suit !== 0 && this.rank === 0) {
                    if (((_b = cardPlacement.card) === null || _b === void 0 ? void 0 : _b.suit) === this.suit) {
                        handsPlayedWithCard++;
                    }
                }
                else if (this.suit !== 0 && this.rank !== 0) {
                    if (((_c = cardPlacement.card) === null || _c === void 0 ? void 0 : _c.suit) === this.suit && cardPlacement.card.rank === this.rank) {
                        handsPlayedWithCard++;
                    }
                }
            });
        }
        return handsPlayedWithCard;
    }
    willHandAffectObjective(handClassification, cardsPlayed) {
        var _a;
        for (const cardPlacement of cardsPlayed) {
            if (((_a = cardPlacement === null || cardPlacement === void 0 ? void 0 : cardPlacement.card) === null || _a === void 0 ? void 0 : _a.rank) === this.rank && cardPlacement.card.suit === this.suit) {
                return true;
            }
        }
        return false;
    }
}
exports.CardPlayedObjectiveParams = CardPlayedObjectiveParams;
class CardPlayedWithHandObjectiveParams extends ObjectiveParams {
    constructor() {
        super(...arguments);
        this.rank = 0;
        this.suit = 0;
        this.count = 0;
        this.hand = HandName_1.HandName.Invalid;
        this.tipText = '';
        this.tipSprite = null;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        return this.rank === other.rank && this.suit === other.suit && this.count == other.count && this.hand === other.hand;
    }
    static fromObject(obj) {
        const params = new CardPlayedWithHandObjectiveParams();
        params.rank = obj.rank;
        params.suit = obj.suit;
        params.count = obj.count;
        params.hand = obj.hand;
        params.objectiveType = obj.objectiveType;
        params.tipText = `Play the required card in the specified hand. The card does not need to be an active part of that hand. Multiples of the card will each count.`;
        params.tipSprite = (0, HandName_1.HandNameToSpritePath)(obj.hand);
        return params;
    }
    getPipCount() {
        return this.count;
    }
    getPipsCompleted(score, turns) {
        return this._getHandsPlayedWithCardCount(score, turns);
    }
    isObjectiveComplete(score, turns) {
        let handsPlayedWithCard = this._getHandsPlayedWithCardCount(score, turns);
        return [handsPlayedWithCard >= this.count, handsPlayedWithCard / this.count];
    }
    getString(getPrefix) {
        let cardString = '';
        let card = new Card_1.Card(this.rank, this.suit);
        if (this.rank !== 0) {
            cardString += card.rankString();
        }
        switch (this.suit) {
            case 1:
                cardString += Card_1.Card.C;
                break;
            case 2:
                cardString += Card_1.Card.D;
                break;
            case 3:
                cardString += Card_1.Card.H;
                break;
            case 4:
                cardString += Card_1.Card.S;
                break;
        }
        if (getPrefix) {
            return ` and play ${cardString}s in ${(0, HandName_1.HandNameToString)(this.hand)} hands`;
        }
        return `Play ${cardString}s in ${(0, HandName_1.HandNameToString)(this.hand)} hands`;
    }
    _getHandsPlayedWithCardCount(score, turns) {
        let handsPlayedWithCard = 0;
        for (const turn of turns) {
            turn.scoredHand.forEach((cardPlacement) => {
                var _a, _b, _c;
                let cardPlayed = false;
                if (this.suit === 0 && this.rank !== 0) {
                    if (((_a = cardPlacement.card) === null || _a === void 0 ? void 0 : _a.rank) === this.rank) {
                        cardPlayed = true;
                    }
                }
                else if (this.suit !== 0 && this.rank === 0) {
                    if (((_b = cardPlacement.card) === null || _b === void 0 ? void 0 : _b.suit) === this.suit) {
                        cardPlayed = true;
                    }
                }
                else if (this.suit !== 0 && this.rank !== 0) {
                    if (((_c = cardPlacement.card) === null || _c === void 0 ? void 0 : _c.suit) === this.suit && cardPlacement.card.rank === this.rank) {
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
    willHandAffectObjective(handClassification, cardsPlayed) {
        var _a;
        let doesHandMatch = false;
        let doesCardMatch = false;
        if (handClassification.handName === this.hand || handClassification.baseHandNames.includes(this.hand)) {
            doesHandMatch = true;
        }
        for (const cardPlacement of cardsPlayed) {
            if (((_a = cardPlacement === null || cardPlacement === void 0 ? void 0 : cardPlacement.card) === null || _a === void 0 ? void 0 : _a.rank) === this.rank && cardPlacement.card.suit === this.suit) {
                doesCardMatch = true;
            }
        }
        return doesHandMatch && doesCardMatch;
    }
}
exports.CardPlayedWithHandObjectiveParams = CardPlayedWithHandObjectiveParams;
