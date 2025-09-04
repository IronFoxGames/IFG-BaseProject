import { CompletionSequenceEventType } from './CompletionSequenceEventType';

export abstract class CompletionSequenceEvent {
    abstract getType(): CompletionSequenceEventType;
    //TODO: Some abstract function representing the unique functionality that each event will need to execute?
}
