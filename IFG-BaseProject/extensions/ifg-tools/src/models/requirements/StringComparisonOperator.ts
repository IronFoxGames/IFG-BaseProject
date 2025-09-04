export enum StringComparisonOperator {
    equal = 'equal',
    notEqual = 'notEqual',
    contains = 'contains',
    startsWith = 'startsWith'
}

export function compare(operator: StringComparisonOperator, left: string, right: string): boolean {
    switch (operator) {
        case StringComparisonOperator.equal:
            return left === right;
        case StringComparisonOperator.notEqual:
            return left !== right;
        case StringComparisonOperator.contains:
            return left.includes(right);
        case StringComparisonOperator.startsWith:
            return left.startsWith(right);
        default:
            throw new Error(`Unknown StringComparisonOperator: ${operator}`);
    }
}
