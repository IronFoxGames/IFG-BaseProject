import { CompletionSequenceEvent } from './CompletionSequenceEvent';
import { CompletionSequenceEventType } from './CompletionSequenceEventType';
import { FocusCompletionSequenceEventData } from './models/FocusCompletionSequenceEventData';

export class FocusCompletionSequenceEvent extends CompletionSequenceEvent {
    public eventData: FocusCompletionSequenceEventData;

    constructor(data: FocusCompletionSequenceEventData) {
        super();
        this.eventData = data;
    }

    public getType(): CompletionSequenceEventType {
        return CompletionSequenceEventType.FocusOnItem;
    }

    public static fromObject(obj: any, contextPath: string = '<unknown focus event>'): FocusCompletionSequenceEvent {
        if (!obj.eventData.itemId) {
            throw new Error(`FocusCompletionSequenceEvent: 'itemId' is required at ${contextPath}`);
        }

        if (!obj.eventData.roomId) {
            throw new Error(`FocusCompletionSequenceEvent: 'roomId' is required at ${contextPath}`);
        }

        if (!obj.eventData.spawnId) {
            throw new Error(`FocusCompletionSequenceEvent: 'spawnId' is required at ${contextPath}`);
        }

        return new FocusCompletionSequenceEvent(
            new FocusCompletionSequenceEventData(
                CompletionSequenceEventType.FocusOnItem,
                obj.eventData.itemId,
                obj.eventData.roomId,
                obj.eventData.spawnId
            )
        );
    }
}
