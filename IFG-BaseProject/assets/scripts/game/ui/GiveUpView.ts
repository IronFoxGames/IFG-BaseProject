import { Toggle } from 'cc';
import { Button } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { Powerup } from '../../powerups/Powerup';
import { PowerupEntry } from './PowerupEntry';
import { ItemConfig } from '../../config/ItemConfig';
import { ICardScrambleService } from '../../services/ICardScrambleService';
import { UIOverlayService } from '../../services/UIOverlayService';
import { CCString } from 'cc';
import { TutorialService } from '../../services/TutorialService';
import { GameConfig } from '../../core/model/GameConfig';
import { logger } from '../../logging';
import { RequirementsService } from '../../services/RequirementsService';
import { Label } from 'cc';
import { RichText } from 'cc';
import { ItemInfo } from '../../core/model/ItemInfo';
import { CardScrambleGameController } from '../CardScrambleGameController';
import { SpriteFrame } from 'cc';
import { Currency } from '../../core/enums/Currency';
import { Sprite } from 'cc';
import { ResourceWidget } from '../../diner/ui/ResourceWidget';
const { ccclass, property } = _decorator;

@ccclass('GiveUpView')
export class GiveUpView extends Component {
    @property(Label)
    titleText: Label | null = null;

    @property(Button)
    closeButton: Button | null = null;

    @property(Button)
    finishLevelButton: Button | null = null;

    @property(Button)
    usePowerupButton: Button | null = null;

    @property(Button)
    purchasePowerupButton: Button | null = null;

    @property(Button)
    entryGetMoreButton: Button | null = null;

    @property(ResourceWidget)
    normalCurrencyResourceWidget: ResourceWidget | null = null;

    @property(ResourceWidget)
    premiumCurrencyResourceWidget: ResourceWidget | null = null;

    @property(PowerupEntry)
    powerupEntry: PowerupEntry | null = null;

    @property(Label)
    purchaseCostText: Label | null = null;

    @property(RichText)
    subHeaderText: RichText | null = null;

    @property(RichText)
    infoText: RichText | null = null;

    @property(Sprite)
    purchaseCostSprite: Sprite | null = null;

    @property(SpriteFrame)
    coinSprite: SpriteFrame | null = null;

    @property(SpriteFrame)
    gemSprite: SpriteFrame | null = null;

    @property({ type: CCString, visible: true })
    private _menuId: string;

    public static OnLevelFinishedEvent = 'level_finished';
    public static UIEventPreparePowerup = 'UIEventPreparePowerup';
    public static UIEventCancelPowerup = 'UIEventCancelPowerup';
    public static OnPowerupUpsell = 'powerup-upsell';

    private _powerupComponents: PowerupEntry[] = [];
    private _log = logger.child('GiveUpView');
    private _currentPowerup: Powerup = null;
    private _powerupItemInfo: ItemInfo = null;

    protected start(): void {
        this.closeButton.node.on(Button.EventType.CLICK, this._onClosePressed, this);
        this.finishLevelButton.node.on(Button.EventType.CLICK, this._onFinishPressed, this);
        this.usePowerupButton.node.on(Button.EventType.CLICK, this._onPowerupUsageConfirmed, this);
        this.purchasePowerupButton.node.on(Button.EventType.CLICK, this._onPowerupPurchaseConfirmed, this);

        this.finishLevelButton.interactable = true;

        this.normalCurrencyResourceWidget.disableGetMore();
        this.premiumCurrencyResourceWidget.disableGetMore();
    }

