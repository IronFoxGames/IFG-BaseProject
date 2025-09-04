import {
    _decorator,
    Animation,
    AnimationClip,
    AnimationState,
    Button,
    CCFloat,
    CCString,
    Component,
    director,
    instantiate,
    Label,
    Node,
    Prefab,
    Toggle,
    ToggleContainer,
    tween,
    Tween,
    TweenEasing,
    UIOpacity,
    Vec3
} from 'cc';
import { GameObjective } from 'db://assets/scripts/core/model/GameObjective';
import { GoalsUI } from 'db://assets/scripts/game/ui/GoalsUI';
import { SoundManager } from '../audio/SoundManager';
import { AppConfig } from '../config/AppConfig';
import { ItemConfig } from '../config/ItemConfig';
import { BoardHelpers, Card, HandClassification, MatchOperations } from '../core';
import { PowerupType } from '../core/enums/BoosterType';
import { Currency } from '../core/enums/Currency';
import { HandTier } from '../core/enums/HandName';
import { ItemInfo } from '../core/model/ItemInfo';
import { Match } from '../core/model/Match';
import { ResourceWidget } from '../diner/ui/ResourceWidget';
import { logger } from '../logging';
import { CleanDownPowerup } from '../powerups/CleanDownPowerup';
import { JokerPowerup } from '../powerups/JokerPowerup';
import { Plus7CardsPowerup } from '../powerups/Plus7CardsPowerup';
import { Powerup } from '../powerups/Powerup';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { RequirementsService } from '../services/RequirementsService';
import { TutorialService } from '../services/TutorialService';
import { UIOverlayService } from '../services/UIOverlayService';
import { CardDragInstructor } from './CardDragInstructor';
import { CardScrambleGameController } from './CardScrambleGameController';
import { CardVisual } from './CardVisual';
import { PlayerHand } from './PlayerHand';
import { GripCardSlot } from './ui/GripCardSlot';
import { PowerupEntry } from './ui/PowerupEntry';
import { PowerupUpsellContainer } from './ui/PowerupUpsellContainer';

const { ccclass, property } = _decorator;

@ccclass('HUDController')
export class HUDController extends Component {
    public static UIEventHandPlayed = 'UIEventHandPlayed';
    public static UIEventSortHand = 'UIEventSortHand';
    public static UIEventRecallCards = 'UIEventRecallCards';
    public static UIEventSettings = 'UIEventSettings';
    public static UIEventHowToPlay = 'UIEventHowToPlay';
    public static UIEventQuitGame = 'UIEventQuitGame';
    public static UIEventFinishLevel = 'UIEventFinishLevel';
    public static UIEventPreparePowerup = 'UIEventPreparePowerup';
    public static UIEventCancelPowerup = 'UIEventCancelPowerup';

    // Properties for the buttons, which will be assigned in the editor
    @property(GoalsUI)
    goalsUI: GoalsUI | null = null;
    @property(Node)
    leftGoalsSection: Node | null = null;
    @property(Button)
    playHandButton: Button | null = null;
    @property(Button)
    recallCardsButton: Button | null = null;
    @property(Button)
    shuffleCardsButton: Button | null = null;
    @property(Button)
    sortCardsByRankSuitButton: Button | null = null;
    @property(Label)
    sortCardsByRankSuitLabel: Label | null = null;
    @property(Button)
    settingsButton: Button | null = null;
    @property(Button)
    howToPlayButton: Button | null = null;
    @property(Button)
    giveUpButton: Button | null = null;
    @property(Button)
    usePowerupButton: Button | null = null;
    @property(PowerupEntry)
    plus7CardsPowerupEntry: PowerupEntry | null = null;
    @property(PowerupUpsellContainer)
    plus7CardsUpsellContainer: PowerupUpsellContainer = null;
    @property(PowerupEntry)
    jokerPowerupEntry: PowerupEntry | null = null;
    @property(PowerupUpsellContainer)
    jokerUpsellContainer: PowerupUpsellContainer = null;
    @property(Animation)
    plus7Anim: Animation | null = null;
    @property(Label)
    handName: Label;
    @property(Label)
    handScore: Label;
    @property(Animation)
    handNameAnim: Animation | null = null;
    @property(Label)
    playerScore: Label;
    @property(Label)
    tweeningScore: Label;
    @property(Node)
    powerupParent: Node;
    @property(Prefab)
    powerupEntryPrefab: Prefab;
    @property(Label)
    remainingCardsLabel: Label;
    @property(Animation)
    deckAnimation: Animation | null = null;
    @property(Node)
    cardBacks: Node[] = [];
    @property(Prefab)
    cardBackPrefab: Prefab | null = null;
    @property(Prefab)
    cardTransformerPrefab: Prefab | null = null;
    @property(Node)
    extraServingsVFX: Node | null = null;
    @property(Node)
    hudScrim: Node | null = null;
    @property(ResourceWidget)
    normalCurrencyWidget: ResourceWidget = null;
    @property(Prefab)
    cardDragInstructor: Prefab = null;
    @property(Label)
    handFeedback: Label;
    @property(Animation)
    handFeedbackAnim: Animation | null = null;

    @property({ type: CCString, visible: true })
    private _menuId: string;

    @property({ type: CCFloat, group: 'TweenSettings' })
    scoreBounceTime: number = 0.5;

    @property({ type: CCFloat, group: 'TweenSettings', tooltip: 'Maximum size of the score when it pops out before moving.' })
    scoreBounceScale: number = 2;

    @property({
        type: CCString,
        group: 'TweenSettings',
        tooltip:
            'linear, smooth, fade, constant, quadIn, quadOut, quadInOut, quadOutIn, cubicIn, cubicOut, cubicInOut, cubicOutIn, quartIn, quartOut, quartInOut, quartOutIn, quintIn, quintOut, quintInOut, quintOutIn, sineIn, sineOut, sineInOut, sineOutIn, expoIn, expoOut, expoInOut, expoOutIn, circIn, circOut, circInOut, circOutIn, elasticIn, elasticOut, elasticInOut, elasticOutIn, backIn, backOut, backInOut, backOutIn, bounceIn, bounceOut, bounceInOut, bounceOutIn'
    })
    scoreBounceEasing: TweenEasing = 'bounceOut';

    @property({ type: CCFloat, group: 'TweenSettings' })
    scoreToHUDTime: number = 0.5;

    @property({ type: CCFloat, group: 'TweenSettings', tooltip: 'Offset for the bezier curve when tweening the score to the HUD.' })
    scoreToHUDMidpointOffset: number = -15;

