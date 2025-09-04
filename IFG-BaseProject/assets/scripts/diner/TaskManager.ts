import { ItemConfig } from '../config/ItemConfig';
import { TaskConfig } from '../config/TaskConfig';
import { Currency } from '../core/enums/Currency';
import { ItemType } from '../core/enums/ItemType';
import { Event } from '../core/Event';
import { ChapterCompleteRequirement } from '../core/model/requirements/ChapterCompleteRequirement';
import { RequirementType } from '../core/model/requirements/RequirementType';
import { TaskUpdatedEventData } from '../core/model/TaskCompleteEventData';
import { logger } from '../logging';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { IDinerService } from '../services/IDinerService';
import { RequirementsService } from '../services/RequirementsService';
import { Chapter } from './Chapter';
import { CompletionSequenceEventType } from './CompletionSequenceEventType';
import { DialogueCompletionSequenceEvent } from './DialogueCompletionSequenceEvent';
import { EndgamePopUpCompletionSequenceEvent } from './EndgamePopUpCompletionSequenceEvent';
import { FocusCompletionSequenceEvent } from './FocusCompletionSequenceEvent';
import { InteractableCompletionSequenceEvent } from './InteractableCompletionSequenceEvent';
import { NoneCompletionSequenceEvent } from './NoneCompletionSequenceEvent';
import { PlacePropCompletionSequenceEvent } from './PlacePropCompletionSequenceEvent';
import { PropCatalogue } from './PropCatalogue';
import { Room } from './Room';
import { Task, TaskState } from './Task';

export class TaskManager {
    public ActiveTasksUpdatedAndVerified: Event = new Event();
    public NewAvailableTaskFound: Event = new Event();
    public NewCollectableTaskFound: Event = new Event();
    public PurgeTaskNotificiations: Event = new Event();
    public TaskCompleted: Event = new Event();

    public TaskConfig: TaskConfig;
    public ActiveTasks: Task[] = [];

    public CurrentChapterName: string = '';
    public CurrentChapterProgress: number = 0;

    private _cardScrambleService: ICardScrambleService;
    private _requirementsService: RequirementsService;
    private _dinerService: IDinerService;
    private _propCatalogue: PropCatalogue;

    private _log = logger.child('TaskManager');

    public init(
        cardScrambleService: ICardScrambleService,
        requirementsService: RequirementsService,
        dinerService: IDinerService,
        taskConfig: TaskConfig,
        catalogue: PropCatalogue
    ) {
        this._cardScrambleService = cardScrambleService;

        this._requirementsService = requirementsService;

        this._dinerService = dinerService;

        this.TaskConfig = taskConfig;

        this._propCatalogue = catalogue;

        this._dinerService.registerTaskListOpenedEventCallback(() => this._onTaskListOpenedCallback());

        this.updateActiveTasks();

        this._log.info('Active Tasks', this.ActiveTasks);
    }

