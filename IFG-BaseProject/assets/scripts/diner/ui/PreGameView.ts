import { _decorator, Button, JsonAsset, Label, Node, Sprite, SpriteFrame } from 'cc';
import { Booster } from '../../boosters/Booster';
import { DeucesWildBooster } from '../../boosters/DeucesWildBooster';
import { LoosenTheBeltBooster } from '../../boosters/LoosenTheBeltBooster';
import { HUDConfig } from '../../config/HUDConfig';
import { ItemConfig } from '../../config/ItemConfig';
import { Level } from '../../config/Level';
import { BoardHelpers } from '../../core';
import { BoardModifierType } from '../../core/enums/BoardModifierType';
import { BoosterType } from '../../core/enums/BoosterType';
import { Currency } from '../../core/enums/Currency';
import { DeckType } from '../../core/enums/DeckType';
import { EntitlementType } from '../../core/enums/EntitlementType';
import { LevelDifficulty } from '../../core/enums/LevelDifficulty';
import { GameConfig } from '../../core/model/GameConfig';
import { ItemInfo } from '../../core/model/ItemInfo';
import { ViewController } from '../../game/ui/ViewController';
import { logger } from '../../logging';
import { ICardScrambleService } from '../../services/ICardScrambleService';
import { IStore } from '../../services/IStore';
import { RequirementsService } from '../../services/RequirementsService';
import { TutorialService } from '../../services/TutorialService';
import { UIOverlayService } from '../../services/UIOverlayService';
import { TweenComponent } from '../../TweenComponent/TweenComponent';
import { ResourceLoader } from '../../utils/ResourceLoader';
import { StringUtils } from '../../utils/StringUtils';
import { BoosterEntry } from './BoosterEntry';
import { PreGameGoalView } from './PreGameGoalView';
import { ResourceWidget } from './ResourceWidget';
const { ccclass, property } = _decorator;

@ccclass('PreGameView')
export class PreGameView extends ViewController {
    public OnPlayButtonPressed: (boosters: Booster[]) => void;
    public OnCloseButtonPressed: () => void;

    @property({ type: [PreGameGoalView] })
    public GoalViews: PreGameGoalView[] = [];

    @property({ type: [BoosterEntry] })
    public BoosterEntries: BoosterEntry[] = [];

    @property({ type: Label, visible: true, group: 'Text' })
    private _energyCostTextLabel: Label;

    @property({ type: Node, visible: true })
    private _energyIcon: Node;

    @property({ type: Label, visible: true, group: 'Text' })
    private _quickPlayHighscoreLabel: Label;

    @property({ type: Node, visible: true })
    private _gridSizeParent: Node;

    @property({ type: Label, visible: true, group: 'Text' })
    private _gridSizeText: Label;

    @property({ type: Node, visible: true })
    private _deckSizeParent: Node;

    @property({ type: Label, visible: true, group: 'Text' })
    private _deckSizeText: Label;

    @property({ type: Label, visible: true, group: 'Text' })
    private _difficultyText: Label;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _playButton: Button;

    @property({ type: Label, visible: true })
    private _playButtonLabel: Label;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _closeButton: Button;

    @property({ type: Node, visible: true })
    private _boosterSection: Node;

    @property({ type: Node, visible: true })
    private _noBoosterSection: Node;

    @property({ type: TweenComponent, visible: true })
    private _energyIconTween: TweenComponent;

    @property({ type: ResourceWidget, visible: true })
    private _energyWidget: ResourceWidget;

    @property({ type: ResourceWidget, visible: true })
    private _coinsWidget: ResourceWidget;

    @property({ type: ResourceWidget, visible: true })
    private _gemsWidget: ResourceWidget;

    @property({ type: Label, visible: true })
    private _levelTitle: Label;

    @property({ type: Node, visible: true })
    private _difficultyParent: Node;

    @property({ type: Sprite, visible: true })
    private _difficultySprite: Sprite;

    @property({ type: SpriteFrame, visible: true })
    private _normalDifficultySprite: SpriteFrame;

    @property({ type: SpriteFrame, visible: true })
    private _hardDifficultySprite: SpriteFrame;

    @property({ type: SpriteFrame, visible: true })
    private _epicDifficultySprite: SpriteFrame;

    private _cardScrambleService: ICardScrambleService;
    private _uiOverlayService: UIOverlayService;
    private _tutorialService: TutorialService;
    private _requirementsService: RequirementsService;
    private _itemConfig: ItemConfig;
    private _store: IStore;
    private _boostersToApply: Booster[] = [];
    private _log = logger.child('PreGameView');

