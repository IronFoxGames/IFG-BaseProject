import { _decorator, Component, Node, EventTouch } from 'cc';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { UpsellOrigin } from '../core/enums/UpsellOrigin';
const { ccclass, property } = _decorator;

@ccclass('GuestModeBannerTextClickEventHandler')
export class GuestModeBannerTextClickEventHandler extends Component {
    private _cardScrambleService: ICardScrambleService;

    public init(cardScrambleService: ICardScrambleService) {
        this._cardScrambleService = cardScrambleService;
    }

    public onSignUpClicked(eventTouch: EventTouch) {
        this._cardScrambleService.openPlatformRegistration(UpsellOrigin.Banner);
    }

    public onSignInClicked(eventTouch: EventTouch) {
        this._cardScrambleService.openPlatformSignIn();
    }
}
