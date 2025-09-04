import { _decorator, Component, Node, Button, Label, Sprite, SpriteFrame, CCString } from 'cc';
import { RequirementsService } from '../../services/RequirementsService';
import { PropInstanceData } from '../PropInstanceData';
import { ResourceLoader } from '../../utils/ResourceLoader';
import { UIOverlayService } from '../../services/UIOverlayService';
import { Tween } from 'cc';
import { tween } from 'cc';
import { Vec3 } from 'cc';
import { logger } from '../../logging';
import { Color } from 'cc';
import { Font } from 'cc';
import { PopupLayout, PopupType } from '../../game/ui/GeneralPopup';
import { CCInteger } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PropScrollEntry')
export class PropScrollEntry extends Component {
    public OnPropEntryButtonPressed: () => void;

    @property({ type: Color, visible: true, group: 'StateVisuals' })
    private _defaultBackgroundColor: Color = new Color(255, 255, 255, 255);

    @property({ type: Color, visible: true, group: 'StateVisuals' })
    private _activeBackgroundColor: Color = new Color(255, 255, 255, 255);

    @property({ type: Color, visible: true, group: 'StateVisuals' })
    private _activeTextColor: Color = new Color(255, 255, 255, 255);

    @property({ type: CCString, visible: true, group: 'StateVisuals' })
    private _activeTextString: string = '';

    @property({ type: Color, visible: true, group: 'StateVisuals' })
    private _ownedBackgroundColor: Color = new Color(255, 255, 255, 255);

    @property({ type: CCString, visible: true, group: 'StateVisuals' })
    private _ownedTextString: string = '';

    @property({ type: Color, visible: true, group: 'StateVisuals' })
    private _ownedTextColor: Color = new Color(255, 255, 255, 255);

    @property({ type: CCInteger, visible: true, group: 'StateVisuals' })
    private _defaultSpriteVerticalOffset: number = 22;

    @property({ type: CCInteger, visible: true, group: 'StateVisuals' })
    private _ownedSpriteVerticalOffset: number = 0;

    @property({ type: Color, visible: true, group: 'StateVisuals' })
    private _freeTextColor: Color = new Color(79, 187, 187, 255);

    @property({ type: Sprite, visible: true, group: 'StateVisuals' })
    private _backgroundSprite: Sprite;

    @property({ type: Node, visible: true, group: 'Nodes' })
    private _propSpriteNode: Node;

    @property({ type: Node, visible: true, group: 'Nodes' })
    private _selectedSpriteNode: Node;

    @property({ type: Node, visible: true, group: 'Nodes' })
    private _lockSpriteNode: Node;

    @property({ type: Node, visible: true, group: 'Nodes' })
    private _clubLockSpriteNode: Node;

    @property({ type: Node, visible: true, group: 'Nodes' })
    private _clubSpriteIndicator: Node;

    @property({ type: Node, visible: true, group: 'Nodes' })
    private _costNode: Node;

    @property({ type: Node, visible: true, group: 'Nodes' })
    private _noneTextNode: Node;

    @property({ type: Node, visible: true, group: 'Nodes' })
    private _infoTextNode: Node;

    @property({ type: Label, visible: true, group: 'Labels' })
    private _costLabel: Label;

    @property({ type: Label, visible: true, group: 'Labels' })
    private _infoLabel: Label;

    @property({ type: Font, visible: true, group: 'Labels' })
    private _costLabelFreeFont: Font;

    @property({ type: Sprite, visible: true, group: 'Sprites' })
    private _propThumbnailSprite: Sprite;

    @property({ type: Sprite, visible: true, group: 'Sprites' })
    private _frameSprite: Sprite;

    @property({ type: Sprite, visible: true, group: 'Sprites' })
    private _requirementIconSprite: Sprite;

    @property({ type: [SpriteFrame], visible: true, group: 'Sprites' })
    private _frameSpriteFrames: SpriteFrame[] = []; //0: Default, 1: Empty

    @property({ type: [SpriteFrame], visible: true, group: 'Sprites' })
    private _requirementIconSpriteFrames: SpriteFrame[] = []; //0: Currency, 1: Level, 2: Event

    @property({ type: Vec3, visible: true })
    private _buttonScaleOnActive = new Vec3(1.2, 1.2, 1.2);

    private _requirementsService: RequirementsService;
    private _uiOverlayService: UIOverlayService;
    private _propInstanceData: PropInstanceData;
    private _requirementsMet: boolean;
    private _propTweenAnim: Tween<Node> = null;
    private _currentProp: string;
    private _isPremiumUser: boolean;
    private _log = logger.child('PropScrollEntry');

    public async init(
        data: PropInstanceData,
        requirementsService: RequirementsService,
        uiOverlayService: UIOverlayService,
        currentProp: string,
        isPremiumUser: boolean
    ) {
        this._requirementsService = requirementsService;
        this._uiOverlayService = uiOverlayService;
        this._propInstanceData = data;
        this._currentProp = currentProp;
        this._isPremiumUser = isPremiumUser;

        // Hide until all loaded
        this._propSpriteNode.active = false;
        this._costNode.active = false;
        this._lockSpriteNode.active = false;
        this._requirementIconSprite.node.active = false;
        this._infoLabel.string = '';
        this._costLabel.string = '';

        if (this._propInstanceData == null || this._propInstanceData.data == null) {
            this._noneTextNode.active = true;
            this._infoTextNode.active = false;
            this._propSpriteNode.active = false;
            this._lockSpriteNode.active = false;
            this._costNode.active = false;
            this._frameSprite.spriteFrame = this._frameSpriteFrames[1];
            const button = this.getComponent(Button);
            button.node.on(Button.EventType.CLICK, this._onPropEntryButtonPressedCallback, this);
            return;
        }

        const propData = this._propInstanceData.data;

        try {
            const spriteFrame = await ResourceLoader.load(propData.thumbnailFilePath, SpriteFrame);
            this._propThumbnailSprite.spriteFrame = spriteFrame;
        } catch (error) {
            this._log.error('Failed to load Prop Thumbnail: ', error);
        }

        this.updateVisuals(this._currentProp);

        const button = this.getComponent(Button);
        button.node.on(Button.EventType.CLICK, this._onPropEntryButtonPressedCallback, this);

        this._propSpriteNode.active = true;
    }

