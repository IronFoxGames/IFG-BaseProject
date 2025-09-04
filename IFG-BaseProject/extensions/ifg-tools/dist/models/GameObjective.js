"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameObjective = void 0;
const ObjectiveType_1 = require("../enums/ObjectiveType");
const ObjectiveParams_1 = require("./ObjectiveParams");
class GameObjective {
    constructor() {
        this.objectiveDataList = [];
    }
    equals(other) {
        if (!this.objectiveDataList || !other.objectiveDataList) {
            return false;
        }
        if (this.objectiveDataList.length !== other.objectiveDataList.length) {
            return false;
        }
        this.objectiveDataList.forEach((objective, index) => {
            if (other.objectiveDataList) {
                if (objective.objectiveType !== other.objectiveDataList[index].objectiveType) {
                    return false;
                }
                if (!objective.equals(other.objectiveDataList[index])) {
                    return false;
                }
            }
        });
        return true;
    }
    static fromObject(obj) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const gameObjective = new GameObjective();
        if (obj.objectiveDataList) {
            gameObjective.objectiveDataList = [];
            //Sort so that TurnLimit objectives come last always
            obj.objectiveDataList.sort((a, b) => {
                if (a.objectiveType === ObjectiveType_1.ObjectiveType.TurnLimit && b.objectiveType !== ObjectiveType_1.ObjectiveType.TurnLimit) {
                    return 1;
                }
                else if (b.objectiveType === ObjectiveType_1.ObjectiveType.TurnLimit && a.objectiveType !== ObjectiveType_1.ObjectiveType.TurnLimit) {
                    return -1;
                }
                else {
                    return 0;
                }
            });
            for (const data of obj.objectiveDataList) {
                //TODO: Add other objective types when they get created
                switch (data.objectiveType) {
                    case ObjectiveType_1.ObjectiveType.Score:
                        (_a = gameObjective.objectiveDataList) === null || _a === void 0 ? void 0 : _a.push(ObjectiveParams_1.ScoreObjectiveParams.fromObject(data));
                        break;
                    case ObjectiveType_1.ObjectiveType.HandPlayed:
                        (_b = gameObjective.objectiveDataList) === null || _b === void 0 ? void 0 : _b.push(ObjectiveParams_1.HandsPlayedObjectiveParams.fromObject(data));
                        break;
                    case ObjectiveType_1.ObjectiveType.HandPlayedAny:
                        (_c = gameObjective.objectiveDataList) === null || _c === void 0 ? void 0 : _c.push(ObjectiveParams_1.HandPlayedAnyObjectiveParams.fromObject(data));
                        break;
                    case ObjectiveType_1.ObjectiveType.TurnLimit:
                        (_d = gameObjective.objectiveDataList) === null || _d === void 0 ? void 0 : _d.push(ObjectiveParams_1.TurnLimitObjectiveParams.fromObject(data));
                        break;
                    case ObjectiveType_1.ObjectiveType.CardPlayed:
                        (_e = gameObjective.objectiveDataList) === null || _e === void 0 ? void 0 : _e.push(ObjectiveParams_1.CardPlayedObjectiveParams.fromObject(data));
                        break;
                    case ObjectiveType_1.ObjectiveType.HandPlayedWithScore:
                        (_f = gameObjective.objectiveDataList) === null || _f === void 0 ? void 0 : _f.push(ObjectiveParams_1.HandPlayedWithScoreObjectiveParams.fromObject(data));
                        break;
                    case ObjectiveType_1.ObjectiveType.TilePlacement:
                        (_g = gameObjective.objectiveDataList) === null || _g === void 0 ? void 0 : _g.push(ObjectiveParams_1.TilePlacedObjectiveParams.fromObject(data));
                        break;
                    case ObjectiveType_1.ObjectiveType.CardPlayedWithHand:
                        (_h = gameObjective.objectiveDataList) === null || _h === void 0 ? void 0 : _h.push(ObjectiveParams_1.CardPlayedWithHandObjectiveParams.fromObject(data));
                        break;
                }
            }
        }
        return gameObjective;
    }
    isObjectiveComplete(score, turns) {
        let isComplete = true;
        if (this.objectiveDataList != null) {
            for (const data of this.objectiveDataList) {
                const completionData = data.isObjectiveComplete(score, turns);
                if (!completionData[0]) {
                    isComplete = false;
                }
            }
        }
        return isComplete;
    }
    getString() {
        let objString = '';
        if (this.objectiveDataList) {
            this.objectiveDataList.forEach((data, index) => {
                objString += data.getString(index > 0);
            });
        }
        return objString;
    }
    getTipText() {
        var _a;
        if (!this.objectiveDataList) {
            return '';
        }
        for (const data of this.objectiveDataList) {
            if (data === null || data === void 0 ? void 0 : data.tipText) {
                return (_a = data === null || data === void 0 ? void 0 : data.tipText) !== null && _a !== void 0 ? _a : '';
            }
        }
        return '';
    }
    getTipSprite() {
        if (!this.objectiveDataList) {
            return null;
        }
        for (const data of this.objectiveDataList) {
            if ((data === null || data === void 0 ? void 0 : data.tipSprite) && (data === null || data === void 0 ? void 0 : data.tipSprite) !== '') {
                return data.tipSprite;
            }
            else {
                return null;
            }
        }
        return null;
    }
}
exports.GameObjective = GameObjective;
