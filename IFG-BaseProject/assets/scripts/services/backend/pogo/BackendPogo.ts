import { sys } from 'cc';
import { IConfig, IStats } from '../../../../thirdParty/pogoSDK/pogoSDK';
import { AppConfig } from '../../../config/AppConfig';
import { BoosterType, PowerupType } from '../../../core/enums/BoosterType';
import { Currency } from '../../../core/enums/Currency';
import { EntitlementType } from '../../../core/enums/EntitlementType';
import { getEnumIndex, ObjectiveType } from '../../../core/enums/ObjectiveType';
import { PurchaseResult, PurchaseStatus } from '../../../core/enums/PurchaseResult';
import { UpsellOrigin } from '../../../core/enums/UpsellOrigin';
import { CatalogItem } from '../../../core/model/CatalogItem';
import { CurrencyAndAmount } from '../../../core/model/CurrencyAndAmount';
import { ItemAndAmount } from '../../../core/model/ItemAndAmount';
import { ItemInfo } from '../../../core/model/ItemInfo';
import { PropSwappedEventData } from '../../../core/model/PropSwappedEventData';
import { GameOverResult, PuzzleCompleteEventData } from '../../../core/model/PuzzleCompleteEventData';
import { TaskUpdatedEventData } from '../../../core/model/TaskCompleteEventData';
import { Utils } from '../../../core/Utils';
import { logger } from '../../../logging';
import { Context } from '../../Context';
import { DailyPrizeRewardState, DailyReward, DailyRewardBox } from '../../DailyPrizeRewardState';
import { EventData } from '../../EventData';
import { IBackend } from '../../IBackend';
import { IDebugService } from '../../IDebugService';
import { StoreType } from '../../IStore';
import { ResourceChangeContext } from '../../ResourceChangeContext';
import { SaveData } from '../../SaveData';
import { BackendUtil } from '../common/BackendUtil';
import { UnexpectedStoreErrorMessage } from '../common/constants';
import { PogoSDKConfig } from './PogoSDKConfig';
import { PogoUtils } from './PogoUtils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PogoSDK = (window as any).PogoSDK;

interface RewardItem {
    count: number;
    day: number;
    rewardIndex: number;
    itemId: string;
}
interface RewardEntry {
    item: ItemInfo;
    count: number;
}

class PogoDailyReward {
    count: string;
    day: string;
    itemId: string;
    rewardIndex: string;
}

class PogoSettings {
    energyCap: number = 8; // defaults; gets overwritten as soon as we load from Pogo
    energyAutoIncomeInterval: number = 1200; // defaults; gets overwritten as soon as we load from Pogo
}

class PogoCatalogItem {
    description: string;
    currency: string;
    itemType: string;
    price: string;
    suggestedPrice: string;
    amount: string;
    itemId: string;
    productId: string;
    entitlement: string;
    tags: string[];
    itemDescription: string;
    bonusAmount: string;
    saleTag: string;
    saleEndsIn: number;
    subItems: PogoCatalogItem[];
}

class PogoInventory {
    private _energy: number;
    private _jokerCount: number;
    private _deucesWildCount: number;
    private _extraServingsCount: number;
    private _freeDessertCount: number;
    private _refireCount: number;
    private _loosenTheBeltCount: number;
    private _plusSevenCardsCount: number;
    private _cookingTheBooksCount: number;
    private _cleanDownCount: number;

    // powerup_joker: number;
    private _claimPrize: number;

    // number of daily prize purchases
    private _dailyPrizePurchases: number;

    public get energy() {
        return this._energy;
    }

    public set energy(value: number) {
        this._energy = value;
    }

    public get jokerCount() {
        return this._jokerCount;
    }

    public set jokerCount(value: number) {
        this._jokerCount = value;
    }

    public get deucesWildCount() {
        return this._deucesWildCount;
    }

    public set deucesWildCount(value: number) {
        this._deucesWildCount = value;
    }

    public get loosenTheBeltCount() {
        return this._loosenTheBeltCount;
    }

    public set loosenTheBeltCount(value: number) {
        this._loosenTheBeltCount = value;
    }

    public get refireCount() {
        return this._refireCount;
    }

    public set refireCount(value: number) {
        this._refireCount = value;
    }

    public get extraServingsCount() {
        return this._extraServingsCount;
    }

    public set extraServingsCount(value: number) {
        this._extraServingsCount = value;
    }

    public get freeDessertCount() {
        return this._freeDessertCount;
    }

    public set freeDessertCount(value: number) {
        this._freeDessertCount = value;
    }

    public get plusSevenCards() {
        return this._plusSevenCardsCount;
    }

    public set plusSevenCards(value: number) {
        this._plusSevenCardsCount = value;
    }

    public get cookingTheBooksCount() {
        return this._cookingTheBooksCount;
    }

    public set cookingTheBooksCount(value: number) {
        this._cookingTheBooksCount = value;
    }

    public get cleanDownCount() {
        return this._cleanDownCount;
    }

    public set cleanDownCount(value: number) {
        this._cleanDownCount = value;
    }

    public get claimPrizeCount() {
        return this._claimPrize;
    }

    public set claimPrizeCount(value: number) {
        this._claimPrize = value;
    }

    public get dailyPrizePurchase() {
        return this._dailyPrizePurchases;
    }

    public set dailyPrizePurchase(value: number) {
        this._dailyPrizePurchases = value;
    }

    public fromJson(obj: any) {
        this._energy = obj?.inventory?.powerup_energy || 0;
        this._jokerCount = obj?.inventory?.powerup_joker || 0;
        this._deucesWildCount = obj?.inventory?.powerup_deuces_wild || 0;
        this._extraServingsCount = obj?.inventory?.powerup_extra_servings || 0;
        this._refireCount = obj?.inventory?.powerup_re_fire || 0;
        this._loosenTheBeltCount = obj?.inventory?.powerup_loosen_your_belt || 0;
        this._freeDessertCount = obj?.inventory?.powerup_free_dessert || 0;
        this._plusSevenCardsCount = obj?.inventory?.powerup_plus7_cards || 0;
        this._cookingTheBooksCount = obj?.inventory?.powerup_cooking_the_books || 0;
        this._cleanDownCount = obj?.inventory?.powerup_clean_down || 0;
        this._claimPrize = obj?.inventory?.powerup_claim_prize || 0;
        this._dailyPrizePurchases = obj?.inventory?.powerup_dailyprize || 0;
    }
}

export class BackendPogo implements IBackend {
    private static writeSaveSlotKey: string = 'save.slot.1';

    private pogoSDK: any;
    private _saveData: SaveData = new SaveData();

    public static STAT_lastAutoEnergyTimestamp = 'lastAutoEnergyTimestamp';
    public static STAT_powerup_energy = 'powerup_energy';
    public static STAT_powerup_joker = 'powerup_joker';
    public static STAT_powerup_deuces_wild = 'powerup_deuces_wild';
    public static STAT_powerup_extra_servings = 'powerup_extra_servings';
    public static STAT_powerup_refire = 'powerup_re_fire';
    public static STAT_powerup_loosen_the_belt = 'powerup_loosen_your_belt';
    public static STAT_powerup_free_dessert = 'powerup_free_dessert';
    public static STAT_powerup_plus7_cards = 'powerup_plus7_cards';
    public static STAT_powerup_cooking_the_books = 'powerup_cooking_the_books';
    public static STAT_powerup_clean_down = 'powerup_clean_down';
    public static STAT_powerup_claim_prize = 'powerup_claim_prize';

