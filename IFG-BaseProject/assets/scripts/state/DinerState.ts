import { _decorator, Node } from 'cc';
import { SoundManager } from '../audio/SoundManager';
import { Booster } from '../boosters/Booster';
import { Level } from '../config/Level';
import { EntitlementType } from '../core/enums/EntitlementType';
import { DebugNodeData } from '../debug/DebugNodeData';
import { DinerSceneController } from '../diner/DinerSceneController';
import { PopupLayout, PopupType } from '../game/ui/GeneralPopup';
import { logger } from '../logging';
import { BaseState } from './BaseState';
import { GameState } from './StateMachine';
import { StateTransitionData } from './StateTransitionData';

const { ccclass, property } = _decorator;

@ccclass
export class DinerState extends BaseState {
    @property(DinerSceneController)
    dinerController: DinerSceneController;

    @property(Node)
    uiParentNode: Node | null = null;

    // Debug controls specific to this state
    private _debugNextLevelInfo: DebugNodeData = null;
    private _debugFilterableLevelList: DebugNodeData = null;
    private _debugFilterableNarrativeList: DebugNodeData = null;
    private _unlockAllRooms: DebugNodeData = null;
    private _unlockAllFeatures: DebugNodeData = null;
    private _unlockAllDecorations: DebugNodeData = null;
    private _log = logger.child('DinerState');

    onLoad() {}

    // Override EnterState from base State class
    public async EnterState() {
        await this.dinerController.init(
            this.app,
            (boosters: Booster[]) => this._onPlayPressed(boosters),
            (boosters: Booster[]) => this._onQuickPlayPressed(boosters),
            (puzzle: Level, boosters: Booster[]) => this._onPlayLevelPressed(puzzle, boosters),
            () => this.checkDialogueToPlay()
        );

        // Play diner music
        SoundManager.instance.playMusic('MusicDiner');

        this.app.Services.cardScrambleService.checkGuestLimitAndShowPopup(
            this.app.Services.requirementsService,
            this.app.Services.UIOverlayService
        );

        await this.checkDialogueToPlay();
        //this.app.Services.tutorialService.onStateChange(GameState.Main);

        // Debug controls
        const nextPuzzle = this.app.Services.cardScrambleService.getNextPuzzle();
        this._debugNextLevelInfo = this.app.Services.debugService.addDebugLabel(
            `Next Level: ${nextPuzzle?.id ?? 'No more puzzles'} [index=${nextPuzzle?.index}]`,
            'Levels'
        );

        const levelNames: string[] = this.app.getLevelList().levels.map((level, index) => {
            return `${level.name}: ${level.id}`;
        });
        this._debugFilterableLevelList = this.app.Services.debugService.addFilterableList('Level select', 'Levels', levelNames, (value) => {
            this.app.Services.debugService.toggleDebugMenu();
            this._log.debug(`Debug Play Level: ${value}`);
            const level = this.app.getLevelList().levels[value];
            this._onPlayLevelPressed(level, []);
        });

        const dialogueSets = this.app.Services.UIOverlayService.getDialogueSets();
        const dialogueKeys = Array.from(dialogueSets.keys()); // Get an array of keys
        const dialogueNames: string[] = dialogueKeys.map((key) => `${dialogueSets.get(key).sourceFile}: ${dialogueSets.get(key).dialogueId}`);

        this._debugFilterableNarrativeList = this.app.Services.debugService.addFilterableList(
            'Dialogue select',
            'Narratives',
            dialogueNames,
            (value) => {
                this.app.Services.debugService.toggleDebugMenu();
                const key = dialogueKeys[value];
                if (!key) {
                    this._log.error(`Invalid key for value: ${value}`);
                    return;
                }
                const dialogueSet = dialogueSets.get(key);
                if (!dialogueSet) {
                    this._log.error(`Dialogue set not found for key: ${key}`);
                    return;
                }
                this._log.debug(`Debug Play Narrative: ${key}`, { dialogueId: dialogueSet.dialogueId });
                this.app.Services.UIOverlayService.showNarrativeSequence(dialogueSet.dialogueId);
            }
        );
        this._unlockAllRooms = this.app.Services.debugService.addDebugButton('Unlock all rooms', 'Diner', () => {
            if (!this.app.getAppConfig().cheats) {
                return;
            }

            this.dinerController.Rooms.forEach((room) => {
                this.app.Services.cardScrambleService.unlockRoom(room.RoomId);
            });
        });
        this._unlockAllFeatures = this.app.Services.debugService.addDebugButton('Unlock all features', 'Diner', () => {
            if (!this.app.getAppConfig().cheats) {
                return;
            }
            this.app.Services.debugService.toggleCheatActive('allFeaturesUnlocked');
            this.dinerController.refreshButtonRequirements();
        });
        this._unlockAllDecorations = this.app.Services.debugService.addDebugButton('Unlock all decorations', 'Diner', () => {
            if (!this.app.getAppConfig().cheats) {
                return;
            }
            this.app.Services.debugService.toggleCheatActive('allDecorationsUnlocked');
            this.dinerController.refreshButtonRequirements();
        });

        this.app.Services.cardScrambleService.dinerEnter();
    }

