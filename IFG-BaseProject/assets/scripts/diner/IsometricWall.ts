import { _decorator, Material, Color, ModelComponent, Texture2D, utils, Vec4, gfx, builtinResMgr, EffectAsset } from 'cc';
import { EDITOR } from 'cc/env';
import { IsometricWallTop } from './IsometricWallTop';
import { IsometricWallSide } from './IsometricWallSide';
import { Rect } from 'cc';
import { Vec3 } from 'cc';
import { IVisibleEntity } from './IVisibleEntity';
const { ccclass, property } = _decorator;

// This class allows creating a 'faked' isometric wall from a three quads. The length, width and height of the walls can
// be manipulated which will result in different geometry for the walls. Additionally walls can be mirrored to make
// NE facing versions of the walls.
//
//
//                          *
//      *                       *
//          *
//
//
//
//
//
//      *                       *
//          *
//
// UVs are multiplied and tiled across each face.
// The texture is a sort of fake atlas containing the side colour/texture in the top 25% of the texture, the top colour/texture
// in the 25%-50% texture space, and the face in the bottom 50% of the texture.
//
@ccclass('IsometricWall')
export class IsometricWall extends ModelComponent implements IVisibleEntity {
    @property(Texture2D)
    public tileableTexture: Texture2D | null = null;
    @property(Texture2D)
    public tileableTextureWallTop: Texture2D | null = null;
    @property(Texture2D)
    public tileableTextureWallSideNW: Texture2D | null = null;
    @property(Texture2D)
    public tileableTextureWallSideNE: Texture2D | null = null;

    @property
    public tilingOffset: Vec4 = new Vec4(1, 1, 0, 0);

    @property
    public blendColor: Color = new Color(255, 255, 255, 255);

    @property
    public masking: Vec4 = new Vec4(-0.1, 1.1, -0.1, 1.1);

    @property
    public gridCellWidth: number = 1; // Width of each grid cell

    @property
    public gridCellHeight: number = 0.6; // Height of each grid cell

    @property
    public wallLength: number = 1; // Number of grid cells in width

    @property
    public wallWidth: number = 1; // Number of grid cells in height

    @property
    public wallHeight: number = 1;

    @property
    public mirror: boolean = false;

    @property
    public UVScale: number = 1;

    @property({ min: 0, max: 1 })
    public dynamicWallHeight: number = 1;

    public designatedMaxDynamicWallHeight = 1;

    @property(EffectAsset)
    public effect: EffectAsset;

    @property(IsometricWallTop)
    public wallTop: IsometricWallTop | null = null;

    @property(IsometricWallSide)
    public wallSide: IsometricWallSide | null = null;

    private _gridCellWidth: number;
    private _gridCellHeight: number;
    private _wallLength: number;
    private _wallWidth: number;
    private _uvScale: number;
    private _wallHeight: number;
    private _mirror: boolean;
    private _dynamicWallHeight: number;

    private static readonly _texturePropertyName: string = 'tilingTexture';
    private static readonly _tilingOffsetPropertyName: string = 'tilingOffset';
    private static readonly _blendColorPropertyName: string = 'blendColor';
    private static readonly _maskingPropertyName: string = 'masking';

    private _boundingRect: Rect = new Rect();

    onLoad() {
        this._initializeSharedResources();

        this.designatedMaxDynamicWallHeight = this._dynamicWallHeight;
    }

    update(deltaTime: number) {
        if (EDITOR) {
            if (
                this.gridCellWidth !== this._gridCellWidth ||
                this.gridCellHeight !== this._gridCellHeight ||
                this.wallLength !== this._wallLength ||
                this.wallWidth !== this._wallWidth ||
                this.wallHeight !== this._wallHeight ||
                this.UVScale !== this._uvScale ||
                this.mirror !== this._mirror ||
                this.dynamicWallHeight !== this._dynamicWallHeight
            ) {
                this._initializeSharedResources();
            }
        }
    }

