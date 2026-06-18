/**
 * @module graph-avatar
 *
 * Generates deterministic SVG avatars via recursive planar graph subdivision.
 * Each avatar is uniquely determined by four normalised parameters: hue,
 * variance, density, and border width.
 *
 * @example
 * ```ts
 * import { generateAvatar, getHue } from 'graph-avatar';
 *
 * const svg = generateAvatar({
 *   h: getHue('red'),
 *   v: 0.4,
 *   d: 0.6,
 *   w: 0.3,
 * });
 * document.getElementById('avatar')!.innerHTML = svg;
 * ```
 */

import type { AvatarInput, AvatarOptions } from './types';
import { generateSeed, createPRNG } from './prng';
import { buildTiles } from './graph';
import { renderSVG } from './renderer';
import { HUE_PRESETS, getHue } from './presets';
import type { HuePreset } from './presets';

export type { AvatarInput, AvatarOptions, HuePreset };
export { HUE_PRESETS, getHue };

/**
 * Generate a deterministic SVG avatar from four normalised parameters.
 *
 * The same input values always produce byte-for-byte identical SVG output.
 * No external dependencies or rendering libraries are required.
 *
 * @param input   - The four normalised parameters (all in [0, 1])
 * @param options - Optional output configuration
 * @returns Complete SVG markup as a string
 *
 * @example
 * ```ts
 * // Direct usage
 * const svg = generateAvatar({ h: 0.028, v: 0.5, d: 0.6, w: 0.25 });
 *
 * // With hue preset
 * const svg = generateAvatar({ h: getHue('blue'), v: 0.4, d: 0.8, w: 0.1 });
 *
 * // Custom canvas size
 * const svg = generateAvatar({ h: 0.028, v: 0.5, d: 0.6, w: 0.25 }, { size: 200 });
 *
 * // Node.js — write to file
 * import fs from 'fs';
 * fs.writeFileSync('avatar.svg', generateAvatar({ h: 0.028, v: 0.5, d: 0.7, w: 0.2 }));
 * ```
 */
export function generateAvatar(
  input: AvatarInput,
  options: AvatarOptions = {}
): string {
  const { h, v, d, w } = input;
  const size = options.size ?? 400;

  const seed = generateSeed(h, v, d, w);
  const rng = createPRNG(seed);
  const tiles = buildTiles(h, v, d, rng);
  return renderSVG(tiles, w, size);
}
