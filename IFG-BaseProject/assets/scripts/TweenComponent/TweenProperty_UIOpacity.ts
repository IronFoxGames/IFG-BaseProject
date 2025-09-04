import { _decorator, Component, Node } from 'cc';
import { UIOpacity } from 'cc';
import { __private } from 'cc';
import { CCInteger } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TweenProperty_UIOpacity')
export class TweenProperty_UIOpacity {

    @property({ type: UIOpacity})
    uiOpacityComponent: UIOpacity;     

    @property({type: CCInteger})
    uiOpacityTarget: number = 255;    

    /**
     * @returns Targeted UIOpacity component
     */
    public Target(): Node | Component 
    {
        return (this.uiOpacityComponent)
    }
    
    /**
     * @returns Built property containing the desired opacity of the targeted UIOpacity component
     */
    public BuildProperties() : __private._cocos_tween_tween__ConstructorType<UIOpacity>
    {
        return { opacity: this.uiOpacityTarget};
    }
    
}


