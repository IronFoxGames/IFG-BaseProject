import { Rect } from 'cc';
import { DragManager } from './DragManager';
import { IDragTarget } from './IDragTarget';

export interface IDraggable {
    _dragManager: DragManager;
    _worldRect: Rect;
    _activeTarget: IDragTarget;

    OnDragStart();
    OnDragEnd();
    UpdateWorldRect();
    GetNode();
    GetWorldRect(): Rect;
    CancelDrag();
    GetActiveTarget(): IDragTarget;
    SetActiveTarget(dragTarget: IDragTarget);
}
