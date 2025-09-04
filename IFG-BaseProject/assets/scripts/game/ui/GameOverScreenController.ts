import { _decorator, Component, EventHandler, Label, Button, Node, Sprite, Tween, tween, Vec3, Animation } from 'cc';
import { UIElementAnimator } from './UIElementAnimator';
import { GameOverResult } from '../../core/model/PuzzleCompleteEventData';
import { ResourceWidget } from '../../diner/ui/ResourceWidget';
import { SoundManager } from '../../audio/SoundManager';
import { logger } from '../../logging';
import { ICardScrambleService } from '../../services/ICardScrambleService';
import { UITransform } from 'cc';
import { BurstDirection, BurstRewards } from './RewardsBurst';
import { Vec2 } from 'cc';
import { CCFloat } from 'cc';
import { Prefab } from 'cc';
import { AnimationClip } from 'cc';
import { resources } from 'cc';
import { SpriteFrame } from 'cc';
import { Services } from '../../state/Services';
import { AppConfig } from '../../config/AppConfig';

const { ccclass, property } = _decorator;

@ccclass('GameOverScreenController')
export class GameOverScreenController extends Component {
    public OnContinueButtonPressed: () => void;

    @property({ type: Label, visible: true, group: 'Text' })
    private _titleTextLabel: Label;

    @property({ type: Label, visible: true, group: 'Text' })
    private _scoreAmountLabel: Label;

    @property({ type: Label, visible: true, group: 'Text' })
    private _handsPlayedAmount: Label;

    @property({ type: CCFloat, visible: true, group: 'Text', tooltip: 'Time in seconds before the score starts tallying' })
    private _scoreTallyDelay: number = 0.3;

    @property({ type: CCFloat, visible: true, group: 'Text', tooltip: 'Time in seconds before the hands start tallying' })
    private _handsTallyDelay: number = 0.6;

    @property({ type: CCFloat, visible: true, group: 'Text', tooltip: 'Time in seconds it takes the score and hand count to tally' })
    private _tallyTime: number = 2000;

    @property({ type: Node, visible: true, group: 'Text' })
    private _newBestText: Node = null;

    @property({ type: Node, visible: true, group: 'Rewards' })
    private _starRewardsNode: Node = null;

    @property({ type: Node, visible: true, group: 'Rewards' })
    private _coinRewardsNode: Node = null;

    @property({ type: Sprite, visible: true, group: 'Rewards' })
    private _starRewardIcon: Sprite = null;

    @property({ type: Sprite, visible: true, group: 'Rewards' })
    private _coinRewardIcon: Sprite = null;

    @property({ type: Label, visible: true, group: 'Rewards' })
    private _starsRewardLabel: Label = null;

    @property({ type: Label, visible: true, group: 'Rewards' })
    private _coinsRewardLabel: Label = null;

    @property({ type: CCFloat, visible: true, group: 'Text', tooltip: 'Time in seconds before the star lights up and coins start tallying' })
    private _rewardsTallyDelay: number = 0.8;

    @property({ type: CCFloat, visible: true, group: 'Text', tooltip: 'Time in seconds to delay the star after the coins' })
    private _starDelay: number = 1;

    @property({ type: CCFloat, visible: true, group: 'Text', tooltip: 'Time in seconds before the rewards widgets start tallying' })
    private _rewardsWidgetTallyDelay: number = 1;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _continueButton: Button;

    @property({
        type: Sprite,
        visible: true,
        group: 'Character',
        tooltip: 'The character sprite for the game over screen, this should be the parent node of the sprite with the Sprite script attached.'
    })
    private _characterSprite: Sprite = null;

    @property({
        type: Sprite,
        visible: true,
        group: 'Character',
        tooltip: 'The shadow sprite for the character, this should be a child of the character sprite.'
    })
    private _characterShadow: Sprite = null;

    @property({
        type: ResourceWidget,
        visible: true,
        group: 'ResourceWidgets',
        tooltip: 'The stars resource widget, this should be the parent node of the widget with the ResourceWidget script attached.'
    })
    private _starsResourceWidget: ResourceWidget = null;

