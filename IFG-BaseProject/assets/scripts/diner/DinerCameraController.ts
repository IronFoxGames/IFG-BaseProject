import {
    _decorator,
    Component,
    Node,
    Vec3,
    Quat,
    input,
    Input,
    EventMouse,
    Camera,
    tween,
    Tween,
    Rect,
    EventTouch,
    view,
    screen,
    EPSILON
} from 'cc';

const { ccclass, property } = _decorator;
import { logger } from '../logging';
import { Vec2 } from 'cc';
import { math } from 'cc';

@ccclass('DinerCameraController')
export class DinerCameraController extends Component {
    @property
    public Boundaries: Rect = new Rect(-10, 5, 30, 20);
    @property
    public HardBoundaries: Rect = new Rect(-15, 0, 40, 30);

    @property
    public ReturnAnimationDuration = 0.5;

    private isOutOfBounds: boolean = false;

    private lastMousePosition: Vec3 = new Vec3();
    private isDragging: boolean = false;
    private isMomentumPanning: boolean = false;

    @property
    public zoomSpeed: number = 0.3;

    @property
    public hardMinZoom: number = 6;
    @property
    public softMinZoom: number = 7;
    @property
    public softMaxZoom: number = 12;
    @property
    public hardMaxZoom: number = 13;
    @property
    public moveSpeed: number = 0.01;

    @property
    public startingOrthoHeight = 8.5;

    private _zoomTween: Tween<Camera> | null = null;
    private _panTween: Tween<Node> | null = null;
    private _velocity = new Vec3();
    private _cameraComponent: Camera = null;
    private _lastCameraAR: number = 16 / 9;
    private _cutsceneActive: boolean;
    private _log = logger.child('DinerCameraController');

    public start() {
        // Register mouse input events
        input.on(Input.EventType.TOUCH_START, this.onTouchDown, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);

        this._cameraComponent = this.getComponent(Camera);

        this._cameraComponent.orthoHeight = this.startingOrthoHeight;
    }

    public update(dt: number): void {
        if (!this.isDragging && this.isMomentumPanning === true) {
            // Apply camera velocity from previous drag
            this._panCamera(this._velocity);
            this._velocity = Vec3.multiplyScalar(this._velocity, this._velocity, 0.9);
            const velocityMagSquared = Vec3.lengthSqr(this._velocity);
            if (velocityMagSquared < 0.001) {
                this.isMomentumPanning = false;

                let isOutOfBounds = false;
                let targetTweenPosition = new Vec3(this.node.position);
                if (this.node.position.x < this.Boundaries.x) {
                    targetTweenPosition.x = this.Boundaries.x;
                    isOutOfBounds = true;
                } else if (this.node.position.x > this.Boundaries.x + this.Boundaries.width) {
                    targetTweenPosition.x = this.Boundaries.x + this.Boundaries.width;
                    isOutOfBounds = true;
                }
                if (this.node.position.y < this.Boundaries.y) {
                    targetTweenPosition.y = this.Boundaries.y;
                    isOutOfBounds = true;
                } else if (this.node.position.y > this.Boundaries.y + this.Boundaries.height) {
                    targetTweenPosition.y = this.Boundaries.y + this.Boundaries.height;
                    isOutOfBounds = true;
                }

                if (isOutOfBounds) {
                    this._panTween = tween(this.node)
                        .to(
                            0.3,
                            {
                                position: targetTweenPosition
                            },
                            { easing: 'quadOut' }
                        )
                        .start();
                }
            }
        }

        this._adjustCameraRect();
    }

    private onTouchDown(event: EventTouch) {
        if (this._cutsceneActive) {
            return;
        }

        if (!this.isOutOfBounds) {
            // Left mouse button
            this.isDragging = true;
            this.lastMousePosition.set(event.getLocation().x, event.getLocation().y, 0);
        }
    }

    private onTouchMove(event: EventTouch) {
        if (this._cutsceneActive) {
            return;
        }

        const touches = event.getTouches();

        if (this.isDragging) {
            // Left mouse button
            const posA: Vec2 = touches[0].getLocation();
            const deltaA: Vec2 = touches[0].getDelta();
            let prevA = new Vec2();
            Vec2.subtract(prevA, posA, deltaA);
            const panDeltaA = new Vec3(posA.x - prevA.x, posA.y - prevA.y, 0);

            let move = Vec3.multiplyScalar(new Vec3(), panDeltaA, this.moveSpeed);

            if (touches.length >= 2) {
                const posB: Vec2 = touches[1].getLocation();
                const deltaB: Vec2 = touches[1].getDelta();
                let prevB = new Vec2();
                Vec2.subtract(prevB, posB, deltaB);
                const panDeltaB = new Vec3(posB.x - prevB.x, posB.y - prevB.y, 0);

                let panDeltaResultant = new Vec3();
                Vec3.add(panDeltaResultant, panDeltaA, panDeltaB);

                move = Vec3.multiplyScalar(new Vec3(), panDeltaResultant, this.moveSpeed);

                let prevDistance = new Vec2();

                Vec2.subtract(prevDistance, prevA, prevB);

                let currentDistance = new Vec2();

                Vec2.subtract(currentDistance, posA, posB);

                let prevMagnitude = Math.sqrt(Math.pow(prevDistance.x, 2) + Math.pow(prevDistance.y, 2));

                let currentMagnitude = Math.sqrt(Math.pow(currentDistance.x, 2) + Math.pow(currentDistance.y, 2));

                const touchDelta = currentMagnitude - prevMagnitude;

                const zoomAmount = touchDelta * this.zoomSpeed * -0.01;
                this._zoomCamera(zoomAmount);
            }

            move.multiply(new Vec3(-1, -1, 1)); //Invert the move vector on the x-axis and y-axis to make the camera move the intended direction

            // Use the camera's rotation to determine the movement direction
            const camera = this.node;
            const rotation = Quat.fromEuler(new Quat(), 0, camera.eulerAngles.y, 0);
            const moveVec = Vec3.transformQuat(new Vec3(), move, rotation);

            this._panCamera(this._velocity);

            this._velocity = moveVec;
        }
    }

