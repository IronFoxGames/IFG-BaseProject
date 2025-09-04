import { sys } from 'cc';
import { AppConfig } from '../../../config/AppConfig';
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
import { PuzzleCompleteEventData } from '../../../core/model/PuzzleCompleteEventData';
import { TaskUpdatedEventData } from '../../../core/model/TaskCompleteEventData';
import { Utils } from '../../../core/Utils';
import { logger } from '../../../logging';
import { DailyPrizeRewardState, DailyReward, DailyRewardBox } from '../../DailyPrizeRewardState';
import { IBackend } from '../../IBackend';
import { IDebugService } from '../../IDebugService';
import { StoreType } from '../../IStore';
import { ResourceChangeContext } from '../../ResourceChangeContext';
import { SaveData } from '../../SaveData';
import { LocalEnergyService } from '../common/LocalEnergyService';
import { createRemoteTimeProvider } from '../common/TimeProvider';

export class BackendLocal implements IBackend {
    public onDailyPrizeStateChanged: () => void;
    public onCurrencyChanged: () => void;
    public onBackendSettingChanged: (setting: string, value: string) => void;

    private _saveData: SaveData;
    private _config: AppConfig;

    private _hasClaimedDailyReward: boolean[] = [false, false, false];
    private _log = logger.child('BackendLocal');

    private _localEnergyService: LocalEnergyService = null;
    private _timeProvider: ReturnType<typeof createRemoteTimeProvider> = createRemoteTimeProvider();

    public async initialize(config: AppConfig): Promise<void> {
        this._config = config;

        // Load save data from localStorage or create a new SaveData object
        await this._load();

        this._localEnergyService = new LocalEnergyService(this._saveData);

        // Save initial room unlocks
        this._config.initialRoomUnlocks.forEach((roomName) => {
            this.unlockRoom(roomName);
        });
    }

