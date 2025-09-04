import { JsonAsset } from 'cc';
import { AppConfig } from '../config/AppConfig';
import { Level } from '../config/Level';
import { LevelList } from '../config/LevelList';
import { TaskConfig } from '../config/TaskConfig';
import { BoosterType, PowerupType } from '../core/enums/BoosterType';
import { Currency } from '../core/enums/Currency';
import { EntitlementType } from '../core/enums/EntitlementType';
import { UpsellOrigin } from '../core/enums/UpsellOrigin';
import { Event } from '../core/Event';
import { CurrencyAndAmount } from '../core/model/CurrencyAndAmount';
import { ItemInfo } from '../core/model/ItemInfo';
import { PropSwappedEventData } from '../core/model/PropSwappedEventData';
import { PuzzleCompleteEventData } from '../core/model/PuzzleCompleteEventData';
import { LevelIdComparisonOperator, LevelIdRequirement } from '../core/model/requirements/LevelIdRequirement';
import { RequirementType } from '../core/model/requirements/RequirementType';
import { TaskUpdatedEventData } from '../core/model/TaskCompleteEventData';
import { DebugNodeData } from '../debug/DebugNodeData';
import { PopupLayout, PopupResult, PopupType } from '../game/ui/GeneralPopup';
import { logger } from '../logging';
import { ResourceLoader } from '../utils/ResourceLoader';
import { Context } from './Context';
import { DailyPrizeRewardState } from './DailyPrizeRewardState';
import { EventData } from './EventData';
import { IBackend } from './IBackend';
import { ICardScrambleService } from './ICardScrambleService';
import { IDebugService } from './IDebugService';
import { RequirementsService } from './RequirementsService';
import { ResourceChangeContext } from './ResourceChangeContext';
import { NodeSaveData, QuickPlaySaveData } from './SaveData';
import { UIOverlayService } from './UIOverlayService';

interface GameContext {
    chapterId?: string;
    // add other known properties if needed
}

export class CardScrambleService implements ICardScrambleService {
    private _backend: IBackend;
    private _config: AppConfig;
    private _debugService: IDebugService;
    private _levelList: LevelList;

    // Cheat state
    private _cheatAllLevels: boolean = false;
    private _cheatAllPowerups: boolean = false;
    private _cheatMenuNodes: DebugNodeData[] = [];

    private _onCurrencyUpdatedEvent: Event = new Event();
    private _onDailyPrizeStateChangeEvent: Event = new Event();
    private _onLoadScreenCompleteEvent: Event = new Event();
    private _onBackendSettingChanged = new Event<(setting: string, value: string) => void>();
    private _log = logger.child('CardScrambleService');

    private _gameContext: GameContext = {};

    // Users of CardScrambleService shouldn't need access to this; more so other services can make
    // backend API calls while providing a 'service' abstraction
    public get backend(): IBackend {
        return this._backend;
    }

    public get cheatAllPowerups() {
        return this._cheatAllPowerups;
    }