    public static STAT_coins = 'coins';

    public static CURRENCY_coins = 'CARD_SCRAMBLE_COINS';

    public static ENTITLEMENT_GUEST: string = 'GUEST';
    public static ENTITLEMENT_FREE: string = 'FREE';
    public static ENTITLEMENT_CLUB: string = 'CLUB';

    public onDailyPrizeStateChanged: () => void;
    public onCurrencyChanged: () => void;
    public onBackendSettingChanged: (setting: string, value: string) => void;

    private _initialized = false;
    private _pogoSettings: PogoSettings = new PogoSettings();
    private _inventory: PogoInventory = new PogoInventory();

    private _lastAutoEnergyTimestamp: number = 0;
    private _timeUntilEnergyEarned: number = 0;
    private _claimingEnergy: boolean = false;

    private _updatingDailyMysteryPrize: boolean = false;

    // Intermediate state
    private _seed: string;

    private _config: AppConfig;
    private _pogoConfig: PogoSDKConfig;

    private _canLeaveGame: () => Promise<boolean>;

    private _log = logger.child('BackendPogo');

    private static readonly PRIZE_AVAILABLE = 1;
    private static readonly PRIZE_CLAIMED = 2;
    private static readonly PRIZE_UNCLAIMED = 11;

    private _gameContext: Partial<Context> = {};

    public async initialize(config: AppConfig, canLeaveGame: () => Promise<boolean>): Promise<void> {
        this._config = config;
        this._pogoConfig = PogoSDKConfig.fromObject(this._config.pogoSDKConfig);

        if (!this._pogoConfig.enabled) {
            return;
        }

        this._canLeaveGame = canLeaveGame;

        try {
            await this._initializePogoSDK(this._pogoConfig);
            this._loadConfig();
            await this._load();
            await this._updateFromServerStats();
        } catch (error) {
            this._log.error('Failed to initialize: ', error);
        }

        // Save initial room unlocks
        this._config.initialRoomUnlocks.forEach((roomName) => {
            this.unlockRoom(roomName);
        });
    }

    public update(dt: number) {
        if (!this._initialized) {
            return;
        }

        // Don't run timers for guests
        if (this.pogoSDK.getProfile().entitlement === BackendPogo.ENTITLEMENT_GUEST) {
            return;
        }

        const serverTimeStamp = this.pogoSDK.getServerTime().getTime();
        const nextEnergyTime = this._lastAutoEnergyTimestamp + this._pogoSettings.energyAutoIncomeInterval * 1000;
        this._timeUntilEnergyEarned = nextEnergyTime - serverTimeStamp;

        // Energy timer: check if we can claim energy
        if (this._timeUntilEnergyEarned < 0 && this._inventory.energy < this._pogoSettings.energyCap && !this._claimingEnergy) {
            this._claimingEnergy = true;
            this._syncStats({}, { event: 'energy-auto-income' }).then(async () => {
                await this._updateFromServerStats();
                this._claimingEnergy = false;
            });
        }

        if (this.timeUntilDailyReset() <= 0 && !this._updatingDailyMysteryPrize) {
            this._updatingDailyMysteryPrize = true;
            this._syncStats({}, { event: 'update-daily-mystery-prize-data' }).then(async () => {
                if (this.onDailyPrizeStateChanged) {
                    this.onDailyPrizeStateChanged();
                }
                this._updatingDailyMysteryPrize = false;
            });
        }
    }

    getSaveData(): SaveData {
        return this._saveData;
    }

    public async saveSaveData(): Promise<boolean> {
        return this._save();
    }

    public getUserEntitlement(): EntitlementType {
        const entitlementLevel = this.pogoSDK.getProfile().entitlement;

        switch (entitlementLevel) {
            case BackendPogo.ENTITLEMENT_GUEST: {
                return EntitlementType.Guest;
            }
            case BackendPogo.ENTITLEMENT_FREE: {
                return EntitlementType.Free;
            }
            case BackendPogo.ENTITLEMENT_CLUB: {
                return EntitlementType.Premium;
            }
            default: {
                this._log.error(`Unsupported Pogo Entitlement level: ${entitlementLevel} Defaulting to Guest...`);
                return EntitlementType.Guest;
            }
        }
    }

    public openPlatformSignIn() {
        this.pogoSDK.redirectTo('signIn', '');
    }

    public openPlatformRegistration(origin: UpsellOrigin) {
        const gameCode = this._pogoConfig.gameCode;
        let campaignString = '';
        switch (origin) {
            case UpsellOrigin.ContentLock:
                campaignString = `u_regupsell_${gameCode}_contentlock`;
                break;
            case UpsellOrigin.Banner:
                campaignString = `u_regupsell_${gameCode}_banner`;
                break;
            case UpsellOrigin.None:
            case UpsellOrigin.Cosmetics:
            case UpsellOrigin.MysteryPrize:
            case UpsellOrigin.EnergyPurchase:
            case UpsellOrigin.CoinPurchase:
                // Gated for guest users
                break;
        }

        this.pogoSDK.redirectTo('register', campaignString);
    }

    public openPlatformPremiumRegistration(origin: UpsellOrigin) {
        const gameCode = this._pogoConfig.gameCode;
        let campaignString = '';
        switch (origin) {
            case UpsellOrigin.Cosmetics:
                campaignString = `u_cpupsell_${gameCode}_cosmetics`;
                break;
            case UpsellOrigin.MysteryPrize:
                campaignString = `u_cpupsell_${gameCode}_mysteryprizeretry`;
                break;
            case UpsellOrigin.EnergyPurchase:
                campaignString = `u_cpupsell_${gameCode}_energypurchase`;
                break;
            case UpsellOrigin.CoinPurchase:
                campaignString = `u_cpupsell_${gameCode}_coinpurchase`;
                break;
            case UpsellOrigin.None:
            case UpsellOrigin.Banner:
            case UpsellOrigin.ContentLock:
                // N/A for Free Users
                break;
        }

        this.pogoSDK.redirectTo('joinClub', campaignString);
    }

    public getPlatformSetting<T = string>(setting: string): T {
        const preferences = this.pogoSDK.getPreferences();
        if (!preferences) {
            return null as T;
        }
        return preferences[setting] as T;
    }

    // Game Events
    public async gameLoaded(): Promise<void> {
        await this._syncStats({}, { event: 'init' });
        await this._syncStats({}, { event: 'energy-auto-income' });
        await this._syncStats({}, { event: 'update-daily-mystery-prize-data' });
        await this.pogoSDK.gameLoaded();
    }

    public async gameStartingLevel(puzzleIndex: number, cost: number): Promise<string> {
        // We can't control the cost; but we can let cost === 0 bypass decrementing energy
        if (cost > 0) {
            let gameMode = 0;
            if (puzzleIndex === -1) {
                gameMode = 1; // Quick play
            }
            await this._syncStats({ gameMode: gameMode }, { event: 'play-level' });
        }
        await this.pogoSDK.gameStarted();
        this._seed = this.pogoSDK.getSeed();
        this._log.debug(`Pogo seed: `, { seed: this._seed });

        // Energy consumed; update timers
        await this._updateFromServerStats();

        return this._seed;
    }

