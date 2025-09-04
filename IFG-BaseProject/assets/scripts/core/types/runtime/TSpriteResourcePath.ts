import { Kind as TypeboxKind, TSchema, TypeRegistry } from "@sinclair/typebox";
import { ErrorFunctionParameter } from "@sinclair/typebox/errors";

export const Kind = `SpriteResourcePath` as const;
export type Kind = `SpriteResourcePath`;

export const Suffix = '/spriteFrame';

export type SpriteResourcePath = `${string}/spriteFrame`;

export function stripSpriteSuffix(p: SpriteResourcePath) {
  return p.substring(0, p.length - Suffix.length);
}

export interface TSpriteResourcePath extends TSchema {
    [TypeboxKind]: Kind,
    static: string,
    type: 'string'
}

export function SpriteResourcePath(): TSpriteResourcePath {
  return {
    [TypeboxKind]: Kind,
    type: 'string'
  } as TSpriteResourcePath;
}

export function ValidatePredicate(schema: TSpriteResourcePath, value: unknown): value is SpriteResourcePath {
  if (typeof value !== 'string') {
    return false;
  }
  
  if (!value.endsWith(Suffix)) {
    return false;
  }
  return true;
}

export function DescribeError(error: ErrorFunctionParameter): string | null {
  if (typeof error.value !== 'string') {
    return "Expected string";
  }
  
  if (!error.value.endsWith(Suffix)) {
    return `Expected string ending with ${Suffix}`;
  }

  return null;
}

export const Validate: TypeRegistry.TypeRegistryValidationFunction<TSpriteResourcePath> = ValidatePredicate;