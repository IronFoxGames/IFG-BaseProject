import { _decorator, Component, Node } from 'cc';
import { Iso2DGeometrySpriteRenderer } from './Iso2DGeometrySpriteRenderer';
const { ccclass, property } = _decorator;

@ccclass('FloorModule')
export class FloorModule extends Component {
    @property({ type: Iso2DGeometrySpriteRenderer })
    public FloorRenderer: Iso2DGeometrySpriteRenderer | null = null;

    start() {

    }

    update(deltaTime: number) {
        
    }
}