    public async gameLevelEnded(puzzleIndex: number, puzzleId: string, puzzleCompleteData: PuzzleCompleteEventData): Promise<boolean> {
        this._log.debug(`Pogo gameLevelEnded puzzleIndex=${puzzleIndex} puzzleId=${puzzleId} puzzleCompleteData`, puzzleCompleteData);

        const isQuickPlay = puzzleIndex === -1 && puzzleCompleteData.ObjectiveProgress.length === 0;
        if (!isQuickPlay && puzzleCompleteData.Status === GameOverResult.None) {
            this._log.warn('BackendPogo.gameLevelEnded Trying to send game over for in-progress puzzle');
            return;
        }

        try {
            if (!isQuickPlay && puzzleCompleteData.ObjectivesComplete) {
                const isAlreadyCompleted = this._saveData.storyLevelsCompleted.includes(puzzleId);
                if (!isAlreadyCompleted) {
                    //first successful completion of the level
                    this._syncStats({ levelID: puzzleIndex }, { event: 'stage-complete' });
                    this._syncStats({ levelID: puzzleIndex + 1 }, { event: 'stage-unlock' });
                }
            }

            if (isQuickPlay) {
                this._saveData = SaveData.updateQuickPlaySaveData(this._saveData, puzzleCompleteData.Score);
            } else {
                this._saveData = SaveData.updatePuzzleCompletion(this._saveData, puzzleIndex, puzzleId, puzzleCompleteData.ObjectivesComplete);
            }
            await this._save();
        } catch (error) {
            this._log.error(`BackendPogo.gameLevelEnded save error = `, error);
            return false;
        }

        const winCodes = this._buildGameOverWinCodes(puzzleIndex, puzzleCompleteData);
        this._log.debug(`BackendPogo.gameLevelEnded sending wincodes`, winCodes);
        await this.pogoSDK.sendGameOver(winCodes, this._seed, {});

        await this.pogoSDK.showToast('rank');
        await this.pogoSDK.showGoats();
        await this.pogoSDK.showServiceMenu('gameOver');

        const stats = this.pogoSDK.getStats() as IStats;
        this._inventory.fromJson(stats);

        return true;
    }

    dinerEnter() {
        // Do nothing
    }
    dinerExit() {
        // Do nothing
    }
    loadingStart() {
        // Do nothing
    }
    loadingStop() {
        // Do nothing
    }

    public resetGameContext() {
        this._gameContext = {};
    }

    public addGameContext(context: Partial<Context>) {
        this._gameContext = {
            ...this._gameContext,
            ...context
        };
    }

    public sendGa4Event(eventData: EventData) {
        this.pogoSDK.logGa4Event(eventData);
    }

    public async onTaskUpdated(taskId: string, taskUpdatedData: TaskUpdatedEventData): Promise<boolean> {
        try {
            if (taskUpdatedData.Completed) {
                await this._syncStats({ starsUsed: taskUpdatedData.StarCost }, { event: 'use-stars' });

                this.sendGa4Event({ game_event_type: 'task-complete', taskId: taskId });

                if (taskUpdatedData.ChapterEndId && taskUpdatedData.ChapterEndName) {
                    await this._syncStats(
                        {},
                        { event: 'chapter-complete', chapterId: taskUpdatedData.ChapterEndId, chapterName: taskUpdatedData.ChapterEndName }
                    );

                    this.sendGa4Event({
                        game_event_type: 'chapter-complete',
                        chapterId: taskUpdatedData.ChapterEndId,
                        chapterName: taskUpdatedData.ChapterEndName
                    });
                }
            } else if (taskUpdatedData.Assigned && !taskUpdatedData.Completed && !this._saveData.taskProgressSaveData.has(taskId)) {
                await this._syncStats({}, { event: 'task-unlock', taskComplete: taskId });

                this.sendGa4Event({ game_event_type: 'task-unlock', taskId: taskId });

                if (taskUpdatedData.ChapterStartId && taskUpdatedData.ChapterStartName) {
                    await this._syncStats(
                        {},
                        { event: 'chapter-unlock', chapterId: taskUpdatedData.ChapterStartId, chapterName: taskUpdatedData.ChapterStartName }
                    );

                    this.sendGa4Event({
                        game_event_type: 'chapter-unlock',
                        chapterId: taskUpdatedData.ChapterStartId,
                        chapterName: taskUpdatedData.ChapterStartName
                    });
                }
            }

            this._saveData = SaveData.updateTaskCompletion(this._saveData, taskId, taskUpdatedData.Completed, taskUpdatedData.Assigned);
            await this._save();
        } catch (error) {
            this._log.error(`BackendPogo.onTaskComplete save error =`, error);
            return false;
        }

        // Do the task completion last to award badges
        if (taskUpdatedData.Completed) {
            await this._syncStats({}, { event: 'task-complete', taskComplete: taskId });
            await this.pogoSDK.showGoats();
        }

        return true;
    }

    public getDailyPrizePurchaseCount() {
        return this._inventory?.dailyPrizePurchase ?? 0;
    }

    public async onClaimDailyReward(prizeSlot: number, prizeIndex: number): Promise<boolean> {
        this._log.debug(`Pogo: onClaimDailyReward prizeSlot=${prizeSlot} prizeIndex=${prizeIndex}`);
        await this._syncStats({ prizeIndex: prizeIndex, prizeSlot: prizeSlot }, { event: 'claim-daily-mystery-prize' });
        if (this.onDailyPrizeStateChanged) {
            this.onDailyPrizeStateChanged();
        }

        // Update inventory and trigger UI updates
        const stats = this.pogoSDK.getStats() as IStats;
        this._inventory.fromJson(stats);
        if (this.onCurrencyChanged) {
            this.onCurrencyChanged();
        }

        return true;
    }

