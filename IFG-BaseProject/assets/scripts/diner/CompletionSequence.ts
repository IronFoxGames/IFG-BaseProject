import { CompletionSequenceEvent } from './CompletionSequenceEvent';
import { CompletionSequenceEventFactory } from './CompletionSequenceEventFactory';

export class CompletionSequence {
    public events: CompletionSequenceEvent[] = [];

    public static fromObject(obj: any, contextPath: string = '<unknown sequence>'): CompletionSequence {
        const sequence = new CompletionSequence();

        if (!Array.isArray(obj.events)) {
            throw new Error(`No events array at ${contextPath}`);
        }

        sequence.events = obj.events.map((o: any, i: number) => {
            try {
                return CompletionSequenceEventFactory.fromObject(o, `${contextPath} > events[${i}]`);
            } catch (err) {
                throw new Error(`Error parsing event at ${contextPath} > events[${i}]: ${err instanceof Error ? err.stack : err}`);
            }
        });

        return sequence;
    }
}
