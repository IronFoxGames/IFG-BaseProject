import {
    _decorator,
    AnimationComponent,
    Button,
    CCString,
    Color,
    Component,
    Enum,
    Label,
    Node,
    Sprite,
    SpriteFrame,
    Toggle,
    UITransform
} from 'cc';
import { GameConfig } from '../../core/model/GameConfig';
import { ItemInfo } from '../../core/model/ItemInfo';
import { logger } from '../../logging';
import { Powerup } from '../../powerups/Powerup';
import { ICardScrambleService } from '../../services/ICardScrambleService';
import { RequirementsService } from '../../services/RequirementsService';
import { UIOverlayService } from '../../services/UIOverlayService';
import { ResourceLoader } from '../../utils/ResourceLoader';
import { InfoTooltip } from './InfoTooltip';
const { ccclass, property } = _decorator;

export enum PowerupEntryTooltipPosition {
    Left = 0,
    Top = 1
}

@ccclass('PowerupEntry')
export class PowerupEntry extends Component {
    public static OnPowerupSelectedEvent: string = 'OnPowerupSelected';
    public static OnPowerupUpsellEvent: string = 'OnPowerupUpsellEvent';
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

    @property({ type: AnimationComponent, visible: true })
    private _animationRoot: AnimationComponent = null;

    @property({ type: Enum(PowerupEntryTooltipPosition), visible: true })
    private _infoTooltipPosition: PowerupEntryTooltipPosition = PowerupEntryTooltipPosition.Left;

    @property({ type: InfoTooltip, visible: true })
    private _infoTooltipLeft: InfoTooltip = null;

    @property({ type: InfoTooltip, visible: true })
    private _infoTooltipTop: InfoTooltip = null;

    @property({ type: UITransform, visible: true })
    private _uiTransform: UITransform = null;

    private _cardScrambleService: ICardScrambleService = null;
    private _uiOverlayService: UIOverlayService = null;
    private _gameConfig: GameConfig;
    private _powerup: Powerup = null;
    private _itemInfo: ItemInfo = null;
    private _onUpsell: (itemInfo) => void = null;
    private _nodeIdentifier = '';
    private _log = logger.child('PowerupEntry');

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

    public get itemInfo() {
        return this._itemInfo;
    }

    public get powerup() {
        return this._powerup;
    }

    public async InitEntry(
        cardScrambleService: ICardScrambleService,
        uiOverlayService: UIOverlayService,
        requirementsService: RequirementsService,
        powerup: Powerup,
        powerupInfo: ItemInfo,
        onUpsell: (itemInfo) => void,
        gameConfig: GameConfig
    ) {
        this._cardScrambleService = cardScrambleService;
        this._uiOverlayService = uiOverlayService;
        this._gameConfig = gameConfig;
        this._powerup = powerup;
        this._itemInfo = powerupInfo;
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
            this._log.debug(`Level Requirement For ${powerup.PowerupType} Not Met. Hiding Entry`);
            this.node.active = false;
        }

        this._infoTooltipLeft.init();
        this._infoTooltipTop.init();
    }

    public updateVisuals() {
        const count = this._cardScrambleService.getPowerupCount(this._powerup.PowerupType);
        if (count > 0 || this._gameConfig?.freePowerup === this._powerup.PowerupType) {
            this._getMoreButton.node.active = false;
            this._count.active = true;
            this._countText.string = count > 99 ? '99+' : `${count}`;

            if (this._gameConfig?.freePowerup === this._powerup.PowerupType) {
                this._countText.string = '∞';
                this._countText.fontSize = 55;
            }
        } else {
            this._count.active = false;
            this._getMoreButton.node.active = true;
        }
    }

    public setState(checked: boolean, interactable: boolean) {
        this._toggle.isChecked = checked;
        this._toggle.interactable = interactable;

        if (interactable) {
            this.iconSprite.color = new Color(255, 255, 255, 255);
        } else {
            this.iconSprite.color = new Color(128, 128, 128, 255);
        }
    }

    private _onToggleValueChanged() {
        // Cancel the toggle and upsell prompt
        const count = this._cardScrambleService.getPowerupCount(this._powerup.PowerupType);
        if (count < 1 && this._toggle.isChecked === true && this._gameConfig?.freePowerup !== this._powerup.PowerupType) {
            this._toggle.isChecked = false;
            this._upsell();
            return;
        }

        if (this._toggle.isChecked) {
            this._animationRoot?.play('powerup-active');
            this.node.emit(PowerupEntry.OnPowerupSelectedEvent, this.powerup);
        } else {
            this._animationRoot?.play('powerup-reset');
        }
    }

    private _upsell() {
        if (this._onUpsell) {
            this._onUpsell.call(this, this._itemInfo);
        }
    }

    private _onShowTooltip() {
        switch (this._infoTooltipPosition) {
            case PowerupEntryTooltipPosition.Left: {
                this._infoTooltipLeft.show(this._itemInfo.tooltip);
                break;
            }
            case PowerupEntryTooltipPosition.Top: {
                this._infoTooltipTop.show(this._itemInfo.tooltip);
                break;
            }
            default: {
                this._log.error('Attempted to show a tooltip with an unsupported position!');
                break;
            }
        }
    }

    private _onHideTooltip() {
        switch (this._infoTooltipPosition) {
            case PowerupEntryTooltipPosition.Left: {
                this._infoTooltipLeft.hide();
                break;
            }
            case PowerupEntryTooltipPosition.Top: {
                this._infoTooltipTop.hide();
                break;
            }
            default: {
                this._log.error('Attempted to hide a tooltip with an unsupported position!');
                break;
            }
        }
    }

    private _onMouseEnter() {
        if (this._uiOverlayService.isTutorialScrimActive()) {
            return;
        }

        this._log.debug('A PowerupEntry is being hovered!');
        this._onShowTooltip();
    }

    private _onMouseLeave() {
        if (this._uiOverlayService.isTutorialScrimActive()) {
            return;
        }

        this._log.debug('A PowerupEntry is no longer being hovered.');
        this._onHideTooltip();
    }
}
