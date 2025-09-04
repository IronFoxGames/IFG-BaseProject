import { _decorator, Material, SpriteRenderer, Color } from 'cc';
import { logger } from '../logging';
const { ccclass, property } = _decorator;

@ccclass('CustomSpriteRenderer')
export class CustomSpriteRenderer extends SpriteRenderer {
    @property
    public Color: Color = new Color(255, 255, 255, 255);

    private _mat: Material = null;
    private _log = logger.child('CustomSpriteRenderer');

    //These names are derived from the uniforms defined in the fragment shader of custom-sprite-renderer.effect
    private static readonly _spriteColorPropertyName: string = 'spriteColor';

    //TODO: Make a proper init function to be invoked by a manager of sorts that will assign an existing material instance if there is one.
    public start() {
        //this._mat = this.getMaterialInstance(0);
        //
        //this.refreshColor();
    }

    public init() {
        this._mat = this.getMaterialInstance(0);

        this.refreshColor();
    }

    public refreshColor() {
        if (this._mat != null) {
            this._mat.setProperty(CustomSpriteRenderer._spriteColorPropertyName, this.Color);
        } else {
            this._log.error('Material instance is null!');
        }
    }
}
