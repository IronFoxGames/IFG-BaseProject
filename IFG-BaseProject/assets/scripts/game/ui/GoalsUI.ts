import { _decorator, Component, Node, Button } from 'cc';
import { GoalEntryUI } from 'db://assets/scripts/game/ui/GoalEntryUI';
import { GameObjective } from 'db://assets/scripts/core/model/GameObjective';
import { Label } from 'cc';
import { ProgressBar } from 'cc';
import { Layout } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GoalsUI')
export class GoalsUI extends Component {
    @property({ type: [GoalEntryUI] })
    goalEntries: GoalEntryUI[] = [];

    @property(GoalEntryUI)
    quickPlayEntry: GoalEntryUI | null = null;

    @property(Label)
    quickPlayEntryLabel: Label | null = null;

    @property(Label)
    goalsHeaderLabel: Label | null = null;

    private _quickPlayHighScore: number = 0;

    public InitGoals(goals: GameObjective[], previousHighScore: number) {
        this._quickPlayHighScore = previousHighScore;
        this.quickPlayEntry.node.active = false;

        if (goals.length === 0) {
            this._initQuickPlayGoals(previousHighScore);

            return;
        }

        if (goals.length < 3) {
            this.goalEntries[2].node.active = false;
        }
        if (goals.length < 2) {
            this.goalEntries[1].node.active = false;
        }

        goals.forEach((goal, index) => {
            let isUnlocked: boolean = index === 0;

            this.goalEntries[index].InitEntry(isUnlocked, goal);

            this.goalEntries[index].helpButton.node.on(
                Button.EventType.CLICK,
                () => {
                    for (const entry of this.goalEntries) {
                        if (entry !== this.goalEntries[index]) {
                            entry?.closeTooltip();
                        }
                    }
                },
                this
            );
        });
    }

    private _initQuickPlayGoals(previousHighScore: number) {
        this.goalEntries.forEach((entry) => {
            entry.node.active = false;
        });

        this.quickPlayEntry.node.active = true;
        this.quickPlayEntryLabel.string = `Previous Best: ${previousHighScore}`;

        this.quickPlayEntry.node.parent.getComponent(Layout).updateLayout();
        this.getComponent(Layout).updateLayout();

        this.goalsHeaderLabel.string = 'High Score';
    }

    public UpdateGoals(goals: GameObjective[], objectivesProgress: number[][], objectivesPipsComplete: number[][]) {
        goals.forEach((goal, index) => {
            this.goalEntries[index].UpdateProgress(goal, objectivesProgress[index], objectivesPipsComplete[index]);
        });
    }

    public UpdateQuickPlayGoal(currentScore: number) {
        this.quickPlayEntry.UpdateQuickPlayProgress(currentScore, this._quickPlayHighScore);
    }

    public CloseAllTootips() {
        for (const entry of this.goalEntries) {
            entry.closeTooltip();
        }
    }
}