    @property({
        type: ResourceWidget,
        visible: true,
        group: 'ResourceWidgets',
        tooltip: 'The coins resource widget, this should be the parent node of the widget with the ResourceWidget script attached.'
    })
    private _coinsResourceWidget: ResourceWidget = null;

    @property({
        type: Node,
        visible: true,
        group: 'ResourceWidgets',
        tooltip: 'The destination node for the stars resource widget, this should be the icon on the widget, not the main widget itself.'
    })
    private _starsResourceWidgetDestination: Node = null;

    @property({
        type: Node,
        visible: true,
        group: 'ResourceWidgets',
        tooltip: 'The destination node for the coins resource widget, this should be the icon on the widget, not the main widget itself.'
    })
    private _coinsResourceWidgetDestination: Node = null;

    @property({ type: Prefab, visible: true, group: 'Text', tooltip: 'Star prefab for rewards burst' })
    private _starPrefab: Prefab = null;

    @property({ type: Animation, visible: true, tooltip: 'Animator for the game over screen intro' })
    public _introAnimator: Animation;

    private _starsEarned: number = 0;
    private _coinsEarned: number = 0;
    private _totalStars: number = 0;
    private _totalCoins: number = 0;
    private _totalHands: number = 0;
    private _totalScore: number = 0;
    private _previousHighScore: number = null;
    private _isQuickPlay: boolean = false;
    private _scoreTallyTween: Tween<{ value: number }> | null = null;
    private _scoreTarget: number = 0;
    private _currentScore: number = 0;
    private _handsTallyTween: Tween<{ value: number }> | null = null;
    private _handsTarget: number = 0;
    private _currentHands: number = 0;
    private _coinsTallyTween: Tween<{ value: number }> | null = null;
    private _coinsTarget: number = 0;
    private _currentCoins: number = 0;
    private _gameOverResult: string = '';
    private _starsWidgetTallyTween: Tween<{ value: number }> | null = null;
    private _starsWidgetTarget: number = 0;
    private _starsWidgetCurrent: number = 0;
    private _coinsWidgetTallyTween: Tween<{ value: number }> | null = null;
    private _coinsWidgetTarget: number = 0;
    private _coinsWidgetCurrent: number = 0;
    private _burstRewardsEffectCoins: BurstRewards = null;
    private _burstRewardsEffectStars: BurstRewards = null;
    private _canvasNode: Node | null = null;
    private _introComplete: boolean = false;

    private _services: Services | null = null;
    private _appConfig: AppConfig | null = null;
    private _animationClips: AnimationClip[] = [];

    private _starsScheduler: () => void | null = null;
    private _onCloseCallback?: () => void;

    private _log = logger.child('GameOverScreenController');

    private static readonly _className: string = 'GameOverScreenController';

    protected start(): void {
        const continueEventHandler = new EventHandler();
        continueEventHandler.target = this.node;
        continueEventHandler.component = GameOverScreenController._className;
        continueEventHandler.handler = 'onContinueButtonPressedCallback';
        this._continueButton.clickEvents.push(continueEventHandler);

        if (this._titleTextLabel === null) {
            this._log.error('Title text label is not set');
        }
        if (this._scoreAmountLabel === null) {
            this._log.error('Score amount label is not set');
        }
        if (this._handsPlayedAmount === null) {
            this._log.error('Hands played amount label is not set');
        }
        if (this._newBestText === null) {
            this._log.error('New best text label is not set');
        }
        if (this._starRewardsNode === null) {
            this._log.error('Star rewards node is not set');
        }
        if (this._coinRewardsNode === null) {
            this._log.error('Coin rewards node is not set');
        }
        if (this._starRewardIcon === null) {
            this._log.error('Star reward icon is not set');
        }
        if (this._coinRewardIcon === null) {
            this._log.error('Coin reward icon is not set');
        }
        if (this._starsRewardLabel === null) {
            this._log.error('Stars reward label is not set');
        }
        if (this._coinsRewardLabel === null) {
            this._log.error('Coins reward label is not set');
        }
        if (this._starsResourceWidget === null) {
            this._log.error('Stars resource widget is not set');
        }
        if (this._coinsResourceWidget === null) {
            this._log.error('Coins resource widget is not set');
        }
        if (this._starsResourceWidgetDestination === null) {
            this._log.error('Stars resource widget destination is not set');
        }
        if (this._coinsResourceWidgetDestination === null) {
            this._log.error('Coins resource widget destination is not set');
        }
        if (this._continueButton === null) {
            this._log.error('Continue button is not set');
        }
    }

