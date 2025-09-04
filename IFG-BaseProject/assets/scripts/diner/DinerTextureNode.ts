import { _decorator, CCString, Component, JsonAsset, Node, SpriteFrame, Texture2D, Vec3 } from 'cc';
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

@ccclass('DinerTextureNode')
export class DinerTextureNode extends Component implements IDinerNode {
    public OnUpdatePatternTexture: (texture: Texture2D) => void;

    @property({ type: CCString, visible: true })
    private _resourcePath: string = '';

    @property({ type: Node, visible: true })
    private _nodeButtonTarget: Node = null;

    @property({ type: Node, visible: true })
    private _cameraSnapPoint: Node = null;

    @property({ type: SpriteFrame, visible: true })
    private _iconSpriteFrame: SpriteFrame = null;

    private _data: NodeData = null;

    private _currentPropData: PropData = null;

    private _selectable: boolean = false;

    private _cardScrambleService: ICardScrambleService;

    private _applyingPattern: boolean = false;

    private _currentTexture: Texture2D = null;

    private _log = logger.child('DinerWallNode');

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

                await this._tryApplyWallPattern(propData, false);
            }
        } else if (this._data.isStatic) {
            //Otherwise, if the node is a static, it must have something in it, and we should give it the designated default prop.
            let propData: PropData = catalogue.getPropWithId(this._data.defaultPropId);

            if (propData) {
                await this._tryApplyWallPattern(propData, false);
            } else {
                this._log.warn(`default prop propId[${this._data.defaultPropId}] is not found`);
            }
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
        return null;
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
            return this._log.error('Attempted to swap to a null wall pattern.');
        }

        if (!this._selectable) {
            this._log.warn(
                `Swpping to the prop "${propData.id}" in node "${this._data.id}" while it is not selectable. This should not happen outside of a task context.`
            );
        }

        const swapResult = await this._tryApplyWallPattern(propData, false);
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
                `Swpping to none in node "${this._data.id}" while it is not selectable. This should not happen outside of a task context.`
            );
        }

        if (this._data.isStatic) {
            this._log.error('Attempted to swap to none on a static node!');
        }

        this._log.error(
            `Attempted to swap to none on a Wall Pattern, this should not be possible. Please ensure this node[${this._data.id}] is marked static.`
        );
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

        instancingResult = await this._tryApplyWallPattern(propData, true);
    }

    public showPreviewNone() {
        if (!this._selectable) {
            this._log.warn(
                `Previewing none in node "${this._data.id}" while it is not selectable. This should not happen outside of a task context.`
            );
        }

        this._log.error(
            `Attempted to preview none on a Wall Pattern, this should not be possible. Please ensure this node[${this._data.id}] is marked static.`
        );
    }

    public hidePropPreview() {
        this._log.debug(`${this.node.name} is exiting Preview mode!`);

        this.OnUpdatePatternTexture.call(this, this._currentTexture);
    }

    public getNodeButtonTarget(): Node {
        return this._nodeButtonTarget; //TODO: This should return the node button postion of the current prop if there is one, and otherwise return its internal button position
    }

    public lightCurrentProp() {
        //No op! Wall lighting is handled by rooms.
    }

    public dimCurrentProp() {
        //No op! Wall lighting is handled by rooms.
    }

    public playLightingAnimation(duration: number, onAnimationEnded: () => void) {
        //No op! Wall lighting is handled by rooms.
    }

    public playSwapAnimation() {
        //No op -- Unless we come up with an effective way to animate this change.
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

    private async _tryApplyWallPattern(data: PropData, preview: boolean): Promise<boolean> {
        try {
            if (!this._applyingPattern) {
                if (!data || PropData.validateProp(data.tags, this._data.tags)) {
                    if (!preview) {
                        await this._applyWallPattern(data);
                        return true;
                    } else {
                        const result = await this._previewWallPattern(data);
                        return result;
                    }
                } else {
                    this._log.error(`Invalid prop passed to node called: ${this.name}`);
                    return false;
                }
            } else {
                this._log.warn(`Please wait before applying another pattern!`);
                return false;
            }
        } catch (e) {
            this._log.error(e);
        }
    }

    private async _applyWallPattern(data: PropData) {
        this._applyingPattern = true;

        this._currentPropData = data;

        if (!data) {
            return;
        }

        try {
            const texture = await ResourceLoader.load(data.assetFilePath, Texture2D);
            this._currentTexture = texture;
            this.OnUpdatePatternTexture.call(this, texture);
            this._applyingPattern = false;
        } catch (error) {
            this._log.error('Error loading texture:', error);
        }
    }

    private async _previewWallPattern(data: PropData): Promise<boolean> {
        if (data?.id === this._currentPropData?.id) {
            return false;
        }

        if (!data) {
            return true;
        }

        this._applyingPattern = true;
        try {
            const texture = await ResourceLoader.load(data.assetFilePath, Texture2D);
            this.OnUpdatePatternTexture.call(this, texture);
            this._applyingPattern = false;
        } catch (error) {
            this._log.error('Error loading texture:', error);
            return false;
        }

        return true;
    }
}
