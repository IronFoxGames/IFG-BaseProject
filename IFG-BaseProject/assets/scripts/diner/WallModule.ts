import { _decorator, Component, lerp, Node, Vec3, math, SpriteRenderer, Color } from 'cc';
import { Iso2DGeometrySpriteRenderer } from './Iso2DGeometrySpriteRenderer';
import { CustomSpriteRenderer } from './CustomSpriteRenderer';
const { ccclass, property } = _decorator;

@ccclass('WallModule')
export class WallModule extends Component {
    @property({ type: Iso2DGeometrySpriteRenderer })
    public WallRenderer: Iso2DGeometrySpriteRenderer | null = null;

    @property({ type: Node })
    public TopNode: Node | null = null;

    @property({ type: CustomSpriteRenderer })
    public TopRenderer: CustomSpriteRenderer | null = null;

    @property
    public TopBaseOffset: number = 0.0;

    private _hasWallRenderer: boolean = false;
    private _hasTopNode: boolean = false;

    private _defaultTopNodeHeight: Vec3 = new Vec3();
    private _defaultTopNodeBase: Vec3 = new Vec3();

    @property
    public CurrentWallPercentage: number = 1.0;


    //TODO: Consider making a data type class that contains all the information that is required to "change the wallpaper" and make it so that this class an read that class and apply the data properly.
    public start() {
        this._hasWallRenderer = (this.WallRenderer != null);

        this._hasTopNode = (this.TopNode != null);

        if (this._hasTopNode) {
            this._defaultTopNodeHeight = this.TopNode.getWorldPosition();
            Vec3.add(this._defaultTopNodeBase, this.node.getWorldPosition(), new Vec3(0, this.TopBaseOffset, 0));
        }
    }

    public update(deltaTime: number) {

    }

    public setWallPercentage(amount: number) {
        this.CurrentWallPercentage = amount;
        this.updateWallHeight();
    }

    private updateWallHeight() {

        if (this._hasWallRenderer) {
            this.WallRenderer.Masking.w = this.CurrentWallPercentage;
            this.WallRenderer.refreshMasking();
        }

        if (this._hasTopNode) {

            if (this._hasWallRenderer) {
                this.TopNode.active = this.WallRenderer.Masking.z < this.CurrentWallPercentage;
            }

            var temp: Vec3 = new Vec3();
            Vec3.lerp(temp, this._defaultTopNodeBase, this._defaultTopNodeHeight, this.CurrentWallPercentage);
            this.TopNode.setWorldPosition(temp);
        }
    }
}

