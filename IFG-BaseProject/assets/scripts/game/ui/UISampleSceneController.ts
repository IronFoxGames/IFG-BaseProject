import { _decorator, Component, Button, EventHandler, Node } from 'cc';
import { UIElementAnimator } from 'db://assets/scripts/game/ui/UIElementAnimator';

const { ccclass, property } = _decorator;

@ccclass('UISampleSceneController')
export class UISampleSceneController extends Component {
    @property(Button)
    public TestButton: Button = null;

    @property(Button)
    public SkipButton: Button = null;

    @property(UIElementAnimator)
    public UIElementAnimators: UIElementAnimator[] = [];

    _testElementsVisible: boolean = false;

    public start() {
        const testClickEventHandler = new EventHandler();

        testClickEventHandler.target = this.node;

        testClickEventHandler.component = 'UISampleSceneController';
        testClickEventHandler.handler = '_testCallback';

        this.TestButton.clickEvents.push(testClickEventHandler);

        const skipClickEventHandler = new EventHandler();

        skipClickEventHandler.target = this.node;

        skipClickEventHandler.component = 'UISampleSceneController';
        skipClickEventHandler.handler = '_skipCallback';

        this.SkipButton.clickEvents.push(skipClickEventHandler);
    }

    public update(deltaTime: number) {}

    private _testCallback() {
        if (this._testElementsVisible) {
            this.UIElementAnimators.forEach(this._playTestOutAnimation);
        } else {
            this.UIElementAnimators.forEach(this._playTestInAnimation);
        }

        this._testElementsVisible = !this._testElementsVisible;
    }

    private _skipCallback() {
        this.UIElementAnimators.forEach(this._skipAnimationInProgress);
    }

    private _playTestInAnimation(animator: UIElementAnimator) {
        animator.PlayInAnimation();
    }

    private _playTestOutAnimation(animator: UIElementAnimator) {
        animator.PlayOutAnimation();
    }

    private _skipAnimationInProgress(animator: UIElementAnimator) {
        animator.SkipCurrentAnimation();
    }
}
