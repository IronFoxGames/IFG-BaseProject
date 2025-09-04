import { _decorator, Component, Node, Vec3, tween, Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export class CardDragInstructor extends Component {
    @property(Node)
    cursor: Node | null = null;

    @property({ tooltip: 'Number of times the drag tween plays' })
    private repetitions = 3;

    @property({ tooltip: 'The duration of each drag tween' })
    private duration = 0.6;

    @property({ tooltip: 'The duration that the cursor remains on the drag position after dragging' })
    private pauseDuration = 0.4;

    @property({ tooltip: 'Rotation to apply to the cursor in degrees' })
    private rotation: Vec3 = new Vec3(0, 0, 0);

    private _startPos: Vec3;
    private _endPos: Vec3;
    private _isRunning: boolean = false;
    private _tweenHandle: Tween<Node> | null = null;

    onLoad() {
        this.cursor.active = false;
    }

    public init(startPos: Vec3, endPos: Vec3) {
        this._startPos = startPos;
        this._endPos = endPos;

        this.cursor.setRotationFromEuler(this.rotation);
        this.cursor.setWorldPosition(this._startPos);
    }

    public start() {
        this.cursor.active = true;
        this._isRunning = true;

        const runOnce = () =>
            tween(this.cursor)
                .delay(this.pauseDuration)
                .to(this.duration, { worldPosition: this._endPos }, { easing: 'quadOut' })
                .delay(this.pauseDuration)
                .call(() => {
                    this.cursor.active = false;
                    this.cursor.setWorldPosition(this._startPos);
                })
                .delay(0.1)
                .call(() => {
                    this.cursor.active = true;
                });

        let sequence = runOnce();
        for (let i = 1; i < this.repetitions; i++) {
            sequence = sequence.then(runOnce());
        }

        this._tweenHandle = sequence
            .call(() => {
                this._isRunning = false;
                this.cursor.active = false;
            })
            .start();
    }

    public stop() {
        this.cursor.active = false;
        if (this._tweenHandle) {
            this._tweenHandle.stop();
            this._tweenHandle = null;
        }
        this._isRunning = false;
    }

    public isRunning(): boolean {
        return this._isRunning;
    }
}
