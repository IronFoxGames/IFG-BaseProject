import { _decorator, Component, Node } from 'cc';
import { GripCard } from '../GripCard';
const { ccclass, property } = _decorator;

@ccclass('GripCardSlot')
export class GripCardSlot extends Component {
    private _activeCard: GripCard = null;

    public get activeCard(): GripCard {
        return this._activeCard;
    }

    public addCardToSlot(card: GripCard) {
        this.node.active = true;
        card.node.parent = this.node;
        card.node.setPosition(0, 0, 0);
        card.setCardSlot(this);
        this._activeCard = card;
        card.setSelected(false);
    }

    public removeCardFromSlot(newParent: Node): GripCard {
        let card = this._activeCard;
        this._activeCard.setCardSlot(null);
        this._activeCard.node.parent = newParent;
        this._activeCard = null;
        this.node.active = false;

        return card;
    }

    public canAddCard(): boolean {
        return this._activeCard === null;
    }
}
