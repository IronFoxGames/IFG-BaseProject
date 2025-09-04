import { resources, Asset } from 'cc';
import { logger } from '../logging';

export class ResourceLoader {
    static async load<T extends Asset>(path: string, type: new () => T, required: boolean = true): Promise<T> {
        if (path == null) {
            return null;
        }

        const log = logger.child('ResourceLoader.load');
        return new Promise((resolve, reject) => {
            resources.load(path, type, (err, asset) => {
                if (err) {
                    if (required) {
                        log.error(`Failed to load resource: ${path}`, err);
                    }
                    reject(err);
                    return;
                }
                if (!asset) {
                    const error = new Error(`Resource not found: ${path}`);
                    if (required) {
                        log.error(error.message);
                    }
                    reject(error);
                    return;
                }
                resolve(asset);
            });
        });
    }

    static async loadDir<T extends Asset>(path: string, type: new () => T, required: boolean = true): Promise<T[]> {
        if (path == null) {
            return [];
        }

        const log = logger.child('ResourceLoader.loadDir');
        return new Promise((resolve, reject) => {
            resources.loadDir(path, type, (err, assets) => {
                if (err) {
                    if (required) {
                        log.error(`Failed to load resources from path: ${path}`, err);
                    }
                    reject(err);
                    return;
                }
                if (!assets || !Array.isArray(assets)) {
                    const error = new Error(`Resources not found at: ${path}`);
                    if (required) {
                        log.error(error.message);
                    }
                    reject(error);
                    return;
                }
                resolve(assets);
            });
        });
    }
}
