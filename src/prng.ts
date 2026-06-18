/**
 * Mulberry32 PRNG — fast, high-quality 32-bit pseudo-random number generator.
 *
 * Reference: https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 *
 * Returns a closure that yields a new value in [0, 1) on each call.
 * The sequence is fully determined by the initial seed.
 *
 * @param seed - A 32-bit unsigned integer seed
 */
export function createPRNG(seed: number): () => number {
  let s = seed >>> 0;
  return function next(): number {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/**
 * Generate a deterministic 32-bit seed from four normalised float values.
 *
 * Uses the cyrb53 algorithm (by bryc) for its excellent distribution and
 * low collision probability, then folds the 53-bit result to 32 bits for
 * use with Mulberry32.
 *
 * Inputs are serialised at 6 decimal places before hashing so that
 * semantically equal values (e.g. 0.100000 and 0.1) always produce the
 * same seed regardless of floating-point representation.
 *
 * @param h - Hue value [0..1]
 * @param v - Variance value [0..1]
 * @param d - Density value [0..1]
 * @param w - Width value [0..1]
 */
export function generateSeed(
  h: number,
  v: number,
  d: number,
  w: number
): number {
  // Canonical string representation — 6 d.p. is sufficient for values in [0,1]
  const str = [h, v, d, w]
    .map((n) => n.toFixed(6))
    .join(',');

  // cyrb53 hash (produces 53-bit result with excellent avalanche properties)
  let h1 = 0xdeadbeef,
    h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  // Fold to 32 bits for Mulberry32
  return (h2 >>> 0) ^ (h1 >>> 0);
}
