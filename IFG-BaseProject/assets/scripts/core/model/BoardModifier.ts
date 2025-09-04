import { BoardModifierType } from '../enums/BoardModifierType';

export class BoardModifier {
    type: BoardModifierType = BoardModifierType.None;
    expires: boolean = false;
    expiresTurnCount: number = 0;

    constructor(modifierType: BoardModifierType = BoardModifierType.None, expires: boolean = false, expiresTurnCount: number = 0) {
        this.type = modifierType;
        this.expires = expires;
        this.expiresTurnCount = expiresTurnCount;
    }

    public equals(other: BoardModifier): boolean {
        return this.type === other.type && this.expires === other.expires && this.expiresTurnCount === other.expiresTurnCount;
    }

    public static fromObject(obj: any): BoardModifier {
        const modifierType = BoardModifierType[obj.type as keyof typeof BoardModifierType];

        if (!modifierType) {
            throw new Error(`Invalid modifierType: ${obj.type}`);
        }

        switch (modifierType) {
            case BoardModifierType.Null:
                return NullModifier.fromObject(obj);
            case BoardModifierType.BreakableWall:
                return BreakableWallModifier.fromObject(obj);
            case BoardModifierType.HandMultiplier:
                return HandMultiplierModifier.fromObject(obj);
            case BoardModifierType.BurningFood:
                return BurningFoodModifier.fromObject(obj);
            case BoardModifierType.BurnedTile:
                return BurnedTileModifier.fromObject(obj);
            default: {
                throw new Error(`BoardModifier: Unexpected Modifier Type: ${modifierType}`);
            }
        }
    }
}

export class NullModifier extends BoardModifier {
    constructor() {
        super(BoardModifierType.Null, false, 0);
    }

    public equals(other: NullModifier): boolean {
        return super.equals(other);
    }

    public static fromObject(obj: any): NullModifier {
        return new NullModifier();
    }
}

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

export class HandMultiplierModifier extends BoardModifier {
    multiplier: number = 2;

    constructor(multiplier: number = 2, expires: boolean = false, expiresTurnCount: number = 0) {
        super(BoardModifierType.HandMultiplier, expires, expiresTurnCount);
        this.multiplier = multiplier;
    }

    public equals(other: HandMultiplierModifier): boolean {
        return super.equals(other) && this.multiplier === other.multiplier;
    }

    public static fromObject(obj: any): HandMultiplierModifier {
        return new HandMultiplierModifier(obj?.multiplier || 2, obj?.expires || false, obj?.expiresTurnCount || 0);
    }
}

export class BurningFoodModifier extends BoardModifier {
    constructor(expires: boolean = false, expiresTurnCount: number = 0) {
        super(BoardModifierType.BurningFood, expires, expiresTurnCount);
    }

    public equals(other: BurningFoodModifier): boolean {
        return super.equals(other);
    }

    public static fromObject(obj: any): BurningFoodModifier {
        return new BurningFoodModifier(obj?.expires || false, obj?.expiresTurnCount || 0);
    }
}

export class BurnedTileModifier extends BoardModifier {
    constructor() {
        super(BoardModifierType.BurnedTile, false, 0);
    }

    public equals(other: BurnedTileModifier): boolean {
        return super.equals(other);
    }

    public static fromObject(obj: any): BurnedTileModifier {
        return new BurnedTileModifier();
    }
}

export class BreakableWallModifier extends BoardModifier {
    reinforced: boolean = false;
    requiredRank: number = -1; // -1 means it is not required
    requiredSuit: number = -1;
    boardIndex: number = -1;

    constructor(
        requiredRank: number = -1,
        requiredSuit: number = -1,
        reinforced: boolean = false,
        boardIndex: number = -1,
        expires: boolean = false,
        expiresTurnCount: number = 0
    ) {
        super(BoardModifierType.BreakableWall, expires, expiresTurnCount);
        this.reinforced = reinforced;
        this.requiredRank = requiredRank;
        this.requiredSuit = requiredSuit;
        this.boardIndex = boardIndex;
    }

    public equals(other: BreakableWallModifier): boolean {
        return (
            super.equals(other) &&
            this.reinforced === other.reinforced &&
            this.requiredRank === other.requiredRank &&
            this.requiredSuit === other.requiredSuit &&
            this.boardIndex === other.boardIndex
        );
    }

    public static fromObject(obj: any): BreakableWallModifier {
        return new BreakableWallModifier(
            obj?.requiredRank || -1,
            obj?.requiredSuit || -1,
            obj?.reinforced || false,
            obj?.boardIndex || -1,
            obj?.expires || false,
            obj?.expiresTurnCount || 0
        );
    }
}
