import { CompletionSequenceEventType } from '../CompletionSequenceEventType';
import { CompletionSequenceEventData } from './CompletionSequenceEventData';

export class DialogueCompletionSequenceEventData extends CompletionSequenceEventData {
    public dialogueId: string;

    constructor(eventType: CompletionSequenceEventType, dialogueId: string) {
        super(eventType);
        this.dialogueId = dialogueId;
    }
}
