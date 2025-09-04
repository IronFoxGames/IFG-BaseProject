import { _decorator, Material, Color, ModelComponent, Texture2D, utils, Vec4, gfx, builtinResMgr, EffectAsset } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property } = _decorator;

// This class allows creating a 'faked' isometric floor from a single quad. The floor needs to define the size of the
// isometric grid tile (height and width) and then it will create the quad based on the desired floor area.
// UVS are automatically calculated and will (for UV scale 1) be 1 full texture mapped across a single grid tile size.
// The quad coordinates will be created like:
//
//                        (top center)
//                              *
//
//  (bottom left)  *                         *  (bottom right)
//
//                              *
//                      (bottom center)
//
// These coords will be multiplied by the floor area size (floorWidthInGridCells and floorHeightInGridCells) to stretch
// the geometry across the whole floor with a single quad.
//
// UVs are mapped as such:
//
//                      (1, 0)
//                        *
//
//   (0, 0)  *                         *  (1,1)
//
//                        *
//                     (0, 1)
//
// UVs are multiplied by the floor area to ensure consistent tiling. Additional fine grained tiling control can be
// achieved by changing the UVScale property.
//

@ccclass('IsometricFloor')
export class IsometricFloor extends ModelComponent {
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
    public floorWidthInGridCells: number = 1; // Number of grid cells in width

    @property
    public floorHeightInGridCells: number = 1; // Number of grid cells in height

    @property
    public UVScale: number = 1;

    @property(EffectAsset)
    public effect: EffectAsset;

    private _gridCellWidth: number;
    private _gridCellHeight: number;
    private _floorWidthInGridCells: number;
    private _floorHeightInGridCells: number;
    private _uvScale: number;

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
                this.floorWidthInGridCells !== this._floorWidthInGridCells ||
                this.floorHeightInGridCells !== this._floorHeightInGridCells ||
                this.UVScale !== this._uvScale
            ) {
                this._initializeSharedResources();
            }
        }
    }

    private _initializeSharedResources() {
        this._gridCellWidth = this.gridCellWidth;
        this._gridCellHeight = this.gridCellHeight;
        this._floorWidthInGridCells = this.floorWidthInGridCells;
        this._floorHeightInGridCells = this.floorHeightInGridCells;
        this._uvScale = this.UVScale;

        const halfCellWidth = 0.5 * this.gridCellWidth;
        const halfCellHeight = 0.5 * this.gridCellHeight;

        // Define quad geometry
        const meshInfo = {
            positions: [
                0,
                0,
                0, // Bottom-left
                this.floorWidthInGridCells * halfCellWidth,
                this.floorWidthInGridCells * halfCellHeight,
                0, // Top-center
                this.floorWidthInGridCells * halfCellWidth + this.floorHeightInGridCells * halfCellWidth,
                this.floorWidthInGridCells * halfCellHeight - this.floorHeightInGridCells * halfCellHeight,
                0, // Bottom-right
                this.floorHeightInGridCells * halfCellWidth,
                this.floorHeightInGridCells * -halfCellHeight,
                0 // Bottom-center
            ],
            uvs: [
                0,
                0, // Bottom-left
                this.floorWidthInGridCells * this.UVScale,
                0, // Top-center
                this.floorWidthInGridCells * this.UVScale,
                this.floorHeightInGridCells * this.UVScale, // Bottom-right
                0,
                this.floorHeightInGridCells * this.UVScale // Bottom-center
            ],
            indices: [
                0,
                1,
                2, // First triangle
                0,
                2,
                3 // Second triangle
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

        const pass = this.material!.passes[0];
        const binding = pass.getBinding(IsometricFloor._texturePropertyName);
        if (typeof binding === 'number') {
            pass.bindTexture(binding, target.getGFXTexture());
        }

        this.material.setProperty(IsometricFloor._tilingOffsetPropertyName, this.tilingOffset);

        this.material.setProperty(IsometricFloor._blendColorPropertyName, this.blendColor);

        this.material.setProperty(IsometricFloor._maskingPropertyName, this.masking);
    }

    public redraw() {
        this._initializeSharedResources();
    }
}
