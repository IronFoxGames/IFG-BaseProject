"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Requirement = void 0;
class Requirement {
    constructor(requirementType) {
        this.requirementType = requirementType;
    }
    getType() {
        return this.requirementType;
    }
}
exports.Requirement = Requirement;
