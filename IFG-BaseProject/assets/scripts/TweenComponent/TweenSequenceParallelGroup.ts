import { Tween } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { TweenData } from './TweenData';

export class TweenSequenceParallelGroup 
{
    private _activeTweens: Tween<Node|Component>[] = [] // Tracking of the actual Tweens that are built from the TweenData
    private _pendingTweenPromises: (() => void)[] = []; 

    /**
     * Add the list of TweenData to build a parallel tween sequence out of
     */
    AddTweens(tweenList: TweenData[]) {

        this._activeTweens = [];
        
        for (const i of tweenList)
        {
            const tween = i.BuildTween();
            this._activeTweens.push(tween);
        }
    }

    /**
     * Async function that plays the given list of parallel tweens.  Waits for each tween to complete.
     */
    public async Play() 
    {
        this._pendingTweenPromises = [];

        await Promise.all(this._activeTweens.map(tween => this.runTween(tween)));
        
        this._pendingTweenPromises = [];
    }

    /**
     * Stops each active tween in the parallel group
     */
    public Stop()
    {        
        this._activeTweens.forEach(tween => tween.stop()); // Stop the actual tween
        this._activeTweens = [];

        this._pendingTweenPromises.forEach(resolve => resolve()); // Resolve the promise 
        this._pendingTweenPromises = [];
    }

    private runTween<T>(nextTween: Tween<Node|Component>): Promise<void> {
        return new Promise(resolve => 
        {   
            this._pendingTweenPromises.push(resolve);
            nextTween.call(resolve).start(); // Resolve the promise when the tween finishes
        });
    }
}


