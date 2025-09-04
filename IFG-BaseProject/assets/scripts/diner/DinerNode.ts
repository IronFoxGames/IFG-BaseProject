import {
    _decorator,
    CCString,
    Color,
    Component,
    instantiate,
    JsonAsset,
    Node,
    Prefab,
    Rect,
    Sprite,
    SpriteFrame,
    tween,
    UITransform,
    Vec3
} from 'cc';
import { PropSwappedEventData } from '../core/model/PropSwappedEventData';
import { Requirement } from '../core/model/requirements/Requirement';
import { logger } from '../logging';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { RequirementsService } from '../services/RequirementsService';
import { ResourceLoader } from '../utils/ResourceLoader';
import { IDinerNode } from './IDinerNode';
import { IVisibleEntity } from './IVisibleEntity';
import { NodeData } from './models/NodeData';
import { PropData } from './models/PropData';
import { PropCatalogue } from './PropCatalogue';
const { ccclass, property } = _decorator;

@ccclass('DinerNode')
export class DinerNode extends Component implements IDinerNode, IVisibleEntity {
    @property({ type: CCString, visible: true })
    private _resourcePath: string = '';

    @property({ type: Node, visible: true })
    private _propHandle: Node = null;

    @property({ type: Node, visible: true })
    private _nodeButtonTarget: Node = null;

    @property({ type: Node, visible: true })
    private _cameraSnapPoint: Node = null;

    @property({ type: SpriteFrame, visible: true })
    private _iconSpriteFrame: SpriteFrame = null;

    private _data: NodeData = null;

    private _currentProp: Node = null;

    private _currentPropData: PropData = null;

    private _previewProp: Node = null;

    private _selectable: boolean = false;

    private _cardScrambleService: ICardScrambleService;

    private _instancingProp: boolean = false;

    private _lightAnimationActive: boolean = false;
    private _lightAnimationOffset: number = 0;
    private _dimColor: Color = new Color(Color.BLACK);
    private _litColor: Color = new Color(Color.WHITE);
    private _log = logger.child('DinerNode');

    private _boundingRect: Rect = new Rect();

    public async init(cardScrambleService: ICardScrambleService, requirementsService: RequirementsService, catalogue: PropCatalogue) {
        const nodeJson = await ResourceLoader.load(this._resourcePath, JsonAsset);

        this._data = NodeData.fromObject(nodeJson.json);

        this._cardScrambleService = cardScrambleService;

        this.verifyRequirements(requirementsService);

        if (this._cardScrambleService.hasNodeSaveData(this._data.id)) {
            //If the player has placed something in this node before, put it back!
            const propId = this._cardScrambleService.getNodeSaveData(this._data.id).propId;

            if (propId !== '') {
                //If the prop id isn't the "none" id...
                let propData: PropData = catalogue.getPropWithId(propId);

                if (!propData) {
                    this._log.warn(`prop for propId[${propId}] is not found; defaulting to static`);

                    // Get the static prop data
                    propData = catalogue.getPropWithId(this._data.defaultPropId);
                }

                await this._tryInstanceProp(propData, false);
            }
        } else if (this._data.isStatic) {
            //Otherwise, if the node is a static, it must have something in it, and we should give it the designated default prop.
            let propData: PropData = catalogue.getPropWithId(this._data.defaultPropId);

            if (propData) {
                await this._tryInstanceProp(propData, false);
            } else {
                this._log.warn(`default prop propId[${this._data.defaultPropId}] is not found`);
            }
        }
    }

    public update(deltaTime: number) {
        if (this._lightAnimationActive) {
            this._offsetPropColorFromCurrentColor(this._lightAnimationOffset);
        }
    }

    public getIsStatic(): boolean {
        return this._data.isStatic;
    }

    public getTags(): string[] {
        return this._data.tags;
    }

    public getData(): NodeData {
        return this._data;
    }

    public getVisibleEntity(): IVisibleEntity | null {
        return this;
    }

    public getCurrentPropData(): PropData {
        return this._currentPropData;
    }

    public getIconSpriteFrame(): SpriteFrame {
        return this._iconSpriteFrame;
    }

    public getRequirements(): Requirement[] {
        return this._data.requirements;
    }

