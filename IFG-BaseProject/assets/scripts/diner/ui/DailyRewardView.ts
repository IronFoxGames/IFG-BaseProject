import { _decorator, Animation, AnimationComponent, Button, CCString, Component, input, Input, Label, Node, SpriteFrame } from 'cc';
import { SoundManager } from '../../audio/SoundManager';
import { AppConfig } from '../../config/AppConfig';
import { EntitlementType } from '../../core/enums/EntitlementType';
import { UpsellOrigin } from '../../core/enums/UpsellOrigin';
import { CatalogItem } from '../../core/model/CatalogItem';
import { PopupLayout, PopupType } from '../../game/ui/GeneralPopup';
import { logger } from '../../logging';
import { DailyPrizeRewardState } from '../../services/DailyPrizeRewardState';
import { ICardScrambleService } from '../../services/ICardScrambleService';
import { IStore } from '../../services/IStore';
import { UIOverlayService } from '../../services/UIOverlayService';
import { ResourceLoader } from '../../utils/ResourceLoader';
import { DailyRewardBox, RewardBoxState } from './DailyRewardBox';
const { ccclass, property } = _decorator;

enum DailyRewardSequenceState {
    Intro,
    DarcyTapToContinue,
    PrizeSelect,
    TapToContinue,
    PrizeShift,
    PurchasePrize
}

@ccclass('DailyRewardView')
export class DailyRewardView extends Component {
    public OnContinueButtonPressed: () => void;

    @property({ type: AnimationComponent, visible: true, group: 'Sprites' })
    private _animationRoot: AnimationComponent;

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _screenStartClipName: string = '';

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _screenInClipName: string = '';

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _screenButtonsInClipName: string = '';

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _screenLoadContinueClipName: string = '';

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _screenUnloadContinueClipName: string = '';

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _screenLoadPurchaseClipName: string = '';

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _screenLoadUpsellsClipName: string = '';

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _screenButtonsOutClipName: string = '';

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _screenBoxShift1: string = '';

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _screenBoxShift2: string = '';

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _screenUnloadClipName: string = '';

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _darcyInClipName: string = '';

    @property({ type: CCString, visible: true, group: 'Animations' })
    private _darcyOutClipName: string = '';

    @property({ type: [CCString], visible: true, group: 'Animations' })
    private _screenShuffleAnims: string[] = [];

    @property({ type: [Button], visible: true, group: 'Buttons' })
    private _claimButtons: Button[] = [];

    @property({ type: [Button], visible: true, group: 'Buttons' })
    private _buyButtons: Button[] = [];

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _exitButton: Button;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _upsellButton: Button;

    @property({ type: Node, visible: true, group: 'Views' })
    private _rewardView: Node;

    @property({ type: Node, visible: true, group: 'Views' })
    private _fallbackMessageView: Node;

    @property({ type: Label, visible: true })
    private _darcyTextBox: Label;

    @property({ type: [DailyRewardBox], visible: true })
    private _rewardBoxViews: DailyRewardBox[] = [];

    @property({ type: Node, visible: true })
    private _targetInventory: Node;

    @property({ type: [Node], visible: true })
    private _targetUpsell: Node[] = [];

    @property({ type: Node, visible: true })
    private _clubUpsell: Node;

    private _cardScrambleService: ICardScrambleService;
    private _uiOverlayService: UIOverlayService;
    private _appConfig: AppConfig;
    private _store: IStore;

    private static ADDITONAL_PURCHASE_CATALOG_ID = 'daily_prize_purchase';

    private _dailyRewardViewState: DailyRewardSequenceState = DailyRewardSequenceState.Intro;
    private _dailyRewardClaimState: DailyPrizeRewardState = null;
    private _skipAnims: boolean = false;
    private _additionalPrizeCatalogItem: CatalogItem = null;
    private _log = logger.child('DailyRewardView');

