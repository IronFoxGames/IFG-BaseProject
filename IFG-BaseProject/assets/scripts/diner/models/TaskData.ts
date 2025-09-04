import { Requirement } from '../../core/model/requirements/Requirement';
import { RequirementFactory } from '../../core/model/requirements/RequirementFactory';
import { CompletionSequence } from '../CompletionSequence';

export class TaskData {
    public id: string = '';
    public name: string = '';
    public iconId: string = '';
    public description: string = '';
    public unlockRequirements: Requirement[] = [];
    public starCost: number = 0;
    public completionCount: number = 1;
    public completionSequences: CompletionSequence[] = [];
    public chapterStartTask: string = '';
    public chapterEndTask: string = '';

    public static fromObject(obj: any, contextPath: string = '<unknown task>'): TaskData {
        const task = new TaskData();

        try {
            task.id = obj.id;
            task.name = obj.name;
            task.iconId = obj.iconId;
            task.description = obj.description;

            if (Array.isArray(obj.unlockRequirements)) {
                task.unlockRequirements = obj.unlockRequirements.map((o: any, i: number) => {
                    try {
                        return RequirementFactory.fromObject(o);
                    } catch (err) {
                        throw new Error(
                            `Error parsing unlockRequirement at ${contextPath} > unlockRequirements[${i}]: ${err instanceof Error ? err.stack : err}`
                        );
                    }
                });
            }

            task.starCost = obj.starCost;
            task.completionCount = obj.completionCount;
            task.chapterStartTask = obj.chapterStartTask ?? '';
            task.chapterEndTask = obj.chapterEndTask ?? '';

            if (Array.isArray(obj.completionSequences)) {
                task.completionSequences = obj.completionSequences.map((o: any, i: number) => {
                    try {
                        return CompletionSequence.fromObject(o, `${contextPath} > completionSequences[${i}]`);
                    } catch (err) {
                        throw new Error(
                            `Error parsing completionSequence at ${contextPath} > completionSequences[${i}]: ${err instanceof Error ? err.stack : err}`
                        );
                    }
                });
            }
        } catch (err) {
            throw new Error(`Error parsing TaskData at ${contextPath}: ${err instanceof Error ? err.stack : err}`);
        }

        return task;
    }
}
