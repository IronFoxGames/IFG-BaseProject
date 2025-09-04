import { BoardModifier } from './BoardModifier';

export class BoardModifierPlacement {
    boardIndex: number = -1;
    modifier: BoardModifier = new BoardModifier();

    constructor(boardIndex: number, modifier: BoardModifier) {
        this.boardIndex = boardIndex;
        this.modifier = modifier;
    }

    public static fromObject(obj: any): BoardModifierPlacement {
        try {
            const modifier = BoardModifier.fromObject(obj.modifier);
            if (!modifier) {
                throw new Error(`Invalid modifier: ${obj.modifier}`);
            }
            return new BoardModifierPlacement(obj.boardIndex, modifier);
        } catch (err) {
            throw new Error(`Failed to create BoardModifier with err: ${err}`);
        }
    }
}
