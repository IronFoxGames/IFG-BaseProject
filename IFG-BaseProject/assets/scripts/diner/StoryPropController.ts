import { _decorator, Component, Node } from 'cc';
import { StoryProp } from './StoryProp';
import { RequirementsService } from '../services/RequirementsService';
import { logger } from '../logging';
const { ccclass, property } = _decorator;

@ccclass('StoryPropController')
export class StoryPropController extends Component {
    @property({ type: StoryProp, visible: true })
    private _storyProps: StoryProp[] = [];

    private _log = logger.child('StoryPropController');

    public async init(requirementsService: RequirementsService): Promise<boolean> {
        for (const prop of this._storyProps) {
            let result = await prop.init(requirementsService);

            if (!result) {
                this._log.error(`Failed to initialize story prop of id: ${prop.storyPropData.id}`);
                return false;
            }
        }

        return true;
    }
}
