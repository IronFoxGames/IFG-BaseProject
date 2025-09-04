import { CCString } from 'cc';
import { log } from 'cc';
import { BitMask } from 'cc';
import { SpriteFrame } from 'cc';
import { Animation } from 'cc';
import { AnimationClip } from 'cc';
import { Sprite } from 'cc';
import { lerp } from 'cc';
import { UIRenderer } from 'cc';
import { geometry } from 'cc';
import { Vec3 } from 'cc';
import { Color } from 'cc';
import { __private } from 'cc';
import { Button } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { SoundManager } from '../audio/SoundManager';
const { ccclass, property } = _decorator;

enum TransitionType {
    Color = 1 << 0,
    Sprite = 1 << 1,
    Scale = 1 << 2,
    Offset = 1 << 3,
    ContentOffset = 1 << 4,
    AnimationClip = 1 << 5
}

@ccclass('IFGButton')
export class IFGButton extends Button {
    // Hide the base Button's transition property
    @property({ visible: false, override: true })
    get transition(): __private._cocos_ui_button__Transition {
        return super.transition;
    }

    @property({
        type: BitMask(TransitionType),
        tooltip: 'Which transitions to use when the button is hovered over',
        visible: true
    })
    protected _hoverTransition: TransitionType;

    @property({
        type: BitMask(TransitionType),
        tooltip: 'Which transitions to use when the button is pressed',
        visible: true
    })
    protected _pressedTransition: TransitionType;

    @property({
        visible: true,
        tooltip: 'Should this button behave as a toggle and change to an alternate look when pressed while remaining active?'
    })
    protected _isToggleButton: boolean = false;

    @property({
        type: BitMask(TransitionType),
        tooltip: 'Which transitions to use when the button is toggled',
        visible: function (this: IFGButton) {
            return this.isToggleButton();
        }
    })
    protected _toggledTransition: TransitionType;

    @property({
        visible: function (this: IFGButton) {
            return this._hoverTransition != 0 << 0;
        }
    })
    protected _transitionTimeHover: number = 0.2;

    @property({
        visible: function (this: IFGButton) {
            return this._pressedTransition != 0 << 0;
        }
    })
    protected _transitionTimePressed: number = 0.2;

    @property({
        visible: function (this: IFGButton) {
            return this.isToggleButton() && this._toggledTransition != 0 << 0;
        }
    })
    protected _transitionTimeToggled: number = 0.2;

    @property({
        type: Color,
        visible: function (this: IFGButton) {
            return this.hasEitherTransition(TransitionType.Color);
        }
    })
    protected _colorIdle: Color = new Color('FFFFFF');

    @property({
        type: Color,
        visible: function (this: IFGButton) {
            return this.hasHoverTransition(TransitionType.Color);
        }
    })
    protected _colorHover: Color = new Color('EEEEEE');

    @property({
        type: Color,
        visible: function (this: IFGButton) {
            return this.hasPressedTransition(TransitionType.Color);
        }
    })
    protected _colorPressed: Color = new Color('D3D3D3');

    @property({
        type: Color,
        visible: function (this: IFGButton) {
            return this.isToggleButton() && this.hasToggleTransition(TransitionType.Color);
        }
    })
    protected _colorToggled: Color = new Color('FFFFFF');

    @property({
        type: SpriteFrame,
        visible: function (this: IFGButton) {
            return this.hasEitherTransition(TransitionType.Sprite);
        }
    })
    protected _spriteIdle: SpriteFrame = new SpriteFrame();

    @property({
        type: SpriteFrame,
        visible: function (this: IFGButton) {
            return this.hasHoverTransition(TransitionType.Sprite);
        }
    })
    protected _spriteHover: SpriteFrame = new SpriteFrame();

    @property({
        type: SpriteFrame,
        visible: function (this: IFGButton) {
            return this.hasPressedTransition(TransitionType.Sprite);
        }
    })
    protected _spritePressed: SpriteFrame = new SpriteFrame();

    @property({
        type: SpriteFrame,
        visible: function (this: IFGButton) {
            return this.isToggleButton() && this.hasToggleTransition(TransitionType.Sprite);
        }
    })
    protected _spriteToggled: SpriteFrame = new SpriteFrame();

