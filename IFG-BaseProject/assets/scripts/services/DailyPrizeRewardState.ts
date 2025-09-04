import { ItemInfo } from '../core/model/ItemInfo';

export class DailyReward {
    private _claimed: boolean;
    private _item: ItemInfo;
    private _amount: number;

    public set claimed(value: boolean) {
        this._claimed = value;
    }

    public get claimed() {
        return this._claimed;
    }

    public get amount() {
        return this._amount;
    }

    public get itemInfo() {
        return this._item;
    }

    public constructor(item: ItemInfo, amount: number, claimed: boolean) {
        this._item = item;
        this._amount = amount;
        this._claimed = claimed;
    }
}

export class DailyRewardBox {
    private _freeReward: DailyReward;
    private _clubReward: DailyReward;
    private _boxIndex: number;
    private _claimIndex: number;

    public constructor(freeReward: DailyReward, clubReward: DailyReward, boxIndex: number, claimIndex: number) {
        this._freeReward = freeReward;
        this._clubReward = clubReward;
        this._boxIndex = boxIndex;
        this._claimIndex = claimIndex;
    }

    public unclaimedPrizeCount(): number {
        let unclaimedPrizeCount = 0;
        if (!this._freeReward.claimed) {
            unclaimedPrizeCount += 1;
        }
        if (!this._clubReward.claimed) {
            unclaimedPrizeCount += 1;
        }
        return unclaimedPrizeCount;
    }

    public get index(): number {
        return this._boxIndex;
    }

    public get claimIndex(): number {
        return this._claimIndex;
    }

    public get rewards(): DailyReward[] {
        return [this._freeReward, this._clubReward];
    }

    public get freeReward(): DailyReward {
        return this._freeReward;
    }

    public get clubReward(): DailyReward {
        return this._clubReward;
    }
}

export class DailyPrizeRewardState {
    private _box1: DailyRewardBox = null;
    private _box2: DailyRewardBox = null;
    private _box3: DailyRewardBox = null;
    private _boxes: DailyRewardBox[] = [];
    private _showLogo: boolean = true;

    public constructor(box1: DailyRewardBox, box2: DailyRewardBox, box3: DailyRewardBox, showLogo: boolean) {
        this._box1 = box1;
        this._box2 = box2;
        this._box3 = box3;
        this._boxes = [this._box1, this._box2, this._box3];
        this._showLogo = showLogo;
    }

    public numPrizesToClaim(): number {
        let numPrizesToClaim = 0;
        numPrizesToClaim += this._box1.unclaimedPrizeCount();
        numPrizesToClaim += this._box2.unclaimedPrizeCount();
        numPrizesToClaim += this._box3.unclaimedPrizeCount();
        return numPrizesToClaim;
    }

    public hasPrizesToClaim(): boolean {
        return this.numPrizesToClaim() > 0;
    }

    public numPrizesLeftToClaim(): number {
        return this._boxes.filter((box) => box.unclaimedPrizeCount() > 0).length;
    }

    public claimBoxFreePrize(boxIndex: number) {
        this._boxes[boxIndex].freeReward.claimed = true;
    }

    public claimBoxClubPrize(boxIndex: number) {
        this._boxes[boxIndex].clubReward.claimed = true;
    }

    public get box1(): DailyRewardBox {
        return this._box1;
    }

    public get box2(): DailyRewardBox {
        return this._box2;
    }

    public get box3(): DailyRewardBox {
        return this._box3;
    }

    public get showLogo(): boolean {
        return this._showLogo;
    }
}
