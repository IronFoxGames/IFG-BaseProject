import { Value } from '@sinclair/typebox/value';
import { check } from '../core/check';
import { HandNameAndTier } from '../core/enums/HandName';
import { AppConfig as AppConfigData } from '../core/types/runtime/definitions';
import { logger } from '../logging';
import { DailyPrizeConfig } from './DailyPrizeConfig';
import { GameOverScreenData } from './GameOverScreenData';
import { HintsConfig } from './HintsConfig';
import { HUDConfig } from './HUDConfig';
import { ItemConfig } from './ItemConfig';
import { LevelConfig } from './LevelConfig';
import { PuzzleRewardConfig } from './PuzzleRewardConfig';
import { StoreConfig } from './StoreConfig';
import { TaskConfig } from './TaskConfig';

export class AppConfig {
    public pogoSDKConfig: unknown;
    public crazySDKConfig: unknown;
    public minLoadingScreenTimeMS: number = 1000;
    public loadingScreenTips: string[] = [];
    public gameOverScreenData: GameOverScreenData;
    public darcyDailyRewardPhrases: string[] = [];
    public cheats: boolean = false;
    public env: string = 'local';
    public buildNumber: number = 0;
    public timestamp: string = '';
    public branch: string = '';
    public commit: string = '';
    public skipDiner: boolean = false;
    public storeConfig: StoreConfig = null;
    public itemConfig: ItemConfig = null;
    public taskConfig: TaskConfig = null;
    public levelConfig: LevelConfig = null;
    public quickPlayConfigPath: string = null;
    public hudConfig: HUDConfig = null;
    public initialRoomUnlocks: string[] = [];
    public introDialogue: string = '';
    public handTierList: HandNameAndTier[] = [];
    public puzzleRewardConfig: PuzzleRewardConfig = null;
    public maximumHandSize: number = 10;
    public guestLimitLevelId: string = 'Tutorial_HandsFlush';
    public guestLimitMessage: string =
        "Enjoying Card Scramble: Viola's Diner?.\n\nRegister Free or Sign In to a POGO account to play the full story now!";
    public endOfStoryMessage: string =
        "You've completed all the story puzzles for now, but don't worry, more are coming soon!\n In the meantime, play Quick Play to beat your high score and complete Pogo challenges!";
    public migrateGuestSaveData: boolean = false;
    public burningFoodScoreLossAmount: number = 1500;
    public dailyPrizeConfig: DailyPrizeConfig = null;
    public hintsConfig: HintsConfig = null;

    public static async fromObject(obj: unknown): Promise<AppConfig> {
        let appConfig = new AppConfig();
        if (!check(AppConfigData, obj)) {
            const log = logger.child('AppConfig');
            log.error(`${JSON.stringify([...Value.Errors(AppConfigData, obj)])}`);
            return appConfig;
        }

        try {
            appConfig.pogoSDKConfig = { ...obj.pogoSDK };
            appConfig.crazySDKConfig = { ...obj.crazyGamesSDK };
            appConfig.minLoadingScreenTimeMS = obj.minLoadingScreenTimeMS || 1000;
            appConfig.loadingScreenTips = obj.loadingScreenTips || [];
            appConfig.gameOverScreenData = GameOverScreenData.fromObject(obj.gameOverScreenData);
            appConfig.darcyDailyRewardPhrases = obj.darcyDailyRewardPhrases || [];
            appConfig.cheats = typeof obj.cheats === 'boolean' ? obj.cheats : obj.cheats === 'true';
            appConfig.env = obj.env || 'local';
            appConfig.buildNumber = obj.buildNumber || 0;
            appConfig.timestamp = obj.timestamp || '';
            appConfig.branch = obj.branch || '';
            appConfig.commit = obj.commit || '';
            appConfig.skipDiner = obj.skipDiner || false;
            appConfig.storeConfig = await StoreConfig.fromObject(obj.store);
            appConfig.itemConfig = await ItemConfig.fromObject(obj.items);
            appConfig.taskConfig = await TaskConfig.fromObject(obj.tasks);
            appConfig.levelConfig = await LevelConfig.fromObject(obj.levels);
            appConfig.quickPlayConfigPath = obj.quickPlayConfigPath || '';
            appConfig.initialRoomUnlocks = obj.initialRoomUnlocks || [];
            appConfig.introDialogue = obj.introDialogue || '';
            appConfig.handTierList = obj.handTierList || [];
            appConfig.puzzleRewardConfig = PuzzleRewardConfig.fromObject(obj.puzzleRewards);
            appConfig.hudConfig = HUDConfig.fromObject(obj.hudConfig);
            appConfig.maximumHandSize = obj.maximumHandSize || 10;
            appConfig.guestLimitLevelId = obj.guestLimitLevelId || 'Tutorial_HandsFlush';
            appConfig.guestLimitMessage = obj.guestLimitMessage ?? appConfig.guestLimitMessage;
            appConfig.endOfStoryMessage = obj.endOfStoryMessage ?? appConfig.endOfStoryMessage;
            appConfig.migrateGuestSaveData = obj.migrateGuestSaveData || false;
            appConfig.burningFoodScoreLossAmount = obj.burningFoodScoreLossAmount || 1500;
            appConfig.dailyPrizeConfig = await DailyPrizeConfig.fromObject(obj.dailyPrizeConfig);
            appConfig.hintsConfig = HintsConfig.fromObject(obj.hintsConfig);
        } catch (error) {
            const log = logger.child('AppConfig');
            log.error('Error parsing app config with error: ', { error: error });
        }

        return appConfig;
    }
}
