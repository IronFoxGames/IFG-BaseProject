import { ObjectiveType } from '../enums/ObjectiveType';
import { MatchStatistics } from './MatchStatistics';

export enum GameOverResult {
    Win = 'Win',
    Lose = 'Lose',
    Quit = 'Quit',
    None = 'None'
}

export class PuzzleCompleteEventData {
    public Status: GameOverResult = GameOverResult.None;
    public ObjectivesComplete: boolean = false;
    public Score: number = 0;
    public Stats: MatchStatistics | null = null;
    public ObjectiveProgress: ObjectiveProgressData[] = [];

    constructor(
        status: GameOverResult = GameOverResult.None,
        objectivesComplete: boolean,
        score = 0,
        stats: MatchStatistics | null = null,
        objectiveProgress: ObjectiveProgressData[] = []
    ) {
        this.Status = status;
        this.ObjectivesComplete = objectivesComplete;
        this.Score = score;
        this.Stats = stats;
        this.ObjectiveProgress = objectiveProgress;
    }
}

export class ObjectiveProgressData {
    GoalID: number = 0;
    GoalProgression: number = 0;
    GoalCompleted: number = 0;
    ObjectiveType: ObjectiveType = ObjectiveType.Score;
}
