import { _decorator, Color, Texture2D, Vec4 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WallPattern')
export class WallPattern {
    @property({ type: Color })
    public PatternColor: Color = new Color(Color.WHITE);
    @property({ type: Color })
    public CutawayColor: Color = new Color(Color.WHITE);
    @property({ type: Texture2D })
    public TilingTexture: Texture2D = null;
    @property({ type: Texture2D })
    public SideTextureNW: Texture2D = null;
    @property({ type: Texture2D })
    public SideTextureNE: Texture2D = null;
    @property({ type: Texture2D })
    public TopTexture: Texture2D = null;
    @property
    public TilingOffset: Vec4 = new Vec4(1, 1, 0, 0);
}
