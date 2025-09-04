import { Static } from '@sinclair/typebox';
import { PortalUser } from 'db://assets/thirdParty/CrazySDK/CrazySDK.types';
import { XsollaAuth } from 'db://xsolla-commerce-sdk/scripts/api/XsollaAuth';
import {
    Price,
    StoreBundle,
    StoreItem,
    StoreItemsData,
    StoreListOfBundles,
    VirtualCurrencyPackage,
    VirtualCurrencyPackagesData,
    VirtualCurrencyPrice,
    XsollaCatalog
} from 'db://xsolla-commerce-sdk/scripts/api/XsollaCatalog';
import { InventoryItemsData, VirtualCurrencyBalanceData, XsollaInventory } from 'db://xsolla-commerce-sdk/scripts/api/XsollaInventory';
import { PaymentTokenResult } from 'db://xsolla-commerce-sdk/scripts/api/XsollaOrders';
import { XsollaPayments } from 'db://xsolla-commerce-sdk/scripts/api/XsollaPayments';
import { OrderTracker } from 'db://xsolla-commerce-sdk/scripts/common/OrderTracker';
import { TokenUtils } from 'db://xsolla-commerce-sdk/scripts/common/TokenParser';
import { TokenStorage } from 'db://xsolla-commerce-sdk/scripts/common/TokenStorage';
import { CommerceError } from 'db://xsolla-commerce-sdk/scripts/core/Error';
import { Xsolla } from 'db://xsolla-commerce-sdk/scripts/Xsolla';
import { _CrazySDK } from '../../../../thirdParty/CrazySDK/CrazySDK';
import { SoundManager } from '../../../audio/SoundManager';
import { AppConfig } from '../../../config/AppConfig';
import { check } from '../../../core/check';
import { BoosterType, PowerupType } from '../../../core/enums/BoosterType';
import { Currency } from '../../../core/enums/Currency';
import { EntitlementType } from '../../../core/enums/EntitlementType';
import { ItemType } from '../../../core/enums/ItemType';
import { PurchaseResult, PurchaseStatus } from '../../../core/enums/PurchaseResult';
import { UpsellOrigin } from '../../../core/enums/UpsellOrigin';
import { CatalogItem } from '../../../core/model/CatalogItem';
import { CurrencyAndAmount } from '../../../core/model/CurrencyAndAmount';
import { ItemInfo } from '../../../core/model/ItemInfo';
import { PropSwappedEventData } from '../../../core/model/PropSwappedEventData';
import { GameOverResult, PuzzleCompleteEventData } from '../../../core/model/PuzzleCompleteEventData';
import { TaskUpdatedEventData } from '../../../core/model/TaskCompleteEventData';
import { CrazyGamesConfig } from '../../../core/types/runtime/definitions';
import { logger } from '../../../logging';
import { Context } from '../../Context';
import { DailyPrizeRewardState } from '../../DailyPrizeRewardState';
import { EventData } from '../../EventData';
import { IBackend } from '../../IBackend';
import { IDebugService } from '../../IDebugService';
import { StoreType } from '../../IStore';
import { extractId, ResourceChangeContext, ResourceItemType } from '../../ResourceChangeContext';
import { SaveData } from '../../SaveData';
import { UnexpectedStoreErrorMessage } from '../common/constants';
import { GetDailyRewardState } from '../common/LocalDailyPrizeChooser';
import { LocalEnergyService } from '../common/LocalEnergyService';
import { createRemoteTimeProvider } from '../common/TimeProvider';
import { GameAnalytics, gameanalytics, initialize as initializeGameAnalytics, sanitizeResource } from '../gameanalytics';
import { isXsollaError, TokenError, XsollaError, xsollaPromiseWrapper, XsollaResult } from './XsollaUtil';

// Valid virtual currencies
const CurrencyToSKU: Record<Currency, string> = {
    [Currency.Coins]: undefined,
    [Currency.Gems]: 'currency_gems',
    [Currency.Stars]: undefined,
    [Currency.Real]: undefined,
    [Currency.None]: undefined,
    [Currency.Energy]: undefined
};

// Virtual Currencies meant to be consumed/cleared on the Xsolla side.  Managed Locally
const ConsumeCurrencies: Record<Currency, string> = {
    [Currency.Coins]: 'currency_coins',
    [Currency.None]: undefined,
    [Currency.Stars]: undefined,
    [Currency.Gems]: undefined,
    [Currency.Real]: undefined,
    [Currency.Energy]: undefined
};

const SKUToCurrency: Record<string, Currency> = {
    currency_gems: Currency.Gems,
    currency_coins: Currency.Coins
};

class CrazyInventory {
    jokerCount: number = 0;
    deucesWildCount: number = 0;
    extraServingsCount: number = 0;
    freeDessertCount: number = 0;
    refireCount: number = 0;
    loosenTheBeltCount: number = 0;
    plusSevenCardsCount: number = 0;
    cookingTheBooksCount: number = 0;
    cleanDownCount: number = 0;
}

export class BackendCrazyGames implements IBackend {
    private _crazySDK: _CrazySDK = new _CrazySDK();

    // TODO: Mostly across POGO / Crazy at the moment, can probably collapse somehow.  Just need to be sure they use the same IDs.  Right now they're different
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
    public static STAT_powerup_claim_prize = 'powerup_claimprize';

    public onDailyPrizeStateChanged: () => void;
    public onCurrencyChanged: () => void;
    public onBackendSettingChanged: (setting: string, value: string) => void;

    private _saveData: SaveData;
    private _config: AppConfig;
    private _crazyGamesConfig: Static<typeof CrazyGamesConfig> | null = null;

    private _showStore: (tags: string[]) => void;
    private _initialized = false;
    private _log = logger.child('BackendCrazyGames');
    private _entitlement: EntitlementType = EntitlementType.Guest;

    private _dailyPrizeReward: DailyPrizeRewardState = null;

    private _localEnergyService: LocalEnergyService = null;
    private _timeProvider: ReturnType<typeof createRemoteTimeProvider> = createRemoteTimeProvider();

    private _inventory: CrazyInventory = new CrazyInventory();
    private _externalIDMap: Map<string, CatalogItem> = null;

    private _gameContext: Partial<Context> = {};
    private _sendBusinessEvents: boolean = false;

