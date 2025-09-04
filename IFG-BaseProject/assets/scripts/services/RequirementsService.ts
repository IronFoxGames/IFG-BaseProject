import { Requirement } from '../core/model/requirements/Requirement';
import { RequirementFactory } from '../core/model/requirements/RequirementFactory';
import { logger } from '../logging';
import { RequirementEval } from '../requirements/RequirementEval';
import { ICardScrambleService } from './ICardScrambleService';
import { IDinerService } from './IDinerService';

export class RequirementsService {
    // Needed for checking player state/progression/inventory
    private _cardScrambleService: ICardScrambleService;
    private _dinerService: IDinerService;
    private _log = logger.child('RequirementsService');

    constructor(cardScrambleService: ICardScrambleService, dinerService: IDinerService) {
        this._cardScrambleService = cardScrambleService;
        this._dinerService = dinerService;
    }

    checkRequirementsMet(requirements: Requirement[]): boolean {
        return requirements.every((req) => RequirementEval.isMet(req, this._cardScrambleService, this._dinerService, this._log));
    }

    static parseRequirements(data: any[]): Requirement[] {
        return data.map((obj) => RequirementFactory.fromObject(obj));
    }

    static printRequirements(requirements: Requirement[]): void {
        const log = logger.child('RequirementsService');
        log.debug('Requirements:');
        requirements.forEach((req) => log.debug(req.toString()));
    }
}
