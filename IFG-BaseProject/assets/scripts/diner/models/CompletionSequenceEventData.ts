import { CompletionSequenceEventType } from '../CompletionSequenceEventType';

export class CompletionSequenceEventData {
    public eventType: CompletionSequenceEventType;

    constructor(eventType: CompletionSequenceEventType) {
        this.eventType = eventType;
    }
}