    @property({
        type: CCString,
        group: 'TweenSettings',
        tooltip:
            'linear, smooth, fade, constant, quadIn, quadOut, quadInOut, quadOutIn, cubicIn, cubicOut, cubicInOut, cubicOutIn, quartIn, quartOut, quartInOut, quartOutIn, quintIn, quintOut, quintInOut, quintOutIn, sineIn, sineOut, sineInOut, sineOutIn, expoIn, expoOut, expoInOut, expoOutIn, circIn, circOut, circInOut, circOutIn, elasticIn, elasticOut, elasticInOut, elasticOutIn, backIn, backOut, backInOut, backOutIn, bounceIn, bounceOut, bounceInOut, bounceOutIn'
    })
    scoreToHUDEasing: TweenEasing = 'sineInOut';

    @property({
        type: CCString,
        group: 'TweenSettings',
        tooltip:
            'linear, smooth, fade, constant, quadIn, quadOut, quadInOut, quadOutIn, cubicIn, cubicOut, cubicInOut, cubicOutIn, quartIn, quartOut, quartInOut, quartOutIn, quintIn, quintOut, quintInOut, quintOutIn, sineIn, sineOut, sineInOut, sineOutIn, expoIn, expoOut, expoInOut, expoOutIn, circIn, circOut, circInOut, circOutIn, elasticIn, elasticOut, elasticInOut, elasticOutIn, backIn, backOut, backInOut, backOutIn, bounceIn, bounceOut, bounceInOut, bounceOutIn'
    })
    scoreToHUDScaleEasing: TweenEasing = 'quartIn';

    @property({ type: CCFloat, group: 'TweenSettings', tooltip: 'Score scale by the time it reaches the hud.' })
    scoreToHUDFinalScale: number = 0.2;

    @property({ type: CCFloat, group: 'TweenSettings', tooltip: 'Delay before the score starts counting up.' })
    scoreTallyDelay: number = 0;

    @property({ type: CCFloat, group: 'TweenSettings' })
    scoreTallyTime: number = 1;

    @property({
        type: CCFloat,
        group: 'TweenSettings',
        tooltip: 'Speed of the deck appear animation. 1 is normal speed, 2 is double speed. etc.'
    })
    deckAppearAnimationSpeed: number = 1.2;

    @property({ type: CCFloat, group: 'TweenSettings', tooltip: 'Time it takes for the card to move from the deck to the grip, in seconds.' })
    cardDrawAnimationTime: number = 0.28;

    private _currentScore = 0;
    private _scoreTarget = 0;
    private _currentHandClassification: HandClassification = null;
    private _scoreTallyTween: Tween<{ value: number }> | null = null;
    private _handScoreTween: Tween<Node> | null = null;
    private _powerupToggles: Toggle[] = [];
    private _previousActiveToggle: Toggle = null;
    private _powerupEntries: PowerupEntry[] = [];
    private _endgamePowerupEntries: PowerupEntry[] = [];
    private _currentDeckLength: number = 0;
    private _visualCardDeckLength: number = 0;
    private _cardScrambleGameController: CardScrambleGameController = null;
    private _itemConfig: ItemConfig = null;
    private _cardScrambleService: ICardScrambleService;
    private _tutorialService: TutorialService;
    private _uiOverlayService: UIOverlayService;
    private _requirementsService: RequirementsService;
    private _onDeckAnimCompleteCallback: () => void;
    private _appConfig: AppConfig = null;
    private _currentHandTier: HandTier;
    private _previousHandAnimClipPlayed: number = 0;

    private _playButtonAnimator: Animation;
    private _giveUpButtonAnimator: Animation;

    private nodeToCheckPosition: Node;
    private cardTweenActive: boolean = false;
    private _previousHandReadyStatus: boolean = false;
    private _rankSuitSort: string = 'rank';
    private _deckActive: boolean = true;
    private _endGamePowerupsActive: boolean = false;

    private _midGamePowerups: Powerup[] = [];
    private _endGamePowerups: Powerup[] = [];

    private _powerupPanelInPos = new Vec3();
    private _powerupPanelOutPos = new Vec3();
    private _powerupTweenActive: boolean = false;
    private _powerupEntryTween: Tween<Node>;

    private _powerupsEnabledFromCardsPlayedState = false;

    private _onTeardownCallback: () => void;

    private _log = logger.child('HUDController');

    private _cardDragInstructor: CardDragInstructor = null;

    start() {
        if (this.playHandButton) {
            this.playHandButton.node.on(Button.EventType.CLICK, this._onPlayHandClicked, this);
            this._playButtonAnimator = this.playHandButton.node.getComponent(Animation);
            if (this._playButtonAnimator == null) {
                this._log.error('Play Hand button animator is not assigned.');
            }
        } else {
            this._log.error('Play Hand button ref is not assigned.');
        }

        if (this.recallCardsButton) {
            this.recallCardsButton.node.on(Button.EventType.CLICK, this._onRecallCardsClicked, this);
        } else {
            this._log.error('Recall Cards button ref is not assigned.');
        }

        if (this.shuffleCardsButton) {
            this.shuffleCardsButton.node.on(Button.EventType.CLICK, this._onShuffleButtonClicked, this);
        } else {
            this._log.error('Shuffle Cards button ref is not assigned.');
        }

        if (this.sortCardsByRankSuitButton) {
            this.sortCardsByRankSuitButton.node.on(Button.EventType.CLICK, this._onSortByRankSuitButtonClicked, this);
        } else {
            this._log.error('Sort Cards By Rank button ref is not assigned.');
        }

        if (this.settingsButton) {
            this.settingsButton.node.on(Button.EventType.CLICK, this._onSettingsClicked, this);
        } else {
            this._log.error('Settings button ref is not assigned.');
        }

        if (this.howToPlayButton) {
            this.howToPlayButton.node.on(Button.EventType.CLICK, this._onHowToPlayClicked, this);
        } else {
            this._log.error('How To Play button ref is not assigned.');
        }

        if (this.giveUpButton) {
            this.giveUpButton.node.on(Button.EventType.CLICK, this._onFinishLevelClicked, this);
            this._giveUpButtonAnimator = this.giveUpButton.node.getComponent(Animation);
            if (this._giveUpButtonAnimator == null) {
                this._log.error('Give Up button animator is not assigned.');
            }
        } else {
            this._log.error('Finish Game button ref is not assigned.');
        }

        if (this.usePowerupButton) {
            this.usePowerupButton.node.on(Button.EventType.CLICK, this._onPowerupSelected, this);
        } else {
            this._log.error('Use Powerup button ref is not assigned.');
        }

        if (this.deckAnimation) {
            this.deckAnimation.on(Animation.EventType.FINISHED, this._onDeckAnimComplete, this);
        }

        if (this.handNameAnim) {
            this.handNameAnim.on(Animation.EventType.FINISHED, this._onHandReadyAnimComplete, this);
        }

        this.giveUpButton.interactable = false;
        this.usePowerupButton.node.active = false;
        this.recallCardsButton.interactable = false;
        this.shuffleCardsButton.interactable = false;
        this.sortCardsByRankSuitButton.interactable = false;
        this.playHandButton.node.active = false;
        this.giveUpButton.node.active = false;
        this.deckAnimation.node.active = false;

        // Disable tweening score on load
        this.tweeningScore.node.active = false;
        this._scoreTarget = 0;
        this._currentScore = 0;
        this.playerScore.string = '0';

        // Cache powerup tween in/out positions
        this._powerupPanelInPos = this.powerupParent.getWorldPosition();
        this._powerupPanelOutPos = this.powerupParent.getWorldPosition().add(new Vec3(500, 0, 0));
    }

