import { CompletionSequenceEvent } from './CompletionSequenceEvent';
import { CompletionSequenceEventType } from './CompletionSequenceEventType';
import { DialogueCompletionSequenceEvent } from './DialogueCompletionSequenceEvent';
import { FocusCompletionSequenceEvent } from './FocusCompletionSequenceEvent';
import { InteractableCompletionSequenceEvent } from './InteractableCompletionSequenceEvent';
import { PlacePropCompletionSequenceEvent } from './PlacePropCompletionSequenceEvent';
import { ForceSwapPropsCompletionSequenceEvent } from './ForceSwapPropsCompletionSequenceEvent';
import { UnlockRoomCompletionSequenceEvent } from './UnlockRoomCompletionSequenceEvent';
import { EndgamePopUpCompletionSequenceEvent } from './EndgamePopUpCompletionSequenceEvent';
import { NoneCompletionSequenceEvent } from './NoneCompletionSequenceEvent';

export class CompletionSequenceEventFactory {
    public static fromObject(obj: any, contextPath: string = '<unknown event>'): CompletionSequenceEvent {
        if (!obj.eventData) {
            throw new Error(`Missing sequence event data at ${contextPath}`);
        }

        if (!obj.eventData.eventType) {
            throw new Error(`Missing event type field in sequence event data at ${contextPath}`);
        }

        let cse = null;

        try {
            switch (obj.eventData.eventType) {
                case CompletionSequenceEventType.Dialogue:
                    cse = DialogueCompletionSequenceEvent.fromObject(obj, contextPath);
                    break;
                case CompletionSequenceEventType.FocusOnItem:
                    cse = FocusCompletionSequenceEvent.fromObject(obj, contextPath);
                    break;
                case CompletionSequenceEventType.InteractableItems:
                    cse = InteractableCompletionSequenceEvent.fromObject(obj, contextPath);
                    break;
                case CompletionSequenceEventType.PlaceProp:
                    cse = PlacePropCompletionSequenceEvent.fromObject(obj, contextPath);
                    break;
                case CompletionSequenceEventType.ForceSwapProps:
                    cse = ForceSwapPropsCompletionSequenceEvent.fromObject(obj, contextPath);
                    break;
                case CompletionSequenceEventType.UnlockRoom:
                    cse = UnlockRoomCompletionSequenceEvent.fromObject(obj, contextPath);
                    break;
                case CompletionSequenceEventType.EndGamePopUp:
                    cse = EndgamePopUpCompletionSequenceEvent.fromObject(obj, contextPath);
                    break;
                case CompletionSequenceEventType.None:
                    cse = NoneCompletionSequenceEvent.fromObject(obj);
                    break;
                default:
                    throw new Error(`Unknown sequence event type: ${obj.eventData.eventType} at ${contextPath}`);
            }
        } catch (err) {
            throw new Error(`Failed to parse CompletionSequenceEvent at ${contextPath}: ${err instanceof Error ? err.stack : err}`);
        }

        return cse;
    }
}
