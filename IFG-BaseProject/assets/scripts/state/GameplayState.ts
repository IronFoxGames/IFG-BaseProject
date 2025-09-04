import { _decorator, resources, JsonAsset } from 'cc';
import { BaseState } from './BaseState';
import { GameState } from './StateMachine';
import { GameConfig } from '../core/model/GameConfig';
import { CardScrambleGameController } from '../game/CardScrambleGameController';
import { Random } from '../core/Random';
import { PuzzleCompleteEventData } from '../core/model/PuzzleCompleteEventData';
import { Node } from 'cc';
import { SoundManager } from '../audio/SoundManager';
import { Booster } from '../boosters/Booster';
import { DebugNodeData } from '../debug/DebugNodeData';
import { ResourceLoader } from '../utils/ResourceLoader';
import { logger } from '../logging';
import { Level } from '../config/Level';

const { ccclass, property } = _decorator;

@ccclass
export class GameplayState extends BaseState {
    @property(CardScrambleGameController)
    gameplayController: CardScrambleGameController;

    @property(Node)
    uiParentNode: Node | null = null;

    // Debug controls specific to this state
    private _debugCurrentLevel: DebugNodeData = null;
    private _debugCurrentLevelName: DebugNodeData = null;
    private _debugWinLevelButton: DebugNodeData = null;
    private _debugLoseLevelButton: DebugNodeData = null;

    private _random: Random;
    private _puzzleId: string;
    private _puzzleIndex: number;
    private _gameConfig: GameConfig;
    private _log = logger.child('GameplayState');

    onLoad() {
        this._log.trace(`GameplayState onLoad`);
    }

    start() {
        this._log.trace('GameplayState start');
    }

    onDestroy() {
        if (this.gameplayController.node != null) {
            this.gameplayController.node.off(CardScrambleGameController.EventOnGameComplete, this._onExitGame, this);
            this.gameplayController.node.off(CardScrambleGameController.EventOnGameQuit, this._onExitGame, this);
        }
    }

    // Override EnterState from base State class
    public async EnterState(): Promise<void> {
        const cost = this.data.data.cost ?? 1;
        const puzzleId = this.data.data.puzzleId;
        const puzzleIndex = this.data.data.puzzleIndex;
        const configPath = this.data.data.gameConfig;
        const boosterList: Booster[] = this.data.data.boosterList;

        this.app.Services.UIOverlayService.setGameplayController(this.gameplayController);

        this.app.Services.cardScrambleService.addGameContext({
            puzzleId: puzzleId,
            puzzleIndex: puzzleIndex
        });

        if (puzzleIndex >= 0 && (!puzzleId || puzzleId == '')) {
            this._log.fatal(`Error loading game; invalid puzzleId for a story mode level. Index = ${puzzleIndex}`);
            throw new Error(`Error loading game; invalid puzzleId for a story mode level. Index = ${puzzleIndex}`);
        }

        this._log.trace(`GameplayState EnterState: loading game config[${configPath}]`);
        try {
            const levelJson = await ResourceLoader.load(configPath, JsonAsset);
            this._gameConfig = GameConfig.fromObject(levelJson.json);
        } catch (error) {
            this._log.error(`Error loading game config: ${configPath} with err: `, { error: error });
            return;
        }

        const seed = await this.app.Services.cardScrambleService.gameStartingLevel(puzzleIndex, cost);
        this._random = new Random(seed);
        this._log.debug(`GameplayState EnterState; random seed = ${seed}`);

        for (const booster of boosterList) {
            this._gameConfig = await this.app.Services.boosterService.ApplyBooster(booster, this._gameConfig, this._random);
        }

        this._puzzleId = puzzleId;
        this._puzzleIndex = puzzleIndex;
        this.gameplayController.init(
            this._gameConfig,
            this.app.getAppConfig(),
            this._random,
            this.app.Services,
            this._puzzleId,
            this._puzzleIndex
        );
        this.gameplayController.node.on(CardScrambleGameController.EventOnGameComplete, this._onExitGame, this);
        this.gameplayController.node.on(CardScrambleGameController.EventOnGameQuit, this._onExitGame, this);

        // Play puzzle music
        SoundManager.instance.playMusic('MusicPuzzle');

        // Tutorial callback
        //this.app.Services.tutorialService.onStateChange(GameState.Gameplay);
        this.app.Services.tutorialService.onGameStart(this._gameConfig.name);

        // Debug options
        this._debugCurrentLevel = this.app.Services.debugService.addDebugLabel(`Current level index: ${this._puzzleIndex}`, 'Levels');
        this._debugCurrentLevelName = this.app.Services.debugService.addDebugLabel(`Current level name: ${this._gameConfig.name}`, 'Levels');
        this._debugWinLevelButton = this.app.Services.debugService.addDebugButton('Force Win', 'Levels', () => {
            if (!this.app.getAppConfig().cheats) {
                return;
            }
            this.gameplayController.forceGameOver(true);
        });
        this._debugLoseLevelButton = this.app.Services.debugService.addDebugButton('Force Lose', 'Levels', () => {
            if (!this.app.getAppConfig().cheats) {
                return;
            }
            this.gameplayController.forceGameOver(false);
        });
    }

    // Override ExitState from base State class
    public ExitState() {
        this._log.trace('GameplayState ExitState');

        this.app.Services.cardScrambleService.resetGameContext();

        this.app.Services.debugService.removeDebugControl(this._debugCurrentLevel);
        this.app.Services.debugService.removeDebugControl(this._debugCurrentLevelName);
        this.app.Services.debugService.removeDebugControl(this._debugWinLevelButton);
        this.app.Services.debugService.removeDebugControl(this._debugLoseLevelButton);

        this.app.Services.UIOverlayService.setGameplayController(null);
    }

    private async _onExitGame(puzzleCompleteData: PuzzleCompleteEventData) {
        const cardScrambleService = this.app.Services.cardScrambleService;
        await cardScrambleService.gameLevelEnded(this._puzzleIndex, this._puzzleId, puzzleCompleteData);
        this.app.getStateMachine().LoadState(GameState.Main);
    }
}
