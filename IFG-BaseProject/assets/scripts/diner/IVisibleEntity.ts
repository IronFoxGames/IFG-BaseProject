import { Rect } from 'cc';

export interface IVisibleEntity {
    /**
     * Returns the bounding rect of this object in world space for visibility testing.
     */
    getBoundingRect(): Rect;
    setVisible(visible: boolean);
}