    public async getDailyRewardPrizes(): Promise<DailyPrizeRewardState> {
        const settings = await this.pogoSDK.getGameConfig()?.settings?.[0];
        if (!settings) {
            this._log.error('Failed to load settings');
            return null;
        }

        let rewards: [] = settings.dailyRewards;
        let clubRewards: [] = settings.dailyClubRewards;
        if (!rewards || !Array.isArray(rewards) || !clubRewards || !Array.isArray(clubRewards)) {
            this._log.error('Failed to load daily reward prizes');
            return null;
        }

        const serverTime = this.pogoSDK.getServerTime().getTime();
        let dayIndex = new Date(serverTime).getUTCDay();
        // Special case for Sunday - map to day 7 instead of 0
        if (dayIndex === 0) {
            dayIndex = 7;
        }

        let todayFreeRewards: RewardEntry[] = [];
        let todayClubRewards: RewardEntry[] = [];

        rewards.forEach((item: any) => {
            const rewardItem: RewardItem = {
                count: Number(item.count),
                day: Number(item.day),
                rewardIndex: Number(item.rewardIndex),
                itemId: item.itemId
            };

            if (rewardItem?.day === dayIndex) {
                const info = this._config.itemConfig.getItemInfoForExternalId(rewardItem?.itemId);
                if (!info) {
                    this._log.warn(`Unknown item ${rewardItem?.itemId}, will not return as prize item.`);
                    return;
                }

                todayFreeRewards[rewardItem.rewardIndex] = {
                    item: info,
                    count: rewardItem.count
                };
            }
        });
        clubRewards.forEach((item: any) => {
            const rewardItem: RewardItem = {
                count: Number(item.count),
                day: Number(item.day),
                rewardIndex: Number(item.rewardIndex),
                itemId: item.itemId
            };

            if (rewardItem?.day === dayIndex) {
                const info = this._config.itemConfig.getItemInfoForExternalId(rewardItem?.itemId);
                if (!info) {
                    this._log.warn(`Unknown item ${rewardItem?.itemId}, will not return as prize item.`);
                    return;
                }
                todayClubRewards[rewardItem.rewardIndex] = {
                    item: info,
                    count: rewardItem.count
                };
            }
        });

        // Normalize arrays with nulls if any are missing
        for (let i = 0; i < todayFreeRewards.length; i++) {
            if (todayFreeRewards[i] === undefined) {
                todayFreeRewards[i] = null;
            }
        }
        for (let i = 0; i < todayClubRewards.length; i++) {
            if (todayClubRewards[i] === undefined) {
                todayClubRewards[i] = null;
            }
        }

        // Only choose prize indices if we have valid prizes for both free / club
        const availableIndices = todayFreeRewards
            .map((_, i) => {
                const free = todayFreeRewards[i];
                const club = todayClubRewards[i];
                if (!free || !club) {
                    this._log.warn(`Pogo daily prize: skipping index ${i}:`, {
                        freeReward: free ?? 'null',
                        clubReward: club ?? 'null'
                    });
                    return -1;
                }
                return i;
            })
            .filter((i) => i !== -1);

        const stats = this.pogoSDK.getStats().game;
        const claimed = [stats['lastDailyRewards.0'], stats['lastDailyRewards.1'], stats['lastDailyRewards.2']];
        this._log.debug(`Pogo claimed state: `, { claimState: claimed });

        let boxClaimOrder = this._saveData.dailyPrizeClaimOrder;
        let boxClaimLastDay = this._saveData.dailyPrizeLastDay;
        if (
            !boxClaimOrder ||
            boxClaimOrder.length < 3 ||
            (claimed[0] === BackendPogo.PRIZE_UNCLAIMED &&
                claimed[1] === BackendPogo.PRIZE_UNCLAIMED &&
                claimed[2] === BackendPogo.PRIZE_UNCLAIMED &&
                boxClaimLastDay !== dayIndex)
        ) {
            // Shuffle in place
            Utils.shuffleUnseeded(availableIndices);

            // Pick 3
            boxClaimOrder = availableIndices.slice(0, 3);

            // Save the claim order so we're claiming the same prizes across multiple visits on the same day
            this._saveData.dailyPrizeClaimOrder = boxClaimOrder;
            this._saveData.dailyPrizeLastDay = dayIndex;
            await this._save();
        }

        todayFreeRewards.forEach((reward, index) => {
            this._log.debug(`Pogo free reward for [Day=${dayIndex}][${index}] ${reward?.item?.name ?? ''} x ${reward?.count ?? 0}`);
        });
        todayClubRewards.forEach((reward, index) => {
            this._log.debug(`Pogo club reward for [Day=${dayIndex}][${index}] ${reward?.item?.name ?? ''} x ${reward?.count ?? 0}`);
        });

        // Build reward box state
        this._log.debug(`Pogo claim indices: `, { claimOrder: boxClaimOrder });

        // Box 0
        let claimIndex = boxClaimOrder[0];
        let freeRewardEntry = todayFreeRewards[claimIndex];
        let clubRewardEntry = todayClubRewards[claimIndex];
        let boxClaimed = claimed[0] !== BackendPogo.PRIZE_UNCLAIMED;
        const box0FreeReward = new DailyReward(freeRewardEntry.item, freeRewardEntry.count, boxClaimed);
        const box0ClubReward = new DailyReward(clubRewardEntry.item, clubRewardEntry.count, boxClaimed);
        const box0 = new DailyRewardBox(box0FreeReward, box0ClubReward, 0, claimIndex);

        // Box 1
        claimIndex = boxClaimOrder[1];
        freeRewardEntry = todayFreeRewards[claimIndex];
        clubRewardEntry = todayClubRewards[claimIndex];
        boxClaimed = claimed[1] !== BackendPogo.PRIZE_UNCLAIMED;
        const box1FreeReward = new DailyReward(freeRewardEntry.item, freeRewardEntry.count, boxClaimed);
        const box1ClubReward = new DailyReward(clubRewardEntry.item, clubRewardEntry.count, boxClaimed);
        const box1 = new DailyRewardBox(box1FreeReward, box1ClubReward, 1, claimIndex);

        // Box 2
        claimIndex = boxClaimOrder[2];
        freeRewardEntry = todayFreeRewards[claimIndex];
        clubRewardEntry = todayClubRewards[claimIndex];
        boxClaimed = claimed[2] !== BackendPogo.PRIZE_UNCLAIMED;
        const box2FreeReward = new DailyReward(freeRewardEntry.item, freeRewardEntry.count, boxClaimed);
        const box2ClubReward = new DailyReward(clubRewardEntry.item, clubRewardEntry.count, boxClaimed);
        const box2 = new DailyRewardBox(box2FreeReward, box2ClubReward, 2, claimIndex);

        this._log.debug(`Pogo mystery boxes: `, { box0: box0, box1: box1, box2: box2 });

        return new DailyPrizeRewardState(box0, box1, box2, true);
    }

    public timeUntilDailyReset(): number {
        const serverTime = this.pogoSDK.getServerTime().getTime();
        const midnight = new Date(serverTime);

        midnight.setUTCHours(23, 59, 59, 999);
        let remainingTimeMS = midnight.getTime() - serverTime;

        return remainingTimeMS;
    }

    public async onDialogueSeen(dialogueId: string): Promise<boolean> {
        try {
            this._saveData = SaveData.addSeenDialogue(this._saveData, dialogueId);
            await this._save();
        } catch (error) {
            this._log.error(`BackendPogo.onTaskComplete save error =`, error);
            return false;
        }

        return true;
    }

    public async unlockRoom(roomId: string): Promise<boolean> {
        try {
            this._saveData.roomSaveData.set(roomId, true);
            await this._save();
        } catch (error) {
            this._log.error(`BackendPogo.unlockRoom save error =`, error);
            return false;
        }
        return true;
    }

    public isRoomUnlocked(roomId: string) {
        return this._saveData.roomSaveData.has(roomId);
    }

    public async onPropSwapped(nodeId: string, propSwappedData: PropSwappedEventData): Promise<boolean> {
        try {
            this._saveData = SaveData.updateNodeContents(this._saveData, nodeId, propSwappedData.PropId);
            await this._save();
        } catch (error) {
            this._log.error(`BackendPogo.onPropSwapped save error =`, error);
            return false;
        }

        return true;
    }

    public async gainCurrency(currency: Currency, amount: number, _source: ResourceChangeContext): Promise<boolean> {
        try {
            this._saveData = SaveData.incrementCurrencyAmount(this._saveData, currency, amount);
            await this._save();
        } catch (error) {
            this._log.error(`BackendPogo.gainCurrency save error =`, error);
            return false;
        }

        return true;
    }

