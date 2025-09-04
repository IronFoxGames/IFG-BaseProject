import { _decorator, Animation, Button, CCFloat, CCString, Color, Component, Label, LabelOutline, LabelShadow, Node, Sprite } from 'cc';
import { SoundManager } from '../../audio/SoundManager';
import { HUDConfig } from '../../config/HUDConfig';
import { LevelList } from '../../config/LevelList';
import { Currency } from '../../core/enums/Currency';
import { EntitlementType } from '../../core/enums/EntitlementType';
import { Requirement } from '../../core/model/requirements/Requirement';
import { PopupLayout, PopupType } from '../../game/ui/GeneralPopup';
import { logger } from '../../logging';
import { Services } from '../../state/Services';
import { StringUtils } from '../../utils/StringUtils';
import { DinerSceneController } from '../DinerSceneController';
import { ResourceWidget } from './ResourceWidget';

export enum DinerHUDState {
    Shown,
    Hidden,
    TaskView,
    StoreView
}

const { ccclass, property } = _decorator;

@ccclass('DinerHUDView')
export class DinerHUDView extends Component {
    public OnSettingsButtonPressed: () => void;
    public OnTasksButtonPressed: () => void;
    public OnDailyRewardButtonPressed: () => void;
    public OnBuildModeButtonPressed: () => void;
    public OnPlayButtonPressed: () => void;
    public OnQuickPlayButtonPressed: () => void;
    public OnStoreButtonPressed: () => void;
    public OnGetMoreGems: () => void;
    public OnGetMoreCoins: () => void;
    public OnGetMoreEnergy: () => void;
    public OnPlatformStoreButtonPressed: () => void;

    private _log = logger.child('DinerHUDView');

    @property({ type: ResourceWidget, visible: true, group: 'Resource Widgets' })
    private _energyResourceWidget: ResourceWidget;

    @property({ type: ResourceWidget, visible: true, group: 'Resource Widgets' })
    private _normalCurrencyResourceWidget: ResourceWidget;

    @property({ type: ResourceWidget, visible: true, group: 'Resource Widgets' })
    private _premiumCurrencyResourceWidget: ResourceWidget;

    @property({ type: ResourceWidget, visible: true, group: 'Resource Widgets' })
    private _starsResourceWidget: ResourceWidget;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _settingsButton: Button;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _tasksButton: Button;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _dailyRewardButton: Button;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _dailyRewardLockedButton: Button;

    @property({ type: Label, visible: true, group: 'Buttons' })
    private _dailyRewardLockedLabel: Label;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _buildModeButton: Button;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _playButton: Button;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _quickPlayButton: Button;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _levelsButton: Button;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _storeButton: Button;

    @property({ type: Node, visible: true, group: 'Notifications' })
    private _taskNotificationNode: Node;

    @property({ type: Node, visible: true, group: 'Notifications' })
    private _taskNotificationBadgeNode: Node;

    @property({ type: Animation, visible: true, group: 'Notifications' })
    private _taskNotificationAnimation: Animation;

    @property({ type: Label, visible: true, group: 'Notifications' })
    private _taskNotificationLabel: Label;

    @property({ type: Color, visible: true, group: 'Notifications', tooltip: 'The tint color of the task new notification outline' })
    private _newTaskNotificationOutlineColor: Color = new Color(255, 255, 255, 255);

    @property({ type: Color, visible: true, group: 'Notifications', tooltip: 'The shadow color of the task new notification text' })
    private _newTaskNotificationShadowColor: Color = new Color(255, 255, 255, 255);

    @property({ type: Color, visible: true, group: 'Notifications', tooltip: 'The tint color of the task new notification outline' })
    private _newTaskNotificationVfxTint: Color = new Color(255, 255, 255, 255);

    @property({ type: Color, visible: true, group: 'Notifications', tooltip: 'The tint color of the task ready notification outline' })
    private _taskReadyNotificationOutlineColor: Color = new Color(255, 255, 255, 255);

    @property({ type: Color, visible: true, group: 'Notifications', tooltip: 'The shadow color of the task ready notification text' })
    private _taskReadyNotificationShadowColor: Color = new Color(255, 255, 255, 255);

