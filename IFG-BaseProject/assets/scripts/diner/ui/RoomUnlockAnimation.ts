import { Label } from 'cc';
import { _decorator, Component, Node, Animation } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RoomUnlockAnimation')
export class RoomUnlockAnimation extends Component {
    @property({ type: Animation, visible: true })
    private _animation: Animation;

    @property({ type: Label, visible: true })
    private _roomNameLabel: Label;

    public initializeAndPlay(roomName: string, onAnimationEnded: () => void) {
        this._roomNameLabel.string = roomName.toUpperCase();

        this._animation.on(Animation.EventType.FINISHED, onAnimationEnded, this);

        this._animation.play();
    }

    start() {}

    update(deltaTime: number) {}
}
