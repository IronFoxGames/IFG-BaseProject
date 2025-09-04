import { AppConfig } from "../../../config/AppConfig";
import { BackendPogo } from "./BackendPogo";
import { PogoSDKConfig } from "./PogoSDKConfig";

export function instantiate(appConfig: AppConfig): BackendPogo | null {
    const config = PogoSDKConfig.fromObject(appConfig.pogoSDKConfig);
    if (!config.enabled) {
        return null;
    }

    return new BackendPogo();
}