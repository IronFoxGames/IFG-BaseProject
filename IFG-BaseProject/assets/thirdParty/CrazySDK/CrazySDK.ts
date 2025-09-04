import { DebugMode, error, game, sys } from 'cc';
import { AdModule, BannerModule, DataModule, GameModule, SDK, SdkEnvironment, UserModule } from './CrazySDK.types';

class Logger {
    static Log(...args: any[]) {
        if ([DebugMode.VERBOSE, DebugMode.INFO].indexOf(game.config.debugMode) < 0) return;
        console.log('[CrazySDK]', ...args);
    }
}

enum INIT_STATE {
    UNINITIALIZED,
    REQUESTED,
    INITIALIZED
}

export class _CrazySDK implements SDK {
    private initResolvers: (() => void)[] = [];
    private initState: INIT_STATE = INIT_STATE.UNINITIALIZED;
    private sdk: any;
    private _isSupportedPlatform: boolean;
    private _version = '2.0.0';

    constructor() {
        const supportedPlatform = [sys.Platform.MOBILE_BROWSER, sys.Platform.DESKTOP_BROWSER];
        this._isSupportedPlatform = supportedPlatform.indexOf(sys.platform) >= 0;
    }

    /** True if the SDK is enabled on this platform. If the SDK is disabled, the method calls will throw errors. */
    get isSupportedPlatform(): boolean {
        return this._isSupportedPlatform;
    }

    private ensureInitialized() {
        if (this.initState !== INIT_STATE.INITIALIZED) {
            throw new Error('CrazySDK is not initialized yet. Please call CrazySDK.init() first.');
        }
    }

    get environment(): SdkEnvironment {
        this.ensureInitialized();
        return this.sdk.environment;
    }

    get isQaTool(): boolean {
        this.ensureInitialized();
        return this.sdk.isQaTool;
    }

    get ad(): AdModule {
        this.ensureInitialized();
        return this.sdk.ad;
    }

    get game(): GameModule {
        this.ensureInitialized();
        return this.sdk.game;
    }

    get user(): UserModule {
        this.ensureInitialized();
        return this.sdk.user;
    }

    get data(): DataModule {
        this.ensureInitialized();
        return this.sdk.data;
    }

    private initInternal() {
        if (this.initState !== INIT_STATE.UNINITIALIZED) {
            return;
        }
        this.initState = INIT_STATE.REQUESTED;
        const tag = document.createElement('script');
        tag.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
        tag.async = true;
        tag.onload = async () => {
            Logger.Log('JS SDK loaded');
            this.sdk = (window as any).CrazyGames.SDK;
            await this.sdk.init({
                wrapper: {
                    engine: 'cocos',
                    sdkVersion: this._version
                }
            });
            this.initState = INIT_STATE.INITIALIZED;
            this.initResolvers.forEach((resolver) => resolver());
            this.initResolvers = [];
        };
        tag.onerror = () => error('Failed to load CrazySDK JS. Please check your internet connection.');
        document.head.appendChild(tag);
    }

    /**
     * Call init to initialize the SDK, and await the returned promise before calling other SDK methods.
     * If you need to await for initializaiton in multiple places, you can call init multiple times, it will not cause any issues.
     */
    public init() {
        if (!this.isSupportedPlatform) {
            throw new Error('CrazySDK is not enabled on this platform');
        }

        return new Promise<void>((resolve) => {
            if (this.initState === INIT_STATE.INITIALIZED) {
                resolve();
            } else {
                this.initResolvers.push(resolve);
                this.initInternal();
            }
        });
    }
}

// const CrazySDK = new _CrazySDK();
// export default CrazySDK;
