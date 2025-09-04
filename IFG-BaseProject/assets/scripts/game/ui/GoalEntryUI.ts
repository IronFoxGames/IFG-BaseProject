import {
    _decorator,
    Component,
    instantiate,
    Label,
    Node,
    Prefab,
    Sprite,
    Color,
    Input,
    input,
    EventTouch,
    Tween,
    tween,
    Button,
    Animation,
    AnimationState,
    SpriteFrame
} from 'cc';
import { GameObjective } from 'db://assets/scripts/core/model/GameObjective';
import { ObjectiveType } from 'db://assets/scripts/core/enums/ObjectiveType';
import { GoalPipState, GoalProgressPip } from './GoalProgressPip';
import { GoalProgressBar } from './GoalProgressBar';
import { SoundManager } from '../../audio/SoundManager';
import { logger } from '../../logging';
import { ResourceLoader } from '../../utils/ResourceLoader';
import { CardVisual } from '../CardVisual';
import { CardPlayedObjectiveParams } from '../../core/model/ObjectiveParams';
import { Card } from '../../core';
import { CardType } from '../../core/model/Card';
import { RichText } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('GoalEntryUI')
export class GoalEntryUI extends Component {
    @property(Sprite)
    goalSprite: Sprite | null = null;

    @property(Sprite)
    lockSprite: Sprite | null = null;

    @property(RichText)
    goalString: RichText | null = null;

    @property(Prefab)
    progressPipPrefab: Prefab | null = null;

    @property(Prefab)
    progressBarPrefab: Prefab | null = null;

    @property(Node)
    progressBarParent: Node | null = null;

    @property(Color)
    progressBarIncompleteColor: Color | null = null;

    @property(Color)
    progressBarCompleteColor: Color | null = null;

    @property(Label)
    progressCounterLabel: Label | null = null;

    @property(Button)
    helpButton: Button | null = null;

    @property(Node)
    goalTooltip: Node | null = null;

    @property(Label)
    tooltipText: Label | null = null;

    @property(Sprite)
    tooltipSprite: Sprite | null = null;

    @property(Node)
    tooltipSubText: Node | null = null;

    @property(CardVisual)
    tooltipCardVisual: CardVisual | null = null;

    private isUnlocked: boolean = false;
    private isComplete: boolean = false;
    private currentGoal: GameObjective;
    private progressBars: (GoalProgressPip | GoalProgressBar)[] = [];
    private _tooltipAnim: Animation;
    private _goalEntryAnimator: Animation;
    private _previousPlayedAnimClip: string = '';

    // Tween the percentage tally
    private _percentageTallyTween: Tween<{ value: number }> | null = null;
    private _lastPercentageComplete = 0;
    private _log = logger.child('GoalEntryUI');

    protected onLoad(): void {
        this.helpButton.node.on(Button.EventType.CLICK, this._toggleTooltip, this);

        this._goalEntryAnimator = this.getComponent(Animation);

        this._tooltipAnim = this.goalTooltip.getComponent(Animation);

        this._tooltipAnim.on(Animation.EventType.FINISHED, this._onAnimCompleted, this);
    }

    protected start(): void {
        input.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
    }

    public onDestroy() {
        if (this._percentageTallyTween) {
            this._percentageTallyTween.stop();
            this._percentageTallyTween = null;
        }
    }

    public InitEntry(isUnlocked: boolean, goal: GameObjective): void {
        this.goalString.string = goal.getString();
        this.currentGoal = goal;

        if (isUnlocked && !this.isUnlocked) {
            this.UnlockGoal();
        }

        this.createProgressBars();
        const emptyProgressArray: number[] = [this.currentGoal.objectiveDataList.length];
        emptyProgressArray.forEach((progress, index) => {
            emptyProgressArray[index] = 0;
        });
        this.UpdateProgress(this.currentGoal, emptyProgressArray, emptyProgressArray);

        this._goalEntryAnimator.play('goal-idle');
        this._previousPlayedAnimClip = 'goal-idle';

        this.tooltipText.string = goal.getTipText();
        var spritePath = goal.getTipSprite();

        if (!spritePath || spritePath === '') {
            this.tooltipSprite.node.active = false;
        } else {
            ResourceLoader.load(spritePath, SpriteFrame).then((spriteFrame: SpriteFrame) => {
                if (!spriteFrame) {
                    this._log.error(`Failed to load sprite for tooltip: ${spritePath}`);
                    return;
                }

                this.tooltipSprite.spriteFrame = spriteFrame;
                this.tooltipSprite.node.active = true;
            });
        }

        let obj = goal.objectiveDataList.find((g) => g.objectiveType === ObjectiveType.CardPlayed);

        if (obj) {
            let cardPlayedObjective = obj as CardPlayedObjectiveParams;
            this.tooltipCardVisual.node.active = true;
            this.tooltipCardVisual.setToCard(new Card(cardPlayedObjective.rank, cardPlayedObjective.suit, CardType.Regular));
        }

        //Subtext should only be active for handplayed objectives
        obj = goal.objectiveDataList.find(
            (g) => g.objectiveType === ObjectiveType.HandPlayed || g.objectiveType === ObjectiveType.HandPlayedWithScore
        );

        if (!obj) {
            this.tooltipSubText.active = false;
        }
    }

