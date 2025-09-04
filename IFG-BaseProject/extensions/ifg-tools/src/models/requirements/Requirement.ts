import { RequirementType } from './RequirementType';

export abstract class Requirement {
    public requirementType: RequirementType;

    constructor(requirementType: RequirementType) {
        this.requirementType = requirementType;
    }

    public getType() {
        return this.requirementType;
    }
    abstract toString(): string;
}
