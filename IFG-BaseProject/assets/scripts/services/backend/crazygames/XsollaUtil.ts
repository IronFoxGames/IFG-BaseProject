import { CommerceError, LoginError, SubscriptionError } from 'db://xsolla-commerce-sdk/scripts/core/Error';

export type TokenError = {
    code: string;
    description: string;
};

export type XsollaError = CommerceError | SubscriptionError | LoginError | TokenError;

export type XsollaResult<T, E = XsollaError> = { success: true; data: T } | { success: false; error: E };

export function isXsollaError<T, E>(result: XsollaResult<T, E>): result is { success: false; error: E } {
    return !result.success;
}

export function xsollaPromiseWrapper<T, E>(fn: (onComplete: (data: T) => void, onError: (err: E) => void) => void): Promise<XsollaResult<T, E>> {
    return new Promise<XsollaResult<T, E>>((resolve) => {
        fn(
            (data: T) => resolve({ success: true, data }),
            (error: E) => resolve({ success: false, error })
        );
    });
}
