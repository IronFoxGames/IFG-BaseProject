import { TypeRegistry } from '@sinclair/typebox';
import { DefaultErrorFunction, SetErrorFunction } from '@sinclair/typebox/errors';
import { _decorator, Component, director, EventKeyboard, input, Input, JsonAsset, KeyCode, Node, Prefab } from 'cc';
import { EDITOR } from 'cc/env';
import { SoundManager } from '../audio/SoundManager';
import { AppConfig } from '../config/AppConfig';
import { LevelList } from '../config/LevelList';
import { registerErrorFunctions } from '../core/types/runtime/registerErrorFunction';
import { registerTypes } from '../core/types/runtime/registerTypes';
import { logger } from '../logging';
import { GuestModeBanner } from '../ui/GuestModeBanner';
import { ResourceLoader } from '../utils/ResourceLoader';
import { LoadingScreen } from './LoadingScreen';
import { Services } from './Services';
import { GameState, StateMachine } from './StateMachine';

const { ccclass, property } = _decorator;

@ccclass
export class App extends Component {
    @property(StateMachine)
    stateMachine: StateMachine;

    @property({ type: Prefab, visible: true })
    private _generalPopupPrefab: Prefab;

    @property({ type: Prefab, visible: true })
    private _tutorialScrim: Prefab;

    @property({ type: Prefab, visible: true })
    private _narrativeSequencePrefab: Prefab;

    @property({ type: Prefab, visible: true })
    private _upsellPrefab: Prefab;

    @property({ type: Prefab, visible: true })
    private _debugMenu: Prefab;

    @property({ type: LoadingScreen, visible: true })
    private _splashScreen: LoadingScreen;

    @property({ type: LoadingScreen, visible: true })
    private _loadingScreen: LoadingScreen;

    @property({ type: GuestModeBanner, visible: true })
    private _guestModeBanner: GuestModeBanner;

    @property({ type: Node, visible: true })
    private _persistentCanvas;

    @property({ type: SoundManager, visible: true })
    private _soundManager: SoundManager;

    private _appConfig: AppConfig;
    private _services = new Services();
    private _log = logger.child('App');
    private _firstLoad: boolean = true;

    onLoad() {
        if (!EDITOR) {
            registerTypes(TypeRegistry.Set);
            registerErrorFunctions(SetErrorFunction, DefaultErrorFunction);
        }

        this._loadingScreen.hide(() => {});
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    async start() {
        director.addPersistRootNode(this.node);

        await this._loadConfig();
        this._log.info(`App.start(): config loaded`);

        await this._initServices();
        this._log.info(`App.start(): services initialized`);

        await this._soundManager.init(this.Services.settingsService, this.Services.cardScrambleService);

        await this.Services.cardScrambleService.gameLoaded();

        this._guestModeBanner.init(this.Services.cardScrambleService);

        await this._initAndTransitionToMainState();
    }

    protected update(dt: number): void {
        if (this.Services.cardScrambleService) {
            this.Services.cardScrambleService.update(dt);
        }
    }

    public getStateMachine(): StateMachine {
        return this.stateMachine;
    }

    public getAppConfig(): AppConfig {
        return this._appConfig;
    }

    public showLoadScreen(show: boolean, onCompleteCallback: () => void = () => {}) {
        const screen = this._firstLoad || this._splashScreen.node.active ? this._splashScreen : this._loadingScreen;
        if (show) {
            screen.show(this._appConfig.minLoadingScreenTimeMS, this._appConfig.loadingScreenTips);
            this.Services.cardScrambleService.loadingStart();
        } else {
            screen.hide(onCompleteCallback);
            if (this._firstLoad) {
                this._firstLoad = false;
            }
            this.Services.cardScrambleService.loadingStop();
        }
    }

    public setLoadScreenProgress(progress: number) {
        this._splashScreen.setLoadingProgress(progress);
        this._loadingScreen.setLoadingProgress(progress);
    }

    public getLevelList(): LevelList {
        return this._appConfig.levelConfig.levelList;
    }

    public get Services(): Services {
        return this._services;
    }

    private async _loadConfig(): Promise<void> {
        try {
            const config = await ResourceLoader.load('config/appConfig', JsonAsset);
            this._appConfig = await AppConfig.fromObject(config.json);
        } catch (err) {
            this._log.error('Failed to load config: ', err);
        }
    }

    private async _initServices() {
        this._services = new Services();
        try {
            await this._services.initServices(
                this as App,
                this._appConfig,
                this._generalPopupPrefab,
                this._tutorialScrim,
                this._narrativeSequencePrefab,
                this._upsellPrefab,
                this._persistentCanvas,
                this._debugMenu
            );
        } catch (err) {
            this._log.fatal('App._initServices(): Error initializing services with error: ', { error: err });
        }
    }

    private async _initAndTransitionToMainState() {
        this.stateMachine.Init(this);
        await this.stateMachine.LoadState(GameState.Main);
    }

    private onKeyDown(event: EventKeyboard) {
        if (event.keyCode === KeyCode.BACK_QUOTE && this.Services.debugService.cheats()) {
            this.Services.debugService.toggleDebugMenu();
        }
    }
}
