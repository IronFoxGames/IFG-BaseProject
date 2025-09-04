import { CompletionSequenceEventType } from '../CompletionSequenceEventType';
import { CompletionSequenceEventData } from './CompletionSequenceEventData';

export class PlacePropCompletionSequenceEventData extends CompletionSequenceEventData {
    public roomId: string;
    public nodeId: string;
    public propTags: string[];

    constructor(eventType: CompletionSequenceEventType, roomId: string, nodeId: string, propTags: string[]) {
        super(eventType);
        this.roomId = roomId;
        this.nodeId = nodeId;
        this.propTags = propTags;
    }
}
