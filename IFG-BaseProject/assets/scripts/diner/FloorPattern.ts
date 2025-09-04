import { _decorator, Color, Texture2D, Vec4 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FloorPattern')
export class FloorPattern {
    @property({ type: Color })
    public PatternColor: Color = new Color(Color.WHITE);
    @property({ type: Texture2D })
    public TilingTexture: Texture2D = null;
    @property
    public TilingOffset: Vec4 = new Vec4(1, 1, 0, 0);
}

