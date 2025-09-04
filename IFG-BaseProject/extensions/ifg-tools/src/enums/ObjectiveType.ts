export enum ObjectiveType {
    Score = 'Score',
    HandPlayedAny = 'HandPlayedAny',
    HandPlayed = 'HandPlayed',
    TurnLimit = 'TurnLimit',
    HandPlayedWithScore = 'HandPlayedWithScore',
    CardPlayed = 'CardPlayed',
    TilePlacement = 'TilePlacement',
    CardPlayedWithHand = 'CardPlayedWithHand'
}

export function getEnumIndex<T extends object>(enumObj: T, value: T[keyof T]): number {
    return Object.values(enumObj).indexOf(value as unknown as string | number);
}
