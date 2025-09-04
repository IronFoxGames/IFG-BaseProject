import { CompletionSequenceEvent } from './CompletionSequenceEvent';
import { CompletionSequenceEventType } from './CompletionSequenceEventType';
import { PlacePropCompletionSequenceEventData } from './models/PlacePropCompletionSequenceEventData';

export class PlacePropCompletionSequenceEvent extends CompletionSequenceEvent {
    public eventData: PlacePropCompletionSequenceEventData;

    constructor(data: PlacePropCompletionSequenceEventData) {
        super();
        this.eventData = data;
    }

    public getType(): CompletionSequenceEventType {
        return CompletionSequenceEventType.PlaceProp;
    }

    public static fromObject(obj: any, contextPath: string = '<unknown placeprop event>'): PlacePropCompletionSequenceEvent {
        if (!obj.eventData.roomId) {
            throw new Error(`PlacePropCompletionSequenceEvent: 'roomId' is required at ${contextPath}`);
        }

        if (!obj.eventData.nodeId) {
            throw new Error(`PlacePropCompletionSequenceEvent: 'nodeId' is required at ${contextPath}`);
        }

        if (!Array.isArray(obj.eventData.propTags) || obj.eventData.propTags.length == 0) {
            throw new Error(`PlacePropCompletionSequenceEvent: 'propTags' is required at ${contextPath}`);
        }

        return new PlacePropCompletionSequenceEvent(
            new PlacePropCompletionSequenceEventData(
                CompletionSequenceEventType.PlaceProp,
                obj.eventData.roomId,
                obj.eventData.nodeId,
                obj.eventData.propTags
            )
        );
    }
}