    public init() {}

    public InitGoalsUI(goals: GameObjective[], cardScrambleService: ICardScrambleService) {
        const quickPlaySaveData = cardScrambleService.getQuickPlaySaveData();

        if (quickPlaySaveData) {
            this.goalsUI.InitGoals(goals, quickPlaySaveData.highscore);
        } else {
            this.goalsUI.InitGoals(goals, 0);
        }
    }

    public BlockHUDInteraction(blocked: boolean) {
        this.hudScrim.active = blocked;
    }

    public UpdateGoalsUI(goals: GameObjective[], objectiveProgress: number[][], objectivePipsComplete: number[][], currentScore: number) {
        if (goals.length > 0) {
            this.goalsUI.UpdateGoals(goals, objectiveProgress, objectivePipsComplete);
        } else {
            this.goalsUI.UpdateQuickPlayGoal(currentScore);
        }
    }

    public updateGoalsLayeringForFreeDessert() {
        let pos = this.leftGoalsSection.getWorldPosition();
        this.leftGoalsSection.setSiblingIndex(this.node.children.length - 1);
        this.leftGoalsSection.setWorldPosition(pos);
    }

    public resetGoalsLayering() {
        let pos = this.leftGoalsSection.getWorldPosition();
        this.leftGoalsSection.setSiblingIndex(1);
        this.leftGoalsSection.setWorldPosition(pos);
    }

    public setEndGamePowerups(powerups: Powerup[]) {
        this._endGamePowerups = powerups;
    }

    public InitPowerupsUI(
        controller: CardScrambleGameController,
        cardScrambleService: ICardScrambleService,
        uiOverlayService: UIOverlayService,
        requirementsService: RequirementsService,
        powerups: Powerup[],
        itemConfig: ItemConfig,
        tutorialService: TutorialService
    ) {
        this._midGamePowerups = powerups;
        this._cardScrambleGameController = controller;
        this._itemConfig = itemConfig;
        this._cardScrambleService = cardScrambleService;
        this._uiOverlayService = uiOverlayService;
        this._requirementsService = requirementsService;
        this._tutorialService = tutorialService;
        powerups.forEach((powerup, i) => {
            const powerupInfo = itemConfig.getItemInfo(powerup.PowerupType);
            if (!powerupInfo) {
                this._log.warn(`Failed to find powerup info for powerup ${powerup.PowerupType}`);
                return;
            }
            if (!requirementsService.checkRequirementsMet(powerupInfo?.requirements) && !cardScrambleService.cheatAllPowerups) {
                this._log.debug(`Level Requirement For ${powerup.PowerupType} Not Met. Skipping initialization`);
                return;
            }

            let powerupEntry = instantiate(this.powerupEntryPrefab);
            powerupEntry.parent = this.powerupParent;
            powerupEntry.on('toggle', this._onPowerupToggled, this);

            const toggleComponent = powerupEntry.getComponent(Toggle);
            toggleComponent.isChecked = false;
            this._powerupToggles.push(toggleComponent);

            const powerupComponent = powerupEntry.getComponent(PowerupEntry);
            powerupComponent.InitEntry(
                cardScrambleService,
                uiOverlayService,
                requirementsService,
                powerup,
                powerupInfo,
                this._onPowerupUpsell.bind(this),
                controller.config
            );
            this._powerupEntries.push(powerupComponent);
        });

        const plus7Powerup = new Plus7CardsPowerup(controller, this.deckAnimation, this.plus7Anim);
        const jokerPowerup = new JokerPowerup(controller, this.cardTransformerPrefab, this.jokerPowerupEntry);

        // setup the +7 cards powerup
        const plus7PowerupInfo = itemConfig.getItemInfo(plus7Powerup.PowerupType);
        this.plus7CardsPowerupEntry.InitEntry(
            cardScrambleService,
            uiOverlayService,
            requirementsService,
            plus7Powerup,
            plus7PowerupInfo,
            this._onPowerupUpsell.bind(this),
            controller.config
        );

        const jokerPowerupInfo = itemConfig.getItemInfo(jokerPowerup.PowerupType);
        this.jokerPowerupEntry.InitEntry(
            cardScrambleService,
            uiOverlayService,
            requirementsService,
            jokerPowerup,
            jokerPowerupInfo,
            this._onPowerupUpsell.bind(this),
            controller.config
        );
        this.jokerUpsellContainer.InitEntry(cardScrambleService);

        this.plus7CardsPowerupEntry.node.on(PowerupEntry.OnPowerupSelectedEvent, (powerup) => {
            this.node.emit(PowerupEntry.OnPowerupSelectedEvent, powerup);

            this.plus7CardsPowerupEntry.node.getComponent(Toggle).isChecked = false;
            this._cardScrambleGameController.currentPlayerHand.setHandInteractable(false);
            this.BlockHUDInteraction(true);
        });
        this.plus7CardsUpsellContainer.InitEntry(cardScrambleService);

        this.jokerPowerupEntry.node.on(PowerupEntry.OnPowerupSelectedEvent, (powerup) => {
            this.node.emit(PowerupEntry.OnPowerupSelectedEvent, powerup);

            let toggleComponent = this.jokerPowerupEntry.node.getComponent(Toggle);

            toggleComponent.isChecked = false;
            toggleComponent.interactable = false;
        });

        if (!requirementsService.checkRequirementsMet(jokerPowerupInfo?.requirements) && !cardScrambleService.cheatAllPowerups) {
            this._log.debug(`Level Requirement For ${jokerPowerup.PowerupType} Not Met. Disabling Entry`);

            this.jokerPowerupEntry.node.active = false;
            this.jokerUpsellContainer.node.active = false;
        }

        if (!requirementsService.checkRequirementsMet(plus7PowerupInfo?.requirements) && !cardScrambleService.cheatAllPowerups) {
            this._log.debug(`Level Requirement For ${plus7Powerup.PowerupType} Not Met. Disabling Entry`);

            this.plus7CardsPowerupEntry.node.active = false;
            this.plus7CardsUpsellContainer.node.active = false;
        }

        this.normalCurrencyWidget.disableGetMore();
        let updateCurrencyWidgetCallback = this._updateCurrencyWidget.bind(this, cardScrambleService);
        cardScrambleService.registerOnCurrencyUpdateEventCallback(updateCurrencyWidgetCallback);

        this._updateCurrencyWidget(cardScrambleService);

        this._onTeardownCallback = () => {
            cardScrambleService.unregisterOnCurrencyUpdateEventCallback(updateCurrencyWidgetCallback);
        };

        director.on(Powerup.OnPowerupPreparedEvent, this._onPowerupPrepared, this);
    }

