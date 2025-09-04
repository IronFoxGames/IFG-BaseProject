import { ErrorFunctionParameter } from '@sinclair/typebox/errors';
import { existsSync } from 'fs';
import { ValidatePredicate, DescribeError as DescribeErrorRuntime, TJsonResourcePath } from '../runtime/TJsonResourcePath';
import path from 'path';

export { Kind } from '../runtime/TJsonResourcePath'

export function makeValidator(pathBase: string) {
  function Validate(schema: TJsonResourcePath, value: unknown): boolean {
    if (!ValidatePredicate(schema, value)) {
      return false;
    }

    return existsSync(path.join(pathBase, "assets/resources", `${value}.json`));
  }

  return Validate

}

export function makeDescribeError(pathBase: string) {
  function DescribeError(error: ErrorFunctionParameter): string | null {
      const desc = DescribeErrorRuntime(error);
      if (desc) {
          return desc;
      }
      
      const p = error.value as string;
      if (!existsSync(path.join(pathBase, "assets/resources", `${p}.json`))) {
          return "Invalid resource path";
      }

      return null;
  }

  return DescribeError;
}