/**
 * Normalized input parameters for avatar generation.
 * All values must be in the closed interval [0, 1].
 */
export interface AvatarInput {
  /**
   * Hue — color of the avatar.
   * Maps linearly to 0–360° on the HSL color wheel.
   *
   * Presets:
   *   red  → 10/360 ≈ 0.028  (HSL 10°)
   *   blue → 220/360 ≈ 0.611  (HSL 220°)
   *   lime → 85/360 ≈ 0.236  (HSL 85°)
   */
  h: number;

  /**
   * Variance — lightness spread across tiles.
   * Low v → nearly uniform shading.
   * High v → strong light/dark variation across tiles.
   */
  v: number;

  /**
   * Density — how many subdivision steps are applied.
   * Maps to subdivision steps: steps = round(d × 20).
   * d = 0 → 5 nodes, 4 tiles.
   * d = 1 → 25 nodes, 64 tiles.
   */
  d: number;

  /**
   * Width — border thickness of each tile.
   * Borders are always black (#000).
   * w = 0 → no visible border.
   * w = 1 → maximum border thickness.
   */
  w: number;
}

/** Optional configuration for SVG output. */
export interface AvatarOptions {
  /**
   * Rendered SVG dimensions in pixels (applied to both width and height).
   * The internal coordinate space is always 400×400; this parameter only
   * scales the output via the SVG viewBox.
   * @default 400
   */
  size?: number;
}

/** A 2-dimensional point in the avatar coordinate space [0..400]. */
export interface Point {
  x: number;
  y: number;
}

/**
 * A coloured triangular tile in the planar graph.
 * After the initial square subdivision, all tiles are triangles.
 */
export interface Tile {
  /** Ordered vertices of the polygon (always 3 after initial split). */
  vertices: Point[];
  /** HSL hue in degrees [0, 360]. Constant across all tiles for one avatar. */
  hue: number;
  /** HSL saturation in percent [0, 100]. Constant across all tiles. */
  saturation: number;
  /** HSL lightness in percent [0, 100]. Varies per tile based on variance. */
  lightness: number;
}
