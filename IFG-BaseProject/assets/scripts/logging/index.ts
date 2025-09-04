import { DEBUG } from 'cc/env';
import { ConsoleLogDestination, Logger } from '../slog';

const logLevel = DEBUG ? 'debug' : 'warn';
export const logger = new Logger(new ConsoleLogDestination(), {}, logLevel);