    public async init(
        gameOverResult: GameOverResult,
        starsEarned: number,
        coinsEarned: number,
        totalStars: number,
        totalCoins: number,
        totalHands: number,
        totalScore: number,
        isQuickPlay: boolean,
        highScore: number,
        canvasNode: Node,
        services: Services,
        appConfig: AppConfig,
        onClose: () => void
    ) {
        this._onCloseCallback = onClose;

        this._animationClips = this._introAnimator.clips;
        this._services = services;
        this._appConfig = appConfig;

        this._starsEarned = starsEarned;
        this._coinsEarned = coinsEarned;
        this._totalStars = totalStars;
        this._totalCoins = totalCoins;
        this._totalHands = totalHands;
        this._totalScore = totalScore;
        this._isQuickPlay = isQuickPlay;
        this._previousHighScore = highScore;
        this._canvasNode = canvasNode;
        this._gameOverResult = gameOverResult;

        this._newBestText.active = false;
        this._setStarUnlocked(false);
        this._scoreAmountLabel.string = `0`;
        this._handsPlayedAmount.string = `0`;
        this._starsRewardLabel.string = `0`;
        this._coinsRewardLabel.string = `0`;
        this._newBestText.active = false;

        this._characterSprite.node.active = false;
        this._characterShadow.node.active = false;

        if (this._services) {
            // Check if they've completed the prologue, if so just use the win/lose sprites
            if (services.requirementsService.checkRequirementsMet(this._appConfig.gameOverScreenData.prologueCompleteRequirements)) {
                if (gameOverResult === GameOverResult.Win) {
                    //Select a random string from the win characters array
                    const winCharacter =
                        this._appConfig.gameOverScreenData.winCharacters[
                            Math.floor(Math.random() * this._appConfig.gameOverScreenData.winCharacters.length)
                        ];
                    this._loadCharacterSprite(winCharacter);
                } else if (gameOverResult === GameOverResult.Lose) {
                    //Select a random string from the loss characters array
                    const lossCharacter =
                        this._appConfig.gameOverScreenData.lossCharacters[
                            Math.floor(Math.random() * this._appConfig.gameOverScreenData.lossCharacters.length)
                        ];
                    this._loadCharacterSprite(lossCharacter);
                }
                // If not check if they're at the end of the prologue
            } else if (services.requirementsService.checkRequirementsMet(this._appConfig.gameOverScreenData.prologueEndRequirements)) {
                this._loadCharacterSprite(this._appConfig.gameOverScreenData.prologueEndCharacter);
            } else {
                // If neither are true then they're in the early prologue
                this._loadCharacterSprite(this._appConfig.gameOverScreenData.prologueCharacter);
            }
        } else {
            this._log.warn('No services provided, cannot load character sprite');
        }

        this._showPanel();
    }

