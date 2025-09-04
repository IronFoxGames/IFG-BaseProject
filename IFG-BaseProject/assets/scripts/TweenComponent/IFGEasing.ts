import { TweenEasing } from 'cc';
import { geometry } from 'cc';
import { _decorator, Enum } from 'cc';
const { ccclass, property } = _decorator;

enum EasingFunction {
    custom = 0,
    linear = 1,
    smooth = 2,
    fade = 3,
    constant = 4,
    quadIn = 5,
    quadOut = 6,
    quadInOut = 7,
    quadOutIn = 8,
    cubicIn = 9,
    cubicOut = 10,
    cubicInOut = 11,
    cubicOutIn = 12,
    quartIn = 13,
    quartOut = 14,
    quartInOut = 15,
    quartOutIn = 16,
    quintIn = 17,
    quintOut = 18,
    quintInOut = 19,
    quintOutIn = 20,
    sineIn = 21,
    sineOut = 22,
    sineInOut = 23,
    sineOutIn = 24,
    expoIn = 25,
    expoOut = 26,
    expoInOut = 27,
    expoOutIn = 28,
    circIn = 29,
    circOut = 30,
    circInOut = 31,
    circOutIn = 32,
    elasticIn = 33,
    elasticOut = 34,
    elasticInOut = 35,
    elasticOutIn = 36,
    backIn = 37,
    backOut = 38,
    backInOut = 39,
    backOutIn = 40,
    bounceIn = 41,
    bounceOut = 42,
    bounceInOut = 43,
    bounceOutIn = 44
  }


@ccclass('IFGEasing')
export class IFGEasing {
    
    @property({type: Enum(EasingFunction)})
    easingChoice: EasingFunction = EasingFunction.linear;

    @property({visible() {
            return this.easingChoice == EasingFunction.custom;
        }
    })    
    customEasing: geometry.AnimationCurve = new geometry.AnimationCurve;


    public Easing(): TweenEasing | ((k: number) => number)
    {
        if (this.easingChoice != EasingFunction.custom)
        {
            return EasingFunction[this.easingChoice] as TweenEasing;
        }
        else
        {
            return (k: number) => {
                return this.customEasing.evaluate(k);
            }
        }
    }
}


