import { _decorator, Node } from 'cc';
import { TweenSequenceChoice } from './TweenSequenceChoice';

export interface ITweenSequencer 
{
    SetupSequence(node: Node, data: TweenSequenceChoice[]): void;
    Start(): void;
    Stop(): void;
    OnTweenEnd(callback: () => void): void;
}