    public async loseCurrency(currency: Currency, amount: number, _source: ResourceChangeContext): Promise<boolean> {
        try {
            this._saveData = SaveData.decrementCurrencyAmount(this._saveData, currency, amount);
            await this._save();
        } catch (error) {
            this._log.error(`BackendPogo.loseCurrency save error =`, error);
            return false;
        }

        return true;
    }

    public getInventoryItemCount(itemId: string): number {
        const inventory = this.pogoSDK.getStats()?.inventory;
        if (!inventory) {
            return 0;
        }

        const count = inventory?.[itemId] || 0;
        return count;
    }

    // Inventory
    public getEnergy() {
        return this._inventory?.energy ?? 0;
    }

    public getMaxEnergy() {
        return this._pogoSettings.energyCap;
    }

    public timeUntilNextEnergy() {
        return this._timeUntilEnergyEarned;
    }

    public getPowerupCount(powerupType: PowerupType): number {
        switch (powerupType) {
            case PowerupType.Joker:
                return this._inventory?.jokerCount ?? 0;
            case PowerupType.ExtraServings:
                return this._inventory?.extraServingsCount ?? 0;
            case PowerupType.FreeDessert:
                return this._inventory?.freeDessertCount ?? 0;
            case PowerupType.Refire:
                return this._inventory?.refireCount ?? 0;
            case PowerupType.Plus7Cards:
                return this._inventory?.plusSevenCards ?? 0;
            case PowerupType.CookingTheBooks:
                return this._inventory?.cookingTheBooksCount ?? 0;
            case PowerupType.CleanDown:
                return this._inventory?.cleanDownCount ?? 0;
        }
    }

    public getBoosterCount(boosterType: BoosterType): number {
        switch (boosterType) {
            case BoosterType.DeucesWild:
                return this._inventory?.deucesWildCount ?? 0;
            case BoosterType.LoosenTheBelt:
                return this._inventory?.loosenTheBeltCount ?? 0;
        }
    }

    public getAllPowerupCounts(): Map<PowerupType, number> {
        const result = new Map<PowerupType, number>();
        for (const key in PowerupType) {
            if (isNaN(Number(key)) && key !== PowerupType.None) {
                const powerup = PowerupType[key as keyof typeof PowerupType];
                result.set(powerup, this.getPowerupCount(powerup));
            }
        }
        return result;
    }

    public getAllBoosterCounts(): Map<BoosterType, number> {
        const result = new Map<BoosterType, number>();
        for (const key in BoosterType) {
            if (isNaN(Number(key)) && key !== BoosterType.None) {
                const booster = BoosterType[key as keyof typeof BoosterType];
                result.set(booster, this.getBoosterCount(booster));
            }
        }
        return result;
    }

    public async usePowerup(powerupType: PowerupType): Promise<void> {
        await this.pogoSDK.consume(this._getIdFromPowerupType(powerupType), 1);
        await this._updateFromServerStats();
    }

    public async useBooster(boosterType: BoosterType): Promise<void> {
        await this.pogoSDK.consume(this._getIdFromBoosterType(boosterType), 1);
        await this._updateFromServerStats();
    }

    public async cheat_spendPowerup(powerupType: PowerupType, delta: number): Promise<void> {
        await this.pogoSDK.consume(this._getIdFromPowerupType(powerupType), delta);
        await this._updateFromServerStats();
    }

    public async cheat_spendBooster(powerupType: BoosterType, delta: number): Promise<void> {
        await this.pogoSDK.consume(this._getIdFromBoosterType(powerupType), delta);
        await this._updateFromServerStats();
    }

    private _getIdFromPowerupType(powerupType: PowerupType) {
        switch (powerupType) {
            case PowerupType.Joker:
                return BackendPogo.STAT_powerup_joker;
            case PowerupType.ExtraServings:
                return BackendPogo.STAT_powerup_extra_servings;
            case PowerupType.FreeDessert:
                return BackendPogo.STAT_powerup_free_dessert;
            case PowerupType.Refire:
                return BackendPogo.STAT_powerup_refire;
            case PowerupType.Plus7Cards:
                return BackendPogo.STAT_powerup_plus7_cards;
            case PowerupType.CookingTheBooks:
                return BackendPogo.STAT_powerup_cooking_the_books;
            case PowerupType.CleanDown:
                return BackendPogo.STAT_powerup_clean_down;
        }
    }

    private _getIdFromBoosterType(booster: BoosterType) {
        switch (booster) {
            case BoosterType.LoosenTheBelt:
                return BackendPogo.STAT_powerup_loosen_the_belt;
            case BoosterType.DeucesWild:
                return BackendPogo.STAT_powerup_deuces_wild;
        }
    }

    // Store
    public async openStore() {
        const result = await this.pogoSDK.showStore(null, null);
        this._log.debug(`openStore result`, result);
    }

    public async getCurrencyBalances(): Promise<CurrencyAndAmount[]> {
        let currencies: CurrencyAndAmount[] = [];

        // Add non-stat currencies from save data (Stars)

        // STARS
        let starCount = 0;
        if (this._saveData.currencySaveData.has(Currency.Stars)) {
            starCount = this._saveData.currencySaveData.get(Currency.Stars).amount;
        }
        currencies.push(new CurrencyAndAmount(Currency.Stars, starCount as number));

        const result = await this.pogoSDK.getWalletBalances();
        if (!result || !Array.isArray(result)) {
            return currencies;
        }

        // Add stat currencies
        let coinCount = 0;
        result.forEach((currency) => {
            // COINS
            if (currency?.currency === BackendPogo.CURRENCY_coins) {
                coinCount = currency?.balance as number;
            }
        });
        currencies.push(new CurrencyAndAmount(Currency.Coins, coinCount));

        // Pogo gems
        let gemCount = 0;
        const profile = this.pogoSDK.getProfile();
        if (profile && profile.gems && !isNaN(profile.gems)) {
            gemCount = profile.gems as number;
        }
        currencies.push(new CurrencyAndAmount(Currency.Gems, gemCount));

        return currencies;
    }

    public async getCurrencyBalance(currency: Currency): Promise<number> {
        const currencyBalances = await this.getCurrencyBalances();

        const currencyAndBalance = currencyBalances.find((cb) => cb.currency === currency);
        if (!currencyAndBalance) {
            return 0;
        }
        return currencyAndBalance.amount;
    }

    public async redirectToPremiumCurrencyStore(): Promise<void> {
        const leaveResult = await this._canLeaveGame();

        if (leaveResult) {
            this.pogoSDK.redirectTo('gemFund', '');
        }
    }

