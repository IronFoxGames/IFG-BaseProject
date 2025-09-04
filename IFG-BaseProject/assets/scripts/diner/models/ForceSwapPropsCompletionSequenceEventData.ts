import { RoomAndNodeAndProp } from '../../core/model/RoomAndNodeAndProp';
import { CompletionSequenceEventType } from '../CompletionSequenceEventType';
import { CompletionSequenceEventData } from './CompletionSequenceEventData';

export class ForceSwapPropsCompletionSequenceEventData extends CompletionSequenceEventData {
    public locationAndPropIds: RoomAndNodeAndProp[];

    constructor(eventType: CompletionSequenceEventType, locationAndPropIds: RoomAndNodeAndProp[]) {
        super(eventType);
        this.locationAndPropIds = locationAndPropIds;
    }
}
