import { _decorator, Button, CCString, Component, Label, Node, Sprite, SpriteFrame, Toggle } from 'cc';
import { Booster } from '../../boosters/Booster';
import { GameConfig } from '../../core/model/GameConfig';
import { ItemInfo } from '../../core/model/ItemInfo';
import { InfoTooltip } from '../../game/ui/InfoTooltip';
import { logger } from '../../logging';
import { ICardScrambleService } from '../../services/ICardScrambleService';
import { RequirementsService } from '../../services/RequirementsService';
import { UIOverlayService } from '../../services/UIOverlayService';
import { ResourceLoader } from '../../utils/ResourceLoader';
const { ccclass, property } = _decorator;

@ccclass('BoosterEntry')
export class BoosterEntry extends Component {
    public static OnBoosterSelectedEvent: string = 'OnBoosterSelected';

    @property(Sprite)
    iconSprite: Sprite;

    @property({ type: Toggle, visible: true })
    private _toggle: Toggle = null;

    @property({ type: Node, visible: true })
    private _count: Node = null;

    @property({ type: Label, visible: true })
    private _countText: Label = null;

    @property({ type: Button, visible: true })
    private _getMoreButton: Button = null;

    @property({ type: CCString, visible: true })
    private _nodeIdentifierPrefix: string = '';

    @property({ type: InfoTooltip, visible: true })
    private _infoTooltip: InfoTooltip = null;

    private _cardScrambleService: ICardScrambleService = null;
    private _uiOverlayService: UIOverlayService = null;
    private _gameConfig: GameConfig;
    private _booster: Booster = null;
    private _itemInfo: ItemInfo = null;
    private _onUpsell: (itemInfo) => void = null;
    private _nodeIdentifier = '';
    private _log = logger.child('BoosterEntry');

    protected onLoad(): void {
        this.node.on(Node.EventType.MOUSE_ENTER, this._onMouseEnter, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this._onMouseLeave, this);
        this.node.on(Toggle.EventType.TOGGLE, this._onToggleValueChanged, this);
        this._getMoreButton.node.on(Button.EventType.CLICK, this._upsell, this);
    }

    protected onDestroy(): void {
        this.node?.off(Node.EventType.MOUSE_ENTER, this._onMouseEnter, this);
        this.node?.off(Node.EventType.MOUSE_LEAVE, this._onMouseLeave, this);
        this.node?.off(Toggle.EventType.TOGGLE, this._onToggleValueChanged, this);
        this._getMoreButton.node?.off(Button.EventType.CLICK, this._upsell, this);
        if (this._uiOverlayService) {
            this._uiOverlayService.unregisterNode(this._nodeIdentifier);
        }
    }

    public async InitEntry(
        cardScrambleService: ICardScrambleService,
        uiOverlayService: UIOverlayService,
        requirementsService: RequirementsService,
        booster: Booster,
        boosterInfo: ItemInfo,
        onUpsell: (itemInfo) => void,
        gameConfig: GameConfig
    ) {
        this._cardScrambleService = cardScrambleService;
        this._uiOverlayService = uiOverlayService;
        this._gameConfig = gameConfig;
        this._booster = booster;
        this._itemInfo = boosterInfo;
        this._onUpsell = onUpsell;

        if (this._itemInfo == null) {
            this._log.warn('invalid booster info');
            return;
        }

        this._nodeIdentifier = `${this._nodeIdentifierPrefix}.${this._itemInfo.id}`;
        this._uiOverlayService.registerNode(this._nodeIdentifier, this.node);

        this.updateVisuals();

        this.iconSprite.enabled = false;
        let sprite: SpriteFrame = null;
        try {
            sprite = await ResourceLoader.load(this._itemInfo.sprite, SpriteFrame);
        } catch (error) {
            this._log.warn(`Failed to load icon for powerup: ${this._itemInfo.id}`, error);
        }
        this.iconSprite.spriteFrame = sprite;
        this.iconSprite.enabled = true;

        if (!requirementsService.checkRequirementsMet(this._itemInfo.requirements) && !cardScrambleService.cheatAllPowerups) {
            this._log.info(`Requirements for ${booster.BoosterType} Not Met. Hiding Entry`);
            this.node.active = false;
        }

        this._infoTooltip.init();
    }

    public updateVisuals() {
        const count = this._cardScrambleService.getBoosterCount(this._booster.BoosterType);

        if (count > 0 || this._gameConfig?.freeBooster === this._booster.BoosterType) {
            this._getMoreButton.node.active = false;
            this._count.active = true;
            this._countText.string = count > 99 ? '99+' : `${count}`;

            if (this._gameConfig?.freeBooster === this._booster.BoosterType) {
                this._countText.string = '∞';
                this._countText.fontSize = 55;
            }
        } else {
            this._getMoreButton.node.active = true;
            this._count.active = false;
        }
    }

    public cleanup() {
        if (this._uiOverlayService) {
            this._uiOverlayService.unregisterNode(this._nodeIdentifier);
        }
    }

    private _onToggleValueChanged() {
        // Cancel the toggle and upsell prompt
        const count = this._cardScrambleService.getBoosterCount(this._booster.BoosterType);
        if (count < 1 && this._toggle.isChecked === true && this._gameConfig?.freeBooster !== this._booster.BoosterType) {
            this._toggle.isChecked = false;
            this._upsell();
            return;
        }

        this.node.emit(BoosterEntry.OnBoosterSelectedEvent, this._booster);
    }

    private _upsell() {
        if (this._onUpsell) {
            this._onUpsell.call(this, this._itemInfo);
        }
    }

    private _onMouseEnter() {
        if (this._uiOverlayService.isTutorialScrimActive()) {
            return;
        }

        this._log.debug('A BoosterEntry is being hovered!');
        this._infoTooltip.show(this._itemInfo.tooltip);
    }

    private _onMouseLeave() {
        if (this._uiOverlayService.isTutorialScrimActive()) {
            return;
        }

        this._log.debug('A BoosterEntry is no longer being hovered.');
        this._infoTooltip.hide();
    }
}
