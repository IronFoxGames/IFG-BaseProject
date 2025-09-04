import { PuzzleRewardConfig } from '../../../config/PuzzleRewardConfig';
import { PuzzleCompleteEventData } from '../../../core/model/PuzzleCompleteEventData';

// For some things shared between Crazy / Pogo / Likely others
export class BackendUtil {
    static GetGameOverRewards(
        puzzleRewardConfig: PuzzleRewardConfig,
        puzzleIndex: number,
        puzzleCompleteData: PuzzleCompleteEventData
    ): { stars: number; coins: number; gameMode: number } {
        let gameMode = 0;
        if (puzzleIndex === -1) {
            gameMode = 1; // Quick play
        }

        // Stars earned this attempt
        const starsEarned = puzzleCompleteData.ObjectivesComplete ? puzzleRewardConfig.storyWinStarAmount : 0;
        let coinsEarned = puzzleCompleteData.ObjectivesComplete ? puzzleRewardConfig.storyWinCoinAmount : puzzleRewardConfig.storyLossCoinAmount;
        if (gameMode === 1) {
            coinsEarned = puzzleRewardConfig.quickPlayCompletionAmount;
        }

        return { stars: starsEarned, coins: coinsEarned, gameMode: gameMode };
    }
}
