import { _decorator, Component, Label, Sprite, SpriteFrame } from 'cc';
import { logger } from '../../logging';
import { ICardScrambleService } from '../../services/ICardScrambleService';
import { UpsellOffer } from '../../services/IStore';
import { ResourceLoader } from '../../utils/ResourceLoader';
const { ccclass, property } = _decorator;

@ccclass('PowerupUpsellContainer')
export class PowerupUpsellContainer extends Component {
    @property({ type: Label, visible: true })
    private _costLabel: Label = null;

    @property({ type: Sprite, visible: true })
    private _costCurrencySprite: Sprite = null;

    private _cardScrambleService: ICardScrambleService = null;
    private _log = logger.child('PowerupUpsellContainer');

    public async InitEntry(cardScrambleService: ICardScrambleService) {
        this._cardScrambleService = cardScrambleService;
    }

    public async setNextUpsellOffer(upsellOffer: UpsellOffer) {
        this._costLabel.node.active = false;
        this._costCurrencySprite.node.active = false;

        const cost = upsellOffer?.catalogItem?.cost;
        if (!cost) {
            this._log.warn(`Unknown cost for catalog item ${upsellOffer?.catalogItem?.id}`);
            return;
        }

        const currencyItemInfo = this._cardScrambleService.getItem(cost.currency);
        if (!currencyItemInfo) {
            this._log.warn(`Unknown currency ${cost.currency}`);
            return;
        }

        try {
            const sprite = await ResourceLoader.load(currencyItemInfo.sprite, SpriteFrame);
            this._costCurrencySprite.spriteFrame = sprite;
            this._costLabel.string = `${cost.amount}`;
            this._costLabel.node.active = true;
            this._costCurrencySprite.node.active = true;
        } catch (exception) {
            this._log.warn(`Failed to load currency sprite for ${currencyItemInfo.id}`, exception);
        }
    }
}
