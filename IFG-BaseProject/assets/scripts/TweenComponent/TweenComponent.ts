import { _decorator, Component} from 'cc';
import { TweenSequenceChoice } from './TweenSequenceChoice';
import { ITweenSequencer } from './ITweenSequencer';
import { AsyncTweenSequencer } from './AsyncTweenSequencer';
import { StandardTweenSequencer } from './StandardTweenSequencer';
const { ccclass, property } = _decorator;

@ccclass('TweenComponent')
export class TweenComponent extends Component {
    
    @property
    playOnStart: boolean = false;

    @property([TweenSequenceChoice])
    tweenList: TweenSequenceChoice[] = [];

    // Tween sequencer to use
    private _tweenSequencer: ITweenSequencer = new AsyncTweenSequencer(); // In 3.8.4 and up this could be StandardTweenSequencer
    
    start()
    {    
        if (this.playOnStart)
        {
            this.Start();
        }
    }

    /** 
     * Sets up and starts the custom tween component 
     */
    public Start()
    {
        this._tweenSequencer.SetupSequence(this.node, this.tweenList);        
        this._tweenSequencer.Start();
    }

    /** 
     * Stops the sequence on the TweenComponent
     */
    public Stop()
    {
        this._tweenSequencer.Stop();
    }

    /** 
     * Set a callback for when the tween sequence ends
     * @remarks Could probably be better setup to support multiple callbacks
     */
    public OnTweenEnd(callback: () => void)
    {
        this._tweenSequencer.OnTweenEnd(callback);
    }
}


