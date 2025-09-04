import { JsonAsset } from 'cc';
import { Chapter } from '../diner/Chapter';
import { ResourceLoader } from '../utils/ResourceLoader';
import { Task } from '../diner/Task';
import { logger } from '../logging';

export class TaskConfig {
    public chapters: Chapter[] = [];
    private _log = logger.child('TaskConfig');

    public getTask(taskId: string): Task {
        const chapter = this.chapters.find((chapter) => chapter.getTask(taskId) !== null);

        if (chapter !== undefined) {
            return chapter.getTask(taskId);
        } else {
            this._log.error(`No task with id: ${taskId} was found in any chapter in task config.`);
            return null;
        }
    }

    public static async fromObject(obj: any, contextPath: string = '<root>'): Promise<TaskConfig> {
        let taskConfig = new TaskConfig();

        try {
            // Validate and process the main chapter object
            if (obj.id && obj.name && Array.isArray(obj.tasks)) {
                try {
                    const chapter = await Chapter.fromObject(obj, contextPath);
                    taskConfig.chapters.push(chapter);
                } catch (err) {
                    logger.error(
                        `Failed to load main chapter in TaskConfig at ${contextPath} (id: ${obj.id}, name: ${obj.name}): ${err instanceof Error ? err.message : err}`
                    );
                    if (err instanceof Error && err.stack) {
                        logger.error(err.stack);
                    }
                    throw new Error(
                        `Failed to load main chapter in TaskConfig at ${contextPath} (id: ${obj.id}, name: ${obj.name}): ${err instanceof Error ? err.stack : err}`
                    );
                }
            }

            // Process referenced chapters
            if (obj.refs && Array.isArray(obj.refs)) {
                for (let i = 0; i < obj.refs.length; i++) {
                    const configPath = obj.refs[i];
                    try {
                        const chapterJson = await ResourceLoader.load(configPath, JsonAsset);
                        try {
                            const childConfig = await TaskConfig.fromObject(chapterJson.json, configPath);
                            taskConfig.chapters.push(...childConfig.chapters);
                        } catch (err) {
                            const _log = logger.child('TaskConfig.fromObject');
                            _log.error(
                                `Failed to process child config from ref ${configPath} (index ${i}) in parent ${contextPath}: ${err instanceof Error ? err.message : err}`
                            );
                            if (err instanceof Error && err.stack) {
                                _log.error(err.stack);
                            }
                            throw new Error(
                                `Error processing child config from ref ${configPath} (index ${i}) in parent ${contextPath}: ${err instanceof Error ? err.stack : err}`
                            );
                        }
                    } catch (err) {
                        const _log = logger.child('TaskConfig.fromObject');
                        _log.error(
                            `Failed to load ref ${configPath} (index ${i}) in parent ${contextPath}: ${err instanceof Error ? err.message : err}`
                        );
                        if (err instanceof Error && err.stack) {
                            _log.error(err.stack);
                        }
                        throw new Error(
                            `Error loading ref ${configPath} (index ${i}) in parent ${contextPath}: ${err instanceof Error ? err.stack : err}`
                        );
                    }
                }
            }
        } catch (err) {
            const _log = logger.child('TaskConfig.fromObject');
            _log.error(`Error processing TaskConfig object at ${contextPath}: ${err instanceof Error ? err.message : err}`);
            if (err instanceof Error && err.stack) {
                _log.error(err.stack);
            }
            throw new Error(`Error processing TaskConfig object at ${contextPath}: ${err instanceof Error ? err.stack : err}`);
        }

        return taskConfig;
    }
}
