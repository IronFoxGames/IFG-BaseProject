import { _decorator, Component, Node, rect, Rect, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NodeUtilities')
export class NodeUtilities extends Component {
    static GetWorldBoundingBox(node: Node): Rect {
        if (node.parent) {
            node.parent.updateWorldTransform();

            const uiTrans = node.getComponent(UITransform)!;
            let width = uiTrans.contentSize.width;
            let height = uiTrans.contentSize.height;
            let newRect = rect(-uiTrans.anchorPoint.x * width, -uiTrans.anchorPoint.y * height, width, height);

            node.updateWorldTransform();
            newRect = newRect.transformMat4(node.worldMatrix);

            return newRect;
        } else {
            return node.getComponent(UITransform).getBoundingBox();
        }
    }
}