    public UpdateQuickPlayProgress(currentScore: number, highscore: number) {
        const progress = currentScore / highscore;
        const progressPercentage = Math.floor(progress * 100);

        const progressBar = this.progressBarParent.getComponentInChildren(GoalProgressBar);

        if (progress >= 1) {
            progressBar.setPercentage(1);
            this.progressCounterLabel.string = `100%`;
            this.CompleteGoal();
            return;
        }

        progressBar.setPercentage(progress);
        this.progressCounterLabel.string = `${progressPercentage}%`;
    }

    public UpdateProgress(goal: GameObjective, objectiveProgress: number[], objectivePipsComplete: number[]) {
        let pipsCompleted = 0;
        let pipIndex = 0;
        let percentageCompleted = 0;
        let isPercentageGoal = false;
        let isGoalComplete = true;

        goal.objectiveDataList.forEach((data, index) => {
            if (data.objectiveType === ObjectiveType.TurnLimit) {
                return;
            }

            const progress = objectiveProgress[index];
            const numPipsAchievedForObjective = objectivePipsComplete[index];
            const numPipsForGoal = data.getPipCount();

            for (let i = 0; i < numPipsForGoal; ++i) {
                const goalProgress = this.progressBars[pipIndex + i];
                if (goalProgress instanceof GoalProgressPip) {
                    if (numPipsAchievedForObjective > i) {
                        goalProgress.setState(GoalPipState.Complete);
                    } else {
                        isGoalComplete = false; // If any pip is incomplete, the goal is not complete
                    }
                } else if (goalProgress instanceof GoalProgressBar) {
                    isPercentageGoal = true;
                    percentageCompleted = progress;
                    goalProgress.setPercentage(progress);

                    if (progress < 1) {
                        isGoalComplete = false; // If the percentage is less than 100%, the goal is not complete
                    }
                }
            }

            pipsCompleted += numPipsAchievedForObjective;
            pipIndex += numPipsForGoal;
        });

        if (this.progressCounterLabel) {
            if (isPercentageGoal) {
                const percentageComplete = Math.floor(percentageCompleted * 100);
                const percentageObject = { value: this._lastPercentageComplete };
                if (this._percentageTallyTween) {
                    this._percentageTallyTween.stop();
                }
                this._percentageTallyTween = tween(percentageObject)
                    .to(
                        0.3,
                        { value: percentageComplete },
                        {
                            easing: 'quadOut',
                            onUpdate: (target: { value: number }) => {
                                this._lastPercentageComplete = Math.floor(target.value);
                                this.progressCounterLabel.string = `${this._lastPercentageComplete}%`;
                            }
                        }
                    )
                    .call(() => {
                        this._lastPercentageComplete = percentageComplete;
                        this.progressCounterLabel.string = `${this._lastPercentageComplete}%`;
                    })
                    .start();
            } else {
                this.progressCounterLabel.string = `${Math.min(pipsCompleted, pipIndex)}/${pipIndex}`;
            }
        }

        if (isGoalComplete && !this.isComplete) {
            this.CompleteGoal();
        } else if (this._lastPercentageComplete > 99) {
            this._lastPercentageComplete = 99;
            this.progressCounterLabel.string = `${this._lastPercentageComplete}%`;
        }
    }

    public CompleteGoal() {
        if (!this.isComplete) {
            this.isComplete = true;
            this._goalEntryAnimator.play('goal-completed');
            this._previousPlayedAnimClip = 'goal-completed';
            SoundManager.instance.playSound('SFX_Gameplay_ObjectiveComplete');
        }
    }

