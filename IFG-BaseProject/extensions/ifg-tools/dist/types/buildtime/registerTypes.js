"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTypes = void 0;
const registerTypes_1 = require("../runtime/registerTypes");
const TSpriteResourcePath_1 = require("./TSpriteResourcePath");
const TTextureResourcePath_1 = require("./TTextureResourcePath");
const TJsonResourcePath_1 = require("./TJsonResourcePath");
const TPrefabResourcePath_1 = require("./TPrefabResourcePath");
function registerTypes(fn, pathBase) {
    (0, registerTypes_1.registerTypes)(fn);
    fn(TSpriteResourcePath_1.Kind, (0, TSpriteResourcePath_1.makeValidator)(pathBase));
    fn(TTextureResourcePath_1.Kind, (0, TTextureResourcePath_1.makeValidator)(pathBase));
    fn(TJsonResourcePath_1.Kind, (0, TJsonResourcePath_1.makeValidator)(pathBase));
    fn(TPrefabResourcePath_1.Kind, (0, TPrefabResourcePath_1.makeValidator)(pathBase));
}
exports.registerTypes = registerTypes;
