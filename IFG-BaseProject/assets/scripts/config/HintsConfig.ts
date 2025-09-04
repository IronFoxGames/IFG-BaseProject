import { check } from '../core/check';
import { HintsConfigType } from '../core/types/runtime/definitions';
import { logger } from '../logging';

const log = logger.child('HUDConfig');

export class HintsConfig {
    enableDragReminder: boolean = false;
    dragReminderTimeout: number = 0;

    public static fromObject(obj: unknown): HintsConfig {
        let hintsConfig = new HintsConfig();

        if (!check(HintsConfigType, obj)) {
            log.error('invalid HintsConfig JSON data');
            return hintsConfig;
        }

        hintsConfig.enableDragReminder = obj.enableDragReminder;
        hintsConfig.dragReminderTimeout = obj.dragReminderTimeout;

        return hintsConfig;
    }
}
