import { _decorator, Component, Label, Sprite, SpriteFrame } from 'cc';
import { CCInteger } from 'cc';
import { logger } from '../logging';

const { ccclass, property } = _decorator;

@ccclass('BGSpriteTileMapping')
export class BGSpriteTileMapping {
    @property({ type: CCInteger, tooltip: 'The tile bit pattern representing neighbors' })
    bitFlags: number = 0;

    @property({ type: CCInteger, tooltip: 'The match mask to apply before comparing mask' })
    matchMask: number = 0b11111111;

    @property({ type: SpriteFrame, tooltip: 'The sprite to use for this mask' })
    spriteFrame: SpriteFrame | null = null;
}

@ccclass
export class BoardTileBG extends Component {
    @property(Sprite)
    background: Sprite | null = null;

    @property(CCInteger)
    neighbourBitFlags: number = 0;

    @property(Label)
    debugLabel: Label | null = null;

    @property({ type: [BGSpriteTileMapping], tooltip: 'Mapping of tile masks to sprite frames' })
    tileMappings: BGSpriteTileMapping[] = [];

    private _log = logger.child('BoardTileBG');

    onLoad() {
        this.background.node.active = true;
        this.debugLabel.node.active = false;
    }

    start() {}

    public init(x: number, y: number, neighbourBitFlags: number) {
        this.node.name = `bgTile_${x}_${y}`;
        this.debugLabel.string = `${x},${y}`;
        this.neighbourBitFlags = neighbourBitFlags;

        if (neighbourBitFlags === 0) {
            this.background.enabled = false;
            return;
        }

        const tileMapping = this.tileMappings.find((mapping) => {
            if ((neighbourBitFlags & mapping.matchMask) === mapping.bitFlags) {
                return mapping;
            }
        });

        if (!tileMapping) {
            this.background.enabled = false;
            this._log.warn(`BG Tile (${x}, ${y}): no mapping rule for pattern ${neighbourBitFlags}`);
            return;
        }

        this.background.enabled = true;
        this.background.spriteFrame = tileMapping.spriteFrame;
    }
}
