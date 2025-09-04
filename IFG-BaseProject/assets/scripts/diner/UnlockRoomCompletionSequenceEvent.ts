import { CompletionSequenceEvent } from './CompletionSequenceEvent';
import { CompletionSequenceEventType } from './CompletionSequenceEventType';
import { UnlockRoomCompletionSequenceEventData } from './models/UnlockRoomCompletionSequenceEventData';

export class UnlockRoomCompletionSequenceEvent extends CompletionSequenceEvent {
    public eventData: UnlockRoomCompletionSequenceEventData;

    constructor(data: UnlockRoomCompletionSequenceEventData) {
        super();
        this.eventData = data;
    }

    public getType(): CompletionSequenceEventType {
        return CompletionSequenceEventType.UnlockRoom;
    }

    public static fromObject(obj: any, contextPath: string = '<unknown unlockroom event>'): UnlockRoomCompletionSequenceEvent {
        if (!obj.eventData.roomId) {
            throw new Error(`UnlockRoomCompletionSequenceEvent: 'roomId' is required at ${contextPath}`);
        }

        return new UnlockRoomCompletionSequenceEvent(
            new UnlockRoomCompletionSequenceEventData(CompletionSequenceEventType.UnlockRoom, obj.eventData.roomId)
        );
    }
}
