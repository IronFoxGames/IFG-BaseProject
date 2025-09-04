import { CompletionSequenceEventType } from '../CompletionSequenceEventType';
import { CompletionSequenceEventData } from './CompletionSequenceEventData';

export class InteractableCompletionSequenceEventData extends CompletionSequenceEventData {
    public itemId: string;
    public roomId: string;
    public spawnIds: string[];
    public iconId: string;

    constructor(eventType: CompletionSequenceEventType, itemId: string, roomId: string, spawnIds: string[], iconId: string) {
        super(eventType);
        this.itemId = itemId;
        this.roomId = roomId;
        this.spawnIds = spawnIds;
        this.iconId = iconId;
    }
}