    async initialize(config: AppConfig, debugService: IDebugService, levelList: LevelList, backend: IBackend): Promise<void> {
        this._config = config;
        this._debugService = debugService;
        this._levelList = levelList;
        this._backend = backend;

        this._backend.onDailyPrizeStateChanged = () => this._onDailyPrizeStateChangeEvent?.invoke();
        this._backend.onCurrencyChanged = () => this._onCurrencyUpdatedEvent?.invoke();
        this._backend.onBackendSettingChanged = (setting, value) => this._onBackendSettingChanged?.invoke(setting, value);

        debugService.addDebugButton('Unlock all Levels', 'Cheats', this._cheat_unlockAllLevels.bind(this));
        debugService.addDebugButton('Unlock all Powerups and Boosters', 'Cheats', this._cheat_unlockAllPowerups.bind(this));
        debugService.addDebugButton('Reset User', 'Cheats', this._cheat_resetUser.bind(this));
        debugService.addDebugButton('Grant +100 Coins', 'Cheats', this._cheat_grantCoins.bind(this, 100));
        debugService.addDebugButton('Grant +10 Stars', 'Cheats', this._cheat_grantStars.bind(this, 10));
        debugService.addDebugButton('+1 Booster: Loosen the belt', 'Cheats', this._cheat_grantBooster.bind(this, BoosterType.LoosenTheBelt, 1));
        debugService.addDebugButton('+1 Booster: DeucesWild', 'Cheats', this._cheat_grantBooster.bind(this, BoosterType.DeucesWild, 1));
        debugService.addDebugButton(
            '+1 Powerup: Cooking the Books',
            'Cheats',
            this._cheat_grantPowerup.bind(this, PowerupType.CookingTheBooks, 1)
        );
        debugService.addDebugButton('-1 Booster: Loosen the belt', 'Cheats', this._cheat_spendBooster.bind(this, BoosterType.LoosenTheBelt, 1));
        debugService.addDebugButton('-1 Booster: DeucesWild', 'Cheats', this._cheat_spendBooster.bind(this, BoosterType.DeucesWild, 1));
        debugService.addDebugButton(
            '-1 Powerup: Cooking the Books',
            'Cheats',
            this._cheat_spendPowerup.bind(this, PowerupType.CookingTheBooks, 1)
        );

        debugService.addDebugButton('+1 Powerup: ExtraServings', 'Cheats', this._cheat_grantPowerup.bind(this, PowerupType.ExtraServings, 1));
        debugService.addDebugButton('+1 Powerup: Joker', 'Cheats', this._cheat_grantPowerup.bind(this, PowerupType.Joker, 1));
        debugService.addDebugButton('+1 Powerup: Refire', 'Cheats', this._cheat_grantPowerup.bind(this, PowerupType.Refire, 1));
        debugService.addDebugButton('+1 Powerup: +7 Cards', 'Cheats', this._cheat_grantPowerup.bind(this, PowerupType.Plus7Cards, 1));
        debugService.addDebugButton('+1 Powerup: FreeDessert', 'Cheats', this._cheat_grantPowerup.bind(this, PowerupType.FreeDessert, 1));
        debugService.addDebugButton('+1 Powerup: CleanDown', 'Cheats', this._cheat_grantPowerup.bind(this, PowerupType.CleanDown, 1));

        debugService.addDebugButton('-1 Powerup: ExtraServings', 'Cheats', this._cheat_spendPowerup.bind(this, PowerupType.ExtraServings, 1));
        debugService.addDebugButton('-1 Powerup: Joker', 'Cheats', this._cheat_spendPowerup.bind(this, PowerupType.Joker, 1));
        debugService.addDebugButton('-1 Powerup: Refire', 'Cheats', this._cheat_spendPowerup.bind(this, PowerupType.Refire, 1));
        debugService.addDebugButton('-1 Powerup: +7 Cards', 'Cheats', this._cheat_spendPowerup.bind(this, PowerupType.Plus7Cards, 1));
        debugService.addDebugButton('-1 Powerup: FreeDessert', 'Cheats', this._cheat_spendPowerup.bind(this, PowerupType.FreeDessert, 1));
        debugService.addDebugButton('-1 Powerup: CleanDown', 'Cheats', this._cheat_spendPowerup.bind(this, PowerupType.CleanDown, 1));

        this._backend.addCheats(debugService);

        // Add build data to debug menu
        debugService.addDebugLabel(`Env: ${config.env}`, 'Build Info');
        debugService.addDebugLabel(`Build Number: ${config.buildNumber}`, 'Build Info');
        debugService.addDebugLabel(`Timestamp: ${config.timestamp}`, 'Build Info');
        debugService.addDebugLabel(`Branch: ${config.branch}`, 'Build Info');
        debugService.addDebugLabel(`Commit: ${config.commit}`, 'Build Info');
        debugService.addDebugLabel(`Cheats: ${config.cheats}`, 'Build Info');
        debugService.addDebugButton('Print Catalog To Console', 'Build Info', this._printCatalog.bind(this));

        // Daily mystery prize info
        debugService.addDebugLabel(`Mystery prize rolls [${this.backend.getSaveData()?.dailyPrizeClaimOrder?.join(',')}]`, 'Daily Prize');

        this._updateSaveDataCheatTab();
    }

