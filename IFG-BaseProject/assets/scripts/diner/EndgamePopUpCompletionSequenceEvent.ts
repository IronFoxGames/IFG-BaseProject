import { CompletionSequenceEvent } from './CompletionSequenceEvent';
import { CompletionSequenceEventType } from './CompletionSequenceEventType';
import { EndgamePopUpCompletionSequenceEventData } from './models/EndgamePopUpCompletionSequenceEventData';

export class EndgamePopUpCompletionSequenceEvent extends CompletionSequenceEvent {
    public eventData: EndgamePopUpCompletionSequenceEventData;

    constructor(data: EndgamePopUpCompletionSequenceEventData) {
        super();
        this.eventData = data;
    }

    public getType(): CompletionSequenceEventType {
        return CompletionSequenceEventType.EndGamePopUp;
    }

    public static fromObject(obj: any, contextPath: string = '<unknown endgame popup event>'): EndgamePopUpCompletionSequenceEvent {
        if (!obj.eventData.title) {
            throw new Error(`EndgamePopUpCompletionSequenceEvent: 'title' is required at ${contextPath}`);
        }

        if (!obj.eventData.message) {
            throw new Error(`EndgamePopUpCompletionSequenceEvent: 'message' is required ${contextPath}`);
        }

        if (!obj.eventData.spritePath) {
            throw new Error(`EndgamePopUpCompletionSequenceEvent: 'spritePath' is required at ${contextPath}`);
        }

        return new EndgamePopUpCompletionSequenceEvent(
            new EndgamePopUpCompletionSequenceEventData(
                CompletionSequenceEventType.EndGamePopUp,
                obj.eventData.title,
                obj.eventData.message,
                obj.eventData.spritePath
            )
        );
    }
}
