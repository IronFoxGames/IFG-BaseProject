import { JsonAsset } from 'cc';
import { ResourceLoader } from '../utils/ResourceLoader';
import { LevelList } from './LevelList';
import { logger } from '../logging';
import { RefsObject } from '../core/types/runtime/definitions';
import { check } from '../core/check';
import { EDITOR, PREVIEW } from 'cc/env';

const log = logger.child('LevelConfig');
const testLevelListConfigPath = 'levels/lists/TestLevelListConfig';
export class LevelConfig {
    public levelList: LevelList = new LevelList();

    public static async fromObject(obj: unknown, contextPath: string = '<root>'): Promise<LevelConfig> {
        let levelConfig = new LevelConfig();

        if (!check(RefsObject, obj)) {
            return levelConfig;
        }

        if (EDITOR || PREVIEW) {
            if (!obj.refs.includes(testLevelListConfigPath)) {
                obj.refs.push(testLevelListConfigPath);
            }
        }

        try {
            // Process referenced level lists
            for (let i = 0; i < obj.refs.length; i++) {
                const configPath = obj.refs[i];
                try {
                    const levelsJson = await ResourceLoader.load(configPath, JsonAsset);
                    try {
                        const childList = LevelList.fromObject(levelsJson.json);
                        levelConfig.levelList.levels.push(...childList.levels);
                    } catch (err) {
                        log.error(
                            `Failed to process child list from ref ${configPath} (index ${i}) in parent ${contextPath}: ${err instanceof Error ? err.message : err}`
                        );
                        if (err instanceof Error && err.stack) {
                            log.error(err.stack);
                        }
                        throw new Error(
                            `Error processing child list from ref ${configPath} (index ${i}) in parent ${contextPath}: ${err instanceof Error ? err.stack : err}`
                        );
                    }
                } catch (err) {
                    log.error(
                        `Failed to load ref ${configPath} (index ${i}) in parent ${contextPath}: ${err instanceof Error ? err.message : err}`
                    );
                    if (err instanceof Error && err.stack) {
                        log.error(err.stack);
                    }
                    throw new Error(
                        `Error loading ref ${configPath} (index ${i}) in parent ${contextPath}: ${err instanceof Error ? err.stack : err}`
                    );
                }
            }
        } catch (err) {
            log.error(`Error processing TaskConfig object at ${contextPath}: ${err instanceof Error ? err.message : err}`);
            if (err instanceof Error && err.stack) {
                log.error(err.stack);
            }
            throw new Error(`Error processing LevelConfig object at ${contextPath}: ${err instanceof Error ? err.stack : err}`);
        }

        levelConfig.levelList.init();

        return levelConfig;
    }
}
