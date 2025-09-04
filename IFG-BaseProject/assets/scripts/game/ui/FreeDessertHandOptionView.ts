import { Label } from 'cc';
import { Button } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { HandVisual } from './HandVisual';
import { Card, HandName } from '../../core';
import { HandNameToString } from '../../core/enums/HandName';
import { NodeIdentifier } from '../../ui/NodeIdentifier';
const { ccclass, property } = _decorator;

@ccclass('FreeDessertHandOptionView')
export class FreeDessertHandOptionView extends Component {
    @property(Button)
    confirmButton: Button | null = null;

    @property(Label)
    handName: Label | null = null;

    @property(Label)
    handScore: Label | null = null;

    @property(NodeIdentifier)
    nodeIdentifier: NodeIdentifier | null = null;

    public static OnHandConfirmedEvent = 'OnHandConfirmedEvent';

    private _handType: HandName;

    protected onLoad(): void {
        if (this.confirmButton) {
            this.confirmButton.node.on(Button.EventType.CLICK, this._onHandConfirmed, this);
        }
    }

    public setInfo(handName: HandName, handScore: number) {
        this._handType = handName;
        this.handName.string = HandNameToString(handName);
        this.handScore.string = handScore.toString();
    }

    public toggleButton(enabled: boolean) {
        this.confirmButton.interactable = enabled;
    }

    private _onHandConfirmed() {
        this.node.emit(FreeDessertHandOptionView.OnHandConfirmedEvent, this._handType);
    }
}
