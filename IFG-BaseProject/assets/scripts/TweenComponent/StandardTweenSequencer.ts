import { _decorator, Component, Node } from 'cc';
import { ITweenSequencer } from './ITweenSequencer';
import { TweenSequenceChoice } from './TweenSequenceChoice';
import { Tween } from 'cc';
import { tween } from 'cc';

export class StandardTweenSequencer implements ITweenSequencer{

    private _tween: Tween<Node|Component>;
    private _tweenCallback: () => void;

    /**
     * Sets up a single Tween to represent the entitre sequence with the node and list of TweenSequenceChoice.
     */
    SetupSequence(node: Node, data: TweenSequenceChoice[]): void 
    {       
        let finalTween = tween(node);

        let sequenceArray = [];
        for (const i of data)
        {
            if (i.IsParallel())
            {
                // Warn for using a single one here?
                const tweenDataArray = i.GetParallelTweens();
                let tweenArray = [];
                for (const j of tweenDataArray)
                {
                    const tween = j.BuildTween();
                    tweenArray.push(tween);                    
                }

                if (tweenArray.length > 1)
                {
                    sequenceArray.push(tween().parallel(...tweenArray));
                }
                else
                {
                    sequenceArray.push(tween().then(tweenArray[0]));
                }
            }
            else
            {
                let tween = i.GetSingleTween().BuildTween();
                sequenceArray.push(tween);
            }            
        }

        if (sequenceArray.length > 1)
        {
            finalTween.sequence(...sequenceArray);
        }
        else
        {
            finalTween.then(sequenceArray[0]);
        }

        finalTween.call(() =>
        {
            if (this._tweenCallback)
            {
                this._tweenCallback();
            }
        });

        this._tween = finalTween;
    }

    /**
     * Starts the single built tween
     */
    Start(): void 
    {
        this._tween.start();   
    }

    /**
     * Stops the single built tween
     */
    Stop(): void 
    {
        this._tween.stop();
    }

    /**
     * Sets the function to call when the tween is completed
     */
    OnTweenEnd(callback: () => void): void 
    {
        this._tweenCallback = callback;
    }
}