    @property({ type: Color, visible: true, group: 'Notifications', tooltip: 'The tint color of the task ready notification VFX' })
    private _taskReadyNotificationVfxTint: Color = new Color(255, 255, 255, 255);

    @property({
        type: Color,
        visible: true,
        group: 'Notifications',
        tooltip: 'The color of the text when the play button prompts players to complete tasks.'
    })
    private _completeTasksLabelColor: Color = new Color(255, 255, 255, 255);

    @property({
        type: CCString,
        visible: true,
        group: 'Notifications',
        tooltip: 'The label text for the play button when players need to complete tasks before playing.'
    })
    private _completeTasksLabelText: string = 'Finish Tasks';

    @property({
        type: CCFloat,
        visible: true,
        group: 'Notifications',
        tooltip: 'Duration the idle animation will loop before playing the exit animation'
    })
    private _taskNotificationDuration: number = 2.0;

    @property({ type: Node, visible: true, group: 'Notifications' })
    private _dailyRewardTimerNode: Node;

    @property({ type: Label, visible: true, group: 'Notifications' })
    private _dailyRewardTimerLabel: Label;

    @property({ type: Label, visible: true, group: 'Notifications' })
    private _playButtonLabel: Label;

    @property({ type: Node, visible: true, group: 'Notifications' })
    private _playButtonBadgeNode: Node;

    private _services: Services = null;
    private _dinerSceneController: DinerSceneController = null;
    private _taskNewNotificationQueued: boolean = false;
    private _taskReadyNotificationQueued: boolean = false;
    private _levelList: LevelList = null;
    private _hudConfig: HUDConfig = null;
    private _taskNotificationSequenceComplete: boolean = true;
    private _taskOutline: LabelOutline = null;
    private _taskShadow: LabelShadow = null;
    private _taskNotificationVfx: Sprite[] = [];
    private _loadingScreenComplete: boolean = false;
    private _lastEnergyCount: number = -1;

    private _onTeardownCallback: () => void;

    public init(services: Services, levelList: LevelList, hudConfig: HUDConfig, dinerSceneController: DinerSceneController) {
        this._settingsButton.node.on(Button.EventType.CLICK, this._onSettingsButtonPressedCallback, this);
        this._tasksButton.node.on(Button.EventType.CLICK, this._onTasksButtonPressedCallback, this);
        this._dailyRewardButton.node.on(Button.EventType.CLICK, this._onDailyRewardButtonPressedCallback, this);
        this._dailyRewardLockedButton.node.on(Button.EventType.CLICK, this._onDailyRewardLockedButtonPressedCallback, this);
        this._buildModeButton.node.on(Button.EventType.CLICK, this._onBuildModeButtonPressedCallback, this);
        this._playButton.node.on(Button.EventType.CLICK, this._onPlayButtonPressedCallback, this);
        this._quickPlayButton.node.on(Button.EventType.CLICK, this._onQuickPlayButtonPressedCallback, this);
        this._storeButton.node.on(Button.EventType.CLICK, this._onStoreButtonPressedCallback, this);

        this._taskOutline = this._taskNotificationLabel.getComponent(LabelOutline);
        this._taskShadow = this._taskNotificationLabel.getComponent(LabelShadow);
        this._taskNotificationVfx = this._taskNotificationAnimation.node.getComponentsInChildren(Sprite);

        this._services = services;
        this._levelList = levelList;
        this._hudConfig = hudConfig;
        this._dinerSceneController = dinerSceneController;

        this._energyResourceWidget.init();
        this._normalCurrencyResourceWidget.init();
        this._premiumCurrencyResourceWidget.init();

        const hasStoreAccess = this._checkRequirements(this._hudConfig.storeFeatureConfig.requirements);
        if (hasStoreAccess) {
            this._energyResourceWidget.OnGetMoreButtonPressed = this.OnGetMoreEnergy.bind(this);
            this._normalCurrencyResourceWidget.OnGetMoreButtonPressed = this.OnGetMoreCoins.bind(this);
            this._premiumCurrencyResourceWidget.OnGetMoreButtonPressed = this.OnGetMoreGems.bind(this);
        } else {
            this._energyResourceWidget.disableGetMore();
            this._normalCurrencyResourceWidget.disableGetMore();
            this._premiumCurrencyResourceWidget.disableGetMore();
        }

        this._starsResourceWidget.OnGetMoreButtonPressed = () => this._onGetMoreStars();

        this._starsResourceWidget.init();

        this._updateCurrencyWidgets();

        let updateCurrencyWidgetsCallback = this._updateCurrencyWidgets.bind(this);
        this._services.cardScrambleService.registerOnCurrencyUpdateEventCallback(updateCurrencyWidgetsCallback);
        this._services.dinerService.registerStarsWithheldEventCallback(updateCurrencyWidgetsCallback);

        this._services.cardScrambleService.registerOnLoadScreenCompleteCallback(() => {
            this._onLoadScreenCompleteCallback();
        });

        let updateDailyPrizeStateCallback = this._updateDailyPrizeState.bind(this);
        this._services.cardScrambleService.registerOnDailyPrizeStateChangeCallback(updateDailyPrizeStateCallback);
        this._updateDailyPrizeState();

        //Hide the energy widget from guest users...
        this._energyResourceWidget.node.active = this.shouldEnergyResourceWidgetBeVisible();

        this._onTeardownCallback = () => {
            if (this._services && this._services.cardScrambleService) {
                this._services.cardScrambleService.unregisterOnCurrencyUpdateEventCallback(updateCurrencyWidgetsCallback);
                this._services.dinerService.unregisterStarsWithheldEventCallback(updateCurrencyWidgetsCallback);
                this._services.cardScrambleService.unregisterOnDailyPrizeStateChangeCallback(updateDailyPrizeStateCallback);
                //this._stopAllTaskNotifications();
            }
        };
    }

