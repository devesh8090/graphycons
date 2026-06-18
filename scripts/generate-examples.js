/**
 * Generate example SVGs for the README gallery.
 * Run: node scripts/generate-examples.js
 */

const fs = require('fs');
const path = require('path');

// ── PRNG (Mulberry32) ─────────────────────────────────────────
function createPRNG(seed) {
  let s = seed >>> 0;
  return function() {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

function generateSeed(h, v, d, w) {
  const str = [h,v,d,w].map(n => n.toFixed(6)).join(',');
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2 = Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return (h2>>>0)^(h1>>>0);
}

// ── Color helpers ─────────────────────────────────────────────
const BASE_SAT = 65, BASE_L = 52;

function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
function hslStr(h, s, l)  { return `hsl(${h.toFixed(1)},${s.toFixed(0)}%,${l.toFixed(1)}%)`; }
function perturbL(base, v, rng) {
  const range = 3 + v * 27;
  return clamp(base + (rng()*2-1)*range, 25, 82);
}

// ── Geometry ──────────────────────────────────────────────────
function polyArea(verts) {
  let a = 0; const n = verts.length;
  for (let i=0; i<n; i++) {
    const j=(i+1)%n;
    a += verts[i].x*verts[j].y - verts[j].x*verts[i].y;
  }
  return Math.abs(a)/2;
}

function subdivideTile(tile, rng, v) {
  const verts = tile.vertices, n = verts.length;
  let cx=0, cy=0;
  for (const p of verts) { cx+=p.x; cy+=p.y; }
  cx/=n; cy/=n;
  const maxJ = Math.sqrt(polyArea(verts)) * 0.1;
  const ang  = rng() * Math.PI * 2;
  const dist = rng() * maxJ;
  const ctr  = { x: cx + Math.cos(ang)*dist, y: cy + Math.sin(ang)*dist };
  return Array.from({length:n}, (_,i) => ({
    vertices: [verts[i], verts[(i+1)%n], ctr],
    hue: tile.hue, saturation: tile.saturation,
    lightness: perturbL(tile.lightness, v, rng),
  }));
}

function buildTiles(h, v, d, rng) {
  const steps = Math.round(d*20);
  const baseHue = h*360;
  const root = {
    vertices: [{x:0,y:0},{x:400,y:0},{x:400,y:400},{x:0,y:400}],
    hue: baseHue, saturation: BASE_SAT, lightness: BASE_L,
  };
  let tiles = subdivideTile(root, rng, v);
  for (let s=0; s<steps; s++) {
    let maxA=-1, maxI=0;
    for (let i=0;i<tiles.length;i++){
      const a=polyArea(tiles[i].vertices);
      if(a>maxA){maxA=a;maxI=i;}
    }
    const ch = subdivideTile(tiles[maxI], rng, v);
    tiles = [...tiles.slice(0,maxI), ...ch, ...tiles.slice(maxI+1)];
  }
  return tiles;
}

function renderPolygon(tile, sw) {
  const pts = tile.vertices.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fill = hslStr(tile.hue, tile.saturation, tile.lightness);
  if (sw <= 0.01) return `<polygon points="${pts}" fill="${fill}"/>`;
  return `<polygon points="${pts}" fill="${fill}" stroke="#000" stroke-width="${sw.toFixed(2)}" stroke-linejoin="round"/>`;
}

function generateAvatar(h, v, d, w, size) {
  const seed = generateSeed(h, v, d, w);
  const rng  = createPRNG(seed);
  const tiles = buildTiles(h, v, d, rng);
  const sw = w * 4;
  const polys = tiles.map(t=>`  ${renderPolygon(t,sw)}`).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${size}" height="${size}" role="img">\n${polys}\n</svg>`;
}

// ── Generate examples ─────────────────────────────────────────
const OUT = path.join(__dirname, '..', 'assets');
const HUE_PRESETS = { red: 10/360, blue: 220/360, lime: 85/360 };

// Single parameter variation examples
function generateSingles() {
  // Defaults
  const H = HUE_PRESETS.blue;
  const V = 0.5, D = 0.5, W = 0.3;

  // ── h variation ──
  [0.028, 0.2, 0.4, 0.611, 0.8].forEach((h, i) => {
    fs.writeFileSync(path.join(OUT, `h-${i}.svg`), generateAvatar(h, V, D, W, 200));
  });

  // ── v variation ──
  [0, 0.25, 0.5, 0.75, 1].forEach((v, i) => {
    fs.writeFileSync(path.join(OUT, `v-${i}.svg`), generateAvatar(H, v, D, W, 200));
  });

  // ── d variation ──
  [0, 0.25, 0.5, 0.75, 1].forEach((d, i) => {
    fs.writeFileSync(path.join(OUT, `d-${i}.svg`), generateAvatar(H, V, d, W, 200));
  });

  // ── w variation ──
  [0, 0.25, 0.5, 0.75, 1].forEach((w, i) => {
    fs.writeFileSync(path.join(OUT, `w-${i}.svg`), generateAvatar(H, V, D, w, 200));
  });
}

// Hue × Density gallery matrix
function generateMatrix() {
  const hues = [HUE_PRESETS.red, HUE_PRESETS.blue, HUE_PRESETS.lime];
  const hueLabels = ['red', 'blue', 'lime'];
  const densities = [0.15, 0.5, 0.9];

  hueLabels.forEach((hl, hi) => {
    densities.forEach((d, di) => {
      const svg = generateAvatar(hues[hi], 0.5, d, 0.2, 200);
      fs.writeFileSync(path.join(OUT, `matrix-${hl}-d${di}.svg`), svg);
    });
  });
}

generateSingles();
generateMatrix();
console.log('Example SVGs generated in assets/');
