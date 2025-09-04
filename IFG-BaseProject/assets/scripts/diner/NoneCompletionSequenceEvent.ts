import { CompletionSequenceEvent } from './CompletionSequenceEvent';
import { CompletionSequenceEventType } from './CompletionSequenceEventType';
import { NoneCompletionSequenceEventData } from './models/NoneCompletionSequenceEventData';

export class NoneCompletionSequenceEvent extends CompletionSequenceEvent {
    public eventData: NoneCompletionSequenceEventData;

    constructor(data: NoneCompletionSequenceEventData) {
        super();
        this.eventData = data;
    }

    public getType(): CompletionSequenceEventType {
        return CompletionSequenceEventType.None;
    }

    public static fromObject(obj: any, contextPath: string = '<none completion sequence event>'): NoneCompletionSequenceEvent {
        return new NoneCompletionSequenceEvent(new NoneCompletionSequenceEventData(CompletionSequenceEventType.None));
    }
}
