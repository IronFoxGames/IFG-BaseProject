import { _decorator, Component, Node } from 'cc';
import { UIElementAnimator } from './UIElementAnimator';
import { Button } from 'cc';
import { UITransform } from 'cc';
import { Layout } from 'cc';
import { Widget } from 'cc';
import { director, game } from 'cc';
import { CCString } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ViewController')
export class ViewController extends Component {
    @property(UIElementAnimator)
    public UIElementAnimators: UIElementAnimator[] = [];

    @property({ type: Node, visible: true })
    private _scrim: Node;

    @property({ type: CCString, visible: true })
    protected _menuId: string = '';

    public async show(): Promise<void> {
        await this._playInAnimation();
    }

    public async hide(): Promise<void> {
        await this._playOutAnimation();
    }

    private async _playInAnimation(): Promise<void> {
        if (this._scrim && !this._scrim.active) {
            this._scrim.active = true;
        }
        await Promise.all(this.UIElementAnimators.map((animator) => animator.PlayInAnimation()));
    }

    private async _playOutAnimation(): Promise<void> {
        if (this._scrim && this._scrim.active) {
            this._scrim.active = false;
        }
        await Promise.all(this.UIElementAnimators.map((animator) => animator.PlayOutAnimation()));
    }
}
