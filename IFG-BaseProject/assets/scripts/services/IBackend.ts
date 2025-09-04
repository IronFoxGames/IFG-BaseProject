import { AppConfig } from '../config/AppConfig';
import { BoosterType, PowerupType } from '../core/enums/BoosterType';
import { Currency } from '../core/enums/Currency';
import { EntitlementType } from '../core/enums/EntitlementType';
import { PurchaseResult } from '../core/enums/PurchaseResult';
import { UpsellOrigin } from '../core/enums/UpsellOrigin';
import { CatalogItem } from '../core/model/CatalogItem';
import { CurrencyAndAmount } from '../core/model/CurrencyAndAmount';
import { PropSwappedEventData } from '../core/model/PropSwappedEventData';
import { PuzzleCompleteEventData } from '../core/model/PuzzleCompleteEventData';
import { TaskUpdatedEventData } from '../core/model/TaskCompleteEventData';
import { Context } from './Context';
import { DailyPrizeRewardState } from './DailyPrizeRewardState';
import { EventData } from './EventData';
import { IDebugService } from './IDebugService';
import { StoreType } from './IStore';
import { ResourceChangeContext } from './ResourceChangeContext';
import { SaveData } from './SaveData';
export interface IBackend {
    initialize: (config: AppConfig, canLeaveGame: () => Promise<boolean>, showStore: (tags: string[]) => void) => Promise<void>;
    update(dt: number);

    onDailyPrizeStateChanged: () => void;
    onCurrencyChanged: () => void;
    onBackendSettingChanged: (setting: string, value: string) => void;

    getSaveData(): SaveData;
    saveSaveData(): Promise<boolean>;
    getUserEntitlement(): EntitlementType;
    openPlatformSignIn();
    openPlatformRegistration(origin: UpsellOrigin);
    openPlatformPremiumRegistration(origin: UpsellOrigin);
    getPlatformSetting<T = string>(setting: string): T;

    // Game Events
    gameLoaded(): Promise<void>;
    gameStartingLevel(puzzleIndex: number, cost: number): Promise<string>;
    gameLevelEnded(puzzleIndex: number, puzzleId: string, puzzleCompleteData: PuzzleCompleteEventData): Promise<boolean>;
    dinerEnter();
    dinerExit();
    loadingStart();
    loadingStop();
    resetGameContext();
    addGameContext: (context: Partial<Context>) => void;
    sendGa4Event(eventData: EventData);

    //Diner events
    onTaskUpdated(taskId: string, taskUpdatedData: TaskUpdatedEventData): Promise<boolean>;

    // Daily rewards
    getDailyPrizePurchaseCount(): number;
    onClaimDailyReward(prizeSlot: number, selectionIndex: number): Promise<boolean>;
    getDailyRewardPrizes(): Promise<DailyPrizeRewardState>;
    timeUntilDailyReset(): number;

    //Dialogue events
    onDialogueSeen(dialogueId: string): Promise<boolean>;

    //Node contents
    unlockRoom(roomId: string): Promise<boolean>;
    isRoomUnlocked(roomId: string);
    onPropSwapped(nodeId: string, propSwappedData: PropSwappedEventData): Promise<boolean>;

    //Currency
    gainCurrency: (currency: Currency, amount: number, source: ResourceChangeContext) => Promise<boolean>;
    loseCurrency: (currency: Currency, amount: number, source: ResourceChangeContext) => Promise<boolean>;

    // Inventory
    getInventoryItemCount(itemId: string): number;
    getEnergy(): number;
    getMaxEnergy(): number;
    timeUntilNextEnergy(): number;
    getPowerupCount(powerupType: PowerupType): number;
    getBoosterCount(boosterType: BoosterType): number;
    getAllPowerupCounts(): Map<PowerupType, number>;
    getAllBoosterCounts(): Map<BoosterType, number>;
    usePowerup(powerupType: PowerupType): Promise<void>;
    useBooster(boosterType: BoosterType): Promise<void>;

    // Store
    openStore();
    getCurrencyBalances(): Promise<CurrencyAndAmount[]>;
    getCurrencyBalance(currency: Currency): Promise<number>;
    redirectToPremiumCurrencyStore(): void;
    getCatalog(): Promise<CatalogItem[]>;
    purchase(catalogItem: CatalogItem, storeType: StoreType): Promise<PurchaseResult>;
    showPurchaseSuccessPopup(): boolean;

    addCheats: (debugService: IDebugService) => void;

    // Cheats
    cheat_resetUser();
    cheat_setUserSave(saveData: string);
    cheat_resetMysteryRewards();
    cheat_resetEnergyAutoIncome();
    cheat_resetInfiniteEnergy();
    cheat_grantCurrency(name: string, amount: number);
    cheat_grantItem(item: string, delta: number);
    cheat_grantBooster(powerup: BoosterType, delta: number);
    cheat_grantPowerup(powerup: PowerupType, delta: number);
    cheat_spendBooster(powerup: BoosterType, delta: number);
    cheat_spendPowerup(powerup: PowerupType, delta: number);
}
