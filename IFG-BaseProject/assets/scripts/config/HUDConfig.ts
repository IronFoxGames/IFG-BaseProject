import { check } from '../core/check';
import { Requirement } from '../core/model/requirements/Requirement';
import { RequirementFactory } from '../core/model/requirements/RequirementFactory';
import { HudConfig } from '../core/types/runtime/definitions';
import { logger } from '../logging';

const log = logger.child('HUDConfig');

export class FeatureConfig {
    public unlockString: string = '';
    public unlockPopupTitle: string = '';
    public unlockPopupMessage: string = '';
    public unlockPopupSpritePath: string = '';
    public requirements: Requirement[] = [];

    public static fromObj(obj: any): FeatureConfig {
        let featureGameConfig = new FeatureConfig();
        featureGameConfig.unlockString = obj.unlockString ?? '';
        featureGameConfig.unlockPopupTitle = obj.unlockPopupTitle ?? '';
        featureGameConfig.unlockPopupMessage = obj.unlockPopupMessage ?? '';
        featureGameConfig.unlockPopupSpritePath = obj.unlockPopupSpritePath ?? '';
        if (Array.isArray(obj.requirements)) {
            featureGameConfig.requirements = obj.requirements.map((o: any) => RequirementFactory.fromObject(o));
        }
        return featureGameConfig;
    }
}

export class HUDConfig {
    public quickplayFeatureConfig: FeatureConfig;
    public storeFeatureConfig: FeatureConfig;
    public dailyMysteryPrizeFeatureConfig: FeatureConfig;
    public buildModeFeatureConfig: FeatureConfig;
    public puzzleDetailsFeatureConfig: FeatureConfig;
    public energyRevealFeatureConfig: FeatureConfig;

    public static fromObject(obj: unknown): HUDConfig {
        let hudConfig = new HUDConfig();

        if (!check(HudConfig, obj)) {
            log.error('invalid HUDConfig JSON data');
            return hudConfig;
        }

        hudConfig.quickplayFeatureConfig = FeatureConfig.fromObj(obj.quickplayFeatureConfig);
        hudConfig.storeFeatureConfig = FeatureConfig.fromObj(obj.storeFeatureConfig);
        hudConfig.dailyMysteryPrizeFeatureConfig = FeatureConfig.fromObj(obj.dailyMysteryPrizeFeatureConfig);
        hudConfig.buildModeFeatureConfig = FeatureConfig.fromObj(obj.buildModeFeatureConfig);
        hudConfig.puzzleDetailsFeatureConfig = FeatureConfig.fromObj(obj.puzzleDetailsFeatureConfig);
        hudConfig.energyRevealFeatureConfig = FeatureConfig.fromObj(obj.energyRevealFeatureConfig);

        return hudConfig;
    }
}
