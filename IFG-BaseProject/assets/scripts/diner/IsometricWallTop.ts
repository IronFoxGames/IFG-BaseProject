import { _decorator, Material, Color, ModelComponent, Texture2D, utils, Vec4, gfx, builtinResMgr, EffectAsset } from 'cc';
import { EDITOR } from 'cc/env';
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
@ccclass('IsometricWallTop')
export class IsometricWallTop extends ModelComponent {
    @property(Texture2D)
    public tileableTexture: Texture2D | null = null;

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

    @property(EffectAsset)
    public effect: EffectAsset;

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

    onLoad() {
        this._initializeSharedResources();
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

        // prettier-ignore
        const meshInfo = {
            positions: [
                // Wall top NW
                //
                //                      * (2)
                //                               * (3)
                //  (1) *
                //             * (0)
                //
                0 * mirrorFactor,
                wallHeight,
                0,
                this.wallWidth * mirrorFactor * -halfCellWidth,
                this.wallWidth * halfCellHeight + wallHeight,
                0,
                this.wallWidth * mirrorFactor * -halfCellWidth + this.wallLength * halfCellWidth * mirrorFactor,
                this.wallLength * halfCellHeight + this.wallWidth * halfCellHeight + wallHeight,
                0,
                this.wallLength * mirrorFactor * halfCellWidth,
                this.wallLength * halfCellHeight + wallHeight,
                0
            ],
            uvs: [
                // Wall top NW
                0, 0, 
                0, 1, 
                1 * this.wallLength, 1, 
                1 * this.wallLength, 0
            ],
            indices: [
                // Wall top NW
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

        this.updateMaterial();
    }

    public updateMaterial() {
        const target = this.tileableTexture ? this.tileableTexture : builtinResMgr.get<Texture2D>('grey-texture');

        // If the parent wall tells us to update materials, it might be after overriding the tileable texture.
        // If this is on load; we might not be initialized yet and can ignore it as it'll be applied to the material
        // on our initialization
        if (this.material == null) {
            return;
        }

        const pass = this.material!.passes[0];
        const binding = pass.getBinding(IsometricWallTop._texturePropertyName);
        if (typeof binding === 'number') {
            pass.bindTexture(binding, target.getGFXTexture());
        }

        this.material.setProperty(IsometricWallTop._tilingOffsetPropertyName, this.tilingOffset);

        this.material.setProperty(IsometricWallTop._blendColorPropertyName, this.blendColor);

        this.material.setProperty(IsometricWallTop._maskingPropertyName, this.masking);
    }

    public redraw() {
        this._initializeSharedResources();
    }
}
