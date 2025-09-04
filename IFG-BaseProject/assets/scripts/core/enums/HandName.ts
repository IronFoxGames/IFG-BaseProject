export enum HandName {
    Invalid = 'Invalid',
    Singleton = 'Singleton',
    OnePair = 'OnePair',
    TwoPair = 'TwoPair',
    ThreeOfAKind = 'ThreeOfAKind',
    Straight = 'Straight',
    Flush = 'Flush',
    FullHouse = 'FullHouse',
    FourOfAKind = 'FourOfAKind',
    StraightFlush = 'StraightFlush',
    FiveOfAKind = 'FiveOfAKind',

    // Special hands that are variants of above. HandAnalyzer only returns the above hands.
    Lowball = 'Lowball',
    PaiGow = 'PaiGow',
    Wheel = 'Wheel',
    Broadway = 'Broadway',
    SteelWheel = 'SteelWheel',
    RoyalFlush = 'RoyalFlush',
    QuadDeuces = 'QuadDeuces',
    QuadAces = 'QuadAces',
    QuintAces = 'QuintAces'
}

export enum HandTier {
    Low = 'Low',
    Mid = 'Mid',
    High = 'High'
}

export class HandNameAndTier {
    public HandName: HandName = HandName.Invalid;
    public Tier: HandTier = HandTier.Low;
}

export const HandRank: { [key in HandName]: number } = {
    [HandName.Invalid]: 0,
    [HandName.Singleton]: 1,
    [HandName.OnePair]: 2,
    [HandName.TwoPair]: 3,
    [HandName.ThreeOfAKind]: 4,
    [HandName.Straight]: 5,
    [HandName.Flush]: 6,
    [HandName.FullHouse]: 7,
    [HandName.FourOfAKind]: 8,
    [HandName.StraightFlush]: 9,
    [HandName.FiveOfAKind]: 10,

    // Special hands that are variants of above. HandAnalyzer only returns the above hands.
    [HandName.Lowball]: 11,
    [HandName.PaiGow]: 12,
    [HandName.Wheel]: 13,
    [HandName.Broadway]: 14,
    [HandName.SteelWheel]: 15,
    [HandName.RoyalFlush]: 16,
    [HandName.QuadDeuces]: 17,
    [HandName.QuadAces]: 18,
    [HandName.QuintAces]: 19
};

//This should be used to parse the internal hand names to their player facing counterparts for use in the UI...
export function HandNameToString(handName: HandName): string {
    switch (handName) {
        case HandName.Invalid:
            return 'Invalid';
        case HandName.Singleton:
            return 'High Card';
        case HandName.OnePair:
            return 'One Pair';
        case HandName.TwoPair:
            return 'Two Pair';
        case HandName.ThreeOfAKind:
            return 'Three Of A Kind';
        case HandName.Straight:
            return 'Straight';
        case HandName.Flush:
            return 'Flush';
        case HandName.FullHouse:
            return 'Full House';
        case HandName.FourOfAKind:
            return 'Four Of A Kind';
        case HandName.StraightFlush:
            return 'Straight Flush';
        case HandName.FiveOfAKind:
            return 'Five Of A Kind';
        case HandName.Lowball:
            return 'Lowball';
        case HandName.PaiGow:
            return 'Pai Gow';
        case HandName.Wheel:
            return 'Wheel';
        case HandName.Broadway:
            return 'Broadway';
        case HandName.SteelWheel:
            return 'Steel Wheel';
        case HandName.RoyalFlush:
            return 'Royal Flush';
        case HandName.QuadDeuces:
            return 'Quad Deuces';
        case HandName.QuadAces:
            return 'Quad Aces';
        case HandName.QuintAces:
            return 'Quint Aces';
        default: {
            return 'Unknown';
        }
    }
}

export function HandNameTipString(handName: HandName): string {
    switch (handName) {
        case HandName.Invalid:
            return 'Invalid';
        case HandName.Singleton:
            return 'No specific run or pairs, just one card highest.';
        case HandName.OnePair:
            return 'A single pair of cards of the same rank.';
        case HandName.TwoPair:
            return 'Two pairs of cards of the same rank.';
        case HandName.ThreeOfAKind:
            return 'Three cards of the same rank.';
        case HandName.Straight:
            return 'Five cards that can make a sequence. Not all of the same suit.';
        case HandName.Flush:
            return 'Five cards of the same suit. Not in sequence.';
        case HandName.FullHouse:
            return 'A three cards of the same rank and a pair of cards of the same rank.';
        case HandName.FourOfAKind:
            return 'Four cards of the same rank.';
        case HandName.StraightFlush:
            return 'Five cards that can make a sequence AND are all of the same suit.';
        case HandName.FiveOfAKind:
            return 'Five cards of the same rank.';
        case HandName.RoyalFlush:
            return 'Five cards that make a sequence of A, K, Q, J, 10 AND are all of the same suit.';
        default: {
            return 'Unknown';
        }
    }
}

export function HandNameToSpritePath(handName: HandName): string {
    switch (handName) {
        case HandName.Invalid:
            return 'Invalid';
        case HandName.Singleton:
            return 'help/help_highest-card/spriteFrame';
        case HandName.OnePair:
            return 'help/help_one-pair/spriteFrame';
        case HandName.TwoPair:
            return 'help/help_two-pair/spriteFrame';
        case HandName.ThreeOfAKind:
            return 'help/help_three-of-a-kind/spriteFrame';
        case HandName.Straight:
            return 'help/help_straight/spriteFrame';
        case HandName.Flush:
            return 'help/help_flush/spriteFrame';
        case HandName.FullHouse:
            return 'help/help_full-house/spriteFrame';
        case HandName.FourOfAKind:
            return 'help/help_four-of-a-kind/spriteFrame';
        case HandName.StraightFlush:
            return 'help/help_straight-flush/spriteFrame';
        case HandName.FiveOfAKind:
            return 'help/help_five-of-a-kind/spriteFrame';
        case HandName.RoyalFlush:
            return 'help/help_royal-flush/spriteFrame';
        default: {
            return 'Unknown';
        }
    }
}
