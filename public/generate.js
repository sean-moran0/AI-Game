import { createNoise2D } from '/simplex-noise/simplex-noise.js';

// --- Terrain bands (on normalized 0..1 elevation) -------------------------
// Water bands are derived from the water level; land bands are absolute.
const TERRAIN = {
  deepWater: { color: '#163d5c', water: true },
  water:     { color: '#2a6f97', water: true },
  beach:     { color: '#e0d8a8', water: false },
  grass:     { color: '#5a9d4a', water: false },
  forest:    { color: '#356a2a', water: false },
  mountain:  { color: '#7a6f63', water: false },
  snow:      { color: '#f2f2f2', water: false },
};

function classify(e, waterLevel) {
  if (e < waterLevel * 0.6) return 'deepWater';
  if (e < waterLevel) return 'water';
  if (e < waterLevel + 0.03) return 'beach';
  if (e < 0.55) return 'grass';
  if (e < 0.70) return 'forest';
  if (e < 0.85) return 'mountain';
  return 'snow';
}

// --- Seeded PRNG (mulberry32) so a seed reproduces the same map ------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fractal Brownian motion: layered noise for natural-looking terrain.
function fbm(noise2D, x, y, { octaves, persistence, lacunarity, frequency }) {
  let amplitude = 1;
  let freq = frequency;
  let sum = 0;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amplitude * noise2D(x * freq, y * freq);
    max += amplitude;
    amplitude *= persistence;
    freq *= lacunarity;
  }
  return sum / max; // -1..1
}

// Radial gradient that pushes the map edges underwater -> island shapes.
function islandFalloff(col, row, size, strength) {
  const nx = (col / (size - 1)) * 2 - 1;
  const ny = (row / (size - 1)) * 2 - 1;
  const d = Math.min(1, Math.sqrt(nx * nx + ny * ny) / Math.SQRT2);
  return d * d * strength;
}

// --- Core generation ------------------------------------------------------
function readParams() {
  return {
    seed: Number(document.getElementById('seed').value) | 0,
    gridSize: Number(document.getElementById('gridSize').value),
    frequency: Number(document.getElementById('frequency').value),
    octaves: Number(document.getElementById('octaves').value),
    persistence: Number(document.getElementById('persistence').value),
    lacunarity: Number(document.getElementById('lacunarity').value),
    waterLevel: Number(document.getElementById('waterLevel').value),
    island: document.getElementById('island').checked,
    islandStrength: Number(document.getElementById('islandStrength').value),
  };
}

// Returns a Float32Array of normalized (0..1) elevation, row-major.
function generateGrid(p) {
  const noise2D = createNoise2D(mulberry32(p.seed));
  const size = p.gridSize;
  const grid = new Float32Array(size * size);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let e = (fbm(noise2D, col, row, p) + 1) / 2; // 0..1
      if (p.island) {
        e -= islandFalloff(col, row, size, p.islandStrength);
      }
      grid[row * size + col] = Math.max(0, Math.min(1, e));
    }
  }
  return grid;
}

// --- Rendering ------------------------------------------------------------
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');

let lastGrid = null;
let lastParams = null;

function render(grid, p) {
  const size = p.gridSize;
  canvas.width = size;
  canvas.height = size;
  const img = ctx.createImageData(size, size);

  for (let i = 0; i < grid.length; i++) {
    const terrain = classify(grid[i], p.waterLevel);
    const hex = TERRAIN[terrain].color;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const o = i * 4;
    img.data[o] = r;
    img.data[o + 1] = g;
    img.data[o + 2] = b;
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function generate() {
  const p = readParams();
  lastGrid = generateGrid(p);
  lastParams = p;
  render(lastGrid, p);
}

// --- GeoJSON export -------------------------------------------------------
// Each row is run-length merged: consecutive cells of the same terrain become
// one rectangular Polygon. Coordinates use a simple [x, y] grid (row 0 = north,
// so y is flipped) — load with Leaflet's L.geoJSON under CRS.Simple.
function buildGeoJSON(grid, p) {
  const size = p.gridSize;
  const features = [];

  const terrainAt = (col, row) => classify(grid[row * size + col], p.waterLevel);

  for (let row = 0; row < size; row++) {
    let runStart = 0;
    let runTerrain = terrainAt(0, row);
    let elevSum = grid[row * size];

    for (let col = 1; col <= size; col++) {
      const t = col < size ? terrainAt(col, row) : null;
      if (t !== runTerrain) {
        features.push(makeFeature(runStart, col, row, size, runTerrain, elevSum / (col - runStart)));
        runStart = col;
        runTerrain = t;
        elevSum = 0;
      }
      if (col < size) elevSum += grid[row * size + col];
    }
  }

  return { type: 'FeatureCollection', features };
}

function makeFeature(colStart, colEnd, row, size, terrain, avgElevation) {
  // y flipped so row 0 sits at the top (north).
  const x0 = colStart;
  const x1 = colEnd;
  const y0 = size - row - 1;
  const y1 = size - row;
  return {
    type: 'Feature',
    properties: {
      terrain,
      water: TERRAIN[terrain].water,
      elevation: Math.round(avgElevation * 1000) / 1000,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]],
    },
  };
}

function exportGeoJSON() {
  if (!lastGrid) generate();
  const geojson = buildGeoJSON(lastGrid, lastParams);
  const blob = new Blob([JSON.stringify(geojson)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `map-${lastParams.seed}.geojson`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Wiring ---------------------------------------------------------------
function buildLegend() {
  const legend = document.getElementById('legend');
  legend.innerHTML = '';
  for (const [name, { color }] of Object.entries(TERRAIN)) {
    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = `<span class="swatch" style="background:${color}"></span>${name}`;
    legend.appendChild(item);
  }
}

// Live-update the value readout next to each slider, and regenerate.
const sliders = ['gridSize', 'frequency', 'octaves', 'persistence', 'lacunarity', 'waterLevel', 'islandStrength'];
for (const id of sliders) {
  const el = document.getElementById(id);
  const val = document.getElementById(`${id}-val`);
  const sync = () => { val.textContent = el.value; };
  el.addEventListener('input', () => { sync(); generate(); });
  sync();
}
document.getElementById('seed').addEventListener('change', generate);
document.getElementById('island').addEventListener('change', generate);
document.getElementById('generate').addEventListener('click', generate);
document.getElementById('export').addEventListener('click', exportGeoJSON);
document.getElementById('randomize').addEventListener('click', () => {
  document.getElementById('seed').value = Math.floor(Math.random() * 1_000_000);
  generate();
});

buildLegend();
generate();
