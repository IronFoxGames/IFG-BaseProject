import { resources } from 'cc';
import { JsonAsset } from 'cc';

export class RewardItem {
    count: number;
    itemId: string;
}

// Consider swapping to day + some array of the rest, and then store that in an array in the json
export class DailyPrizes {
    day: number;
    rewardIndex: number;
    free: RewardItem;
    club: RewardItem;
}

export class DailyPrizeConfig {
    dailyPrizes: DailyPrizes[] = [];

    public static async fromObject(obj: any): Promise<DailyPrizeConfig> {
        let dailyPrizeConfig = new DailyPrizeConfig();

        if (obj == null) {
            return dailyPrizeConfig;
        }

        // Load items from the main config
        if (Array.isArray(obj.rewards)) {
            dailyPrizeConfig.dailyPrizes = obj.rewards.map((item: any) => this.DailyPrizeFromObject(item));
        }

        // Load and merge referenced store configs
        if (obj.refs && Array.isArray(obj.refs)) {
            for (const prizeConfigRef of obj.refs) {
                try {
                    const childRewards = await DailyPrizeConfig.loadFromResource(prizeConfigRef);
                    dailyPrizeConfig.dailyPrizes.push(...childRewards.dailyPrizes);
                } catch (err) {
                    throw new Error(`Failed to load PrizeConfig ref ${prizeConfigRef} with err: ${err}`);
                }
            }
        }

        return dailyPrizeConfig;
    }

    private static loadFromResource(ref: string): Promise<DailyPrizeConfig> {
        return new Promise((resolve, reject) => {
            resources.load(ref, JsonAsset, (err, jsonAsset) => {
                if (err) {
                    reject(`DailyPrizeConfig.loadFromResource(): Failed to load ${ref} with err: ${err}`);
                    return;
                }

                try {
                    const dailyPrizeConfig = DailyPrizeConfig.fromObject(jsonAsset.json as any);
                    resolve(dailyPrizeConfig);
                } catch (err) {
                    reject(`StoreConfig.loadFromResource(): Failed parsing with err: ${err}`);
                }
            });
        });
    }

    private static DailyPrizeFromObject(item: any): DailyPrizes {
        const dailyPrize: DailyPrizes = {
            day: item.day,
            rewardIndex: item.rewardIndex,
            free: this.RewardItemFromObject(item.free),
            club: this.RewardItemFromObject(item.club)
        };
        return dailyPrize;
    }

    private static RewardItemFromObject(item: any): RewardItem {
        const rewardItem: RewardItem = {
            count: item.count,
            itemId: item.itemId
        };
        return rewardItem;
    }
}
