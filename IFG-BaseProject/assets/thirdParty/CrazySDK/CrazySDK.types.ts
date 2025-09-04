export interface SDK {
  readonly environment: SdkEnvironment;
  readonly isQaTool: boolean;
  readonly ad: AdModule;
  readonly game: GameModule;
  readonly user: UserModule;
  readonly data: DataModule;
}

export type ErrorCodes =
  | 'initFailed'
  | 'unexpectedError'
  | 'sdkNotInitialized'
  | 'networkRequestFailed'
  | 'sdkDisabled'
  | UserErrorCodes
  | DataErrorCode
  | BannerErrorCode
  | AdErrorCode;

export class GeneralError {
  constructor(public code: ErrorCodes, public message: string) {}
}

export type SdkEnvironment = 'crazygames' | 'yandex' | 'facebook' | 'local' | 'disabled' | 'uninitialized';

export type AdCallbacks = {
  adStarted: () => void;
  adError: (error: AdError) => void;
  adFinished: () => void;
};

export interface AdModule {
  requestAd(adType: AdType, callbacks?: AdCallbacks): void;
  hasAdblock(): Promise<boolean>;
}

export type AdType = 'midgame' | 'rewarded';

export type AdErrorCode = 'unfilled' | 'other';

export class AdError extends GeneralError {
  constructor(public code: AdErrorCode, public message: string) {
    super(code, message);
  }
}

export class UserError extends GeneralError {
  constructor(public code: UserErrorCodes, public message: string) {
    super(code, message);
  }
}

export interface UserModule {
  isUserAccountAvailable: boolean;
  systemInfo: SystemInfo;
  showAuthPrompt(): Promise<PortalUser | null>;
  showAccountLinkPrompt(): Promise<ShowLinkAccountPromptResponseData>;
  getUser(): Promise<PortalUser | null>;
  addAuthListener(lst: AuthChangeListener): void;
  removeAuthListener(lst: AuthChangeListener): void;
  getUserToken(): Promise<string | null>;
  getXsollaUserToken(): Promise<string | null>;
  addScore(score: number): void;
  addScoreEncrypted(score: number, encryptedScoreJson: string): void;
}

export interface PortalUser {
  username: string;
  profilePictureUrl: string;
}

export type AuthChangeListener = (user?: PortalUser | null) => void;

export interface ShowLinkAccountPromptResponseData {
  response: 'yes' | 'no';
}

type AuthPromptErrorCodes = 'userCancelled';
type TokenRetrieveErrorCodes = 'userNotAuthenticated' | 'unexpectedError';
type XsollaRetrieveErrorCodes = 'missingXsollaConfig' | 'notAvailableInStandaloneQaTool' | TokenRetrieveErrorCodes;

export type UserErrorCodes =
  | 'userNotAuthenticated'
  | 'unexpectedError'
  | 'missingXsollaConfig'
  | 'invalidScoreFormat'
  | 'showAccountLinkPromptInProgress'
  | 'showAuthPromptInProgress'
  | 'userAlreadySignedIn'
  | AuthPromptErrorCodes
  | TokenRetrieveErrorCodes
  | XsollaRetrieveErrorCodes;

type Software = {
  name?: string;
  version?: string;
};

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export type Device = {
  type: DeviceType;
};

export type SystemInfo = {
  countryCode: string | null;
  browser: Software;
  os: Software;
  device: DeviceType;
};

export interface DataModule {
  // same API as window.localStorage
  clear(): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export type DataErrorCode = 'dataLimitExcedeed' | 'dataModuleDisabled';

export class DataError extends GeneralError {
  constructor(public code: DataErrorCode, public message: string) {
    super(code, message);
  }
}

export interface GameModule {
  readonly link: string;
  readonly id: string;
  readonly settings: GameSettings;
  /** @deprecated use isInstantMultiplayer */
  readonly isInstantJoin: boolean;
  readonly isInstantMultiplayer: boolean;
  happytime(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  loadingStart(): void;
  loadingStop(): void;
  inviteLink(params: { [key: string]: string }): string;
  showInviteButton(params: { [key: string]: string }): string;
  hideInviteButton(): void;
  getInviteParam(name: string): string | null;
}

export interface GameSettings {
  disableChat: boolean;
}

export type BannerErrorCode = 'unfilled' | 'other' | 'missingId' | 'notVisible' | 'notCreated' | 'noAvailableSizes';

export class BannerError extends GeneralError {
  constructor(public code: BannerErrorCode, public message: string, public containerId: string) {
    super(code, message);
  }
}

export interface BannerModule {
  requestBanner(banner: Banner): Promise<void>;
  requestResponsiveBanner(containerId: string): Promise<void>;
  clearBanner(containerId: string): void;
  clearAllBanners(): void;
}

export type Banner = {
  id: string;
  width: number;
  height: number;
};
