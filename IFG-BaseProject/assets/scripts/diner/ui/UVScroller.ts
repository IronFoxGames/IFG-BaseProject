import { _decorator, Component, Sprite, Material, log } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('UVScroller')
@executeInEditMode
export class UVScroller extends Component {
    @property
    scrollSpeedX: number = 0.0;

    @property
    scrollSpeedY: number = 0.0;

    @property
    uvOffsetX: number = 0.0;

    @property
    uvOffsetY: number = 0.0;

    @property
    globalTimeScale: number = 1.0;

    private _material: Material | null = null;
    private _prevScrollSpeedX: number = 0.0;
    private _prevScrollSpeedY: number = 0.0;
    private _prevUvOffsetX: number = 0.0;
    private _prevUvOffsetY: number = 0.0;
    private _prevGlobalTimeScale: number = 1.0;

    start() {
        this._getMaterial();
    }

    update(deltaTime: number) {
        let updated = false;

        if (this.scrollSpeedX !== this._prevScrollSpeedX) {
            this._material.setProperty('scrollSpeedX', this.scrollSpeedX);
            this._prevScrollSpeedX = this.scrollSpeedX;
            updated = true;
        }

        if (this.scrollSpeedY !== this._prevScrollSpeedY) {
            this._material.setProperty('scrollSpeedY', this.scrollSpeedY);
            this._prevScrollSpeedY = this.scrollSpeedY;
            updated = true;
        }

        if (this.uvOffsetX !== this._prevUvOffsetX) {
            this._material.setProperty('uvOffsetX', this.uvOffsetX);
            this._prevUvOffsetX = this.uvOffsetX;
            updated = true;
        }

        if (this.uvOffsetY !== this._prevUvOffsetY) {
            this._material.setProperty('uvOffsetY', this.uvOffsetY);
            this._prevUvOffsetY = this.uvOffsetY;
            updated = true;
        }

        if (this.globalTimeScale !== this._prevGlobalTimeScale) {
            this._material.setProperty('globalTimeScale', this.globalTimeScale);
            this._prevGlobalTimeScale = this.globalTimeScale;
            updated = true;
        }

        if (updated) {
            this._material.passes.forEach((pass) => pass.update());
        }
    }

    private _getMaterial() {
        const sprite = this.getComponent(Sprite);
        if (sprite && sprite.customMaterial) {
            this._material = sprite.customMaterial;
        }
    }
}