    public update(dt: number) {
        if (this.timeUntilDailyReset() <= 0) {
            this._hasClaimedDailyReward = [false, false, false];
        }

        const modified = this._localEnergyService.updateFromTimestamp(this._timeProvider.now);
        if (modified) {
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
        //We can change this to whatever value we want to test different flows.
        return EntitlementType.Free;
    }

    public openPlatformSignIn() {
        // Local backend: we don't prompt them to sign in; user can always play
    }

    public openPlatformRegistration(origin: UpsellOrigin) {
        // Local backend: we don't prompt them to register; user can always play
    }

    public openPlatformPremiumRegistration(origin: UpsellOrigin) {
        // Local backend: we don't prompt them to register; user can always play
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
        const timestamp = Date.now();
        this._localEnergyService.reduceEnergy(cost);
        return timestamp.toString();
    }

    public async gameLevelEnded(puzzleIndex: number, puzzleId: string, puzzleCompleteData: PuzzleCompleteEventData): Promise<boolean> {
        this._log.debug(`Local gameLevelEnded puzzleIndex=${puzzleIndex} puzzleId=${puzzleId} puzzleCompleteData`, puzzleCompleteData);
        const isQuickPlay = puzzleIndex === -1 && puzzleCompleteData.ObjectiveProgress.length === 0;

        try {
            if (isQuickPlay) {
                this._saveData = SaveData.updateQuickPlaySaveData(this._saveData, puzzleCompleteData.Score);
            } else {
                this._saveData = SaveData.updatePuzzleCompletion(this._saveData, puzzleIndex, puzzleId, puzzleCompleteData.ObjectivesComplete);
            }

            await this._save();
            return true;
        } catch (error) {
            return false;
        }
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
        // Nothing to do here
    }

    public addGameContext(context: any) {
        // Nothing to do here
    }

    public sendGa4Event(eventData: any) {
        //Do nothing in local
    }

    //Task persistence
    public async onTaskUpdated(taskId: string, taskUpdatedData: TaskUpdatedEventData): Promise<boolean> {
        try {
            this._saveData = SaveData.updateTaskCompletion(this._saveData, taskId, taskUpdatedData.Completed, taskUpdatedData.Assigned);
            await this._save();
            return true;
        } catch (error) {
            return false;
        }
    }

    public getDailyPrizePurchaseCount() {
        return 0;
    }

    public async onClaimDailyReward(prizeSlot: number, selectionIndex: number): Promise<boolean> {
        try {
            this._log.debug('Daily Reward Claimed!');
            this._hasClaimedDailyReward[prizeSlot] = true;
            if (this.onDailyPrizeStateChanged) {
                this.onDailyPrizeStateChanged();
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    public async getDailyRewardPrizes(): Promise<DailyPrizeRewardState> {
        // Just fill out with placeholder items for non-pogo builds
        const deucesWildItem = this._config.itemConfig.getItemInfo('powerup_deuceswild');
        const coinsItem = this._config.itemConfig.getItemInfo('coins');
        const energyItem = this._config.itemConfig.getItemInfo('energy');
        const freeDessertItem = this._config.itemConfig.getItemInfo('powerup_freedessert');

        let todayFreeRewards: ItemInfo[] = [deucesWildItem, deucesWildItem, deucesWildItem];
        let todayClubRewards: ItemInfo[] = [coinsItem, energyItem, freeDessertItem];
        const boxClaimOrder = [0, 1, 2];
        Utils.shuffleUnseeded(boxClaimOrder);

        // Build reward box state

        // Box 0
        let claimIndex = boxClaimOrder[0];
        const box0FreeReward = new DailyReward(todayFreeRewards[claimIndex], 1, this._hasClaimedDailyReward[0]);
        const box0ClubReward = new DailyReward(todayClubRewards[claimIndex], 3, this._hasClaimedDailyReward[0]);
        const box0 = new DailyRewardBox(box0FreeReward, box0ClubReward, 0, claimIndex);

        // Box 1
        claimIndex = boxClaimOrder[1];
        const box1FreeReward = new DailyReward(todayFreeRewards[claimIndex], 2, this._hasClaimedDailyReward[1]);
        const box1ClubReward = new DailyReward(todayClubRewards[claimIndex], 1, this._hasClaimedDailyReward[1]);
        const box1 = new DailyRewardBox(box1FreeReward, box1ClubReward, 1, claimIndex);

        // Box 2
        claimIndex = boxClaimOrder[2];
        const box2FreeReward = new DailyReward(todayFreeRewards[claimIndex], 3, this._hasClaimedDailyReward[2]);
        const box2ClubReward = new DailyReward(todayClubRewards[claimIndex], 2, this._hasClaimedDailyReward[2]);
        const box2 = new DailyRewardBox(box2FreeReward, box2ClubReward, 2, claimIndex);

        return new DailyPrizeRewardState(box0, box1, box2, false);
    }

    public timeUntilDailyReset(): number {
        const midnight = new Date();
        midnight.setUTCHours(23, 59, 59, 999);
        return midnight.getTime() - Date.now();
    }

    public async onDialogueSeen(dialogueId: string): Promise<boolean> {
        try {
            this._saveData = SaveData.addSeenDialogue(this._saveData, dialogueId);
            await this._save();
            return true;
        } catch (error) {
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
            return false;
        }
    }

    public async gainCurrency(currency: Currency, amount: number, _source: ResourceChangeContext): Promise<boolean> {
        try {
            this._saveData = SaveData.incrementCurrencyAmount(this._saveData, currency, amount);
            await this._save();
        } catch (error) {
            this._log.error(`gainCurrency save error`, { error });
            return false;
        }

        return true;
    }

    public async loseCurrency(currency: Currency, amount: number, _source: ResourceChangeContext): Promise<boolean> {
        try {
            this._saveData = SaveData.decrementCurrencyAmount(this._saveData, currency, amount);
            await this._save();
        } catch (error) {
            this._log.error(`loseCurrency save error`, { error });
            return false;
        }

        return true;
    }

    getInventoryItemCount(itemId: string): number {
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
        if (this._saveData.inventory.has(powerupType)) {
            return this._saveData.inventory.get(powerupType);
        }
        return 0;
    }

    public getBoosterCount(boosterType: BoosterType): number {
        if (this._saveData.inventory.has(boosterType)) {
            return this._saveData.inventory.get(boosterType);
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

    private async _usePowerup(powerupType: PowerupType, amount: number): Promise<void> {
        let count = 0;
        if (this._saveData.inventory.has(powerupType)) {
            count = this._saveData.inventory.get(powerupType);
        }

        count = Math.max(0, count - amount);
        this._saveData.inventory.set(powerupType, count);

        await this._save();
    }

    private async _useBooster(boosterType: BoosterType, amount: number): Promise<void> {
        let count = 0;
        if (this._saveData.inventory.has(boosterType)) {
            count = this._saveData.inventory.get(boosterType);
        }

        count = Math.max(0, count - amount);
        this._saveData.inventory.set(boosterType, count);

        await this._save();
    }

    public usePowerup(powerupType: PowerupType): Promise<void> {
        return this._usePowerup(powerupType, 1);
    }

    public useBooster(boosterType: BoosterType): Promise<void> {
        return this._useBooster(boosterType, 1);
    }

    public cheat_spendPowerup(powerupType: PowerupType, delta: number): Promise<void> {
        return this._usePowerup(powerupType, delta);
    }

    public cheat_spendBooster(boosterType: BoosterType, delta: number): Promise<void> {
        return this._useBooster(boosterType, delta);
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

        // GEMS
        let gemCount = 0;
        if (this._saveData.currencySaveData.has(Currency.Gems)) {
            gemCount = this._saveData.currencySaveData.get(Currency.Gems).amount;
        }
        currencies.push(new CurrencyAndAmount(Currency.Gems, gemCount as number));

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
        // No premium currency store on backend local
    }

    public async getCatalog(): Promise<CatalogItem[]> {
        let catalog = [];
        this._config.storeConfig.items.forEach((catalogItem) => {
            // Filter out items that have exceeded purchase counts
            if (!this._isPurchaseWithinPurchaseCountLimits(catalogItem)) {
                this._log.debug(`Catalog item purchase limit exceeded`, { item: catalogItem });
                return;
            }

            catalog.push(catalogItem);
        });
        return catalog;
    }

    public async purchase(catalogItem: CatalogItem, _storeType: StoreType): Promise<PurchaseResult> {
        if (!catalogItem) {
            return new PurchaseResult(PurchaseStatus.Error, 'The store encountered an enexpected error.');
        }

        let currencyBalance = 0;
        if (this._saveData.currencySaveData.has(catalogItem.cost.currency)) {
            currencyBalance = this._saveData.currencySaveData.get(catalogItem.cost.currency).amount;
        }

        if (catalogItem.cost.amount > currencyBalance) {
            return new PurchaseResult(PurchaseStatus.InsufficientCurrency, `Insufficient funds to purchase ${catalogItem.name}`);
        }

        // Check purchase limits
        if (!this._isPurchaseWithinPurchaseCountLimits(catalogItem)) {
            this._log.warn(`Attempting to purchase item over purchase limit count`, { item: catalogItem });
            return new PurchaseResult(PurchaseStatus.Error, 'You cannot purchase this item again.');
        }

        catalogItem.contents.forEach((item) => {
            const itemInfo = this._config.itemConfig.getItemInfo(item?.id);
            if (itemInfo) {
                switch (itemInfo.type) {
                    case ItemType.Currency:
                        this._saveData = SaveData.incrementCurrencyAmount(this._saveData, item.id, item.amount);
                        break;
                    case ItemType.Booster:
                    case ItemType.PowerUp:
                        this._updateInventory(item.id, item.amount);
                        break;
                }
            } else {
                // Props in diner don't have items in item definitions
                this._updateInventory(item.id, item.amount);
            }
        });

        // Increment purchase count
        this._saveData = SaveData.incrementPurchaseCount(this._saveData, catalogItem.id);

        this._saveData = SaveData.incrementCurrencyAmount(this._saveData, catalogItem.cost.currency, -catalogItem.cost.amount);

        await this._save();

        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.onCurrencyChanged) {
                    this.onCurrencyChanged();
                }
                resolve(new PurchaseResult(PurchaseStatus.Success));
            }, 1000);
        });
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

    addCheats(debugService: IDebugService) {
        debugService.addDebugButton('Grant +100 Gems', 'Cheats', this.cheat_grantGems.bind(this, 100));
    }

    cheat_grantGems(delta: number) {
        this.cheat_grantCurrency('gems', delta);
        if (this.onCurrencyChanged) {
            this.onCurrencyChanged();
        }
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

    async cheat_grantCurrency(name: string, amount: number) {
        if (!this._config.cheats) {
            return;
        }
        this._saveData = SaveData.incrementCurrencyAmount(this._saveData, name, amount);
        await this._save();
    }

    async cheat_grantItem(item: string, delta: number) {
        if (!this._config.cheats) {
            return;
        }
        this._saveData = SaveData.incrementInventoryItemCount(this._saveData, item, delta);
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

    private _updateInventory(itemId: string, amount: number) {
        this._saveData = SaveData.incrementInventoryItemCount(this._saveData, itemId, amount);
    }

    private async _load(): Promise<void> {
        // This doesn't need to be async, but other IBackend instances will be async
        // so keep consistent with other services
        return new Promise((resolve) => {
            setTimeout(() => {
                const savedData = sys.localStorage.getItem('saveData');
                if (savedData) {
                    this._saveData = SaveData.fromJson(savedData);
                } else {
                    this._saveData = new SaveData();
                }
                this._log.debug(`BackendLocal._load: `, this._saveData);
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
                sys.localStorage.setItem('saveData', serializedData);
                this._log.debug(`BackendLocal._save: `, { saveData: serializedData });
                resolve(true);
            }, 0);
        });
    }
}
