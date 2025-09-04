import { ProgressBar } from 'cc';
import { _decorator, Component, macro } from 'cc';
import { RichText } from 'cc';
import { logger } from '../logging';

const { ccclass, property } = _decorator;

@ccclass
export class LoadingScreen extends Component {
    @property(RichText)
    loadingText: RichText;

    @property(RichText)
    tipText: RichText;

    @property(ProgressBar)
    progressBar: ProgressBar;

    private _visible: boolean;
    private _timer: number;
    private _loadingTextIndex: number = 0;
    private _loadingText: string[] = ['Loading', 'Loading.', 'Loading..', 'Loading...'];
    private _log = logger.child('LoadingScreen');

    onLoad() {
        this._timer = 0.0;
        this._visible = true;
        this.node.active = true;
    }

    update(deltaTime: number) {
        if (this._visible) {
            this._timer -= deltaTime * 1000; // ms
        }
    }

    public show(minShowTime: number = 0.5, loadingTipText: string[] = []) {
        this._timer = minShowTime;
        this._loadingTextIndex = 0;
        this._animateLoadingText();
        this._loadTipText(loadingTipText);
        this.node.active = true;
        this.schedule(this._animateLoadingText, 0.25, macro.REPEAT_FOREVER);
    }

    public hide(onHideCallback: () => void) {
        // If we have a min loading screen show time, schedule the close upon remaining time elapsed
        if (this._timer > 0) {
            setTimeout(() => this._hideLoading(onHideCallback), this._timer);
        } else {
            this._hideLoading(onHideCallback);
        }
    }

    public setLoadingProgress(percent: number) {
        this.progressBar.progress = percent;
    }

    private _hideLoading(onHideCallback: () => void) {
        this.node.active = false;
        this.unschedule(this._animateLoadingText);

        this._log.debug('Calling Load Complete');
        onHideCallback();
    }

    private _animateLoadingText() {
        this.loadingText.string = `${this._loadingText[this._loadingTextIndex]}`;
        this._loadingTextIndex = (this._loadingTextIndex + 1) % this._loadingText.length;
    }

    private _loadTipText(loadingTipText: string[] = []) {
        if (loadingTipText.length > 0) {
            const randomIndex = Math.floor(Math.random() * loadingTipText.length);
            this.tipText.string = `${loadingTipText[randomIndex]}`;
            this.tipText.node.active = true;
        } else {
            this.tipText.node.active = false;
        }
    }
}