    private _onTeardownCallback: () => void;

    private static ENERGY_COST = 1;

    public init(
        cardScrambleService: ICardScrambleService,
        uiOverlayService: UIOverlayService,
        tutorialService: TutorialService,
        requirementsService: RequirementsService,
        itemConfig: ItemConfig,
        hudConfig: HUDConfig,
        store: IStore
    ) {
        this._cardScrambleService = cardScrambleService;
        this._uiOverlayService = uiOverlayService;
        this._tutorialService = tutorialService;
        this._requirementsService = requirementsService;
        this._itemConfig = itemConfig;
        this._store = store;

        //Set up button click events...
        this._playButton.node.on(Button.EventType.CLICK, this._onPlayButtonPressedCallback, this);
        this._closeButton.node.on(Button.EventType.CLICK, this._onCloseButtonPressedCallback, this);

        this.BoosterEntries[0].node.on(BoosterEntry.OnBoosterSelectedEvent, this._onBoosterSelected, this);
        this.BoosterEntries[1].node.on(BoosterEntry.OnBoosterSelectedEvent, this._onBoosterSelected, this);

        this._boosterSection.active = false;
        this._noBoosterSection.active = false;

        // Set initial currencies
        this._updateCurrencyWidgets();

        let updateCurrencyWidgetsCallback = this._updateCurrencyWidgets.bind(this);
        this._cardScrambleService.registerOnCurrencyUpdateEventCallback(updateCurrencyWidgetsCallback);

        this._energyWidget.disableGetMore();
        this._coinsWidget.disableGetMore();
        this._gemsWidget.disableGetMore();

        // Hide the extra puzzle details if we're still in the prologue
        if (!requirementsService.checkRequirementsMet(hudConfig.puzzleDetailsFeatureConfig.requirements)) {
            this._log.info('Hiding puzzle details as requirements are not met');
            this._difficultyParent.active = false;
            this._gridSizeParent.active = false;
            this._deckSizeParent.active = false;
        } else {
            this._log.info('Showing puzzle details as requirements are met');
            this._difficultyParent.active = true;
            this._gridSizeParent.active = true;
            this._deckSizeParent.active = true;
        }

        this._energyWidget.node.active = requirementsService.checkRequirementsMet(hudConfig.energyRevealFeatureConfig.requirements);

        this._onTeardownCallback = () => {
            if (this._cardScrambleService) {
                this._cardScrambleService.unregisterOnCurrencyUpdateEventCallback(updateCurrencyWidgetsCallback);
            }
        };
    }

    protected update(_dt: number): void {
        this._updateEnergyWidget();
    }

    protected onDestroy(): void {
        this._onTeardownCallback?.call(this);
    }

    public async setQuickPlayDetails() {
        this.cleanupForNextUsage();

        this._difficultyParent.active = false;
        this._gridSizeParent.active = false;

        this._difficultyParent.active = false;
        this._gridSizeParent.active = false;

        this._energyCostTextLabel.string = `${PreGameView.ENERGY_COST}`;
        this._levelTitle.string = 'Quick Play';
        this._playButtonLabel.string = 'Play';

        this.GoalViews[0].setGoalText('Score as many points as you can!');
        this.GoalViews[0].show();
        this.GoalViews[0].setIcon(false);

        this._quickPlayHighscoreLabel.node.active = true;
        const saveData = this._cardScrambleService.getQuickPlaySaveData();

        if (saveData) {
            this._quickPlayHighscoreLabel.string = `Highscore: ${saveData.highscore}`;
        } else {
            this._quickPlayHighscoreLabel.string = `Highscore: 0`;
        }

        if (this.BoosterEntries) {
            const loosenTheBeltItem = this._itemConfig.getItemInfo(BoosterType.LoosenTheBelt);
            await this.BoosterEntries[0].InitEntry(
                this._cardScrambleService,
                this._uiOverlayService,
                this._requirementsService,
                new LoosenTheBeltBooster(),
                loosenTheBeltItem,
                this._onUpsell.bind(this),
                null
            );

            const deucesWildItem = this._itemConfig.getItemInfo(BoosterType.DeucesWild);
            await this.BoosterEntries[1].InitEntry(
                this._cardScrambleService,
                this._uiOverlayService,
                this._requirementsService,
                new DeucesWildBooster(),
                deucesWildItem,
                this._onUpsell.bind(this),
                null
            );

            if (!this.BoosterEntries[0].node.active && !this.BoosterEntries[1].node.active) {
                this._noBoosterSection.active = true;
            } else {
                this._boosterSection.active = true;
            }
        }
    }