    // Override ExitState from base State class
    public ExitState() {
        this.app.Services.debugService.removeDebugControl(this._debugNextLevelInfo);
        this.app.Services.debugService.removeDebugControl(this._debugFilterableLevelList);
        this.app.Services.debugService.removeDebugControl(this._debugFilterableNarrativeList);
        this.app.Services.debugService.removeDebugControl(this._unlockAllRooms);
        this.app.Services.debugService.removeDebugControl(this._unlockAllFeatures);
        this.app.Services.debugService.removeDebugControl(this._unlockAllDecorations);

        this.app.Services.cardScrambleService.dinerExit();
    }

    private async _loadIntoQuickPlayMode(boosters: Booster[]) {
        const gameConfigPath = this.app.getAppConfig().quickPlayConfigPath;

        if (gameConfigPath === '' || !gameConfigPath) {
            this._log.error(`No quick play game config path found at provided path '${gameConfigPath}' from AppConfig.`);
        }

        const stateTransitionData = new StateTransitionData();
        stateTransitionData.data = {
            cost: 1,
            puzzleIndex: -1,
            gameConfig: gameConfigPath,
            boosterList: boosters
        };
        await this.app.getStateMachine().LoadState(GameState.Gameplay, stateTransitionData);
    }

    private _onPlayPressed(boosters: Booster[]) {
        const nextPuzzle = this.app.Services.cardScrambleService.getNextPuzzle();

        this._onPlayLevelPressed(nextPuzzle, boosters);
    }

    private async _onQuickPlayPressed(boosters: Booster[]) {
        const energy = this.app.Services.cardScrambleService.getEnergy();
        //TODO: Find a better way to retrieve this cost?
        const energyCost = 1;
        const isGuest = this.app.Services.cardScrambleService.getUserEntitlement() === EntitlementType.Guest;

        if (isGuest) {
            await this._loadIntoQuickPlayMode(boosters);
        }

        if (energy < energyCost) {
            this.app.Services.UIOverlayService.showGeneralPopup(
                PopupType.OK,
                'Not Enough Energy!',
                "You don't have enough energy to play this level, would you like to purchase more?",
                null,
                () => {
                    //TODO: Use the energy cost of the level to link to the lowest viable energy purchase in store...
                },
                PopupLayout.Vertical
            );
        } else {
            await this._loadIntoQuickPlayMode(boosters);
        }
    }

    private async _onPlayLevelPressed(puzzle: Level, boosters: Booster[]) {
        const energy = this.app.Services.cardScrambleService.getEnergy();
        const energyCost = puzzle.cost.amount === 0 ? 0 : this.app.Services.cardScrambleService.getPuzzleEnergyCost();
        const isGuest = this.app.Services.cardScrambleService.getUserEntitlement() === EntitlementType.Guest;

        if (isGuest) {
            await this._loadIntoPuzzle(puzzle, boosters);
        }

        if (energy < energyCost) {
            this.app.Services.UIOverlayService.showGeneralPopup(
                PopupType.OK,
                'Not Enough Energy!',
                "You don't have enough energy to play this level, would you like to purchase more?",
                null,
                () => {
                    //TODO: Use the energy cost of the level to link to the lowest viable energy purchase in store...
                },
                PopupLayout.Vertical
            );
        } else {
            await this._loadIntoPuzzle(puzzle, boosters);
        }
    }

    private async _loadIntoPuzzle(puzzle: Level, boosters: Booster[]) {
        if (!puzzle) {
            return;
        }

        const stateTransitionData = new StateTransitionData();
        stateTransitionData.data = {
            cost: puzzle.cost.amount,
            puzzleId: puzzle.id,
            puzzleIndex: puzzle.index,
            gameConfig: puzzle.path,
            boosterList: boosters
        };
        await this.app.getStateMachine().LoadState(GameState.Gameplay, stateTransitionData);
    }

    private async checkDialogueToPlay(): Promise<void> {
        //loop through each dialogue to check requirements
        const dialogueSets = this.app.Services.UIOverlayService.getDialogueSets();
        dialogueSets.forEach((dialogueSet) => {
            if (!dialogueSet.repeatable && this.app.Services.cardScrambleService.hasDialogueBeenSeen(dialogueSet.dialogueId)) {
                //already been seen, don't play again
                return;
            }

            //If there are no requirements listed, we don't want this dialogue triggered based on a requirment, otherwise play the sequence if they are met!
            if (dialogueSet.requirements.length > 0 && this.app.Services.requirementsService.checkRequirementsMet(dialogueSet.requirements)) {
                this._log.info('Queueing Dialogue: Requirements Are Met');
                this.app.Services.UIOverlayService.showNarrativeSequence(dialogueSet.dialogueId);
            }
        });
    }
}
