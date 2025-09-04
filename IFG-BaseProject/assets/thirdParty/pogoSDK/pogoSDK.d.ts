/*
 * (c) 2020 Electronic Arts Inc.
 */

export default class PogoSDK {

    constructor(config: IConfig);

    addPauseHandler(handler: pauseHandler): void;
    addPreferenceChangeHandler(handler: preferenceChangeHandler): void;
    setNewGameHandler(handler: noArgHandler): void;
    setTearDownHandler(handler: noArgHandler): void;
    consume(itemId: string, quantity: number): Promise<any>; // TODO: type here
    gameLoaded(): void;
    gameStarted(): void;
    getAccessToken(): string;
    getCatalog(tags: [string], currency?: string): Promise<IProduct[]>;
    getGameConfig(): any;
    getGameTheme(): string;
    getPreference(pref: string): string;
    getPreferences(): IPlayerPreferences;
    getProfile(): IPlayerProfile;
    getSaleStatus(): boolean;
    getSaveData(dataSlotId: string): Promise<string>;
    getSeed(): string;
    getServerTime(): Date;
    getStats(): IStats;
    getStatsFromServer(groupIds?: [string]): Promise<IGameStats[]>;
    getWalletBalances(): Promise<IWalletBalance[]>;
    getWalletBalancesFromServer(): Promise<IWalletBalance[]>;
    logError(message: string, file: string, line: number, col: number, errorObj: any): void;
    logEvent(action: string, label?: string, value?: string): void;
    addGameContext(context: any): void
    resetGameContext(): void
    purchase(produceId: string, price: number, currency: string): Promise<IPurchaseResponse>;
    purchaseMultiple(items: IItem[]): Promise<IMultiplePurchaseResponse>;
    ready(): Promise<IReadyStats>;
    redirectTo(page: string, intcmp: string): void;
    removePauseHandler(handler: pauseHandler): void;
    removePreferenceChangeHandler(handler: preferenceChangeHandler): void;
    sendGameOver(wincodes: IWinCodes, seed: string, stringWinCodes: IStringWinCodes): Promise<IGameOverResult>;
    sendImpression(intcmp: string): void;
    sendSaveData(dataSlotId: string, data: string): Promise<any>; // TODO: type
    setCatalogChangeHandler(handler: noArgHandler): void;
    setCustomDimension(key: any, value: any): void; // TODO: types
    setFullScreenHandler(handler: fullScreenHandler): void;
    setPreference(pref: string, val: string): void;
    showGoats(): Promise<any>; // TODO: types
    showIntermission(): void;
    showSaleUpsell(): Promise<any>; // TODO: type
    showServiceMenu(flavour: string): Promise<any>; // TODO: type
    showStore(itemId: string, tabId: string): Promise<boolean>;
    showToast(toastId: string): Promise<any>; // TODO: type
    syncStats(wincodes: IWinCodes, stringWinCodes: IStringWinCodes): Promise<IGameOverResult>;
    toggleFullScreen(): void;
    getBundleConfig(): any;
    getAvatarInfos(ids: string[], idType : string): Promise<any>; // TODO: type
    getLeaderboardConfig(): LeaderboardStatus;
    getLeaderboard(leaderboardId: string, mode: string, rowCount: number): Promise<LeaderboardReply>;
    claimLeaderboardReward(leaderboardId : string, alternativeAwards: boolean): Promise<undefined>;
    getLeaderboardPlayerStatus(leaderboardId : string): Promise<PlayerLeaderboardStatus>;
    getSocialInfo(ids: string[], idType : string, fields : string[], isLeaderboard: boolean): Promise<SocialData>;
    showPlayerCard(id: string, idType : string, isLeaderboard : boolean) : Promise<any>;

    // automation
    automationReady(): boolean;
    setAutomationControls(controls: IControls): void;
    setAutomationGameInfo(gameInfo: IGameInfo): void;
    setAutomationState(status: IGameState): void;
    getAutomationState(): IGameState;
    setAutomationGameStatus(status: string): void;
    getAutomationStatus(): string;
    addAutomationCommandHandler(handler: automationCommandHandler): void;
    removeAutomationCommandHandler(handler: automationCommandHandler): void;
    onAutomationCommandComplete(results: IAutomationResult): void;
    appendAutomationHistoryData(data: any): void;
    clearAutomationHistoryData(): void;
}


