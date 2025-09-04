"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDescribeError = exports.makeValidator = exports.Kind = void 0;
const fs_1 = require("fs");
const TTextureResourcePath_1 = require("../runtime/TTextureResourcePath");
const path_1 = __importDefault(require("path"));
var TTextureResourcePath_2 = require("../runtime/TTextureResourcePath");
Object.defineProperty(exports, "Kind", { enumerable: true, get: function () { return TTextureResourcePath_2.Kind; } });
function makeValidator(pathBase) {
    function Validate(schema, value) {
        if (!(0, TTextureResourcePath_1.ValidatePredicate)(schema, value)) {
            return false;
        }
        const p = (0, TTextureResourcePath_1.stripTextureSuffix)(value);
        // TODO: assumes png, but could be another image file type
        return (0, fs_1.existsSync)(path_1.default.join(pathBase, "assets/resources", `${p}.png`));
    }
    return Validate;
}
exports.makeValidator = makeValidator;
function makeDescribeError(pathBase) {
    function DescribeError(error) {
        const desc = (0, TTextureResourcePath_1.DescribeError)(error);
        if (desc) {
            return desc;
        }
        const p = (0, TTextureResourcePath_1.stripTextureSuffix)(error.value);
        if (!(0, fs_1.existsSync)(path_1.default.join(pathBase, "assets/resources", `${p}.png`))) {
            return "Invalid resource path";
        }
        return null;
    }
    return DescribeError;
}
exports.makeDescribeError = makeDescribeError;
