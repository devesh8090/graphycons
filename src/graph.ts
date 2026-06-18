import type { Point, Tile } from './types';
import { perturbLightness, BASE_SATURATION, BASE_LIGHTNESS } from './color';

/** Internal coordinate space. Coordinates are always in [0..CANVAS]. */
const CANVAS = 400;

// ---------------------------------------------------------------------------
// Geometry utilities
// ---------------------------------------------------------------------------

/**
 * Signed area of a polygon via the shoelace (Gauss) formula.
 * Positive for counter-clockwise winding, negative for clockwise.
 */
function signedArea(vertices: Point[]): number {
  const n = vertices.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
  }
  return area / 2;
}

/**
 * Absolute area of a polygon (order-independent).
 * Used to determine which tile to subdivide next.
 */
export function polygonArea(vertices: Point[]): number {
  return Math.abs(signedArea(vertices));
}

/**
 * Arithmetic centroid of a polygon (mean of vertex coordinates).
 * For a triangle this equals the classical centroid (intersection of medians).
 */
function centroid(vertices: Point[]): Point {
  let x = 0,
    y = 0;
  for (const v of vertices) {
    x += v.x;
    y += v.y;
  }
  const n = vertices.length;
  return { x: x / n, y: y / n };
}

// ---------------------------------------------------------------------------
// Subdivision
// ---------------------------------------------------------------------------

/**
 * Subdivide a convex polygon tile into N triangular children via fan
 * triangulation from a jittered interior point.
 *
 * Algorithm:
 *   1. Compute the centroid of the tile.
 *   2. Apply a small deterministic jitter (≤ 10% of √area in each direction)
 *      so the resulting triangles have slight asymmetry, producing a more
 *      organic appearance than a perfectly centred subdivision.
 *   3. For each consecutive edge (v[i], v[i+1]) of the polygon, create a
 *      triangle: [v[i], v[i+1], center].
 *   4. Assign each child a lightness perturbed from the parent's lightness.
 *
 * Planarity is guaranteed because the center point lies strictly inside the
 * convex polygon, so no new edges cross the existing boundary.
 *
 * Hue and saturation are inherited unchanged from the parent tile.
 *
 * @param tile   - The tile to subdivide
 * @param rng    - Seeded PRNG (consumes 2 + N values, where N = vertex count)
 * @param v      - Variance parameter (controls lightness spread of children)
 * @returns Array of N triangular child tiles
 */
export function subdivideTile(
  tile: Tile,
  rng: () => number,
  v: number
): Tile[] {
  const verts = tile.vertices;
  const n = verts.length;
  const c = centroid(verts);
  const area = polygonArea(verts);

  // Jitter: up to 10% of √area, uniformly distributed in a random direction.
  // For all non-degenerate triangles produced by this algorithm, this radius
  // is well within the polygon boundary.
  const maxJitter = Math.sqrt(area) * 0.1;
  const angle = rng() * Math.PI * 2; // consumes rng[0]
  const dist = rng() * maxJitter; // consumes rng[1]

  const center: Point = {
    x: c.x + Math.cos(angle) * dist,
    y: c.y + Math.sin(angle) * dist,
  };

  // Fan-triangulate: each edge of the polygon becomes the base of a triangle
  return Array.from({ length: n }, (_, i): Tile => {
    const a = verts[i];
    const b = verts[(i + 1) % n];
    return {
      vertices: [a, b, center],
      hue: tile.hue,
      saturation: tile.saturation,
      lightness: perturbLightness(tile.lightness, v, rng), // consumes rng[2+i]
    };
  });
}

// ---------------------------------------------------------------------------
// Top-level tile builder
// ---------------------------------------------------------------------------

/**
 * Build the complete list of triangular tiles covering a 400×400 canvas.
 *
 * Node count formula:
 *   4 corners  +  1 (initial centre)  +  steps  =  5 + steps
 *
 * Tile count formula:
 *   4 (from initial square split)  +  3 × steps
 *
 * Subdivision always targets the largest tile by area, providing a greedy
 * approximation to a spatially balanced distribution.
 *
 * @param h   - Hue [0..1] → mapped to [0..360°]
 * @param v   - Variance [0..1]
 * @param d   - Density [0..1] → steps = round(d × 20)
 * @param rng - Seeded PRNG
 * @returns Flat array of non-overlapping triangular tiles
 */
export function buildTiles(
  h: number,
  v: number,
  d: number,
  rng: () => number
): Tile[] {
  const steps = Math.round(d * 20);
  const baseHue = h * 360;

  // ── Step 0: initialise with a single square tile ─────────────────────────
  const root: Tile = {
    vertices: [
      { x: 0, y: 0 },
      { x: CANVAS, y: 0 },
      { x: CANVAS, y: CANVAS },
      { x: 0, y: CANVAS },
    ],
    hue: baseHue,
    saturation: BASE_SATURATION,
    lightness: BASE_LIGHTNESS,
  };

  // ── Step 1: mandatory first subdivision (square → 4 triangles) ───────────
  // This places the "+1 initial subdivision node" in the node-count formula.
  let tiles: Tile[] = subdivideTile(root, rng, v);

  // ── Steps 2..steps+1: repeatedly split the largest remaining tile ─────
  for (let step = 0; step < steps; step++) {
    // Find the tile with the maximum area (linear scan — tile counts are small)
    let maxArea = -1;
    let maxIdx = 0;
    for (let i = 0; i < tiles.length; i++) {
      const a = polygonArea(tiles[i].vertices);
      if (a > maxArea) {
        maxArea = a;
        maxIdx = i;
      }
    }

    // Replace the largest tile with its three triangular children
    const children = subdivideTile(tiles[maxIdx], rng, v);
    tiles = [
      ...tiles.slice(0, maxIdx),
      ...children,
      ...tiles.slice(maxIdx + 1),
    ];
  }

  return tiles;
}
