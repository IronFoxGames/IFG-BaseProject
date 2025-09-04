import { CompletionSequenceEvent } from './CompletionSequenceEvent';
import { CompletionSequenceEventType } from './CompletionSequenceEventType';
import { DialogueCompletionSequenceEventData } from './models/DialogueCompletionSequenceEventData';

export class DialogueCompletionSequenceEvent extends CompletionSequenceEvent {
    public eventData: DialogueCompletionSequenceEventData;

    constructor(data: DialogueCompletionSequenceEventData) {
        super();
        this.eventData = data;
    }

    public getType(): CompletionSequenceEventType {
        return CompletionSequenceEventType.Dialogue;
    }

    public static fromObject(obj: any, contextPath: string = '<unknown dialogue event>'): DialogueCompletionSequenceEvent {
        if (!obj.eventData.dialogueId) {
            throw new Error(`DialogueCompletionSequenceEvent: 'dialogueId' is required at ${contextPath}`);
        }

        return new DialogueCompletionSequenceEvent(
            new DialogueCompletionSequenceEventData(CompletionSequenceEventType.Dialogue, obj.eventData.dialogueId)
        );
    }
}