    public debugValidate(itemConfig: ItemConfig, dialogueIds: string[], rooms: Room[]) {
        let roomIds: string[] = rooms.map((room) => room.RoomId);
        let nodeIds = rooms.flatMap((room) => room.DinerNodes.map((dinerNode) => dinerNode.getData().id));
        let taskItemIds = itemConfig.getItemInfosOfType(ItemType.Task).map((item) => item.id);

        this._log.debug(`Task Validate: All Task Item Ids = ${taskItemIds.join(', ')}`);
        this._log.debug(`Task Validate: All Dialogue Ids = ${dialogueIds.join(', ')}`);
        this._log.debug(`Task Validate: All Room Ids = ${roomIds.join(', ')}`);
        this._log.debug(`Task Validate: All Node Ids = ${nodeIds.join(', ')}`);
        rooms.forEach((room) => {
            this._log.debug(`Task Validate: ${room.RoomId}: Room Spawn Ids = [${room.getSpawnPointIds().join(', ')}]`);
        });

        let uniqueTaskIds: string[] = [];
        this.TaskConfig.chapters.forEach((chapter) => {
            chapter.tasks.forEach((task) => {
                const prefix = `Task Validate [${chapter.name}]:[${task.data.name}]`;

                // Validate task attributes
                const iconItem = itemConfig.getItemInfo(task.data.iconId);
                if (!iconItem) {
                    this._log.error(`${prefix} No icon found for id: ${task.data.iconId}`);
                    task.setValidity(false);
                }

                //Validate that there are no duplicate task ids
                if (uniqueTaskIds.includes(task.data.id)) {
                    this._log.error(`Task with id: ${task.data.id} has one or more duplicate entries in chapter: ${chapter.id}!`);
                    task.setValidity(false);
                } else {
                    uniqueTaskIds.push(task.data.id);
                }

                // Validate completion sequence event Id refs
                task.data.completionSequences.forEach((sequence) => {
                    let occupiedSpawnPoints: string[] = [];
                    sequence.events.forEach((cse) => {
                        switch (cse.getType()) {
                            case CompletionSequenceEventType.FocusOnItem: {
                                let focusCSE = cse as FocusCompletionSequenceEvent;
                                if (!roomIds.includes(focusCSE.eventData.roomId)) {
                                    this._log.error(`${prefix} RoomId not found: ${focusCSE.eventData.roomId}`);
                                    task.setValidity(false);
                                }
                                if (!taskItemIds.includes(focusCSE.eventData.itemId)) {
                                    this._log.error(`${prefix} ItemId not found: ${focusCSE.eventData.itemId}`);
                                    task.setValidity(false);
                                }
                                const room = rooms.find((r) => r.RoomId === focusCSE.eventData.roomId);
                                const spawnIds = room ? room.getSpawnPointIds() : [];
                                if (!spawnIds.includes(focusCSE.eventData.spawnId)) {
                                    this._log.error(`${prefix} SpawnId not found: ${focusCSE.eventData.spawnId}`);
                                    task.setValidity(false);
                                }
                                if (occupiedSpawnPoints.includes(focusCSE.eventData.spawnId)) {
                                    this._log.warn(
                                        `${prefix} SpawnId: ${focusCSE.eventData.spawnId} used in task: ${task.data.id} could already be occupied within chapter: ${chapter.id}`
                                    );
                                } else {
                                    occupiedSpawnPoints.push(focusCSE.eventData.spawnId);
                                }
                                break;
                            }

                            case CompletionSequenceEventType.InteractableItems: {
                                let interactableCSE = cse as InteractableCompletionSequenceEvent;
                                if (!roomIds.includes(interactableCSE.eventData.roomId)) {
                                    this._log.error(`${prefix} RoomId not found: ${interactableCSE.eventData.roomId}`);
                                    task.setValidity(false);
                                }
                                if (!taskItemIds.includes(interactableCSE.eventData.itemId)) {
                                    this._log.error(`${prefix} ItemId not found: ${interactableCSE.eventData.itemId}`);
                                    task.setValidity(false);
                                }
                                if (!interactableCSE.eventData.spawnIds || interactableCSE.eventData.spawnIds.length === 0) {
                                    this._log.error(`${prefix} SpawnIds not found: ${interactableCSE.eventData.spawnIds}`);
                                    task.setValidity(false);
                                }
                                if (!interactableCSE.eventData.iconId) {
                                    this._log.error(`${prefix} IconId not found: ${interactableCSE.eventData.iconId}`);
                                    task.setValidity(false);
                                }

                                const room = rooms.find((r) => r.RoomId === interactableCSE.eventData.roomId);
                                const spawnIds = room ? room.getSpawnPointIds() : [];
                                interactableCSE.eventData.spawnIds.forEach((spawnId) => {
                                    if (!spawnIds.includes(spawnId)) {
                                        this._log.error(`${prefix} SpawnId not found: ${spawnId}`);
                                        task.setValidity(false);
                                    }

                                    if (occupiedSpawnPoints.includes(spawnId)) {
                                        this._log.warn(
                                            `${prefix} SpawnId: ${spawnId} used in task: ${task.data.id} could already be occupied within chapter: ${chapter.id}`
                                        );
                                    } else {
                                        occupiedSpawnPoints.push(spawnId);
                                    }
                                });

                                break;
                            }
                            case CompletionSequenceEventType.Dialogue: {
                                let dialogueCSE = cse as DialogueCompletionSequenceEvent;
                                if (!dialogueIds.includes(dialogueCSE.eventData.dialogueId)) {
                                    this._log.error(`${prefix} DialogueId not found: ${dialogueCSE.eventData.dialogueId}`);
                                    task.setValidity(false);
                                }
                                break;
                            }
                            case CompletionSequenceEventType.PlaceProp: {
                                let placePropCSE = cse as PlacePropCompletionSequenceEvent;
                                if (!roomIds.includes(placePropCSE.eventData.roomId)) {
                                    this._log.error(`${prefix} RoomId not found: ${placePropCSE.eventData.roomId}`);
                                    task.setValidity(false);
                                }
                                if (!nodeIds.includes(placePropCSE.eventData.nodeId)) {
                                    this._log.error(`${prefix} NodeId not found: ${placePropCSE.eventData.nodeId}`);
                                    task.setValidity(false);
                                }

                                let props = this._propCatalogue.getAllPropsWithTags(placePropCSE.eventData.propTags);

                                if (props.length === 0) {
                                    this._log.error(`${prefix} No props found satisfying tags: ${placePropCSE.eventData.propTags}`);
                                    task.setValidity(false);
                                } else {
                                    let freePropFound: boolean = false;
                                    for (const prop of props) {
                                        if (prop.storeData.cost.amount == 0) {
                                            freePropFound = true;
                                        }
                                    }
                                    if (!freePropFound) {
                                        this._log.error(
                                            `${prefix} No free prop with tags: ${placePropCSE.eventData.propTags} was found for ${task.data.id}`
                                        );
                                        task.setValidity(false);
                                    }
                                }
                                break;
                            }
                            case CompletionSequenceEventType.EndGamePopUp: {
                                let endgamePopUpCSE = cse as EndgamePopUpCompletionSequenceEvent;
                                if (!endgamePopUpCSE.eventData.title) {
                                    this._log.error(`${prefix} EndgamePopUp title not found: ${endgamePopUpCSE.eventData.title}`);
                                    task.setValidity(false);
                                }
                                if (!endgamePopUpCSE.eventData.message) {
                                    this._log.error(`${prefix} EndgamePopUp message not found: ${endgamePopUpCSE.eventData.message}`);
                                    task.setValidity(false);
                                }
                                if (!endgamePopUpCSE.eventData.spritePath) {
                                    this._log.error(`${prefix} EndgamePopUp spritePath not found: ${endgamePopUpCSE.eventData.spritePath}`);
                                    task.setValidity(false);
                                }
                                break;
                            }
                            case CompletionSequenceEventType.None: {
                                let noneCSE = cse as NoneCompletionSequenceEvent;
                                if (noneCSE.eventData) {
                                    const keys = Object.keys(noneCSE.eventData);
                                    if (!keys.includes('eventType') || keys.length > 1) {
                                        this._log.error(
                                            `${prefix} NoneCompletionSequenceEvent eventData should only contain eventType, found: ${JSON.stringify(noneCSE.eventData)}`
                                        );
                                        task.setValidity(false);
                                    }
                                }
                                break;
                            }
                        }
                    });
                });
            });
        });
    }

