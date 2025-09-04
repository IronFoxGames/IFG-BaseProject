import { _decorator, Component, Node, SpriteFrame, Button, JsonAsset, Prefab, Label, Sprite, resources, instantiate } from 'cc';
import { logger } from '../logging';
const { ccclass, property } = _decorator;

@ccclass('HowToPlayScoreEntry')
export class HowToPlayScoreEntry extends Component {
    @property({ type: Sprite })
    icon: Sprite = null;

    @property({ type: Label })
    nameLabel: Label = null;

    @property({ type: Label })
    descriptionLabel: Label = null;

    @property({ type: Label })
    scoreLabel: Label = null;

    init(name: string, description: string, score: number) {
        this.nameLabel.string = name;
        this.descriptionLabel.string = description;
        this.scoreLabel.string = score.toString();
    }

    setSpriteFrame(spriteFrame: SpriteFrame) {
        this.icon.spriteFrame = spriteFrame;
    }
}
