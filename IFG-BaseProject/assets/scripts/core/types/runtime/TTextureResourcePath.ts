import { Kind as TypeboxKind, TSchema, TypeRegistry } from "@sinclair/typebox";
import { ErrorFunctionParameter } from "@sinclair/typebox/errors";

export const Kind = `TextureResourcePath` as const;
export type Kind = `TextureResourcePath`;

export const Suffix = '/texture';

export type TextureResourcePath = `${string}/texture`;

export function stripTextureSuffix(p: TextureResourcePath) {
  return p.substring(0, p.length - Suffix.length);
}

export interface TTextureResourcePath extends TSchema {
    [TypeboxKind]: Kind,
    static: string,
    type: 'string'
}

export function TextureResourcePath(): TTextureResourcePath {
  return {
    [TypeboxKind]: Kind,
    type: 'string'
  } as TTextureResourcePath;
}

export function ValidatePredicate(schema: TTextureResourcePath, value: unknown): value is TextureResourcePath {
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

export const Validate: TypeRegistry.TypeRegistryValidationFunction<TTextureResourcePath> = ValidatePredicate;