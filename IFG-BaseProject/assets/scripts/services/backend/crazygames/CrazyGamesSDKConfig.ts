import { XsollaSettings } from 'db://xsolla-commerce-sdk/scripts/Xsolla';
import { check } from '../../../core/check';
import { CrazyGamesConfig } from '../../../core/types/runtime/definitions';

export class CrazyGamesSDKConfig {
    public enabled: boolean = false;
    public xsolla: XsollaSettings = {
        loginId: '',
        clientId: 0,
        projectId: '',
        redirectURI: ''
    };

    public static fromObject(obj: unknown): CrazyGamesSDKConfig {
        let crazySDKConfig = new CrazyGamesSDKConfig();
        if (!check(CrazyGamesConfig, obj)) {
            return crazySDKConfig;
        }
        crazySDKConfig.enabled = obj.enabled;
        crazySDKConfig.xsolla = obj.xsolla;
        return crazySDKConfig;
    }
}
