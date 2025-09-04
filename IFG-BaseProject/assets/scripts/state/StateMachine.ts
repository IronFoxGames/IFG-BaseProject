import { _decorator, Component, director, find } from 'cc';
import { App } from './App';
import { BaseState } from './BaseState';
import { StateTransitionData } from './StateTransitionData';
import { logger } from '../logging';
import { UIOverlayService } from '../services/UIOverlayService';
import { JsonAsset } from 'cc';
import { ResourceLoader } from '../utils/ResourceLoader';
import { EDITOR } from 'cc/env';

const { ccclass, property } = _decorator;

export enum GameState {
    None = 'none',
    Main = 'diner',
    Gameplay = 'gameplay'
}

@ccclass
export class StateMachine extends Component {
    @property
    dinerSceneName: string = 'diner';

    @property
    dinerStateNodeName: string = 'DinerState';

    @property
    gameplaySceneName: string = 'gameplay';

    @property
    gameplayStateNodeName: string = 'GameplayState';

    private app: App;
    private currentState: BaseState;

    private _log = logger.child('StateMachine');

    start() {}

    public Init(app: App) {
        this.app = app;
    }

    public async LoadState(state: GameState, transitionData: StateTransitionData | null = null) {
        // If in the editor and there's a play test level, boot right into that
        if (EDITOR) {
            const foundTestPlayData = await this._loadEditorPlayTest();
            if (foundTestPlayData) {
                return;
            }
        }

        // Skip diner
        const appConfig = this.app.getAppConfig();
        if (appConfig && appConfig.skipDiner) {
            const transitionData = new StateTransitionData();
            transitionData.data = {
                puzzleIndex: -1,
                gameConfig: 'levels/modes/freeplay',
                boosterList: []
            };
            this._loadGameplayState(transitionData);
            return;
        }

        switch (state) {
            case GameState.Main:
                this._loadMainState(transitionData);
                break;
            case GameState.Gameplay:
                this._loadGameplayState(transitionData);
                break;
        }
    }

    private _loadMainState(transitionData: StateTransitionData | null) {
        this._loadStateScene(GameState.Main, this.dinerSceneName, this.dinerStateNodeName, transitionData ?? new StateTransitionData());
    }

    private _loadGameplayState(transitionData: StateTransitionData) {
        this._loadStateScene(GameState.Gameplay, this.gameplaySceneName, this.gameplayStateNodeName, transitionData);
    }

    private _loadStateScene(state: GameState, sceneName: string, stateNodeName: string, stateTransitionData: StateTransitionData) {
        this.app.showLoadScreen(true);
        this.app.Services.UIOverlayService.clearNodesOnStateChange();
        director.preloadScene(
            sceneName,
            (completedCount, totalCount, item) => {
                this.app.setLoadScreenProgress(completedCount / totalCount);
                this._log.trace(`LoadScene[${sceneName}] progress: ${completedCount} / ${totalCount}`);
            },
            (err) => {
                if (err) {
                    this._log.error(`LoadScene[${sceneName}] failed with err`, err);
                    return;
                }
                this._log.info(`LoadScene[${sceneName}] preloaded successfully.`);

                if (this.currentState != null) {
                    this.currentState.ExitState();
                }

                director.loadScene(sceneName, async () => {
                    this._log.info(`LoadScene[${sceneName}] done.`);

                    let stateNode = find(stateNodeName);
                    if (stateNode == null) {
                        this._log.error(`LoadScene[${sceneName}] failed to find state node in scene: ${stateNodeName}`);
                        return;
                    }

                    this.currentState = stateNode.getComponent(BaseState);
                    if (this.currentState == null) {
                        this._log.error(`LoadScene[${sceneName}] failed to find state component on node: ${stateNodeName}.`);
                        return;
                    }

                    try {
                        this.currentState.Init(this.app, stateTransitionData);
                        await this.currentState.EnterState();

                        // Hide loading screen
                        this.app.showLoadScreen(false, () => {
                            this.app.Services.cardScrambleService.onLoadScreenComplete();
                            this.app.Services.tutorialService.onStateChange(state);
                        });
                    } catch (error) {
                        this._log.error(`Exception while entering state [${stateNodeName}]`, { error: error });
                    }
                });
            }
        );
    }

    private async _loadEditorPlayTest(): Promise<boolean> {
        if (!EDITOR) {
            return false;
        }

        let quickPlayTestLevel: JsonAsset | null = null;
        try {
            quickPlayTestLevel = await ResourceLoader.load('test-play', JsonAsset, false);
        } catch (err) {
            quickPlayTestLevel = null;
        }

        if (!quickPlayTestLevel) {
            return false;
        }

        const levelData = quickPlayTestLevel.json as { level: string };
        const transitionData = new StateTransitionData();
        transitionData.data = {
            cost: 0,
            puzzleId: -1,
            puzzleIndex: -1,
            gameConfig: levelData.level,
            boosterList: []
        };
        this._loadGameplayState(transitionData);
        return true;
    }
}