export type pauseHandler = (promiseCB: Promise<string>) => void;
export type preferenceChangeHandler = (name: string, value: string, preferences: string) => void;
export type fullScreenHandler = (isFullScreen: boolean) => void;
export type noArgHandler = () => void;
export type automationCommandHandler = (cmd: string) => void;

export interface Avatar {
    image : string,
    smallImage : string
}

export interface SocialInfo {
    screenName : string,
    authLevel : string,
    badgeCount : number,
    avatar : Avatar,
    private : boolean
}

export interface SocialData {
    [id: string]: SocialInfo;
}

// TODO: cross-reference with genius classes
// TODO: add definitions for any additionally exposed APIs when implemented
// TODO: add /gameId api just in case; easier to remove than append later
// Tournament - base interfaces
export interface LeaderboardStatus {
    current: LeaderboardShort[],
    past: PlayerStatus[]
}

export interface PlayerCombinedStatus {
    tournament: Leaderboard,
    joined: boolean,
    awardsClaimed: boolean,
    playerLeaderboardStatus: PlayerLeaderboardStatus
}

export interface LeaderboardReply {
    leaderboard: LeaderboardEntry[],
    awards: PlacementAward[]
}

export interface LeaderboardAllTimeScores {
    standings: AllTimeScoreEntry[]
}

export interface AllTimeScoreEntry {
    label: string,
    subLabel: string,
    type: string,
    place: number,
    score: number
}

// Tournament - shared interfaces
export interface LeaderboardShort {
    tournamentId: string,
    startDate: Date,
    endDate: Date,
    cutOffDate: Date,
    joined: boolean,
    label: string,
    gameBlob: string,
    type: string
}

export interface PlayerStatus {
    tournamentId: string,
    joined: boolean,
    awardsClaimed: boolean,
    gameBlob: string,
    type: string
}

export interface Leaderboard {
    tournamentId: string,
    startDate: Date,
    endDate: Date,
    cutOffDate: Date,
    gameId: string,
    tierIds: string[],
    awards: PlacementAward[],
    poolSize: number,
    rounds: number,
    gameBlob: string,
    reporting: string,
    scoreWincode: string,
    dataWincode: string,
    tiebreakerWincode: string
}

export interface PlayerLeaderboardStatus {
    tierId: string,
    score: number,
    placement: number,
    poolSize: number,
    awards: Award[],
    alternativeAwards: Award[],
    awardClaimed: boolean
}

export interface PlacementAward {
    awardId: string,
    awards: Award[],
    alternativeAwards: Award[],
    place: number,
    tierId: string,
    description: string
}

export interface Badge {
    image: string,
    smallImage: string,
    description: string
}

export interface Award {
    awardType: string,
    amount: number,
    gameId: string,
    itemId: string,
    claimed: boolean,
    badge: Badge
}

export interface LeaderboardEntry {
    userId: string,
    place: number,
    score: number,
    awardId: string
}

export interface IInventory {
    [propName: string]: any;
}

export interface IWallet {
    [currencyName: string]: number;
}

export interface IService {
    weekly: [IServiceEntry];
    lifetime: [IServiceEntry];
    [propName: string]: any;
}

export interface IServiceEntry {
    [propName: string]: any;
}

export interface IDataSlots {
    SLOT_1: string;
    SLOT_2: string;
    SLOT_3: string;
    SLOT_4: string;
    [propName: string]: any;
}

export interface IMisc {
    [propName: string]: any;
}

export interface IBadges {
    [propName: string]: any;
}

export interface IStringWinCodes {
    [propName: string]: any;
}

export interface IReadyStats {
    [propName: string]: any;
}

export interface IRank {
    rankUp: boolean;
    currentRank: number;
    currentRankPoints: number;
    currentTotalRankPoints: number;
    previousRank: number;
    previousRankPoints: number;
    previousTotalRankPoints: number;
    rankPointsText: number;
    maxRank: number;
    rankForNextBadge: number;
}

export interface IStats {
    rank: IRank;
    groupIds?: [string];
    inventory: IInventory;
    game: IGameStats;
    service: IService;
    dataslots: IDataSlots;
    misc: IMisc;
}

export interface IGameStats {
    name: string;
    current: number;
    groupIds: [string];
}

export interface IWalletBalance {
    balance: number;
    currency: string;
    softLimit: number; //-1 means uncapped (unverified)
}