    @property({
        type: SpriteFrame,
        visible: function (this: IFGButton) {
            return this.isToggleButton() && this.hasToggleTransition(TransitionType.Sprite);
        }
    })
    protected _spriteToggleHover: SpriteFrame = new SpriteFrame();

    @property({
        type: SpriteFrame,
        visible: function (this: IFGButton) {
            return this.isToggleButton() && this.hasPressedTransition(TransitionType.Sprite);
        }
    })
    protected _spriteTogglePressed: SpriteFrame = new SpriteFrame();

    @property({
        type: SpriteFrame,
        visible: function (this: IFGButton) {
            return this.hasEitherTransition(TransitionType.Sprite);
        }
    })
    protected _spriteDisabled: SpriteFrame = new SpriteFrame();

    @property({
        type: Vec3,
        visible: function (this: IFGButton) {
            return this.hasHoverTransition(TransitionType.Scale);
        }
    })
    protected _scaleHover: Vec3 = new Vec3(1, 1, 1);

    @property({
        visible: function (this: IFGButton) {
            return this.hasHoverTransition(TransitionType.Scale);
        }
    })
    @property(geometry.AnimationCurve)
    protected _scaleHoverIn: geometry.AnimationCurve = new geometry.AnimationCurve();

    @property({
        visible: function (this: IFGButton) {
            return this.hasHoverTransition(TransitionType.Scale);
        }
    })
    @property(geometry.AnimationCurve)
    protected _scaleHoverOut: geometry.AnimationCurve = new geometry.AnimationCurve();

    @property({
        type: Vec3,
        visible: function (this: IFGButton) {
            return this.hasPressedTransition(TransitionType.Scale);
        }
    })
    protected _scalePressed: Vec3 = new Vec3(1, 1, 1);

    @property({
        visible: function (this: IFGButton) {
            return this.hasPressedTransition(TransitionType.Scale);
        }
    })
    @property(geometry.AnimationCurve)
    protected _scalePressedIn: geometry.AnimationCurve = new geometry.AnimationCurve();

    @property({
        visible: function (this: IFGButton) {
            return this.hasPressedTransition(TransitionType.Scale);
        }
    })
    @property(geometry.AnimationCurve)
    protected _scalePressedOut: geometry.AnimationCurve = new geometry.AnimationCurve();

    @property({
        type: Vec3,
        visible: function (this: IFGButton) {
            return this.isToggleButton() && this.hasToggleTransition(TransitionType.Scale);
        }
    })
    protected _scaleToggled: Vec3 = new Vec3(1, 1, 1);

    @property({
        visible: function (this: IFGButton) {
            return this.isToggleButton() && this.hasToggleTransition(TransitionType.Scale);
        }
    })
    @property(geometry.AnimationCurve)
    protected _scaleToggledIn: geometry.AnimationCurve = new geometry.AnimationCurve();

    @property({
        visible: function (this: IFGButton) {
            return this.isToggleButton() && this.hasToggleTransition(TransitionType.Scale);
        }
    })
    @property(geometry.AnimationCurve)
    protected _scaleToggledOut: geometry.AnimationCurve = new geometry.AnimationCurve();

    @property({
        type: Vec3,
        visible: function (this: IFGButton) {
            return this.hasHoverTransition(TransitionType.Offset);
        }
    })
    protected _offsetHover: Vec3 = new Vec3();

    @property({
        type: Vec3,
        visible: function (this: IFGButton) {
            return this.hasPressedTransition(TransitionType.Offset);
        }
    })
    protected _offsetPressed: Vec3 = new Vec3();

    @property({
        type: Vec3,
        visible: function (this: IFGButton) {
            return this.isToggleButton() && this.hasToggleTransition(TransitionType.Offset);
        }
    })
    protected _offsetToggled: Vec3 = new Vec3();

    @property([Node])
    @property({
        visible: function (this: IFGButton) {
            return this.hasEitherTransition(TransitionType.ContentOffset);
        }
    })
    protected _contentTargets: Node[] = [];

