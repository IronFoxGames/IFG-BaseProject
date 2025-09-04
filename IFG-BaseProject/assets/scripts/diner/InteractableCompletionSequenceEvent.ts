import { CompletionSequenceEvent } from './CompletionSequenceEvent';
import { CompletionSequenceEventType } from './CompletionSequenceEventType';
import { InteractableCompletionSequenceEventData } from './models/InteractableCompletionSequenceEventData';

export class InteractableCompletionSequenceEvent extends CompletionSequenceEvent {
    public eventData: InteractableCompletionSequenceEventData;

    constructor(data: InteractableCompletionSequenceEventData) {
        super();
        this.eventData = data;
    }

    public getType(): CompletionSequenceEventType {
        return CompletionSequenceEventType.InteractableItems;
    }

    public static fromObject(obj: any, contextPath: string = '<unknown interactable event>'): InteractableCompletionSequenceEvent {
        if (!obj.eventData.itemId) {
            throw new Error(`InteractableCompletionSequenceEvent: 'itemId' is required at ${contextPath}`);
        }

        if (!obj.eventData.roomId) {
            throw new Error(`InteractableCompletionSequenceEvent: 'roomId' is required at ${contextPath}`);
        }

        if (!Array.isArray(obj.eventData.spawnIds) || obj.eventData.spawnIds.length == 0) {
            throw new Error(`InteractableCompletionSequenceEvent: 'spawnIds' is required at ${contextPath}`);
        }

        return new InteractableCompletionSequenceEvent(
            new InteractableCompletionSequenceEventData(
                CompletionSequenceEventType.InteractableItems,
                obj.eventData.itemId,
                obj.eventData.roomId,
                obj.eventData.spawnIds,
                obj.eventData.iconId
            )
        );
    }
}
