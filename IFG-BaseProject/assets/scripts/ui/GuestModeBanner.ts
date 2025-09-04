import { _decorator, Component, Node } from 'cc';
import { GuestModeBannerTextClickEventHandler } from './GuestModeBannerTextClickEventHandler';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { EntitlementType } from '../core/enums/EntitlementType';
const { ccclass, property } = _decorator;

@ccclass('GuestModeBanner')
export class GuestModeBanner extends Component {
    @property({ type: GuestModeBannerTextClickEventHandler, visible: true })
    private _guestModeBannerTextClickEventHandler: GuestModeBannerTextClickEventHandler;

    public init(cardScrambleService: ICardScrambleService) {
        if (cardScrambleService.getUserEntitlement() === EntitlementType.Guest) {
            this.node.active = true;
            this._guestModeBannerTextClickEventHandler.init(cardScrambleService);
        } else {
            this.node.active = false;
        }
    }
}
