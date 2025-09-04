export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type Bindings = Record<string, any>;

const levelNumber: Record<LogLevel, number> = {
    trace: 5,
    debug: 4,
    info: 3,
    warn: 2,
    error: 1,
    fatal: 0
};

export interface LogRequiredFields {
    msg: string;
    level: LogLevel;
    tag?: string;
}

export type Log = LogRequiredFields & Bindings;

export function decorateMsg(log: Log) {
    if (log.tag != null) {
        return `[${log.tag}] ${log.msg}`;
    }
    return log.msg;
}

export interface LogDestination {
    log(log: Log): void;
}

export class ConsoleLogDestination implements LogDestination {
    log(log: Log): void {
        switch (log.level) {
            case 'trace':
                console.info(decorateMsg(log), log);
                break;
            case 'debug':
                console.info(decorateMsg(log), log);
                break;
            case 'info':
                console.info(decorateMsg(log), log);
                break;
            case 'warn':
                console.warn(decorateMsg(log), log);
                break;
            case 'error':
                console.error(decorateMsg(log), log);
                break;
            case 'fatal':
                console.error(decorateMsg(log), log);
                break;
        }
    }
}

export interface ILogger {
    level: LogLevel;

    trace(msg: string, params?: Bindings): void;
    debug(msg: string, params?: Bindings): void;
    info(msg: string, params?: Bindings): void;
    warn(msg: string, params?: Bindings): void;
    error(msg: string, params?: Bindings): void;
    fatal(msg: string, params?: Bindings): void;
    log(level: LogLevel, msg: string, params?: Bindings): void;

    child(tagOrBindings: string | Bindings): ILogger;
}

export class Logger implements ILogger {
    private readonly destination: LogDestination;
    private readonly bindings?: Bindings;

    level: LogLevel;

    constructor(destination: LogDestination, bindings?: Bindings, level?: LogLevel) {
        this.destination = destination;
        this.bindings = bindings ?? {};
        this.level = level ?? 'warn';
    }

    trace(msg: string, params?: Bindings): void {
        this.log('trace', msg, params);
    }
    debug(msg: string, params?: Bindings): void {
        this.log('debug', msg, params);
    }
    info(msg: string, params?: Bindings): void {
        this.log('info', msg, params);
    }
    warn(msg: string, params?: Bindings): void {
        this.log('warn', msg, params);
    }
    error(msg: string, params?: Bindings): void {
        this.log('error', msg, params);
    }
    fatal(msg: string, params?: Bindings): void {
        this.log('fatal', msg, params);
    }
    log(level: LogLevel, msg: string, params?: Bindings): void {
        if (!this.isEnabled(level)) {
            return;
        }
        params = params ?? {};
        this.destination.log({ ...this.bindings, ...params, msg, level });
    }
    child(tagOrBindings: string | Bindings): Logger {
        const bindings = typeof tagOrBindings === 'string' ? { tag: tagOrBindings } : tagOrBindings;
        return new Logger(this.destination, { ...(this.bindings ?? {}), ...bindings }, this.level);
    }

    isEnabled(level: LogLevel): boolean {
        return levelNumber[level] <= levelNumber[this.level];
    }
}
