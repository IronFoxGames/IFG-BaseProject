import { Label } from 'cc';
import { Button } from 'cc';
import { RichText } from 'cc';
import { tween } from 'cc';
import { _decorator, Component, Node, Widget, Sprite, Vec3, Vec2, Size, UITransform, v2, math, director } from 'cc';
import { TutorialCursorAlignment, TutorialMessage, TutorialScrimShape, TutorialStepAdvance } from '../services/TutorialService';
import { Tween } from 'cc';
import { SpriteFrame } from 'cc';
import { resources } from 'cc';
import { logger } from '../logging';
import { CCInteger } from 'cc';
import { UIElementAnimator } from '../game/ui/UIElementAnimator';
import { NodeIdentifier } from '../ui/NodeIdentifier';
import { EPSILON } from 'cc';
import { CCFloat } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TutorialScrim')
export default class TutorialScrim extends Component {
    @property(Widget)
    public fullScrim: Widget = null;

    @property(Widget)
    public leftScrim: Widget = null;

    @property(Widget)
    public topScrim: Widget = null;

    @property(Widget)
    public rightScrim: Widget = null;

    @property(Widget)
    public bottomScrim: Widget = null;

    @property(Widget)
    public ellipseScrim: Widget = null;

    @property(Widget)
    public curvedRectangleScrim: Widget = null;

    @property(Node)
    public cursor: Node = null;

    @property(Node)
    public infoContainer: Node = null;

    @property(Label)
    public title: Label = null;

    @property(RichText)
    public text: RichText = null;

    @property(Node)
    public characterContainer: Node = null;

    @property(Sprite)
    public characterSprite: Sprite = null;

    @property(RichText)
    public characterText: RichText = null;

    @property(Sprite)
    public characterImage: Sprite = null;

    @property(Node)
    public characterTapToContinue: Node = null;

    @property(Sprite)
    public image: Sprite = null;

    @property(Node)
    public popupContainer: Node = null;

    @property(Button)
    public okButton: Button = null;

    @property({ type: CCInteger, tooltip: 'The amount of extra space in pixels (based on the design resolution) to leave around the lightbox.' })
    public lightboxPadding: number = 10;

    @property(UIElementAnimator)
    public UIElementAnimators: UIElementAnimator[] = [];

    @property({ type: CCFloat, visible: true })
    private _lightboxDelay = 0;

    @property({
        type: CCInteger,
        tooltip: 'The amount of padding over the left, right, top, bottom that we extend the scrim to ensure everything is covered.'
    })
    public ScrimEdgePadding: number = -100;

    private lightboxTarget: Node = null;
    private canvas: Node = null;
    private initialized: boolean = false;
    private loaded: boolean = false;
    private shape: TutorialScrimShape = TutorialScrimShape.Rectangle;
    private cursorAlignment: TutorialCursorAlignment = TutorialCursorAlignment.None;
    private cursorTween: Tween<Node> = null;
    private _onOkCallback: () => void;
    private _lightboxedControl: Button | null = null;
    private _log = logger.child('TutorialScrim');
    private _idle = false;
    private _sizeOveridden = false;
    private _overrideSize = new Size(0, 0);
    private _tutorialMessage = null;

    private _lightboxEnabled = false;
    private _lastLightboxPosition = new Vec3();

    public onLoad(): void {
        this.canvas = director.getScene().getChildByName('Canvas');
        this.loaded = true;
        if (this.initialized) {
            this.onResize();
        }
    }