    private async _updateSaveDataCheatTab() {
        // Clear the save data items
        this._cheatMenuNodes.forEach((node) => {
            this._debugService.removeDebugControl(node);
        });
        this._cheatMenuNodes = [];

        // Add save data to debug menu
        this._cheatMenuNodes.push(
            this._debugService.addDebugLabel(`Story mode level: ${this._backend.getSaveData().storyLevelsCompleted.length}`, 'Save Data')
        );
        this._cheatMenuNodes.push(
            this._debugService.addDebugLabel(
                `Quick play high score: ${this._backend.getSaveData().quickPlaySaveData?.highscore ?? 0}`,
                'Save Data'
            )
        );
        this._cheatMenuNodes.push(
            this._debugService.addDebugButton('Log Save Data', 'Save Data', () => {
                console.log(`Save Data (Object)`, this._backend.getSaveData());
                console.log(`Save Data (String)`, JSON.stringify(this._backend.getSaveData().toJson()));
            })
        );
        this._cheatMenuNodes.push(
            this._debugService.addDebugButton('Log Booster/Powerup Inventory', 'Save Data', () => {
                console.log(`Booster Inventory`, this._backend.getAllBoosterCounts());
                console.log(`Powerup Inventory`, this._backend.getAllPowerupCounts());
            })
        );

        const saves = await ResourceLoader.loadDir('saves', JsonAsset);
        saves?.forEach((save) => {
            this._cheatMenuNodes.push(
                this._debugService.addDebugButton(`Set Save Data from [${save.name}]`, 'Save Data', () => {
                    this._cheat_setUserSave(JSON.stringify(save.json));
                })
            );
        });
    }

    public update(dt: number) {
        this._backend.update(dt);
    }

    // Item info database
    public getItem(itemId: string): ItemInfo {
        return this._config.itemConfig.getItemInfo(itemId);
    }

    // Settings
    public getSettings(): Map<string, unknown> {
        return this._backend.getSaveData().settings;
    }

    public async saveSettings(settings: Map<string, unknown>): Promise<boolean> {
        this._backend.getSaveData().settings = settings;
        return this._backend.saveSaveData();
    }

    public getUserEntitlement(): EntitlementType {
        return this._backend.getUserEntitlement();
    }

    public openPlatformSignIn() {
        this._backend.openPlatformSignIn();
    }

    public openPlatformRegistration(origin: UpsellOrigin) {
        this._backend.openPlatformRegistration(origin);
    }

    public openPlatformPremiumRegistration(origin: UpsellOrigin) {
        this._backend.openPlatformPremiumRegistration(origin);
    }

    // Tutorial
    public getTutorialStep(stepKey: string): boolean {
        const tutorialSteps = this._backend.getSaveData().tutorialSteps;
        if (tutorialSteps.has(stepKey)) {
            return true;
        }
        return false;
    }
    public async saveTutorialStep(stepKey: string, forceSave: boolean = false) {
        const tutorialSteps = this._backend.getSaveData().tutorialSteps;
        tutorialSteps.set(stepKey, true);

        // Don't save automatically, in theory tutorial steps should repeat again of the user hasn't completed the task, puzzle, etc. which would save
        // that the tutorial step has completed.
        if (forceSave) {
            await this._backend.saveSaveData();
        }
    }

    // Game Events
    public async gameLoaded(): Promise<void> {
        await this._backend.gameLoaded();
    }

    public async gameStartingLevel(puzzleIndex: number, cost: number): Promise<string> {
        const seed = await this._backend.gameStartingLevel(puzzleIndex, cost);
        return seed;
    }

    public async gameLevelEnded(puzzleIndex: number, puzzleId: string, puzzleCompleteData: PuzzleCompleteEventData): Promise<boolean> {
        const result = await this._backend.gameLevelEnded(puzzleIndex, puzzleId, puzzleCompleteData);

        // Update cheat values
        this._updateSaveDataCheatTab();

        return result;
    }

    public async dinerEnter() {
        await this._backend.dinerEnter();
    }

    public async dinerExit() {
        await this._backend.dinerExit();
    }

    public async loadingStart() {
        await this._backend.loadingStart();
    }

    public async loadingStop() {
        await this._backend.loadingStop();
    }

