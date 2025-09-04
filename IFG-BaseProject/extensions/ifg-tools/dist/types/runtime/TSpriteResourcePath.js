"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validate = exports.DescribeError = exports.ValidatePredicate = exports.SpriteResourcePath = exports.stripSpriteSuffix = exports.Suffix = exports.Kind = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.Kind = `SpriteResourcePath`;
exports.Suffix = '/spriteFrame';
function stripSpriteSuffix(p) {
    return p.substring(0, p.length - exports.Suffix.length);
}
exports.stripSpriteSuffix = stripSpriteSuffix;
function SpriteResourcePath() {
    return {
        [typebox_1.Kind]: exports.Kind,
        type: 'string'
    };
}
exports.SpriteResourcePath = SpriteResourcePath;
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