    public async init(
        cardScrambleService: ICardScrambleService,
        uiOverlayService: UIOverlayService,
        appConfig: AppConfig,
        store: IStore,
        dailyRewardClaimState: DailyPrizeRewardState
    ) {
        this._cardScrambleService = cardScrambleService;
        this._uiOverlayService = uiOverlayService;
        this._store = store;
        this._appConfig = appConfig;
        this._dailyRewardClaimState = dailyRewardClaimState;

        // Validation
        if (!this._animationRoot) {
            this._log.warn('DailyRewardView animation root not set');
            return;
        }

        if (
            this._rewardBoxViews.length !== 3 ||
            this._rewardBoxViews[0] == null ||
            this._rewardBoxViews[1] == null ||
            this._rewardBoxViews[2] == null
        ) {
            this._log.warn(`DailyRewardView RewardBoxView refs not set`);
            return;
        }

        // Tap to continue touch handler
        input.on(Input.EventType.TOUCH_END, this._onTouchEnd, this);

        // Set up button click events...
        this._claimButtons[0].node.on(Button.EventType.CLICK, this._onClaimFreeRewardButtonPressedCallback.bind(this, 0), this);
        this._claimButtons[1].node.on(Button.EventType.CLICK, this._onClaimFreeRewardButtonPressedCallback.bind(this, 1), this);
        this._claimButtons[2].node.on(Button.EventType.CLICK, this._onClaimFreeRewardButtonPressedCallback.bind(this, 2), this);
        this._buyButtons[0].node.on(Button.EventType.CLICK, this._onPurchaseUnclaimedRewardButtonPressedCallback.bind(this, 0), this);
        this._buyButtons[1].node.on(Button.EventType.CLICK, this._onPurchaseUnclaimedRewardButtonPressedCallback.bind(this, 1), this);
        this._buyButtons[2].node.on(Button.EventType.CLICK, this._onPurchaseUnclaimedRewardButtonPressedCallback.bind(this, 2), this);
        this._exitButton.node.on(Button.EventType.CLICK, this._onContinueButtonPressedCallback, this);
        this._upsellButton.node.on(Button.EventType.CLICK, this._onUpsellPressedCallback, this);

        // Init reward views
        const isPremiumUser = this._cardScrambleService.getUserEntitlement() === EntitlementType.Premium;
        this._rewardBoxViews.forEach((boxView, index) => {
            boxView.init(isPremiumUser, this._targetInventory, this._targetUpsell[index], dailyRewardClaimState.showLogo);
        });

        // Disable any nodes involved in upsell if this is a premium user
        this._upsellButton.node.active = !isPremiumUser;
        this._clubUpsell.active = !isPremiumUser;

        //Select a random darcy phrase from the appconfig
        const darcyPhrases = this._appConfig.darcyDailyRewardPhrases;
        if (darcyPhrases && darcyPhrases.length > 0) {
            this._darcyTextBox.string = darcyPhrases[Math.floor(Math.random() * darcyPhrases.length)];
        }
    }

    private _onTouchEnd() {
        if (this._dailyRewardViewState === DailyRewardSequenceState.TapToContinue) {
            this._doPurchaseIntroSequence();
        } else if (this._dailyRewardViewState === DailyRewardSequenceState.DarcyTapToContinue) {
            this._doShuffleSequence();
        }
    }

    public async show() {
        this.node.active = true;

        // Disable all buttons
        this._exitButton.interactable = false;
        for (const button of this._claimButtons) {
            button.interactable = false;
        }
        for (const button of this._buyButtons) {
            button.interactable = false;
        }

        if (this._cardScrambleService.getUserEntitlement() === EntitlementType.Guest) {
            this._rewardView.active = false;
            this._fallbackMessageView.active = true;
            this._exitButton.interactable = true;
            return;
        }

        if (this._dailyRewardClaimState.numPrizesToClaim() == 6) {
            // Set screen animation to start (everythign off screen)
            await this._awaitAnimation(this._animationRoot, this._screenStartClipName);
            this._doIntroSequence();
        } else {
            this._rebuildVisualState();
        }
    }

    public async hide() {
        if (this.node) {
            await this._awaitAnimation(this._animationRoot, this._screenUnloadClipName);
            this.node.active = false;
        } else {
            this._log.error('Node is not defined!');
        }
    }

    private async _doIntroSequence() {
        // Boxes start closed
        this.node.active = false;
        let boxAnims = [];
        this._rewardBoxViews.forEach((boxView) => {
            boxAnims.push(boxView.setState(RewardBoxState.Closed, true /* skip anim */));
        });
        await Promise.all(boxAnims);
        this.node.active = true;

        // Animate screen in
        await this._awaitAnimation(this._animationRoot, this._screenInClipName);

        // Boxes idle
        this._rewardBoxViews.forEach((boxView) => {
            boxView.setState(RewardBoxState.Idle);
        });

        // Animate Darcy in
        await this._awaitAnimation(this._animationRoot, this._darcyInClipName);

        this._setState(DailyRewardSequenceState.DarcyTapToContinue);
    }

