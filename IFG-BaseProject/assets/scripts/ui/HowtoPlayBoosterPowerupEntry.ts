import { _decorator, Component, Node, SpriteFrame, Button, JsonAsset, Prefab, Label, Sprite, resources, instantiate } from 'cc';
import { logger } from '../logging';
const { ccclass, property } = _decorator;

@ccclass('HowToPlayBoosterPowerupEntry')
export class HowToPlayBoosterPowerupEntry extends Component {
    @property({ type: Sprite })
    icon: Sprite = null;

    @property({ type: Label })
    nameLabel: Label = null;

    @property({ type: Label })
    descriptionLabel: Label = null;

    init(name: string, description: string) {
        this.nameLabel.string = name;
        this.descriptionLabel.string = description;
    }

    setSpriteFrame(spriteFrame: SpriteFrame) {
        this.icon.spriteFrame = spriteFrame;
    }
}
