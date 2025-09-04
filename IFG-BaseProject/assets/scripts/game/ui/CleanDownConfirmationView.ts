import { Button } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { logger } from '../../logging';
const { ccclass, property } = _decorator;

@ccclass('CleanDownConfirmationView')
export class CleanDownConfirmationView extends Component {
    @property(Button)
    confirmButton: Button | null = null;

    @property(Button)
    cancelButton: Button | null = null;

    public static OnConfirmPressedEvent = 'OnConfirmPressedEvent';
    public static OnCancelPressedEvent = 'OnCancelPressedEvent';

    private _log = logger.child('CleanDownConfirmationView');

    protected onLoad(): void {
        if (this.confirmButton) {
            this.confirmButton.node.on(Button.EventType.CLICK, this._onConfirmPressed, this);
        } else {
            this._log.error('ConfirmButton reference not set.');
        }

        if (this.cancelButton) {
            this.cancelButton.node.on(Button.EventType.CLICK, this._onCancelPressed, this);
        } else {
            this._log.error('CancelButton reference not set.');
        }
    }

    private _onConfirmPressed() {
        this.node.emit(CleanDownConfirmationView.OnConfirmPressedEvent);
    }

    private _onCancelPressed() {
        this.node.emit(CleanDownConfirmationView.OnCancelPressedEvent);
    }
}