    public async incrementAndSaveTaskCompletion(task: Task): Promise<boolean> {
        let result: boolean = await this._isTaskReadyForTurnIn(task);

        if (result) {
            this._dinerService.setStarsWithheld(0);

            this._cardScrambleService.loseCurrency(Currency.Stars, task.data.starCost, {
                type: 'task',
                taskId: task.data.id
            });

            let newCompletionCount = this._cardScrambleService.getTaskCompletionCount(task.data.id) + 1;

            const chapterStart = this._getTaskChapterStart(task);
            const chapterEnd = this._getTaskChapterEnd(task);

            const saveResult = await this._cardScrambleService.onTaskUpdated(
                task.data.id,
                new TaskUpdatedEventData(
                    newCompletionCount,
                    true,
                    chapterStart?.name ?? null,
                    chapterStart?.id ?? null,
                    chapterEnd?.name ?? null,
                    chapterEnd?.id ?? null,
                    task?.data?.starCost ?? 0
                )
            );

            this.TaskCompleted?.invoke();
            if (saveResult) {
                this._log.debug(`Successfully marked the task "${task.data.name}" Complete in player save data.`);
            } else {
                this._log.error(`Failed to mark the task "${task.data.name}" Complete in player save data.`);
            }

            this.updateActiveTasks();
        } else {
            this._log.error(`Attempted to mark the task "${task.data.name}" Complete without enough stars.`);
        }

        return result;
    }

