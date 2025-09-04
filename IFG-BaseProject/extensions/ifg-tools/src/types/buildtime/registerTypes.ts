import { TSchema, TypeRegistry } from "@sinclair/typebox";
import { registerTypes as registerRuntimeTypes } from "../runtime/registerTypes";
import { Kind as SpriteResourcePathKind, makeValidator as ValidateSpriteResourcePath } from "./TSpriteResourcePath"
import { Kind as TextureResourcePathKind, makeValidator as ValidateTextureResourcePath } from "./TTextureResourcePath"
import { Kind as JsonResourcePathKind, makeValidator as ValidateJsonResourcePath } from "./TJsonResourcePath";
import { Kind as PrefabResourcePathKind, makeValidator as ValidatePrefabResourcePath } from "./TPrefabResourcePath";

type RegisterFn = <T extends TSchema>(kind: string, func: TypeRegistry.TypeRegistryValidationFunction<T>) => void

export function registerTypes(fn: RegisterFn, pathBase: string) {
    registerRuntimeTypes(fn);
    fn(SpriteResourcePathKind, ValidateSpriteResourcePath(pathBase));
    fn(TextureResourcePathKind, ValidateTextureResourcePath(pathBase));
    fn(JsonResourcePathKind, ValidateJsonResourcePath(pathBase));
    fn(PrefabResourcePathKind, ValidatePrefabResourcePath(pathBase));
}