    @property({
        type: Vec3,
        visible: function (this: IFGButton) {
            return this.hasHoverTransition(TransitionType.ContentOffset);
        }
    })
    protected _contentOffsetHover: Vec3 = new Vec3();

    @property({
        type: Vec3,
        visible: function (this: IFGButton) {
            return this.hasPressedTransition(TransitionType.ContentOffset);
        }
    })
    protected _contentOffsetPressed: Vec3 = new Vec3();

    @property({
        type: Vec3,
        visible: function (this: IFGButton) {
            return this.isToggleButton() && this.hasToggleTransition(TransitionType.ContentOffset);
        }
    })
    protected _contentOffsetToggled: Vec3 = new Vec3();

    @property(Animation)
    @property({
        visible: function (this: IFGButton) {
            return this.hasEitherTransition(TransitionType.AnimationClip);
        }
    })
    protected _animationComponent: Animation;

    @property({
        type: AnimationClip,
        visible: function (this: IFGButton) {
            return this.hasHoverTransition(TransitionType.AnimationClip);
        },
        tooltip: 'Animation to play when the button is hovered over. Note, all animation names must be unique per state.'
    })
    protected _animationHover: AnimationClip;

    @property({
        type: AnimationClip,
        visible: function (this: IFGButton) {
            return this.hasPressedTransition(TransitionType.AnimationClip);
        },
        tooltip: 'Animation to play when the button is pressed. Note, all animation names must be unique per state.'
    })
    protected _animationPressed: AnimationClip;

    @property({
        type: Color,
        visible: function (this: IFGButton) {
            return this.hasEitherTransition(TransitionType.Color);
        }
    })
    protected _colorDisabled: Color = new Color('C7C7C7');

    @property({
        type: AnimationClip,
        visible: function (this: IFGButton) {
            return this.hasEitherTransition(TransitionType.AnimationClip);
        },
        tooltip: 'Animation to play when the button is enabled. Note, all animation names must be unique per state.'
    })
    protected _animationIdle: AnimationClip;

    @property({
        type: AnimationClip,
        visible: function (this: IFGButton) {
            return this.isToggleButton() && this.hasToggleTransition(TransitionType.AnimationClip);
        },
        tooltip: 'Animation to play when the button is toggled. Note, all animation names must be unique per state.'
    })
    protected _animationToggled: AnimationClip;

    @property({
        type: AnimationClip,
        visible: function (this: IFGButton) {
            return this.hasEitherTransition(TransitionType.AnimationClip);
        },
        tooltip: 'Animation to play when the button is disabled. Note, all animation names must be unique per state.'
    })
    protected _animationDisabled: AnimationClip;

    @property({
        visible: true,
        tooltip: 'The name of the sound effect to play if the button is pressed. \n Must exist in the Audio list with this name.'
    })
    protected _soundName: string = '';

    protected _previousState: string;

    protected _transitionTimer = 0;
    protected _transitionTime = 0;

    protected _fromColor: Color;
    protected _toColor: Color;
    protected _tempColor = new Color();

    private _sprite: Sprite | null = null;

    private _scaleIdle: Vec3 | null = null;
    protected _fromScale: Vec3;
    protected _toScale: Vec3;
    protected _tempScale = new Vec3();
    protected _tempToggledScale = new Vec3();

    private _offsetIdle: Vec3 | null = null;
    protected _fromOffset = new Vec3();
    protected _toOffset = new Vec3();
    protected _tempOffset = new Vec3();

    private _contentOffsets: Vec3[] = [];
    protected _fromContentOffset = new Vec3();
    protected _toContentOffset = new Vec3();
    protected _contentOffset = new Vec3();

    private _defaultSprite: SpriteFrame | null = null;
    private _toggleState = false;
    private _scaleToggledDelta = new Vec3();

    start() {
        // TODO: CSB: not sure for some button prefabs this is failing, but working for others. The button seems to work OK otherwise.
        try {
            super.start();
            super.transition = __private._cocos_ui_button__Transition.NONE;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            /* empty */
        }

        this._defaultSprite = this.node.getComponent(Sprite)?.spriteFrame;

        this._previousState = this._getButtonState();
    }

