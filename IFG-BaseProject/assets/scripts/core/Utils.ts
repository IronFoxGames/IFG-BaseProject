import { Random } from './Random';

export class Utils {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static shuffle(array: any[], rng: Random): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(rng.next() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    public static shuffleUnseeded(array: any[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