    private shouldEnergyResourceWidgetBeVisible(): boolean {
        return this._checkRequirements(this._hudConfig.energyRevealFeatureConfig.requirements);
    }

    public async show() {
        if (this.node) {
            this._updateDailyPrizeState();
            this.onEvaluateAllButtonRequirements();
            this.node.active = true;
        } else {
            this._log.error('Node is not defined!');
        }
    }

    public setHUDState(hudState: DinerHUDState) {
        //Switch statement to handle different HUD states...
        switch (hudState) {
            case DinerHUDState.Shown: {
                this.node.active = true;
                this._energyResourceWidget.node.active = this.shouldEnergyResourceWidgetBeVisible();
                this._normalCurrencyResourceWidget.node.active = true;
                this._premiumCurrencyResourceWidget.node.active = true;
                this._starsResourceWidget.node.active = true;
                this._settingsButton.node.active = true;
                this._dailyRewardButton.node.active = true;
                this._playButton.node.active = true;
                this._tasksButton.node.active = true;
                this.onEvaluateAllButtonRequirements();
                break;
            }
            case DinerHUDState.Hidden: {
                this.node.active = false;
                break;
            }
            case DinerHUDState.TaskView: {
                this._energyResourceWidget.node.active = false;
                this._normalCurrencyResourceWidget.node.active = false;
                this._premiumCurrencyResourceWidget.node.active = false;
                this._starsResourceWidget.node.active = true;
                this._settingsButton.node.active = false;
                this._tasksButton.node.active = false;
                this._dailyRewardButton.node.active = false;
                this._dailyRewardLockedButton.node.active = false;
                this._buildModeButton.node.active = false;
                this._playButton.node.active = false;
                this._quickPlayButton.node.active = false;
                this._storeButton.node.active = false;
                break;
            }
            case DinerHUDState.StoreView: {
                this._energyResourceWidget.node.active = this.shouldEnergyResourceWidgetBeVisible();
                this._normalCurrencyResourceWidget.node.active = true;
                this._premiumCurrencyResourceWidget.node.active = true;
                this._starsResourceWidget.node.active = true;
                this._settingsButton.node.active = false;
                this._tasksButton.node.active = false;
                this._dailyRewardButton.node.active = false;
                this._dailyRewardLockedButton.node.active = false;
                this._buildModeButton.node.active = false;
                this._playButton.node.active = false;
                this._quickPlayButton.node.active = false;
                this._storeButton.node.active = false;
                break;
            }
            default: {
                this._log.error(`Tried to set an unsupported DinerHUDState: ${hudState}`);
                break;
            }
        }
    }

