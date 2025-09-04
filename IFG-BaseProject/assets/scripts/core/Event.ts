import { logger } from '../logging';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Event<T extends (...args: any[]) => void = () => void> {
    private _callbacks: T[] = [];
    private _log = logger.child('Event');

    public subscribe(callback: T): void {
        this._callbacks.push(callback);
    }

    public unsubscribe(callback: T): void {
        const index = this._callbacks.indexOf(callback);
        if (index !== -1) {
            this._callbacks.splice(index, 1);
        } else {
            this._log.error(`Could not unsubscribe, event callback not found: ${callback}`);
        }
    }

    public invoke(...args: Parameters<T>): void {
        this._callbacks.forEach((callback: T) => {
            try {
                callback(...args);
            } catch (error) {
                this._log.error('Error in event callback:', error);
            }
        });
    }
}
