export enum ComparisonOperator {
    equal = 'equal',
    notEqual = 'notEqual',
    lessThan = 'lessThan',
    lessThanEqual = 'lessThanEqual',
    greaterThan = 'greaterThan',
    greaterThanEqual = 'greaterThanEqual'
}

export function compare(operator: ComparisonOperator, left: number, right: number): boolean {
    switch (operator) {
        case ComparisonOperator.equal:
            return left === right;
        case ComparisonOperator.notEqual:
            return left !== right;
        case ComparisonOperator.lessThan:
            return left < right;
        case ComparisonOperator.lessThanEqual:
            return left <= right;
        case ComparisonOperator.greaterThan:
            return left > right;
        case ComparisonOperator.greaterThanEqual:
            return left >= right;
        default:
            throw new Error(`Unknown ComparisonOperator: ${operator}`);
    }
}