    public burstResourceWidget(
        currencyType: Currency,
        amount: number,
        destinationNode: Node,
        canvasNode: Node,
        onBurstComplete: () => void = null
    ) {
        switch (currencyType) {
            case Currency.Coins:
                SoundManager.instance.playSound('SFX_Rewards_SpendCoin');
                this._normalCurrencyResourceWidget.burstSprites(amount, destinationNode, canvasNode, onBurstComplete);
                break;
            case Currency.Gems:
                SoundManager.instance.playSound('SFX_Rewards_SpendGem');
                this._premiumCurrencyResourceWidget.burstSprites(amount, destinationNode, canvasNode, onBurstComplete);
                break;
            case Currency.Stars:
                SoundManager.instance.playSound('SFX_Rewards_SpendStar');
                this._starsResourceWidget.burstPrefabs(amount, destinationNode, canvasNode, onBurstComplete);
                break;
            default:
                this._log.error(`Tried to burst an unsupported currency type: ${currencyType}`);
                break;
        }
    }

    public onEvaluateAllButtonRequirements() {
        this._onEvaluatePlayButtonRequirments();
        this._onEvaluateQuickPlayButtonRequirements();
        this._onEvaluateStoreButtonRequirements();
        this._onEvaluateDailyMysteryPrizeButtonRequirements();
        this._onEvaluateBuildModeButtonRequirements();
    }

    public onNewAvailableTaskFoundCallback() {
        this._taskNewNotificationQueued = true;
    }

    public onNewCollectableTaskFoundCallback() {
        this._taskReadyNotificationQueued = true;
    }

    public onPurgeTaskNotificationsCallback() {
        this._taskNotificationNode.active = false;
        this._taskReadyNotificationQueued = false;
        this._taskNewNotificationQueued = false;
    }

    public onTaskCompletedCallback() {
        this.onEvaluateAllButtonRequirements();
    }

    protected update(_deltaTime: number) {
        this._updateEnergyWidget();

        if (this._loadingScreenComplete && this._taskNotificationSequenceComplete && this.node.active === true) {
            if (this._taskReadyNotificationQueued || this._taskNewNotificationQueued) {
                this._buildAndPlayTaskToasterNotificationSequence();
            }
        }

        if (this._services) {
            this._dailyRewardTimerLabel.string = StringUtils.formatTimer(this._services.cardScrambleService.timeUntilDailyReset() / 1000, true);
        }
    }

    protected onDestroy(): void {
        this._onTeardownCallback?.call(this);
    }

    private _onEvaluatePlayButtonRequirments() {
        const nextLevelData = this._services.cardScrambleService.getNextPuzzle();

        //If the data is null, we need to let them press the play button to get the End of Game Popup.
        if (nextLevelData === null || this._checkRequirements(nextLevelData.requirements)) {
            const playText = nextLevelData ? `Lvl ${nextLevelData.name}` : 'Play';
            this._playButton.interactable = true;
            this._playButtonLabel.string = playText;
            this._playButtonLabel.color = Color.WHITE;
            this._playButtonBadgeNode.active = true;
        } else {
            this._log.warn(`The level ${nextLevelData.name} is blocked by the following requiremnets: ${nextLevelData.requirements}`);
            this._playButtonLabel.string = this._completeTasksLabelText;
            this._playButtonLabel.color = this._completeTasksLabelColor;
            this._playButtonBadgeNode.active = false;
        }
    }

    private _onEvaluateQuickPlayButtonRequirements() {
        this._quickPlayButton.node.active = this._checkRequirements(this._hudConfig.quickplayFeatureConfig.requirements);
    }

    private _onEvaluateStoreButtonRequirements() {
        this._storeButton.node.active = this._checkRequirements(this._hudConfig.storeFeatureConfig.requirements);
    }

