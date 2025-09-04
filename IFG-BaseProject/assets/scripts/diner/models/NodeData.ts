import { Requirement } from '../../core/model/requirements/Requirement';
import { RequirementFactory } from '../../core/model/requirements/RequirementFactory';

export class NodeData {
    public id: string = '';
    public isStatic: boolean = false;
    public defaultPropId: string = '';
    public tags: string[] = [];
    public requirements: Requirement[] = [];

    public static fromObject(obj: any): NodeData {
        const node = new NodeData();

        node.id = obj.id;

        node.isStatic = obj.isStatic;

        node.defaultPropId = obj.defaultPropId;

        if (Array.isArray(obj.tags)) {
            node.tags = obj.tags;
        }

        if (Array.isArray(obj.requirements)) {
            node.requirements = obj.requirements.map((o: any) => RequirementFactory.fromObject(o));
        }

        return node;
    }
}