    private _updatePowerupsUI(isEndGame: boolean) {
        if (!isEndGame && this._endGamePowerupsActive) {
            if (!this._powerupTweenActive) {
                this._powerupTweenActive = true;
                this._powerupEntryTween = tween(this.powerupParent)
                    .to(0.25, { worldPosition: this._powerupPanelOutPos }, { easing: 'backInOut' })
                    .call(() => {
                        this._endgamePowerupEntries.forEach((entry) => {
                            entry.node.active = false;
                        });

                        this._powerupEntries.forEach((entry) => {
                            entry.node.active = true;
                        });

                        tween(this.powerupParent)
                            .to(0.25, { worldPosition: this._powerupPanelInPos }, { easing: 'backInOut' })
                            .call(() => {
                                this._powerupTweenActive = false;
                            })
                            .start();
                    })
                    .start();
            } else {
                this._powerupEntryTween.stop();

                this._endgamePowerupEntries.forEach((entry) => {
                    entry.node.active = false;
                });

                this._powerupEntries.forEach((entry) => {
                    entry.node.active = true;
                });

                this.powerupParent.setWorldPosition(this._powerupPanelInPos);

                this._powerupTweenActive = false;
            }

            this._endGamePowerupsActive = false;
        } else if (isEndGame && !this._endGamePowerupsActive) {
            if (!this._powerupTweenActive) {
                this._powerupTweenActive = true;
                this._powerupEntryTween = tween(this.powerupParent)
                    .to(0.25, { worldPosition: this._powerupPanelOutPos }, { easing: 'backInOut' })
                    .call(() => {
                        if (this._endgamePowerupEntries.length < 1) {
                            //end game powerups need to be initialized
                            this._endGamePowerups.forEach((powerup, i) => {
                                const powerupInfo = this._itemConfig.getItemInfo(powerup.PowerupType);
                                if (!powerupInfo) {
                                    this._log.warn(`Failed to find powerup info for powerup ${powerup.PowerupType}`);
                                    return;
                                }
                                if (
                                    !this._requirementsService.checkRequirementsMet(powerupInfo?.requirements) &&
                                    !this._cardScrambleService.cheatAllPowerups
                                ) {
                                    this._log.debug(`Level Requirement For ${powerup.PowerupType} Not Met. Skipping initialization`);
                                    return;
                                }

                                let powerupEntry = instantiate(this.powerupEntryPrefab);
                                powerupEntry.parent = this.powerupParent;
                                powerupEntry.on('toggle', this._onPowerupToggled, this);

                                const toggleComponent = powerupEntry.getComponent(Toggle);
                                toggleComponent.isChecked = false;
                                this._powerupToggles.push(toggleComponent);

                                const powerupComponent = powerupEntry.getComponent(PowerupEntry);
                                powerupComponent.InitEntry(
                                    this._cardScrambleService,
                                    this._uiOverlayService,
                                    this._requirementsService,
                                    powerup,
                                    powerupInfo,
                                    this._onPowerupUpsell.bind(this),
                                    this._cardScrambleGameController.config
                                );
                                this._endgamePowerupEntries.push(powerupComponent);
                            });
                        }

                        this._endgamePowerupEntries.forEach((entry) => {
                            entry.node.active = true;

                            if (entry.powerup.PowerupType === PowerupType.CleanDown) {
                                let cleanDownPowerup = entry.powerup as CleanDownPowerup;
                                let tilesToRemove = cleanDownPowerup.getTilesToRemove(false);
                                entry.setState(false, tilesToRemove.length > 0);
                            }
                        });

                        this._powerupEntries.forEach((entry) => {
                            entry.node.active = false;
                        });

                        tween(this.powerupParent)
                            .to(0.25, { worldPosition: this._powerupPanelInPos }, { easing: 'backInOut' })
                            .call(() => {
                                if (this._menuId && this._menuId !== '') {
                                    this._tutorialService.onMenuOpened(this._menuId);
                                }

                                this._powerupTweenActive = false;
                            })
                            .start();
                    })
                    .start();
            } else {
                this._powerupEntryTween.stop();

                this._endgamePowerupEntries.forEach((entry) => {
                    entry.node.active = true;

                    if (entry.powerup.PowerupType === PowerupType.CleanDown) {
                        let cleanDownPowerup = entry.powerup as CleanDownPowerup;
                        let tilesToRemove = cleanDownPowerup.getTilesToRemove(false);
                        entry.setState(false, tilesToRemove.length > 0);
                    }
                });

                this._powerupEntries.forEach((entry) => {
                    entry.node.active = false;
                });

                this.powerupParent.setWorldPosition(this._powerupPanelInPos);

                this._powerupTweenActive = false;
            }

            this._endGamePowerupsActive = true;
        }
    }

    public setDeckActive(active: boolean) {
        this._deckActive = active;
    }

    public setAppConfig(appConfig: AppConfig) {
        this._appConfig = appConfig;
    }