    public async initView(
        tutorialService: TutorialService,
        itemConfig: ItemConfig,
        cardScrambleService: ICardScrambleService,
        uiOverlayService: UIOverlayService,
        requirementsService: RequirementsService,
        gameConfig: GameConfig,
        gameOverReason: string,
        powerupToOffer: Powerup,
        gameController: CardScrambleGameController
    ) {
        this._currentPowerup = powerupToOffer;

        if (gameOverReason === 'No More Moves') {
            this.titleText.string = 'Out Of Moves';
            this.subHeaderText.string = 'No more space to play?';
            this.infoText.string = 'Use the Clean Down power up to clear the last 5 hands from the board while keeping your progress!';
        } else if (gameOverReason === 'No More Cards') {
            this.titleText.string = 'Out Of Cards';
            this.subHeaderText.string = 'No more cards?';
            this.infoText.string = 'Use the +7 Cards power up to get more now!';
        }

        this._powerupItemInfo = itemConfig.getItemInfo(powerupToOffer.PowerupType);
        this.powerupEntry.InitEntry(
            cardScrambleService,
            uiOverlayService,
            requirementsService,
            powerupToOffer,
            this._powerupItemInfo,
            () => {
                this.node.emit(GiveUpView.OnPowerupUpsell, this._powerupItemInfo);
            },
            gameConfig
        );

        this.entryGetMoreButton.node.active = false;
        this.usePowerupButton.node.active = true;
        this.purchasePowerupButton.node.active = false;

        let powerupCount = cardScrambleService.getPowerupCount(powerupToOffer.PowerupType);
        if (powerupCount === 0) {
            this.usePowerupButton.node.active = false;
            this.purchasePowerupButton.node.active = true;

            let upsellOffer = await gameController.getNextUpsell(this._powerupItemInfo);
            this.purchaseCostText.string = upsellOffer.catalogItem.cost.amount.toString();

            if (upsellOffer.catalogItem.cost.currency === Currency.Coins) {
                this.purchaseCostSprite.spriteFrame = this.coinSprite;
            } else if (upsellOffer.catalogItem.cost.currency === Currency.Gems) {
                this.purchaseCostSprite.spriteFrame = this.gemSprite;
            }
        }

        const toggleComponent = this.powerupEntry.getComponent(Toggle);
        toggleComponent.isChecked = false;
        toggleComponent.interactable = false;

        const coins = await cardScrambleService.getCurrencyBalance(Currency.Coins);
        this.normalCurrencyResourceWidget.setResourceCounter(coins);
        const gems = await cardScrambleService.getCurrencyBalance(Currency.Gems);
        this.premiumCurrencyResourceWidget.setResourceCounter(gems);

        if (this._menuId && this._menuId !== '') {
            tutorialService.onMenuOpened(this._menuId);
        }
    }

    public updatePowerupVisuals() {
        this._powerupComponents.forEach((powerupEntry) => {
            powerupEntry.updateVisuals();
        });
    }

    private _onClosePressed() {
        this.closeButton.node.off(Button.EventType.CLICK, this._onClosePressed, this);
        this.finishLevelButton.node.off(Button.EventType.CLICK, this._onFinishPressed, this);
        this.usePowerupButton.node.off(Button.EventType.CLICK, this._onPowerupUsageConfirmed, this);
        this.purchasePowerupButton.node.off(Button.EventType.CLICK, this._onPowerupPurchaseConfirmed, this);

        this.scheduleOnce(() => {
            this.node.destroy();
        }, 0);
    }

    public closeView() {
        this._onClosePressed();
    }

    public usePowerupAfterPurchase() {
        this._onPowerupUsageConfirmed();
    }

    public async onPowerupUsed(powerup: Powerup) {
        await this._onPowerupSelected(powerup);
    }

    private async _onPowerupSelected(powerup: Powerup) {
        await new Promise<void>((resolve) => {
            this.node.emit(PowerupEntry.OnPowerupSelectedEvent, powerup, resolve);
        });

        this._onClosePressed();
    }

    private _onFinishPressed() {
        this.node.emit(GiveUpView.OnLevelFinishedEvent);
        this.node.destroy();
    }

    private _onPowerupUsageConfirmed() {
        this.node.emit(GiveUpView.UIEventPreparePowerup, this._currentPowerup);
    }

    private _onPowerupPurchaseConfirmed() {
        this.node.emit(GiveUpView.OnPowerupUpsell, this._powerupItemInfo);
    }
}
