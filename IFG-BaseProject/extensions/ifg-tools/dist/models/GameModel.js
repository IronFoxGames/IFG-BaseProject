"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModel = void 0;
const Deck_1 = require("./Deck");
const GameBoardModel_1 = require("./GameBoardModel");
const Hand_1 = require("./Hand");
class GameModel {
    constructor() {
        this.gameBoard = new GameBoardModel_1.GameBoardModel();
        this.deck = new Deck_1.Deck();
        this.playerHand = new Hand_1.Hand();
        this.opponentHand = new Hand_1.Hand();
        this.turn = 0;
    }
    updateModelFromState(state, board /* TODO CSB:, configuration: GameConfiguration*/) {
        this.playerHand.updateModelFromState(state.playerHand);
        this.opponentHand.updateModelFromState(state.opponentHand);
        this.deck.updateModelFromState(state.deck);
        this.gameBoard.updateModelFromState(board);
        this.turn = state.turn;
    }
}
exports.GameModel = GameModel;