    public async UpdatePowerupState(jokerPowerupCount: number) {
        this._powerupEntries.forEach((powerupEntry) => {
            powerupEntry.updateVisuals();
        });
        this._endgamePowerupEntries.forEach((powerupEntry) => {
            powerupEntry.updateVisuals();
        });
        this.plus7CardsPowerupEntry.updateVisuals();
        this.jokerPowerupEntry.updateVisuals();
        await this._updateJokerPowerupState(jokerPowerupCount);
    }

    public SetPowerupsEnabled(enabled: boolean) {
        this._powerupEntries.forEach((entry) => {
            entry.setState(false, enabled);
        });

        this.jokerPowerupEntry.setState(false, enabled);
        this.plus7CardsPowerupEntry.setState(false, enabled);
    }

    public TogglePowerupsFromCardsPlayed(isEnabled: boolean) {
        this._powerupsEnabledFromCardsPlayedState = isEnabled;

        this._powerupEntries.forEach((entry) => {
            if (entry.powerup.PowerupType === PowerupType.ExtraServings) {
                return;
            }

            entry.setState(false, isEnabled);
        });

        this.jokerPowerupEntry.setState(false, isEnabled);
        this.plus7CardsPowerupEntry.setState(false, isEnabled);
    }

    public SetSortingButtonsEnabled(enabled: boolean) {
        this.sortCardsByRankSuitButton.interactable = enabled;
        this.shuffleCardsButton.interactable = enabled;
    }

    public toggleExtraServingsVFX(enabled: boolean) {
        this.extraServingsVFX.active = enabled;

        if (this._currentHandClassification != null) {
            this.handScore.string = `${this._currentHandClassification.scoreWithModifier * MatchOperations.handScoreMultiplier}`;
        }
    }

    private _onPowerupToggled() {
        this.usePowerupButton.node.active = false;

        let toggleGroup = this.powerupParent.getComponent(ToggleContainer);

        if (toggleGroup.anyTogglesChecked()) {
            const powerupEntry = toggleGroup.activeToggles()[0].getComponent(PowerupEntry);
            const powerup = powerupEntry.powerup;

            this.node.emit(HUDController.UIEventPreparePowerup, powerup);

            if (toggleGroup.activeToggles()[0] !== this._previousActiveToggle && this._previousActiveToggle !== null) {
                this.node.emit(HUDController.UIEventCancelPowerup, this._previousActiveToggle.getComponent(PowerupEntry).powerup);
            }

            this._previousActiveToggle = toggleGroup.activeToggles()[0];
        } else if (this._previousActiveToggle !== null) {
            this.node.emit(HUDController.UIEventCancelPowerup, this._previousActiveToggle.getComponent(PowerupEntry).powerup);

            this._previousActiveToggle = null;
        }
    }

    private _onPowerupPrepared(isPrepared: boolean) {
        this.usePowerupButton.node.active = isPrepared;

        if (!isPrepared) {
            let toggleGroup = this.powerupParent.getComponent(ToggleContainer);

            toggleGroup.activeToggles().forEach((toggle) => {
                toggle.isChecked = false;
            });
        }
    }

    private _onPowerupUpsell(itemInfo: ItemInfo) {
        this.node.emit(PowerupEntry.OnPowerupUpsellEvent, itemInfo);
    }

    public initDeck(onComplete: () => void) {
        SoundManager.instance.playSound('SFX_Gameplay_DeckAppear');
        const animState = this.deckAnimation.getState(this.deckAnimation.clips[0].name);
        animState.speed = 1.2;
        animState.time = animState.duration;
        animState.play();
        this.deckAnimation.node.active = true;

        this._onDeckAnimCompleteCallback = onComplete;
    }

    private _onDeckAnimComplete() {
        this.shuffleCardsButton.interactable = true;
        this.sortCardsByRankSuitButton.interactable = true;
        this._onDeckAnimCompleteCallback();
    }

    private _onHandReadyAnimComplete(type: Animation.EventType, state: AnimationState) {
        const clips = this.handNameAnim.clips;

        switch (state.clip.name) {
            case clips[0].name:
                this.handNameAnim.play(clips[1].name);
                this._previousHandAnimClipPlayed = 1;
                break;
            case clips[3].name:
                this.handNameAnim.play(clips[4].name);
                this._previousHandAnimClipPlayed = 4;
                break;
            case clips[6].name:
                this.handNameAnim.play(clips[7].name);
                this._previousHandAnimClipPlayed = 7;
                break;
            case clips[9].name:
                this.handNameAnim.play(clips[10].name);
                this._previousHandAnimClipPlayed = 10;
                break;
        }

        //when exit animation is done, disable the extra servings vfx
        let exitAnims: AnimationClip[] = [];

        exitAnims.push(clips[2]);
        exitAnims.push(clips[5]);
        exitAnims.push(clips[8]);

        let extraServingsToggle = this._powerupToggles.find(
            (toggle) => toggle.isChecked && toggle.node.getComponent(PowerupEntry).powerup.PowerupType === PowerupType.ExtraServings
        );
        let isExtraServingsActive = false;

        if (extraServingsToggle) {
            isExtraServingsActive = true;
        }

        if (exitAnims.includes(state.clip) && !isExtraServingsActive) {
            this.toggleExtraServingsVFX(false);
        }
    }

    public updateDeckCount(currentDeckCount: number) {
        if (currentDeckCount == this._currentDeckLength) {
            return;
        }

        if (currentDeckCount < this._currentDeckLength) {
            this._visualCardDeckLength = this._currentDeckLength;
        } else {
            this._visualCardDeckLength = currentDeckCount;
        }
        this._currentDeckLength = currentDeckCount;

        let numActiveDeckCards: number = 0;

        this.cardBacks.forEach((cardBack) => {
            if (cardBack.active) {
                numActiveDeckCards++;
            }
        });

        if (this._currentDeckLength > numActiveDeckCards) {
            const activeCardDifference = this._currentDeckLength - numActiveDeckCards;
            let activationCount: number = 0;

            const cardBackListCopy = [...this.cardBacks];
            cardBackListCopy.reverse();

            for (const cardBack of cardBackListCopy) {
                if (!cardBack.active) {
                    cardBack.active = true;
                    activationCount++;
                    cardBack.setWorldPosition(cardBack.getWorldPosition().subtract(new Vec3(0, 300, 0)));

                    if (activationCount === activeCardDifference) {
                        break;
                    }
                }
            }
        }

        this.remainingCardsLabel.string = `${this._visualCardDeckLength}`;

        if (currentDeckCount > 0) {
            this.setDeckActive(true);
        }
    }

