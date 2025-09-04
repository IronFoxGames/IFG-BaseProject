import { _decorator, Component, Node, Vec3, UITransform } from 'cc';
import { IDraggable } from './IDraggable';
import { IDragTarget } from './IDragTarget';
import { Gameboard } from '../Gameboard';
import { BoardTile } from '../BoardTile';
import { GripCard } from '../GripCard';
import { PlayerHand } from '../PlayerHand';
import { TileState } from '../../core';
const { ccclass, property } = _decorator;

@ccclass('DragManager')
export class DragManager extends Component {
    @property(UITransform)
    tileAnimationParent: UITransform | null = null;

    private _dragTargets: IDragTarget[] = [];
    private _currentDraggable: IDraggable | null = null;
    private _activeDragTarget: IDragTarget | null = null;
    private _gameboard: Gameboard | null = null;
    private _tweenActive: boolean = false;

    public setGameboard(gameboard: Gameboard) {
        this._gameboard = gameboard;
    }

    public IsDragActive(): boolean {
        return this._currentDraggable !== null;
    }

    public getActiveDraggable(): IDraggable {
        return this._currentDraggable;
    }

    public canInteract(): boolean {
        return !this._tweenActive;
    }

    public setTweenActive(isActive: boolean) {
        this._tweenActive = isActive;
    }

    public AddDragTarget(dragTarget: IDragTarget): void {
        if (this._dragTargets.indexOf(dragTarget) === -1) {
            this._dragTargets.push(dragTarget);
        }
    }

    public RemoveDragTarget(dragTarget: IDragTarget): void {
        const index = this._dragTargets.indexOf(dragTarget);
        if (index >= 0) {
            this._dragTargets.splice(index, 1);

            if (this.IsDragActive() && this._activeDragTarget === dragTarget) {
                this._activeDragTarget = null;
            }
        }
    }

    public CardTappedFromBoard(card: GripCard, boardTile: BoardTile) {
        this._gameboard.onBoardTileTapComplete(card, boardTile);
    }

    public BeginDrag(draggable: IDraggable, worldPos: Vec3) {
        this._currentDraggable = draggable;
        this._activeDragTarget = null;
        let draggableNode = this._currentDraggable.GetNode();
        let cardSlot = draggableNode.getComponent(GripCard).getCardSlot();

        if (cardSlot !== null) {
            cardSlot.removeCardFromSlot(this.tileAnimationParent.node);
        } else {
            draggableNode.parent = this.tileAnimationParent.node;
        }

        draggableNode.setWorldPosition(worldPos);
        this.node.emit('drag-started');
    }

    public EndDrag() {
        let possibleTargets: IDragTarget[] = [];

        this._dragTargets.forEach((target) => {
            if (target.GetWorldRect().intersects(this._currentDraggable.GetWorldRect()) && target.CanClaim()) {
                possibleTargets.push(target);
            }
        });

        if (possibleTargets.length === 0) {
            this._currentDraggable.CancelDrag();
            this._currentDraggable = null;
            this._activeDragTarget = null;

            return;
        }

        let chosenTarget: IDragTarget = possibleTargets[0];

        possibleTargets.forEach((target) => {
            if (
                Vec3.distance(target.GetNode().getWorldPosition(), this._currentDraggable.GetNode().getWorldPosition()) <
                Vec3.distance(chosenTarget.GetNode().getWorldPosition(), this._currentDraggable.GetNode().getWorldPosition())
            ) {
                chosenTarget = target;
            }
        });

        const boardTile: BoardTile = chosenTarget.GetNode().getComponent(BoardTile);
        const previousDraggableTarget = this._currentDraggable.GetActiveTarget();

        if (boardTile !== null) {
            this.node.emit(
                'drag-ended',
                true,
                boardTile.getTileModelState() == TileState.Occupied_Unflipped &&
                    previousDraggableTarget.GetNode().getComponent(BoardTile) === null
            );
        } else {
            this.node.emit('drag-ended', false, false);
        }

        if (chosenTarget.CanClaim()) {
            chosenTarget.ClaimDraggable(this._currentDraggable, 'board-tile-touch-end');
        } else {
            this._currentDraggable.CancelDrag();
        }

        this._currentDraggable = null;
        this._activeDragTarget = null;
    }

    public OnDragCancelled(dragTarget: IDragTarget) {
        const boardTile: BoardTile = dragTarget.GetNode().getComponent(BoardTile);
        const draggableTarget = this._currentDraggable.GetActiveTarget();

        if (boardTile !== null) {
            this.node.emit('drag-ended', true, draggableTarget.GetNode().getComponent(BoardTile) === null);
        } else {
            this.node.emit('drag-ended', false, false);
        }
    }
}
