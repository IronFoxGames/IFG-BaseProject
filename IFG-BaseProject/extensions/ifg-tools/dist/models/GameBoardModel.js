"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameBoardModel = void 0;
const GameBoardTileModel_1 = require("./GameBoardTileModel");
class GameBoardModel {
    constructor() {
        this.tiles = [];
        this.lastPlayedHand = null;
        this.reset();
    }
    updateModelFromState(board) {
        if (GameBoardModel.boardSize !== board.length) {
            throw new Error("Backend board size is different than frontend board size");
        }
        for (let i = 0; i < GameBoardModel.boardSize; i++) {
            this.tiles[i].updateModelFromState(board[i]);
        }
    }
    reset() {
        this.tiles = [];
        for (let i = 0; i < GameBoardModel.boardSize; i++) {
            this.tiles.push(new GameBoardTileModel_1.GameBoardTileModel());
        }
    }
}
exports.GameBoardModel = GameBoardModel;
GameBoardModel.boardSize = 13 * 13;
