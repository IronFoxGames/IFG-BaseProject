import { tween } from 'cc';
import { UIOpacity, Tween, } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export enum FadeType {
    FADE_IN = 'fadeIn',
    FADE_OUT = 'fadeOut',
    FADE_OUT_IN = 'fadeOutIn',
}

@ccclass('ScreenFader')
export class ScreenFader extends Component {
    private _uiOpacity: UIOpacity = null;
    private _tweens: any[] = [];
    private _fading: boolean = false;

    start() {
        this._uiOpacity = this.getComponent(UIOpacity)
        this._uiOpacity.opacity = 0;

        if (!this._uiOpacity) {
            console.error('ScreenFader UI opacity component is not present.');
            return;
        }
    }

    // Fade in and show the screen
    public fadeIn(duration: number, callback: () => void) {
        if (this._fading) {
            this.cleanup();
        }
        this._fading = true;
    
        const fadeInTween = tween(this._uiOpacity)
            .to(duration, { opacity: 0 })
            .call(() => {
                if (callback) {
                    callback();
                }
                this._fading = false;
                this.cleanup();
            });
        this._tweens.push(fadeInTween);
        fadeInTween.start();
    }
    
    // Fade out and hide the screen
    public fadeOut(duration: number, callback: () => void) {
        if (this._fading) {
            this.cleanup();
        }
        this._fading = true;
    
        const fadeOutTween = tween(this._uiOpacity)
            .to(duration, { opacity: 255 })
            .call(() => {
                if (callback) {
                    callback();
                }
                this._fading = false;
                this.cleanup();
            });
        this._tweens.push(fadeOutTween);
        fadeOutTween.start();
    }

    public fadeOutIn(duration: number, callback: () => void) {
        if (this._fading) {
            this.cleanup();
        }
        this._fading = true;
        let timePerHalf = duration / 2;

        const fadeOutInTween = tween(this._uiOpacity)
            .to(timePerHalf, { opacity: 255 })
            .to(timePerHalf, { opacity: 0 })
            .call(() => {
                if (callback) {
                    callback();
                }
                this._fading = false;
                this.cleanup();
            }
        );
        this._tweens.push(fadeOutInTween);
        fadeOutInTween.start();
    }


    private cleanup() {
        this._tweens.forEach(tween => {
            tween.stop();
        });
        this._tweens = [];
    }

    protected onDestroy(): void {
        for (const tween of this._tweens) {
            tween.stop();
        }
        this._tweens = [];
    }
}

