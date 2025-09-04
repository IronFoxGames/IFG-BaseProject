import { Label } from 'cc';
import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { logger } from '../../logging';
import { RichText } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PreGameGoalView')
export class PreGameGoalView extends Component {
    @property({ type: Sprite, visible: true })
    private _goalIconSprite: Sprite;

    @property({ type: Sprite, visible: true })
    private _checkmarkIconSprite: Sprite;

    @property({ type: RichText, visible: true })
    private _goalText: RichText;

    private _log = logger.child('PreGameGoalView');

    public setGoalText(goalText: string) {
        this._goalText.string = goalText;
    }

    public setCompleted(completed: boolean) {
        this._checkmarkIconSprite.node.active = completed;
    }

    //TODO: Call this once we have objective icons to set up
    public setIcon(isActive: boolean, sprite: SpriteFrame = null) {
        this._goalIconSprite.node.active = isActive;

        if (sprite) {
            this._goalIconSprite.spriteFrame = sprite;
        }
    }

    public show() {
        if (this.node) {
            this.node.active = true;
        } else {
            this._log.error('Node is not defined!');
        }
    }

    public hide() {
        if (this.node) {
            this.node.active = false;
        } else {
            this._log.error('Node is not defined!');
        }
    }
}