    update(deltaTime: number) {
        super.update(deltaTime);

        if (this._transitionTimer > 0) {
            this._transitionTimer -= deltaTime;
            if (this._transitionTimer < 0) this._transitionTimer = 0;

            const t = 1 - this._transitionTimer / this._transitionTime;

            if (this.hasEitherTransition(TransitionType.Color)) {
                const renderComp = this.target._uiProps.uiComp as UIRenderer; // copied from base button code
                if (renderComp) {
                    Color.lerp(this._tempColor, this._fromColor, this._toColor, t);
                    renderComp.color = this._tempColor;
                }
            }

            if (this.hasEitherTransition(TransitionType.Scale)) {
                let curveT;

                if (this.isToggleButton && this._toggleState) {
                    curveT = this._scaleToggledIn.evaluate(t);
                } else if (this.isToggleButton && !this._toggleState) {
                    curveT = this._scaleToggledOut.evaluate(1 - t);
                } else if (this._getButtonState() == 'pressed') {
                    curveT = this._scalePressedIn.evaluate(t);
                } else if (this._getButtonState() == 'hover') {
                    curveT = this._scaleHoverIn.evaluate(t);
                } else if (this._previousState == 'pressed') {
                    curveT = this._scalePressedOut.evaluate(1 - t);
                } else {
                    curveT = this._scaleHoverOut.evaluate(1 - t);
                }

                this.target.getScale(this._tempScale);
                this._tempScale.x = this._fromScale.x + (this._toScale.x - this._fromScale.x) * curveT;
                this._tempScale.y = this._fromScale.y + (this._toScale.y - this._fromScale.y) * curveT;
                this.target.setScale(this._tempScale);
            }

            if (this.hasEitherTransition(TransitionType.Offset)) {
                this.target.getPosition(this._tempOffset);
                this._tempOffset.x = lerp(this._fromOffset.x, this._toOffset.x, t);
                this._tempOffset.y = lerp(this._fromOffset.y, this._toOffset.y, t);
                this.target.setPosition(this._tempOffset);
            }

            if (this.hasEitherTransition(TransitionType.ContentOffset)) {
                this._contentOffset.x = lerp(this._fromContentOffset.x, this._toContentOffset.x, t);
                this._contentOffset.y = lerp(this._fromContentOffset.y, this._toContentOffset.y, t);

                for (let i = 0; i < this._contentTargets.length; ++i) {
                    this._contentTargets[i].getPosition(this._tempOffset);
                    this._tempOffset.x = this._contentOffsets[i].x + this._contentOffset.x;
                    this._tempOffset.y = this._contentOffsets[i].y + this._contentOffset.y;
                    this._contentTargets[i].setPosition(this._tempOffset);
                }
            }
        }
    }

