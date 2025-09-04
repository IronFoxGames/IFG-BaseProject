import { Task } from './Task';
import { TaskData } from './models/TaskData';

export class Chapter {
    public id: string = '';
    public name: string = '';
    public tasks: Task[] = [];

    public getTask(taskId: string): Task {
        const task = this.tasks.find((task) => task.data.id === taskId);

        if (task !== undefined) {
            return task;
        } else {
            return null;
        }
    }

    public static async fromObject(obj: any, contextPath: string = '<unknown chapter>'): Promise<Chapter> {
        let chapter: Chapter = new Chapter();

        if (obj.id) {
            chapter.id = obj.id;
        }

        if (obj.name) {
            chapter.name = obj.name;
        }

        if (Array.isArray(obj.tasks)) {
            chapter.tasks = [];
            for (let i = 0; i < obj.tasks.length; i++) {
                const taskObj = obj.tasks[i];
                const taskContext = `${contextPath} > tasks[${i}]${taskObj && taskObj.id ? ` (id: ${taskObj.id})` : ''}`;
                try {
                    const data = TaskData.fromObject(taskObj, taskContext);
                    if (data !== null) {
                        chapter.tasks.push(new Task(data));
                    }
                } catch (err) {
                    throw new Error(`Error parsing task at ${taskContext}: ${err instanceof Error ? err.stack : err}`);
                }
            }
        }

        return chapter;
    }
}
