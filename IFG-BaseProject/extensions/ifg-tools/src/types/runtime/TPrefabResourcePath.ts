import { Kind as TypeboxKind, TSchema, TypeRegistry } from "@sinclair/typebox";
import { ErrorFunctionParameter } from "@sinclair/typebox/errors";

export const Kind = `PrefabResourcePath` as const;
export type Kind = `PrefabResourcePath`;

export interface TPrefabResourcePath extends TSchema {
    [TypeboxKind]: Kind,
    static: string,
    type: 'string'
}

export function PrefabResourcePath(): TPrefabResourcePath {
  return {
    [TypeboxKind]: Kind,
    type: 'string'
  } as TPrefabResourcePath;
}

export function ValidatePredicate(schema: TPrefabResourcePath, value: unknown): value is string {
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

export const Validate: TypeRegistry.TypeRegistryValidationFunction<TPrefabResourcePath> = ValidatePredicate;