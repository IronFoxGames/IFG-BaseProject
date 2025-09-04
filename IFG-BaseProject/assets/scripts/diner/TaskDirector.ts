import { Event } from '../core/Event';
import { logger } from '../logging';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { IDinerService } from '../services/IDinerService';
import { UIOverlayService } from '../services/UIOverlayService';
import { CompletionSequenceState } from './CompletionSequenceState';
import { Task } from './Task';
import { TaskManager } from './TaskManager';

export class TaskDirector {
    public OnCompletionSequneceBegin: Event = new Event();
    public OnCompletionSequneceComplete: Event = new Event();
    public OnStarsWithheld: Event = new Event();

    private _cardScrambleService: ICardScrambleService;
    private _uiOverlayService: UIOverlayService;
    private _dinerService: IDinerService;

    private _sequenceRunning: boolean = false;
    private _currentState: CompletionSequenceState;
    private _onCurrentCompletionSequenceCompleted: () => Promise<boolean>;
    private _log = logger.child('TaskDirector');

    public init(cardScrambleService: ICardScrambleService, uiOverlayService: UIOverlayService, dinerService: IDinerService) {
        this._cardScrambleService = cardScrambleService;
        this._uiOverlayService = uiOverlayService;
        this._dinerService = dinerService;
    }

    public isTaskSequenceRunning(): boolean {
        return this._sequenceRunning;
    }

    public instanceAndBeginCompletionSequenceState(task: Task, taskManager: TaskManager, animateStars: () => void) {
        if (this._sequenceRunning) {
            this._log.error('Attempted to begin a completion sequence while one is already running!');
            return;
        }

        animateStars?.call(this, () => {
            //Set the sequence running flag to true to halt things that shouldn't happen when a sequence is in progress...
            this._sequenceRunning = true;

            //Set the _onCurrentCompletionSequenceCompleted callback to save the completion of this task...
            this._onCurrentCompletionSequenceCompleted = async (): Promise<boolean> => {
                const result = await taskManager.incrementAndSaveTaskCompletion(task);
                return result;
            };

            //We need to evaluate the next Completion Sequence that hasn't been completed yet for this task...
            let currentSequenceIndex = this._cardScrambleService.getTaskCompletionCount(task.data.id);

            //Instance and begin a new state for the next sequence in this task...
            this._currentState = new CompletionSequenceState(
                task.data.completionSequences[currentSequenceIndex],
                this._cardScrambleService,
                this._uiOverlayService,
                this._dinerService
            );

            this._dinerService.setStarsWithheld(task.data.starCost);
            this.OnStarsWithheld?.invoke();

            this._currentState.begin();
        });
    }

    public tickCurrentCompletionSequenceState() {
        //Only try to update the current sequence if the sequence is running...
        if (this._sequenceRunning && this._currentState != null) {
            this._currentState.tick();

            //If the completion criteria has been met, complete the current
            if (this._currentState.completionCriteriaMet()) {
                this._completeCurrentCompletionSequenceState();
            }
        }
    }

    private _completeCurrentCompletionSequenceState() {
        //Call complete on the current state and make sure it's marked for garbage collection...
        this._currentState.complete();

        this._currentState = null;

        //Save the task's sequence as completed to the user's save data...
        this._onCurrentCompletionSequenceCompleted.call(this).then((result: boolean) => {
            if (!result) {
                this._log.error('Failed to complete completion sequence.');
            }

            this._onCurrentCompletionSequenceCompleted = null;

            //Set the sequence running flag to false to re-enable normal functionality...
            this._sequenceRunning = false;

            this.OnCompletionSequneceComplete?.invoke();
        });
    }
}
