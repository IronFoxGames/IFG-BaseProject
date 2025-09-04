"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = exports.ComparisonOperator = void 0;
var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["equal"] = "equal";
    ComparisonOperator["notEqual"] = "notEqual";
    ComparisonOperator["lessThan"] = "lessThan";
    ComparisonOperator["lessThanEqual"] = "lessThanEqual";
    ComparisonOperator["greaterThan"] = "greaterThan";
    ComparisonOperator["greaterThanEqual"] = "greaterThanEqual";
})(ComparisonOperator = exports.ComparisonOperator || (exports.ComparisonOperator = {}));
function compare(operator, left, right) {
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
exports.compare = compare;
