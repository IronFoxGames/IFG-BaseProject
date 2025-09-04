import { _decorator, Component, Node } from 'cc';
import { Vec3 } from 'cc';
import { __private } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TweenProperty_Scale')
export class TweenProperty_Scale
{
    @property({ type: Vec3})
    targetScale: Vec3 = new Vec3(); 

    private _targetNode: Node;

    /**
     * @returns Target node for the tween
     */
    public Target(): Node | Component 
    {
        return this._targetNode;
    }     

    /**
     * @returns Built property containing the targeted scale
     */
    public BuildProperties() : __private._cocos_tween_tween__ConstructorType<Node>
    {
        return { scale: this.targetScale};
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


