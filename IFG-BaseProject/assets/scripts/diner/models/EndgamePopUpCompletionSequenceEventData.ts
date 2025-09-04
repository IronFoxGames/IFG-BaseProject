import { CompletionSequenceEventType } from '../CompletionSequenceEventType';
import { CompletionSequenceEventData } from './CompletionSequenceEventData';

export class EndgamePopUpCompletionSequenceEventData extends CompletionSequenceEventData {
    public title: string;
    public message: string;
    public spritePath: string;

    constructor(eventType: CompletionSequenceEventType, title: string, message: string, spritePath: string) {
        super(eventType);
        this.title = title;
        this.message = message;
        this.spritePath = spritePath;
    }
}
