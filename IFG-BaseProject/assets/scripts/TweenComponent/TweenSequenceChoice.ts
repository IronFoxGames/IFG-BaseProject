import { _decorator, Node } from 'cc';
import { TweenData } from './TweenData';
const { ccclass, property } = _decorator;

@ccclass('TweenSequenceChoice')
export class TweenSequenceChoice 
{
    @property
    parallel: boolean = false;

    @property({type: TweenData, visible() { return !this.parallel}})
    singleTween: TweenData = new TweenData();
    
    @property({type: [TweenData], visible() { return this.parallel}})
    parallelTweens: TweenData[] = [];

    /**
     * @returns Whether this tween in the sequence is a group of parallel tweens or a single tween
     */
    public IsParallel(): boolean
    {
        return this.parallel;
    }

    /**
     * @param node Base node that the component lives on, to be passed down to {@link TweenData}
     */
    public SetBaseNode(node: Node)
    {
        this.singleTween.SetNode(node);
        for(const i of this.parallelTweens)
        {
            i.SetNode(node);
        }
    }

    /**
     * @returns The single tween property set as a property 
     */
    public GetSingleTween(): TweenData
    {
        return this.singleTween;
    }

    /**
     * @returns The list of parallel tweens set as a property
     */
    public GetParallelTweens(): TweenData[]
    {
        return this.parallelTweens;
    }
}


