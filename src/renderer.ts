import type { Tile } from './types';
import { hslString } from './color';

const MAX_STROKE_WIDTH = 4;

function renderPolygon(tile: Tile, strokeWidth: number): string {
  const pts = tile.vertices.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ');
  const fill = hslString(tile.hue, tile.saturation, tile.lightness);
  if (strokeWidth <= 0.01) return `<polygon points="${pts}" fill="${fill}"/>`;
  return `<polygon points="${pts}" fill="${fill}" stroke="#000" stroke-width="${strokeWidth.toFixed(2)}" stroke-linejoin="round"/>`;
}

export function renderSVG(tiles: Tile[], w: number, size: number): string {
  const strokeWidth = w * MAX_STROKE_WIDTH;
  const polygons = tiles.map((t) => `  ${renderPolygon(t, strokeWidth)}`).join('\n');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${size}" height="${size}" role="img" aria-label="Research field avatar">`,
    polygons,
    '</svg>',
  ].join('\n');
}
