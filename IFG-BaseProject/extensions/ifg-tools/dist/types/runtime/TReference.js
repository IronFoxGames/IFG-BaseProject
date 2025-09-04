"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DescribeError = exports.Validate = exports.Reference = exports.ReferenceKind = exports.ReferenceSuffix = void 0;
const typebox_1 = require("@sinclair/typebox");
const identifiers_1 = require("./identifiers");
exports.ReferenceSuffix = "Reference";
function ReferenceKind(type) {
    return `${type}${exports.ReferenceSuffix}`;
}
exports.ReferenceKind = ReferenceKind;
function Reference(referenceType) {
    return {
        [typebox_1.Kind]: `${referenceType}${exports.ReferenceSuffix}`,
        type: 'string',
        referenceType: referenceType
    };
}
exports.Reference = Reference;
const emptySet = new Set();
function Validate(schema, value) {
    if (typeof value !== 'string') {
        return false;
    }
    const referenceType = schema[typebox_1.Kind].substring(0, schema[typebox_1.Kind].length - exports.ReferenceSuffix.length);
    return (0, identifiers_1.isValidReference)(referenceType, value);
}
exports.Validate = Validate;
function DescribeError(error) {
    if (typeof error.value !== 'string') {
        return "Expected string";
    }
    const referenceType = error.schema[typebox_1.Kind].substring(0, error.schema[typebox_1.Kind].length - exports.ReferenceSuffix.length);
    return `Invalid ${referenceType} reference`;
}
exports.DescribeError = DescribeError;