    public resetGameContext() {
        this._gameContext = {};
        this._backend.resetGameContext();
    }

    public addGameContext(context: Partial<Context>) {
        this._gameContext = {
            ...this._gameContext,
            ...context
        };
        this._backend.addGameContext(context);
    }

    public sendGa4Event(eventData: EventData) {
        this._backend.sendGa4Event(eventData);
    }

    // Inventory
    public getItemCountInInventory(itemId: string): number {
        return this._backend.getInventoryItemCount(itemId);
    }

    public getPuzzleEnergyCost(): number {
        // TODO: Pogo backend has this set to 1, but not exposed as configurable param for us right now.
        return 1;
    }

    public getEnergy(): number {
        return this._backend.getEnergy();
    }

    public getMaxEnergy(): number {
        return this._backend.getMaxEnergy();
    }

    public timeUntilNextEnergy(): number {
        return this._backend.timeUntilNextEnergy();
    }
    public getPowerupCount(powerupType: PowerupType): number {
        return this._backend.getPowerupCount(powerupType);
    }
    public getBoosterCount(boosterType: BoosterType): number {
        return this._backend.getBoosterCount(boosterType);
    }
    public async usePowerup(powerupType: PowerupType) {
        await this._backend.usePowerup(powerupType);
    }
    public async useBooster(boosterType: BoosterType) {
        await this._backend.useBooster(boosterType);
    }

    public getHighestPuzzleCompleted(): number {
        const saveData = this._backend.getSaveData();
        return saveData.storyLevelsCompleted.length - 1;
    }

    public getNextPuzzle(): Level | null {
        const saveData = this._backend.getSaveData();

        let nextLevel: Level | null = null;
        for (const level of this._levelList.levels) {
            if (!saveData.storyLevelsCompleted.includes(level.id)) {
                nextLevel = level;
                break;
            }
        }

        return nextLevel;
    }
    public isPuzzleCompletedById(puzzleId: string): boolean {
        const saveData = this._backend.getSaveData();
        return saveData.storyLevelsCompleted.includes(puzzleId);
    }

    public isPuzzleCompleted(level: Level): boolean {
        return this.isPuzzleCompletedById(level.id);
    }

    public getQuickPlaySaveData(): QuickPlaySaveData {
        const saveData = this._backend.getSaveData();
        const quickPlaySaveData = saveData.quickPlaySaveData;

        if (quickPlaySaveData) {
            return quickPlaySaveData;
        }

        return null;
    }

    public async onTaskUpdated(taskId: string, taskCompleteData: TaskUpdatedEventData): Promise<boolean> {
        const result = await this._backend.onTaskUpdated(taskId, taskCompleteData);
        return result;
    }

    public getTaskCompletionCount(taskId: string): number {
        const saveData = this._backend.getSaveData();
        const taskSaveData = saveData.taskProgressSaveData;

        if (taskSaveData.has(taskId)) {
            return taskSaveData.get(taskId).taskComplete;
        }

        return 0;
    }

    public isTaskAssigned(taskId: string): boolean {
        const saveData = this._backend.getSaveData();
        const taskSaveData = saveData.taskProgressSaveData;

        if (taskSaveData.has(taskId)) {
            return taskSaveData.get(taskId).taskAssigned;
        }

        return false;
    }

    getChapterCompleted(chapterId: string, taskConfig: TaskConfig): boolean {
        const tasks = taskConfig.chapters.find((chapter) => {
            return chapter.id === chapterId;
        }).tasks;

        if (tasks) {
            for (const task of tasks) {
                if (!this.getTaskCompleted(task.data.id, task.data.completionCount)) {
                    return false;
                }
            }

            return true;
        } else {
            this._log.error(`No Chapter with id[${chapterId}] was found when checking if it was completed...`);
            return false;
        }
    }

    getTaskCompleted(taskId: string, taskCompletionCount: number): boolean {
        const saveData = this._backend.getSaveData();
        const taskSaveData = saveData.taskProgressSaveData;

        if (!taskSaveData.has(taskId)) {
            return false;
        }

        return taskSaveData.get(taskId).taskComplete >= taskCompletionCount;
    }

    public getDailyPrizePurchaseCount() {
        return this._backend.getDailyPrizePurchaseCount();
    }

