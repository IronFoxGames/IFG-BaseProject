import { Node, Prefab } from 'cc';
import { AppConfig } from '../config/AppConfig';
import { instantiate } from '../services/backend';
import { BoosterService } from '../services/BoosterService';
import { CardScrambleService } from '../services/CardScrambleService';
import { DebugService } from '../services/DebugService';
import { DinerService } from '../services/DinerService';
import { IBackend } from '../services/IBackend';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { IDebugService } from '../services/IDebugService';
import { IDinerService } from '../services/IDinerService';
import { ISettingsService } from '../services/ISettingsService';
import { IStore } from '../services/IStore';
import { PowerupService } from '../services/PowerupService';
import { RequirementsService } from '../services/RequirementsService';
import { SettingsService } from '../services/SettingsService';
import { Store } from '../services/Store';
import { TutorialService } from '../services/TutorialService';
import { UIOverlayService } from '../services/UIOverlayService';
import { App } from './App';

export class Services {
    private _debugService: IDebugService;
    private _cardScrambleService: ICardScrambleService;
    private _settingsService: ISettingsService;
    private _dinerService: IDinerService;
    private _requirementsService: RequirementsService;
    private _UIOverlayService: UIOverlayService;
    private _tutorialService: TutorialService;
    private _boosterService: BoosterService;
    private _powerupService: PowerupService;
    private _storeService: IStore;

    public async initServices(
        app: App,
        config: AppConfig,
        generalPopupPrefab: Prefab,
        tutorialScrimPrefab: Prefab,
        narrativeSequencePrefab: Prefab,
        upsellPrefab: Prefab,
        persistentCanvasNode: Node,
        debugMenuPrefab: Prefab
    ) {
        this._debugService = new DebugService();
        await this._debugService.initialize(config.cheats, debugMenuPrefab, persistentCanvasNode);

        this._UIOverlayService = new UIOverlayService();
        this._dinerService = new DinerService();

        const canLeaveGame = () => this._UIOverlayService.showLeaveGameConfirmation();
        const showStore = (tags: string[]) => {
            this._dinerService.openStore(tags);
        };

        const backend: IBackend = instantiate(config);

        await backend.initialize(config, canLeaveGame, showStore);

        this._cardScrambleService = new CardScrambleService();
        await this._cardScrambleService.initialize(config, this._debugService, app.getLevelList(), backend);

        this._settingsService = new SettingsService();
        this._settingsService.initialize(this._cardScrambleService);

        await this._dinerService.initialize();

        this._requirementsService = new RequirementsService(this._cardScrambleService, this._dinerService);

        this._storeService = new Store();

        await this._UIOverlayService.initialize(
            app,
            this._cardScrambleService,
            this._storeService,
            config,
            generalPopupPrefab,
            tutorialScrimPrefab,
            narrativeSequencePrefab,
            upsellPrefab
        );

        this._tutorialService = new TutorialService();
        await this._tutorialService.initialize(config, this._cardScrambleService, this._requirementsService, this._UIOverlayService);

        this._boosterService = new BoosterService();
        this._boosterService.init(this._cardScrambleService);
        this._powerupService = new PowerupService();
        this._powerupService.init(this._cardScrambleService, this.tutorialService);

        await this._storeService.initialize(config, this._UIOverlayService, this._cardScrambleService.backend);
    }

    public get debugService(): IDebugService {
        return this._debugService;
    }

    public get cardScrambleService(): ICardScrambleService {
        return this._cardScrambleService;
    }

    public get settingsService(): ISettingsService {
        return this._settingsService;
    }

    public get dinerService(): IDinerService {
        return this._dinerService;
    }

    public get requirementsService(): RequirementsService {
        return this._requirementsService;
    }

    public get UIOverlayService(): UIOverlayService {
        return this._UIOverlayService;
    }

    public get tutorialService(): TutorialService {
        return this._tutorialService;
    }

    public get boosterService(): BoosterService {
        return this._boosterService;
    }

    public get powerupService(): PowerupService {
        return this._powerupService;
    }

    public get store(): IStore {
        return this._storeService;
    }
}