    private _loadCharacterSprite(spritePath: string) {
        if (spritePath && spritePath.length > 0) {
            resources.load(spritePath, SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    this._log.warn('Failed to load character sprite:', { spritePath, error: err });
                    return;
                }
                this._characterSprite.spriteFrame = spriteFrame;
                this._characterShadow.spriteFrame = spriteFrame;
                this._characterSprite.node.active = true;
                this._characterShadow.node.active = true;
            });
        } else {
            this._log.warn('No character sprite path provided');
        }
    }

    private async _showPanel() {
        this._setStarVisible(!this._isQuickPlay);

        // Set resource widgets to the current value minus the amount earned
        this._coinsResourceWidget.setResourceCounter(this._totalCoins - this._coinsEarned);
        this._coinsResourceWidget.disableGetMore();

        this._starsResourceWidget.setResourceCounter(this._totalStars - this._starsEarned);

        if (this._gameOverResult === GameOverResult.Win) {
            this._titleTextLabel.string = 'Well Done!';
            SoundManager.instance.playSound('SFX_Gameplay_Win');

            this._introComplete = false;
            this.node.on(Node.EventType.TOUCH_START, () => {
                if (!this._introComplete) {
                    this.skipInAnimation();
                    this._introComplete = true;
                }
            });

            // Play the in animation and wait for the callback to play the rewards sequence
            await this._playInAnimation(() => {
                this._introComplete = true;
                this.node.off(Node.EventType.TOUCH_START);
                this._playRewardsSequence();

                if (this._animationClips.length > 1) {
                    this._introAnimator.play(this._animationClips[1].name);
                }
            });
        } else if (this._gameOverResult === GameOverResult.Lose || this._gameOverResult === GameOverResult.Quit) {
            this._titleTextLabel.string = 'Try Again!';
            SoundManager.instance.playSound('SFX_Gameplay_Lose');
            this._playRewardsSequence();
        }
    }

    private skipInAnimation() {
        this.node.off(Node.EventType.TOUCH_START);
        //Set the intro animator to the last frame of the intro animation and tell it to stop
        if (this._introComplete === false) {
            this._introAnimator.stop();
            this._introAnimator.play(this._animationClips[0].name);
            this._introAnimator.getState(this._animationClips[0].name).time = this._animationClips[0].duration;
            this._introComplete = true;
        }
    }

    private _playRewardsSequence() {
        //Tween the score amount
        this._tweenScoreCount();
        this._tweenHandsCount();
        this._tweenCoinsCount();
    }

    public _tweenScoreCount() {
        if (this._scoreTarget == this._totalScore) {
            return;
        }

        // Tween the score to the target score
        this._scoreTarget = this._totalScore;
        const scoreObj = { value: this._currentScore };
        if (this._scoreTallyTween) {
            this._scoreTallyTween.stop();
        }
        this._scoreTallyTween = tween(scoreObj)
            .delay(this._scoreTallyDelay)
            .call(() => {
                SoundManager.instance.playSound('SFX_Gameplay_PointCount');
            })
            .to(
                this._tallyTime,
                { value: this._scoreTarget },
                {
                    easing: 'quadOut',
                    onUpdate: (target: { value: number }) => {
                        this._currentScore = Math.round(target.value);
                        this._scoreAmountLabel.string = `${this._currentScore}`;
                    }
                }
            )
            .call(() => {
                SoundManager.instance.stopSoundByName('SFX_Gameplay_PointCount');
                this._currentScore = this._scoreTarget;
                this._scoreAmountLabel.string = `${this._scoreTarget}`;
                if (this._isQuickPlay && this._previousHighScore !== null && this._currentScore > this._previousHighScore) {
                    this._newBestText.active = true;
                    SoundManager.instance.playSound('SFX_Gameplay_NewBest');
                    tween(this._newBestText)
                        .to(0.3, { scale: new Vec3(1.3, 1.3, 1.3) })
                        .to(0.5, { scale: new Vec3(1, 1, 1) }, { easing: 'bounceOut' })
                        .start();
                }
            })
            .start();
    }

    public _tweenHandsCount() {
        if (this._handsTarget == this._totalHands) {
            return;
        }

        // Tween the score to the target score
        this._handsTarget = this._totalHands;
        this._log.debug('Hands target:', { handsTarget: this._handsTarget });
        this._log.debug('Total hands:', { totalHands: this._totalHands });
        const handsObj = { value: this._currentHands };
        if (this._handsTallyTween) {
            this._handsTallyTween.stop();
        }
        this._handsTallyTween = tween(handsObj)
            .delay(this._handsTallyDelay)
            .call(() => {
                SoundManager.instance.playSound('SFX_Gameplay_PointCount');
            })
            .to(
                this._tallyTime,
                { value: this._handsTarget },
                {
                    easing: 'quadOut',
                    onUpdate: (target: { value: number }) => {
                        this._currentHands = Math.round(target.value);
                        this._handsPlayedAmount.string = `${this._currentHands}`;
                    }
                }
            )
            .call(() => {
                SoundManager.instance.stopSoundByName('SFX_Gameplay_PointCount');
                this._currentHands = this._handsTarget;
                this._handsPlayedAmount.string = `${this._handsTarget}`;
            })
            .start();
    }

    private _tweenCoinsCount() {
        this._log.debug('Counting rewards:', { coinsEarned: this._coinsEarned });

        // Tween the score to the target score
        this._coinsTarget = this._coinsEarned;
        const coinsObj = { value: this._currentCoins };
        if (this._coinsTallyTween) {
            this._coinsTallyTween.stop();
        }
        this._coinsTallyTween = tween(coinsObj)
            .delay(this._rewardsTallyDelay)
            .call(() => {
                SoundManager.instance.playSound('SFX_Gameplay_PointCount');
            })
            .to(
                this._tallyTime,
                { value: this._coinsTarget },
                {
                    easing: 'quadOut',
                    onUpdate: (target: { value: number }) => {
                        this._currentCoins = Math.round(target.value);
                        this._coinsRewardLabel.string = `${this._currentCoins}`;
                    }
                }
            )
            .call(() => {
                SoundManager.instance.stopSoundByName('SFX_Gameplay_PointCount');
                this._currentCoins = this._coinsTarget;
                this._coinsRewardLabel.string = `${this._coinsTarget}`;
                // Burst the rewards once it hits the target
                this._burstRewards();
                this._tweenCoinsWidgetCount();
                this._tweenStarWidgetCount();
            })
            .start();
    }

    private _burstRewards() {
        // Burst out the coins immediately
        if (this._coinsEarned > 0) {
            this._burstRewardsEffectCoins = this._burstAndFlyCoins(
                this._coinsEarned,
                this._coinRewardIcon,
                this._coinsResourceWidgetDestination
            );
        }

        // Schedule the stars burst with a delay
        if (this._starsEarned > 0) {
            this._starsScheduler = () => {
                this._starsRewardLabel.string = `${this._starsEarned}`;
                this._log.debug('Stars earned:', { starsEarned: this._starsEarned });

                SoundManager.instance.playSound('SFX_Rewards_CollectStar');
                this._setStarUnlocked(true);

                this._burstRewardsEffectStars = this._burstAndFlyStar(
                    this._starsEarned,
                    this._starPrefab,
                    this._starRewardsNode,
                    this._starsResourceWidgetDestination
                );
            };
            this.scheduleOnce(this._starsScheduler, this._starDelay);
        }
    }

    private _tweenStarWidgetCount() {
        if (this._starsWidgetTarget == this._totalStars) {
            return;
        }
        // Tween the score to the target score
        this._starsWidgetTarget = this._totalStars;
        const starsWidgetObj = { value: this._totalStars - this._starsEarned };
        if (this._starsWidgetTallyTween) {
            this._starsWidgetTallyTween.stop();
        }
        this._starsWidgetTallyTween = tween(starsWidgetObj)
            .delay(this._rewardsWidgetTallyDelay)
            .call(() => {
                SoundManager.instance.playSound('SFX_Gameplay_PointCount');
            })
            .to(
                this._tallyTime,
                { value: this._starsWidgetTarget },
                {
                    easing: 'quadOut',
                    onUpdate: (target: { value: number }) => {
                        this._starsWidgetCurrent = Math.round(target.value);
                        this._starsResourceWidget.setResourceCounter(this._starsWidgetCurrent);
                    }
                }
            )
            .call(() => {
                SoundManager.instance.stopSoundByName('SFX_Gameplay_PointCount');
                this._starsWidgetCurrent = this._starsWidgetTarget;
                this._starsResourceWidget.setResourceCounter(this._starsWidgetCurrent);
            })
            .start();
    }

    private _tweenCoinsWidgetCount() {
        if (this._coinsWidgetTarget == this._totalCoins) {
            return;
        }

        // Tween the score to the target score
        this._coinsWidgetTarget = this._totalCoins;
        const coinsWidgetObj = { value: this._totalCoins - this._coinsEarned };
        if (this._coinsWidgetTallyTween) {
            this._coinsWidgetTallyTween.stop();
        }

        SoundManager.instance.playSound('SFX_Rewards_Coins');

        this._coinsWidgetTallyTween = tween(coinsWidgetObj)
            .delay(this._rewardsWidgetTallyDelay)
            .call(() => {
                SoundManager.instance.playSound('SFX_Gameplay_PointCount');
            })
            .to(
                this._tallyTime,
                { value: this._coinsWidgetTarget },
                {
                    easing: 'quadOut',
                    onUpdate: (target: { value: number }) => {
                        this._coinsWidgetCurrent = Math.round(target.value);
                        this._coinsResourceWidget.setResourceCounter(this._coinsWidgetCurrent);
                    }
                }
            )
            .call(() => {
                SoundManager.instance.stopSoundByName('SFX_Gameplay_PointCount');
                this._coinsWidgetCurrent = this._coinsWidgetTarget;
                this._coinsResourceWidget.setResourceCounter(this._coinsWidgetCurrent);
            })
            .start();
    }

    private _setStarVisible(active: boolean) {
        this._starRewardsNode.active = active;
    }

    private _setStarUnlocked(unlocked: boolean) {
        this._starRewardIcon.grayscale = !unlocked;
        if (unlocked) {
            // Tween the star icon to be 1.3 in scale and back to 1 again to make it bounce
            tween(this._starRewardIcon.node)
                .delay(this._rewardsTallyDelay)
                .to(1, { scale: new Vec3(1.3, 1.3, 1.3) })
                .to(1, { scale: new Vec3(1, 1, 1) }, { easing: 'bounceOut' })
                .start();
        }
    }

    _burstAndFlyCoins(count: number, icon: Sprite, destination: Node): BurstRewards {
        // Get the width and height of the sprite node
        const size = icon.node.getComponent(UITransform).contentSize;
        const dimensions: Vec2 = new Vec2(size.width, size.height);

        const burstRewards = BurstRewards.createSprites(icon, count, BurstDirection.Up, icon.node, dimensions, destination, this._canvasNode);
        return burstRewards;
    }

    _burstAndFlyStar(count: number, prefab: Prefab, origin: Node, destination: Node): BurstRewards {
        const burstRewards = BurstRewards.createPrefabs(prefab, count, BurstDirection.Up, origin, destination, this._canvasNode);
        return burstRewards;
    }

    public onContinueButtonPressedCallback() {
        // Stop all tweens
        this._scoreTallyTween?.stop();
        this._handsTallyTween?.stop();
        this._coinsTallyTween?.stop();
        this._starsWidgetTallyTween?.stop();
        this._coinsWidgetTallyTween?.stop();

        if (this._starsScheduler) {
            this.unschedule(this._starsScheduler);
            this._starsScheduler = null;
        }

        // Set all tween results to final values
        this._scoreAmountLabel.string = `${this._scoreTarget}`;
        this._handsPlayedAmount.string = `${this._handsTarget}`;
        this._starsRewardLabel.string = `${this._starsEarned}`;
        this._coinsRewardLabel.string = `${this._coinsTarget}`;

        this._coinsResourceWidget.setResourceCounter(this._totalCoins);
        this._starsResourceWidget.setResourceCounter(this._totalStars);

        this.OnContinueButtonPressed?.call(this);
        this._playOutAnimation();
    }

    private async _playInAnimation(onComplete?: () => void) {
        this._introAnimator.play(this._animationClips[0].name);

        this._introAnimator.once(Animation.EventType.FINISHED, () => {
            if (onComplete) {
                onComplete();
            }
        });
    }

    private _playOutAnimation(onComplete?: () => void) {
        //TODO: Enable this if we do want an out animation

        // this._introAnimator.play(this._animationClips[0].name);

        // this._introAnimator.once(Animation.EventType.FINISHED, () => {
        //     if (onComplete) {
        //         onComplete();
        //     }
        // });

        // TODO CSB: make this call after out animation has completed
        if (this._onCloseCallback) {
            this._onCloseCallback();
            this._onCloseCallback = undefined;
        }
    }

    onDestroy() {
        this._continueButton.clickEvents = [];
        this._scoreTallyTween?.stop();
        this._handsTallyTween?.stop();
        this._coinsTallyTween?.stop();
        this._starsWidgetTallyTween?.stop();
        this._coinsWidgetTallyTween?.stop();
        this._burstRewardsEffectCoins?.stop();
        this._burstRewardsEffectCoins = null;
        this._burstRewardsEffectStars?.stop();
        this._burstRewardsEffectStars = null;
        SoundManager.instance.stopAllSounds();

        if (this._starsScheduler) {
            this.unschedule(this._starsScheduler);
            this._starsScheduler = null;
        }
    }
}
