import { _decorator, Color, Component, Node, warn, lerp } from 'cc';
import { WallPattern } from './WallPattern';
import { FloorPattern } from './FloorPattern';
import { IsometricFloor } from './IsometricFloor';
import { IsometricWall } from './IsometricWall';
import { tween } from 'cc';
import { logger } from '../logging';
import { DoorModule } from './DoorModule';
const { ccclass, property } = _decorator;

@ccclass('ModuleController')
export class ModuleController extends Component {
    @property({ type: Node })
    public FloorContainerNode: Node;

    @property({ type: Node })
    public WallContainerNode: Node;

    @property({ type: IsometricFloor })
    public FloorModules: IsometricFloor[] = [];

    @property({ type: IsometricWall })
    public WallModules: IsometricWall[] = [];

    @property({ type: IsometricWall })
    public WallModulesToLower: IsometricWall[] = [];

    @property({ type: DoorModule })
    public DoorModules: DoorModule[] = [];

    @property({ type: DoorModule })
    public DoorModulesToLower: DoorModule[] = [];

    @property({ type: Node })
    public FacadeNodes: Node[] = [];

    private _wallsLowered: boolean = false;

    private _customWalls: boolean = false;
    private _customFloors: boolean = false;

    private _currentWallPattern: WallPattern;
    private _currentFloorPattern: FloorPattern;

    private _dimColor: Color = new Color(Color.BLACK);

    private _lightAnimationActive: boolean = false;
    public _lightAnimationOffset: number = 0;

    private readonly _loweredWallHeight: number = 0.4;

    private _log = logger.child('ModuleController');

    public init() {
        if (this.FloorContainerNode) {
            this.FloorModules = this.FloorContainerNode.getComponentsInChildren(IsometricFloor);
            this.initCustomFloors();
        }

        if (this.WallContainerNode) {
            this.WallModules = this.WallContainerNode.getComponentsInChildren(IsometricWall);
            this.initCustomWalls();
        }

        if (this.DoorModules.length <= 0) {
            this._log.debug('There are no Door Modules present in this ModuleController.');
        }

        for (const door of this.DoorModules) {
            door.init();
        }
    }

    public update(deltaTime: number) {
        if (this._lightAnimationActive) {
            for (const wall of this.WallModules) {
                this._offsetWallModuleColorFromCurrentPattern(wall, this._lightAnimationOffset);
            }
            for (const door of this.DoorModules) {
                door.offsetColorFromCurrentColor(this._lightAnimationOffset);
            }
            for (const floor of this.FloorModules) {
                this._offsetFloorModuleColorFromCurrentPattern(floor, this._lightAnimationOffset);
            }
        }
    }

    public initCustomFloors() {
        if (this.FloorModules.length > 0) {
            this.FloorModules.forEach((module: IsometricFloor) => {
                module.updateMaterial();
            });
        } else {
            this._log.warn('There are no Floor Modules present in this ModuleController.');
        }

        this._customFloors = true;
    }

    public initCustomWalls() {
        if (this.WallModules.length > 0) {
            this.WallModules.forEach((wall: IsometricWall) => {
                wall.updateMaterial();
            });
        } else {
            this._log.warn('There are no Wall Modules present in this ModuleController.');
        }

        this._customWalls = true;
    }

    public lowerWalls(): boolean {
        return this.tryLowerWalls();
    }

    private tryLowerWalls(): boolean {
        let nullModuleFound = false;

        if (!this._wallsLowered) {
            for (const module of this.WallModulesToLower) {
                if (module) {
                    module.dynamicWallHeight = this._loweredWallHeight;
                } else {
                    nullModuleFound = true;
                }
                module?.redraw();
            }

            for (const module of this.DoorModulesToLower) {
                if (!module) {
                    nullModuleFound = true;
                }

                module?.lower();
            }

            for (const node of this.FacadeNodes) {
                if (node) {
                    node.active = false;
                }
            }

            this._wallsLowered = true;
        }

        return !nullModuleFound;
    }

    public raiseWalls(): boolean {
        return this.tryRaiseWalls();
    }