    private _removeCardFromDeckStack() {
        for (const cardBack of this.cardBacks) {
            if (cardBack.active) {
                cardBack.active = false;
                return;
            }
        }
    }

    public playDrawCardTween(cardSlot: GripCardSlot, cardToDraw: Card, onComplete: () => void) {
        SoundManager.instance.playSound('SFX_Gameplay_CardDrawn');
        const cardInstance = instantiate(this.cardBackPrefab);
        cardInstance.parent = this.deckAnimation.node;
        cardInstance.getComponentInChildren(CardVisual).setToCard(cardToDraw);

        if (this.cardBacks.length > 0) {
            cardInstance.setWorldPosition(this.cardBacks[0].getWorldPosition());
        }

        this._updateVisualDeckFromCardDraw();

        const cardAnimation = cardInstance.getComponent(Animation);
        const animState = cardAnimation.getState(cardAnimation.clips[0].name);
        animState.speed = 1;
        animState.time = animState.duration;
        animState.play();

        this.scheduleOnce(() => {
            //duration is the length of the animation clip
            tween(cardInstance)
                .to(this.cardDrawAnimationTime, { worldPosition: cardSlot.activeCard.node.getWorldPosition() }, { easing: 'backOut' })
                .call(() => {
                    this.cardTweenActive = false;
                    cardSlot.activeCard.node.active = true;
                    cardInstance.destroy();
                    onComplete();
                })
                .start();
        }, 0);
    }

    public drawCardFromLoosenYourBelt() {
        SoundManager.instance.playSound('SFX_Gameplay_CardDrawn');
        this._updateVisualDeckFromCardDraw();
    }

    private _updateVisualDeckFromCardDraw() {
        if (this._visualCardDeckLength > 0) {
            this._visualCardDeckLength--;
            this.remainingCardsLabel.string = `${this._visualCardDeckLength}`;
        }

        if (this._visualCardDeckLength < this.cardBacks.length) {
            this._removeCardFromDeckStack();
        }
    }

    public async onHandDrawComplete() {
        if (this._visualCardDeckLength != this._currentDeckLength) {
            this._log.warn(`Bug in card deck accounting. visual=${this._visualCardDeckLength} actual=${this._currentDeckLength}`);
        }
        this._visualCardDeckLength = this._currentDeckLength;
        this.remainingCardsLabel.string = `${this._visualCardDeckLength}`;
    }

    public setCardPlayedStatus(numCards: number) {
        if (numCards <= 0 || numCards >= BoardHelpers.HAND_SIZE) {
            this.handFeedback.string = ``;
            this.handFeedbackAnim.play('preview-cards-feedback-exit');
        } else {
            this.handFeedback.string = `Play ${numCards} more card${numCards > 1 ? 's' : ''}!`;
            this.handFeedbackAnim.play('preview-cards-feedback-enter');
            this.handFeedbackAnim.once(Animation.EventType.FINISHED, () => {
                this.handFeedbackAnim.play('preview-cards-feedback-idle');
            });
        }
    }

    public setHandReady(ready: boolean, handClassification: HandClassification | null) {
        this._currentHandClassification = handClassification;

        this.handName.node.active = ready;
        this.handScore.node.active = ready;
        if (handClassification != null) {
            this.handName.string = handClassification.name;
            this.handScore.string = `${handClassification.scoreWithModifier * MatchOperations.handScoreMultiplier}`;
        }

        this.enablePlayHandButton(ready);
        this.enableRecallCardsButton(ready);

        if (!this._previousHandReadyStatus && !ready) {
            return;
        }

        //animations
        const clips = this.handNameAnim.clips;

        if (handClassification) {
            const handNameAndTier = this._appConfig.handTierList.find(
                (handNameAndTier) => handNameAndTier.HandName === handClassification.handName
            );

            if (!handNameAndTier) {
                this._log.error('HudController: Cannot Find Hand Tier for ' + handClassification.handName);
                return;
            }

            this._currentHandTier = handNameAndTier.Tier;
        }

        if (ready) {
            switch (this._currentHandTier) {
                case HandTier.Low:
                    this.handNameAnim.play(clips[6].name);
                    this._previousHandAnimClipPlayed = 6;
                    SoundManager.instance.playSound('SFX_Gameplay_HandReady1');
                    break;
                case HandTier.Mid:
                    this.handNameAnim.play(clips[3].name);
                    this._previousHandAnimClipPlayed = 3;
                    SoundManager.instance.playSound('SFX_Gameplay_HandReady2');
                    break;
                case HandTier.High:
                    this.handNameAnim.play(clips[0].name);
                    this._previousHandAnimClipPlayed = 0;
                    SoundManager.instance.playSound('SFX_Gameplay_HandReady3');
                    break;
            }
        } else {
            switch (this._currentHandTier) {
                case HandTier.Low:
                    this.handNameAnim.play(clips[8].name);
                    this._previousHandAnimClipPlayed = 8;
                    break;
                case HandTier.Mid:
                    this.handNameAnim.play(clips[5].name);
                    this._previousHandAnimClipPlayed = 5;
                    break;
                case HandTier.High:
                    this.handNameAnim.play(clips[2].name);
                    this._previousHandAnimClipPlayed = 2;
                    break;
            }
        }

        this._previousHandReadyStatus = ready;
    }

    public async updatePlus7CardsPowerupState(powerupCount: number) {
        if (this._currentDeckLength < 1) {
            const upsellOffer = await this._cardScrambleGameController.getNextUpsell(this.plus7CardsPowerupEntry.itemInfo);
            this.plus7CardsUpsellContainer.setNextUpsellOffer(upsellOffer);
            this.plus7CardsPowerupEntry.node.active = true;
            const clips = this.plus7Anim.clips;

            if (this._deckActive) {
                this.plus7CardsPowerupEntry.node.parent.active = true;

                if (powerupCount > 0) {
                    this.plus7CardsUpsellContainer.node.active = false;
                } else {
                    this.plus7CardsUpsellContainer.node.active = true;
                }

                this.plus7Anim.play(clips[0].name);
                this.plus7Anim.once(Animation.EventType.FINISHED, () => {
                    this.plus7Anim.play(clips[2].name);
                    this._deckActive = false;
                });
            }
        } else {
            this.plus7CardsPowerupEntry.node.active = false;
        }
    }

