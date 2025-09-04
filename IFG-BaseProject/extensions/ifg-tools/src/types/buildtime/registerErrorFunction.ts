import { ErrorFunction } from '@sinclair/typebox/errors';
import { makeDescribeError as DescribeSpriteResourcePathError, Kind as SpriteResourcePathKind } from './TSpriteResourcePath';
import { makeDescribeError as DescribeTextureResourcePathError, Kind as TextureResourcePathKind } from './TTextureResourcePath';
import { MaybeErrorFunction, registerCustomErrorFunctions, RegisterFn, errorFunctions as runtimeErrorFunctions } from '../runtime/registerErrorFunction';
import { makeDescribeError as DescribeJsonResourcePathError, Kind as JsonResourcePathKind } from './TJsonResourcePath';
import { makeDescribeError as DescribePrefabResourcePathError, Kind as PrefabResourcePathKind } from './TPrefabResourcePath';

export function registerErrorFunctions(fn: RegisterFn, defaultErrorFunction: ErrorFunction, pathBase: string) {
    const errorFunctions: Record<string, MaybeErrorFunction> = {
        ...runtimeErrorFunctions,
        [SpriteResourcePathKind]: DescribeSpriteResourcePathError(pathBase),
        [TextureResourcePathKind]: DescribeTextureResourcePathError(pathBase),
        [JsonResourcePathKind]: DescribeJsonResourcePathError(pathBase),
        [PrefabResourcePathKind]: DescribePrefabResourcePathError(pathBase)
    };

    registerCustomErrorFunctions(fn, defaultErrorFunction, errorFunctions);
}
