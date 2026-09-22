import { readGLB, flattenScene } from './lib/glb.mjs';
import { loadMaterialTextures } from './lib/texture.mjs';
import { normalizeInPlace, triangleData, weldVertices, makeRandom, makeNoise1D,
         buildAdjacency, smoothNormalField, closeMask } from './lib/mesh.mjs';
import { computeExposure, cacheKeyFor } from './lib/visibility.mjs';
import { polylineLength } from './lib/chain.mjs';
import { Painter } from './lib/painter.mjs';
import fs from 'fs';

const GLB = '../../public/demos/source-model.glb';
const gltf = await readGLB(GLB);
const mesh = await flattenScene(gltf);
normalizeInPlace(mesh.positions, { fitHeight: 3.6 });
const tri = triangleData(mesh.positions, mesh.indices);
const weld = weldVertices(mesh.positions, 1e-5);
mesh.remap = weld.remap;
const adjacency = buildAdjacency(mesh.indices, weld.remap);
const materials = loadMaterialTextures(gltf, './.cache', 2048);
const key = cacheKeyFor(GLB, fs.statSync(GLB).size, 3.6, tri.triCount, 'v2');
const ex = computeExposure({ positions: mesh.positions, indices: mesh.indices, tri }, { rays: 7, spreadDeg: 62, cacheKey: key, cacheDir: './.cache' });
let keep = new Uint8Array(tri.triCount);
for (let i = 0; i < tri.triCount; i++) keep[i] = ex.exposure[i] >= 0.08 ? 1 : 0;
keep = closeMask(keep, adjacency, 2);

const pct = (arr, f) => arr[Math.floor((arr.length - 1) * f)];
for (const smoothing of [8, 20, 40]) {
  for (const hyst of [0.08, 0.2]) {
    const normalField = smoothNormalField(tri, adjacency, smoothing);
    const painter = new Painter({ mesh, tri, materials, random: makeRandom(1), noise: makeNoise1D(makeRandom(2)),
      options: { coverage: 1.18, axisHysteresis: hyst, normalField } });
    const polys = painter.collectContours({ spacing: 0.1359, triangleFilter: keep });
    const lens = polys.map((p) => polylineLength(p.points)).sort((a, b) => a - b);
    const total = lens.reduce((a, b) => a + b, 0);
    console.log(`smooth ${String(smoothing).padStart(2)} hyst ${hyst}: ${lens.length} arcs, total ${total.toFixed(1)}, ` +
      `p50 ${pct(lens,0.5).toFixed(3)} p75 ${pct(lens,0.75).toFixed(3)} p90 ${pct(lens,0.9).toFixed(3)} max ${lens[lens.length-1].toFixed(2)}, ` +
      `len>0.4: ${lens.filter(l=>l>0.4).length}`);
  }
}
