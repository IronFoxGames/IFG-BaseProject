"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectiveProgressData = exports.PuzzleCompleteEventData = exports.GameOverResult = void 0;
const ObjectiveType_1 = require("../enums/ObjectiveType");
var GameOverResult;
(function (GameOverResult) {
    GameOverResult["Win"] = "Win";
    GameOverResult["Lose"] = "Lose";
    GameOverResult["Quit"] = "Quit";
    GameOverResult["None"] = "None";
})(GameOverResult = exports.GameOverResult || (exports.GameOverResult = {}));
class PuzzleCompleteEventData {
    constructor(status = GameOverResult.None, objectivesComplete, score = 0, stats = null, objectiveProgress = []) {
        this.Status = GameOverResult.None;
        this.ObjectivesComplete = false;
        this.Score = 0;
        this.Stats = null;
        this.ObjectiveProgress = [];
        this.Status = status;
        this.ObjectivesComplete = objectivesComplete;
        this.Score = score;
        this.Stats = stats;
        this.ObjectiveProgress = objectiveProgress;
    }
}
exports.PuzzleCompleteEventData = PuzzleCompleteEventData;
class ObjectiveProgressData {
    constructor() {
        this.GoalID = 0;
        this.GoalProgression = 0;
        this.GoalCompleted = 0;
        this.ObjectiveType = ObjectiveType_1.ObjectiveType.Score;
    }
}
exports.ObjectiveProgressData = ObjectiveProgressData;