    private _initializeSharedResources() {
        this._gridCellWidth = this.gridCellWidth;
        this._gridCellHeight = this.gridCellHeight;
        this._wallLength = this.wallLength;
        this._wallWidth = this.wallWidth;
        this._uvScale = this.UVScale;
        this._wallHeight = this.wallHeight;
        this._mirror = this.mirror;
        this._dynamicWallHeight = this.dynamicWallHeight;

        const halfCellWidth = 0.5 * this.gridCellWidth;
        const halfCellHeight = 0.5 * this.gridCellHeight;
        const mirrorFactor = this.mirror ? -1 : 1;
        const wallHeight = this.wallHeight * this.dynamicWallHeight;

        if (this.wallTop) {
            this.wallTop.gridCellWidth = this._gridCellWidth;
            this.wallTop.gridCellHeight = this._gridCellHeight;
            this.wallTop.wallLength = this._wallLength;
            this.wallTop.wallWidth = this._wallWidth;
            this.wallTop.wallHeight = this._wallHeight;
            this.wallTop.UVScale = this._uvScale;
            this.wallTop.mirror = this._mirror;
            this.wallTop.dynamicWallHeight = this._dynamicWallHeight;
            this.wallTop.tileableTexture = this.tileableTextureWallTop;
        }

        if (this.wallSide) {
            this.wallSide.gridCellWidth = this._gridCellWidth;
            this.wallSide.gridCellHeight = this._gridCellHeight;
            this.wallSide.wallLength = this._wallLength;
            this.wallSide.wallWidth = this._wallWidth;
            this.wallSide.wallHeight = this._wallHeight;
            this.wallSide.UVScale = this._uvScale;
            this.wallSide.mirror = this._mirror;
            this.wallSide.dynamicWallHeight = this._dynamicWallHeight;
            this.wallSide.tileableTexture = this._mirror ? this.tileableTextureWallSideNW : this.tileableTextureWallSideNE;
        }

        // prettier-ignore
        const meshInfo = {
            positions: [
                // Wall face NW
                //
                //                   * (2)
                //    (1)  *
                //
                //                   * (3)
                //    (0)  *
                //
                0 * mirrorFactor, 0, 0,
                0 * mirrorFactor, wallHeight, 0,
                this.wallLength * mirrorFactor * halfCellWidth, this.wallLength * halfCellHeight + wallHeight, 0,
                this.wallLength * mirrorFactor * halfCellWidth, this.wallLength * halfCellHeight, 0,
            ],
            uvs: [
                // Wall face NW
                0, 1,
                0, 0 + (1.0 - this.dynamicWallHeight),
                1 * this.wallLength * this.UVScale * (1.0 / this.wallHeight), 0 + (1.0 - this.dynamicWallHeight),
                1 * this.wallLength * this.UVScale * (1.0 / this.wallHeight), 1,
            ],
            indices: [
                // Wall face NW
                0, 1, 2, 0, 2, 3
            ]
        };

        // Create mesh
        let mesh = utils.MeshUtils.createMesh(meshInfo);
        const vbInfo = mesh.struct.vertexBundles[0].view;
        const vbuffer = mesh.data.buffer.slice(vbInfo.offset, vbInfo.offset + vbInfo.length);

        // Create material
        let material = new Material();
        material.initialize({
            effectAsset: this.effect,
            states: {
                rasterizerState: {
                    cullMode: gfx.CullMode.NONE
                },
                blendState: {
                    targets: [
                        {
                            blend: false, //TODO: Try to find a way to make the blend settings allow the geometry to show properly and allow for transparency...
                            blendSrc: gfx.BlendFactor.SRC_ALPHA,
                            blendDst: gfx.BlendFactor.ONE_MINUS_SRC_ALPHA,
                            blendDstAlpha: gfx.BlendFactor.ONE_MINUS_SRC_ALPHA
                        }
                    ]
                },
                depthStencilState: {
                    depthTest: true,
                    depthWrite: true,
                    depthFunc: gfx.ComparisonFunc.LESS_EQUAL
                }
            }
        });

        this.mesh = mesh;
        this.material = material;

        // Bounding rect for culling
        const worldPos = new Vec3();
        let minX = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < meshInfo.positions.length; i += 3) {
            const local = new Vec3(meshInfo.positions[i], meshInfo.positions[i + 1], meshInfo.positions[i + 2]);
            Vec3.transformMat4(worldPos, local, this.node.getWorldMatrix());

            minX = Math.min(minX, worldPos.x);
            maxX = Math.max(maxX, worldPos.x);
            minY = Math.min(minY, worldPos.y);
            maxY = Math.max(maxY, worldPos.y);
        }

        this._boundingRect = new Rect(minX, minY, maxX - minX, maxY - minY);

        this.updateMaterial();
    }

    // IVisibleEntity implementations

    public getBoundingRect(): Rect {
        return this._boundingRect;
    }

    public setVisible(visible: boolean) {
        this.node.active = visible;
    }

    public updateMaterial() {
        const target = this.tileableTexture ? this.tileableTexture : builtinResMgr.get<Texture2D>('grey-texture');

        const pass = this.material!.passes[0];
        const binding = pass.getBinding(IsometricWall._texturePropertyName);
        if (typeof binding === 'number') {
            pass.bindTexture(binding, target.getGFXTexture());
        }

        this.material.setProperty(IsometricWall._tilingOffsetPropertyName, this.tilingOffset);

        this.material.setProperty(IsometricWall._blendColorPropertyName, this.blendColor);

        this.material.setProperty(IsometricWall._maskingPropertyName, this.masking);

        if (this.wallTop) {
            this.wallTop.tileableTexture = this.tileableTextureWallTop;
            this.wallTop.updateMaterial();
        }

        if (this.wallSide) {
            this.wallSide.tileableTexture = this._mirror ? this.tileableTextureWallSideNW : this.tileableTextureWallSideNE;
            this.wallSide.updateMaterial();
        }
    }

    public redraw() {
        this._initializeSharedResources();

        if (this.wallTop) {
            this.wallTop.redraw();
        }

        if (this.wallSide) {
            this.wallSide.redraw();
        }
    }
}
