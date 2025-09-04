import { _decorator, Component, Node } from 'cc';
import { TweenProperty_Position } from './TweenProperty_Position';
import { TweenProperty_PositionToNode } from './TweenProperty_PositionToNode';
import { TweenProperty_Scale } from './TweenProperty_Scale';
import { TweenProperty_UIOpacity } from './TweenProperty_UIOpacity';
import { __private } from 'cc';
import { Enum } from 'cc';
const { ccclass, property } = _decorator;

enum TweenType
{
    POSITION,
    POSITION_TO_TARGET,
    SCALE,
    UI_OPACITY
}

@ccclass('TweenProperty')
export class TweenProperty {

        @property({type: Enum(TweenType)})
        tweenType: TweenType = TweenType.POSITION;    
    
        // Property that controls Node position
        @property({type: TweenProperty_Position, visible() {return this._propertyVisible(TweenType.POSITION)}})
        positionProperty: TweenProperty_Position = new TweenProperty_Position();
    
        // Property that controls Node position
        @property({type: TweenProperty_PositionToNode, visible() {return this._propertyVisible(TweenType.POSITION_TO_TARGET)}})
        positionToNode: TweenProperty_PositionToNode = new TweenProperty_PositionToNode();
    
        // Property that controls Node scale
        @property({type: TweenProperty_Scale, visible() {return this._propertyVisible(TweenType.SCALE)}})
        scaleProperty: TweenProperty_Scale = new TweenProperty_Scale();
    
        // Property that controls a UIOpacity component
        @property({type: TweenProperty_UIOpacity, visible() {return this._propertyVisible(TweenType.UI_OPACITY)}})
        opacityProperty: TweenProperty_UIOpacity = new TweenProperty_UIOpacity();    
    
        /**
         * Sets the base node for certain properties that expect to operate on the node that the tween component is added to.
         * @param node Target node that Will be passed through to certain properties
         */
        public SetBaseNode(node: Node)
        {
            this.positionProperty.SetTargetNode(node);
            this.positionToNode.SetTargetNode(node);
            this.scaleProperty.SetTargetNode(node);
        }

        /**
         * @returns Target node for this individual tween
         * I think there must be a better way to do this instead of per component, but I'm not quite sure how in a way that keeps the inspector happy
         */
        public GetTarget(): Node|Component
        {
            switch (this.tweenType)
            {
                case TweenType.POSITION:
                    return this.positionProperty.Target();
                case TweenType.POSITION_TO_TARGET:
                    return this.positionToNode.Target();
                case TweenType.SCALE:
                    return this.scaleProperty.Target();
                case TweenType.UI_OPACITY:
                    return this.opacityProperty.Target();
            }
        }
    
        /**
         * @returns Properties for this individual tween
         */
        public GetProperties(): __private._cocos_tween_tween__ConstructorType<any>
        {        
            switch (this.tweenType)
            {
                case TweenType.POSITION:
                    return this.positionProperty.BuildProperties();
                case TweenType.POSITION_TO_TARGET:
                    return this.positionToNode.BuildProperties();
                case TweenType.SCALE:
                    return this.scaleProperty.BuildProperties();
                case TweenType.UI_OPACITY:
                    return this.opacityProperty.BuildProperties();
            }
        }        
        
        private _propertyVisible(tweenType: TweenType): boolean
        {
            return this.tweenType == tweenType;
        }
}


