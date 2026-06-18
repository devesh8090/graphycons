/**
 * Normalised `h` values for common hue presets.
 *
 * | Preset | h value  | HSL Hue |
 * |--------|----------|---------|
 * | red    | ≈ 0.028  | 10°     |
 * | blue   | ≈ 0.611  | 220°    |
 * | lime   | ≈ 0.236  | 85°     |
 */
export const HUE_PRESETS = {
  red: 10 / 360,
  blue: 220 / 360,
  lime: 85 / 360,
} as const;

export type HuePreset = keyof typeof HUE_PRESETS;

/**
 * Return the normalised `h` value for a named hue preset.
 * @example
 *   generateAvatar({ h: getHue('blue'), v: 0.5, d: 0.6, w: 0.2 })
 */
export function getHue(preset: HuePreset): number {
  return HUE_PRESETS[preset];
}
