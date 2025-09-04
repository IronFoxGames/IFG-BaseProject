import { Level } from './Level';

export class LevelList {
    public levels: Level[] = [];

    public init() {
        this.levels.forEach((level, index) => {
            level.index = index;
        });
    }

    public static fromObject(obj: any): LevelList {
        const levelList = new LevelList();

        if (Array.isArray(obj.levels)) {
            levelList.levels = obj.levels.map((l: any) => Level.fromObject(l));
        }

        return levelList;
    }
}