    private _onEvaluateDailyMysteryPrizeButtonRequirements() {
        const featureConfig = this._hudConfig.dailyMysteryPrizeFeatureConfig;
        if (this._checkRequirements(featureConfig.requirements)) {
            this._dailyRewardButton.node.active = true;
            this._dailyRewardLockedButton.node.active = false;
        } else {
            this._dailyRewardButton.node.active = false;
            if (this._services.cardScrambleService.getUserEntitlement() !== EntitlementType.Guest) {
                this._dailyRewardLockedButton.node.active = true;
                this._dailyRewardLockedLabel.string = featureConfig.unlockString;
            }
        }
    }

    private _onEvaluateBuildModeButtonRequirements() {
        this._buildModeButton.node.active = this._checkRequirements(this._hudConfig.buildModeFeatureConfig.requirements);
    }

    private _checkRequirements(reqs: Requirement[]) {
        return this._services.debugService.isCheatActive('allFeaturesUnlocked') || this._services.requirementsService.checkRequirementsMet(reqs);
    }

    private _updateEnergyWidget() {
        if (!this._services) {
            return;
        }

        if (this._services.cardScrambleService.getUserEntitlement() === EntitlementType.Guest) {
            this._energyResourceWidget.forceMaxVisualActive();
            return;
        }

        const energyCount = this._services.cardScrambleService.getEnergy();
        if (energyCount !== this._lastEnergyCount) {
            this._energyResourceWidget.setResourceCounter(energyCount);
        }
        const maxEnergyCount = this._services.cardScrambleService.getMaxEnergy();

        const progress = energyCount / maxEnergyCount;
        this._energyResourceWidget.setProgressBar(progress);

        if (energyCount >= maxEnergyCount) {
            this._energyResourceWidget.setTimerText('');
        } else {
            let timeUntilNextEnergy = this._services.cardScrambleService.timeUntilNextEnergy() / 1000;
            this._energyResourceWidget.setTimerText(StringUtils.formatTimer(timeUntilNextEnergy, false));
        }

        this._lastEnergyCount = energyCount;
    }

    private _updateCurrencyWidgets() {
        if (!this._services) {
            return;
        }

        this._services.cardScrambleService.getCurrencyBalances().then((currencyBalances) => {
            currencyBalances.forEach((currencyBalance) => {
                switch (currencyBalance.currency) {
                    case Currency.Stars:
                        this._starsResourceWidget.setResourceCounter(currencyBalance.amount - this._services.dinerService.getStarsWithheld());
                        break;
                    case Currency.Coins:
                        this._normalCurrencyResourceWidget.setResourceCounter(currencyBalance.amount);
                        break;
                    case Currency.Gems:
                        this._premiumCurrencyResourceWidget.setResourceCounter(currencyBalance.amount);
                        break;
                }
            });
        });
    }

    private _updateDailyPrizeState() {
        this._services.cardScrambleService.getDailyRewardPrizes().then((dailyRewardPrizeState) => {
            if (dailyRewardPrizeState.hasPrizesToClaim()) {
                this._dailyRewardButton.interactable = true;
            } else {
                this._dailyRewardButton.interactable = false;
            }

            if (dailyRewardPrizeState.numPrizesLeftToClaim() < 3) {
                this._dailyRewardTimerNode.active = true;
            } else {
                this._dailyRewardTimerNode.active = false;
            }
        });
    }

    private _buildAndPlayTaskToasterNotificationSequence() {
        // Always prioritize ready tasks over new tasks
        if (this._taskReadyNotificationQueued) {
            //Set the label colors to the ready notification colors
            this._taskOutline.color = this._taskReadyNotificationOutlineColor;
            this._taskShadow.color = this._taskReadyNotificationShadowColor;

            //Set the VFX colors to the ready notification colors
            for (let i = 0; i < this._taskNotificationVfx.length; i++) {
                this._taskNotificationVfx[i].color = this._taskReadyNotificationVfxTint;
            }
            this._taskNotificationLabel.string = 'Task Ready!';
            this._taskNotificationNode.active = true;
            this._taskNotificationBadgeNode.active = true;
            this._taskReadyNotificationQueued = false;
            this._taskNotificationSequenceComplete = false;
            this._playTaskNotificationSequence();
        } else if (this._taskNewNotificationQueued) {
            this._taskNewNotificationQueued = false;
            this._taskNotificationSequenceComplete = true;
            this._dinerSceneController.openPhoneTaskScreen(true);
        }
    }

