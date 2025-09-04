import { Kind as TypeboxKind, TSchema, TypeRegistry } from "@sinclair/typebox";
import { ErrorFunctionParameter } from "@sinclair/typebox/errors";

export const Kind = `JsonResourcePath` as const;
export type Kind = `JsonResourcePath`;

export interface TJsonResourcePath extends TSchema {
    [TypeboxKind]: Kind,
    static: string,
    type: 'string'
}

export function JsonResourcePath(): TJsonResourcePath {
  return {
    [TypeboxKind]: Kind,
    type: 'string'
  } as TJsonResourcePath;
}

export function ValidatePredicate(schema: TJsonResourcePath, value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  return true;
}

export function DescribeError(error: ErrorFunctionParameter): string | null {
  if (typeof error.value !== 'string') {
    return "Expected string";
  }

  return null;
}

export const Validate: TypeRegistry.TypeRegistryValidationFunction<TJsonResourcePath> = ValidatePredicate;