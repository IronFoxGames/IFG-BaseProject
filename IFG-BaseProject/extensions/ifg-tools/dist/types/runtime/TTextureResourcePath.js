"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validate = exports.DescribeError = exports.ValidatePredicate = exports.TextureResourcePath = exports.stripTextureSuffix = exports.Suffix = exports.Kind = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.Kind = `TextureResourcePath`;
exports.Suffix = '/texture';
function stripTextureSuffix(p) {
    return p.substring(0, p.length - exports.Suffix.length);
}
exports.stripTextureSuffix = stripTextureSuffix;
function TextureResourcePath() {
    return {
        [typebox_1.Kind]: exports.Kind,
        type: 'string'
    };
}
exports.TextureResourcePath = TextureResourcePath;
function ValidatePredicate(schema, value) {
    if (typeof value !== 'string') {
        return false;
    }
    if (!value.endsWith(exports.Suffix)) {
        return false;
    }
    return true;
}
exports.ValidatePredicate = ValidatePredicate;
function DescribeError(error) {
    if (typeof error.value !== 'string') {
        return "Expected string";
    }
    if (!error.value.endsWith(exports.Suffix)) {
        return `Expected string ending with ${exports.Suffix}`;
    }
    return null;
}
exports.DescribeError = DescribeError;
exports.Validate = ValidatePredicate;
