import { AppConfig } from '../../../config/AppConfig';
import { BackendCrazyGames } from './BackendCrazyGames';
import { CrazyGamesSDKConfig } from './CrazyGamesSDKConfig';

export function instantiate(appConfig: AppConfig): BackendCrazyGames | null {
    const config = CrazyGamesSDKConfig.fromObject(appConfig.crazySDKConfig);
    if (!config.enabled) {
        return null;
    }

    return new BackendCrazyGames();
}
