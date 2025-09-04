import { CompletionSequenceEventType } from '../CompletionSequenceEventType';
import { CompletionSequenceEventData } from './CompletionSequenceEventData';

export class UnlockRoomCompletionSequenceEventData extends CompletionSequenceEventData {
    public roomId: string;

    constructor(eventType: CompletionSequenceEventType, roomId: string) {
        super(eventType);
        this.roomId = roomId;
    }
}
