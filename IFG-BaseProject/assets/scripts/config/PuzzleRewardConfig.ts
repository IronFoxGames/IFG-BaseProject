import { Level } from './Level';

export class PuzzleRewardConfig {
    public storyWinCoinAmount: number = 25;
    public storyWinStarAmount: number = 1;
    public storyLossCoinAmount: number = 13;
    public quickPlayCompletionAmount: number = 30;

    public static fromObject(obj: any): PuzzleRewardConfig {
        let rewardConfig = new PuzzleRewardConfig();

        rewardConfig.storyWinCoinAmount = obj.storyWinCoinAmount ?? rewardConfig.storyWinCoinAmount;
        rewardConfig.storyWinStarAmount = obj.storyWinStarAmount ?? rewardConfig.storyWinStarAmount;
        rewardConfig.storyLossCoinAmount = obj.storyLossCoinAmount ?? rewardConfig.storyLossCoinAmount;
        rewardConfig.quickPlayCompletionAmount = obj.quickPlayCompletionAmount ?? rewardConfig.quickPlayCompletionAmount;

        return rewardConfig;
    }
}
