import { _decorator, Component, Material, Node, SpriteRenderer, Texture2D, Renderer, Vec4, renderer, Color } from 'cc';
import { EDITOR_NOT_IN_PREVIEW } from 'cc/env';
import { logger } from '../logging';
const { ccclass, property } = _decorator;

@ccclass('Iso2DGeometrySpriteRenderer')
export class Iso2DGeometrySpriteRenderer extends SpriteRenderer {
    @property({ type: Texture2D })
    public TilingTexture: Texture2D | null = null;

    @property
    public TilingOffset: Vec4 = new Vec4(1, 1, 0, 0);

    @property
    public Masking: Vec4 = new Vec4(-0.1, 1.1, -0.1, 1.1);

    @property
    public Color: Color = new Color(255, 255, 255, 255);

    private _mat: Material = null;
    private _log = logger.child('Iso2DGeometrySpriteRenderer');

    //These names are derived from the uniforms defined in the fragment shader of iso-2d-geometry-sprite-renderer.effect
    private static readonly _texturePropertyName: string = 'tilingTexture';
    private static readonly _tilingOffsetPropertyName: string = 'tilingOffset';
    private static readonly _maskingPropertyName: string = 'masking';
    private static readonly _spriteColorPropertyName: string = 'spriteColor';

    //TODO: Make a proper init function to be invoked by a manager of sorts that will assign an existing material instance if there is one.
    public start() {
        if (EDITOR_NOT_IN_PREVIEW) {
            //Show selected textures in editor...
            this._mat = this.getMaterialInstance(0);
            this.refreshTiledTexture();
            this.refreshMasking();
        }
    }

    public init() {
        this._mat = this.getMaterialInstance(0);

        this.refreshTiledTexture();
        this.refreshMasking();
    }

    public refreshTiledTexture() {
        if (this._mat != null) {
            this._mat.setProperty(Iso2DGeometrySpriteRenderer._texturePropertyName, this.TilingTexture);
            this._mat.setProperty(Iso2DGeometrySpriteRenderer._tilingOffsetPropertyName, this.TilingOffset);
            this._mat.setProperty(Iso2DGeometrySpriteRenderer._spriteColorPropertyName, this.Color);
        } else {
            this._log.error('Material instance is null!');
        }
    }

    public refreshMasking() {
        if (this._mat != null) {
            this._mat.setProperty(Iso2DGeometrySpriteRenderer._maskingPropertyName, this.Masking);
        } else {
            this._log.error('Material instance is null!');
        }
    }

    //TODO: Figure out how to identify the masking uniform from the fragment shader's pass to update it in real time for performant animations
    //public updateMasking() {
    //    this._mat.passes.forEach(this.updateMaskingCallback);
    //}

    //private updateMaskingCallback(pass : renderer.Pass) {
    //    pass.setUniform(, this.Masking);
    //}
}