    public async getCatalog(): Promise<CatalogItem[]> {
        let supportedItems: CatalogItem[] = [];

        const pogoCatalog = await this.pogoSDK.getCatalog();
        if (!pogoCatalog || !Array.isArray(pogoCatalog)) {
            return supportedItems;
        }

        this._config.storeConfig.items.forEach((catalogItem) => {
            const pogoCatalogItem = pogoCatalog.find((pogoItem) => pogoItem?.productId && catalogItem.externalIds.includes(pogoItem?.productId));

            if (!pogoCatalogItem && catalogItem.isUpsell) {
                // Include this item, but clear it's externalIds since none of them map to valid Pogo purchases. On purchase, if
                // this item is requested, we'll instead try to upsell them to club pogo instead
                const upsellItem = CatalogItem.fromItem(catalogItem);
                upsellItem.externalIds = [];
                supportedItems.push(upsellItem);
                return;
            }

            if (!pogoCatalogItem) {
                this._log.warn(`No pogo catalog item ${catalogItem.id}: ProductIds[${catalogItem.externalIds}]`);
                return;
            }

            // Filter out items that have exceeded purchase counts
            if (!this._isPurchaseWithinPurchaseCountLimits(catalogItem)) {
                this._log.debug(`Catalog item purchase limit exceeded`, { item: catalogItem });
                return;
            }

            // Clone the catalog item and override with Pogo fields
            // Only include the productId, as the Scramble catalog item may have multiple external Ids of which only a single one should
            // be eligible for a user to purchase (i.e. free vs club Ids)
            const mergedItem = CatalogItem.fromItem(catalogItem);
            mergedItem.externalIds = [pogoCatalogItem.productId];
            if (pogoCatalogItem?.itemName && pogoCatalogItem?.itemName !== '') {
                mergedItem.name = pogoCatalogItem?.itemName;
            }
            mergedItem.cost = new CurrencyAndAmount(PogoUtils.PogoToScrambleCurrency(pogoCatalogItem?.currency), pogoCatalogItem?.price);

            // If we have an upsell item, but we have a catalog entry on Pogo side, clear the upsell flag, this user is eligible to purchase
            // mergedItem.isUpsell = false;

            // Replace with items in pogo backend to allow live changing bundles and have the contents
            // display properly in the store screen without a content update.
            if (pogoCatalogItem?.itemType === 'BUNDLE') {
                mergedItem.contents = [];
            }
            if (pogoCatalogItem?.subItems && Array.isArray(pogoCatalogItem.subItems)) {
                mergedItem.contents = [];
                pogoCatalogItem.subItems.forEach((subItem) => {
                    let subItemId = subItem?.itemId ?? null;
                    const amount = subItem?.amount ?? 0;
                    if (!subItemId) {
                        this._log.warn(`Pogo catalog sub item missing id: `, subItem);
                        return;
                    }

                    // The external id in our config for 'coins' is 'coins'. Which sometimes is the
                    // value expected, but in this case it's not. It's 'CARD_SCRAMBLE_COINS'.
                    if (subItemId === BackendPogo.CURRENCY_coins) {
                        subItemId = BackendPogo.STAT_coins;
                    }

                    const item = this._config.itemConfig.getItemInfoForExternalId(subItemId);
                    if (!item) {
                        this._log.warn(`Pogo catalog sub item is unknown: `, subItem);
                        console.log(this._config.storeConfig.items);
                        return;
                    }

                    mergedItem.contents.push(new ItemAndAmount(item.id, amount));
                });
            }

            supportedItems.push(mergedItem);
        });

        return supportedItems;
    }

    public async purchase(catalogItem: CatalogItem, _storeType: StoreType): Promise<PurchaseResult> {
        this._log.info(`Pogo purchase request for: `, catalogItem);
        if (!catalogItem) {
            return new PurchaseResult(PurchaseStatus.Error, UnexpectedStoreErrorMessage);
        }

        if (!catalogItem.externalIds || catalogItem.externalIds.length < 1) {
            this._log.warn('Attempting to purchase item missing Pogo productId');
            return new PurchaseResult(PurchaseStatus.Error, UnexpectedStoreErrorMessage);
        }

        // Check purchase limits
        if (!this._isPurchaseWithinPurchaseCountLimits(catalogItem)) {
            this._log.warn(`Attempting to purchase item over purchase limit count`, { item: catalogItem });
            return new PurchaseResult(PurchaseStatus.Error, 'You cannot purchase this item again.');
        }

        try {
            const currency = PogoUtils.ScrambleToPogoCurrency(catalogItem.cost.currency);
            const result = await this.pogoSDK.purchase(catalogItem.externalIds[0], catalogItem.cost.amount, currency);

            if (result.error) {
                this._log.error('Purchase failed:', result);
                if (result.reason === 'insufficient_gems') {
                    return new PurchaseResult(PurchaseStatus.Error, `Not enough gems to purchase ${catalogItem.name}`);
                } else if (result.reason === 'insufficient_softcurrency') {
                    return new PurchaseResult(PurchaseStatus.Error, `Not enough coins to purchase ${catalogItem.name}`);
                }
                return new PurchaseResult(PurchaseStatus.Error, UnexpectedStoreErrorMessage);
            }
            this._log.info('Pogo Purchase successful:', result);

            // Increment purchase count
            this._saveData = SaveData.incrementPurchaseCount(this._saveData, catalogItem.id);
            await this._save();

            // Refresh inventory
            const stats: IStats = this.pogoSDK.getStats();
            this._inventory.fromJson(stats);
            this._log.debug(`Refresh Pogo stats`, stats);

            if (this.onCurrencyChanged) {
                this.onCurrencyChanged();
            }
            return new PurchaseResult(PurchaseStatus.Success);
        } catch (error) {
            this._log.error('Purchase failed:', error);
            return new PurchaseResult(PurchaseStatus.Error, UnexpectedStoreErrorMessage);
        }
    }

    public showPurchaseSuccessPopup(): boolean {
        return false;
    }

    private _isPurchaseWithinPurchaseCountLimits(catalogItem: CatalogItem): boolean {
        if (catalogItem.maxPurchaseCount === 0) {
            return true;
        }

        const purchaseCount = SaveData.getPurchaseCount(this._saveData, catalogItem.id);
        if (purchaseCount >= catalogItem.maxPurchaseCount) {
            return false;
        }

        return true;
    }

    addCheats(debugService: IDebugService): void {
        debugService.addDebugButton('Reset Mystery Rewards', 'Cheats', this.cheat_resetMysteryRewards.bind(this));
        debugService.addDebugButton('Reset Energy Timer', 'Cheats', this.cheat_resetEnergyAutoIncome.bind(this));
        debugService.addDebugButton('Grant +1 Energy', 'Cheats', this.cheat_grantItem.bind(this, BackendPogo.STAT_powerup_energy, 1));
    }
    // Cheats
    async cheat_resetUser() {
        if (!this._config.cheats) {
            return;
        }

        this._saveData = new SaveData();
        await this._save();
        const coins = await this.getCurrencyBalance(Currency.Coins);
        this._syncStats({ coins: coins }, { event: 'cheat-reset-user' });
    }
    async cheat_setUserSave(saveData: string) {
        if (!this._config.cheats) {
            return;
        }
        this._saveData = SaveData.fromJson(saveData);
        await this._save();
    }
    async cheat_resetMysteryRewards() {
        if (!this._config.cheats) {
            return;
        }
        await this._syncStats({}, { event: 'cheat-reset-mystery-rewards' });
        await this._updateFromServerStats();
        if (this.onDailyPrizeStateChanged) {
            this.onDailyPrizeStateChanged();
        }
    }
    async cheat_resetEnergyAutoIncome() {
        if (!this._config.cheats) {
            return;
        }
        await this._syncStats({}, { event: 'cheat-reset-energy-auto-income' });
        await this._updateFromServerStats();
    }