    public initialize(tutorialMessage: TutorialMessage, lightboxTarget: Node, onOkButtonCallback?: () => void): void {
        this.characterTapToContinue.active = false;
        this.lightboxTarget = lightboxTarget;
        this._idle = false;
        this._tutorialMessage = tutorialMessage;
        this._lightboxDelay = tutorialMessage.lightboxDelay;

        // Get the nodeidentifier from the node
        const nodeIdentifier = lightboxTarget?.getComponent(NodeIdentifier);

        // Check if there's a size override set
        if (nodeIdentifier?.isSizeOverriden()) {
            this._sizeOveridden = true;
            this._overrideSize = nodeIdentifier.getSize();
        }

        // Tutorial step advance is either interacting with a control or a dialogue ok button
        this._onOkCallback = onOkButtonCallback;
        if (this.lightboxTarget && tutorialMessage.stepAdvance === TutorialStepAdvance.ControlInteraction) {
            var button = lightboxTarget.getComponent(Button);

            if (!button) {
                button = lightboxTarget.getComponentInChildren(Button);
                this._log.info(`Lightbox target ${lightboxTarget.name} does not have a Button component, checking children.`);
            }

            if (button) {
                this._lightboxedControl = button;
                this._lightboxedControl.node.on(Button.EventType.CLICK, this._onClose, this);
            } else {
                this._log.warn('Unsupported lightbox control type for advance; fallback to Ok button');
                tutorialMessage.stepAdvance = TutorialStepAdvance.OkButton;

                if (tutorialMessage.characterTutorial) {
                    this.characterTapToContinue.active = true;
                    this.characterTapToContinue.on(Button.EventType.CLICK, this._onClose, this);
                }
            }
        } else if (tutorialMessage.stepAdvance != TutorialStepAdvance.ControlInteraction && tutorialMessage.characterTutorial) {
            this.characterTapToContinue.active = true;
            this.characterTapToContinue.on(Button.EventType.CLICK, this._onClose, this);
        }

        // Enable the OK button if we aren't stepping via a lightboxed control
        this.okButton.node.active = tutorialMessage.stepAdvance === TutorialStepAdvance.OkButton;
        this.okButton.node.on(Button.EventType.CLICK, this._onClose, this);

        const popupPos = this.popupContainer.position;
        this.popupContainer.position = new Vec3(
            popupPos.x + tutorialMessage.messageOffsetX,
            popupPos.y + tutorialMessage.messageOffsetY,
            popupPos.z
        );

        if (tutorialMessage.message) {
            if (tutorialMessage.characterTutorial) {
                this.characterText.string = tutorialMessage.message;
                this.characterContainer.active = true;
                this.infoContainer.active = false;
            } else {
                this.text.string = tutorialMessage.message;
                this.infoContainer.active = true;
                this.characterContainer.active = false;
            }
            if (this.title && tutorialMessage.title) {
                this.title.string = tutorialMessage.title;
            }
        } else if (this.popupContainer) {
            // No message; we want to supress the dialogue, but only if we don't softlock the user (i.e. it's
            // not an OK button step advance)
            if (tutorialMessage.stepAdvance !== TutorialStepAdvance.OkButton) {
                this.popupContainer.active = false;
            } else {
                // Just clear the message, but keep OK button dialogue
                this.text.string = '';
            }
        }

        if (this.characterSprite && tutorialMessage.characterSpritePath && tutorialMessage.characterTutorial) {
            resources.load(tutorialMessage.characterSpritePath, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
                if (err) {
                    this._log.error('Failed to load sprite for TutorialScrim: ', err);
                    return;
                }

                if (!spriteFrame) {
                    this._log.error(`Failed to load sprite for TutorialScrim: ${tutorialMessage.characterSpritePath}`);
                    return;
                }

                this.characterSprite.spriteFrame = spriteFrame;
            });
        }

        // Start full, the complete resize will resolve the scrim shape and lightbox things accordingling
        this.shape = TutorialScrimShape.Full;
        this._setupScrimShape();
        this.shape = tutorialMessage.lightboxShape;

