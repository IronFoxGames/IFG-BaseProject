import { _decorator, Component, Node } from 'cc';
import { __private } from 'cc';
import { Tween } from 'cc';
import { Enum } from 'cc';
import { CCFloat } from 'cc';
import { IFGEasing } from './IFGEasing';
const { ccclass, property } = _decorator;

export enum MotionType
{
    DELAY,
    TO,
    BY,
}

@ccclass('TweenBase')
export abstract class TweenBase {

    @property({type: CCFloat})
    tweenDuration: number = 1;

    @property({type: Enum(MotionType)})
    motionType:MotionType = MotionType.TO;

    @property({type: IFGEasing, visible() { return !this._hideParameters()}})
    easeFunction: IFGEasing = new IFGEasing();

    @property({visible() { return !this._hideParameters()}})
    repeat:boolean = false;

    @property({visible() { return this.repeat == true && !this._hideParameters()}})
    repeatCount: number = 1;

    
    BuildTween(): Tween<Node|Component>
    {
        let tween = new Tween<Node|Component>();        

        switch (this.motionType)
        {
            case MotionType.DELAY:
                tween.delay(this.tweenDuration);
                break;
            case MotionType.TO:
                tween.target(this.Target()).to(this.tweenDuration, this.buildProperties(), {easing: this.easeFunction.Easing()});
                break;
            case MotionType.BY:
                tween.target(this.Target()).by(this.tweenDuration, this.buildProperties(), {easing: this.easeFunction.Easing()});
                break;
        }        

        if (this.repeat)
        {
            tween = tween.repeat(this.repeatCount);
        }

        return tween;
    }

    abstract Target(): Node | Component;       
    protected abstract buildProperties(): __private._cocos_tween_tween__ConstructorType<Node|Component>

    
    /**
     * Used to hide properties when DELAY is selected
     */
    private _hideParameters(): boolean 
    {
        if (this.motionType == MotionType.DELAY)
        {
            return true;
        }

        return false;
    }
}


