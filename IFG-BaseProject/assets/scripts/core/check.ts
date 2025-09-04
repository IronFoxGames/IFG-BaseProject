import { Static, TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { EDITOR } from "cc/env";

export function check<T extends TSchema>(schema: T, value: unknown): value is Static<T> {
    if (EDITOR) {
        return true;
    }
    
    return Value.Check(schema, value);
}