    public SetGoalHighlighted(isHighlighted: boolean) {
        if (this.isComplete) {
            return;
        }

        const highlightedState = this._goalEntryAnimator.getState('goal-active');

        if (isHighlighted) {
            highlightedState.time = 0;
            highlightedState.speed = 1;

            this._goalEntryAnimator.play('goal-active');
            this._previousPlayedAnimClip = 'goal-active';
        } else {
            if (this._previousPlayedAnimClip === 'goal-active') {
                highlightedState.time = highlightedState.duration;
                highlightedState.speed = -1;
                this._goalEntryAnimator.play('goal-active');
                //setting to idle here instead of active as this is going back to idle due to reversed anim
                this._previousPlayedAnimClip = 'goal-idle';
            } else {
                this._goalEntryAnimator.play('goal-idle');
                this._previousPlayedAnimClip = 'goal-idle';
            }
        }
    }

    public UnlockGoal() {
        this.isUnlocked = true;
        this.lockSprite.enabled = false;
    }

    private createProgressBars() {
        this.progressBarParent.destroyAllChildren();

        let isPercentageGoal = false;
        let numPips = 0;
        this.currentGoal.objectiveDataList.forEach((obj) => {
            if (obj.objectiveType === ObjectiveType.TurnLimit) {
                return;
            }

            const pipCount = obj.getPipCount();

            for (let i = 0; i < pipCount; ++i) {
                if (obj.objectiveType === ObjectiveType.Score || obj.objectiveType === ObjectiveType.HandPlayedWithScore) {
                    isPercentageGoal = true;
                    const progressBarNode = instantiate(this.progressBarPrefab);
                    this.progressBarParent.addChild(progressBarNode);

                    const goalProgressBar = progressBarNode.getComponent(GoalProgressBar);
                    this.progressBars.push(goalProgressBar);
                } else {
                    const progressBarNode = instantiate(this.progressPipPrefab);
                    this.progressBarParent.addChild(progressBarNode);

                    const goalProgressPip = progressBarNode.getComponent(GoalProgressPip);
                    this.progressBars.push(goalProgressPip);
                }
            }

            numPips += pipCount;
        });

        if (this.progressCounterLabel) {
            if (isPercentageGoal) {
                this._lastPercentageComplete = 0;
                this.progressCounterLabel.string = `0%}`;
            } else {
                this.progressCounterLabel.string = `0/${numPips}`;
            }
        }
    }

    private _toggleTooltip() {
        const clips = this._tooltipAnim.clips;

        if (!this.goalTooltip.active || this._getActiveAnimationClip() === clips[2].name) {
            this._openTooltip();
        } else if (this.goalTooltip.active) {
            this.closeTooltip();
        }
    }

    private _openTooltip() {
        this.goalTooltip.active = true;
        const clips = this._tooltipAnim.clips;

        if (clips.length <= 0) {
            return; //If the clips list has no clips, there's nothing to play...
        }

        const stateName = clips[1].name;
        const state = this._tooltipAnim.getState(stateName);

        if (state && state.isPlaying) {
            return; //If the animation is playing already, don't play it...
        }

        if (clips.length > 0) {
            this._tooltipAnim.play(stateName);
        }
    }

    public closeTooltip() {
        if (!this.goalTooltip.active) {
            return; //This first checck is redundant in the context of this class, but necessary for outside callers.
        }

        const clips = this._tooltipAnim.clips;

        if (clips.length <= 0) {
            return; //If the clips list has no clips, there's nothing to play...
        }

        const stateName = clips[2].name;
        const state = this._tooltipAnim.getState(stateName);

        if (state && state.isPlaying) {
            return; //If the animation is playing already, don't play it...
        }

        this._tooltipAnim.play(stateName);
    }

    private _getActiveAnimationClip(): string | null {
        for (const clip of this._tooltipAnim.clips) {
            const state = this._tooltipAnim.getState(clip.name);
            if (state && state.isPlaying) {
                return clip.name;
            }
        }

        return null;
    }

    private _onAnimCompleted(type: Animation.EventType, state: AnimationState) {
        const clips = this._tooltipAnim.clips;

        if (state.name === clips[2].name) {
            this.goalTooltip.active = false;
        }
    }

    private _onTouchStart(event: EventTouch) {
        if (this.goalTooltip.active) {
            this.closeTooltip();
        }
    }
}
