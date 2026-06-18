/**
 * Clamp a number to the closed interval [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Format an HSL triplet as a compact CSS color string.
 *
 * Uses 1 decimal place for hue and lightness, rounds saturation to
 * an integer (it is always constant in this library).
 * Example: hsl(10.0,65%,52.3%)
 */
export function hslString(h: number, s: number, l: number): string {
  return `hsl(${h.toFixed(1)},${s.toFixed(0)}%,${l.toFixed(1)}%)`;
}

/**
 * Base HSL saturation applied to every tile (%).
 *
 * Held constant to ensure the research field (hue) remains visually
 * dominant regardless of variance.
 */
export const BASE_SATURATION = 65;

/**
 * Base lightness of the root tile (%).
 *
 * Chosen to give a mid-range starting point so that child tiles can
 * drift both lighter and darker without immediately hitting the clamp.
 */
export const BASE_LIGHTNESS = 52;

/**
 * Compute the maximum lightness perturbation range for a given variance.
 *
 * v = 0  →  ±3%  (nearly uniform shading)
 * v = 1  →  ±30% (strong light/dark variation)
 *
 * @param v - Variance parameter [0..1]
 * @returns Maximum deviation in lightness percentage points
 */
export function lightnessRange(v: number): number {
  return 3 + v * 27;
}

/**
 * Apply a single deterministic lightness perturbation to a base value.
 *
 * The child's lightness is computed as:
 *   child.lightness = clamp(parent.lightness + rng() * 2 - range, 25, 82)
 *
 * Clamping at [25, 82] ensures tiles remain visually distinct (neither
 * nearly black nor nearly white) while preserving the dominant hue.
 *
 * @param base - Starting lightness [0..100]
 * @param v - Variance parameter [0..1]
 * @param rng - Seeded PRNG (consumes one value)
 * @returns Clamped lightness in [25..82]
 */
export function perturbLightness(
  base: number,
  v: number,
  rng: () => number
): number {
  const range = lightnessRange(v);
  const delta = (rng() * 2 - 1) * range;
  return clamp(base + delta, 25, 82);
}
