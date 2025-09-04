"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerErrorFunctions = void 0;
const TSpriteResourcePath_1 = require("./TSpriteResourcePath");
const TTextureResourcePath_1 = require("./TTextureResourcePath");
const registerErrorFunction_1 = require("../runtime/registerErrorFunction");
const TJsonResourcePath_1 = require("./TJsonResourcePath");
const TPrefabResourcePath_1 = require("./TPrefabResourcePath");
function registerErrorFunctions(fn, defaultErrorFunction, pathBase) {
    const errorFunctions = Object.assign(Object.assign({}, registerErrorFunction_1.errorFunctions), { [TSpriteResourcePath_1.Kind]: (0, TSpriteResourcePath_1.makeDescribeError)(pathBase), [TTextureResourcePath_1.Kind]: (0, TTextureResourcePath_1.makeDescribeError)(pathBase), [TJsonResourcePath_1.Kind]: (0, TJsonResourcePath_1.makeDescribeError)(pathBase), [TPrefabResourcePath_1.Kind]: (0, TPrefabResourcePath_1.makeDescribeError)(pathBase) });
    (0, registerErrorFunction_1.registerCustomErrorFunctions)(fn, defaultErrorFunction, errorFunctions);
}
exports.registerErrorFunctions = registerErrorFunctions;
