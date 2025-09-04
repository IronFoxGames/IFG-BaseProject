import { Kind } from "@sinclair/typebox";
import { ErrorFunction, ErrorFunctionParameter, ValueErrorType } from "@sinclair/typebox/errors";
import { IdentifierKind, DescribeError as DescribeIdentifierError } from "./TIdentifier";
import { ReferenceKind, DescribeError as DescribeReferenceError } from "./TReference";
import { DescribeError as DescribeSpriteResourcePathError, Kind as SpriteResourcePathKind } from './TSpriteResourcePath';
import { DescribeError as DescribeTextureResourcePathError, Kind as TextureResourcePathKind } from './TTextureResourcePath';
import { Kind as JsonResourcePathKind, DescribeError as DescribeJsonResourcePathError } from "./TJsonResourcePath";
import { Kind as PrefabResourcePathKind, DescribeError as DescribePrefabResourcePathError } from "./TPrefabResourcePath";

export type RegisterFn = (callback: ErrorFunction) => void;

export type MaybeErrorFunction = (parameter: ErrorFunctionParameter) => string | null;

export const errorFunctions: Record<string, MaybeErrorFunction> = {
    [SpriteResourcePathKind]: DescribeSpriteResourcePathError,
    [TextureResourcePathKind]: DescribeTextureResourcePathError,
    [JsonResourcePathKind]: DescribeJsonResourcePathError,
    [PrefabResourcePathKind]: DescribePrefabResourcePathError,

    [IdentifierKind("Item")]: DescribeIdentifierError,
    [ReferenceKind("Item")]: DescribeReferenceError,
    [IdentifierKind("Currency")]: DescribeIdentifierError,
    [ReferenceKind("Currency")]: DescribeReferenceError,
    [IdentifierKind("Booster")]: DescribeIdentifierError,
    [ReferenceKind("Booster")]: DescribeReferenceError,
    [IdentifierKind("Powerup")]: DescribeIdentifierError,
    [ReferenceKind("Powerup")]: DescribeReferenceError,
    [IdentifierKind("Task")]: DescribeIdentifierError,
    [ReferenceKind("Task")]: DescribeReferenceError,
    [IdentifierKind("Dialogue")]: DescribeIdentifierError,
    [ReferenceKind("Dialogue")]: DescribeReferenceError,
    [IdentifierKind("Chapter")]: DescribeIdentifierError,
    [ReferenceKind("Chapter")]: DescribeReferenceError,
    [IdentifierKind("CatalogItem")]: DescribeIdentifierError,
    [ReferenceKind("CatalogItem")]: DescribeReferenceError,
    [IdentifierKind("UpsellItem")]: DescribeIdentifierError,
    [ReferenceKind("UpsellItem")]: DescribeReferenceError,
    [IdentifierKind("Prop")]: DescribeIdentifierError,
    [ReferenceKind("Prop")]: DescribeReferenceError,
    [IdentifierKind("Node")]: DescribeIdentifierError,
    [ReferenceKind("Node")]: DescribeReferenceError,
    [IdentifierKind("Level")]: DescribeIdentifierError,
    [ReferenceKind("Level")]: DescribeReferenceError,
    [IdentifierKind("PropTag")]: DescribeIdentifierError,
    [ReferenceKind("PropTag")]: DescribeReferenceError,
    [IdentifierKind("Tutorial")]: DescribeIdentifierError,
    [ReferenceKind("Tutorial")]: DescribeReferenceError,
};

export function registerErrorFunctions(fn: RegisterFn, defaultErrorFunction: ErrorFunction) {
    registerCustomErrorFunctions(fn, defaultErrorFunction, errorFunctions);
}

export function registerCustomErrorFunctions(fn: RegisterFn, defaultErrorFunction: ErrorFunction, fns: Record<string, MaybeErrorFunction>) {
    fn((error: ErrorFunctionParameter) => {
        if (error.errorType === ValueErrorType.Kind) {
            if (error.schema[Kind] in fns) {
                const description = fns[error.schema[Kind]](error);
                if (description) {
                    return description;
                }
            }
        }
        return defaultErrorFunction(error);
    });
}