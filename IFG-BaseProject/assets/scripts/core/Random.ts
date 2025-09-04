export class Random {
    private _seed: number;
    private readonly _originalSeed: number;

    constructor(seed: string) {
        this._seed = this._hashSeed(seed);
        this._originalSeed = this._seed;
    }

    public get originalSeed() {
        return this._originalSeed;
    }

    // Linear congruence generator using Hull-Dobell Theorem.
    public next(): number {
        this._seed = (this._seed * 9301 + 49297) % 233280;
        return this._seed / 233280.0;
    }

    // Returns a pseudo-random integer between min (inclusive) and max (exclusive).
    public nextInt(min: number, max: number): number {
        const next = this.next();
        return Math.floor(next * (max - min) + min);
    }

    // Hashes a string into a 32-bit unsigned integer using the FNV-1a algorithm.
    private _hashSeed(seed: string): number {
        let hash = 2166136261;
        for (let i = 0; i < seed.length; i++) {
            hash ^= seed.charCodeAt(i);
            hash = (hash * 16777619) >>> 0;
        }
        return hash;
    }
}
