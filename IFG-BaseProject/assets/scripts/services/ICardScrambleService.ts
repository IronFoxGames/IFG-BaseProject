import { AppConfig } from '../config/AppConfig';
import { Level } from '../config/Level';
import { LevelList } from '../config/LevelList';
import { TaskConfig } from '../config/TaskConfig';
import { BoosterType, PowerupType } from '../core/enums/BoosterType';
import { Currency } from '../core/enums/Currency';
import { EntitlementType } from '../core/enums/EntitlementType';
import { UpsellOrigin } from '../core/enums/UpsellOrigin';
import { CurrencyAndAmount } from '../core/model/CurrencyAndAmount';
import { ItemInfo } from '../core/model/ItemInfo';
import { PropSwappedEventData } from '../core/model/PropSwappedEventData';
import { PuzzleCompleteEventData } from '../core/model/PuzzleCompleteEventData';
import { TaskUpdatedEventData } from '../core/model/TaskCompleteEventData';
import { Context } from './Context';
import { DailyPrizeRewardState } from './DailyPrizeRewardState';
import { EventData } from './EventData';
import { IBackend } from './IBackend';
import { IDebugService } from './IDebugService';
import { RequirementsService } from './RequirementsService';
import { ResourceChangeContext } from './ResourceChangeContext';
import { NodeSaveData, QuickPlaySaveData } from './SaveData';
import { UIOverlayService } from './UIOverlayService';

export interface ICardScrambleService {
    initialize(config: AppConfig, debugService: IDebugService, levelList: LevelList, backend: IBackend): Promise<void>;

    update(dt: number);

    get backend(): IBackend;
    get cheatAllPowerups();

    // Item Info database
    getItem(itemId: string): ItemInfo;

    // Settings
    getSettings(): Map<string, unknown>;
    saveSettings(settings: Map<string, unknown>): Promise<boolean>;
    getUserEntitlement(): EntitlementType;
    openPlatformSignIn();
    openPlatformRegistration(origin: UpsellOrigin);
    openPlatformPremiumRegistration(origin: UpsellOrigin);
    getPlatformSetting<T = string>(setting: string): T;
    registerPlatformSettingChanged(func: (setting: string, value: string) => void);
    unregisterPlatformSettingChanged(func: (setting: string, value: string) => void);

    // Tutorial
    getTutorialStep(stepKey: string): boolean;
    saveTutorialStep(stepKey: string, forceSave: boolean);

    // Game Events
    gameLoaded(): Promise<void>;
    gameStartingLevel(puzzleIndex: number, cost: number): Promise<string>;
    gameLevelEnded(puzzleIndex: number, puzzleId: string, puzzleCompleteData: PuzzleCompleteEventData): Promise<boolean>;
    dinerEnter(): Promise<void>;
    dinerExit(): Promise<void>;
    loadingStart(): Promise<void>;
    loadingStop(): Promise<void>;
    resetGameContext();
    addGameContext(context: Partial<Context>);
    sendGa4Event(eventData: EventData);

    // Inventory
    getPuzzleEnergyCost(): number;
    getItemCountInInventory(itemId: string): number;
    getEnergy(): number;
    getMaxEnergy(): number;
    timeUntilNextEnergy(): number;
    getPowerupCount(powerupType: PowerupType): number;
    getBoosterCount(boosterType: BoosterType): number;
    usePowerup(powerupType: PowerupType): Promise<void>;
    useBooster(boosterType: BoosterType): Promise<void>;

    // Puzzle progression
    getHighestPuzzleCompleted(): number;
    getQuickPlaySaveData(): QuickPlaySaveData;
    getNextPuzzle(): Level | null;
    isPuzzleCompletedById(puzzleId: string): boolean;
    isPuzzleCompleted(level: Level): boolean;

    //Task progression
    onTaskUpdated(taskId: string, taskUpdatedData: TaskUpdatedEventData): Promise<boolean>;
    getTaskCompletionCount(taskid: string): number;
    isTaskAssigned(taskId: string): boolean;
    getChapterCompleted(chapterId: string, taskConfig: TaskConfig): boolean;
    getTaskCompleted(taskId: string, taskCompletionCount: number): boolean;

    //Daily mystery prize
    getDailyPrizePurchaseCount();
    onPrizeClaimed(prizeSlot: number, prizeIndex: number): Promise<boolean>;
    timeUntilDailyReset(): number;
    getDailyRewardPrizes(): Promise<DailyPrizeRewardState>;
    registerOnDailyPrizeStateChangeCallback(func: () => void);
    unregisterOnDailyPrizeStateChangeCallback(func: () => void);

    //Dialogue Progression
    onDialogueSeen(dialogueId: string): Promise<boolean>;
    hasDialogueBeenSeen(dialogueId: string): boolean;

    //Node contents
    unlockRoom(roomId: string): Promise<boolean>;
    isRoomUnlocked(roomId: string);
    getNodeSaveData(nodeId: string): NodeSaveData;
    hasNodeSaveData(nodeId: string): boolean;
    onPropSwapped(nodeId: string, propSwappedData: PropSwappedEventData): Promise<boolean>;

    //Currency
    // onCurrencyUpdated(currencyName: string, currencyData: CurrencyRewardEventData): Promise<boolean>;
    gainCurrency: (currency: Currency, amount: number, source: ResourceChangeContext) => Promise<boolean>;
    loseCurrency: (currency: Currency, amount: number, source: ResourceChangeContext) => Promise<boolean>;

    getCurrencyBalances(): Promise<CurrencyAndAmount[]>;
    getCurrencyBalance(currencyName: string): Promise<number>;
    redirectToPremiumCurrencyStore(): void;
    registerOnCurrencyUpdateEventCallback(func: () => void);
    unregisterOnCurrencyUpdateEventCallback(func: () => void);

    //LoadScreen
    onLoadScreenComplete();
    registerOnLoadScreenCompleteCallback(func: () => void);
    unregisterOnLoadScreenCompleteCallback(func: () => void);

    // Guest limiting
    checkGuestLimitAndShowPopup(requirementService: RequirementsService, uiOverlayService: UIOverlayService): boolean;
}