    async cheat_resetInfiniteEnergy() {
        if (!this._config.cheats) {
            return;
        }
        await this._syncStats({}, { event: 'cheat-reset-infinite-energy' });
        await this._updateFromServerStats();
    }

    async cheat_grantCurrency(name: string, amount: number) {
        if (!this._config.cheats) {
            return;
        }
        if (name === Currency.Stars) {
            this._saveData = SaveData.incrementCurrencyAmount(this._saveData, name, amount);
            await this._save();
            return;
        }

        return this.cheat_grantItem(BackendPogo.STAT_coins, amount);
    }

    async cheat_grantItem(item: string, delta: number) {
        if (!this._config.cheats) {
            return;
        }
        await this._syncStats({ delta: delta }, { event: 'cheat-update-inventory', itemName: item });
        await this._updateFromServerStats();
    }

    async cheat_grantBooster(booster: BoosterType, delta: number) {
        if (!this._config.cheats) {
            return;
        }
        let boosterId: string = this._getIdFromBoosterType(booster);
        if (!boosterId) {
            return;
        }
        return this.cheat_grantItem(boosterId, delta);
    }

    async cheat_grantPowerup(powerup: PowerupType, delta: number) {
        if (!this._config.cheats) {
            return;
        }
        let powerupId: string = this._getIdFromPowerupType(powerup);
        if (!powerupId) {
            return;
        }
        return this.cheat_grantItem(powerupId, delta);
    }

    private async _initializePogoSDK(config: PogoSDKConfig): Promise<void> {
        const params: IConfig = {
            gameId: config.gameId,
            gameCode: config.gameCode,
            enableSDKAutomation: config.enableSDKAutomation
        };

        this.pogoSDK = new PogoSDK(params);

        try {
            await this.pogoSDK.ready();
            this.pogoSDK.addPreferenceChangeHandler(this._preferenceChangeHandler.bind(this));
            this.pogoSDK.addPauseHandler(this._pauseHandler.bind(this));
            this.pogoSDK.setNewGameHandler(this._newGameHandler.bind(this));
            this.pogoSDK.setTearDownHandler(this._tearDownHandler.bind(this));

            this._initialized = true;
            this._log.info('BackendPogo: PogoSDK initialized');
        } catch (error) {
            this._log.error('BackendPogo: Failed to initialize Pogo SDK:', error);
            throw error;
        }
    }

    /**
     * Callback function triggered when a preference is changed.
     * @param {String} name - Property name
     * @param {String} value - Property value
     * @param {Object} preferences - The whole preference object
     */
    private _preferenceChangeHandler(name: string, value: string, preferences: any): void {
        this._log.debug(`BackendPogo._preferenceChangeHandler`);
        if (this.onBackendSettingChanged) {
            this.onBackendSettingChanged(name, value);
        }
    }

    /**
     * Callback function triggered when the game is paused.
     * @param {Object} promiseCB - Promise object.
     */
    private _pauseHandler(promiseCB: Promise<string>): void {
        this._log.debug(`BackendPogo._pauseHandler`);

        // TODO:
    }

    /**
     * Callback function triggered by "New Game" button.
     */
    private _newGameHandler(): void {
        this._log.debug(`BackendPogo._newGameHandler`);

        // TODO:
    }

    /**
     * Callback function triggered when releasing assets.
     */
    private _tearDownHandler(): void {
        this._log.debug(`BackendPogo._tearDownHandler`);

        // TODO:
    }