    public async setPuzzleDetails(level: Level): Promise<void> {
        this.cleanupForNextUsage();

        let gameConfig: GameConfig = null;

        const energyCost = level.cost.amount === 0 ? 0 : this._cardScrambleService.getPuzzleEnergyCost();

        if (energyCost === 0) {
            this._energyIcon.active = false;
            this._energyCostTextLabel.node.active = false;
        }

        try {
            const levelJson = await ResourceLoader.load(level.path, JsonAsset);
            gameConfig = GameConfig.fromObject(levelJson.json);
        } catch (error) {
            this._log.error(`Failed to load level with err: `, { error: error });
            return;
        }
        if (!gameConfig) {
            this._log.error('Failed to load level');
            return;
        }
        this._energyCostTextLabel.string = `${energyCost}`;
        this._levelTitle.string = `Puzzle ${level.name}`;
        this._playButtonLabel.string = `Play`;

        if (gameConfig.objectives.length > 0) {
            this.GoalViews[0].setGoalText(gameConfig.objectives[0].getString());
            this.GoalViews[0].show();
        }
        if (gameConfig.objectives.length > 1) {
            this.GoalViews[1].setGoalText(gameConfig.objectives[1].getString());
            this.GoalViews[1].show();
        }
        if (gameConfig.objectives.length > 2) {
            this.GoalViews[2].setGoalText(gameConfig.objectives[2].getString());
            this.GoalViews[2].show();
        }

        const isCompleted = this._cardScrambleService.isPuzzleCompleted(level);
        this.GoalViews[0].setCompleted(isCompleted);
        this.GoalViews[1].setCompleted(isCompleted);
        this.GoalViews[2].setCompleted(isCompleted);

        if (this.BoosterEntries) {
            const loosenTheBeltItem = this._itemConfig.getItemInfo(BoosterType.LoosenTheBelt);
            await this.BoosterEntries[0].InitEntry(
                this._cardScrambleService,
                this._uiOverlayService,
                this._requirementsService,
                new LoosenTheBeltBooster(),
                loosenTheBeltItem,
                this._onUpsell.bind(this),
                gameConfig
            );

            const deucesWildItem = this._itemConfig.getItemInfo(BoosterType.DeucesWild);
            await this.BoosterEntries[1].InitEntry(
                this._cardScrambleService,
                this._uiOverlayService,
                this._requirementsService,
                new DeucesWildBooster(),
                deucesWildItem,
                this._onUpsell.bind(this),
                gameConfig
            );

            if (!this.BoosterEntries[0].node.active && !this.BoosterEntries[1].node.active) {
                this._noBoosterSection.active = true;
            } else {
                this._boosterSection.active = true;
            }
        }

        this._setPuzzleDetails(gameConfig);
    }

    private _updateEnergyWidget() {
        if (this._cardScrambleService.getUserEntitlement() === EntitlementType.Guest) {
            this._energyWidget.forceMaxVisualActive();
            return;
        }

        const energyCount = this._cardScrambleService.getEnergy();
        const maxEnergyCount = this._cardScrambleService.getMaxEnergy();

        this._energyWidget.setResourceCounter(energyCount);

        const progress = energyCount / maxEnergyCount;
        this._energyWidget.setProgressBar(progress);

        if (energyCount >= maxEnergyCount) {
            this._energyWidget.setTimerText('');
        } else {
            let timeUntilNextEnergy = this._cardScrambleService.timeUntilNextEnergy() / 1000;
            this._energyWidget.setTimerText(StringUtils.formatTimer(timeUntilNextEnergy, false));
        }
    }

    private _updateCurrencyWidgets() {
        this._cardScrambleService.getCurrencyBalances().then((currencyBalances) => {
            currencyBalances.forEach((currencyBalance) => {
                switch (currencyBalance.currency) {
                    case Currency.Coins:
                        this._coinsWidget.setResourceCounter(currencyBalance.amount);
                        break;
                    case Currency.Gems:
                        this._gemsWidget.setResourceCounter(currencyBalance.amount);
                        break;
                }
            });
        });
    }

