import {Deck} from './Deck';
import {GameBoardModel} from './GameBoardModel';
import {GameBoardTileModel} from './GameBoardTileModel';
import {Hand} from './Hand';
import {MatchState} from './MatchState';

export class GameModel {
    gameBoard: GameBoardModel;
    deck: Deck;
    playerHand: Hand;
    opponentHand: Hand;
    turn: number;

    constructor() {
        this.gameBoard = new GameBoardModel();
        this.deck = new Deck();
        this.playerHand = new Hand();
        this.opponentHand = new Hand();
        this.turn = 0;
    }

    public updateModelFromState(state: MatchState, board: GameBoardTileModel[]/* TODO CSB:, configuration: GameConfiguration*/): void {
        this.playerHand.updateModelFromState(state.playerHand);
        this.opponentHand.updateModelFromState(state.opponentHand);
        this.deck.updateModelFromState(state.deck);
        this.gameBoard.updateModelFromState(board);

        this.turn = state.turn;
    }
}