    private onTouchEnd(event: EventTouch) {
        this.isDragging = false;
        this.isDragging = false;
        this.lastMousePosition.set(0, 0, 0); // Clear last position
        this.isMomentumPanning = true;
    }

    private onMouseWheel(event: EventMouse) {
        if (this._cutsceneActive) {
            return;
        }

        const zoomAmount = event.getScrollY() * this.zoomSpeed * -0.01;
        this._zoomCamera(zoomAmount);
    }

    public onDestroy() {
        // Clean up event listeners
        input.off(Input.EventType.TOUCH_START, this.onTouchDown, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }

    public setCutseneActive(active: boolean) {
        this._cutsceneActive = active;
    }

    public onSnapCameraToPosition(position: Vec3) {
        const camera = this.node;
        camera.worldPosition = new Vec3(position.x, position.y, camera.position.z);
    }

    public tweenCameraToPosition(position: Vec3, onTweenEnd: () => void, panAndZoomDuration: number = 2.5, endDelayDuration: number = 0.5) {
        let target = new Vec3(position);
        target.z = this.node.worldPosition.z;

        tween(this.node).to(panAndZoomDuration, { worldPosition: target }, { easing: 'cubicInOut' }).start();

        tween(this._cameraComponent)
            .to(panAndZoomDuration, { orthoHeight: this.hardMinZoom }, { easing: 'cubicInOut' })
            .delay(endDelayDuration)
            .call(() => {
                onTweenEnd.call(this);
            })
            .start();
    }

    public shakeCamera(duration: number, intensity: number, onComplete: () => void) {
        const originalPosition = this.node.position.clone();
        const startTime = Date.now();

        const shake = () => {
            if (Date.now() - startTime >= duration * 1000) {
                this.node.position = originalPosition;
                onComplete();
                return;
            }

            const randomOffset = new Vec3((Math.random() - 0.5) * intensity * 2, (Math.random() - 0.5) * intensity * 2, 0);

            tween(this.node)
                .to(0.05, { position: originalPosition.add(randomOffset) })
                .to(0.05, { position: originalPosition })
                .call(shake)
                .start();
        };
        shake();
    }

    private _panCamera(deltaPosition: Vec3) {
        if (this._cutsceneActive) {
            return;
        }

        // Cancel any pan tweens
        if (this._panTween) {
            this._panTween.stop();
            this._panTween = null;
        }

        let newPosition = Vec3.add(this.node.position, this.node.position, deltaPosition);

        // Cap position to hard boundaries
        const x = Math.min(this.HardBoundaries.x + this.HardBoundaries.width, Math.max(this.HardBoundaries.x, newPosition.x));
        const y = Math.min(this.HardBoundaries.y + this.HardBoundaries.height, Math.max(this.HardBoundaries.y, newPosition.y));
        newPosition.set(x, y, newPosition.z);

        this.node.position = newPosition;
    }

    private _zoomCamera(zoomAmount: number) {
        if (this._cutsceneActive) {
            return;
        }

        // Cancel any ongoing tween
        if (this._zoomTween) {
            this._zoomTween.stop();
            this._zoomTween = null;
        }

        this._cameraComponent.orthoHeight = Math.min(
            Math.max(this._cameraComponent.orthoHeight + zoomAmount, this.hardMinZoom),
            this.hardMaxZoom
        );

        if (this._cameraComponent.orthoHeight > this.softMaxZoom) {
            this._zoomTween = tween(this._cameraComponent)
                .delay(0.03)
                .to(0.3, { orthoHeight: this.softMaxZoom }, { easing: 'quadOut' })
                .call(() => {
                    this._zoomTween = null;
                })
                .start();
        } else if (this._cameraComponent.orthoHeight < this.softMinZoom) {
            this._zoomTween = tween(this._cameraComponent)
                .delay(0.03)
                .to(0.3, { orthoHeight: this.softMinZoom }, { easing: 'quadOut' })
                .call(() => {
                    this._zoomTween = null;
                })
                .start();
        }
    }

    private _adjustCameraRect() {
        const expectedAR = view.getDesignResolutionSize().x / view.getDesignResolutionSize().y;
        const actualAR = screen.windowSize.width / screen.windowSize.height;
        if (Math.abs(actualAR - this._lastCameraAR) < EPSILON) {
            return;
        }

        // Adjust the camera rect
        let newRect = this._cameraComponent.rect.clone();
        if (actualAR > expectedAR) {
            // Screen is too wide, adjust the width
            const scaleFactor = expectedAR / actualAR;
            const rawX = (1 - scaleFactor) / 2;
            const rawWidth = scaleFactor;

            newRect.x = Math.ceil(rawX * 1000) / 1000;
            newRect.width = Math.floor(rawWidth * 1000) / 1000;
            newRect.y = 0;
            newRect.height = 1; // Keep full height
        } else {
            // Screen is too tall, adjust the height
            const scaleFactor = actualAR / expectedAR;
            newRect.y = (1 - scaleFactor) / 2; // Center the camera vertically
            newRect.height = scaleFactor; // Scale the height
            newRect.x = 0;
            newRect.width = 1; // Keep full width
        }

        this._cameraComponent.rect = newRect;
        this._lastCameraAR = actualAR;
        this._log.info(`Adjusted Camera Rect: `, this._cameraComponent.rect);
    }
}
