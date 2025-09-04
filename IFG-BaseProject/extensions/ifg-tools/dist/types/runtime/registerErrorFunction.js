"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCustomErrorFunctions = exports.registerErrorFunctions = exports.errorFunctions = void 0;
const typebox_1 = require("@sinclair/typebox");
const errors_1 = require("@sinclair/typebox/errors");
const TIdentifier_1 = require("./TIdentifier");
const TReference_1 = require("./TReference");
const TSpriteResourcePath_1 = require("./TSpriteResourcePath");
const TTextureResourcePath_1 = require("./TTextureResourcePath");
const TJsonResourcePath_1 = require("./TJsonResourcePath");
const TPrefabResourcePath_1 = require("./TPrefabResourcePath");
exports.errorFunctions = {
    [TSpriteResourcePath_1.Kind]: TSpriteResourcePath_1.DescribeError,
    [TTextureResourcePath_1.Kind]: TTextureResourcePath_1.DescribeError,
    [TJsonResourcePath_1.Kind]: TJsonResourcePath_1.DescribeError,
    [TPrefabResourcePath_1.Kind]: TPrefabResourcePath_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("Item")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("Item")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("Currency")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("Currency")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("Booster")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("Booster")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("Powerup")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("Powerup")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("Task")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("Task")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("Dialogue")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("Dialogue")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("Chapter")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("Chapter")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("CatalogItem")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("CatalogItem")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("UpsellItem")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("UpsellItem")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("Prop")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("Prop")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("Node")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("Node")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("Level")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("Level")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("PropTag")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("PropTag")]: TReference_1.DescribeError,
    [(0, TIdentifier_1.IdentifierKind)("Tutorial")]: TIdentifier_1.DescribeError,
    [(0, TReference_1.ReferenceKind)("Tutorial")]: TReference_1.DescribeError,
};
function registerErrorFunctions(fn, defaultErrorFunction) {
    registerCustomErrorFunctions(fn, defaultErrorFunction, exports.errorFunctions);
}
exports.registerErrorFunctions = registerErrorFunctions;
function registerCustomErrorFunctions(fn, defaultErrorFunction, fns) {
    fn((error) => {
        if (error.errorType === errors_1.ValueErrorType.Kind) {
            if (error.schema[typebox_1.Kind] in fns) {
                const description = fns[error.schema[typebox_1.Kind]](error);
                if (description) {
                    return description;
                }
            }
        }
        return defaultErrorFunction(error);
    });
}
exports.registerCustomErrorFunctions = registerCustomErrorFunctions;