    private tryRaiseWalls(): boolean {
        let nullModuleFound = false;

        if (this._wallsLowered) {
            for (const module of this.WallModulesToLower) {
                if (module) {
                    module.dynamicWallHeight = module.designatedMaxDynamicWallHeight;
                } else {
                    nullModuleFound = true;
                }
                module?.redraw();
            }

            for (const module of this.DoorModulesToLower) {
                if (!module) {
                    nullModuleFound = true;
                }
                module?.raise();
            }

            for (const node of this.FacadeNodes) {
                if (node) {
                    node.active = true;
                }
            }

            this._wallsLowered = false;
        }

        return !nullModuleFound;
    }

    public setCustomWallPattern(pattern: WallPattern) {
        if (this._customWalls) {
            this._currentWallPattern = pattern;

            this.WallModules.forEach((module) => {
                this._updateWallModuleFromPattern(module, pattern);
            });
        }
    }

    public setCustomFloorPattern(pattern: FloorPattern) {
        if (this._customFloors) {
            this._currentFloorPattern = pattern;

            this.FloorModules.forEach((module) => {
                this._updateFloorModuleFromPattern(module, pattern);
            });
        }
    }

    public dimModules() {
        this.WallModules.forEach((module) => this._dimWallModules(module));
        this.DoorModules.forEach((module) => module.dim());
        this.FloorModules.forEach((module) => this._dimFloorModules(module));
    }

    public lightModules() {
        this.WallModules.forEach((module) => this._lightWallModules(module));
        this.DoorModules.forEach((module) => module.light());
        this.FloorModules.forEach((module) => this._lightFloorModules(module));
    }

    public playLightingAnimation(duration: number, onAnimationEnded: () => void) {
        if (this._lightAnimationActive) {
            this._log.warn('Attempting to double play module lighting animaiton...');
            return;
        }

        this._lightAnimationOffset = 0.3;

        const offsetObj = { value: this._lightAnimationOffset };

        tween(offsetObj)
            .to(
                duration,
                { value: 1 },
                {
                    easing: 'quadOut',
                    onUpdate: (target: { value: number }) => {
                        this._lightAnimationOffset = target.value;
                    }
                }
            )
            .call(() => {
                this.lightModules();
                this._lightAnimationActive = false;
                onAnimationEnded?.call(this);
            })
            .start();

        this._lightAnimationActive = true;
    }

    private _updateWallModuleFromPattern(wall: IsometricWall, pattern: WallPattern) {
        wall.tileableTexture = pattern.TilingTexture;
        wall.tileableTextureWallSideNW = pattern.SideTextureNW;
        wall.tileableTextureWallSideNE = pattern.SideTextureNE;
        wall.tileableTextureWallTop = pattern.TopTexture;
        wall.tilingOffset = pattern.TilingOffset;
        wall.blendColor = pattern.PatternColor;

        wall.updateMaterial();
    }

    private _updateFloorModuleFromPattern(floor: IsometricFloor, pattern: FloorPattern) {
        floor.tileableTexture = pattern.TilingTexture;
        floor.tilingOffset = pattern.TilingOffset;
        floor.blendColor = pattern.PatternColor;

        floor.updateMaterial();
    }

    private _offsetWallModuleColorFromCurrentPattern(wall: IsometricWall, offset: number) {
        var temp = new Color();
        Color.lerp(temp, this._dimColor, this._currentWallPattern.PatternColor, offset);

        wall.blendColor = temp;

        wall.updateMaterial();
    }

    private _offsetFloorModuleColorFromCurrentPattern(floor: IsometricFloor, offset: number) {
        var temp = new Color();
        Color.lerp(temp, this._dimColor, this._currentFloorPattern.PatternColor, offset);

        floor.blendColor = temp;

        floor.updateMaterial();
    }

    private _dimWallModules(module: IsometricWall) {
        this._offsetWallModuleColorFromCurrentPattern(module, 0.3);
    }

    private _lightWallModules(module: IsometricWall) {
        this._offsetWallModuleColorFromCurrentPattern(module, 1);
    }

    private _dimFloorModules(module: IsometricFloor) {
        this._offsetFloorModuleColorFromCurrentPattern(module, 0.3);
    }

    private _lightFloorModules(module: IsometricFloor) {
        this._offsetFloorModuleColorFromCurrentPattern(module, 1);
    }
}
