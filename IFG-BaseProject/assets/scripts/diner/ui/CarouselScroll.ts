import {
    _decorator,
    Button,
    CCBoolean,
    Component,
    EPSILON,
    EventTouch,
    input,
    Input,
    instantiate,
    Node,
    Prefab,
    tween,
    UITransform,
    Vec3
} from 'cc';
import { logger } from '../../logging';
const { ccclass, property } = _decorator;

@ccclass('CarouselScroll')
export class CarouselScroll extends Component {
    @property({ type: Node })
    private content: Node = null;

    @property({ type: Prefab })
    private itemPrefab: Prefab = null;

    @property({ type: Button })
    private leftButton: Button = null;

    @property({ type: Button })
    private rightButton: Button = null;

    @property
    private itemSpacing: number = 40;

    @property
    private inertiaDamping: number = 0.95;

    @property({ type: CCBoolean, visible: true })
    private dragToScroll: boolean = true;

    private _visibleNodes: Node[] = [];
    private _itemDataList: any[] = [];
    private itemWidth: number = 0;
    private lastTouchX: number = 0;
    private scrolling: boolean = false;
    private scrollVelocity: number = 0;
    private inertiaActive: boolean = false;
    private currentStartIndex: number = 0;
    private selectedOffsetIndex: number = 0;
    private selectedIndex: number = 0;
    private snapDistance: number = 0;
    private _log = logger.child('CarouselScroll');

    private onSelectCallback: (node: Node, item: any, index: number) => void = () => {};
    private onDeselectCallback: (node: Node, item: any, index: number) => void = () => {};
    private willBecomeVisibleCallback: (node: Node, item: any, index: number) => void = () => {};

