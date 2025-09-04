import { Kind, TSchema } from "@sinclair/typebox";
import { ErrorFunctionParameter } from "@sinclair/typebox/errors";
import { identifiers, isValidReference, mode } from "./identifiers";

export const ReferenceSuffix = "Reference" as const;

export function ReferenceKind(type: string): string {
    return `${type}${ReferenceSuffix}`;
}

export interface TReference<T extends string> extends TSchema {
    [Kind]: `${T}${typeof ReferenceSuffix}`,
    static: string,
    type: 'string',
    referenceType: T
}

export function Reference<T extends string>(referenceType: T): TReference<T> {
  return {
    [Kind]: `${referenceType}${ReferenceSuffix}`,
    type: 'string',
    referenceType: referenceType
  } as TReference<T>;
}

const emptySet = new Set<string>();

export function Validate(schema: TReference<string>, value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const referenceType = schema[Kind].substring(0, schema[Kind].length - ReferenceSuffix.length);

  return isValidReference(referenceType, value);
}

export function DescribeError(error: ErrorFunctionParameter): string | null {
  if (typeof error.value !== 'string') {
    return "Expected string";
  }

  const referenceType = error.schema[Kind].substring(0, error.schema[Kind].length - ReferenceSuffix.length);

  return `Invalid ${referenceType} reference`;
}