"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDescribeError = exports.makeValidator = exports.Kind = void 0;
const fs_1 = require("fs");
const TSpriteResourcePath_1 = require("../runtime/TSpriteResourcePath");
const path_1 = __importDefault(require("path"));
var TSpriteResourcePath_2 = require("../runtime/TSpriteResourcePath");
Object.defineProperty(exports, "Kind", { enumerable: true, get: function () { return TSpriteResourcePath_2.Kind; } });
function makeValidator(pathBase) {
    function Validate(schema, value) {
        if (!(0, TSpriteResourcePath_1.ValidatePredicate)(schema, value)) {
            return false;
        }
        const p = (0, TSpriteResourcePath_1.stripSpriteSuffix)(value);
        // TODO: assumes png, but could be another image file type
        return (0, fs_1.existsSync)(path_1.default.join(pathBase, "assets/resources", `${p}.png`));
    }
    return Validate;
}
exports.makeValidator = makeValidator;
function makeDescribeError(pathBase) {
    function DescribeError(error) {
        const desc = (0, TSpriteResourcePath_1.DescribeError)(error);
        if (desc) {
            return desc;
        }
        const p = (0, TSpriteResourcePath_1.stripSpriteSuffix)(error.value);
        if (!(0, fs_1.existsSync)(path_1.default.join(pathBase, "assets/resources", `${p}.png`))) {
            return "Invalid resource path";
        }
        return null;
    }
    return DescribeError;
}
exports.makeDescribeError = makeDescribeError;
