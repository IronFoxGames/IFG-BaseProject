import { Random } from '../assets/scripts/core/Random';

describe('Random class tests', () => {
    test('Same seed generates the same sequence', () => {
        const seed = '12345';

        const rng1 = new Random(seed);
        const rng2 = new Random(seed);

        const sequence1 = Array.from({ length: 10 }, () => rng1.next());
        const sequence2 = Array.from({ length: 10 }, () => rng2.next());

        expect(sequence1).toEqual(sequence2);
    });

    test('Different seeds generate different sequences', () => {
        const rng1 = new Random('12345');
        const rng2 = new Random('67890');

        const sequence1 = Array.from({ length: 10 }, () => rng1.next());
        const sequence2 = Array.from({ length: 10 }, () => rng2.next());

        expect(sequence1).not.toEqual(sequence2);
    });

    test('Random.nextInt() produces values in range', () => {
        const rng = new Random('12345');

        for (let i = 0; i < 100; i++) {
            const num = rng.nextInt(1, 10);
            expect(num).toBeGreaterThanOrEqual(1);
            expect(num).toBeLessThan(10);
        }
    });

    test('Original seed remains unchanged', () => {
        const seed = '54321';
        const rng = new Random(seed);
        const originalSeed = rng.originalSeed; // Seed is hashed from string; so grab starting seed here

        // Generate some numbers
        rng.next();
        rng.nextInt(1, 100);

        // Ensure original seed is still correct
        expect(rng.originalSeed).toBe(originalSeed);
    });
});
