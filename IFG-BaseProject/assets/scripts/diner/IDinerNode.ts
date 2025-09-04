import { Node, SpriteFrame, Vec3 } from 'cc';
import { Requirement } from '../core/model/requirements/Requirement';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { RequirementsService } from '../services/RequirementsService';
import { IVisibleEntity } from './IVisibleEntity';
import { NodeData } from './models/NodeData';
import { PropData } from './models/PropData';
import { PropCatalogue } from './PropCatalogue';

export interface IDinerNode {
    init(cardScrambleService: ICardScrambleService, requirementsService: RequirementsService, catalogue: PropCatalogue);
    getIsStatic(): boolean;
    getTags(): string[];
    getData(): NodeData;
    getVisibleEntity(): IVisibleEntity | null;
    getCurrentPropData(): PropData;
    getIconSpriteFrame(): SpriteFrame;
    getRequirements(): Requirement[];
    verifyRequirements(requirementsService: RequirementsService);
    swapToProp(propData: PropData, saveOnSwap);
    swapToNone(saveOnSwap);
    showPreviewProp(propData: PropData);
    showPreviewNone();
    hidePropPreview();
    getNodeButtonTarget(): Node;
    lightCurrentProp();
    dimCurrentProp();
    playLightingAnimation(duration: number, onAnimationEnded: () => void);
    playSwapAnimation();
    getWorldPosition(): Vec3;
    getCameraSnapPointPosition(): Vec3;
}
