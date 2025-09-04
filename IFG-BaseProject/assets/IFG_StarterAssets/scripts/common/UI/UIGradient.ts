// UIGradient.ts
import {
    _decorator,
    Color,
    Component,
    Enum,
    Material,
    Sprite,
} from 'cc';

const { ccclass, property, executeInEditMode, requireComponent } = _decorator;

export enum GradientDirection {
  Horizontal = 0,
  Vertical = 1,
}

@ccclass('UIGradient')
@requireComponent(Sprite)
@executeInEditMode()
export class UIGradient extends Component {
  @property({ type: Material, tooltip: 'Material that uses gradient.effect' })
  public gradientMaterial: Material | null = null;

  @property({ type: Enum(GradientDirection) })
  get direction() { return this._direction; }
  set direction(v: GradientDirection) { if (this._direction !== v) { this._direction = v; this._apply(); } }
  private _direction: GradientDirection = GradientDirection.Vertical;

  @property({ tooltip: 'Gradient start color' })
  get startColor() { return this._startColor; }
  set startColor(v: Color) { this._startColor.set(v); this._apply(); }
  private _startColor: Color = new Color(255, 255, 255, 255);

  @property({ tooltip: 'Gradient end color' })
  get endColor() { return this._endColor; }
  set endColor(v: Color) { this._endColor.set(v); this._apply(); }
  private _endColor: Color = new Color(0, 0, 0, 255);

  @property({ tooltip: 'Swap start/end quickly' })
  get reverse() { return this._reverse; }
  set reverse(v: boolean) { if (this._reverse !== v) { this._reverse = v; this._apply(); } }
  private _reverse = false;

  private _sprite: Sprite | null = null;
  private _inst: Material | null = null;

  onLoad() {
    this._sprite = this.getComponent(Sprite)!;
    this._ensureMaterial();
    this._apply();
  }

  onEnable() { this._apply(); }

  onDestroy() {
    if (this._sprite) this._sprite.customMaterial = null;
  }

  private _ensureMaterial() {
    if (!this._sprite || !this.gradientMaterial) return;

    // Make a per-node instance in a version-friendly way
    const inst = new Material();
    inst.copy(this.gradientMaterial);
    this._inst = inst;
    this._sprite.customMaterial = inst;
  }

  private _apply() {
    if (!this._sprite) return;

    if (!this._inst) {
      if (this.gradientMaterial) this._ensureMaterial();
      else return;
    }
    const mat = this._inst!;

    const c0 = this._reverse ? this._endColor : this._startColor;
    const c1 = this._reverse ? this._startColor : this._endColor;
    mat.setProperty('startColor', c0);
    mat.setProperty('endColor', c1);

    // 0.0 = horizontal, 1.0 = vertical
    const axis = (this._direction === GradientDirection.Vertical) ? 1.0 : 0.0;
    mat.setProperty('axis', axis);
  }
}
