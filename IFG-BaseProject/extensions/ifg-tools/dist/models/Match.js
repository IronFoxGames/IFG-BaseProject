"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Match = void 0;
const MatchState_1 = require("./MatchState");
class Match {
    constructor() {
        this.isComplete = false;
        this.playerWon = false;
        this.hasBot = false;
        this.creationTime = new Date().toISOString();
        this.state = new MatchState_1.MatchState();
    }
}
exports.Match = Match;