    public verifyRequirements(requirementsService: RequirementsService) {
        this._selectable = requirementsService.checkRequirementsMet(this._data.requirements);
    }

    public async swapToProp(propData: PropData, saveOnSwap: boolean = true) {
        if (propData == null) {
            return this.swapToNone(saveOnSwap);
        }

        if (!this._selectable) {
            this._log.warn(
                `Swpping to the prop "${propData.id}" in node "${this._data.id}" while it is not selectable. This should not happen outside of a task context.`
            );
        }

        const swapResult = await this._tryInstanceProp(propData, false);
        if (!swapResult) {
            return;
        }

        if (saveOnSwap) {
            const saveResult = await this._cardScrambleService.onPropSwapped(
                this._data.id,
                new PropSwappedEventData(propData.id, propData, this._data)
            );
            if (saveResult) {
                this._log.debug(`Successfully saved the prop "${propData.id}" to the node "${this._data.id}" in player save data.`);
            } else {
                this._log.error(`Failed to save the prop "${propData.id}" to the node "${this._data.id}" in player save data.`);
            }
        }
    }

    public async swapToNone(saveOnSwap: boolean = true) {
        if (!this._selectable) {
            this._log.warn(
                `Swapping to none in node "${this._data.id}" while it is not selectable. This should not happen outside of a task context.`
            );
        }

        if (this._data.isStatic) {
            this._log.error('Attempted to swap to none on a static node!');
        } else {
            if (this._currentProp != null) {
                this._currentProp.destroy();
                this._currentProp = null;
                this._currentPropData = null;
            }
            if (saveOnSwap) {
                const saveResult = await this._cardScrambleService.onPropSwapped(this._data.id, new PropSwappedEventData('', null, this._data));
                if (saveResult) {
                    this._log.debug(`Successfully saved the prop "none" to the node "${this._data.id}" in player save data.`);
                } else {
                    this._log.error(`Failed to save the prop "none" to the node "${this._data.id}" in player save data.`);
                }
            }
        }
    }

    public async showPreviewProp(propData: PropData) {
        // If the prop is the same as the current prop exit preview mode
        if (this._currentPropData != null && this._currentPropData.id === propData?.id) {
            console.log(`${this.node.name} is exiting Preview mode!`);
            this.hidePropPreview();
            return;
        }

        console.log(`${this.node.name} is entering Preview mode!`);

        let instancingResult = false;

        if (!this._selectable) {
            this._log.warn(
                `Previewing a prop "${propData?.id}" in node "${this._data.id}" while it is not selectable. This should not happen outside of a task context.`
            );
        }

        instancingResult = await this._tryInstanceProp(propData, true);

        if (this._currentProp && instancingResult) {
            this._currentProp.active = false;
        }
    }

    public showPreviewNone() {
        if (!this._selectable) {
            this._log.warn(
                `Previewing none in node "${this._data.id}" while it is not selectable. This should not happen outside of a task context.`
            );
        }

        if (this._data.isStatic) {
            this._log.error('Attempted to preview none on a static node!');
        } else {
            if (this._previewProp != null) {
                this._previewProp.destroy();
                this._previewProp = null;
            }
        }

        if (this._currentProp) {
            this._currentProp.active = false;
        }
    }

    public hidePropPreview() {
        this._log.debug(`${this.node.name} is exiting Preview mode!`);

        if (this._previewProp != null) {
            this._previewProp.destroy();
            this._previewProp = null;
        }

        if (this._currentProp) {
            this._currentProp.active = true;
        }
    }

    public getNodeButtonTarget(): Node {
        return this._nodeButtonTarget; //TODO: This should return the node button postion of the current prop if there is one, and otherwise return its internal button position
    }

    public lightCurrentProp() {
        if (!this._currentProp) {
            this._log.debug(`Attempting to light a prop in a node: ${this._data.id} with no prop...`);
            return;
        }

        this._offsetPropColorFromCurrentColor(1);
    }

    public dimCurrentProp() {
        if (!this._currentProp) {
            this._log.debug(`Attempting to dim a prop in a node: ${this._data.id} with no prop...`);
            return;
        }

        this._offsetPropColorFromCurrentColor(0.3);
    }

