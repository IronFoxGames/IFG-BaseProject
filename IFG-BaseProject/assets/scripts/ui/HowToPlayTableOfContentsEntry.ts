import { _decorator, Component, SpriteFrame, Label, Sprite, Widget } from 'cc';
import { logger } from '../logging';
import { Color } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HowToPlayTableOfContentsEntry')
export class HowToPlayTableOfContentsEntry extends Component {
    @property({ type: Label, visible: true })
    private _nameLabel: Label = null;

    @property({ type: Sprite, visible: true })
    private _sprite: Sprite = null;

    @property({ type: Widget, visible: true })
    private _widget: Widget = null;

    @property({ type: SpriteFrame, visible: true })
    private _defaultSprite: SpriteFrame = null;

    @property({ type: SpriteFrame, visible: true })
    private _selectedSprite: SpriteFrame = null;

    @property({ type: Color, visible: true })
    private _defaultColor: Color = new Color(255, 255, 255, 255);

    @property({ type: Color, visible: true })
    private _selectedColor: Color = new Color(255, 255, 255, 255);

    start() {
        if (!this._nameLabel) {
            logger.error('HowToPlayScoreEntry: nameLabel is not set');
        }
        if (!this._sprite) {
            logger.error('HowToPlayScoreEntry: sprite is not set');
        }
        if (!this._defaultSprite) {
            logger.error('HowToPlayScoreEntry: defaultSprite is not set');
        }
        if (!this._selectedSprite) {
            logger.error('HowToPlayScoreEntry: selectedSprite is not set');
        }
        if (!this._sprite) {
            logger.error('HowToPlayScoreEntry: sprite is not set');
        }
        if (!this._widget) {
            logger.error('HowToPlayScoreEntry: widget is not set');
        }
        this._sprite.spriteFrame = this._defaultSprite;
    }

    init(name: string) {
        this._nameLabel.string = name;
    }

    setActive(active: boolean, rightOffset: number) {
        this._sprite.spriteFrame = active ? this._selectedSprite : this._defaultSprite;
        this._widget.right = rightOffset;
        this._widget.updateAlignment();
        this._nameLabel.color = active ? this._selectedColor : this._defaultColor;
    }
}