    public updateVisuals(currentPropID: string) {
        if (currentPropID === undefined || currentPropID === null) {
            this._currentProp = 'none';
        } else {
            this._currentProp = currentPropID;
        }

        // If it's a none prop bail out early
        if (this._propInstanceData == null) {
            return;
        }

        const propData = this._propInstanceData.data;
        this._requirementsMet = this._requirementsService.checkRequirementsMet(propData.requirements);
        this._lockSpriteNode.active = !this._requirementsMet;

        this._frameSprite.spriteFrame = this._frameSpriteFrames[0];

        // If not owned, show the purchase visuals
        if (!this._propInstanceData.isOwned) {
            this._costNode.active = true;
            this._infoTextNode.active = false;
            this._backgroundSprite.color = this._defaultBackgroundColor;
            this._propSpriteNode.setPosition(0, this._defaultSpriteVerticalOffset, 0);
            // If the cost is not greater than 0, show the free text
            if (this._propInstanceData.storeData.cost.amount > 0) {
                this._costLabel.string = `${this._propInstanceData.storeData.cost.amount}`;
                this._requirementIconSprite.node.active = true;
            } else {
                this._costNode.active = false;
                this._infoTextNode.active = true;
                this._infoLabel.string = 'FREE';
                this._infoLabel.color = this._freeTextColor;
                this._requirementIconSprite.node.active = false;
            }
            // If the player is not a premium user and the prop is exclusive, show the pogo lock visuals
            if (this._propInstanceData.storeData.isUpsell) {
                if (this._isPremiumUser) {
                    this._clubSpriteIndicator.active = true;
                    this._clubLockSpriteNode.active = false;
                } else {
                    this._clubSpriteIndicator.active = false;
                    this._clubLockSpriteNode.active = true;
                }
            }

            // If owned, show the owned visuals
        } else if (this._propInstanceData.isOwned) {
            this._costNode.active = false;
            this._infoTextNode.active = false;
            this._backgroundSprite.color = this._ownedBackgroundColor;
            this._infoLabel.string = this._ownedTextString;
            this._infoLabel.color = this._ownedTextColor;
            this._propSpriteNode.setPosition(0, this._ownedSpriteVerticalOffset, 0);
            // If there is a string defined for owned then change the positioning and show the text
            if (this._ownedTextString !== '') {
                this._infoTextNode.active = true;
                this._propSpriteNode.setPosition(0, this._defaultSpriteVerticalOffset, 0);
            }
            // If the player is a premium user and the prop is exclusive, show the pogo badge visuals
            if (this._propInstanceData.storeData.isUpsell && this._isPremiumUser) {
                this._clubSpriteIndicator.active = true;
                this._clubLockSpriteNode.active = false;
            }
        }

        // If this is the currently active prop show the active visuals
        if (this._currentProp === propData.id || (this._currentProp === 'none' && propData.id === null)) {
            this._costNode.active = false;
            this._infoTextNode.active = false;
            this._backgroundSprite.color = this._activeBackgroundColor;
            this._infoLabel.string = this._activeTextString;
            this._infoLabel.color = this._activeTextColor;
            this._propSpriteNode.setPosition(0, this._defaultSpriteVerticalOffset, 0);
            // If there is a string defined for active then change the positioning and show the text
            if (this._activeTextString !== '') {
                this._infoTextNode.active = true;
                this._propSpriteNode.setPosition(0, this._defaultSpriteVerticalOffset, 0);
            }
        }
    }

    public makeSelected() {
        this._selectedSpriteNode.active = true;
        if (this._propTweenAnim) {
            this._propTweenAnim.stop();
            this._propTweenAnim = null;
        }

        this._propTweenAnim = tween(this.node)
            .to(
                0.3,
                {
                    scale: this._buttonScaleOnActive
                },
                { easing: 'quadOut' }
            )
            .start();
    }

    public deselect() {
        this._selectedSpriteNode.active = false;
        if (this._propTweenAnim) {
            this._propTweenAnim.stop();
            this._propTweenAnim = null;
        }

        this._propTweenAnim = tween(this.node)
            .to(
                0.3,
                {
                    scale: Vec3.ONE
                },
                { easing: 'quadOut' }
            )
            .start();
    }

    public setInteractable(interactable: boolean) {
        this.getComponent(Button).interactable = interactable;
    }

    private _onPropEntryButtonPressedCallback() {
        this.OnPropEntryButtonPressed?.call(this);
    }

    private _showRequirementsPopup() {
        const firstReq = this._propInstanceData.data?.requirements?.[0]?.getType();
        if (firstReq) {
            this._uiOverlayService.showGeneralPopup(PopupType.OK, 'Requirement', firstReq.toString(), null, () => {}, PopupLayout.Vertical);
        }
    }
}