    start() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.leftButton.node.on(Button.EventType.CLICK, this._onLeftPressed, this);
        this.rightButton.node.on(Button.EventType.CLICK, this._onRightPressed, this);
    }

    public init(
        itemList: any[],
        onSelectCallback: (node: Node, item: any, index: number) => void,
        onDeselectCallback: (node: Node, item: any, index: number) => void,
        onVisibleCallback: (node: Node, item: any, index: number) => void
    ) {
        this._itemDataList = itemList;
        this.onSelectCallback = onSelectCallback;
        this.onDeselectCallback = onDeselectCallback;
        this.willBecomeVisibleCallback = onVisibleCallback;

        if (!this.itemPrefab || !this.content) {
            this._log.error('CarouselScroll: Missing required properties!');
            return;
        }

        this.populateInitialItems();
    }

    public async scrollToItem(index: number) {
        if (index < 0 || index >= this._itemDataList.length) {
            this._log.warn(`Invalid index ${index}`);
            return;
        }

        const currentX = this.content.position.x;
        if (Math.abs(currentX) > EPSILON) {
            await this._recenterAndSelectItem(true);
        }

        // Find shortest distance to scroll (left or right)
        let numItemsAway = (index - this.selectedIndex + this._itemDataList.length) % this._itemDataList.length;
        if (numItemsAway > this._itemDataList.length / 2) {
            numItemsAway -= this._itemDataList.length;
        }
        this._selectItemByOffset(numItemsAway);
    }

    private populateInitialItems() {
        const tempItem = instantiate(this.itemPrefab);
        this.itemWidth = tempItem.getComponent(UITransform).width;
        this.snapDistance = this.itemWidth + this.itemSpacing;
        tempItem.destroy();

        const contentWidth = this.content.getComponent(UITransform).width;
        const visibleItemCount = Math.ceil(contentWidth / this.snapDistance);
        this.selectedOffsetIndex = Math.floor(visibleItemCount / 2);

        for (let i = 0; i < visibleItemCount; i++) {
            const itemNode = instantiate(this.itemPrefab);
            let button = itemNode.getComponent(Button);

            if (button) {
                button.interactable = false;
            }

            this.content.addChild(itemNode);
            this._visibleNodes.push(itemNode);
            const posX = (i - this.selectedOffsetIndex) * this.snapDistance;
            itemNode.setPosition(new Vec3(posX, 0, 0));
        }

        // Offset so the first data item is centered (selected) first
        this.selectedIndex = 0;

        const remainder = visibleItemCount % 2;
        let offset = this._itemDataList.length - (visibleItemCount - remainder);

        this.currentStartIndex = (this.selectedOffsetIndex + offset + this._itemDataList.length) % this._itemDataList.length;
        this.updateVisibleItems();
    }

    private updateVisibleItems() {
        for (let i = 0; i < this._visibleNodes.length; i++) {
            const itemIndex = (this.currentStartIndex + i) % this._itemDataList.length;
            this.willBecomeVisibleCallback(this._visibleNodes[i], this._itemDataList[itemIndex], itemIndex);
        }
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.leftButton.enabled = enabled;
        this.rightButton.enabled = enabled;
    }

    private onTouchStart(event: EventTouch) {
        if (!this.enabled || !this.dragToScroll) {
            return;
        }
        this.lastTouchX = event.getUILocation().x;
        this.scrolling = true;
        this.inertiaActive = false;
        this.scrollVelocity = 0;

        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.MOUSE_UP, this.onTouchEnd, this);

        this._visibleNodes.forEach((node, index) => {
            const dataIndex = (this.currentStartIndex + index) % this._itemDataList.length;
            this.onDeselectCallback(this._visibleNodes[index], this._itemDataList[dataIndex], dataIndex);
        });
    }

    private onTouchMove(event: EventTouch) {
        if (!this.enabled || !this.scrolling || !this.dragToScroll) {
            return;
        }

        const currentTouchX = event.getUILocation().x;
        const delta = currentTouchX - this.lastTouchX;
        this.scroll(delta);
        this.lastTouchX = currentTouchX;
        this.scrollVelocity = delta;
    }

    private onTouchEnd(event: any) {
        this.scrolling = false;
        if (Math.abs(this.scrollVelocity) > 1) {
            this.inertiaActive = true;
            this.applyInertia();
        }

        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.MOUSE_UP, this.onTouchEnd, this);
    }

    private scroll(delta: number) {
        let curPos = this.content.position;
        let newX = curPos.x + delta;
        let numSnaps = Math.round(newX / this.snapDistance);
        let fixAmount = numSnaps * this.snapDistance;

        if (Math.abs(fixAmount) >= this.snapDistance - EPSILON) {
            delta -= fixAmount;

            // Recycle multiple times if needed
            for (let i = 0; i < Math.abs(numSnaps); i++) {
                if (numSnaps > 0) {
                    this._recycleRight();
                } else {
                    this._recycleLeft();
                }
            }
        }
        this.content.setPosition(new Vec3(curPos.x + delta, curPos.y, curPos.z));
    }

    private async _onLeftPressed() {
        const currentX = this.content.position.x;
        if (Math.abs(currentX) > EPSILON) {
            await this._recenterAndSelectItem(true);
        }
        this._selectItemByOffset(-1);
    }

    private async _onRightPressed() {
        const currentX = this.content.position.x;
        if (Math.abs(currentX) > EPSILON) {
            await this._recenterAndSelectItem(true);
        }
        this._selectItemByOffset(1);
    }

    private _selectItemByOffset(offset: number) {
        this._disableLeftAndRightButtons();
        // Offset the selected index (which could be negative) and cap between [0 - numItems)
        const numItems = this._itemDataList.length;
        let nextIndex = (((this.selectedIndex + offset) % numItems) + numItems) % numItems;
        this.selectedIndex = nextIndex;

        // Scroll in the opposite direction of the item we're moving to
        const totalDistance = -offset * this.snapDistance;
        let movedDistance = 0;
        tween(this)
            .to(
                0.25,
                {},
                {
                    easing: 'quadOut',
                    onUpdate: (_, ratio) => {
                        const step = ratio * totalDistance - movedDistance;
                        this.scroll(step);
                        movedDistance += step;
                    }
                }
            )
            .call(() => {
                this._sendItemSelected();
                this._enableAllButtons();
            })
            .start();
    }

    private applyInertia() {
        if (!this.inertiaActive) return;

        if (Math.abs(this.scrollVelocity) > 0.1) {
            this.scroll(this.scrollVelocity);
            this.scrollVelocity *= this.inertiaDamping;
            setTimeout(() => this.applyInertia(), 16);
        } else {
            this.inertiaActive = false;
            this._recenterAndSelectItem();
        }
    }

    private async _recenterAndSelectItem(snap: boolean = false): Promise<void> {
        const currentX = this.content.position.x;
        let remainder = currentX % this.snapDistance;

        // Determine shortest move direction
        let moveOffset = remainder > this.snapDistance / 2 ? this.snapDistance - remainder : -remainder;
        if (moveOffset > this.snapDistance / 2) {
            moveOffset -= this.snapDistance;
        } else if (moveOffset < -this.snapDistance / 2) {
            moveOffset += this.snapDistance;
        }

        let movedDistance = 0;

        return new Promise((resolve, reject) => {
            tween(this)
                .to(
                    snap ? 0.0 : 0.2,
                    {},
                    {
                        easing: 'quadOut',
                        onUpdate: (_, ratio) => {
                            const step = ratio * moveOffset - movedDistance;
                            this.scroll(step);
                            movedDistance += step;
                        }
                    }
                )
                .call(() => {
                    this.selectedIndex = (this.currentStartIndex + this.selectedOffsetIndex) % this._itemDataList.length;
                    if (!snap) {
                        this._sendItemSelected();
                    }
                    resolve();
                })
                .start();
        });
    }

    private _sendItemSelected() {
        this._visibleNodes.forEach((node, index) => {
            const dataIndex = (this.currentStartIndex + index) % this._itemDataList.length;
            if (dataIndex === this.selectedIndex) {
                this.onSelectCallback(this._visibleNodes[index], this._itemDataList[dataIndex], dataIndex);
            } else {
                this.onDeselectCallback(this._visibleNodes[index], this._itemDataList[dataIndex], dataIndex);
            }
        });
    }

    private _recycleRight() {
        this.currentStartIndex = (this.currentStartIndex - 1 + this._itemDataList.length) % this._itemDataList.length;
        this.updateVisibleItems();
    }

    private _recycleLeft() {
        this.currentStartIndex = (this.currentStartIndex + 1 + this._itemDataList.length) % this._itemDataList.length;
        this.updateVisibleItems();
    }

    private _disableLeftAndRightButtons() {
        this.leftButton.interactable = false;
        this.rightButton.interactable = false;

        for (const node of this._visibleNodes) {
            let button = node.getComponent(Button);

            if (button) {
                button.interactable = false;
            }
        }
    }

    private _enableAllButtons() {
        this.leftButton.interactable = true;
        this.rightButton.interactable = true;

        for (const node of this._visibleNodes) {
            let button = node.getComponent(Button);

            if (button) {
                button.interactable = true;
            }
        }
    }
}
