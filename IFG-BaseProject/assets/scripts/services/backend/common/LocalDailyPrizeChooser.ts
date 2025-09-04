import { DailyPrizeConfig } from '../../../config/DailyPrizeConfig';
import { ItemConfig } from '../../../config/ItemConfig';
import { ItemInfo } from '../../../core/model/ItemInfo';
import { Utils } from '../../../core/Utils';
import { DailyPrizeRewardState, DailyReward, DailyRewardBox } from '../../DailyPrizeRewardState';
import { SaveData } from '../../SaveData';

type Rewards = {
    free: Reward;
    club: Reward;
};

type Reward = {
    item: ItemInfo;
    count: number;
};

/**
 * @param dayIndex Day Index is 1-7 with 7 being Sunday
 */
export async function GetDailyRewardState(
    prizeConfig: DailyPrizeConfig,
    itemConfig: ItemConfig,
    saveData: SaveData,
    dayIndex: number,
    saveCallback: () => Promise<boolean>
): Promise<DailyPrizeRewardState> {
    // Convert what's in the JSON to versions with full ItemInfo
    let todayRewards: Rewards[] = [];

    prizeConfig.dailyPrizes.forEach((item) => {
        if (item.day === dayIndex) {
            const firstInfo = itemConfig.getItemInfoForExternalId(item?.free.itemId);
            const secondInfo = itemConfig.getItemInfoForExternalId(item?.club.itemId);

            todayRewards[item.rewardIndex] = {
                free: { item: firstInfo, count: item?.free.count },
                club: { item: secondInfo, count: item?.club.count }
            };
        }
    });

    const availableIndices = todayRewards.map((_, i) => {
        return i;
    });

    const claimed = saveData.dailyPrizeClaimStatus;

    let boxClaimOrder = saveData.dailyPrizeClaimOrder;
    let boxClaimLastDay = saveData.dailyPrizeLastDay;

    if (!boxClaimOrder || boxClaimOrder.length < 3 || boxClaimLastDay !== dayIndex) {
        // Shuffle in place
        Utils.shuffleUnseeded(availableIndices);

        // Pick 3
        boxClaimOrder = availableIndices.slice(0, 3);

        // Save the claim order so we're claiming the same prizes across multiple visits on the same day
        saveData.dailyPrizeClaimOrder = boxClaimOrder;
        saveData.dailyPrizeLastDay = dayIndex;
        await saveCallback();
    }

    // Box 0
    let claimIndex = boxClaimOrder[0];
    let freeRewardEntry = todayRewards[claimIndex];
    let boxClaimed = claimed[0];
    const box0FreeReward = new DailyReward(freeRewardEntry.free.item, freeRewardEntry.free.count, boxClaimed);
    const box0ClubReward = new DailyReward(freeRewardEntry.club.item, freeRewardEntry.club.count, boxClaimed);
    const box0 = new DailyRewardBox(box0FreeReward, box0ClubReward, 0, claimIndex);

    // Box 1
    claimIndex = boxClaimOrder[1];
    freeRewardEntry = todayRewards[claimIndex];
    boxClaimed = claimed[1];
    const box1FreeReward = new DailyReward(freeRewardEntry.free.item, freeRewardEntry.free.count, boxClaimed);
    const box1ClubReward = new DailyReward(freeRewardEntry.club.item, freeRewardEntry.club.count, boxClaimed);
    const box1 = new DailyRewardBox(box1FreeReward, box1ClubReward, 1, claimIndex);

    // Box 2
    claimIndex = boxClaimOrder[2];
    freeRewardEntry = todayRewards[claimIndex];
    boxClaimed = claimed[2];
    const box2FreeReward = new DailyReward(freeRewardEntry.free.item, freeRewardEntry.free.count, boxClaimed);
    const box2ClubReward = new DailyReward(freeRewardEntry.club.item, freeRewardEntry.club.count, boxClaimed);
    const box2 = new DailyRewardBox(box2FreeReward, box2ClubReward, 2, claimIndex);

    return new DailyPrizeRewardState(box0, box1, box2, false);
}
