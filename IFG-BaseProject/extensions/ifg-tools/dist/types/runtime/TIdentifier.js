"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DescribeError = exports.Validate = exports.Identifier = exports.IdentifierKind = exports.IdentifierSuffix = void 0;
const typebox_1 = require("@sinclair/typebox");
const identifiers_1 = require("./identifiers");
exports.IdentifierSuffix = "Identifier";
function IdentifierKind(type) {
    return `${type}${exports.IdentifierSuffix}`;
}
exports.IdentifierKind = IdentifierKind;
function Identifier(identifierType) {
    return {
        [typebox_1.Kind]: `${identifierType}${exports.IdentifierSuffix}`,
        type: 'string',
        identifierType
    };
}
exports.Identifier = Identifier;
function Validate(schema, value) {
    if (typeof value !== 'string') {
        return false;
    }
    const identifierType = schema[typebox_1.Kind].substring(0, schema[typebox_1.Kind].length - exports.IdentifierSuffix.length);
    (0, identifiers_1.registerIdentifier)(identifierType, value);
    return true;
}
exports.Validate = Validate;
function DescribeError(error) {
    return "Expected string";
}
exports.DescribeError = DescribeError;
