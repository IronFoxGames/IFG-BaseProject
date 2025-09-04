"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameBoardTileModel = void 0;
const Card_1 = require("./Card");
const TileState_1 = require("../enums/TileState");
const BoardModifierType_1 = require("../enums/BoardModifierType");
class GameBoardTileModel {
    constructor() {
        this.state = TileState_1.TileState.Empty;
        this.card = Card_1.Card.Invalid;
        this.originalCard = Card_1.Card.Invalid;
        this.boardModifierList = [];
        this.turn = -1;
    }
    placeCard(card, originalCard) {
        this.card = card;
        this.originalCard = originalCard;
        this.state = TileState_1.TileState.Occupied_Unflipped;
    }
    pickUpCard() {
        if (this.card == Card_1.Card.Invalid) {
            return Card_1.Card.Invalid;
        }
        const pickedUpCard = new Card_1.Card(this.card);
        this.card = Card_1.Card.Invalid;
        this.originalCard = Card_1.Card.Invalid;
        this.state = TileState_1.TileState.Empty;
        return pickedUpCard;
    }
    lockCardInPlace() {
        if (!this.card.equals(Card_1.Card.Invalid)) {
            this.state = TileState_1.TileState.Occupied;
        }
    }
    // special case modifier because it's not removable, doesn't expire, and changes board render
    isNullTile() {
        var _a;
        const currentModifier = (_a = this.boardModifierList) === null || _a === void 0 ? void 0 : _a[0];
        return (currentModifier === null || currentModifier === void 0 ? void 0 : currentModifier.type) === BoardModifierType_1.BoardModifierType.Null;
    }
    updateModelFromState(tile) {
        var _a;
        // Update card state
        if (!(tile === null || tile === void 0 ? void 0 : tile.card) || (tile === null || tile === void 0 ? void 0 : tile.card) === Card_1.Card.Invalid) {
            this.card = Card_1.Card.Invalid;
            this.originalCard = Card_1.Card.Invalid;
            this.state = TileState_1.TileState.Empty;
            this.turn = -1;
        }
        else {
            this.card = new Card_1.Card(tile.card);
            this.originalCard = this.card; // Don't preserve 'original' untransformed card across state changes once it's locked in.
            this.state = TileState_1.TileState.Occupied;
            this.turn = tile.turn;
        }
        // Update modifier state
        this.boardModifierList = [];
        (_a = tile === null || tile === void 0 ? void 0 : tile.boardModifierList) === null || _a === void 0 ? void 0 : _a.forEach((modifier) => {
            this.boardModifierList.push(modifier);
        });
    }
}
exports.GameBoardTileModel = GameBoardTileModel;
