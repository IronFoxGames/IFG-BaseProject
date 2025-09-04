import { CompletionSequenceEventType } from '../CompletionSequenceEventType';
import { CompletionSequenceEventData } from './CompletionSequenceEventData';

export class NoneCompletionSequenceEventData extends CompletionSequenceEventData {
    constructor(eventType: CompletionSequenceEventType) {
        super(eventType);
    }
}
