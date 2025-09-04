"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = exports.StringComparisonOperator = void 0;
var StringComparisonOperator;
(function (StringComparisonOperator) {
    StringComparisonOperator["equal"] = "equal";
    StringComparisonOperator["notEqual"] = "notEqual";
    StringComparisonOperator["contains"] = "contains";
    StringComparisonOperator["startsWith"] = "startsWith";
})(StringComparisonOperator = exports.StringComparisonOperator || (exports.StringComparisonOperator = {}));
function compare(operator, left, right) {
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
exports.compare = compare;
