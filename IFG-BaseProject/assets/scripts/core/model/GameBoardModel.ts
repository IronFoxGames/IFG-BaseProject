import {GameBoardTileModel} from './GameBoardTileModel';

export class GameBoardModel {
    private static readonly boardSize = 13 * 13;
    tiles: GameBoardTileModel[] = [];
    lastPlayedHand: string | null = null;

    constructor() {
        this.reset();
    }

    public updateModelFromState(board: GameBoardTileModel[]): void {
        if (GameBoardModel.boardSize !== board.length) {
            throw new Error("Backend board size is different than frontend board size");
        }
        for (let i = 0; i < GameBoardModel.boardSize; i++) {
            this.tiles[i].updateModelFromState(board[i]);
        }
    }

    private reset(): void {
        this.tiles = [];
        for (let i = 0; i < GameBoardModel.boardSize; i++) {
            this.tiles.push(new GameBoardTileModel());
        }
    }
}
