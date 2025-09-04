import { ObjectiveType } from '../enums/ObjectiveType';
import { Turn } from './Turn';
import {
    CardPlayedObjectiveParams,
    CardPlayedWithHandObjectiveParams,
    HandPlayedAnyObjectiveParams,
    HandPlayedWithScoreObjectiveParams,
    HandsPlayedObjectiveParams,
    ObjectiveParams,
    ScoreObjectiveParams,
    TilePlacedObjectiveParams,
    TurnLimitObjectiveParams
} from './ObjectiveParams';

export class GameObjective {
    public objectiveDataList: ObjectiveParams[] | null = [];

    public equals(other: GameObjective): boolean {
        if (!this.objectiveDataList || !other.objectiveDataList) {
            return false;
        }

        if (this.objectiveDataList.length !== other.objectiveDataList.length) {
            return false;
        }

        this.objectiveDataList.forEach((objective, index) => {
            if (other.objectiveDataList) {
                if (objective.objectiveType !== other.objectiveDataList[index].objectiveType) {
                    return false;
                }

                if (!objective.equals(other.objectiveDataList[index])) {
                    return false;
                }
            }
        });

        return true;
    }

    public static fromObject(obj: any): GameObjective {
        const gameObjective = new GameObjective();

        if (obj.objectiveDataList) {
            gameObjective.objectiveDataList = [];

            //Sort so that TurnLimit objectives come last always
            obj.objectiveDataList.sort((a: ObjectiveParams, b: ObjectiveParams) => {
                if (a.objectiveType === ObjectiveType.TurnLimit && b.objectiveType !== ObjectiveType.TurnLimit) {
                    return 1;
                } else if (b.objectiveType === ObjectiveType.TurnLimit && a.objectiveType !== ObjectiveType.TurnLimit) {
                    return -1;
                } else {
                    return 0;
                }
            });

            for (const data of obj.objectiveDataList) {
                //TODO: Add other objective types when they get created
                switch (data.objectiveType) {
                    case ObjectiveType.Score:
                        gameObjective.objectiveDataList?.push(ScoreObjectiveParams.fromObject(data));

                        break;

                    case ObjectiveType.HandPlayed:
                        gameObjective.objectiveDataList?.push(HandsPlayedObjectiveParams.fromObject(data));

                        break;

                    case ObjectiveType.HandPlayedAny:
                        gameObjective.objectiveDataList?.push(HandPlayedAnyObjectiveParams.fromObject(data));
                        
                        break;

                    case ObjectiveType.TurnLimit:
                        gameObjective.objectiveDataList?.push(TurnLimitObjectiveParams.fromObject(data));

                        break;

                    case ObjectiveType.CardPlayed:
                        gameObjective.objectiveDataList?.push(CardPlayedObjectiveParams.fromObject(data));

                        break;

                    case ObjectiveType.HandPlayedWithScore:
                        gameObjective.objectiveDataList?.push(HandPlayedWithScoreObjectiveParams.fromObject(data));

                        break;

                    case ObjectiveType.TilePlacement:
                        gameObjective.objectiveDataList?.push(TilePlacedObjectiveParams.fromObject(data));

                        break;

                    case ObjectiveType.CardPlayedWithHand:
                        gameObjective.objectiveDataList?.push(CardPlayedWithHandObjectiveParams.fromObject(data));

                        break;
                }
            }
        }

        return gameObjective;
    }

    public isObjectiveComplete(score: number, turns: Turn[]): boolean {
        let isComplete: boolean = true;

        if (this.objectiveDataList != null) {
            for (const data of this.objectiveDataList) {
                const completionData = data.isObjectiveComplete(score, turns);

                if (!completionData[0]) {
                    isComplete = false;
                }
            }
        }

        return isComplete;
    }

    public getString(): string {
        let objString = '';

        if (this.objectiveDataList) {
            this.objectiveDataList.forEach((data, index) => {
                objString += data.getString(index > 0);
            });
        }

        return objString;
    }

    public getTipText(): string {
        if (!this.objectiveDataList) {
            return '';
        }

        for (const data of this.objectiveDataList) {
            if (data?.tipText) {
                return data?.tipText ?? '';
            }
        }

        return '';
    }

    public getTipSprite(): string | null {
        if (!this.objectiveDataList) {
            return null;
        }

        for (const data of this.objectiveDataList) {
            if (data?.tipSprite && data?.tipSprite !== '') {
                return data.tipSprite;
            } else {
                return null;
            }
        }

        return null;
    }
}