    _updateState() {
        super._updateState();

        const renderComp = this.target?.getComponent(UIRenderer);
        if (!renderComp) {
            return;
        }

        if (this._previousState != 'hover' && this._previousState != 'pressed' && this._transitionTimer <= 0 && this._offsetIdle) {
            this._offsetIdle.x = this.target.position.x;
            this._offsetIdle.y = this.target.position.y;
        }

        if (this.hasEitherTransition(TransitionType.AnimationClip)) {
            this._animationComponent.stop();
        }

        if (this.hasToggleTransition(TransitionType.AnimationClip)) {
            this._animationComponent.stop();
        }

        if (this._isToggleButton) {
            // If the button is toggled, set items to the toggled state
            if (this._toggleState) {
                if (this.hasToggleTransition(TransitionType.Color)) {
                    this._fromColor = renderComp.color.clone();
                    this._toColor = this._colorToggled;
                }

                if (this.hasToggleTransition(TransitionType.Sprite)) {
                    if (this._sprite && this._spriteToggled) {
                        this._sprite.spriteFrame = this._spriteToggled;
                    }
                }

                if (this.hasToggleTransition(TransitionType.Scale)) {
                    this._fromScale = this.target.scale;
                    this._toScale = this._scaleToggled;
                }

                if (this.hasToggleTransition(TransitionType.Offset)) {
                    this._fromOffset.x = this.target.position.x;
                    this._fromOffset.y = this.target.position.y;
                    this._toOffset.x = this._offsetIdle.x + this._offsetPressed.x;
                    this._toOffset.y = this._offsetIdle.y + this._offsetPressed.y;
                }

                if (this.hasToggleTransition(TransitionType.ContentOffset)) {
                    this._fromContentOffset.x = this._contentOffset.x;
                    this._fromContentOffset.y = this._contentOffset.y;
                    this._toContentOffset.x = 0;
                    this._toContentOffset.y = 0;
                }

                if (this.hasToggleTransition(TransitionType.AnimationClip) && this._animationToggled) {
                    this._animationComponent.play(this._animationToggled.name);
                }
                // If the button is not toggled, set items back to the idle state
            } else {
                //Stop any animation first, in case there's no animationIdle, then at least other items will be set to idle state
                if (this.hasToggleTransition(TransitionType.AnimationClip) && this._animationIdle) {
                    this._animationComponent.play(this._animationIdle.name);
                } else if (this.hasToggleTransition(TransitionType.AnimationClip) && !this._animationIdle) {
                    const animationState = this._animationComponent.getState(this._animationToggled.name);
                    if (animationState) {
                        animationState.time = 0;
                    }
                    this._animationComponent.stop();
                }

                if (this.hasToggleTransition(TransitionType.Color)) {
                    this._fromColor = renderComp.color.clone();
                    this._toColor = this._colorIdle;
                }

                if (this.hasToggleTransition(TransitionType.Sprite)) {
                    if (this._sprite && this._defaultSprite) {
                        this._sprite.spriteFrame = this._defaultSprite;
                    }
                }

                if (this.hasToggleTransition(TransitionType.Scale)) {
                    this._fromScale = this.target.scale;
                    this._toScale = this._scaleIdle;
                }

                if (this.hasToggleTransition(TransitionType.Offset)) {
                    this._fromOffset.x = this.target.position.x;
                    this._fromOffset.y = this.target.position.y;
                    this._toOffset.x = this._offsetIdle.x;
                    this._toOffset.y = this._offsetIdle.y;
                }

                if (this.hasToggleTransition(TransitionType.ContentOffset)) {
                    this._fromContentOffset.x = this._contentOffset.x;
                    this._fromContentOffset.y = this._contentOffset.y;
                    this._toContentOffset.x = 0;
                    this._toContentOffset.y = 0;
                }
            }
        }

        if (!this.interactable) {
            if (this.hasEitherTransition(TransitionType.Color)) {
                renderComp.color = this._colorDisabled;
            }

            if (this.hasEitherTransition(TransitionType.Sprite)) {
                if (this._sprite && this._spriteDisabled) {
                    this._sprite.spriteFrame = this._spriteDisabled;
                }
            }

            if (this.hasEitherTransition(TransitionType.Scale)) {
                // If we're in the toggle state then add the toggle scale to the other scales to ensure scaling transitions still work
                if (this.isToggleButton()) {
                    if (this._toggleState) {
                        this.target.getScale(this._tempScale);
                        this._tempScale.x = this._scaleIdle.x + this._scaleToggled.x;
                        this._tempScale.y = this._scaleIdle.y + this._scaleToggled.y;
                        this.target.setScale(this._tempScale);
                    } else {
                        this.target.getScale(this._tempScale);
                        this._tempScale.x = this._scaleIdle.x;
                        this._tempScale.y = this._scaleIdle.y;
                        this.target.setScale(this._tempScale);
                    }
                } else {
                    this.target.getScale(this._tempScale);
                    this._tempScale.x = this._scaleIdle.x;
                    this._tempScale.y = this._scaleIdle.y;
                    this.target.setScale(this._tempScale);
                }
            }

            if (this.hasEitherTransition(TransitionType.Offset)) {
                this.target.getPosition(this._tempOffset);
                this._tempOffset.x = this._offsetIdle.x;
                this._tempOffset.y = this._offsetIdle.y;
                this.target.setPosition(this._tempOffset);
            }

            if (this.hasEitherTransition(TransitionType.ContentOffset)) {
                this._contentOffset.x = 0;
                this._contentOffset.y = 0;

                for (let i = 0; i < this._contentTargets.length; ++i) {
                    this._contentTargets[i].getPosition(this._tempOffset);
                    this._tempOffset.x = this._contentOffsets[i].x;
                    this._tempOffset.y = this._contentOffsets[i].y;
                    this._contentTargets[i].setPosition(this._tempOffset);
                }
            }

            if (this.hasEitherTransition(TransitionType.AnimationClip) && this._animationDisabled) {
                this._animationComponent.play(this._animationDisabled.name);
            }
        } else {
            if (this._getButtonState() == 'normal') {
                // Idle state
                if (this._previousState == 'hover') {
                    this._transitionTime = this._transitionTimeHover;
                } else {
                    this._transitionTime = this._transitionTimePressed;
                }
                this._transitionTimer = this._transitionTime;

                if (this.hasEitherTransition(TransitionType.Color)) {
                    this._fromColor = renderComp.color.clone();
                    this._toColor = this._colorIdle;
                }

                if (this.hasEitherTransition(TransitionType.Sprite)) {
                    if (this.isToggleButton() && this._toggleState) {
                        if (this._sprite && this._spriteToggled) {
                            this._sprite.spriteFrame = this._spriteToggled;
                        }
                    } else {
                        if (this._sprite && this._spriteIdle) {
                            this._sprite.spriteFrame = this._spriteIdle;
                        }
                    }
                }

                if (this.hasEitherTransition(TransitionType.Scale)) {
                    if (this.isToggleButton && this._toggleState) {
                        this._fromScale = this.target.scale;
                        this._toScale = this._scaleToggled;
                    } else {
                        this._fromScale = this.target.scale;
                        this._toScale = this._scaleIdle;
                    }
                }

                if (this.hasEitherTransition(TransitionType.Offset)) {
                    this._fromOffset.x = this.target.position.x;
                    this._fromOffset.y = this.target.position.y;
                    this._toOffset.x = this._offsetIdle.x;
                    this._toOffset.y = this._offsetIdle.y;
                }

                if (this.hasEitherTransition(TransitionType.ContentOffset)) {
                    this._fromContentOffset.x = this._contentOffset.x;
                    this._fromContentOffset.y = this._contentOffset.y;
                    this._toContentOffset.x = 0;
                    this._toContentOffset.y = 0;
                }

                if (this.hasEitherTransition(TransitionType.AnimationClip) && this._animationIdle) {
                    this._animationComponent.play(this._animationIdle.name);
                }
            } else if (this._getButtonState() == 'hover') {
                // Hover state

                this._transitionTime = this._transitionTimeHover;
                this._transitionTimer = this._transitionTime;

                if (this.hasHoverTransition(TransitionType.Scale)) {
                    if (this.isToggleButton() && this._toggleState) {
                        this._fromScale = this._scaleToggled;
                        this._tempToggledScale.x = this._scaleToggled.x * this._scaleHover.x;
                        this._tempToggledScale.y = this._scaleToggled.y * this._scaleHover.y;
                        this._tempToggledScale.z = this._scaleToggled.z * this._scaleHover.z;
                        this._toScale = this._tempToggledScale;
                    } else {
                        this._fromScale = this._scaleIdle;
                        this._toScale = this._scaleHover;
                    }
                }

                if (this.hasEitherTransition(TransitionType.Color)) {
                    this._fromColor = renderComp.color.clone();
                    this._toColor = this._colorHover;
                }

                if (this.isToggleButton() && this._toggleState) {
                    if (this.hasHoverTransition(TransitionType.Sprite)) {
                        if (this._sprite && this._spriteToggleHover) {
                            this._sprite.spriteFrame = this._spriteToggleHover;
                        }
                    } else if (this.hasPressedTransition(TransitionType.Sprite)) {
                        if (this._sprite && this._spriteToggled) {
                            this._sprite.spriteFrame = this._spriteToggleHover;
                        }
                    }
                } else {
                    if (this.hasHoverTransition(TransitionType.Sprite)) {
                        if (this._sprite && this._spriteHover) {
                            this._sprite.spriteFrame = this._spriteHover;
                        }
                    } else if (this.hasPressedTransition(TransitionType.Sprite)) {
                        if (this._sprite && this._spriteIdle) {
                            this._sprite.spriteFrame = this._spriteIdle;
                        }
                    }
                }

                if (this.hasHoverTransition(TransitionType.Offset)) {
                    this._fromOffset.x = this.target.position.x;
                    this._fromOffset.y = this.target.position.y;
                    this._toOffset.x = this._offsetIdle.x + this._offsetHover.x;
                    this._toOffset.y = this._offsetIdle.y + this._offsetHover.y;
                } else if (this.hasPressedTransition(TransitionType.Offset)) {
                    this._fromOffset.x = this.target.position.x;
                    this._fromOffset.y = this.target.position.y;
                    this._toOffset.x = this._offsetIdle.x;
                    this._toOffset.y = this._offsetIdle.y;
                }

                if (this.hasHoverTransition(TransitionType.ContentOffset)) {
                    this._fromContentOffset.x = this._contentOffset.x;
                    this._fromContentOffset.y = this._contentOffset.y;
                    this._toContentOffset.x = this._contentOffsetHover.x;
                    this._toContentOffset.y = this._contentOffsetHover.y;
                } else if (this.hasPressedTransition(TransitionType.ContentOffset)) {
                    this._fromContentOffset.x = this._contentOffset.x;
                    this._fromContentOffset.y = this._contentOffset.y;
                    this._toContentOffset.x = 0;
                    this._toContentOffset.y = 0;
                }

                if (this.hasHoverTransition(TransitionType.AnimationClip) && this._animationHover) {
                    this._animationComponent.play(this._animationHover.name);
                }
            } else if (this._getButtonState() == 'pressed') {
                // Pressed state

                if (this._soundName) {
                    SoundManager.instance.playSound(this._soundName);
                }

                this._transitionTime = this._transitionTimePressed;
                this._transitionTimer = this._transitionTime;

                if (this.hasPressedTransition(TransitionType.Color)) {
                    this._fromColor = renderComp.color.clone();
                    this._toColor = this._colorPressed;
                } else if (this.hasHoverTransition(TransitionType.Color)) {
                    this._fromColor = renderComp.color.clone();
                    this._toColor = this._colorHover;
                }

                if (this.isToggleButton() && this._toggleState) {
                    if (this.hasPressedTransition(TransitionType.Sprite)) {
                        if (this._sprite && this._spriteTogglePressed) {
                            this._sprite.spriteFrame = this._spriteTogglePressed;
                        }
                    } else if (this.hasHoverTransition(TransitionType.Sprite)) {
                        if (this._sprite && this._spriteToggleHover) {
                            this._sprite.spriteFrame = this._spriteToggleHover;
                        }
                    }
                } else {
                    if (this.hasPressedTransition(TransitionType.Sprite)) {
                        if (this._sprite && this._spritePressed) {
                            this._sprite.spriteFrame = this._spritePressed;
                        }
                    } else if (this.hasHoverTransition(TransitionType.Sprite)) {
                        if (this._sprite && this._spriteHover) {
                            this._sprite.spriteFrame = this._spriteHover;
                        }
                    }
                }

                if (this.hasPressedTransition(TransitionType.Scale)) {
                    if (this.isToggleButton && this._toggleState) {
                        this._fromScale = this._scaleToggled;
                        Vec3.multiply(this._toScale, this._scalePressed, this._scaleToggled);
                    } else {
                        this._fromScale = this.target.scale;
                        this._toScale = this._scalePressed;
                    }
                } else if (this.hasHoverTransition(TransitionType.Scale)) {
                    this._fromScale = this.target.scale;
                    this._toScale = this._scaleHover;
                }

                if (this.hasPressedTransition(TransitionType.Offset)) {
                    this._fromOffset.x = this.target.position.x;
                    this._fromOffset.y = this.target.position.y;
                    this._toOffset.x = this._offsetIdle.x + this._offsetPressed.x;
                    this._toOffset.y = this._offsetIdle.y + this._offsetPressed.y;
                } else if (this.hasHoverTransition(TransitionType.Offset)) {
                    this._fromOffset.x = this.target.position.x;
                    this._fromOffset.y = this.target.position.y;
                    this._toOffset.x = this._offsetIdle.x + this._offsetHover.x;
                    this._toOffset.y = this._offsetIdle.y + this._offsetHover.y;
                }

                if (this.hasPressedTransition(TransitionType.ContentOffset)) {
                    this._fromContentOffset.x = this._contentOffset.x;
                    this._fromContentOffset.y = this._contentOffset.y;
                    this._toContentOffset.x = this._contentOffsetPressed.x;
                    this._toContentOffset.y = this._contentOffsetPressed.y;
                } else if (this.hasHoverTransition(TransitionType.ContentOffset)) {
                    this._fromContentOffset.x = this._contentOffset.x;
                    this._fromContentOffset.y = this._contentOffset.y;
                    this._toContentOffset.x = this._contentOffsetHover.x;
                    this._toContentOffset.y = this._contentOffsetHover.y;
                }

                if (this.hasPressedTransition(TransitionType.AnimationClip) && this._animationPressed) {
                    this._animationComponent.play(this._animationPressed.name);
                }

                if (this._isToggleButton) {
                    if (this.hasPressedTransition(TransitionType.AnimationClip) && this._animationPressed) {
                        // Wait for the animationPressed animation to finish
                        this._animationComponent.once(Animation.EventType.FINISHED, () => {
                            this._toggleState = !this._toggleState; // Toggle the state after the animation finishes
                        });
                    } else {
                        // Toggle the state immediately if no pressed animation is present
                        this._toggleState = !this._toggleState;
                    }
                }
            }
        }

        this._previousState = this._getButtonState();
    }

