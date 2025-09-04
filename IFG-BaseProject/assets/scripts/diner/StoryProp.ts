import { _decorator, Component, Node, CCString, Enum } from 'cc';
import { RequirementsService } from '../services/RequirementsService';
import { StoryPropData } from './models/StoryPropData';
import { logger } from '../logging';
import { ResourceLoader } from '../utils/ResourceLoader';
import { JsonAsset } from 'cc';
const { ccclass, property } = _decorator;

export enum StoryPropComparisonOperator {
    AND,
    OR
}

@ccclass('StoryProp')
export class StoryProp extends Component {
    public storyPropData: StoryPropData = null;

    @property({ type: Enum(StoryPropComparisonOperator), visible: true })
    private _comparisonOperator: StoryPropComparisonOperator = StoryPropComparisonOperator.AND;
    @property({ type: CCString, visible: true })
    private _resourcePath: string = '';

    private _requirementsService: RequirementsService = null;
    private _log = logger.child('StoryProp');

    public async init(requirementsService: RequirementsService): Promise<boolean> {
        this._requirementsService = requirementsService;

        const storyPropDataJSON = await ResourceLoader.load(this._resourcePath, JsonAsset);

        this._log.info('storyPropDataJSON data', { storyPropDataJSON: storyPropDataJSON });
        this._log.info('storyPropDataJSON json field', { json: storyPropDataJSON?.json });

        this.storyPropData = StoryPropData.fromObject(storyPropDataJSON.json);

        this._evaluateVisibility();

        return storyPropDataJSON != null;
    }

    private _evaluateVisibility() {
        switch (this._comparisonOperator) {
            case StoryPropComparisonOperator.AND: {
                this.node.active =
                    !this._requirementsService.checkRequirementsMet(this.storyPropData.visibleUntilRequirments) &&
                    this._requirementsService.checkRequirementsMet(this.storyPropData.visibleAfterRequirments);
                break;
            }
            case StoryPropComparisonOperator.OR: {
                this.node.active =
                    !this._requirementsService.checkRequirementsMet(this.storyPropData.visibleUntilRequirments) ||
                    this._requirementsService.checkRequirementsMet(this.storyPropData.visibleAfterRequirments);
                break;
            }
            default: {
                this._log.error('Tried to compare with an unsupported StoryPropComparisonOperator...');
                break;
            }
        }
    }
}
