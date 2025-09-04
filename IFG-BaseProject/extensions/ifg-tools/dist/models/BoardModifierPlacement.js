"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardModifierPlacement = void 0;
const BoardModifier_1 = require("./BoardModifier");
class BoardModifierPlacement {
    constructor(boardIndex, modifier) {
        this.boardIndex = -1;
        this.modifier = new BoardModifier_1.BoardModifier();
        this.boardIndex = boardIndex;
        this.modifier = modifier;
    }
    static fromObject(obj) {
        try {
            const modifier = BoardModifier_1.BoardModifier.fromObject(obj.modifier);
            if (!modifier) {
                throw new Error(`Invalid modifier: ${obj.modifier}`);
            }
            return new BoardModifierPlacement(obj.boardIndex, modifier);
        }
        catch (err) {
            throw new Error(`Failed to create BoardModifier with err: ${err}`);
        }
    }
}
exports.BoardModifierPlacement = BoardModifierPlacement;
