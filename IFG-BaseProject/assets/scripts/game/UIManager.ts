import { _decorator, Component, instantiate, Node } from 'cc';
import { Prefab } from 'cc';
import { GameOverScreenController } from './ui/GameOverScreenController';
import { HUDController } from './HUDController';
import { GameOverResult } from '../core/model/PuzzleCompleteEventData';
import { SettingsScreenController } from './ui/SettingsScreenController';
import { ISettingsService } from '../services/ISettingsService';
import { Powerup } from '../powerups/Powerup';
import { GiveUpView } from './ui/GiveUpView';
import { GameObjective } from '../core/model/GameObjective';
import { StoreScreenController } from './ui/StoreScreenController';
import { AppConfig } from '../config/AppConfig';
import { IStore } from '../services/IStore';
import { ItemConfig } from '../config/ItemConfig';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { UIOverlayService } from '../services/UIOverlayService';
import { CardSelectorController } from './ui/CardSelectorController';
import { Card } from '../core';
import { TutorialService } from '../services/TutorialService';
import { GameConfig } from '../core/model/GameConfig';
import { logger } from '../logging';
import { Canvas } from 'cc';
import { Services } from '../state/Services';
import { RequirementsService } from '../services/RequirementsService';
import { HowToPlayScreenController } from '../ui/HowToPlayScreenController';
import { CardScrambleGameController } from './CardScrambleGameController';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    public static UIEventGameOverConfirmed = 'UIEventGameOverConfirmed';

    @property(Prefab)
    hudPrefab: Prefab;

    @property(Prefab)
    gameOverScreenPrefab: Prefab;

    @property(Prefab)
    settingsPrefab: Prefab;

    @property(Prefab)
    storePrefab: Prefab;

    @property(Prefab)
    giveUpViewPrefab: Prefab;

    @property(Prefab)
    cardSelectorPrefab: Prefab;

    @property(Prefab)
    howToPlayPrefab: Prefab;

    @property(Canvas)
    canvas: Canvas;

    private _hudInstance: HUDController = null;
    private _gameOverScreenInstance: GameOverScreenController = null;
    private _settingsScreenInstance: SettingsScreenController = null;
    private _storeScreenInstance: StoreScreenController = null;
    private _cardSelectorInstance: CardSelectorController = null;
    private _log = logger.child('UIManager');

    public get HUD(): HUDController {
        return this._hudInstance;
    }

    public onLoad() {
        const hudPrefab = instantiate(this.hudPrefab);
        if (hudPrefab == null) {
            this._log.error('failed to instantiate hud');
            return;
        }
        hudPrefab.parent = this.node;
        this._hudInstance = hudPrefab.getComponent(HUDController);
        this._hudInstance.init();
    }

    public showGameOverScreen(
        reason: GameOverResult,
        starsEarned: number,
        coinsEarned: number,
        totalStars: number,
        totalCoins: number,
        totalHands: number,
        totalScore: number,
        isQuickPlay: boolean,
        highScore: number,
        services: Services,
        appConfig: AppConfig
    ) {
        const gameOverScreenPrefab = instantiate(this.gameOverScreenPrefab);
        if (gameOverScreenPrefab == null) {
            this._log.error('failed to load game over screen');
            return;
        }
        gameOverScreenPrefab.parent = this.node;

        this._gameOverScreenInstance = gameOverScreenPrefab.getComponent(GameOverScreenController);
        this._gameOverScreenInstance.init(
            reason,
            starsEarned,
            coinsEarned,
            totalStars,
            totalCoins,
            totalHands,
            totalScore,
            isQuickPlay,
            highScore,
            this.canvas.node,
            services,
            appConfig,
            () => {
                this.node.emit(UIManager.UIEventGameOverConfirmed);
            }
        );
    }

    public showSettings(config: AppConfig, services: Services, onQuitGame: () => void) {
        const settingsPrefab = instantiate(this.settingsPrefab);
        if (settingsPrefab == null) {
            this._log.error('failed to load settings prefab');
            return;
        }
        settingsPrefab.parent = this.node;

        this._settingsScreenInstance = settingsPrefab.getComponent(SettingsScreenController);
        this._settingsScreenInstance.show(
            true,
            config,
            services,
            () => {
                this._settingsScreenInstance.node.destroy();
                this._settingsScreenInstance = null;
            },
            onQuitGame,
            () => {}
        );
    }

    public showHowToPlay(services: Services) {
        const howToPlayPrefab = instantiate(this.howToPlayPrefab);
        if (howToPlayPrefab == null) {
            this._log.error('failed to load how to play prefab');
            return;
        }
        howToPlayPrefab.active = false;
        howToPlayPrefab.parent = this.node;

        const howToPlayComponent = howToPlayPrefab.getComponent(HowToPlayScreenController);
        howToPlayComponent.show(true, services, () => {
            howToPlayPrefab.destroy();
        });
    }

    public showStore(appConfig: AppConfig, store: IStore, tags: string[] | null = null, cardScrambleService: ICardScrambleService) {
        const storePrefab = instantiate(this.storePrefab);
        if (storePrefab == null) {
            this._log.error('failed to load store prefab');
            return;
        }
        storePrefab.parent = this.node;

        this._storeScreenInstance = storePrefab.getComponent(StoreScreenController);
        this._storeScreenInstance.init(appConfig, store, tags ?? [], cardScrambleService, () => {
            this._storeScreenInstance.node.destroy();
            this._storeScreenInstance = null;
        });
        this._storeScreenInstance.show();
    }

    public async showGiveUpView(
        cardScrambleService: ICardScrambleService,
        uiOverlayService: UIOverlayService,
        requirementsService: RequirementsService,
        gameConfig: GameConfig,
        tutorialService: TutorialService,
        itemConfig: ItemConfig,
        gameOverReason: string,
        powerupToOffer: Powerup,
        gameController: CardScrambleGameController
    ): Promise<GiveUpView> {
        const giveUpViewNode = instantiate(this.giveUpViewPrefab);
        if (giveUpViewNode == null) {
            this._log.error('failed to load give up view prefab');
            return null;
        }
        giveUpViewNode.parent = this.HUD.node;

        let giveUpViewComponent = giveUpViewNode.getComponent(GiveUpView);
        await giveUpViewComponent.initView(
            tutorialService,
            itemConfig,
            cardScrambleService,
            uiOverlayService,
            requirementsService,
            gameConfig,
            gameOverReason,
            powerupToOffer,
            gameController
        );

        return giveUpViewComponent;
    }

    public async showCardSelector(boardTileNode: Node, boardScale): Promise<Card> {
        const cardSelectorNode = instantiate(this.cardSelectorPrefab);
        if (cardSelectorNode == null) {
            this._log.error('failed to load card selector prefab');
            return null;
        }
        cardSelectorNode.parent = this.node;

        return new Promise((resolve, reject) => {
            this._cardSelectorInstance = cardSelectorNode.getComponent(CardSelectorController);
            this._cardSelectorInstance.init(boardTileNode, boardScale, (card: Card) => {
                this._cardSelectorInstance = null;
                resolve(card);
            });
        });
    }

    onDestroy() {}
}
