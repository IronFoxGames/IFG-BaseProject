"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDescribeError = exports.makeValidator = exports.Kind = void 0;
const fs_1 = require("fs");
const TPrefabResourcePath_1 = require("../runtime/TPrefabResourcePath");
const path_1 = __importDefault(require("path"));
var TPrefabResourcePath_2 = require("../runtime/TPrefabResourcePath");
Object.defineProperty(exports, "Kind", { enumerable: true, get: function () { return TPrefabResourcePath_2.Kind; } });
function makeValidator(pathBase) {
    function Validate(schema, value) {
        if (!(0, TPrefabResourcePath_1.ValidatePredicate)(schema, value)) {
            return false;
        }
        return (0, fs_1.existsSync)(path_1.default.join(pathBase, "assets/resources", `${value}.prefab`));
    }
    return Validate;
}
exports.makeValidator = makeValidator;
function makeDescribeError(pathBase) {
    function DescribeError(error) {
        const desc = (0, TPrefabResourcePath_1.DescribeError)(error);
        if (desc) {
            return desc;
        }
        const p = error.value;
        if (!(0, fs_1.existsSync)(path_1.default.join(pathBase, "assets/resources", `${p}.prefab`))) {
            return "Invalid resource path";
        }
        return null;
    }
    return DescribeError;
}
exports.makeDescribeError = makeDescribeError;
