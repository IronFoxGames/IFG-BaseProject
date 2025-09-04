import { _decorator, Component, Node } from 'cc';
import { IDraggable } from './IDraggable';
import { Rect } from 'cc';
import { DragManager } from './DragManager';

export interface IDragTarget {
    _dragManager: DragManager;
    _worldRect: Rect;

    ClaimDraggable(draggable: IDraggable, eventString: string);
    CanClaim(): boolean;
    UpdateWorldRect();
    GetWorldRect(): Rect;
    GetNode();
}