    private _playTaskNotificationSequence() {
        SoundManager.instance.playSound('SFX_UI_TaskNotification');

        // Play the enter animation
        this._taskNotificationAnimation.play('task-notification-enter');
        this._taskNotificationAnimation.once(Animation.EventType.FINISHED, () => {
            // Play the idle animation
            this._taskNotificationAnimation.play('task-notification-idle');

            // Wait for the set duration and then play the exit animation
            this.scheduleOnce(() => {
                this._taskNotificationAnimation.play('task-notification-exit');
                this._taskNotificationAnimation.once(Animation.EventType.FINISHED, () => {
                    this._taskNotificationNode.active = false;
                    this._taskNotificationSequenceComplete = true;
                });
            }, this._taskNotificationDuration);
        });
    }

    private _stopAllTaskNotifications() {
        //Clear the notification bools
        this._taskNotificationNode.active = false;
        this._taskNotificationBadgeNode.active = false;
        this._taskNotificationSequenceComplete = true;

        //Set the animator to the first frame of the enter animation and stop it
        this._taskNotificationAnimation.play('task-notification-enter');
        const animationState = this._taskNotificationAnimation.getState('task-notification-enter');
        this._taskNotificationAnimation.stop();
        if (animationState) {
            animationState.time = 0;
        }
    }

    private _onLoadScreenCompleteCallback() {
        this._loadingScreenComplete = true;
    }

    private _onSettingsButtonPressedCallback() {
        this.OnSettingsButtonPressed?.call(this);

        this._services.cardScrambleService.sendGa4Event({ game_event_type: 'click', game_event_location: 'lobby-settings' });
    }

    private _onTasksButtonPressedCallback() {
        this._taskNotificationBadgeNode.active = false;
        this._stopAllTaskNotifications();
        this.OnTasksButtonPressed?.call(this);

        this._services.cardScrambleService.sendGa4Event({ game_event_type: 'click', game_event_location: 'lobby-tasks' });
    }

    private _onDailyRewardButtonPressedCallback() {
        this.OnDailyRewardButtonPressed?.call(this);

        this._services.cardScrambleService.sendGa4Event({ game_event_type: 'click', game_event_location: 'lobby-dailyGift' });
    }

    private _onDailyRewardLockedButtonPressedCallback() {
        const featureConfig = this._hudConfig.dailyMysteryPrizeFeatureConfig;
        this._services.UIOverlayService.showGeneralPopup(
            PopupType.OK,
            featureConfig.unlockPopupTitle,
            featureConfig.unlockPopupMessage,
            featureConfig.unlockPopupSpritePath,
            (result) => {},
            PopupLayout.Horizontal
        );
    }

    private _onBuildModeButtonPressedCallback() {
        this.OnBuildModeButtonPressed?.call(this);

        this._services.cardScrambleService.sendGa4Event({ game_event_type: 'click', game_event_location: 'lobby-decoration' });
    }

    private _onPlayButtonPressedCallback() {
        this.OnPlayButtonPressed?.call(this);
    }

    private _onQuickPlayButtonPressedCallback() {
        this.OnQuickPlayButtonPressed?.call(this);
    }

    private _onStoreButtonPressedCallback() {
        this.OnPlatformStoreButtonPressed?.call(this);

        this._services.cardScrambleService.sendGa4Event({ game_event_type: 'click', game_event_location: 'lobby-store' });
    }

    private _onGetMoreStars() {
        this._services.UIOverlayService.showGeneralPopup(
            PopupType.OK,
            'Earning Stars',
            null,
            'tutorial/FTUE_CoreLoop/spriteFrame',
            null,
            PopupLayout.Vertical,
            'Okay'
        );
    }
}