    public async initialize(config: AppConfig, _canLeaveGame: () => Promise<boolean>, showStore: (tags: string[]) => void): Promise<void> {
        this._config = config;
        this._showStore = showStore;

        await this._crazySDK
            .init()
            .then(() => {
                this._log.info('CrazyGames SDK successfully initialized', { environment: this._crazySDK.environment });
            })
            .catch((error) => {
                this._log.error('CrazyGames SDK initialization failed', { error: error });
            });

        config.cheats = config.cheats || this._crazySDK.isQaTool;

        if (check(CrazyGamesConfig, config.crazySDKConfig)) {
            this._crazyGamesConfig = config.crazySDKConfig;
            const enableSandbox = config.crazySDKConfig.xsolla.enableSandbox || this._crazySDK.isQaTool;
            const projectId = config.crazySDKConfig.debug ? config.crazySDKConfig.debug.projectId : config.crazySDKConfig.xsolla.projectId;
            Xsolla.init({
                ...config.crazySDKConfig.xsolla,
                projectId,
                enableSandbox
            });
            const resources = [];

            const currencyItems = config.itemConfig.getItemInfosOfType(ItemType.Currency);
            currencyItems.forEach((currencyItem) => {
                resources.push(sanitizeResource(currencyItem.id));
            });

            const boosterItems = config.itemConfig.getItemInfosOfType(ItemType.Booster);
            boosterItems.forEach((boosterItem) => {
                resources.push(sanitizeResource(boosterItem.id));
            });

            const powerupItems = config.itemConfig.getItemInfosOfType(ItemType.PowerUp);
            powerupItems.forEach((powerupItem) => {
                resources.push(sanitizeResource(powerupItem.id));
            });
            const itemTypes = ResourceItemType.slice();
            this._log.info('registering available resource currencies', {
                resources
            });
            this._log.info('registering available resource item types', {
                itemTypes
            });
            this._sendBusinessEvents = config.crazySDKConfig.gameanalytics.sendBusinessEvents;
            initializeGameAnalytics(config.crazySDKConfig.gameanalytics, resources, itemTypes);
        }

        await this._timeProvider.sync();

        // Load save data from localStorage or create a new SaveData object
        await this._load();

        await this._updateInventoryFromBackend();
        await this._clearLingeringCoins();

        this._setupCatalog();

        // Save initial room unlocks
        this._config.initialRoomUnlocks.forEach((roomName) => {
            this.unlockRoom(roomName);
        });

        this._localEnergyService = new LocalEnergyService(this._saveData);

        const user = await this._crazySDK.user.getUser();
        if (user !== null) {
            this._entitlement = EntitlementType.Premium;
        }

        this._crazySDK.user.addAuthListener(this._crazyAuthListener.bind(this));

        this._initialized = true;
    }

    public update(_dt: number) {
        if (!this._initialized) {
            return;
        }

        let triggerSave = false;

        let dayIndex = new Date(this._timeProvider.now).getUTCDay();
        let claimed = this._saveData.dailyPrizeClaimStatus;

        if (this._saveData.dailyPrizeLastDay !== dayIndex && (claimed[0] === true || claimed[1] === true || claimed[2] === true)) {
            this._saveData.dailyPrizeClaimStatus = [false, false, false];
            if (this.onDailyPrizeStateChanged) {
                this.onDailyPrizeStateChanged();
            }
            triggerSave = true;
        }

        if (this._initialized) {
            const modified = this._localEnergyService.updateFromTimestamp(this._timeProvider.now);
            if (modified > 0) {
                this.onEnergyAdded(modified, {
                    type: 'timer',
                    id: 'energy'
                });
                triggerSave = true;
            }
        }

        if (triggerSave) {
            this._save();
        }
    }

    public getSaveData(): SaveData {
        return this._saveData;
    }

    public async saveSaveData(): Promise<boolean> {
        return this._save();
    }

    public getUserEntitlement(): EntitlementType {
        return this._entitlement;
    }

    public openPlatformSignIn() {
        this._crazySDK.user.showAuthPrompt();
    }

    public openPlatformRegistration(_origin: UpsellOrigin) {
        this._crazySDK.user.showAuthPrompt();
    }

    public openPlatformPremiumRegistration(_origin: UpsellOrigin) {
        this._crazySDK.user.showAuthPrompt();
    }

    public getPlatformSetting<T = string>(setting: string): T {
        if (setting === 'sound') {
            return true as T;
        }
        return null as T;
    }

    // Game Events
    public async gameLoaded() {
        // Nothing to do here
        return;
    }

    public async gameStartingLevel(puzzleIndex: number, cost: number): Promise<string> {
        await this._updateInventoryFromBackend();

        this._crazySDK.game.gameplayStart();

        const isQuickPlay = puzzleIndex === -1;

        if (GameAnalytics != null) {
            if (!isQuickPlay) {
                GameAnalytics.addProgressionEvent(
                    gameanalytics.EGAProgressionStatus.Start,
                    'puzzle',
                    this._gameContext.chapterId,
                    levelIndexParameter(puzzleIndex)
                );
            }
        }

        if (cost > 0) {
            this.reduceEnergy(cost, {
                type: 'level',
                levelId: isQuickPlay ? 'quickplay' : levelIndexParameter(this._gameContext.puzzleIndex)
            });
        }

        const timestamp = Date.now();
        return timestamp.toString();
    }

    public async gameLevelEnded(puzzleIndex: number, puzzleId: string, puzzleCompleteData: PuzzleCompleteEventData): Promise<boolean> {
        this._crazySDK.game.gameplayStop();

        this._log.debug(`Local gameLevelEnded puzzleIndex=${puzzleIndex} puzzleId=${puzzleId} puzzleCompleteData`, puzzleCompleteData);
        const isQuickPlay = puzzleIndex === -1 && puzzleCompleteData.ObjectiveProgress.length === 0;

        if (GameAnalytics != null) {
            if (!isQuickPlay) {
                let status: gameanalytics.EGAProgressionStatus;
                switch (puzzleCompleteData.Status) {
                    case GameOverResult.Win:
                        status = gameanalytics.EGAProgressionStatus.Complete;
                        break;
                    case GameOverResult.Lose:
                    case GameOverResult.Quit:
                    case GameOverResult.None:
                        status = gameanalytics.EGAProgressionStatus.Fail;
                        break;
                }
                GameAnalytics.addProgressionEvent(
                    status,
                    'puzzle',
                    this._gameContext.chapterId,
                    levelIndexParameter(puzzleIndex),
                    puzzleCompleteData.Score
                );
            }
        }

        try {
            if (isQuickPlay) {
                this._saveData = SaveData.updateQuickPlaySaveData(this._saveData, puzzleCompleteData.Score);
            } else {
                this._saveData = SaveData.updatePuzzleCompletion(this._saveData, puzzleIndex, puzzleId, puzzleCompleteData.ObjectivesComplete);
            }

            await this._crazyShowInterstitial();

            await this._save();
        } catch (error) {
            this._log.error('save failed', {
                error
            });
            return false;
        }

        return true;
    }

    dinerEnter() {
        this._crazySDK.game.gameplayStart();
    }
    dinerExit() {
        this._crazySDK.game.gameplayStop();
    }
    loadingStart() {
        this._crazySDK.game.loadingStart();
    }
    loadingStop() {
        this._crazySDK.game.loadingStop();
    }

    private onEnergyAdded(amount: number, context: ResourceChangeContext) {
        if (GameAnalytics != null) {
            GameAnalytics.addResourceEvent(gameanalytics.EGAResourceFlowType.Source, Currency.Energy, amount, context.type, extractId(context));
        }
    }

    private onEnergyReduced(amount: number, context: ResourceChangeContext) {
        if (GameAnalytics != null) {
            GameAnalytics.addResourceEvent(gameanalytics.EGAResourceFlowType.Sink, Currency.Energy, amount, context.type, extractId(context));
        }
    }

    private addEnergy(amount: number, context: ResourceChangeContext) {
        this._localEnergyService.addEnergy(amount);
        this.onEnergyAdded(amount, context);
    }

