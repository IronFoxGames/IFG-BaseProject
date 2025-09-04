"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validate = exports.DescribeError = exports.ValidatePredicate = exports.JsonResourcePath = exports.Kind = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.Kind = `JsonResourcePath`;
function JsonResourcePath() {
    return {
        [typebox_1.Kind]: exports.Kind,
        type: 'string'
    };
}
exports.JsonResourcePath = JsonResourcePath;
function ValidatePredicate(schema, value) {
    if (typeof value !== 'string') {
        return false;
    }
    return true;
}
exports.ValidatePredicate = ValidatePredicate;
function DescribeError(error) {
    if (typeof error.value !== 'string') {
        return "Expected string";
    }
    return null;
}
exports.DescribeError = DescribeError;
exports.Validate = ValidatePredicate;