    _applyTarget(): void {
        super._applyTarget();

        if (this.target) {
            this._sprite = this._getTargetSprite(this.target);

            if (!this._scaleIdle) {
                this._scaleIdle = new Vec3();
            }
            this._scaleIdle.x = this.target.scale.x;
            this._scaleIdle.y = this.target.scale.y;

            if (!this._offsetIdle) {
                this._offsetIdle = new Vec3();
            }
            this._offsetIdle.x = this.target.position.x;
            this._offsetIdle.y = this.target.position.y;

            this._contentTargets.forEach((content) => {
                this._contentOffsets.push(new Vec3(content.position.x, content.position.y, content.position.z));
            });

            if (this._animationComponent) {
                if (this.hasEitherTransition(TransitionType.AnimationClip)) {
                    while (this._animationComponent.clips.length > 0) {
                        this._animationComponent.clips.pop();
                    }

                    if (this._animationIdle) {
                        this._animationComponent.addClip(this._animationIdle);
                    }
                    if (this._animationHover) {
                        this._animationComponent.addClip(this._animationHover);
                    }
                    if (this._animationPressed) {
                        this._animationComponent.addClip(this._animationPressed);
                    }
                    if (this._animationDisabled) {
                        this._animationComponent.addClip(this._animationDisabled);
                    }
                    if (this._animationToggled) {
                        this._animationComponent.addClip(this._animationToggled);
                    }

                    if (!this.interactable) {
                        this._animationComponent.defaultClip = this._animationDisabled;
                    } else {
                        this._animationComponent.defaultClip = this._animationIdle;
                    }
                    this._animationComponent.playOnLoad = true;
                } else {
                    this._animationComponent.defaultClip = null;
                    this._animationComponent.playOnLoad = false;
                }
            }
        }
    }

    private hasHoverTransition(transition: TransitionType): boolean {
        return transition === (this._hoverTransition & transition);
    }

    private hasPressedTransition(transition: TransitionType): boolean {
        return transition === (this._pressedTransition & transition);
    }

    private hasEitherTransition(transition: TransitionType): boolean {
        return this.hasHoverTransition(transition) || this.hasPressedTransition(transition) || this.hasToggleTransition(transition);
    }

    private hasToggleTransition(transition: TransitionType): boolean {
        return transition === (this._toggledTransition & transition);
    }

    private isToggleButton(): boolean {
        return this._isToggleButton;
    }

    public setToggleState(state: boolean) {
        this._toggleState = state;
        this._updateState();
    }
}
