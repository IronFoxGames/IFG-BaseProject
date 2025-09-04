import { Sprite } from 'cc';
import { _decorator, Component, Node, UITransform, RichText, CCInteger } from 'cc';
import { logger } from '../../logging';
const { ccclass, property } = _decorator;

@ccclass('ContentSizeFitter')
export class ContentSizeFitter extends Component {
    @property(Node)
    sizeControllingNode: Node | null = null;

    @property({ type: CCInteger })
    padding: number = 25;

    @property
    fitHeight: boolean = true;

    @property
    fitWidth: boolean = true;

    private currentHeight: number = 0;
    private currentWidth: number = 0;

    private _log = logger.child('ContentSizeFitter');

    onLoad() {
        if (!this.sizeControllingNode) {
            this._log.warn('SizeControl Node reference is not set.');
            return;
        }

        this.currentHeight = this.sizeControllingNode.getComponent(UITransform).height;
        this.currentWidth = this.sizeControllingNode.getComponent(UITransform).width;

        this.adjustParentSize();
    }

    adjustParentSize() {
        if (!this.sizeControllingNode) {
            this._log.warn('SizeControl Node reference is not set.');
            return;
        }

        const nodeTransform = this.sizeControllingNode.getComponent(UITransform);

        if (!nodeTransform) {
            this._log.warn('No UITransform Node Found on the target node');
            return;
        }

        let newHeight: number = this.node.getComponent(UITransform).height;
        let newWidth: number = this.node.getComponent(UITransform).width;

        if (this.fitHeight) {
            newHeight = nodeTransform.contentSize.height + this.padding * 2;
        }
        if (this.fitWidth) {
            newWidth = nodeTransform.contentSize.width + this.padding * 2;
        }

        const parentTransform = this.node.getComponent(UITransform);

        if (!parentTransform) {
            this._log.warn('No UITransform Node Found on the root node');
            return;
        }

        parentTransform.setContentSize(newWidth, newHeight);
    }

    update(deltaTime: number) {
        if (this.fitHeight) {
            if (this.currentHeight != this.sizeControllingNode.getComponent(UITransform).height) {
                this.adjustParentSize();
                this.currentHeight = this.sizeControllingNode.getComponent(UITransform).height;
            }
        }

        if (this.fitWidth) {
            if (this.currentWidth != this.sizeControllingNode.getComponent(UITransform).width) {
                this.adjustParentSize();
                this.currentWidth = this.sizeControllingNode.getComponent(UITransform).width;
            }
        }
    }

    onDestroy() {}
}