        if (tutorialMessage.image) {
            resources.load(tutorialMessage.image, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
                if (err) {
                    this._log.error('Failed to load sprite for TutorialScrim: ', err);
                    return;
                }

                if (!spriteFrame) {
                    this._log.error(`Failed to load sprite for TutorialScrim: ${tutorialMessage.image}`);
                    return;
                }

                if (tutorialMessage.characterTutorial) {
                    this.characterImage.spriteFrame = spriteFrame;
                    this.characterImage.node.active = true;
                    this.image.node.active = false;
                } else {
                    this.image.spriteFrame = spriteFrame;
                    this.image.node.active = true;
                    this.characterImage.node.active = false;
                }
            });
        } else {
            if (this.image) {
                this.image.node.active = false;
            }
            if (this.characterImage) {
                this.characterImage.node.active = false;
            }
        }

        if (this.cursorAlignment === TutorialCursorAlignment.None || this.lightboxTarget == null) {
            this.cursor.active = false;
        }

        this.cursorAlignment = tutorialMessage.cursorAlignment;
        this.initialized = true;

        if (this.loaded) {
            this.onResize();
        }
        this._playInAnimation();
    }

    public readyForNextMessage() {
        return this._idle;
    }

    private async _onClose() {
        this.okButton.node.off(Button.EventType.CLICK, this._onClose, this);
        this.canvas.off(Node.EventType.TOUCH_END, this._onClose, this);
        if (this._lightboxedControl instanceof Button) {
            this._lightboxedControl.node.off(Button.EventType.CLICK, this._onClose, this);
        }

        // Turn off cursor, go full scrim and play out animation.
        this.cursor.active = false;
        this.leftScrim.node.active = false;
        this.rightScrim.node.active = false;
        this.topScrim.node.active = false;
        this.bottomScrim.node.active = false;
        this.ellipseScrim.node.active = false;
        this.fullScrim.node.active = true;
        this.fullScrim.getComponent(Sprite).enabled = true;
        this.curvedRectangleScrim.node.active = false;
        await this._playOutAnimation();

        this._idle = true;
        this._sizeOveridden = false;

        if (this._onOkCallback) {
            this._onOkCallback();
        }
    }

    public update() {
        if (!this._lightboxEnabled) {
            return;
        }
        this.onCompleteResize();
    }

    private onResize(): void {
        // In order to make sure that the positions are correct, we trigger a reposition immediately,
        // and then schedule another one - this ensure that if the target ends up shifting due to being in a widget,
        // the TutorialScrim will reposition to be correct.  The initial position check is to prevent a flash of a full-screen non-targeted lightbox.
        if (this._lightboxDelay > EPSILON) {
            this.scheduleOnce(() => {
                this._setupScrimShape();
                this.onCompleteResize();
            }, this._lightboxDelay);
        } else {
            this._setupScrimShape();
            this.onCompleteResize();
            this.scheduleOnce(this.onCompleteResize.bind(this), 0.01);
        }
    }

    public static getWorldSpaceBottomLeftPosition(node: Node, position: Vec3): Vec2 {
        const uiTrans = node.getComponent(UITransform)!;
        const worldSpace: Vec3 = uiTrans.convertToWorldSpaceAR(position);
        const anchor = uiTrans.anchorPoint;
        const size: Size = uiTrans.contentSize;
        return v2(worldSpace.x - anchor.x * size.width, worldSpace.y - anchor.y * size.height);
    }

    private onCompleteResize(): void {
        // Soft-lock safety check; if there's a lightbox target, but it's not enabled and we're asking the user to
        // tap on it, we should probably turn it on.
        if (
            this.lightboxTarget &&
            this.lightboxTarget.active === false &&
            this._tutorialMessage.stepAdvance === TutorialStepAdvance.ControlInteraction
        ) {
            this.lightboxTarget.active = true;
        }

        if (!this.lightboxTarget || this.shape == TutorialScrimShape.Full) {
            return;
        }

        const targetTransform = this.lightboxTarget.getComponent(UITransform);

        // First calculate the world-space locations of the target & canvas (to properly position the lightbox/text regardless of the current resolution)
        const targetAnchor = targetTransform.anchorPoint;
        const canvasBottomLeft: Vec2 = TutorialScrim.getWorldSpaceBottomLeftPosition(this.canvas, Vec3.ZERO);
        const canvasSize: Size = this.canvas.getComponent(UITransform).contentSize;
        const targetScale: Vec3 = this.lightboxTarget.getScale();
        var targetSize: Size = new Size(0, 0);

        // If the size is overriden, use the overridden size, otherwise use the target's size
        if (this._sizeOveridden) {
            targetSize = this._overrideSize.clone();
        } else {
            targetSize = targetTransform.contentSize.clone();
        }

        targetSize.width *= targetScale.x;
        targetSize.height *= targetScale.y;
        const targetAnchorPos: Vec3 = targetTransform.convertToWorldSpaceAR(Vec3.ZERO);
        targetAnchorPos.x = Math.round(targetAnchorPos.x);
        targetAnchorPos.y = Math.round(targetAnchorPos.y);
        canvasBottomLeft.x = Math.round(canvasBottomLeft.x);
        let targetBottomLeft: Vec2 = new Vec2(
            targetAnchorPos.x - Math.round(targetSize.width * targetAnchor.x),
            targetAnchorPos.y - Math.round(targetSize.height * targetAnchor.y)
        );


        const distance = Vec3.distance(targetAnchorPos, this._lastLightboxPosition);
        if (distance < EPSILON && !this._lightboxEnabled) {
            // No change in position; don't recalc
            return;
        }
        this._lastLightboxPosition = targetAnchorPos;

        // Next, get the canvas-space edges of the target.
        const leftPos: number = targetBottomLeft.x - canvasBottomLeft.x;
        const bottomPos: number = targetBottomLeft.y - canvasBottomLeft.y;
        const rightPos: number = leftPos + Math.round(targetSize.width);
        const topPos: number = bottomPos + Math.round(targetSize.height);

        let framePaddingX = this.lightboxPadding;
        let framePaddingY = this.lightboxPadding;

        if (this.shape == TutorialScrimShape.Ellipse) {
            // Compute the ideal circle size (hypotenuse of the UI element)
            const ellipseDiameter = Math.sqrt(targetSize.width * targetSize.width + targetSize.height * targetSize.height);
            const ellipseRadius = ellipseDiameter / 2;

            // Expand the frame outward so it doesn't overlap the circle
            framePaddingX = ellipseRadius - targetSize.width / 2;
            framePaddingY = ellipseRadius - targetSize.height / 2;
        }

        if (this.shape == TutorialScrimShape.CurvedRectangle) {
            // Compute the ideal rectangle size based on the target size
            const rectWidth = targetSize.width + framePaddingX * 2;
            const rectHeight = targetSize.height + framePaddingY * 2;

            // Ensure the frame padding is applied to avoid negative dimensions
            framePaddingX = Math.max(0, framePaddingX);
            framePaddingY = Math.max(0, framePaddingY);

            // Set the scrim dimensions
            this.curvedRectangleScrim.left = leftPos - framePaddingX;
            this.curvedRectangleScrim.right = canvasSize.width - (rightPos + framePaddingX);
            this.curvedRectangleScrim.top = canvasSize.height - (topPos + framePaddingY);
            this.curvedRectangleScrim.bottom = bottomPos - framePaddingY;

            // Ensure positive width and height
            if (rectWidth <= 0 || rectHeight <= 0) {
                this._log.error('Curved rectangle scrim has invalid dimensions:', { rectWidth, rectHeight });
            }
        }

        this.leftScrim.top = this.ScrimEdgePadding;
        this.leftScrim.left = this.ScrimEdgePadding;
        this.leftScrim.right = canvasSize.width - (leftPos - framePaddingX);
        this.leftScrim.bottom = this.ScrimEdgePadding;
        this.rightScrim.top = this.ScrimEdgePadding;
        this.rightScrim.left = rightPos + framePaddingX;
        this.rightScrim.right = this.ScrimEdgePadding;
        this.rightScrim.bottom = this.ScrimEdgePadding;
        this.topScrim.bottom = topPos + framePaddingY;
        this.topScrim.left = leftPos - framePaddingX;
        this.topScrim.right = canvasSize.width - rightPos - framePaddingX;
        this.topScrim.top = this.ScrimEdgePadding;
        this.bottomScrim.top = canvasSize.height - (bottomPos - framePaddingY);
        this.bottomScrim.left = leftPos - framePaddingX;
        this.bottomScrim.right = canvasSize.width - rightPos - framePaddingX;
        this.bottomScrim.bottom = this.ScrimEdgePadding;
        this.ellipseScrim.bottom = this.topScrim.bottom;
        this.ellipseScrim.top = this.bottomScrim.top;
        this.ellipseScrim.right = this.topScrim.right;
        this.ellipseScrim.left = this.topScrim.left;

        this.leftScrim.updateAlignment();
        this.rightScrim.updateAlignment();
        this.topScrim.updateAlignment();
        this.bottomScrim.updateAlignment();
        this.ellipseScrim.updateAlignment();
        this.ellipseScrim.getComponentInChildren(Widget).updateAlignment();
        this.curvedRectangleScrim.updateAlignment();
        this.curvedRectangleScrim.getComponentInChildren(Widget).updateAlignment();

        this._positionCursor(leftPos, bottomPos, rightPos, topPos, targetSize, canvasSize);
        if (!this._lightboxEnabled) {
            this._animateCursor();
        }
        this._lightboxEnabled = true;
    }

    private _positionCursor(leftPos: number, bottomPos: number, rightPos: number, topPos: number, targetSize: Size, canvasSize: Size) {
        if (this.cursorAlignment === TutorialCursorAlignment.None || this.lightboxTarget == null) {
            return;
        }

        this.cursor.active = true;
        let xPos: number = 0;
        let yPos: number = 0;
        let rotZ: number = 0;
        const uiTrans = this.cursor.getComponent(UITransform)!;

        const cursorOffset: Vec2 = v2(uiTrans.width / 2, uiTrans.height / 2);
        const sizeOffset: Vec2 = v2(targetSize.width / 2, targetSize.height / 2);
        switch (this.cursorAlignment) {
            case TutorialCursorAlignment.Left:
                xPos = leftPos - cursorOffset.x;
                yPos = bottomPos + sizeOffset.y;
                rotZ = 270;
                break;
            case TutorialCursorAlignment.Right:
                xPos = rightPos + cursorOffset.x;
                yPos = bottomPos + sizeOffset.y;
                rotZ = 90;
                break;
            case TutorialCursorAlignment.Top:
                xPos = leftPos + sizeOffset.x;
                yPos = topPos + sizeOffset.y + cursorOffset.y;
                rotZ = 180;
                break;
            case TutorialCursorAlignment.Bottom:
                xPos = leftPos + sizeOffset.x;
                yPos = bottomPos - (sizeOffset.y + cursorOffset.y);
                rotZ = 0;
                break;
        }

        xPos = math.clamp(xPos, cursorOffset.x, canvasSize.width - cursorOffset.x);
        yPos = math.clamp(yPos, cursorOffset.y, canvasSize.height - cursorOffset.y);
        this.cursor.setPosition(xPos, yPos);

        this.cursor.setRotationFromEuler(new Vec3(0, 0, rotZ));
    }

    private _animateCursor() {
        const cursorSprite = this.cursor.getComponentInChildren(Sprite);
        cursorSprite.node.setPosition(0, 0, 0);

        if (this.cursorTween) {
            this.cursorTween.stop();
            this.cursorTween = null;
        }
        this.cursorTween = tween(cursorSprite.node)
            .repeatForever(
                tween()
                    .to(1, { position: new Vec3(0, -100, 0) }, { easing: 'sineInOut' }) // Move down
                    .to(1, { position: new Vec3(0, 0, 0) }, { easing: 'sineInOut' }) // Move back up
            )
            .start();
    }

    private _setupScrimShape() {
        switch (this.shape) {
            case TutorialScrimShape.Full:
                this.leftScrim.node.active = false;
                this.rightScrim.node.active = false;
                this.topScrim.node.active = false;
                this.bottomScrim.node.active = false;
                this.ellipseScrim.node.active = false;
                this.fullScrim.node.active = true;
                this.curvedRectangleScrim.node.active = false;
                break;
            case TutorialScrimShape.Rectangle:
                this.leftScrim.node.active = true;
                this.rightScrim.node.active = true;
                this.topScrim.node.active = true;
                this.bottomScrim.node.active = true;
                this.ellipseScrim.node.active = false;
                this.curvedRectangleScrim.node.active = false;

                // Only enable the full screen scrim if we're blocking touches; but disable sprite so we don't over-darken the lightbox
                this.fullScrim.node.active = this._tutorialMessage.stepAdvance === TutorialStepAdvance.OkButton || false;
                this.fullScrim.getComponent(Sprite).enabled = false;
                break;
            case TutorialScrimShape.Ellipse:
                this.leftScrim.node.active = true;
                this.rightScrim.node.active = true;
                this.topScrim.node.active = true;
                this.bottomScrim.node.active = true;
                this.ellipseScrim.node.active = true;
                this.curvedRectangleScrim.node.active = false;

                // Only enable the full screen scrim if we're blocking touches; but disable sprite so we don't over-darken the lightbox
                this.fullScrim.node.active = this._tutorialMessage.stepAdvance === TutorialStepAdvance.OkButton || false;
                this.fullScrim.getComponent(Sprite).enabled = false;
                break;

            case TutorialScrimShape.CurvedRectangle:
                this.leftScrim.node.active = true;
                this.rightScrim.node.active = true;
                this.topScrim.node.active = true;
                this.bottomScrim.node.active = true;
                this.ellipseScrim.node.active = false;
                this.curvedRectangleScrim.node.active = true;

                // Only enable the full screen scrim if we're blocking touches; but disable sprite so we don't over-darken the lightbox
                this.fullScrim.node.active = this._tutorialMessage.stepAdvance === TutorialStepAdvance.OkButton || false;
                this.fullScrim.getComponent(Sprite).enabled = false;
                break;
        }
    }

    private _playInAnimation() {
        this.UIElementAnimators.forEach((animator) => {
            animator.PlayInAnimation();
        });
    }

    private async _playOutAnimation() {
        const animationPromises = this.UIElementAnimators.map((animator) => {
            return animator.PlayOutAnimation();
        });

        await Promise.all(animationPromises);
    }
}
