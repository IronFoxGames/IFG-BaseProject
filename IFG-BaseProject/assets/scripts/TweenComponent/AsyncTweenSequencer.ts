import { _decorator, Component, Node } from 'cc';
import { ITweenSequencer } from './ITweenSequencer';
import { TweenSequenceChoice } from './TweenSequenceChoice';
import { TweenSequenceParallelGroup } from './TweenSequenceParallelGroup';
const { ccclass, property } = _decorator;

@ccclass('AsyncTweenSequencer')
export class AsyncTweenSequencer implements ITweenSequencer{    

    private _stopped: boolean = false;    
    private _tweenGroups: (TweenSequenceParallelGroup)[] = [];

    private _tweens: TweenSequenceChoice[];
    private _node: Node;

    private _tweenCallback: () => void;

    public SetupSequence(node: Node, data: TweenSequenceChoice[]): void 
    {       
        this._tweens = data;    
        this._node = node;
    }

    public Start(): void 
    {        
        this._setupTweenGroups();
        this._play();
    }

    public Stop(): void 
    {
        this._stopped = true;
        this._tweenGroups.forEach(tweenGroup => tweenGroup.Stop());
        this._tweenGroups = [];
    }

    public OnTweenEnd(callback: () => void): void 
    {
        this._tweenCallback = callback;
    }
    
    private _setupTweenGroups()
    {
        for(const i of this._tweens)
            {
                i.SetBaseNode(this._node);
    
                let group = new TweenSequenceParallelGroup();
                if (i.IsParallel())
                {                
                    group.AddTweens(i.GetParallelTweens());                    
                }
                else
                {
                    let tweenArray = [];
                    tweenArray.push(i.GetSingleTween());
                    group.AddTweens(tweenArray);
                }
    
                this._tweenGroups.push(group);
            }
    }

    private async _play()
    {
        for (const tweenGroup of this._tweenGroups) 
        {       
            if(tweenGroup instanceof TweenSequenceParallelGroup)
            {
                if (this._stopped)
                {
                    return;
                }

                await tweenGroup.Play();
            }            
        }

        // Avoid calling end callback function if stopped.  Maybe should still call it.  If so, will need to call it above as well
        if (this._stopped)
        {
            return;
        }

        // Successfully completed sequence
        if (this._tweenCallback)
        {            
            this._tweenCallback();
        }
    }
    
}