    private async _doShuffleSequence() {
        // Animate Dary out
        await this._awaitAnimation(this._animationRoot, this._darcyOutClipName);

        // Shuffle boxes
        SoundManager.instance.playSound('SFX_DailyPrize_Shuffle');
        const shuffleAnimName = this._screenShuffleAnims[Math.floor(Math.random() % this._screenShuffleAnims.length)];
        await this._awaitAnimation(this._animationRoot, shuffleAnimName);

        // Set prize state
        await this._setupPrizeState();

        // Animate in select buttons
        await this._awaitAnimation(this._animationRoot, this._screenButtonsInClipName);

        // Boxes idle
        this._rewardBoxViews.forEach((boxView) => {
            boxView.setState(RewardBoxState.Idle);
        });

        // Enable buttons
        for (const button of this._claimButtons) {
            button.interactable = true;
        }
        this._exitButton.interactable = true;

        this._setState(DailyRewardSequenceState.PrizeSelect);
    }

    private async _doBoxOpenSequence(boxNumber: number) {
        // Disable buttons
        this._exitButton.interactable = false;
        this._claimButtons.forEach((button) => {
            button.interactable = false;
        });

        // Open sequence (reveal + idle)
        SoundManager.instance.playSound('SFX_DailyPrize_Open');
        await this._awaitAnimation(this._animationRoot, this._screenButtonsOutClipName);
        await this._rewardBoxViews[boxNumber].setState(RewardBoxState.Reveal, this._skipAnims);
        await this._rewardBoxViews[boxNumber].setState(RewardBoxState.Flair, this._skipAnims);

        await this._awaitAnimation(this._animationRoot, this._screenLoadContinueClipName);

        this._setState(DailyRewardSequenceState.TapToContinue);
    }

    private async _doPurchaseBoxSequence(boxNumber: number) {
        this._exitButton.interactable = false;
        this._claimButtons.forEach((button) => {
            button.interactable = false;
        });

        // Vanish opened box
        await this._rewardBoxViews[boxNumber].setState(RewardBoxState.Vanish, this._skipAnims);

        this._exitButton.interactable = true;
        return;
    }

    private async _doPurchaseIntroSequence() {
        this._setState(DailyRewardSequenceState.PrizeShift);

        if (!this._skipAnims) {
            SoundManager.instance.playSound('SFX_DailyPrize_Fly');
        }

        const boxOpened = [
            this._dailyRewardClaimState.box1.freeReward.claimed,
            this._dailyRewardClaimState.box2.freeReward.claimed,
            this._dailyRewardClaimState.box3.freeReward.claimed
        ];

        // Vanish opened boxes
        let anims = [];
        this._rewardBoxViews.forEach((view, index) => {
            const claimed = boxOpened[index];
            if (claimed) {
                anims.push(view.setState(RewardBoxState.Vanish, this._skipAnims));
            }
        });
        await Promise.all(anims);

        // If free user and box 3 is not opened, shift the boxes over
        if (this._cardScrambleService.getUserEntitlement() === EntitlementType.Free && !boxOpened[2]) {
            if (!this._skipAnims) {
                SoundManager.instance.playSound('SFX_DailyPrize_Slide');
            }

            if (boxOpened[1]) {
                await this._awaitAnimation(this._animationRoot, this._screenBoxShift2); // shift box 3 -> 2 position
            } else {
                await this._awaitAnimation(this._animationRoot, this._screenBoxShift1); // shift box 2, 3 - > 1, 2 position
            }
        }

        await this._awaitAnimation(this._animationRoot, this._screenUnloadContinueClipName);

        // Open all boxes that aren't claimed
        anims = [];
        this._rewardBoxViews.forEach((view, index) => {
            const claimed = boxOpened[index];
            if (!claimed) {
                anims.push(view.setState(RewardBoxState.Open, this._skipAnims));
            }
        });

        if (!this._skipAnims) {
            SoundManager.instance.playSound('SFX_DailyPrize_OtherPrizes');
        }

        await Promise.all(anims);

        if (!this._skipAnims) {
            SoundManager.instance.playSound('SFX_DailyPrize_Sign');
        }

        // Flair all unclaimed boxes
        this._rewardBoxViews.forEach((view, index) => {
            const claimed = boxOpened[index];
            if (!claimed) {
                anims.push(view.setState(RewardBoxState.Flair, this._skipAnims));
            }
        });

        // Enable buttons
        this._buyButtons.forEach((buyButton, index) => {
            const claimed = boxOpened[index];
            if (!claimed) {
                buyButton.interactable = true;
            } else {
                buyButton.node.active = false;
            }
        });
        this._exitButton.interactable = true;

        if (this._cardScrambleService.getUserEntitlement() === EntitlementType.Premium) {
            await this._awaitAnimation(this._animationRoot, this._screenLoadPurchaseClipName);
        } else {
            await this._awaitAnimation(this._animationRoot, this._screenLoadUpsellsClipName);
        }

        this._setState(DailyRewardSequenceState.PurchasePrize);
    }

