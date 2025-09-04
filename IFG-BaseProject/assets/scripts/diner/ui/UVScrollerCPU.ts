import { Vec3 } from 'cc';
import { _decorator, Component } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('UVScrollerCPU')
@executeInEditMode
export class UVScrollerCPU extends Component {
    @property
    scrollSpeedX: number = 0.0;

    @property
    scrollSpeedY: number = 0.0;

    @property
    travelResetDistance: number = 256; // How far to travel before looping

    private _originalPos = new Vec3();
    private _totalOffsetX = 0;
    private _totalOffsetY = 0;

    start() {
        this._originalPos = this.node.position.clone();
    }

    update(dt: number) {
        const dx = this.scrollSpeedX * dt;
        const dy = this.scrollSpeedY * dt;

        this._totalOffsetX += dx;
        this._totalOffsetY += dy;

        const loopedX = this._totalOffsetX % this.travelResetDistance;
        const loopedY = this._totalOffsetY % this.travelResetDistance;

        this.node.setPosition(this._originalPos.x + loopedX, this._originalPos.y + loopedY, this.node.position.z);
    }
}
