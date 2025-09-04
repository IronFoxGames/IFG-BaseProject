import { _decorator, Component, Node } from 'cc';
import { __private } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TweenProperty_PositionToNode')
export class TweenProperty_PositionToNode {

    @property({ type: Node})
    positionTarget: Node; 

    private _targetNode: Node;

    /**
     * @returns Target node for the tween
     */
    public Target(): Node | Component 
    {
        return this._targetNode;
    }            

    /**
     * @returns Built property containing the targeted world position of the target node
     */
    public BuildProperties() : __private._cocos_tween_tween__ConstructorType<Node>
    {
        return { worldPosition: this.positionTarget.getWorldPosition()};
    }
    

    /**
     * Sets the node to operate on for this tween
     * @param node Node to operate on
     */
    public SetTargetNode(node: Node)
    {
        this._targetNode = node;
    }
}