    private async _updateJokerPowerupState(powerupCount: number) {
        const upsellOffer = await this._cardScrambleGameController.getNextUpsell(this.jokerPowerupEntry.itemInfo);
        this.jokerUpsellContainer.setNextUpsellOffer(upsellOffer);

        if (powerupCount > 0) {
            this.jokerUpsellContainer.node.active = false;
        } else {
            if (this.jokerPowerupEntry.node.active) {
                this.jokerUpsellContainer.node.active = true;
            } else {
                this.jokerUpsellContainer.node.active = false;
            }
        }

        //enforce max hand size
        if (
            this._cardScrambleGameController.currentPlayerHand.getCardsInGrip().length >=
            this._cardScrambleGameController.appConfig.maximumHandSize
        ) {
            this.jokerPowerupEntry.setState(false, false);
        } else {
            this.jokerPowerupEntry.setState(false, this._powerupsEnabledFromCardsPlayedState);
        }
    }

    public updateState(match: Match, playerScore: number, botScore: number) {
        this.setHandReady(false, null);

        if (this._scoreTarget == playerScore) {
            return;
        }

        // Tween the score to the target score

        this._scoreTarget = playerScore;
        const scoreObj = { value: this._currentScore };
        if (this._scoreTallyTween) {
            this._scoreTallyTween.stop();
        }
        this._scoreTallyTween = tween(scoreObj)
            .delay(this.scoreTallyDelay)
            .call(() => {
                SoundManager.instance.playSound('SFX_Gameplay_PointCount');
            })
            .to(
                this.scoreTallyTime,
                { value: this._scoreTarget },
                {
                    easing: 'quadOut',
                    onUpdate: (target: { value: number }) => {
                        this._currentScore = Math.round(target.value);
                        this.playerScore.string = `${this._currentScore}`;
                    }
                }
            )
            .call(() => {
                SoundManager.instance.stopSoundByName('SFX_Gameplay_PointCount');
                this._currentScore = this._scoreTarget;
                this.playerScore.string = `${this._scoreTarget}`;
            })
            .start();
    }

    // Convenience methods to handle specific buttons
    public showRecallCardsButton(show: boolean) {
        this._showButton(this.recallCardsButton, show);
    }

    public enableRecallCardsButton(enable: boolean) {
        this._enableButton(this.recallCardsButton, enable);
    }

    public enablePlayHandButton(enable: boolean) {
        if (enable) {
            this.playHandButton.interactable = true;
            this.playHandButton.node.active = true;
            this._playButtonAnimator.play('enter-down');
        } else {
            this._playButtonAnimator.play('exit-down');
            this.playHandButton.interactable = false;
            this._playButtonAnimator.once(Animation.EventType.FINISHED, () => {
                if (!this.playHandButton.interactable) {
                    this.playHandButton.node.active = false;
                }
            });
        }
    }

    public enableGiveupButton(enable: boolean, reason?: string) {
        if (enable) {
            this.handName.node.active = enable;
            this.giveUpButton.interactable = enable;
            this.giveUpButton.node.active = enable;
            this.handName.string = reason || '';
            this._giveUpButtonAnimator.play('enter-down');
            this.handNameAnim.play(this.handNameAnim.clips[9].name);
            this._previousHandAnimClipPlayed = 9;
            this._updatePowerupsUI(true);
        } else {
            this.handName.node.active = enable;
            this._giveUpButtonAnimator.play('exit-down');
            if (this._previousHandAnimClipPlayed === 10) {
                this.handNameAnim.play(this.handNameAnim.clips[11].name);
                this._previousHandAnimClipPlayed = 11;
            }
            this.giveUpButton.interactable = false;
            this._giveUpButtonAnimator.once(Animation.EventType.FINISHED, () => {
                if (!this.giveUpButton.interactable) {
                    this.giveUpButton.node.active = false;
                }
            });
            this._updatePowerupsUI(false);
        }
    }

    public showSortCardsButton(show: boolean) {
        this._showButton(this.shuffleCardsButton, show);
        this._showButton(this.sortCardsByRankSuitButton, show);
    }

    public enableSortCardsButton(enable: boolean) {
        this._enableButton(this.shuffleCardsButton, enable);
        this._enableButton(this.sortCardsByRankSuitButton, enable);
    }

    public tweenHandScore(scoreToDisplay: number, startWorldPos: Vec3, endWorldPos: Vec3 = this.playerScore.node.getWorldPosition()) {
        const scoreTweenNode = this.tweeningScore.node;
        scoreTweenNode.active = true;
        scoreTweenNode.setWorldPosition(startWorldPos);
        const targetPosition = endWorldPos;

        const opacityComponent = scoreTweenNode.getComponent(UIOpacity);
        opacityComponent.opacity = 255;

        const textComponent = scoreTweenNode.getComponent(Label);
        textComponent.string = scoreToDisplay.toString();

        const bounceScale = new Vec3(this.scoreBounceScale, this.scoreBounceScale, this.scoreBounceScale);

        // Tween the score component:
        // bounce in / out and then translate to the score hud position
        if (this._handScoreTween) {
            this._handScoreTween.stop();
        }
        this._handScoreTween = tween(scoreTweenNode)
            .to(this.scoreBounceTime, { scale: bounceScale }, { easing: this.scoreBounceEasing })
            .to(this.scoreBounceTime, { scale: new Vec3(1.0, 1.0, 1.0) }, { easing: this.scoreBounceEasing })
            .call(() => {
                tween(scoreTweenNode)
                    .parallel(
                        // Tween the score to the target position on a curve
                        tween().to(
                            this.scoreToHUDTime,
                            {},
                            {
                                easing: this.scoreToHUDEasing,
                                onUpdate: (target?: object, ratio?: number) => {
                                    const p0 = startWorldPos;
                                    const p1 = new Vec3(
                                        (startWorldPos.x + endWorldPos.x) / 2,
                                        (startWorldPos.y + endWorldPos.y) / 2 + this.scoreToHUDMidpointOffset, // Midpoint Y + offset
                                        (startWorldPos.z + endWorldPos.z) / 2
                                    );
                                    const p2 = endWorldPos;

                                    // Quadratic Bezier
                                    const t = ratio; // Progress
                                    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
                                    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
                                    const z = (1 - t) * (1 - t) * p0.z + 2 * (1 - t) * t * p1.z + t * t * p2.z;

                                    scoreTweenNode.setWorldPosition(new Vec3(x, y, z));
                                }
                            }
                        ),
                        tween().to(this.scoreToHUDTime, { scale: new Vec3(0.3, 0.3, 0.3) }, { easing: 'backIn' }),
                        tween()
                            .to(this.scoreToHUDTime, { opacity: 0 }, { easing: 'backIn' })
                            .call(() => {
                                scoreTweenNode.active = false;
                                scoreTweenNode.getComponent(UIOpacity).opacity = 255;
                                const newScore = this._currentScore + scoreToDisplay;
                                this.updateState(null, newScore, 0);
                            })
                    )
                    .start();
            })
            .start();
    }