    private reduceEnergy(amount: number, context: ResourceChangeContext) {
        this._localEnergyService.reduceEnergy(amount);
        this.onEnergyReduced(amount, context);
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

    sendGa4Event(_eventData: EventData) {
        //Do nothing in local
    }

    //Task persistence
    public async onTaskUpdated(taskId: string, taskUpdatedData: TaskUpdatedEventData): Promise<boolean> {
        try {
            this._saveData = SaveData.updateTaskCompletion(this._saveData, taskId, taskUpdatedData.Completed, taskUpdatedData.Assigned);
            await this._save();
            return true;
        } catch (error) {
            this._log.error('save failed', {
                error
            });
            return false;
        }
    }

    public getDailyPrizePurchaseCount() {
        return 0;
    }

    public async onClaimDailyReward(prizeSlot: number, _selectionIndex: number): Promise<boolean> {
        try {
            // Check if the Xsolla token is available, if it isn't we won't be able to grant rewards and should error out.
            const tokenResult = await this._getToken();
            if (!tokenResult.success) {
                return false;
            }

            this._log.debug('Daily Reward Claimed!');
            this._saveData.dailyPrizeClaimStatus[prizeSlot] = true;
            if (this.onDailyPrizeStateChanged) {
                this.onDailyPrizeStateChanged();
            }

            if (this._dailyPrizeReward) {
                let rewardBox = this._dailyPrizeReward.box1;

                if (prizeSlot === 1) {
                    rewardBox = this._dailyPrizeReward.box2;
                } else if (prizeSlot === 2) {
                    rewardBox = this._dailyPrizeReward.box3;
                }

                // Reward both items.  If something goes wrong, not recovered from at the moment.
                await Promise.all([
                    rewardBox.freeReward
                        ? this._grantItemInfo(
                              rewardBox.freeReward.itemInfo,
                              false,
                              'powerup_dailyprize',
                              rewardBox.freeReward.amount,
                              'dailyreward'
                          )
                        : Promise.resolve(),
                    rewardBox.clubReward
                        ? this._grantItemInfo(
                              rewardBox.clubReward.itemInfo,
                              false,
                              'powerup_dailyprize',
                              rewardBox.clubReward.amount,
                              'dailyreward'
                          )
                        : Promise.resolve()
                ]);
            }

            await Promise.all([this._updateInventoryFromBackend(), this._save()]);

            if (this.onCurrencyChanged) {
                this.onCurrencyChanged();
            }

            return true;
        } catch (error) {
            this._log.error('claim daily reward failed', {
                error
            });
            return false;
        }
    }

    public async getDailyRewardPrizes(): Promise<DailyPrizeRewardState> {
        const prizeConfig = this._config.dailyPrizeConfig;
        const itemConfig = this._config.itemConfig;

        let dayIndex = new Date(this._timeProvider.now).getUTCDay();
        // Special case for Sunday - map to day 7 instead of 0
        if (dayIndex === 0) {
            dayIndex = 7;
        }

        const rewards = await GetDailyRewardState(prizeConfig, itemConfig, this._saveData, dayIndex, this._save.bind(this));
        this._dailyPrizeReward = rewards;
        return this._dailyPrizeReward;
    }

    public timeUntilDailyReset(): number {
        const midnight = new Date(this._timeProvider.now);
        midnight.setUTCHours(23, 59, 59, 999);
        return midnight.getTime() - this._timeProvider.now;
    }

    public async onDialogueSeen(dialogueId: string): Promise<boolean> {
        try {
            this._saveData = SaveData.addSeenDialogue(this._saveData, dialogueId);
            await this._save();
            return true;
        } catch (error) {
            this._log.error('save failed', {
                error
            });
            return false;
        }
    }

    public async unlockRoom(roomId: string): Promise<boolean> {
        this._saveData.roomSaveData.set(roomId, true);
        await this._save();
        return true;
    }

    public isRoomUnlocked(roomId: string) {
        return this._saveData.roomSaveData.has(roomId);
    }

    //Prop persistence
    public async onPropSwapped(nodeId: string, propSwappedData: PropSwappedEventData): Promise<boolean> {
        try {
            this._saveData = SaveData.updateNodeContents(this._saveData, nodeId, propSwappedData.PropId);
            await this._save();
            return true;
        } catch (error) {
            this._log.error('save failed', {
                error
            });
            return false;
        }
    }

    private gainCurrencyNoSave(currency: Currency, amount: number, source: ResourceChangeContext) {
        this._saveData = SaveData.incrementCurrencyAmount(this._saveData, currency, amount);
        if (GameAnalytics != null) {
            GameAnalytics.addResourceEvent(gameanalytics.EGAResourceFlowType.Source, currency, amount, source.type, extractId(source));
        }
    }

    private loseCurrencyNoSave(currency: Currency, amount: number, source: ResourceChangeContext) {
        this._saveData = SaveData.decrementCurrencyAmount(this._saveData, currency, amount);
        if (GameAnalytics != null) {
            GameAnalytics.addResourceEvent(gameanalytics.EGAResourceFlowType.Sink, currency, amount, source.type, extractId(source));
        }
    }

    public async gainCurrency(currency: Currency, amount: number, source: ResourceChangeContext): Promise<boolean> {
        try {
            this.gainCurrencyNoSave(currency, amount, source);
            await this._save();
        } catch (error) {
            this._log.error(`gainCurrency save error`, { error });
            return false;
        }

        return true;
    }

    public async gainCurrencyNoTelemetry(currency: Currency, amount: number): Promise<boolean> {
        try {
            this._saveData = SaveData.incrementCurrencyAmount(this._saveData, currency, amount);
            await this._save();
        } catch (error) {
            this._log.error(`gainCurrency save error`, { error });
            return false;
        }

        return true;
    }

    public async loseCurrency(currency: Currency, amount: number, source: ResourceChangeContext): Promise<boolean> {
        try {
            this.loseCurrencyNoSave(currency, amount, source);
            await this._save();
        } catch (error) {
            this._log.error(`loseCurrency save error`, { error });
            return false;
        }

        return true;
    }

    getInventoryItemCount(itemId: string): number {
        // Check against inventory from Xsolla
        if (this._saveData.inventory.has(itemId)) {
            return this._saveData.inventory.get(itemId);
        }
        return 0;
    }

    // Inventory
    public getEnergy() {
        return this._localEnergyService.getCurrentEnergy();
    }

    public getMaxEnergy() {
        return this._localEnergyService.getEnergySoftCap();
    }

    public timeUntilNextEnergy() {
        return this._localEnergyService.getTimeUntilNextEnergy();
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
                return this._inventory?.plusSevenCardsCount ?? 0;
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
        return 0;
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

    private async _usePowerup(powerupType: PowerupType, amount: number, context: ResourceChangeContext): Promise<void> {
        await this._consumeInventoryBackend(this._getIdFromPowerupType(powerupType), amount);
        if (GameAnalytics != null) {
            GameAnalytics.addResourceEvent(
                gameanalytics.EGAResourceFlowType.Sink,
                sanitizeResource(powerupType),
                1,
                context.type,
                extractId(context)
            );
        }
    }

    private async _useBooster(boosterType: BoosterType, amount: number, context: ResourceChangeContext): Promise<void> {
        await this._consumeInventoryBackend(this._getIdFromBoosterType(boosterType), amount);
        if (GameAnalytics != null) {
            GameAnalytics.addResourceEvent(
                gameanalytics.EGAResourceFlowType.Sink,
                sanitizeResource(boosterType),
                1,
                context.type,
                extractId(context)
            );
        }
    }

    public async usePowerup(powerupType: PowerupType): Promise<void> {
        return this._usePowerup(powerupType, 1, {
            type: 'level',
            levelId: this._gameContext.puzzleId ?? 'unknown'
        });
    }

    public async useBooster(boosterType: BoosterType): Promise<void> {
        return this._useBooster(boosterType, 1, {
            type: 'level',
            levelId: this._gameContext.puzzleId ?? 'unknown'
        });
    }

    public cheat_spendPowerup(powerupType: PowerupType, delta: number): Promise<void> {
        return this._usePowerup(powerupType, delta, {
            type: 'debug'
        });
    }

    public cheat_spendBooster(boosterType: BoosterType, delta: number): Promise<void> {
        return this._useBooster(boosterType, delta, {
            type: 'debug'
        });
    }

    private async _consumeInventoryBackend(itemID: string, quantity: number): Promise<void> {
        await this._xsollaConsumeInventory(itemID, quantity);
        await this._updateInventoryFromBackend();
    }

    private _getIdFromPowerupType(powerupType: PowerupType) {
        switch (powerupType) {
            case PowerupType.Joker:
                return BackendCrazyGames.STAT_powerup_joker;
            case PowerupType.ExtraServings:
                return BackendCrazyGames.STAT_powerup_extra_servings;
            case PowerupType.FreeDessert:
                return BackendCrazyGames.STAT_powerup_free_dessert;
            case PowerupType.Refire:
                return BackendCrazyGames.STAT_powerup_refire;
            case PowerupType.Plus7Cards:
                return BackendCrazyGames.STAT_powerup_plus7_cards;
            case PowerupType.CookingTheBooks:
                return BackendCrazyGames.STAT_powerup_cooking_the_books;
            case PowerupType.CleanDown:
                return BackendCrazyGames.STAT_powerup_clean_down;
        }
    }

    private _getIdFromBoosterType(booster: BoosterType) {
        switch (booster) {
            case BoosterType.LoosenTheBelt:
                return BackendCrazyGames.STAT_powerup_loosen_the_belt;
            case BoosterType.DeucesWild:
                return BackendCrazyGames.STAT_powerup_deuces_wild;
        }
    }

    // Store
    public async openStore() {}

    public async getCurrencyBalances(): Promise<CurrencyAndAmount[]> {
        let currencies: CurrencyAndAmount[] = [];

        // STARS
        let starCount = 0;
        if (this._saveData.currencySaveData.has(Currency.Stars)) {
            starCount = this._saveData.currencySaveData.get(Currency.Stars).amount;
        }
        currencies.push(new CurrencyAndAmount(Currency.Stars, starCount as number));

        // COINS
        let coinCount = 0;
        if (this._saveData.currencySaveData.has(Currency.Coins)) {
            coinCount = this._saveData.currencySaveData.get(Currency.Coins).amount;
        }
        currencies.push(new CurrencyAndAmount(Currency.Coins, coinCount as number));

        // Gems
        const result = await this._xsollaGetVirtualCurrencyBalance();
        if (!isXsollaError(result)) {
            for (const virtualCurrencyData of result.data.items) {
                const currency = SKUToCurrency[virtualCurrencyData.sku];

                if (currency && currency === Currency.Gems) {
                    currencies.push(new CurrencyAndAmount(currency, virtualCurrencyData.amount));
                }
            }
        } else {
            currencies.push(new CurrencyAndAmount(Currency.Gems, 0));
        }

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

    public redirectToPremiumCurrencyStore(): void {
        this._showStore(['premium']);
    }

    /**
     * All currency bundles / store items / item bundles should overwrite their local data with data from Xsolla
     * Remove externalIDs from the catalog except Xsolla ones.
     * @returns A catolog of items to use in the store     *
     */
    public async getCatalog(): Promise<CatalogItem[]> {
        const xsollaItems = new Map<string, CatalogItem>();

        // TODO: Maybe conver to Promise.all
        const virtualCurrencyPacks = await this._xsollaGetVirtualCurrencyPackages();
        const catalogItems = await this._xsollaGetStoreItems();
        const bundles = await this._xsollaGetBundles();

        // Override VC Packs
        if (!isXsollaError(virtualCurrencyPacks)) {
            virtualCurrencyPacks.data.items.forEach((virtualCurrencyPack) => {
                const catalogItem = this._externalIDMap.get(virtualCurrencyPack.sku);

                if (catalogItem !== undefined) {
                    xsollaItems.set(catalogItem.id, this._mergeVirtualCurrencyPackageToCatalogItem(catalogItem, virtualCurrencyPack));
                }
            });
        }

        // Override Catalog Items (Powerups on Xsolla)
        if (!isXsollaError(catalogItems)) {
            catalogItems.data.items.forEach((item) => {
                const catalogItem = this._externalIDMap.get(item.sku);

                if (catalogItem !== undefined) {
                    xsollaItems.set(catalogItem.id, this._mergeStoreItemToCatalogItem(catalogItem, item));
                }
            });
        }

        // Override bundles
        if (!isXsollaError(bundles)) {
            bundles.data.items.forEach((bundle) => {
                const catalogItem = this._externalIDMap.get(bundle.sku);

                if (catalogItem !== undefined) {
                    xsollaItems.set(catalogItem.id, this._mergeBundleIntoCatalogItem(catalogItem, bundle));
                }
            });
        }

        const catalog: CatalogItem[] = this._config.storeConfig.items;

        for (let i = catalog.length - 1; i >= 0; i--) {
            const catalogItem = catalog[i];
            if (!this._isPurchaseWithinPurchaseCountLimits(catalogItem)) {
                catalog.splice(i, 1);
            } else {
                if (xsollaItems.get(catalogItem.id)) {
                    catalog[i] = xsollaItems.get(catalogItem.id); // Overwrite with Xsolla item
                }
            }
        }

        return catalog;
    }

    public async purchase(catalogItem: CatalogItem, storeType: StoreType) {
        if (!catalogItem) {
            return new PurchaseResult(PurchaseStatus.Error, UnexpectedStoreErrorMessage);
        }

        // Check purchase limits
        if (!this._isPurchaseWithinPurchaseCountLimits(catalogItem)) {
            this._log.warn(`Attempting to purchase item over purchase limit count`, { item: catalogItem });
            return new PurchaseResult(PurchaseStatus.Error, 'You cannot purchase this item again.');
        }

        const result = await this._purchaseItem(catalogItem, storeType);

        // If the purchase didn't succeed, no need to grant rewards
        if (result.Status !== PurchaseStatus.Success) {
            return result;
        }

        await this._grantCatalogItem(catalogItem, storeType);

        this._saveData = SaveData.incrementPurchaseCount(this._saveData, catalogItem.id);

        await this._save();
        await this._updateInventoryFromBackend();

        if (this.onCurrencyChanged) {
            this.onCurrencyChanged();
        }

        return result;
    }

    public showPurchaseSuccessPopup(): boolean {
        return true;
    }

    private async _updateInventoryFromBackend() {
        const inventoryResult = await this._xsollaGetInventory();

        if (!isXsollaError(inventoryResult)) {
            this._inventory = new CrazyInventory();

            inventoryResult.data.items.forEach((item) => {
                if (item.sku === BackendCrazyGames.STAT_powerup_deuces_wild) {
                    this._inventory.deucesWildCount = item.quantity;
                }
                if (item.sku === BackendCrazyGames.STAT_powerup_loosen_the_belt) {
                    this._inventory.loosenTheBeltCount = item.quantity;
                }
                if (item.sku === BackendCrazyGames.STAT_powerup_cooking_the_books) {
                    this._inventory.cookingTheBooksCount = item.quantity;
                }
                if (item.sku === BackendCrazyGames.STAT_powerup_extra_servings) {
                    this._inventory.extraServingsCount = item.quantity;
                }
                if (item.sku === BackendCrazyGames.STAT_powerup_joker) {
                    this._inventory.jokerCount = item.quantity;
                }
                if (item.sku === BackendCrazyGames.STAT_powerup_refire) {
                    this._inventory.refireCount = item.quantity;
                }
                if (item.sku === BackendCrazyGames.STAT_powerup_plus7_cards) {
                    this._inventory.plusSevenCardsCount = item.quantity;
                }
                if (item.sku === BackendCrazyGames.STAT_powerup_free_dessert) {
                    this._inventory.freeDessertCount = item.quantity;
                }
                if (item.sku === BackendCrazyGames.STAT_powerup_clean_down) {
                    this._inventory.cleanDownCount = item.quantity;
                }
            });
        } else {
            this._inventory = new CrazyInventory();
        }
    }

    private async _clearLingeringCoins() {
        const result = await this._xsollaGetVirtualCurrencyBalance();
        if (!isXsollaError(result)) {
            for (const virtualCurrencyData of result.data.items) {
                const currency = ConsumeCurrencies[virtualCurrencyData.sku];
                if (currency === Currency.Coins && virtualCurrencyData.amount > 0) {
                    const consume = await this._xsollaConsumeInventory(virtualCurrencyData.sku, virtualCurrencyData.amount);
                    this._log.info('Removing lingering coin balance', { success: consume.success });

                    await this.gainCurrencyNoTelemetry(currency, virtualCurrencyData.amount);
                }
            }
        }
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

    // Cheats
    cheat_resetUser() {
        if (!this._config.cheats) {
            return;
        }
        this._saveData = new SaveData();
        this._save();
    }
    cheat_setUserSave(saveData: string) {
        if (!this._config.cheats) {
            return;
        }
        this._saveData = SaveData.fromJson(saveData);
        this._save();
    }
    cheat_resetMysteryRewards() {
        // TODO:
    }
    cheat_resetEnergyAutoIncome() {
        // TODO:
    }
    cheat_resetInfiniteEnergy() {
        // TODO:
    }

    cheat_consumeBooster(booster: BoosterType) {
        this._consumeInventoryBackend(this._getIdFromBoosterType(booster), 1);
    }

    cheat_grantCurrency(name: string, amount: number) {
        if (!this._config.cheats) {
            return;
        }
        return this.gainCurrency(name as Currency, amount, {
            type: 'debug'
        });
    }

    async cheat_grantItem(item: string, delta: number) {
        if (!this._config.cheats) {
            return;
        }
        this._saveData = SaveData.incrementInventoryItemCount(this._saveData, item, delta);
        await this._updateInventoryFromBackend();
        await this._save();
    }

    async cheat_grantBooster(booster: BoosterType, delta: number) {
        if (!this._config.cheats) {
            return;
        }
        return this.cheat_grantItem(booster, delta);
    }

    async cheat_grantPowerup(powerup: PowerupType, delta: number) {
        if (!this._config.cheats) {
            return;
        }
        return this.cheat_grantItem(powerup, delta);
    }

    addCheats(debugService: IDebugService) {
        debugService.addDebugButton('Grant +100 Gems', 'Cheats', this.cheat_grantGems.bind(this, 100));
        debugService.addDebugButton('-1 Booster: Loosen the belt', 'Cheats', this._cheat_consumeBooster.bind(this, BoosterType.LoosenTheBelt));
        debugService.addDebugButton('Test Gem Reward', 'Cheats', this._cheat_testGemReward.bind(this));
        debugService.addDebugButton('Reset Daily Prize', 'Cheats', this._cheat_resetDailyPrize.bind(this));
        debugService.addDebugButton('Print Xsolla Inventory', 'Cheats', this._cheat_printInventory.bind(this));
        debugService.addDebugButton('Clear Xsolla Inventory', 'Cheats', this._cheat_clearInventory.bind(this));
    }

    private async _cheat_testGemReward() {
        if (!this._config.cheats) {
            return;
        }
        await this._grantVirtualCurrency(Currency.Gems, 100, {
            type: 'debug'
        });
        if (this.onCurrencyChanged) {
            this.onCurrencyChanged();
        }
    }

    private _cheat_consumeBooster(booster: BoosterType) {
        if (!this._config.cheats) {
            return;
        }

        this.cheat_consumeBooster(booster);
    }

    private async _cheat_printInventory() {
        await this._updateInventoryFromBackend();
        this._log.info(JSON.stringify(this._inventory));
    }

    private async _cheat_clearInventory() {
        const inventoryResult = await this._xsollaGetInventory();
        if (!isXsollaError(inventoryResult)) {
            for (const item of inventoryResult.data.items) {
                // Try clearing it
                const result = await this._xsollaConsumeInventory(item.sku, item.quantity);
                this._log.info('Clearing inventory', { sku: item.sku, success: result.success });
            }
        }

        await this._updateInventoryFromBackend();

        if (this.onCurrencyChanged) {
            this.onCurrencyChanged();
        }
    }

    private async cheat_grantGems(delta: number) {
        await this._grantVirtualCurrency(Currency.Gems, delta, { type: 'debug' });
        if (this.onCurrencyChanged) {
            this.onCurrencyChanged();
        }
    }

    private async _cheat_resetDailyPrize() {
        if (!this._config.cheats) {
            return;
        }

        this._saveData.dailyPrizeClaimStatus = [false, false, false];
        this._saveData.dailyPrizeLastDay = -1;

        this._save();
    }

    private _updateInventory(itemId: string, amount: number) {
        this._saveData = SaveData.incrementInventoryItemCount(this._saveData, itemId, amount);
    }

    private async _load(): Promise<void> {
        // This doesn't need to be async, but other IBackend instances will be async
        // so keep consistent with other services
        return new Promise((resolve) => {
            setTimeout(() => {
                const savedData = this._crazySDK.data.getItem('saveData');
                if (savedData) {
                    this._saveData = SaveData.fromJson(savedData);
                } else {
                    this._saveData = new SaveData();
                }
                this._log.debug(`BackendCrazyGames._load: `, this._saveData);
                resolve();
            }, 0);
        });
    }

    private async _save(): Promise<boolean> {
        // This doesn't need to be async, but other IBackend instances will be async
        // so keep consistent with other services
        const serializedData = JSON.stringify(this._saveData.toJson());
        return new Promise((resolve) => {
            setTimeout(() => {
                this._crazySDK.data.setItem('saveData', serializedData);
                this._log.debug(`BackendCrazyGames._save: `, { saveData: serializedData });
                resolve(true);
            }, 0);
        });
    }

    // Figure out where to place these best in the interface later
    private _crazyLoadStartEvent() {
        this._crazySDK.game.loadingStart();
    }

    private _crazyLoadStopEvent() {
        this._crazySDK.game.loadingStop();
    }

    private _crazyShowInterstitial(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this._crazySDK.ad.requestAd('midgame', {
                adError: (error) => {
                    this._log.info('Ad error', error);
                    this._crazyOnEndAd();
                    resolve(false);
                },
                adStarted: () => {
                    this._log.info('Ad started');
                    this._crazyOnBeginAd();
                },
                adFinished: () => {
                    this._log.info('Ad finished');
                    this._crazyOnEndAd();
                    resolve(true);
                }
            });
        });
    }

    private _crazyOnBeginAd() {
        SoundManager.instance.stopAllMusic();
    }

    private _crazyOnEndAd() {
        SoundManager.instance.restartMusic();
    }

    private _mergeVirtualCurrencyPackageToCatalogItem(item: CatalogItem, vc: VirtualCurrencyPackage): CatalogItem {
        let merged = CatalogItem.fromItem(item);

        merged.externalIds = [vc.sku];
        merged.name = vc.name;

        merged.cost = this._getCostFromXsolla(vc.sku, vc.virtual_prices, vc.price, vc.is_free);
        merged.description = vc.description;

        return merged;
    }

    private _mergeStoreItemToCatalogItem(item: CatalogItem, storeItem: StoreItem): CatalogItem {
        let merged = CatalogItem.fromItem(item);

        merged.externalIds = [storeItem.sku];
        merged.name = storeItem.name;

        merged.cost = this._getCostFromXsolla(storeItem.sku, storeItem.virtual_prices, storeItem.price, storeItem.is_free);
        merged.description = storeItem.description;

        return merged;
    }

    private _mergeBundleIntoCatalogItem(item: CatalogItem, bundle: StoreBundle): CatalogItem {
        let merged = CatalogItem.fromItem(item);

        merged.externalIds = [bundle.sku];
        merged.name = bundle.name;

        merged.cost = this._getCostFromXsolla(bundle.sku, bundle.virtual_prices, bundle.price, bundle.is_free);
        merged.description = bundle.description;

        return merged;
    }

    // Assuming only one cost is valid per item on Xsolla at the moment to line up with one per CatalogItem.
    private _getCostFromXsolla(id: string, virtualPrices: VirtualCurrencyPrice[], price: Price, isFree: boolean): CurrencyAndAmount {
        // If a valid price is set, it costs real money
        if (price !== undefined && price !== null) {
            return new CurrencyAndAmount(Currency.Real, parseFloat(price.amount));
        } else if (virtualPrices.length > 0) {
            if (virtualPrices.length > 1) {
                this._log.warn('More than one virtual currency setup for item.  Not supported at this time', { id: id });
            }

            const currency = SKUToCurrency[virtualPrices[0].sku];
            if (currency) {
                return new CurrencyAndAmount(currency, virtualPrices[0].amount);
            }
        } else if (isFree) {
            return new CurrencyAndAmount(Currency.Coins, 0);
        } else {
            this._log.warn('No valid currencies setup for item', { id: id });
        }
    }

    private _inXsollaCatalog(catalogItem: CatalogItem): boolean {
        return catalogItem.externalIds.length > 0;
    }

    private _setupCatalog() {
        this._externalIDMap = new Map<string, CatalogItem>();

        this._config.storeConfig.items.forEach((item) => {
            item.externalIds = item.externalIds.filter((id) => id.startsWith('XSOLLA.')).map((id) => id.substring('XSOLLA.'.length));
        });

        this._config.storeConfig.items.forEach((item) => {
            item.externalIds.forEach((id) => {
                this._externalIDMap.set(id, item);
            });
        });
    }

    //#region Purchasing

    private _purchaseItem(catalogItem: CatalogItem, storeType: StoreType): Promise<PurchaseResult> {
        const managedByXsolla = this._inXsollaCatalog(catalogItem);
        const currency = catalogItem.cost.currency;

        if (currency === Currency.Real) {
            if (managedByXsolla) {
                return this._purchaseForRealCurrency(catalogItem, storeType);
            } else {
                return Promise.resolve(new PurchaseResult(PurchaseStatus.Error, UnexpectedStoreErrorMessage));
            }
        } else if (currency === Currency.Gems) {
            if (managedByXsolla) {
                return this._purchaseExternalSkuForVirtualCurrency(catalogItem, storeType);
            } else {
                return this._purchaseCatalogItemForVirtualCurrency(catalogItem, storeType);
            }
        } else if (currency === Currency.Coins && catalogItem.cost.amount === 0 && managedByXsolla) {
            return this._claimFreeCatalogItemOrBundle(catalogItem, storeType);
        } else {
            return this._purchaseLocal(catalogItem, storeType);
        }
    }

    private async _purchaseForRealCurrency(catalogItem: CatalogItem, storeType: StoreType): Promise<PurchaseResult> {
        const paymentTokenResult = await this._xsollaPurchaseForRealCurrency(catalogItem.externalIds[0], 1);

        if (!isXsollaError(paymentTokenResult)) {
            const paymentToken = paymentTokenResult.data;
            return await new Promise<PurchaseResult>((resolve) => {
                let settled = false;
                // Start tracking the specific order.  When the order goes through successfully, wait and resolve as a successful purchase
                OrderTracker.checkPendingOrder(
                    paymentToken.token,
                    paymentToken.orderId,
                    () => {
                        if (!settled) {
                            if (this._sendBusinessEvents && GameAnalytics != null) {
                                // assume USD
                                GameAnalytics.addBusinessEvent(
                                    'USD',
                                    Math.round(catalogItem.cost.amount * 100),
                                    'catalogItem',
                                    catalogItem.id,
                                    storeType
                                );
                            }
                            settled = true;
                            resolve(new PurchaseResult(PurchaseStatus.Success));
                        }
                    },
                    (error) => {
                        if (!settled) {
                            settled = true;
                            resolve(new PurchaseResult(PurchaseStatus.Error, error.description));
                        }
                    }
                );

                // Open up the payment widget to proceed with the order.
                // TODO: Figure out how best to handle this closing.  If it's closed by clicking away it should still close the UI.  Maybe add a Cancelled state? What happens if the order goes through and you close manually
                XsollaPayments.openPurchaseUI(paymentToken.token, (closedManually) => {
                    if (!settled && closedManually) {
                        settled = true;
                        resolve(new PurchaseResult(PurchaseStatus.Cancelled, 'Cancelled Manually'));
                    }
                });
            });
        } else {
            return new PurchaseResult(PurchaseStatus.Error, 'Error fetching payment token');
        }
    }

    private async _purchaseExternalSkuForVirtualCurrency(catalogItem: CatalogItem, storeType: StoreType): Promise<PurchaseResult> {
        const result = await this._xsollaPurchaseForVirtualCurrency(catalogItem.externalIds[0], CurrencyToSKU[catalogItem.cost.currency]);

        if (!isXsollaError(result)) {
            if (GameAnalytics != null) {
                const context: ResourceChangeContext = {
                    type: storeType,
                    sku: catalogItem.id
                };
                GameAnalytics.addResourceEvent(
                    gameanalytics.EGAResourceFlowType.Sink,
                    catalogItem.cost.currency,
                    catalogItem.cost.amount,
                    context.type,
                    extractId(context)
                );
            }

            return new PurchaseResult(PurchaseStatus.Success);
        } else {
            return new PurchaseResult(PurchaseStatus.Error, 'Error purchasing with virtual currency');
        }
    }

    private async _purchaseCatalogItemForVirtualCurrency(catalogItem: CatalogItem, storeType: StoreType): Promise<PurchaseResult> {
        const currencyBalance = await this.getCurrencyBalance(catalogItem.cost.currency);
        if (catalogItem.cost.amount > currencyBalance) {
            return new PurchaseResult(PurchaseStatus.InsufficientCurrency, `Insufficient funds to purchase ${catalogItem.name}`);
        }

        const currencySku = CurrencyToSKU[catalogItem.cost.currency];
        if (currencySku) {
            const result = await this._xsollaConsumeInventory(currencySku, catalogItem.cost.amount);

            if (!isXsollaError(result)) {
                if (GameAnalytics != null) {
                    const context: ResourceChangeContext = {
                        type: storeType,
                        sku: catalogItem.id
                    };
                    GameAnalytics.addResourceEvent(
                        gameanalytics.EGAResourceFlowType.Sink,
                        catalogItem.cost.currency,
                        catalogItem.cost.amount,
                        context.type,
                        extractId(context)
                    );
                }
                return new PurchaseResult(PurchaseStatus.Success);
            } else {
                return new PurchaseResult(PurchaseStatus.Error, 'Unable to consume virtual currency');
            }
        } else {
            this._log.error('No SKU found for currency', { itemId: catalogItem.id, currency: catalogItem.cost.currency });
            return new PurchaseResult(PurchaseStatus.Error, 'No SKU found for currency');
        }
    }

    private async _purchaseLocal(catalogItem: CatalogItem, storeType: StoreType): Promise<PurchaseResult> {
        const currencyBalance = await this.getCurrencyBalance(catalogItem.cost.currency);
        if (catalogItem.cost.amount > currencyBalance) {
            return new PurchaseResult(PurchaseStatus.InsufficientCurrency, `Insufficient funds to purchase ${catalogItem.name}`);
        }

        this.loseCurrencyNoSave(catalogItem.cost.currency, catalogItem.cost.amount, {
            type: storeType,
            sku: catalogItem.id
        });

        return new PurchaseResult(PurchaseStatus.Success);
    }

    private async _claimFreeCatalogItemOrBundle(catalogItem: CatalogItem, storeType: StoreType): Promise<PurchaseResult> {
        const result = await this._xsollaCreateOrderWithSpecifiedFreeItem(catalogItem.externalIds[0], 1);

        if (!isXsollaError(result)) {
            this._log.info('Currency rewarded');

            if (GameAnalytics != null) {
                const context = {
                    type: storeType,
                    sku: catalogItem.externalIds[0]
                };
                GameAnalytics.addResourceEvent(gameanalytics.EGAResourceFlowType.Source, catalogItem.id, 1, storeType, extractId(context));
            }

            return new PurchaseResult(PurchaseStatus.Success);
        } else {
            return new PurchaseResult(PurchaseStatus.Error, result.error.description);
        }
    }
    //#endregion

    // #region Item Granting

    /**
     * Some currencies and items are managed by Xsolla, and are on there as a Virtual Item or a Virtual Currency and same are managed locally.
     * Currencies: Gems are managed on Xsolla, while Coins, Energy, and Stars are all managed locally.
     * Items: Powerups and Boosters are managed by Xsolla, while Decorations are managed locally.
     * For Catalog Items that are in the Xsolla catalog, they'll award any Xsolla managed items on the backend and we don't need to worry about those.  We will still grant any locally managed items
     * For Catalog Items that aren't in the Xsolla catalog (Such as the Plus 7 Cards powerup purchased with coins), we additionally need to grant any rewards that are managed on Xsolla through the client via @see _grantXsollaItem     *
     */
    private async _grantCatalogItem(catalogItem: CatalogItem, storeType: StoreType) {
        for (const itemAndAmount of catalogItem.contents) {
            const itemInfo = this._config.itemConfig.getItemInfo(itemAndAmount?.id);

            if (itemInfo) {
                const managedByXsolla = this._inXsollaCatalog(catalogItem);
                await this._grantItemInfo(itemInfo, managedByXsolla, catalogItem.id, itemAndAmount.amount, storeType);
            }
            // Props in diner don't have items in item definitions
            else {
                this._updateLocalInventory(itemAndAmount.id, itemAndAmount.amount);
            }
        }
    }

    private async _grantItemInfo(itemInfo: ItemInfo, managedByXsolla: boolean, sku: string, amount: number, storeType: StoreType) {
        if (itemInfo.type === ItemType.Currency) {
            switch (itemInfo.id) {
                case Currency.Real:
                    break;
                case Currency.Gems:
                    // I don't think anything goes through this path at the moment.  Similar to the powerups, this has a chance to fail that isn't recovered from yet
                    if (!managedByXsolla) {
                        await this._grantXsollaItem(itemInfo, amount, storeType);
                    }
                    break;
                case Currency.Energy:
                    this.addEnergy(amount, {
                        type: storeType,
                        sku: sku
                    });
                    break;
                default:
                    this.gainCurrencyNoSave(itemInfo.id as Currency, amount, {
                        type: storeType,
                        sku: sku
                    });
                    break;
            }

            // If it's a currency that should be consumed
            const currencySku = ConsumeCurrencies[itemInfo.id];

            if (currencySku) {
                const consumeResult = await this._xsollaConsumeInventory(currencySku, amount);
                this._log.info('Currency consumed', { result: consumeResult });
            }
        } // Powerups and Boosters
        else if (itemInfo.type === ItemType.PowerUp || itemInfo.type === ItemType.Booster) {
            if (!managedByXsolla) {
                // Has a chance to fail, but isn't recovered from.  May lose coins
                // Only affects plus7cards powerup at the moment
                await this._grantXsollaItem(itemInfo, amount, storeType);
            }
        }
    }

    private async _grantXsollaItem(item: ItemInfo, count: number, storeType: StoreType) {
        let sku = item.externalId;
        if (item.type === ItemType.Currency) {
            sku = CurrencyToSKU[item.externalId];
        }

        if (sku === undefined || sku === null) {
            return;
        }
        const result = await this._xsollaCreateOrderWithSpecifiedFreeItem(sku, count);
        if (result.success) {
            if (GameAnalytics != null) {
                GameAnalytics.addResourceEvent(gameanalytics.EGAResourceFlowType.Source, item.id, count, storeType, sku);
            }
        }
    }

    private async _grantVirtualCurrency(currency: Currency, count: number, context: ResourceChangeContext) {
        const sku = CurrencyToSKU[currency];

        if (sku !== undefined && sku !== null) {
            return;
        }
        const result = await this._xsollaCreateOrderWithSpecifiedFreeItem(sku, count);
        if (result.success) {
            if (GameAnalytics != null) {
                GameAnalytics.addResourceEvent(gameanalytics.EGAResourceFlowType.Source, currency, count, context.type, extractId(context));
            }
        }
    }

    private _updateLocalInventory(itemId: string, amount: number) {
        this._saveData = SaveData.incrementInventoryItemCount(this._saveData, itemId, amount);
    }
    //#endregion

    private _crazyAuthListener(user: PortalUser) {
        if (user !== null) {
            this._entitlement = EntitlementType.Premium;
        } else {
            this._entitlement = EntitlementType.Guest;
        }
    }

    //#region Token Fetching
    private async _getToken(): Promise<XsollaResult<string, TokenError>> {
        if (this._crazyGamesConfig?.debug) {
            return this._getCustomProjectToken(this._crazyGamesConfig.debug);
        } else {
            return this._getCrazyGamesToken();
        }
    }

    private async _getCustomProjectToken({ email, password }: { email: string; password: string }): Promise<XsollaResult<string, TokenError>> {
        try {
            let cachedToken = TokenStorage.getToken();
            if (cachedToken) {
                if (!TokenUtils.isTokenExpired(cachedToken)) {
                    this._log.debug(`Cached token login. Token - ${cachedToken.access_token}`);
                    return { success: true, data: cachedToken.access_token };
                }
            }
            // Wrap the callback API in a Promise
            return await new Promise<XsollaResult<string, TokenError>>((resolve) => {
                XsollaAuth.authByUsernameAndPassword(
                    email,
                    password,
                    true,
                    (token) => {
                        this._log.debug(`Successful login. Token - ${token.access_token}`);
                        TokenStorage.saveToken(token, true);
                        resolve({ success: true, data: token.access_token });
                    },
                    (err) => {
                        this._log.error('Error authorizing with Xsolla', { Error: err });
                        resolve({ success: false, error: { code: err.code, description: err.description } });
                    }
                );
            });
        } catch (error) {
            return { success: false, error: error?.message ?? 'Unknown error' };
        }
    }

    private async _getCrazyGamesToken(): Promise<XsollaResult<string, TokenError>> {
        try {
            const token = await this._crazySDK.user.getXsollaUserToken();
            return { success: true, data: token };
        } catch (error) {
            return { success: false, error: error?.message ?? 'Unknown error' };
        }
    }
    //#endregion

    //#region Xsolla Calls
    private async _xsollaConsumeInventory(sku: string, quantity: number): Promise<XsollaResult<void, XsollaError>> {
        const token = await this._getToken();

        if (isXsollaError(token)) {
            return { success: false, error: token.error };
        }

        const result = await xsollaPromiseWrapper<void, CommerceError>((onComplete, onError) => {
            XsollaInventory.consumeInventoryItem(token.data, sku, quantity, null, null, onComplete, onError);
        });

        if (isXsollaError(result)) {
            this._log.error('Error consuming inventory item on backend', { code: result.error.code, description: result.error.description });
        }

        return result;
    }

    private async _xsollaGetVirtualCurrencyBalance(): Promise<XsollaResult<VirtualCurrencyBalanceData, XsollaError>> {
        const token = await this._getToken();

        if (isXsollaError(token)) {
            return { success: false, error: token.error };
        }

        const result = await xsollaPromiseWrapper<VirtualCurrencyBalanceData, CommerceError>((onComplete, onError) => {
            XsollaInventory.getVirtualCurrencyBalance(token.data, null, onComplete, onError);
        });

        if (isXsollaError(result)) {
            this._log.error('Error consuming inventory item on backend', { code: result.error.code, description: result.error.description });
        }

        return result;
    }

    private async _xsollaGetVirtualCurrencyPackages(): Promise<XsollaResult<VirtualCurrencyPackagesData, XsollaError>> {
        const token = await this._getToken();

        if (isXsollaError(token)) {
            return { success: false, error: token.error };
        }

        const virtualCurrencyPacks = await xsollaPromiseWrapper<VirtualCurrencyPackagesData, CommerceError>((onComplete, onError) => {
            XsollaCatalog.getVirtualCurrencyPackages('', '', [], onComplete, onError, undefined, undefined, token.data);
        });

        if (isXsollaError(virtualCurrencyPacks)) {
            this._log.error('Error fetching virtual currency packages', {
                code: virtualCurrencyPacks.error.code,
                description: virtualCurrencyPacks.error.description
            });
        }

        return virtualCurrencyPacks;
    }

    private async _xsollaGetStoreItems(): Promise<XsollaResult<StoreItemsData, XsollaError>> {
        const token = await this._getToken();

        if (isXsollaError(token)) {
            return { success: false, error: token.error };
        }

        const storeItemsData = await xsollaPromiseWrapper<StoreItemsData, CommerceError>((onComplete, onError) => {
            XsollaCatalog.getCatalog('', '', [], onComplete, onError, undefined, undefined, token.data);
        });

        if (isXsollaError(storeItemsData)) {
            this._log.error('Error fetching catalog', {
                code: storeItemsData.error.code,
                description: storeItemsData.error.description
            });
        }

        return storeItemsData;
    }

    private async _xsollaGetBundles(): Promise<XsollaResult<StoreListOfBundles, XsollaError>> {
        const token = await this._getToken();

        if (isXsollaError(token)) {
            return { success: false, error: token.error };
        }

        const bundlesData = await xsollaPromiseWrapper<StoreListOfBundles, CommerceError>((onComplete, onError) => {
            XsollaCatalog.getBundleList('', '', [], onComplete, onError, undefined, undefined, token.data);
        });

        if (isXsollaError(bundlesData)) {
            this._log.error('Error fetching bundles', {
                code: bundlesData.error.code,
                description: bundlesData.error.description
            });
        }

        return bundlesData;
    }

    private async _xsollaGetInventory(): Promise<XsollaResult<InventoryItemsData, XsollaError>> {
        const token = await this._getToken();

        if (isXsollaError(token)) {
            return { success: false, error: token.error };
        }

        const inventoryResult = await xsollaPromiseWrapper<InventoryItemsData, CommerceError>((onComplete, onError) => {
            XsollaInventory.getInventory(token.data, null, onComplete, onError, undefined, undefined);
        });

        if (isXsollaError(inventoryResult)) {
            this._log.error('Error retrieving inventory', {
                code: inventoryResult.error.code,
                description: inventoryResult.error.description
            });
        }

        return inventoryResult;
    }

    private async _xsollaPurchaseForRealCurrency(sku: string, quantity: number): Promise<XsollaResult<PaymentTokenResult, XsollaError>> {
        const token = await this._getToken();

        if (isXsollaError(token)) {
            return { success: false, error: token.error };
        }

        const paymentToken = await xsollaPromiseWrapper<PaymentTokenResult, CommerceError>((onComplete, onError) => {
            XsollaCatalog.fetchPaymentToken(
                token.data,
                sku,
                quantity,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                onComplete,
                onError
            );
        });

        if (isXsollaError(paymentToken)) {
            this._log.error('Error fetching payment token', {
                code: paymentToken.error.code,
                description: paymentToken.error.description
            });
        }

        return paymentToken;
    }

    private async _xsollaPurchaseForVirtualCurrency(sku: string, currencySku: string): Promise<XsollaResult<number, XsollaError>> {
        const token = await this._getToken();

        if (isXsollaError(token)) {
            return { success: false, error: token.error };
        }

        const result = await xsollaPromiseWrapper<number, CommerceError>((onComplete, onError) => {
            XsollaCatalog.purchaseItemForVirtualCurrency(token.data, sku, currencySku, onComplete, onError);
        });

        if (isXsollaError(result)) {
            this._log.error('Error purchasing with virtual currency', {
                code: result.error.code,
                description: result.error.description
            });
        }

        return result;
    }

    private async _xsollaCreateOrderWithSpecifiedFreeItem(itemSKU: string, quantity: number): Promise<XsollaResult<number, XsollaError>> {
        const token = await this._getToken();

        if (isXsollaError(token)) {
            return { success: false, error: token.error };
        }

        const result = await xsollaPromiseWrapper<number, CommerceError>((onComplete, onError) => {
            XsollaCatalog.createOrderWithSpecifiedFreeItem(token.data, itemSKU, quantity, undefined, undefined, undefined, onComplete, onError);
        });

        if (isXsollaError(result)) {
            this._log.error('Error creating order with specified free item', {
                code: result.error.code,
                description: result.error.description
            });
        }

        return result;
    }
    // #endregion
}

function levelIndexParameter(levelIndex: number) {
    return `level-${levelIndex}`;
}
