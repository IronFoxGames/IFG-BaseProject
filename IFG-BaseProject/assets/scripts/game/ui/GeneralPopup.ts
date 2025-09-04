import { _decorator, Component, Button, Node, Sprite, SpriteFrame, Label, resources, director, Director, CCString } from 'cc';
import { UIElementAnimator } from './UIElementAnimator';
import { logger } from '../../logging';
import { Layout } from 'cc';
import { TutorialService } from '../../services/TutorialService';

const { ccclass, property } = _decorator;

export enum PopupType {
    OK = 0,
    OK_Cancel,
    OK_Other
}

export enum PopupLayout {
    Vertical = 0,
    Horizontal
}

export enum PopupResult {
    OK = 0,
    Other,
    Cancel
}

@ccclass('GeneralPopup')
export class GeneralPopup extends Component {
    // Buttons

    @property({ type: Button, visible: true })
    private _okButton: Button;
    @property({ type: Button, visible: true })
    private _cancelButton: Button;
    @property({ type: Button, visible: true })
    private _otherButton: Button;
    @property({ type: Layout, visible: true })
    private _buttonLayout: Layout;

    // Content
    @property({ type: Node, visible: true })
    private _verticalContent: Node;
    @property({ type: Node, visible: true })
    private _horizontalContent: Node;
    @property({ type: Sprite, visible: true })
    private _verticalSprite: Sprite;
    @property({ type: Sprite, visible: true })
    private _horizontalSprite: Sprite;
    @property({ type: Label, visible: true })
    private _verticalText: Label;
    @property({ type: Label, visible: true })
    private _horizontalText: Label;
    @property({ type: Label, visible: true })
    private _titleText: Label;

    @property({ type: Node, visible: true })
    private _scrim: Node;

    @property({ type: CCString, visible: true })
    private _menuId: string = '';

    @property(UIElementAnimator)
    public UIElementAnimators: UIElementAnimator[] = [];

    private _onClosedCallback?: (result: PopupResult) => void;
    private _log = logger.child('GeneralPopup');

    private _layout: PopupLayout;
    private _spritePath: string | null;
    private _started;
    private _shown;
    private _tutorialService: TutorialService;

    public show(
        type: PopupType,
        title: string,
        text: string,
        spritePath: string | null,
        layout: PopupLayout,
        okText: string = 'Okay',
        cancelText: string = 'Cancel',
        otherText: string = 'Other',
        tutorialService: TutorialService,
        menuId: string = '',
        onClosedCallback: (result: PopupResult) => void
    ) {
        if (this.node) {
            this.node.active = false;
        } else {
            this._log.error('Node is not defined!');
        }

        this._layout = layout;
        this._spritePath = spritePath;

        this._menuId = menuId;

        this._tutorialService = tutorialService;

        this._scrim.active = true;
        this._titleText.string = title;

        if (!text) {
            this._verticalText.string = '';
            this._horizontalText.string = '';
        } else {
            this._verticalText.string = text;
            this._horizontalText.string = text;
        }

        const okLabel = this._okButton.getComponentInChildren(Label);
        if (okLabel) {
            okLabel.string = okText;
        }
        const cancelLabel = this._cancelButton.getComponentInChildren(Label);
        if (cancelLabel) {
            cancelLabel.string = cancelText;
        }
        const otherLabel = this._otherButton.getComponentInChildren(Label);
        if (otherLabel) {
            otherLabel.string = otherText;
        }
        this._onClosedCallback = onClosedCallback;

        switch (type) {
            case PopupType.OK:
                this._okButton.node.active = true;
                this._cancelButton.node.active = false;
                break;
            case PopupType.OK_Cancel:
                this._okButton.node.active = true;
                this._cancelButton.node.active = true;
                break;
            case PopupType.OK_Other:
                this._okButton.node.active = true;
                this._cancelButton.node.active = false;
                this._otherButton.node.active = true;
                break;
            default:
                this._log.error('Invalid popup type');
                break;
        }

        this._okButton.node.on(Button.EventType.CLICK, () => this._playOutAnimation(PopupResult.OK), this);
        this._otherButton.node.on(Button.EventType.CLICK, () => this._playOutAnimation(PopupResult.Other), this);
        this._cancelButton.node.on(Button.EventType.CLICK, () => this._playOutAnimation(PopupResult.Cancel), this);

        this.node.active = true;

        this._evaluateLayout();

        this._playInAnimation();

        if (this._menuId && this._menuId !== '') {
            tutorialService.onMenuOpened(this._menuId);
        }
    }

    public hide() {
        if (this.node) {
            this.node.active = false;
        } else {
            this._log.error('Node is not defined!');
        }
    }

    private loadSprite(path: string, destination: Sprite): void {
        resources.load(path, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
            if (err) {
                this._log.error('Failed to load sprite for popup: ', err);
                return;
            }

            if (!spriteFrame) {
                this._log.error(`Failed to load sprite for popup: ${path}`);
                return;
            }
            destination.spriteFrame = spriteFrame;
        });
    }

    private _playInAnimation() {
        this.UIElementAnimators.forEach((animator) => {
            animator.PlayInAnimation();
        });
    }

    private _playOutAnimation(result: PopupResult) {
        this._scrim.active = false;

        const animationPromises = this.UIElementAnimators.map((animator) => {
            return animator.PlayOutAnimation();
        });

        Promise.all(animationPromises).then(() => {
            if (this._onClosedCallback) {
                this._onClosedCallback(result);
            }
            this.node.destroy();
        });
    }

    private _evaluateLayout() {
        switch (this._layout) {
            case PopupLayout.Vertical:
                this._verticalContent.active = true;
                this._horizontalContent.active = false;
                this._horizontalSprite.node.active = false;
                this._verticalText.node.active = true;
                this._horizontalText.node.active = false;
                if (this._spritePath) {
                    this._verticalSprite.node.active = true;
                    this.loadSprite(this._spritePath, this._verticalSprite);
                } else {
                    this._verticalSprite.node.active = false;
                }
                if (this._verticalText.string === '') {
                    this._verticalText.node.active = false;
                } else {
                    this._verticalText.node.active = true;
                }
                break;
            case PopupLayout.Horizontal:
                this._verticalContent.active = false;
                this._horizontalContent.active = true;
                this._verticalSprite.node.active = false;
                this._verticalText.node.active = false;
                this._horizontalText.node.active = true;
                if (this._spritePath) {
                    this._horizontalSprite.node.active = true;
                    this.loadSprite(this._spritePath, this._horizontalSprite);
                } else {
                    this._horizontalSprite.node.active = false;
                }
                if (this._horizontalText.string === '') {
                    this._horizontalText.node.active = false;
                } else {
                    this._horizontalText.node.active = true;
                }
                break;
            default:
                this._log.error('Invalid popup layout');
                break;
        }

        //Forcing a layout update here is necessary because we intend to start an animation right after this, and the animation can interrupt the layout update otherwise...
        this._buttonLayout.updateLayout();
    }
}