    private async _load(): Promise<void> {
        if (this._config.migrateGuestSaveData) {
            if (this.getUserEntitlement() === EntitlementType.Guest) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const savedData = sys.localStorage.getItem('guestSaveData');
                        if (savedData) {
                            this._saveData = SaveData.fromJson(savedData);
                        } else {
                            this._saveData = new SaveData();
                        }
                        this._log.debug(`BackendPogo._load guestSaveData: `, this._saveData);
                        resolve();
                    }, 0);
                });
            } else {
                const guestSavedData = sys.localStorage.getItem('guestSaveData');
                if (guestSavedData) {
                    this._tryMigratingGuestDataToPogo(guestSavedData);
                } else {
                    this._loadPogoSaveData();
                }
            }
        } else {
            if (this.getUserEntitlement() === EntitlementType.Guest) {
                sys.localStorage.removeItem('guestSaveData');
                this._saveData = new SaveData();
            } else {
                this._loadPogoSaveData();
            }
        }
    }

    private _loadPogoSaveData() {
        const stats: IStats = this.pogoSDK.getStats();
        this._log.debug(`Pogo stats`, stats);
        this._saveData = SaveData.fromJson(stats.dataslots.SLOT_1);
        this._inventory.fromJson(stats);
    }

    private _loadConfig() {
        const gameConfig = this.pogoSDK.getGameConfig();
        const settings = gameConfig?.settings?.[0];
        this._log.debug(`Pogo settings`, settings);
        if (settings) {
            this._pogoSettings.energyCap = settings?.energyCap;
            this._pogoSettings.energyAutoIncomeInterval = settings?.energyAutoIncomeInterval;
        }
    }

    private async _save(): Promise<boolean> {
        this._log.debug(`BackendPogo._save saving...`);
        const serializedData = JSON.stringify(this._saveData.toJson());
        this._log.debug(`BackendPogo._save data: `, { saveData: serializedData });

        if (this.getUserEntitlement() === EntitlementType.Guest) {
            sys.localStorage.setItem('guestSaveData', serializedData);
            return true;
        }

        try {
            const data = {};
            data[BackendPogo.writeSaveSlotKey] = serializedData;
            await this._syncStats({}, data);
        } catch (exception) {
            this._log.warn(`BackendPogo._save exception`, exception);
            return false;
        }

        return true;
    }

    // Win codes are defined in the Pogo Integration doc: https://docs.google.com/spreadsheets/d/13ygaeb9EsuQPu6y0ndLcWVt62Meu6RiaXnN65ueQb4g/edit?gid=0#gid=0
    private _buildGameOverWinCodes(puzzleIndex: number, puzzleCompleteData: PuzzleCompleteEventData) {
        // 0 = lose
        // 1 = win
        let playerWon = puzzleCompleteData.Status === GameOverResult.Win ? 1 : 0;

        // 0 = Player wins the game.
        // 1 = Player quits the game without finishing the game.
        // 2 = Player finished the game and loses it.
        let loseReason: number = 0;
        let rankPoints: number = 0;
        switch (puzzleCompleteData.Status) {
            case GameOverResult.Win:
                loseReason = 0;
                rankPoints = 30;
                break;
            case GameOverResult.Lose:
                loseReason = 2;
                rankPoints = 15;
                break;
            case GameOverResult.Quit:
                loseReason = 1;
                rankPoints = 0;
                break;
        }

        const rewards = BackendUtil.GetGameOverRewards(this._config.puzzleRewardConfig, puzzleIndex, puzzleCompleteData);

        let objectiveCodes: { [key: string]: any } = {};

        puzzleCompleteData.ObjectiveProgress.forEach((obj, index) => {
            let keyIndex = index + 1;
            //objectiveCodes[`goalID${keyIndex}`] = obj.GoalID;
            objectiveCodes[`goalProgression${keyIndex}`] = obj.GoalProgression >= 1 ? 1 : 0;
            objectiveCodes[`goalCompleted${keyIndex}`] = obj.GoalCompleted;
            objectiveCodes[`objectiveType${keyIndex}`] = getEnumIndex(ObjectiveType, obj.ObjectiveType);
        });

        const powerupBalances = {
            powerup_deuces_wild: this.getBoosterCount(BoosterType.DeucesWild),
            powerup_loosen_the_belt: this.getBoosterCount(BoosterType.LoosenTheBelt),
            powerup_cooking_the_books: this.getPowerupCount(PowerupType.CookingTheBooks),
            powerup_extra_servings: this.getPowerupCount(PowerupType.ExtraServings),
            powerup_joker: this.getPowerupCount(PowerupType.Joker),
            powerup_refire: this.getPowerupCount(PowerupType.Refire),
            powerup_plus7_cards: this.getPowerupCount(PowerupType.Plus7Cards),
            powerup_free_dessert: this.getPowerupCount(PowerupType.FreeDessert)
            //powerup_clean_down: this.getPowerupCount(PowerupType.CleanDown)
        };

        let stars = 0;
        if (this._saveData?.currencySaveData?.has(Currency.Stars)) {
            stars = this._saveData?.currencySaveData?.get(Currency.Stars).amount;
        }

        let powerup_energy = this._inventory.energy;

        const energySpent = 1;

        const winCodes = {
            'gns.rnk.pts': rankPoints,
            puzzleID: puzzleIndex,
            playerWon: playerWon,
            score: puzzleCompleteData.Score,
            loseReason: loseReason,
            gameMode: rewards.gameMode,
            starsEarned: rewards.stars,
            stars: stars,
            coinsEarned: rewards.coins,
            energySpent: energySpent,
            ...objectiveCodes,
            ...powerupBalances,
            ...puzzleCompleteData.Stats // Copy statistics in
        };

        return winCodes;
    }

    private _tryMigratingGuestDataToPogo(file: any) {
        this._log.warn('Local guest save data was found, attempting to migrate to Pogo servers...');
        const guestSaveData = SaveData.fromJson(file);

        const stats: IStats = this.pogoSDK.getStats();
        const pogoSaveData = SaveData.fromJson(stats.dataslots.SLOT_1);

        let highestGuestLevelCompleted = guestSaveData.storyLevelsCompleted.length;
        let highestRegisteredLevelCompleted = pogoSaveData.storyLevelsCompleted.length;

        if (highestRegisteredLevelCompleted >= highestGuestLevelCompleted) {
            this._log.warn('Pogo save data had more progress...');
            this._saveData = pogoSaveData;
            this._inventory.fromJson(stats);
        } else {
            this._log.warn('Local save data had more progress...');
            this._saveData = guestSaveData;
            //TODO: Kev wants us to make sure that the user starts with full energy no matter what, if this isn't handled already by the server, we need to make it happen here.
            this._inventory.fromJson(stats); //This should make them defualt to the inventory of every other player at this point anyway
            this._save();
        }

        this._log.warn('Deleting local guest save data...');
        sys.localStorage.removeItem('guestSaveData');
    }

    private async _updateFromServerStats() {
        // We don't want to call getStatsFromServer() very often, so minimize how often we call it and when we do
        // grab all the data we need from it when we do.
        const stats = await this.pogoSDK.getStatsFromServer();
        this._log.debug(`BackendPogo._updateFromServerStats()`, stats);

        let energyStat = null;
        let lastAutoEnergyTimestampStat = null;
        let deucesWildStat = null;
        let loosenTheBeltStat = null;
        let cookingTheBooksStat = null;
        let extraServingsStat = null;
        let jokerStat = null;
        let refireStat = null;
        let plusSevenCardsStat = null;
        let freeDessertStat = null;
        let cleanDownStat = null;
        let claimPrizeStat = null;

        if (stats && Array.isArray(stats)) {
            stats.forEach((stat) => {
                if (stat?.name === BackendPogo.STAT_lastAutoEnergyTimestamp) {
                    lastAutoEnergyTimestampStat = stat;
                }
                if (stat?.name === BackendPogo.STAT_powerup_energy) {
                    energyStat = stat;
                }
                if (stat?.name === BackendPogo.STAT_powerup_deuces_wild) {
                    deucesWildStat = stat;
                }
                if (stat?.name === BackendPogo.STAT_powerup_loosen_the_belt) {
                    loosenTheBeltStat = stat;
                }
                if (stat?.name === BackendPogo.STAT_powerup_cooking_the_books) {
                    cookingTheBooksStat = stat;
                }
                if (stat?.name === BackendPogo.STAT_powerup_extra_servings) {
                    extraServingsStat = stat;
                }
                if (stat?.name === BackendPogo.STAT_powerup_joker) {
                    jokerStat = stat;
                }
                if (stat?.name === BackendPogo.STAT_powerup_refire) {
                    refireStat = stat;
                }
                if (stat?.name === BackendPogo.STAT_powerup_plus7_cards) {
                    plusSevenCardsStat = stat;
                }
                if (stat?.name === BackendPogo.STAT_powerup_free_dessert) {
                    freeDessertStat = stat;
                }
                if (stat?.name === BackendPogo.STAT_powerup_clean_down) {
                    cleanDownStat = stat;
                }
                if (stat?.name === BackendPogo.STAT_powerup_claim_prize) {
                    claimPrizeStat = stat;
                }
            });
        }

        // Update internal state
        if (energyStat) {
            this._inventory.energy = energyStat.current;
        }
        if (deucesWildStat) {
            this._inventory.deucesWildCount = deucesWildStat.current;
        }
        if (loosenTheBeltStat) {
            this._inventory.loosenTheBeltCount = loosenTheBeltStat.current;
        }
        if (cookingTheBooksStat) {
            this._inventory.cookingTheBooksCount = cookingTheBooksStat.current;
        }
        if (extraServingsStat) {
            this._inventory.extraServingsCount = extraServingsStat.current;
        }
        if (jokerStat) {
            this._inventory.jokerCount = jokerStat.current;
        }
        if (refireStat) {
            this._inventory.refireCount = refireStat.current;
        }
        if (plusSevenCardsStat) {
            this._inventory.plusSevenCards = plusSevenCardsStat.current;
        }
        if (freeDessertStat) {
            this._inventory.freeDessertCount = freeDessertStat.current;
        }
        if (cleanDownStat) {
            this._inventory.cleanDownCount = cleanDownStat.current;
        }
        if (lastAutoEnergyTimestampStat) {
            const ts = lastAutoEnergyTimestampStat?.extras?.ts;
            if (ts) {
                this._lastAutoEnergyTimestamp = ts;
            }
        }
        if (claimPrizeStat) {
            this._inventory.claimPrizeCount = claimPrizeStat.current;
        }

        // Update timer values
        const serverTimeStamp = this.pogoSDK.getServerTime().getTime();
        const nextEnergyTime = this._lastAutoEnergyTimestamp + this._pogoSettings.energyAutoIncomeInterval * 1000;
        this._timeUntilEnergyEarned = nextEnergyTime - serverTimeStamp;
    }

    private async _syncStats(winCodes: any, stringWinCodes: any) {
        this.pogoSDK.resetGameContext();
        this.pogoSDK.addGameContext(this._gameContext);

        await this.pogoSDK.syncStats(winCodes, stringWinCodes);
    }
}
