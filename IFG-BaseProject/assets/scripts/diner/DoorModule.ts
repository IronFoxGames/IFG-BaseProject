import { _decorator, Component, Node, Sprite, Color } from 'cc';
import { logger } from '../logging';
import { Rect } from 'cc';
import { UITransform } from 'cc';
import { IVisibleEntity } from './IVisibleEntity';
const { ccclass, property } = _decorator;

@ccclass('DoorModule')
export class DoorModule extends Component implements IVisibleEntity {
    public get isUnlocked(): boolean {
        return this._isUnlocked;
    }

    @property({ type: Color, visible: true })
    private _litColor: Color;

    @property({ type: Color, visible: true })
    private _dimColor: Color;

    @property({ type: Node, visible: true })
    private _loweredStateNode: Node;

    @property({ type: Node, visible: true })
    private _openStateNode: Node;

    @property({ type: Node, visible: true })
    private _lockedStateNode: Node;

    private _sprites: Sprite[] = [];
    private _isUnlocked: boolean;
    private _isLowered: boolean;

    private _boundingRect: Rect = new Rect();

    private _log = logger.child('DoorModule');

    public init() {
        this._sprites = this.getComponentsInChildren(Sprite);
        this._calcBoundingRect();
    }

    public unlock() {
        this._isUnlocked = true;

        if (!this._isLowered) {
            this.raise();
        }
    }

    public raise() {
        if (this._isUnlocked) {
            this._setState(DoorState.Open);
        } else {
            this._setState(DoorState.Locked);
        }
        this._isLowered = false;
    }

    public lower() {
        this._setState(DoorState.Lowered);
        this._isLowered = true;
    }

    public light() {
        this.offsetColorFromCurrentColor(1);
    }

    public dim() {
        this.offsetColorFromCurrentColor(0.3);
    }

    public offsetColorFromCurrentColor(offset: number) {
        var temp = new Color();
        Color.lerp(temp, this._dimColor, this._litColor, offset);

        for (const sprite of this._sprites) {
            sprite.color = temp;
        }
    }

    // IVisibleEntity implementations

    public getBoundingRect(): Rect {
        return this._boundingRect;
    }

    public setVisible(visible: boolean) {
        this.node.active = visible;
    }

    private _setState(state: DoorState) {
        switch (state) {
            case DoorState.Locked: {
                this._lockedStateNode.active = true;
                this._openStateNode.active = false;
                this._loweredStateNode.active = false;
                break;
            }
            case DoorState.Open: {
                this._lockedStateNode.active = false;
                this._openStateNode.active = true;
                this._loweredStateNode.active = false;
                break;
            }
            case DoorState.Lowered: {
                this._lockedStateNode.active = false;
                this._openStateNode.active = false;
                this._loweredStateNode.active = true;
                break;
            }
            default: {
                this._log.error('Unsupported DoorState passed to _setState in DoorModule.');
            }
        }
    }

    private _calcBoundingRect() {
        if (this._sprites.length === 0) return;

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const sprite of this._sprites) {
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
}

export enum DoorState {
    Locked,
    Open,
    Lowered
}