    public async onPrizeClaimed(prizeSlot: number, prizeIndex: number): Promise<boolean> {
        return await this._backend.onClaimDailyReward(prizeSlot, prizeIndex);
    }
    public getDailyRewardPrizes(): Promise<DailyPrizeRewardState> {
        return this._backend.getDailyRewardPrizes();
    }

    public timeUntilDailyReset(): number {
        return this._backend.timeUntilDailyReset();
    }

    public registerOnDailyPrizeStateChangeCallback(func: () => void) {
        this._onDailyPrizeStateChangeEvent.subscribe(func);
    }

    public unregisterOnDailyPrizeStateChangeCallback(func: () => void) {
        this._onDailyPrizeStateChangeEvent.unsubscribe(func);
    }

    public unlockRoom(roomId: string): Promise<boolean> {
        return this._backend.unlockRoom(roomId);
    }
    public isRoomUnlocked(roomId: string) {
        return this._backend.isRoomUnlocked(roomId);
    }

    public getNodeSaveData(nodeId: string): NodeSaveData {
        const saveData = this._backend.getSaveData();
        const nodeSaveData = saveData.nodeSaveData.get(nodeId);

        return nodeSaveData;
    }

    public hasNodeSaveData(nodeId: string): boolean {
        const saveData = this._backend.getSaveData();
        return saveData.nodeSaveData.has(nodeId);
    }

    public onPropSwapped(nodeId: string, propSwappedData: PropSwappedEventData): Promise<boolean> {
        const result = this._backend.onPropSwapped(nodeId, propSwappedData);

        if (propSwappedData.NodeData && propSwappedData.PropData) {
            const isStatic = propSwappedData?.NodeData?.isStatic;
            const swapType: 'static-swap' | 'decoration-swap' = isStatic ? 'static-swap' : 'decoration-swap';

            const chapter = this._gameContext?.chapterId ?? '';
            const nodeName = propSwappedData?.NodeData?.id ?? '';
            const propName = propSwappedData?.PropData?.id ?? '';
            this.sendGa4Event({
                game_event_type: swapType,
                game_event_location: `${chapter}_${nodeName}_${propName}`
            });
        }

        return result;
    }

    public onDialogueSeen(dialogueId: string): Promise<boolean> {
        const result = this._backend.onDialogueSeen(dialogueId);
        return result;
    }

    public hasDialogueBeenSeen(dialogueId: string): boolean {
        const saveData = this._backend.getSaveData();
        const dialogueSaveData = saveData.dialogueSaveData;

        const existingSeenDialogue = dialogueSaveData.find((data) => data.dialogueId === dialogueId);

        return existingSeenDialogue !== undefined;
    }

    public async gainCurrency(currency: Currency, amount: number, source: ResourceChangeContext): Promise<boolean> {
        const result = await this._backend.gainCurrency(currency, amount, source);
        if (result) {
            this._onCurrencyUpdatedEvent?.invoke();
        }
        return result;
    }

    public async loseCurrency(currency: Currency, amount: number, source: ResourceChangeContext): Promise<boolean> {
        const result = await this._backend.loseCurrency(currency, amount, source);
        if (result) {
            this._onCurrencyUpdatedEvent?.invoke();
        }
        return result;
    }

    public getCurrencyBalances(): Promise<CurrencyAndAmount[]> {
        return this._backend.getCurrencyBalances();
    }

    public getCurrencyBalance(currency: Currency): Promise<number> {
        return this._backend.getCurrencyBalance(currency);
    }

    public redirectToPremiumCurrencyStore(): Promise<void> | void {
        return this._backend.redirectToPremiumCurrencyStore();
    }

    public registerOnCurrencyUpdateEventCallback(func: () => void) {
        this._onCurrencyUpdatedEvent.subscribe(func);
    }

    public unregisterOnCurrencyUpdateEventCallback(func: () => void) {
        this._onCurrencyUpdatedEvent.unsubscribe(func);
    }

    public onLoadScreenComplete() {
        this._onLoadScreenCompleteEvent?.invoke();
    }

    public registerOnLoadScreenCompleteCallback(func: () => void) {
        this._onLoadScreenCompleteEvent.subscribe(func);
    }

