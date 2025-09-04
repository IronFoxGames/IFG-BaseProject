import { _decorator, Button, CCString, Component, Label, Sprite, SpriteFrame } from 'cc';
import { ItemConfig } from '../config/ItemConfig';
import { Currency } from '../core/enums/Currency';
import { CurrencyAndAmount } from '../core/model/CurrencyAndAmount';
import { logger } from '../logging';
import { ResourceLoader } from '../utils/ResourceLoader';
const { ccclass, property } = _decorator;

const log = logger.child('StorePurchaseButton');

@ccclass('CurrencyIcon')
export class CurrencyIcon {
    @property({ type: CCString, visible: true })
    public Name: string;

    @property({ type: SpriteFrame, visible: true })
    public Icon: SpriteFrame;
}

@ccclass('StorePurchaseButton')
export class StorePurchaseButton extends Component {
    @property({ type: Button, visible: true })
    private _purchaseButton: Button;

    @property({ type: Label, visible: true })
    private _itemCost: Label;

    @property({ type: Sprite, visible: true })
    private _itemCostCurrency: Sprite;

    @property({ type: [CurrencyIcon], visible: true })
    private _currencyIcons: CurrencyIcon[] = [];

    public async init(itemConfig: ItemConfig, cost: CurrencyAndAmount, onClick: () => void = null): Promise<void> {
        this._purchaseButton.node.on(Button.EventType.CLICK, () => {
            onClick?.call(this);
        });
        if (cost.currency === Currency.Real) {
            this._itemCost.string = `$ ${cost.amount}`;
            // The sprite's container must be disabled in order for the layout that contains it to work properly
            this._itemCostCurrency.node.parent.active = false;
        } else if (cost.amount === 0 && cost.currency === Currency.Coins) {
            this._itemCost.string = 'Free';
            this._itemCostCurrency.node.parent.active = false;
        } else {
            this._itemCost.string = `${cost.amount}`;

            const spriteFrame = await loadCurrencySprite(itemConfig, cost.currency);
            this._itemCostCurrency.spriteFrame = spriteFrame ?? this._getCurrencyIcon(cost.currency);
        }
    }

    private _getCurrencyIcon(currencyName: string): SpriteFrame {
        const currency = this._currencyIcons.find((currency) => currency.Name === currencyName);
        return currency?.Icon ?? null;
    }
}

function loadCurrencySprite(itemConfig: ItemConfig, currency: Currency) {
    const itemInfo = itemConfig.getItemInfo(currency);
    if (itemInfo == null) {
        return Promise.resolve(null);
    }

    try {
        return ResourceLoader.load(itemInfo.sprite, SpriteFrame);
    } catch (error) {
        log.error('error loading currency sprite', {
            error
        });
        return Promise.resolve(null);
    }
}
