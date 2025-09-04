export class PogoSDKConfig {
    public enabled: boolean;
    public gameId: number;
    public gameCode: string;
    public enableSDKAutomation: boolean;

    public static fromObject(objIn: unknown): PogoSDKConfig {
        const obj = objIn as {
            enabled: boolean,
            gameCode: string,
            gameId: number,
            enableSDKAutomation: boolean
        } | null | undefined;
        let pogoSDKConfig = new PogoSDKConfig();
        pogoSDKConfig.enabled = obj?.enabled || false;
        pogoSDKConfig.gameId = obj?.gameId || 0;
        pogoSDKConfig.gameCode = obj?.gameCode || '';
        pogoSDKConfig.enableSDKAutomation = obj?.enableSDKAutomation || false;
        return pogoSDKConfig;
    }
}
