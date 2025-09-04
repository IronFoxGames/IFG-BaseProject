import { CCFloat } from 'cc';
import { Enum } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { IFGEasing } from './IFGEasing';
import { TweenProperty } from './TweenProperty';
import { Tween } from 'cc';
const { ccclass, property } = _decorator;

enum TweenAction
{
    DELAY,
    TO,
    BY
}

@ccclass('TweenData')
export class TweenData 
{    
    @property({type: Enum(TweenAction)})
    tweenAction: TweenAction = TweenAction.TO;    

    @property({type: CCFloat})
    tweenDuration: number = 1;

    @property({type: IFGEasing, visible() { return !this._hideParameters()}})
    easeFunction: IFGEasing = new IFGEasing();

    @property({visible() { return !this._hideParameters()}})
    repeat:boolean = false;

    @property({visible() { return this.repeat == true && !this._hideParameters()}})
    repeatCount: number = 1;

    @property({type:TweenProperty, visible() { return !this._hideParameters()}})
    tweenProperty: TweenProperty = new TweenProperty();

    private _baseNode: Node;

    /**
     * Set the base node for the tween. 
     * @param node Base node that the component lives on
     */
    public SetNode(node: Node)
    {
        this._baseNode = node;
        this.tweenProperty?.SetBaseNode(node);    
    }

    /**
     * @returns A single {@link Tween<Node|Component>} constructed from the set properties
     */
    public BuildTween(): Tween<Node|Component>
    {
        let tween = new Tween<Node|Component>();
        
        switch (this.tweenAction)
        {
            case TweenAction.DELAY:
                tween = tween.target(this._baseNode).delay(this.tweenDuration);
                break;
            case TweenAction.TO:
                tween = tween.target(this.tweenProperty.GetTarget()).to(this.tweenDuration, this.tweenProperty.GetProperties(), {easing: this.easeFunction.Easing()});
                break;
            case TweenAction.BY:
                tween = tween.target(this.tweenProperty.GetTarget()).by(this.tweenDuration, this.tweenProperty.GetProperties(), {easing: this.easeFunction.Easing()});
                break;
        }        

        if (this.repeat)
        {
            tween = tween.repeat(this.repeatCount);
        }

        return tween;
    }
    

    private _hideParameters(): boolean 
    {
        if (this.tweenAction == TweenAction.DELAY)
        {
            return true;
        }

        return false;
    }

}


