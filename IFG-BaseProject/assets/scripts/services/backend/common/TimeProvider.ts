export interface TimeProvider {
    /**
     * Returns the current time in milliseconds
     */
    readonly now: number;
    isDesynced: () => boolean;
    sync: () => Promise<void>;
}

export function createDateNowOriginTimeProvider() {
    let dateOrigin = Date.now();
    let performanceOrigin = performance.now();

    const sync = () => {
        dateOrigin = Date.now();
        performanceOrigin = performance.now();
    };
    return {
        get now() {
            return dateOrigin + performance.now() - performanceOrigin;
        },
        sync
    };
}

export function createRemoteTimeProvider() {
    let serverOrigin = 0;
    let dateOrigin = Date.now();
    let performanceOrigin = performance.now();

    const sync = async () => {
        try {
            const serverDate = await fetchServerTime('');
            serverOrigin = serverDate!.getTime();
        } catch (e) {
            console.error('failed to fetch server date, falling back to local', { error: e });
            serverOrigin = Date.now();
        }
        dateOrigin = Date.now();
        performanceOrigin = performance.now();
    };

    const isDesynced = () => {
        const dateNow = Date.now();
        const dateElapsed = dateNow - dateOrigin;
        const performanceElapsed = performance.now() - performanceOrigin;
        return Math.abs(performanceElapsed - dateElapsed) > 1000;
    };

    return {
        get now() {
            return serverOrigin + performance.now() - performanceOrigin;
        },
        sync,
        isDesynced
    };
}

export type DateNowOriginTimeProvider = ReturnType<typeof createDateNowOriginTimeProvider>;

async function fetchServerTime(url: string): Promise<Date | null> {
    const start = performance.now();
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const end = performance.now();

    const dateHeader = response.headers.get('Date')!;

    const serverTime = new Date(dateHeader);
    const roundTripMs = end - start;
    // Estimate the server time at the midpoint of the request
    serverTime.setMilliseconds(serverTime.getMilliseconds() + roundTripMs / 2);

    return serverTime;
}