export interface IWalletBalances {
    [currency: string]: number
}

export interface IGameReward {
    awardId: string;
    awardType: string;
    count: number;
}

export interface IConsumedStats {
    id: string;
    value: number;
}

export interface IConsumedResult {
    gameId: number;
    stats: IConsumedStats[];
}

export interface IPlayerPreferences {
    sound: boolean;
}

export interface IWinCodeWrapper {
    wincodes: IWinCodes;
    stringWincodes: IStringWinCodes;
}

export interface IWinCodes {
    // score: number;
    // playerWon: number;

    // This will allow for additional parameters to exist on the IWinCodes.
    // Once these parameters are discovered, they should be added as either optional
    // or required parameters.
    [propName: string]: any;
}

export interface IPlayerProfile {
    entitlement: string;
    gems: number;
    nucleusId: string;
    paid: boolean;
    screenName: string;
    tokenInfo: null;
    userId: string;

    // This will allow for additional parameters to exist on the IPlayerProfile.
    // Once these parameters are discovered, they should be added as either optional
    // or required parameters.
    [propName: string]: any;
}

export interface IGameOverResult {
    badges: [IBadges];
    guid: string;
    seed: string;
    stats: [IGameStats];

    // This will allow for additional parameters to exist on the IGameOverResult.
    // Once these parameters are discovered, they should be added as either optional
    // or required parameters.
    [propName: string]: any;
}

export interface IProduct {
    description: string;
    currency: string;
    itemType: string;
    price: number;
    amount: number;
    itemId: string;
    itemName: string;
    productId: string;
    entitlement: string;
    tags: [string];
    itemDescription: string;
    bonusAmount: string;
    subItems: [IProduct]
}

export interface IPurchaseResponse {
    balance: string;
    itemBalance: string;
    item: string;
    currency: string;
    error?: any;
    items?: [{
        item: string,
        itemType: string,
        itemBalance: number
    }]
}

export interface IConfig {
    gameId: number;
    gameCode?: string;
    apiHost?: string;
    groupIds?: string[];
    enableSDKAutomation?: boolean;
    automationSettings?: IAutomationSettings;
}

export interface IAutomationSettings {
    commandDiv?: IAutomationDivSettings;
    fpsDiv?: IAutomationDivSettings;
    statusDiv?: IAutomationDivSettings;
    historyDiv?: IAutomationDivSettings;
}

export interface IAutomationDivSettings {
    background?: string;
    foreground?: string;
    position?: string;
    style?: string;
    opacity?: number;
}

export interface IItem {
    productId: string;
    price: number;
}

export interface IMultiplePurchaseResponse {
    balances: IBalance[];
    items: IItemResponse[];
    status: number;
    errorDetails: string;
}

export interface IBalance {
    currency: string;
    balance: number;

}

export interface IItemResponse {
    item: string;
    itemBalance: number;
    status: number;
    errorDetails: string;
}

export interface IAutomationResult {
    rawCommand: string;
    command: string;
    commandType: string;
    duration: number;
    isSuccessful: boolean;
    resultPayload: string;
}

export interface IGameState {
    controls: IControls;
    gameStatus: string;
    gameInfo: any;
    commandResult: IAutomationResult;
    lastGameOverInfo: ILastGameOverInfo;
    cheats: ICheats;
}

export interface ILastGameOverInfo {
    endedOn: Date;
    winCodes: IDictionary<string>;
    gameOverResult: IGameOverResult;
}

export interface IGameInfo {
    [prop: string]: any;
}

export interface ICheats {
    [prop: string]: boolean;
}

export interface IControls {
    buttons: IButton[];
    dropDowns: IDropDownData[];
    checkboxes: ICheckbox[]
    radioGroups: IRadioGroup[];
    inputs: IInput[];
}

export interface IButton {
    name: string;
    enabled: boolean;
}

export interface IDropDownData {
    name: string;
    selectedValue: string;
    availableValues: string[]
    enabled: boolean;
}

export interface ICheckbox {
    name: string;
    checked: boolean;
    enabled: boolean;
}

export interface IRadioGroup {
    name: string;
    options: IRadioGroupOption[];
    multiSelect: boolean;
    enabled: boolean;
}

export interface IRadioGroupOption {
    value: string;
    selected: boolean;
}

export interface IInput {
    name: string;
    value: string;
    enabled: boolean;
}
