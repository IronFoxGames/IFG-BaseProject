import { TSchema, TypeRegistry } from "@sinclair/typebox";
import { Kind as SpriteResourcePathKind, Validate as ValidateSpriteResourcePath } from "./TSpriteResourcePath"
import { Kind as TextureResourcePathKind, Validate as ValidateTextureResourcePath } from "./TTextureResourcePath"
import { Kind as JsonResourcePathKind, Validate as ValidateJsonResourcePath } from "./TJsonResourcePath";
import { Kind as PrefabResourcePathKind, Validate as ValidatePrefabResourcePath } from "./TPrefabResourcePath";
import { IdentifierKind, Validate as ValidateIdentifier } from "./TIdentifier";
import { ReferenceKind, Validate as ValidateReference } from "./TReference";
import { isa } from "./identifiers";

type RegisterFn = <T extends TSchema>(kind: string, func: TypeRegistry.TypeRegistryValidationFunction<T>) => void
export function registerTypes(fn: RegisterFn) {
    fn(SpriteResourcePathKind, ValidateSpriteResourcePath);
    fn(TextureResourcePathKind, ValidateTextureResourcePath);
    fn(JsonResourcePathKind, ValidateJsonResourcePath);
    fn(PrefabResourcePathKind, ValidatePrefabResourcePath);

    fn(IdentifierKind("Item"), ValidateIdentifier);
    fn(ReferenceKind("Item"), ValidateReference);
    fn(IdentifierKind("Currency"), ValidateIdentifier);
    fn(ReferenceKind("Currency"), ValidateReference);
    fn(IdentifierKind("Booster"), ValidateIdentifier);
    fn(ReferenceKind("Booster"), ValidateReference);
    fn(IdentifierKind("Powerup"), ValidateIdentifier);
    fn(ReferenceKind("Powerup"), ValidateReference);
    fn(IdentifierKind("Task"), ValidateIdentifier);
    fn(ReferenceKind("Task"), ValidateReference);
    fn(IdentifierKind("Dialogue"), ValidateIdentifier);
    fn(ReferenceKind("Dialogue"), ValidateReference);
    fn(IdentifierKind("Chapter"), ValidateIdentifier);
    fn(ReferenceKind("Chapter"), ValidateReference);
    fn(IdentifierKind("Task"), ValidateIdentifier);
    fn(ReferenceKind("Task"), ValidateReference);
    fn(IdentifierKind("CatalogItem"), ValidateIdentifier);
    fn(ReferenceKind("CatalogItem"), ValidateReference);
    fn(IdentifierKind("UpsellItem"), ValidateIdentifier);
    fn(ReferenceKind("UpsellItem"), ValidateReference);
    fn(IdentifierKind("Prop"), ValidateIdentifier);
    fn(ReferenceKind("Prop"), ValidateReference);
    fn(IdentifierKind("Node"), ValidateIdentifier);
    fn(ReferenceKind("Node"), ValidateReference);
    fn(IdentifierKind("Level"), ValidateIdentifier);
    fn(ReferenceKind("Level"), ValidateReference);
    fn(IdentifierKind("PropTag"), ValidateIdentifier);
    fn(ReferenceKind("PropTag"), ValidateReference);
    fn(IdentifierKind("Tutorial"), ValidateIdentifier);
    fn(ReferenceKind("Tutorial"), ValidateReference);

    isa("Currency", "Item");
    isa("Booster", "Item");
    isa("Powerup", "Item");
    isa("Task", "Item");
    isa("Prop", "Item");
}