    private _getChapter(chapterId: string): Chapter | null {
        return this.TaskConfig.chapters.find((chapter) => chapter.id === chapterId);
    }

    private _getTaskChapterStart(task: Task): Chapter {
        if (!task.data?.chapterStartTask || task.data?.chapterStartTask === '') {
            return null;
        }
        const chapter = this._getChapter(task.data.chapterStartTask);
        if (!chapter) {
            return null;
        }

        return chapter;
    }

    private _getTaskChapterEnd(task: Task): Chapter {
        if (!task.data?.chapterEndTask || task.data?.chapterEndTask === '') {
            return null;
        }
        const chapter = this._getChapter(task.data.chapterEndTask);
        if (!chapter) {
            return null;
        }

        return chapter;
    }

    public async updateActiveTasks() {
        //Clear the list...
        this.ActiveTasks = [];

        //Clear the task notifications because we're about to update them again...
        this.PurgeTaskNotificiations.invoke();

        //Clear all the spawn points to avoid duplication...
        this._dinerService.clearAllSpawnPoints();

        //Find the active chapter...
        const currentChapter: Chapter = this.TaskConfig.chapters.find((chapter) => {
            return !this._requirementsService.checkRequirementsMet([
                new ChapterCompleteRequirement(RequirementType.ChapterComplete, chapter.id)
            ]);
        });

        if (currentChapter !== undefined) {
            this.CurrentChapterName = currentChapter.name;

            let totalTaskCount = currentChapter.tasks.length;

            let completedTaskCount = 0;

            for (const task of currentChapter.tasks) {
                if (this._isTaskCompleted(task)) {
                    completedTaskCount++;
                }
            }

            const nextLevel = this._cardScrambleService.getNextPuzzle();
            this._cardScrambleService.resetGameContext();
            this._cardScrambleService.addGameContext({
                chapterId: currentChapter.id,
                chapterName: currentChapter.name,
                puzzleId: nextLevel?.id ?? '',
                puzzleIndex: nextLevel?.index ?? 0
            });

            this.CurrentChapterProgress = completedTaskCount / totalTaskCount;

            //Populate the list only with Task Data that has its unlock requirements met, and hasn't been completed previously...
            for (const task of currentChapter.tasks) {
                if (!task.isValid) {
                    continue;
                }

                let costIsSatisfiable = await this._isTaskReadyForTurnIn(task);

                //Check if the task has been completed previously, if so, set its state to 'Complete'
                if (this._isTaskCompleted(task)) {
                    task.setState(TaskState.Complete);
                } else {
                    //Otherwise, check if it's unlocked...
                    if (this._requirementsService.checkRequirementsMet(task.data.unlockRequirements)) {
                        if (costIsSatisfiable) {
                            //Check if it's cost can be satisfied, if so, set its state to 'Colectable'
                            task.setState(TaskState.Collectable);
                            this.NewCollectableTaskFound?.invoke();
                        } else {
                            //Otherwise, check if it's been assigned previously, if so, set its state to 'Assigned'
                            if (this._cardScrambleService.isTaskAssigned(task.data.id)) {
                                task.setState(TaskState.Assigned);
                            } else {
                                task.setState(TaskState.Available);
                                this.NewAvailableTaskFound?.invoke();
                            }
                        }

                        if (task.data.completionSequences.length > 0) {
                            //Check if the task has spawnable items that will not be able to be spawned, if so, set its state back to 'Unavailable'
                            let currentSequenceIndex = this._cardScrambleService.getTaskCompletionCount(task.data.id);
                            for (let i = currentSequenceIndex; i < task.data.completionSequences.length; i++) {
                                for (const event of task.data.completionSequences[i].events) {
                                    switch (event.getType()) {
                                        case CompletionSequenceEventType.InteractableItems: {
                                            let data = (event as InteractableCompletionSequenceEvent).eventData;
                                            for (const spawnId of data.spawnIds) {
                                                if (this._dinerService.isSpawnPointOccupied(data.roomId, spawnId)) {
                                                    task.setState(TaskState.Unavailable);
                                                    this._log.warn(
                                                        `Could not activate task: ${task.data.id} because its intearctable item spawn point: ${spawnId} is occupied.`
                                                    );
                                                }
                                            }
                                            break;
                                        }
                                        case CompletionSequenceEventType.FocusOnItem: {
                                            let data = (event as FocusCompletionSequenceEvent).eventData;
                                            if (this._dinerService.isSpawnPointOccupied(data.roomId, data.spawnId)) {
                                                task.setState(TaskState.Unavailable);
                                                this._log.warn(
                                                    `Could not activate task: ${task.data.id} because its focus item spawn point: ${data.spawnId} is occupied.`
                                                );
                                            }
                                            break;
                                        }
                                        default:
                                            break;
                                    }
                                }
                            }
                        }
                    }
                }

                if (task.state === TaskState.Available || task.state === TaskState.Assigned || task.state === TaskState.Collectable) {
                    if (task.state === TaskState.Collectable) {
                        if (!this._cardScrambleService.isTaskAssigned(task.data.id)) {
                            const chapterStart = this._getTaskChapterStart(task);
                            const chapterEnd = this._getTaskChapterEnd(task);
                            this._cardScrambleService.onTaskUpdated(
                                task.data.id,
                                new TaskUpdatedEventData(
                                    this._cardScrambleService.getTaskCompletionCount(task.data.id),
                                    true,
                                    chapterStart?.name ?? null,
                                    chapterStart?.id ?? null,
                                    chapterEnd?.name ?? null,
                                    chapterEnd?.id ?? null,
                                    task?.data?.starCost ?? 0
                                )
                            );
                        }
                    }

                    let currentSequenceIndex = this._cardScrambleService.getTaskCompletionCount(task.data.id);

                    if (task.data.completionSequences.length > 0) {
                        for (let i = currentSequenceIndex; i < task.data.completionSequences.length; i++) {
                            for (const event of task.data.completionSequences[i].events) {
                                switch (event.getType()) {
                                    case CompletionSequenceEventType.InteractableItems: {
                                        let data = (event as InteractableCompletionSequenceEvent).eventData;
                                        for (const spawnId of data.spawnIds) {
                                            this._dinerService.spawnInteractableInSpawnPoint(data.roomId, spawnId, data.itemId);
                                        }
                                        break;
                                    }
                                    case CompletionSequenceEventType.FocusOnItem: {
                                        let data = (event as FocusCompletionSequenceEvent).eventData;
                                        this._dinerService.spawnFocusInSpawnPoint(data.roomId, data.spawnId, data.itemId);
                                        break;
                                    }
                                    default:
                                        break;
                                }
                            }
                        }
                    }

                    this.ActiveTasks.push(task);
                }
            }
        } else {
            this.CurrentChapterName = 'None';
            this.CurrentChapterProgress = 1;
        }

        this.ActiveTasksUpdatedAndVerified?.invoke();
    }

    private _onTaskListOpenedCallback() {
        for (const task of this.ActiveTasks) {
            if (task.state === TaskState.Available) {
                task.setState(TaskState.Assigned);

                const chapterStart = this._getTaskChapterStart(task);
                const chapterEnd = this._getTaskChapterEnd(task);
                this._cardScrambleService.onTaskUpdated(
                    task.data.id,
                    new TaskUpdatedEventData(
                        this._cardScrambleService.getTaskCompletionCount(task.data.id),
                        true,
                        chapterStart?.name ?? null,
                        chapterStart?.id ?? null,
                        chapterEnd?.name ?? null,
                        chapterEnd?.id ?? null,
                        task?.data?.starCost ?? 0
                    )
                );
            }
        }
    }

    private _isTaskCompleted(task: Task): boolean {
        return this._cardScrambleService.getTaskCompleted(task.data.id, task.data.completionCount);
    }

    private async _isTaskReadyForTurnIn(task: Task): Promise<boolean> {
        let amount = await this._cardScrambleService.getCurrencyBalance(Currency.Stars);
        return task.data.starCost <= amount;
    }
}
