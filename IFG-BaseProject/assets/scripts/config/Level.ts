import { Requirement } from '../core/model/requirements/Requirement';
import { RequirementFactory } from '../core/model/requirements/RequirementFactory';
import { Cost } from './Cost';

export class Level {
    public name: string = '';
    public id: string = '';
    public path: string = '';
    public cost: Cost | null = null;
    public requirements: Requirement[] = [];
    public index: number = -1;

    public static fromObject(obj: any): Level {
        const level = new Level();
        level.name = obj.name;
        level.id = obj.id;
        level.path = obj.path;
        level.cost = Cost.fromObject(obj.cost);

        if (Array.isArray(obj.requirements)) {
            level.requirements = obj.requirements.map((o: any) => RequirementFactory.fromObject(o));
        }

        return level;
    }
}