    private async _rebuildVisualState() {
        // If the player is a premium member, reward any premium prizes for boxes they may have opened already
        // incase they joined since their last time opening this screen
        await this._claimUnclaimedPremiumRewards();

        // Skip animations/tweens while rebuilding state
        this._skipAnims = true;

        this._rewardBoxViews[0].node.active = false;
        this._rewardBoxViews[1].node.active = false;
        this._rewardBoxViews[2].node.active = false;

        // Set prize state
        await this._setupPrizeState();

        // Run the purchase intro sequence but skip anims
        await this._doPurchaseIntroSequence();
        this._skipAnims = false;

        this._buyButtons[0].node.active = !this._dailyRewardClaimState.box1.freeReward.claimed;
        this._buyButtons[1].node.active = !this._dailyRewardClaimState.box2.freeReward.claimed;
        this._buyButtons[2].node.active = !this._dailyRewardClaimState.box3.freeReward.claimed;

        this._claimButtons[0].node.active = !this._dailyRewardClaimState.box1.freeReward.claimed;
        this._claimButtons[1].node.active = !this._dailyRewardClaimState.box2.freeReward.claimed;
        this._claimButtons[2].node.active = !this._dailyRewardClaimState.box3.freeReward.claimed;

        this._rewardBoxViews[0].node.active = !this._dailyRewardClaimState.box1.freeReward.claimed;
        this._rewardBoxViews[1].node.active = !this._dailyRewardClaimState.box2.freeReward.claimed;
        this._rewardBoxViews[2].node.active = !this._dailyRewardClaimState.box3.freeReward.claimed;
    }

    private async _setupPrizeState() {
        this._additionalPrizeCatalogItem = await this._store.getCatalogItem(DailyRewardView.ADDITONAL_PURCHASE_CATALOG_ID);
        this._buyButtons.forEach((button) => {
            const buttonLabel = button.getComponentInChildren(Label);
            // TODO GEM ICON: should be updated here
            buttonLabel.string = `${this._additionalPrizeCatalogItem.cost.amount}`;
        });

        await this._loadAndAssignPrizeSprites();
    }

    private async _loadAndAssignPrizeSprites() {
        try {
            const spritePaths = [
                ...this._dailyRewardClaimState.box1.rewards.map((reward) => reward.itemInfo?.sprite ?? null),
                ...this._dailyRewardClaimState.box2.rewards.map((reward) => reward.itemInfo?.sprite ?? null),
                ...this._dailyRewardClaimState.box3.rewards.map((reward) => reward.itemInfo?.sprite ?? null)
            ];

            // Load all sprites concurrently
            const sprites = await Promise.all(spritePaths.map((path) => ResourceLoader.load(path, SpriteFrame)));
            this._rewardBoxViews[0].setPrizeSprites(
                sprites[0],
                this._dailyRewardClaimState.box1.freeReward.amount,
                sprites[1],
                this._dailyRewardClaimState.box1.clubReward.amount
            );
            this._rewardBoxViews[1].setPrizeSprites(
                sprites[2],
                this._dailyRewardClaimState.box2.freeReward.amount,
                sprites[3],
                this._dailyRewardClaimState.box2.clubReward.amount
            );
            this._rewardBoxViews[2].setPrizeSprites(
                sprites[4],
                this._dailyRewardClaimState.box3.freeReward.amount,
                sprites[5],
                this._dailyRewardClaimState.box3.clubReward.amount
            );
        } catch (error) {
            this._log.warn('Failed to load DailyPrize sprites', error);
        }

        return [];
    }

