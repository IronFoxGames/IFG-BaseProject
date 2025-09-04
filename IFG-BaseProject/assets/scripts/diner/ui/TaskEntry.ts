import { _decorator, Component, Node, Button, Label, Prefab, instantiate, Sprite, SpriteFrame, Animation, tween, Vec3 } from 'cc';
import { Task, TaskState } from '../Task';
import { ICardScrambleService } from '../../services/ICardScrambleService';
import { IDinerService } from '../../services/IDinerService';
import { GoalPipState, GoalProgressPip } from '../../game/ui/GoalProgressPip';
import { ResourceLoader } from '../../utils/ResourceLoader';
import { logger } from '../../logging';
import { UIOpacity } from 'cc';
import { Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TaskEntry')
export class TaskEntry extends Component {
    public OnActionButtonPressed: (starDestinationNode: Node) => void;

    @property({ type: Label, visible: true })
    private _nameLabel: Label;

    @property({ type: Label, visible: true })
    private _descriptionLabel: Label;

    @property({ type: Button, visible: true })
    private _actionButton: Button;

    @property({ type: Label, visible: true })
    private _progressLabel: Label;

    @property({ type: Node, visible: true })
    private _progressPipLayoutHandle: Node;

    @property({ type: Node, visible: true })
    private _progressContainer: Node;

    @property({ type: Sprite, visible: true })
    private _taskIconSprite: Sprite;

    @property({ type: Label, visible: true })
    private _costLabel: Label;

    @property({ type: Node, visible: true })
    private _costIconNode: Node;

    @property({ type: Prefab, visible: true })
    private _taskProgressPipPrefab: Prefab;

    private _tweens: any[] = [];
    private _task: Task;
    private _cardScrambleService: ICardScrambleService;
    private _dinerService: IDinerService;
    private _initialized: boolean = false;
    private _loaded: boolean = false;
    private _spriteLoaded: boolean = false;
    private _animationPlayed: boolean = false;
    private _log = logger.child('TaskEntry');
    private _animateIn: boolean = true;

    protected onLoad() {
        const opacityComponent = this.getComponent(UIOpacity);
        opacityComponent.opacity = 0;
    }

    public start() {
        this._loaded = true;

        if (this._initialized) {
            this._initialize();
        }
    }

    public isLoaded() {
        return this._loaded && this._initialized && this._spriteLoaded && this._animationPlayed;
    }

    public init(task: Task, cardScrambleService: ICardScrambleService, dinerService: IDinerService) {
        this._task = task;
        this._cardScrambleService = cardScrambleService;
        this._dinerService = dinerService;
        this._initialized = true;

        if (this._loaded) {
            this._initialize();
        }
    }

    public enableActionButton() {
        this._actionButton.interactable = true;
    }

    public disableActionButton() {
        this._actionButton.interactable = false;
    }

    private _initialize() {
        if (this._nameLabel) {
            this._nameLabel.string = this._task.data.name;
        }

        if (this._descriptionLabel) {
            this._descriptionLabel.string = this._task.data.description;
        }

        let completionCount: number = this._cardScrambleService.getTaskCompletionCount(this._task.data.id);

        if (this._task.data.completionCount <= 1) {
            this._progressContainer.active = false;
        } else {
            this._progressContainer.active = true;
        }

        if (this._progressLabel) {
            this._progressLabel.string = `${completionCount}/${this._task.data.completionCount}`;
        }

        if (this._taskIconSprite) {
            let spritePath = this._dinerService.getTaskItemSpritePath(this._task.data.iconId);

            ResourceLoader.load(spritePath, SpriteFrame).then((spriteFrame: SpriteFrame) => {
                this._taskIconSprite.spriteFrame = spriteFrame;

                // Delay the opacity change by a couple frames to allow widget to resize and minimize ugly flicker
                this.scheduleOnce(() => {
                    const opacityComponent = this.getComponent(UIOpacity);
                    opacityComponent.opacity = 255;
                    this._spriteLoaded = true;
                }, 0.02);
            });
        }

        if (this._costLabel) {
            this._costLabel.string = this._task.data.starCost.toString();
        }

        let pipCount: number = 1;

        for (const completionSequence of this._task.data.completionSequences) {
            let pipPrefab = instantiate(this._taskProgressPipPrefab);

            pipPrefab.setParent(this._progressPipLayoutHandle);

            let pip = pipPrefab.getComponent(GoalProgressPip);

            pip.setState(completionCount >= pipCount ? GoalPipState.Complete : GoalPipState.Incomplete);

            pipCount++;
        }

        this._actionButton.node.on(Button.EventType.CLICK, this._onActionButtonPressedCallback, this);
    }

    private _onActionButtonPressedCallback() {
        this.OnActionButtonPressed?.call(this, this._actionButton.node);
    }

    public animateIn() {
        //Set this node to scale 0
        //Set this node to scale 0
        this.node.setScale(0, 0, 0);
        this._actionButton.node.setScale(0, 0, 0);
        //Tween the scale to 1 over 0.3seconds
        const entrytween = tween(this.node)
            .delay(0.3)
            .to(
                0.3,
                { scale: new Vec3(1, 1, 1) },
                {
                    easing: 'bounceOut'
                }
            );
        const actionButtonTween = tween(this._actionButton.node)
            .delay(0.4)
            .to(
                0.3,
                { scale: new Vec3(1, 1, 1) },
                {
                    easing: 'bounceOut',
                    onComplete: () => {
                        this._animationPlayed = true;
                    }
                }
            );
        this._tweens.push(entrytween, actionButtonTween);
        entrytween.start();
        actionButtonTween.start();
    }

    protected onDestroy(): void {
        // Clean up all tweens
        this._tweens.forEach((tween) => {
            tween.stop();
        });
        this._tweens = [];
    }
}
