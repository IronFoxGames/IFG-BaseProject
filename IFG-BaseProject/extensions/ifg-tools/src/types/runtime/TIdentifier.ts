import { Kind, TSchema } from "@sinclair/typebox";
import { identifiers, mode, registerIdentifier } from "./identifiers";
import { ErrorFunctionParameter } from "@sinclair/typebox/errors";

export const IdentifierSuffix = "Identifier" as const;

export function IdentifierKind(type: string): string {
    return `${type}${IdentifierSuffix}`;
}

export interface TIdentifier<T extends string> extends TSchema {
    [Kind]: `${T}${typeof IdentifierSuffix}`,
    static: string,
    type: 'string',
    identifierType: T
}

export function Identifier<T extends string>(identifierType: T): TIdentifier<T> {
    return {
        [Kind]: `${identifierType}${IdentifierSuffix}`,
        type: 'string',
        identifierType
    } as TIdentifier<T>;
}

export function Validate(schema: TIdentifier<string>, value: unknown): boolean {
    if (typeof value !== 'string') {
        return false;
    }

    const identifierType = schema[Kind].substring(0, schema[Kind].length - IdentifierSuffix.length);
    registerIdentifier(identifierType, value);

    return true;
}

export function DescribeError(error: ErrorFunctionParameter): string | null {
    return "Expected string";
}