    private _setPuzzleDetails(gameConfig: GameConfig) {
        const boardSize = BoardHelpers.BOARD_DIMENSION;
        let playableTiles = Array(boardSize * boardSize).fill(true);
        gameConfig.boardModifierPlacements.forEach((bmp) => {
            playableTiles[bmp.boardIndex] = bmp?.modifier?.type !== BoardModifierType.Null;
        });

        // Initialize the bounds for the playable area
        let minX = boardSize,
            maxX = 0,
            minY = boardSize,
            maxY = 0;

        // Loop over all 13x13 tiles and check for the playable area
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                const index = y * boardSize + x;
                if (playableTiles[index]) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        // Calculate the 'real' board size
        const realBoardWidth = maxX - minX + 1;
        const realBoardHeight = maxY - minY + 1;

        this._gridSizeText.string = `${realBoardWidth}x${realBoardHeight}`;

        // Deck size
        if (gameConfig.deckType == DeckType.Default) {
            this._deckSizeText.string = `54`;
        } else {
            const deckSize = gameConfig?.customDeck?.length ?? 0;
            this._deckSizeText.string = `${deckSize}`;
        }

        // Difficulty
        switch (gameConfig.difficulty) {
            case LevelDifficulty.Hard: {
                this._difficultyText.string = `Hard`;
                this._difficultySprite.spriteFrame = this._hardDifficultySprite;
                break;
            }
            case LevelDifficulty.Epic: {
                this._difficultyText.string = `Epic`;
                this._difficultySprite.spriteFrame = this._epicDifficultySprite;
                break;
            }
            case LevelDifficulty.Normal:
            default: {
                this._difficultyText.string = `Normal`;
                this._difficultySprite.spriteFrame = this._normalDifficultySprite;
                break;
            }
        }
    }

    private _onBoosterSelected(booster: Booster) {
        if (this._boostersToApply.includes(booster)) {
            this._boostersToApply.splice(this._boostersToApply.indexOf(booster), 1);
        } else {
            this._boostersToApply.push(booster);
        }
    }

    public cleanupForNextUsage() {
        this._energyCostTextLabel.string = '0';

        this.GoalViews[0].setGoalText("This is the main goal's description!");
        this.GoalViews[0].setCompleted(false);
        this.GoalViews[0].hide();
        this.GoalViews[1].setGoalText("This is the first bonus goal's description!");
        this.GoalViews[1].setCompleted(false);
        this.GoalViews[1].hide();
        this.GoalViews[2].setGoalText("This is the second bonus goal's description!");
        this.GoalViews[2].setCompleted(false);
        this.GoalViews[2].hide();

        this._quickPlayHighscoreLabel.node.active = false;
    }

    public async show() {
        this.node.active = true;
        await super.show();
        if (this._menuId && this._menuId !== '') {
            this._tutorialService.onMenuOpened(this._menuId);
        }
    }

    public async hide() {
        await super.hide();
        this.node.active = false;
    }

    private _onPlayButtonPressedCallback() {
        // Don't let them spam click
        this._playButton.interactable = false;
        this._closeButton.interactable = false;

        const energyCount = this._cardScrambleService.getEnergy();
        const isGuest = this._cardScrambleService.getUserEntitlement() === EntitlementType.Guest;
        if (energyCount < PreGameView.ENERGY_COST && !isGuest) {
            const energyItem = this._itemConfig.getItemInfo('energy');
            this._onUpsell(energyItem).then(() => {
                this._playButton.interactable = true;
                this._closeButton.interactable = true;
            });
            return;
        }

        if (this._energyIcon.active) {
            this._energyIconTween.node.active = true;
            this._energyIconTween.OnTweenEnd(() => {
                this.BoosterEntries[0].node.off(BoosterEntry.OnBoosterSelectedEvent, this._onBoosterSelected, this);
                this.BoosterEntries[1].node.off(BoosterEntry.OnBoosterSelectedEvent, this._onBoosterSelected, this);

                this.OnPlayButtonPressed?.call(this, this._boostersToApply);
            });

            this._energyIconTween.Start();
        } else {
            this.OnPlayButtonPressed?.call(this, this._boostersToApply);
        }

        this.BoosterEntries.forEach((entry) => {
            entry.cleanup();
        });
    }

    private _onCloseButtonPressedCallback() {
        this.OnCloseButtonPressed?.call(this);
    }

    private async _onUpsell(item: ItemInfo) {
        const upsellOffer = await this._store.getNextUpsell(item.id, 0);
        if (!upsellOffer) {
            this._log.warn(`No upsell offer for itemId: ${item.id}`);
            return;
        }

        const upsellResult = await this._uiOverlayService.showUpsellForItem(item, upsellOffer, 'pregameupsell');
        console.log(`DEBUG: upsellComplete ${upsellResult}`);
        if (upsellResult && this.BoosterEntries) {
            this.BoosterEntries.forEach((entry) => {
                entry.updateVisuals();
            });
        }
    }
}