    public unregisterOnLoadScreenCompleteCallback(func: () => void) {
        this._onLoadScreenCompleteEvent.unsubscribe(func);
    }

    public getPlatformSetting<T = string>(setting: string): T {
        return this._backend.getPlatformSetting<T>(setting);
    }

    public registerPlatformSettingChanged(func: (setting: string, value: string) => void) {
        this._onBackendSettingChanged.subscribe(func);
    }

    public unregisterPlatformSettingChanged(func: (setting: string, value: string) => void) {
        this._onBackendSettingChanged.unsubscribe(func);
    }

    /**
     * @returns Whether the user should be blocked by them being a guest and meeting/surpassing the level requirement
     */
    public checkGuestLimitAndShowPopup(requirementsService: RequirementsService, uiOverlayService: UIOverlayService): boolean {
        if (this.getUserEntitlement() !== EntitlementType.Guest) {
            return false;
        }

        let guestLevelLimit = new LevelIdRequirement(
            RequirementType.LevelId,
            this._config.guestLimitLevelId,
            LevelIdComparisonOperator.complete
        );

        if (requirementsService.checkRequirementsMet([guestLevelLimit])) {
            uiOverlayService.showGeneralPopup(
                PopupType.OK_Other,
                'Register Now!',
                this._config.guestLimitMessage,
                null,
                (result) => {
                    if (result === PopupResult.OK) {
                        this.openPlatformRegistration(UpsellOrigin.ContentLock);
                    }
                    if (result === PopupResult.Other) {
                        this.openPlatformSignIn();
                    }
                },
                PopupLayout.Vertical,
                'Register',
                null,
                'Sign In'
            );

            return true;
        }

        return false;
    }

    // Cheats
    private _cheat_unlockAllLevels() {
        if (!this._config.cheats) {
            return;
        }

        this._cheatAllLevels = true;
    }
    private _cheat_unlockAllPowerups() {
        if (!this._config.cheats) {
            return;
        }

        this._cheatAllPowerups = true;
    }
    private _cheat_resetUser() {
        if (!this._config.cheats) {
            return;
        }

        this._backend.cheat_resetUser();
    }
    private _cheat_setUserSave(saveData: string) {
        if (!this._config.cheats) {
            return;
        }

        this._backend.cheat_setUserSave(saveData);
    }

    private _cheat_resetInfiniteEnergy() {
        if (!this._config.cheats) {
            return;
        }

        this._backend.cheat_resetInfiniteEnergy();
    }
    private async _cheat_grantGems(delta: number) {
        if (!this._config.cheats) {
            return;
        }

        await this._backend.cheat_grantCurrency('gems', delta);
        this._onCurrencyUpdatedEvent?.invoke();
    }
    private async _cheat_grantCoins(delta: number) {
        if (!this._config.cheats) {
            return;
        }

        await this._backend.cheat_grantCurrency('coins', delta);
        this._onCurrencyUpdatedEvent?.invoke();
    }
    private async _cheat_grantStars(delta: number) {
        if (!this._config.cheats) {
            return;
        }

        await this._backend.cheat_grantCurrency('stars', delta);
        this._onCurrencyUpdatedEvent?.invoke();
    }
    private _cheat_grantBooster(booster: BoosterType, delta: number) {
        if (!this._config.cheats) {
            return;
        }

        this._backend.cheat_grantBooster(booster, delta);
    }
    private _cheat_grantPowerup(powerup: PowerupType, delta: number) {
        if (!this._config.cheats) {
            return;
        }

        this._backend.cheat_grantPowerup(powerup, delta);
    }
    private _cheat_spendBooster(booster: BoosterType, delta: number) {
        if (!this._config.cheats) {
            return;
        }

        this._backend.cheat_spendBooster(booster, delta);
    }
    private _cheat_spendPowerup(powerup: PowerupType, delta: number) {
        if (!this._config.cheats) {
            return;
        }

        this._backend.cheat_spendPowerup(powerup, delta);
    }

    private async _printCatalog() {
        const catalog = await this._backend.getCatalog();
        this._log.debug(JSON.stringify(catalog));
    }
}
