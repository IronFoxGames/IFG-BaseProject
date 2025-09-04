import { _decorator, Component, UITransform, ccenum, CCFloat, Sprite } from 'cc';
import { logger } from '../logging';
const { ccclass, property, menu } = _decorator;
const { executeInEditMode } = _decorator;

export enum ResizeMode {
    /**
     * @en Only resize once when the Component and Parent are enabled for the first time.
     */
    ONCE = 0,
    /**
     * @en Set the size on every update.
     */
    ALWAYS = 1,
    /**
     * @en
     * Resize any time the parent node size changes.
     */
    ON_WINDOW_RESIZE = 2
}

export enum FitMode {
    /**
     * @en
     * Nothing is done to the object's size.
     */
    None = 0,
    /**
     * @en Fits the height of the object inside the parent object. Will leave empty space if the width does not fit.
     */
    HeightControlsWidth = 1,
    /**
     * @en Fits the width of the object inside the parent object. Will leave empty space if the height does not fit.
     */
    WidthControlsHeight = 2,
    /**
     * @en
     * Fills the parent object. Will allow either width or height to overflow.
     */
    EnvelopeParent = 3,
    /**
     * @en
     * Fits the entire object inside the parent object by whichever is the longest measurement. Will leave empty space.
     */
    FitInParent = 4,
    /**
     * @en
     * Fills the parent object but will squash the object if the aspect ratio does not match.
     */
    SqueezeInParent = 5
}

// Register enums with ccenum
ccenum(FitMode);
ccenum(ResizeMode);

@ccclass('AspectRatioFitter')
@executeInEditMode
@menu('UI/Aspect Ratio Fitter')
export class AspectRatioFitter extends Component {
    /**
     * The mode used to fit the object within its parent.
     *
     * @property {FitMode} fitMode - The fit mode to be applied. Default is `FitMode.EnvelopeParent`.
     * @tooltip "Selects which mode to use to fit the object within its parent."
     */
    @property({
        type: FitMode,
        tooltip:
            "Selects which mode to fit the object within its parent. \n\n None: Nothing is done to the object's size. \n\n HeightControlsWidth: Fits the height of the object inside the parent object. Will leave empty space if the width does not fit. \n\n WidthControlsHeight: Fits the width of the object inside the parent object. Will leave empty space if the height does not fit. \n\n EnvelopeParent: Fills the parent object. Will allow either width or height to overflow. \n\n FitInParent: \n Fits the entire object inside the parent object by whichever is the longest measurement. Will leave empty space. \n\n SqueezeInParent: Fills the parent object but will squash the object if the aspect ratio does not match."
    })
    fitMode: FitMode = FitMode.EnvelopeParent;

    @property({
        type: ResizeMode,
        tooltip:
            'Selects when to resize the object to fit the parent. \n\n ONCE: Only resize once when the Component and Parent are enabled for the first time. \n\n ALWAYS: Set the size on every update. \n\n ON_WINDOW_RESIZE: Resize any time the parent node size changes.'
    })
    resizeMode: ResizeMode = ResizeMode.ALWAYS;

    @property({
        type: CCFloat,
        tooltip: 'The aspect ratio of the object. Press reset, to revert to the original aspect ratio.'
    })
    private aspectRatio: number = 0;

    private baseSize;

    private parentSize;

    private _log = logger.child('AspectRatioFitter');

    // NOTE: If you use this at runtime you may need to add your sprite, then setAspectRatio, then setFitMode
    // This is because when you add a sprite to an existing node the AspectRatioFitter will not have the spriteFrame data yet

    start() {
        this.fitToParent();
    }

    public setFitMode(mode: FitMode) {
        this.fitMode = mode;
        this.fitToParent();
    }

    public fitToParent() {
        const object = this.node.getComponent(UITransform);
        const parent = this.node.parent;

        if (!object || !parent) {
            this._log.error('UITransform or parent node not found');
            return;
        }

        const spriteRef = this.node.getComponent(Sprite);
        if (spriteRef && spriteRef.spriteFrame) {
            this.baseSize = spriteRef.spriteFrame.originalSize;
        } else {
            this.baseSize = this.node.getComponent(UITransform).getBoundingBox().size;
        }

        this.parentSize = parent.getComponent(UITransform).contentSize;

        this.setAspectRatio();

        let newWidth, newHeight;

        switch (this.fitMode) {
            case FitMode.None: {
                newWidth = this.baseSize.width;
                newHeight = this.baseSize.height;
                break;
            }
            case FitMode.EnvelopeParent: {
                if (this.baseSize.width > this.baseSize.height) {
                    //If the base objects width is greater than the height, the use the height to envelop the parent
                    newHeight = this.parentSize.height;
                    newWidth = newHeight * this.aspectRatio;
                } else {
                    //If the base objects height is greater than the width, the use the width to envelop the parent
                    newWidth = this.parentSize.width;
                    newHeight = newWidth / this.aspectRatio;
                }
                break;
            }
            case FitMode.HeightControlsWidth: {
                newHeight = this.parentSize.height;
                newWidth = newHeight * this.aspectRatio;
                break;
            }
            case FitMode.WidthControlsHeight: {
                newWidth = this.parentSize.width;
                newHeight = newWidth / this.aspectRatio;
                break;
            }
            case FitMode.FitInParent: {
                if (this.baseSize.width > this.baseSize.height) {
                    //If the base objects width is greater than the height, the use the width to fit in the parent
                    newWidth = this.parentSize.width;
                    newHeight = newWidth / this.aspectRatio;
                } else {
                    //If the base objects height is greater than the width, the use the height to fit in the parent
                    newHeight = this.parentSize.height;
                    newWidth = newHeight * this.aspectRatio;
                }
                break;
            }
            case FitMode.SqueezeInParent: {
                newWidth = this.parentSize.width;
                newHeight = this.parentSize.height;
                break;
            }
            default: {
                break;
            }
        }

        object.getComponent(UITransform).setContentSize(newWidth, newHeight);
    }

    public setAspectRatio(ratio?: number) {
        // You can set the aspect ratio manually if you ned to, otherwise it'll just use the original aspect ratio of the image
        if (ratio) {
            this.aspectRatio = ratio;
        } else {
            this.aspectRatio = this.baseSize.width / this.baseSize.height;
        }
    }

    public getAspectRatio() {
        return this.aspectRatio;
    }

    update(deltaTime: number) {
        // Resize the object to fit the parent on every update if the resizeMode is set to ALWAYS
        if (this.resizeMode === ResizeMode.ALWAYS) {
            this.fitToParent();
        }
    }

    onLoad() {
        // Resize the object to fit the parent when the object and parent are enabled for the first time if the resizeMode is set to ONCE
        this.fitToParent();

        // Add a listener to the window resize event to resize the object when the window is resized, if the resizeMode is set to ON_WINDOW_RESIZE
        if (this.resizeMode === ResizeMode.ON_WINDOW_RESIZE) {
            window.addEventListener('resize', this.fitToParent.bind(this));
        }
    }

    protected onRestore(): void {
        this.setAspectRatio();
    }

    onDestroy() {}
}
