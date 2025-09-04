import { AppConfig } from '../../config/AppConfig';
import { IBackend } from '../IBackend';
import { instantiate as instantiatePogo } from './pogo';
import { instantiate as instantiateCrazyGames } from './crazygames';
import { instantiate as instantiateLocal } from './defaultLocal';

export function instantiate(appConfig: AppConfig): IBackend {
    const pogo = instantiatePogo(appConfig);
    if (pogo) {
        return pogo;
    }

    const crazy = instantiateCrazyGames(appConfig);
    if (crazy) {
        return crazy;
    }

    return instantiateLocal(appConfig);
}
