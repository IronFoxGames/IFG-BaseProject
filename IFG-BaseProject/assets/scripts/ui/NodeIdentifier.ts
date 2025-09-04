import { _decorator, Component, director, CCString, Vec2, UITransform, Size, CCBoolean } from 'cc';
import { App } from '../state/App';
import { UIOverlayService } from '../services/UIOverlayService';
const { ccclass, property } = _decorator;

@ccclass('NodeIdentifier')
export class NodeIdentifier extends Component {
    @property({ type: CCString, visible: true })
    private _identifier: string;

    @property({ type: CCBoolean, visible: true })
    private _sizeIsOverridden: boolean = false;

    @property({
        type: Size,
        visible: function (this: NodeIdentifier) {
            return this._sizeIsOverridden;
        }
    })
    private _overrideSize: Size = new Size(0, 0);

    private _uiOverlayService: UIOverlayService = null;

    onLoad() {
        const app = director.getScene()?.getChildByName('App')?.getComponent(App);
        if (app) {
            this._uiOverlayService = app.Services.UIOverlayService;
            this._uiOverlayService.registerNode(this._identifier, this.node);
        }
    }

    public setIdentifier(identifier: string): void {
        this._identifier = identifier;
        if (this._uiOverlayService) {
            this._uiOverlayService.registerNode(this._identifier, this.node);
        }
    }

    public isSizeOverriden(): boolean {
        return this._sizeIsOverridden;
    }

    public getSize(): Size {
        return this._overrideSize;
    }

    protected onDestroy(): void {
        if (this._uiOverlayService) {
            this._uiOverlayService.unregisterNode(this._identifier);
        }
    }
}
