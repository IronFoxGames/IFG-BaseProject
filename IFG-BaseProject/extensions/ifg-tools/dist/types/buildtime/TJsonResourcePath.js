"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDescribeError = exports.makeValidator = exports.Kind = void 0;
const fs_1 = require("fs");
const TJsonResourcePath_1 = require("../runtime/TJsonResourcePath");
const path_1 = __importDefault(require("path"));
var TJsonResourcePath_2 = require("../runtime/TJsonResourcePath");
Object.defineProperty(exports, "Kind", { enumerable: true, get: function () { return TJsonResourcePath_2.Kind; } });
function makeValidator(pathBase) {
    function Validate(schema, value) {
        if (!(0, TJsonResourcePath_1.ValidatePredicate)(schema, value)) {
            return false;
        }
        return (0, fs_1.existsSync)(path_1.default.join(pathBase, "assets/resources", `${value}.json`));
    }
    return Validate;
}
exports.makeValidator = makeValidator;
function makeDescribeError(pathBase) {
    function DescribeError(error) {
        const desc = (0, TJsonResourcePath_1.DescribeError)(error);
        if (desc) {
            return desc;
        }
        const p = error.value;
        if (!(0, fs_1.existsSync)(path_1.default.join(pathBase, "assets/resources", `${p}.json`))) {
            return "Invalid resource path";
        }
        return null;
    }
    return DescribeError;
}
exports.makeDescribeError = makeDescribeError;
