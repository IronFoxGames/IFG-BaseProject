import { Event } from '../core/Event';
import { IDinerService } from '../services/IDinerService';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { UIOverlayService } from '../services/UIOverlayService';
import { CompletionSequence } from './CompletionSequence';
import { CompletionSequenceEventState } from './CompletionSequenceEventState';

export class CompletionSequenceState {
    private _completionSequence: CompletionSequence = null;
    private _cardScrambleService: ICardScrambleService;
    private _uiOverlayService: UIOverlayService;
    private _dinerService: IDinerService;

    private _currentEventIndex: number = 0;
    private _currentEventState: CompletionSequenceEventState = null;
    private _onSequneceCompletedEvent: Event = new Event();
    private _completionCriteriaMet: boolean = false;

    constructor(
        completionSequence: CompletionSequence,
        cardScrambleService: ICardScrambleService,
        uiOverlayService: UIOverlayService,
        dinerService: IDinerService
    ) {
        this._completionSequence = completionSequence;
        this._cardScrambleService = cardScrambleService;
        this._uiOverlayService = uiOverlayService;
        this._dinerService = dinerService;
        this._completionCriteriaMet = false;
    }

    public begin() {
        //We always start at the first event in the list...
        this._currentEventIndex = 0;

        //Instance and begin a new state for the first event in this sequence...
        this._currentEventState = new CompletionSequenceEventState(
            this._completionSequence.events[this._currentEventIndex],
            this._cardScrambleService,
            this._uiOverlayService,
            this._dinerService
        );

        this._currentEventState.begin();
    }

    public tick() {
        //Update the current event state...
        this._currentEventState.tick();

        //Try to transition to the next event as soon as the current one has labelled itself complete...
        if (this._currentEventState.completionCriteriaMet()) {
            this._transitionToNextEventState();
        }
    }

    public complete() {
        //Invoke the _onSequneceCompletedEvent to save all of the queued data for the events...
        this._onSequneceCompletedEvent?.invoke();
    }

    public completionCriteriaMet(): boolean {
        return this._completionCriteriaMet;
    }

    private _transitionToNextEventState() {
        //Call the current state's complete function, and let it subscribe its save data function to the _onSequneceCompletedEvent...
        this._currentEventState.complete(this._onSequneceCompletedEvent);

        this._currentEventState = null;

        //Increment the current event index...
        this._currentEventIndex++;

        //Check if the new index is outside the range of the event list
        let eventListLength = this._completionSequence.events.length;

        if (this._currentEventIndex >= eventListLength) {
            //There are no more events to handle, mark this sequence ready for completion...
            this._completionCriteriaMet = true;
        } else {
            //Instance and begin a new state for the next event in this sequence...
            this._currentEventState = new CompletionSequenceEventState(
                this._completionSequence.events[this._currentEventIndex],
                this._cardScrambleService,
                this._uiOverlayService,
                this._dinerService
            );

            this._currentEventState.begin();
        }
    }
}
