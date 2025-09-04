import { ErrorFunctionParameter } from '@sinclair/typebox/errors';
import { existsSync } from 'fs';
import { ValidatePredicate, DescribeError as DescribeErrorRuntime, TTextureResourcePath, stripTextureSuffix, TextureResourcePath } from '../runtime/TTextureResourcePath';
import path from 'path';

export { Kind } from '../runtime/TTextureResourcePath'


export function makeValidator(pathBase: string) {
  function Validate(schema: TTextureResourcePath, value: unknown): boolean {
    if (!ValidatePredicate(schema, value)) {
      return false;
    }

    const p = stripTextureSuffix(value);

    // TODO: assumes png, but could be another image file type
    return existsSync(path.join(pathBase, "assets/resources", `${p}.png`));
  }

  return Validate
}

export function makeDescribeError(pathBase: string) {
  function DescribeError(error: ErrorFunctionParameter): string | null {
      const desc = DescribeErrorRuntime(error);
      if (desc) {
          return desc;
      }
      
      const p = stripTextureSuffix(error.value as TextureResourcePath);
      if (!existsSync(path.join(pathBase, "assets/resources", `${p}.png`))) {
          return "Invalid resource path";
      }

      return null;
  }

  return DescribeError;
}