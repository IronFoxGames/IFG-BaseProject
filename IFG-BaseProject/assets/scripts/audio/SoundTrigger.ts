import { _decorator, Component, Node,  } from 'cc';
import { SoundManager } from './SoundManager';
import { Button } from 'cc';
import { Toggle } from 'cc';
const { ccclass, property, menu } = _decorator;

@ccclass('SoundTrigger')
@menu('Audio/UI Sound Trigger')
export class UISoundTrigger extends Component {
    @property
    public soundName: string = '';

    start() {
        if (this.getComponent(Toggle) != null) {
            this.getComponent(Toggle)?.node.on('toggle', this.playSFX, this);
        }
        if (this.getComponent(Button) != null) {
            this.getComponent(Button)?.node.on('click', this.playSFX, this);
        }
    }

    playSFX() {
        SoundManager.instance.playSound(this.soundName);
    }

    protected onDestroy(): void {}
}
