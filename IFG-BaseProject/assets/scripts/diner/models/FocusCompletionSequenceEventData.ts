import { CompletionSequenceEventType } from '../CompletionSequenceEventType';
import { CompletionSequenceEventData } from './CompletionSequenceEventData';

export class FocusCompletionSequenceEventData extends CompletionSequenceEventData {
    public itemId: string;
    public roomId: string;
    public spawnId: string;

    constructor(eventType: CompletionSequenceEventType, itemId: string, roomId: string, spawnId: string) {
        super(eventType);
        this.itemId = itemId;
        this.roomId = roomId;
        this.spawnId = spawnId;
    }
}
