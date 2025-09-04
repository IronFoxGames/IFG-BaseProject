import { _decorator, Component, Node } from 'cc';
import { __private } from 'cc';
import { Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TweenProperty_Position')
export class TweenProperty_Position {

    @property({ type: Vec3})
    targetPosition: Vec3 = new Vec3(); 

    private _targetNode: Node;

    /**
     * @returns Target node for the tween
     */
    public Target(): Node | Component 
    {
        return this._targetNode;
    }            

    /**
     * @returns Built property containing the targeted position
     */
    public BuildProperties() : __private._cocos_tween_tween__ConstructorType<Node>
    {
        return { position: this.targetPosition};
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


