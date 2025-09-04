import { _decorator, Component, Node, Label, Button, ProgressBar, Prefab, instantiate, UITransform, CCString } from 'cc';
import { TaskEntry } from '../diner/ui/TaskEntry';
import { Task } from '../diner/Task';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { IDinerService } from '../services/IDinerService';
import { TutorialService } from '../services/TutorialService';
import { DinerSceneController } from '../diner/DinerSceneController';

const { ccclass, property } = _decorator;

@ccclass('TaskAppScreen')
export class TaskAppScreen extends Component {
    public OnCloseButtonPressed: () => void;
    public OnTaskEntryActionButtonPressed: (task: Task, starDestinationNode: Node) => void;

    @property({ type: Label, visible: true })
    private _chapterTitleLabel: Label;

    @property({ type: Label, visible: true })
    private _chapterProgressLabel: Label;

    @property({ type: ProgressBar, visible: true })
    private _chapterProgressBar: ProgressBar;

    @property({ type: Button, visible: true })
    private _closeButton: Button;

    @property({ type: Node, visible: true })
    private _taskEntryHandle: Node;

    @property({ type: Prefab, visible: true })
    private _taskEntryPrefab: Prefab;

    @property({ type: CCString, visible: true })
    protected _menuId: string = '';

    @property({ type: Node, visible: true })
    private _noTasksNotification: Node;

    private _currentEntries: TaskEntry[] = [];

    private _cardScrambleService: ICardScrambleService = null;

    private _dinerService: IDinerService = null;

    private _tutorialService: TutorialService = null;

    private _dinerSceneController: DinerSceneController = null;

    private _waitingToShow = false;

    private _newTask: boolean = false;

    public init(cardScrambleService: ICardScrambleService, dinerService: IDinerService, tutorialService: TutorialService, newTask: boolean) {
        this._cardScrambleService = cardScrambleService;

        this._dinerService = dinerService;

        this._tutorialService = tutorialService;

        this._newTask = newTask;

        this._closeButton.node.on(Button.EventType.CLICK, this._onCloseButtonPressedCallback, this);
    }

    public show() {
        this._waitingToShow = true;
    }

    public update() {
        if (!this._waitingToShow) {
            return;
        }

        const allLoaded = this._currentEntries.every((entry) => entry.isLoaded());
        if (allLoaded) {
            if (this._menuId && this._menuId !== '') {
                this._tutorialService.onMenuOpened(this._menuId);
            }
            this._waitingToShow = false;
        }
    }

    public setChapterInfo(chapterTitle: string, chapterProgress: number) {
        this._chapterTitleLabel.string = chapterTitle;
        let chapterProgressAsPercentage = (100 * chapterProgress).toFixed(2);
        this._chapterProgressLabel.string = `${chapterProgressAsPercentage}%`;
        this._chapterProgressBar.totalLength = this._chapterProgressBar.getComponent(UITransform).width;
        this._chapterProgressBar.progress = chapterProgress;
    }

    public createNewTaskEntry(task: Task) {
        let entryPrefab = instantiate(this._taskEntryPrefab);

        let entry = entryPrefab.getComponent(TaskEntry);

        entry.init(task, this._cardScrambleService, this._dinerService);

        entry.OnActionButtonPressed = (starDestinationNode: Node) => {
            this.OnTaskEntryActionButtonPressed(task, starDestinationNode);
        };

        entryPrefab.setParent(this._taskEntryHandle);

        this._currentEntries.push(entry);

        if (this._newTask) {
            entry.node.active = false;
        }
    }

    public animateTasksIn() {
        for (const entry of this._currentEntries) {
            entry.animateIn();
            entry.node.active = true;
        }
    }

    public enableAllEntriesAndCloseButton() {
        for (const entry of this._currentEntries) {
            entry.enableActionButton();
        }

        this._closeButton.interactable = true;
    }

    public disableAllEntriesAndCloseButton() {
        for (const entry of this._currentEntries) {
            entry.disableActionButton();
        }

        this._closeButton.interactable = false;
    }

    public showNoTasksNotification(active: boolean) {
        this._noTasksNotification.active = active;
    }

    public clearAllTaskEntries() {
        //Make this clear the list of task entries so that there's no leftover data between opening and closing the menu
        if (this._taskEntryHandle) {
            this._taskEntryHandle.destroyAllChildren();
        }
        this._currentEntries = [];
    }

    private _onCloseButtonPressedCallback() {
        if (this.OnCloseButtonPressed) {
            this.OnCloseButtonPressed();
        }
        this._waitingToShow = false;
        this.clearAllTaskEntries();
    }
}
