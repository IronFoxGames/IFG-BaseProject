import { _decorator, Component, Label, Button, EventHandler, Node, Input, ProgressBar, EPSILON, Sprite, Vec2, Prefab } from 'cc';
import { TextUtils } from '../../core/TextUtils';
import { BurstDirection, BurstRewards } from '../../game/ui/RewardsBurst';
import { IFGButton } from '../../ui/IFGButton';
import { logger } from '../../logging';
const { ccclass, property } = _decorator;

@ccclass('ResourceWidget')
export class ResourceWidget extends Component {
    public OnGetMoreButtonPressed: () => void = null;

    @property({ type: Label, visible: true })
    private _counterText: Label;

    @property({ type: Label, visible: true })
    private _timerText: Label;

    @property({ type: Node, visible: true })
    private _getMoreBadge: Node;

    @property({ type: IFGButton, visible: true })
    private _backgroundButton: IFGButton;

    @property({ type: ProgressBar, visible: true })
    private _progressBar: ProgressBar;

    @property({ type: Node, visible: true })
    private _maxVisual: Node;

    @property({ type: Sprite, visible: true })
    private _currencyIconSprite: Sprite;

    @property({ type: Prefab, visible: true })
    private _currencyPrefab: Prefab;

    private _log = logger.child('ResourceWidget');

    protected onLoad(): void {
        this._backgroundButton.node.on('click', this._onGetMore, this);
    }

    protected onDestroy(): void {
        // this._backgroundButton.node.off('click', this._onGetMore, this);
    }

    public init() {
        // Hide next text by default
        this._timerText.node.active = false;
    }

    public disableGetMore() {
        this._backgroundButton.interactable = false;
        this._getMoreBadge.active = false;
    }

    public setResourceCounter(amount: number) {
        this._counterText.string = TextUtils.stringifyCurrencyCount(amount);
    }

    public setTimerText(nextText: string) {
        this._timerText.node.active = true;
        this._timerText.string = nextText;
    }

    public setProgressBar(progress: number) {
        this._progressBar.progress = progress;

        const isMax = progress >= 1.0 - EPSILON;
        this._timerText.node.active = !isMax;
        this._maxVisual.active = isMax;
    }

    public forceMaxVisualActive() {
        this._timerText.node.active = false;
        this._maxVisual.active = true;
    }

    public burstSprites(count: number, destinationNode: Node, canvas: Node, onBurstComplete: () => void = null) {
        const spriteFrame = this._currencyIconSprite.spriteFrame;
        const dimensions = spriteFrame ? new Vec2(spriteFrame.rect.width, spriteFrame.rect.height) : new Vec2(0, 0);

        BurstRewards.createSprites(
            this._currencyIconSprite,
            count,
            BurstDirection.Down,
            this._currencyIconSprite.node,
            dimensions,
            destinationNode,
            canvas,
            onBurstComplete
        );
    }

    public burstPrefabs(count: number, destinationNode: Node, canvas: Node, onBurstComplete: () => void = null) {
        if (!this._currencyPrefab) {
            this._log.error(`Currency prefab is not set for the ${this.node.name} ResourceWidget component. Bursting sprites instead.`);
            this.burstSprites(count, destinationNode, canvas, onBurstComplete);
            return;
        }
        BurstRewards.createPrefabs(
            this._currencyPrefab,
            count,
            BurstDirection.Down,
            this._currencyIconSprite.node,
            destinationNode,
            canvas,
            onBurstComplete
        );
    }

    private _onGetMore() {
        this.OnGetMoreButtonPressed?.call(this);
    }
}