    public async onPowerupUsed(powerup: Powerup) {
        await this._onPowerupSelected(powerup);
    }

    private async _onPowerupSelected(powerup: Powerup) {
        await new Promise<void>((resolve) => {
            this.node.emit(PowerupEntry.OnPowerupSelectedEvent, powerup, resolve);
        });

        this.powerupParent.getComponent(ToggleContainer).activeToggles()[0].isChecked = false;
    }

    public setSortButtonInteractable(interactable: boolean) {
        this.sortCardsByRankSuitButton.interactable = interactable;
    }

    public showCardDragInstructor(startPos: Vec3, endPos: Vec3) {
        if (!this._cardDragInstructor) {
            this._cardDragInstructor = instantiate(this.cardDragInstructor)?.getComponent(CardDragInstructor);
            this._cardDragInstructor.node.parent = this.node;
        }

        if (this._cardDragInstructor.isRunning()) {
            this._log.warn('Trying to run play reminder but it is already running');
            return;
        }

        this._cardDragInstructor.init(startPos, endPos);
        this._cardDragInstructor.start();
    }

    public stopCardDragInstructor() {
        this._cardDragInstructor?.stop();
    }

    public isDragInstructorPlaying(): boolean {
        return this._cardDragInstructor?.isRunning();
    }

    onDestroy() {
        if (this.playHandButton.node != null) {
            this.playHandButton.node.off(Button.EventType.CLICK, this._onPlayHandClicked, this);
        }
        if (this.recallCardsButton.node != null) {
            this.recallCardsButton.node.off(Button.EventType.CLICK, this._onRecallCardsClicked, this);
        }
        if (this.shuffleCardsButton.node != null) {
            this.shuffleCardsButton.node.off(Button.EventType.CLICK, this._onShuffleButtonClicked, this);
        }
        if (this.sortCardsByRankSuitButton.node != null) {
            this.sortCardsByRankSuitButton.node.off(Button.EventType.CLICK, this._onSortByRankSuitButtonClicked, this);
        }
        if (this.settingsButton.node != null) {
            this.settingsButton.node.off(Button.EventType.CLICK, this._onSettingsClicked, this);
        }
        if (this.howToPlayButton.node != null) {
            this.howToPlayButton.node.off(Button.EventType.CLICK, this._onHowToPlayClicked, this);
        }
        if (this._scoreTallyTween) {
            this._scoreTallyTween.stop();
            this._scoreTallyTween = null;
        }
        if (this._handScoreTween) {
            this._handScoreTween.stop();
            this._handScoreTween = null;
        }

        this._onTeardownCallback?.call(this);

        director.off(Powerup.OnPowerupPreparedEvent, this._onPowerupPrepared, this);
    }

    private _showButton(button: Button, show: boolean) {
        button.node.active = true;
    }

    private _hideButton(button: Button) {
        button.node.active = false;
    }

    private _enableButton(button: Button, enable: boolean) {
        button.interactable = enable;
    }

    private async _updateCurrencyWidget(cardScrambleService: ICardScrambleService) {
        let coins = await cardScrambleService.getCurrencyBalance(Currency.Coins);
        this.normalCurrencyWidget.setResourceCounter(coins);
    }

    private async _onPlayHandClicked() {
        // Switch statement to play a different sound based on the hand tier
        switch (this._currentHandTier) {
            case HandTier.Low:
                SoundManager.instance.playSound('SFX_Gameplay_Score1');
                break;
            case HandTier.Mid:
                SoundManager.instance.playSound('SFX_Gameplay_Score2');
                break;
            case HandTier.High:
                SoundManager.instance.playSound('SFX_Gameplay_Score3');
                break;
            default:
                SoundManager.instance.playSound('SFX_Gameplay_Score1');
                break;
        }

        this.tweenHandScore(
            this._currentHandClassification.scoreWithModifier * MatchOperations.handScoreMultiplier,
            this.handScore.node.getWorldPosition(),
            this.playerScore.node.getWorldPosition()
        );

        this.node.emit(HUDController.UIEventHandPlayed, this._currentHandClassification);
        this.onAnythingClicked();

        if (this.powerupParent.getComponent(ToggleContainer).anyTogglesChecked()) {
            const powerup: Powerup = this.powerupParent.getComponent(ToggleContainer).activeToggles()[0].getComponent(PowerupEntry).powerup;

            if (powerup.PowerupType === PowerupType.ExtraServings) {
                await this._onPowerupSelected(powerup);
            }
        }
    }

    private _onRecallCardsClicked() {
        this.node.emit(HUDController.UIEventRecallCards);
        this.onAnythingClicked();
    }

    private _onSortByRankSuitButtonClicked() {
        if (this._rankSuitSort === 'rank') {
            this._rankSuitSort = 'suit';
            this.node.emit(HUDController.UIEventSortHand, PlayerHand.SortBySuit);
            this.sortCardsByRankSuitLabel.string = 'Suit';
        } else {
            this._rankSuitSort = 'rank';
            this.node.emit(HUDController.UIEventSortHand, PlayerHand.SortByRank);
            this.sortCardsByRankSuitLabel.string = 'Rank';
        }
        this.onAnythingClicked();
    }

    private _onShuffleButtonClicked() {
        this.node.emit(HUDController.UIEventSortHand, PlayerHand.Shuffle);
        this.sortCardsByRankSuitLabel.string = 'Sort';
        this._rankSuitSort = 'rank';
        this.onAnythingClicked();
    }

    private _onSettingsClicked() {
        this.node.emit(HUDController.UIEventSettings);
        this.onAnythingClicked();
    }

    private _onHowToPlayClicked() {
        this.node.emit(HUDController.UIEventHowToPlay);
        this.onAnythingClicked();
    }

    private _onQuitGameClicked() {
        this.node.emit(HUDController.UIEventQuitGame);
        this.onAnythingClicked();
    }

    private _onFinishLevelClicked() {
        this.node.emit(HUDController.UIEventFinishLevel);
        this.onAnythingClicked();
    }

    public onAnythingClicked() {
        this.goalsUI.CloseAllTootips();
    }
}