    private async _onClaimFreeRewardButtonPressedCallback(index: number) {
        for (const button of this._claimButtons) {
            button.interactable = false;
        }

        const claimResult = await this._cardScrambleService.onPrizeClaimed(index, this._getClaimIndex(index));
        if (!claimResult) {
            this._log.error('Error when claiming free daily reward...');
            this._uiOverlayService.showGeneralPopup(
                PopupType.OK,
                'Error',
                'Error claiming free daily reward',
                null,
                () => {},
                PopupLayout.Vertical
            );
            this._claimButtons[index].interactable = true;
            return;
        }

        // Mark prizes claimed
        this._dailyRewardClaimState.claimBoxFreePrize(index);
        if (this._cardScrambleService.getUserEntitlement() === EntitlementType.Premium) {
            this._dailyRewardClaimState.claimBoxClubPrize(index);
        }
        await this._doBoxOpenSequence(index);
        this._claimButtons[index].node.active = false;
    }

    private _setState(state: DailyRewardSequenceState) {
        this._dailyRewardViewState = state;
    }

    private async _onPurchaseUnclaimedRewardButtonPressedCallback(index: number) {
        this._buyButtons[index].interactable = false;

        // Purchase through Store interface to auto-show fail popup on failure and spend gem confirmation prompt
        const purchaseResult = await this._store.purchase(this._additionalPrizeCatalogItem, 'dailyreward');
        if (!purchaseResult) {
            this._buyButtons[index].interactable = true;
            return;
        }

        const claimResult = await this._cardScrambleService.onPrizeClaimed(index, this._getClaimIndex(index));
        if (!claimResult) {
            this._log.error('Error when claiming daily reward...');
            this._uiOverlayService.showGeneralPopup(PopupType.OK, 'Error', 'Error claiming daily reward', null, () => {}, PopupLayout.Vertical);
            this._buyButtons[index].interactable = true;
            return;
        }

        // Mark prizes claimed
        this._dailyRewardClaimState.claimBoxFreePrize(index);
        if (this._cardScrambleService.getUserEntitlement() === EntitlementType.Premium) {
            this._dailyRewardClaimState.claimBoxClubPrize(index);
        }
        this._buyButtons[index].interactable = false;
        await this._doPurchaseBoxSequence(index);
        this._buyButtons[index].node.active = false;
    }

    private async _claimUnclaimedPremiumRewards() {
        if (this._cardScrambleService.getUserEntitlement() !== EntitlementType.Premium) {
            return;
        }

        if (this._dailyRewardClaimState.box1.freeReward.claimed && !this._dailyRewardClaimState.box1.clubReward.claimed) {
            await this._cardScrambleService.onPrizeClaimed(0, this._getClaimIndex(0));
            this._dailyRewardClaimState.claimBoxClubPrize(0);
        }
        if (this._dailyRewardClaimState.box2.freeReward.claimed && !this._dailyRewardClaimState.box2.clubReward.claimed) {
            await this._cardScrambleService.onPrizeClaimed(1, this._getClaimIndex(1));
            this._dailyRewardClaimState.claimBoxClubPrize(1);
        }
        if (this._dailyRewardClaimState.box3.freeReward.claimed && !this._dailyRewardClaimState.box3.clubReward.claimed) {
            await this._cardScrambleService.onPrizeClaimed(2, this._getClaimIndex(2));
            this._dailyRewardClaimState.claimBoxClubPrize(2);
        }
    }

    private _onContinueButtonPressedCallback() {
        this.OnContinueButtonPressed?.call(this);
    }

    private _onUpsellPressedCallback() {
        this._cardScrambleService.openPlatformPremiumRegistration(UpsellOrigin.MysteryPrize);
    }

    private _getClaimIndex(index: number) {
        let claimIndex = index;
        switch (index) {
            case 0:
                claimIndex = this._dailyRewardClaimState.box1.claimIndex;
                break;
            case 1:
                claimIndex = this._dailyRewardClaimState.box2.claimIndex;
                break;
            case 2:
                claimIndex = this._dailyRewardClaimState.box3.claimIndex;
                break;
        }

        return claimIndex;
    }

    private _awaitAnimation(animationComponent: AnimationComponent, animationClipName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                animationComponent.play(animationClipName);

                if (this._skipAnims) {
                    const state = animationComponent.getState(animationClipName);
                    if (state) {
                        state.setTime(state.duration);
                        state.sample();
                    }
                }

                animationComponent.once(Animation.EventType.FINISHED, () => {
                    resolve();
                });
            } catch (error) {
                this._log.warn('DailyRewardView: error playing animation clip: ', error);
                reject(error);
            }
        });
    }
}