    public playLightingAnimation(duration: number, onAnimationEnded: () => void) {
        if (!this._currentProp) {
            return;
        }

        if (this._lightAnimationActive) {
            this._log.warn('Attempting to double play prop lighting animaiton...');
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
                this.lightCurrentProp();
                this._lightAnimationActive = false;
                onAnimationEnded?.call(this);
            })
            .start();

        this._lightAnimationActive = true;
    }

    public playSwapAnimation() {
        // Pop the node bigger and then elsatically back to 1.0 scale to emphasize the swap
        tween(this._currentProp)
            .to(0.1, { scale: new Vec3(1.2, 1.2, 1.2) })
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'elasticOut' })
            .start();
    }

    public getWorldPosition(): Vec3 {
        return this.node.worldPosition;
    }

    public getCameraSnapPointPosition(): Vec3 {
        if (this._cameraSnapPoint === null) {
            this._log.warn(`Attempting to get the position of a null camera snap point in node: ${this._data.id}`);
            return this.getWorldPosition();
        }

        return this._cameraSnapPoint.worldPosition;
    }

    private _offsetPropColorFromCurrentColor(offset: number) {
        if (!this._currentProp) {
            return;
        }

        const sprites = this._currentProp.getComponentsInChildren(Sprite);

        var temp = new Color();
        Color.lerp(temp, this._dimColor, this._litColor, offset);

        for (const sprite of sprites) {
            sprite.color = temp;
        }
    }

    private async _tryInstanceProp(data: PropData, preview: boolean): Promise<boolean> {
        try {
            if (!this._instancingProp) {
                if (!data || PropData.validateProp(data.tags, this._data.tags)) {
                    if (!preview) {
                        await this._instanceProp(data);
                        return true;
                    } else {
                        const result = await this._instancePreviewProp(data);
                        return result;
                    }
                } else {
                    this._log.error(`Invalid prop passed to node called: ${this.name}`);
                    return false;
                }
            } else {
                this._log.warn(`Please wait before instancing another prop!`);
                return false;
            }
        } catch (e) {
            this._log.error(e);
        }
    }

    getBoundingRect(): Rect {
        return this._boundingRect;
    }

    setVisible(visible: boolean) {
        if (this._propHandle) {
            this._propHandle.active = visible;
        }
    }

    private _calcBoundingRect() {
        const sprites = this.node.getComponentsInChildren(Sprite);
        if (sprites.length === 0) return;

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const sprite of sprites) {
            const transform = sprite.node.getComponent(UITransform);
            if (!transform) continue;

            const bounds = transform.getBoundingBoxToWorld();

            minX = Math.min(minX, bounds.xMin);
            minY = Math.min(minY, bounds.yMin);
            maxX = Math.max(maxX, bounds.xMax);
            maxY = Math.max(maxY, bounds.yMax);
        }

        this._boundingRect = new Rect(minX, minY, maxX - minX, maxY - minY);
    }

    private async _instanceProp(data: PropData) {
        this._instancingProp = true;

        if (this._currentProp != null) {
            this._currentProp.destroy();
            this._currentProp = null;
            this._currentPropData = null;
        }

        this._currentPropData = data;

        if (!data) {
            return;
        }

        try {
            const prefab = await ResourceLoader.load(data.assetFilePath, Prefab);
            this._currentProp = instantiate(prefab);
            this._currentProp.setParent(this._propHandle);
            this._instancingProp = false;
            this._calcBoundingRect();
        } catch (error) {
            this._log.error('Error loading prefab:', error);
        }
    }

    private async _instancePreviewProp(data: PropData): Promise<boolean> {
        if (data?.id === this._currentPropData?.id) {
            return false;
        }

        if (this._previewProp != null) {
            this._previewProp.destroy();
            this._previewProp = null;
        }

        if (!data) {
            return true;
        }

        this._instancingProp = true;
        try {
            const prefab = await ResourceLoader.load(data.assetFilePath, Prefab);
            this._previewProp = instantiate(prefab);
            this._previewProp.setParent(this._propHandle);
            this._calcBoundingRect();
            this._instancingProp = false;
        } catch (error) {
            this._log.error('Error loading prefab:', error);
            return false;
        }

        return true;
    }
}
