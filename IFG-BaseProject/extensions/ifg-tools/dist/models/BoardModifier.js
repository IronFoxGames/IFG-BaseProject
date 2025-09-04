"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakableWallModifier = exports.BurnedTileModifier = exports.BurningFoodModifier = exports.HandMultiplierModifier = exports.NullModifier = exports.BoardModifier = void 0;
const BoardModifierType_1 = require("../enums/BoardModifierType");
class BoardModifier {
    constructor(modifierType = BoardModifierType_1.BoardModifierType.None, expires = false, expiresTurnCount = 0) {
        this.type = BoardModifierType_1.BoardModifierType.None;
        this.expires = false;
        this.expiresTurnCount = 0;
        this.type = modifierType;
        this.expires = expires;
        this.expiresTurnCount = expiresTurnCount;
    }
    equals(other) {
        return this.type === other.type && this.expires === other.expires && this.expiresTurnCount === other.expiresTurnCount;
    }
    static fromObject(obj) {
        const modifierType = BoardModifierType_1.BoardModifierType[obj.type];
        if (!modifierType) {
            throw new Error(`Invalid modifierType: ${obj.type}`);
        }
        switch (modifierType) {
            case BoardModifierType_1.BoardModifierType.Null:
                return NullModifier.fromObject(obj);
            case BoardModifierType_1.BoardModifierType.BreakableWall:
                return BreakableWallModifier.fromObject(obj);
            case BoardModifierType_1.BoardModifierType.HandMultiplier:
                return HandMultiplierModifier.fromObject(obj);
            case BoardModifierType_1.BoardModifierType.BurningFood:
                return BurningFoodModifier.fromObject(obj);
            case BoardModifierType_1.BoardModifierType.BurnedTile:
                return BurnedTileModifier.fromObject(obj);
            default: {
                throw new Error(`BoardModifier: Unexpected Modifier Type: ${modifierType}`);
            }
        }
    }
}
exports.BoardModifier = BoardModifier;
class NullModifier extends BoardModifier {
    constructor() {
        super(BoardModifierType_1.BoardModifierType.Null, false, 0);
    }
    equals(other) {
        return super.equals(other);
    }
    static fromObject(obj) {
        return new NullModifier();
    }
}
exports.NullModifier = NullModifier;
// export class BlockerModifier extends BoardModifier {
//     removable: boolean = false;
//     constructor(removable: boolean = false, expires: boolean = false, expiresTurnCount: number = 0) {
//         super(BoardModifierType.Blocker, expires, expiresTurnCount);
//         this.removable = removable;
//     }
//     public equals(other: BlockerModifier): boolean {
//         return super.equals(other) && this.removable === other.removable;
//     }
//     public static fromObject(obj: any): BlockerModifier {
//         return new BlockerModifier(obj?.removable || false, obj?.expires || false, obj?.expiresTurnCount || 0);
//     }
// }
class HandMultiplierModifier extends BoardModifier {
    constructor(multiplier = 2, expires = false, expiresTurnCount = 0) {
        super(BoardModifierType_1.BoardModifierType.HandMultiplier, expires, expiresTurnCount);
        this.multiplier = 2;
        this.multiplier = multiplier;
    }
    equals(other) {
        return super.equals(other) && this.multiplier === other.multiplier;
    }
    static fromObject(obj) {
        return new HandMultiplierModifier((obj === null || obj === void 0 ? void 0 : obj.multiplier) || 2, (obj === null || obj === void 0 ? void 0 : obj.expires) || false, (obj === null || obj === void 0 ? void 0 : obj.expiresTurnCount) || 0);
    }
}
exports.HandMultiplierModifier = HandMultiplierModifier;
class BurningFoodModifier extends BoardModifier {
    constructor(expires = false, expiresTurnCount = 0) {
        super(BoardModifierType_1.BoardModifierType.BurningFood, expires, expiresTurnCount);
    }
    equals(other) {
        return super.equals(other);
    }
    static fromObject(obj) {
        return new BurningFoodModifier((obj === null || obj === void 0 ? void 0 : obj.expires) || false, (obj === null || obj === void 0 ? void 0 : obj.expiresTurnCount) || 0);
    }
}
exports.BurningFoodModifier = BurningFoodModifier;
class BurnedTileModifier extends BoardModifier {
    constructor() {
        super(BoardModifierType_1.BoardModifierType.BurnedTile, false, 0);
    }
    equals(other) {
        return super.equals(other);
    }
    static fromObject(obj) {
        return new BurnedTileModifier();
    }
}
exports.BurnedTileModifier = BurnedTileModifier;
class BreakableWallModifier extends BoardModifier {
    constructor(requiredRank = -1, requiredSuit = -1, reinforced = false, boardIndex = -1, expires = false, expiresTurnCount = 0) {
        super(BoardModifierType_1.BoardModifierType.BreakableWall, expires, expiresTurnCount);
        this.reinforced = false;
        this.requiredRank = -1; // -1 means it is not required
        this.requiredSuit = -1;
        this.boardIndex = -1;
        this.reinforced = reinforced;
        this.requiredRank = requiredRank;
        this.requiredSuit = requiredSuit;
        this.boardIndex = boardIndex;
    }
    equals(other) {
        return (super.equals(other) &&
            this.reinforced === other.reinforced &&
            this.requiredRank === other.requiredRank &&
            this.requiredSuit === other.requiredSuit &&
            this.boardIndex === other.boardIndex);
    }
    static fromObject(obj) {
        return new BreakableWallModifier((obj === null || obj === void 0 ? void 0 : obj.requiredRank) || -1, (obj === null || obj === void 0 ? void 0 : obj.requiredSuit) || -1, (obj === null || obj === void 0 ? void 0 : obj.reinforced) || false, (obj === null || obj === void 0 ? void 0 : obj.boardIndex) || -1, (obj === null || obj === void 0 ? void 0 : obj.expires) || false, (obj === null || obj === void 0 ? void 0 : obj.expiresTurnCount) || 0);
    }
}
exports.BreakableWallModifier = BreakableWallModifier;
