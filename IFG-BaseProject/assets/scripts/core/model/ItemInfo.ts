import { ItemType } from '../enums/ItemType';
import { Requirement } from './requirements/Requirement';
import { RequirementFactory } from './requirements/RequirementFactory';

export class ItemInfo {
    public id: string;
    public externalId: string;
    public type: ItemType;
    public sprite: string;
    public name: string;
    public tooltip: string;
    public requirements: Requirement[];
    public isCurrency: boolean;

    constructor(
        id: string,
        externalId: string,
        type: ItemType,
        sprite: string,
        name: string,
        tooltip: string,
        requirements: Requirement[],
        isCurrency: boolean
    ) {
        this.id = id;
        this.externalId = externalId ?? null;
        this.type = type;
        this.sprite = sprite;
        this.name = name;
        this.tooltip = tooltip;
        this.requirements = requirements;
        this.isCurrency = isCurrency;
    }

    public static fromObject(obj: any): ItemInfo {
        if (!obj || typeof obj.id !== 'string' || obj.type == null || obj.sprite == null || typeof obj.sprite !== 'string' || obj.name == null) {
            throw new Error('Invalid ItemInfo');
        }

        if (!Object.values(ItemType).includes(obj.type)) {
            throw new Error(`Invalid ItemInfo[${obj.id}] - ItemType is invalid: ${obj.type}`);
        }

        let reqs: Requirement[] = [];
        if (Array.isArray(obj.requirements)) {
            reqs = obj.requirements.map((o: any) => RequirementFactory.fromObject(o));
        }

        return new ItemInfo(obj.id, obj.externalId, obj.type, obj.sprite, obj.name, obj.tooltip ?? '', reqs, obj.isCurrency || false);
    }
}
