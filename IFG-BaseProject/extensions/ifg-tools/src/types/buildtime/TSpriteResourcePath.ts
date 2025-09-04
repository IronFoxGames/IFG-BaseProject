import { ErrorFunctionParameter } from '@sinclair/typebox/errors';
import { existsSync } from 'fs';
import { ValidatePredicate, DescribeError as DescribeErrorRuntime, TSpriteResourcePath, stripSpriteSuffix, SpriteResourcePath } from '../runtime/TSpriteResourcePath';
import path from 'path';

export { Kind } from '../runtime/TSpriteResourcePath'

export function makeValidator(pathBase: string) {
  function Validate(schema: TSpriteResourcePath, value: unknown): boolean {
    if (!ValidatePredicate(schema, value)) {
      return false;
    }

    const p = stripSpriteSuffix(value);

    // TODO: assumes png, but could be another image file type
    return existsSync(path.join(pathBase, "assets/resources", `${p}.png`));
  }

  return Validate;
}


export function makeDescribeError(pathBase: string) {
  function DescribeError(error: ErrorFunctionParameter): string | null {
      const desc = DescribeErrorRuntime(error);
      if (desc) {
          return desc;
      }
      
      const p = stripSpriteSuffix(error.value as SpriteResourcePath);
      if (!existsSync(path.join(pathBase, "assets/resources", `${p}.png`))) {
          return "Invalid resource path";
      }

      return null;
  }

  return DescribeError;
}