import { readGLB, flattenScene } from './lib/glb.mjs';
import { loadMaterialTextures, hexOf, oklabToLinear } from './lib/texture.mjs';
import { normalizeInPlace, triangleData, weldVertices, buildAdjacency, smoothNormalField, closeMask } from './lib/mesh.mjs';
import { computeExposure, cacheKeyFor } from './lib/visibility.mjs';
import { segmentRegions } from './lib/regions.mjs';
import { Artist } from './lib/artist.mjs';
import { makeRandom, makeNoise1D } from './lib/mesh.mjs';
import fs from 'fs';

const GLB = process.argv[2];
const gltf = await readGLB(GLB); const mesh = await flattenScene(gltf);
normalizeInPlace(mesh.positions, { fitHeight: 3.6 });
const tri = triangleData(mesh.positions, mesh.indices);
const weld = weldVertices(mesh.positions, 1e-5); mesh.remap = weld.remap;
const adjacency = buildAdjacency(mesh.indices, weld.remap);
const materials = loadMaterialTextures(gltf, './scripts/deconstruct3d/.cache', 2048);
mesh.triFlip = new Uint8Array(tri.triCount);
const key = cacheKeyFor(GLB, fs.statSync(GLB).size, 3.6, tri.triCount, 'v3');
const r = computeExposure({ positions: mesh.positions, indices: mesh.indices, tri }, { rays: 7, spreadDeg: 62, cacheKey: key, cacheDir: './scripts/deconstruct3d/.cache' });
let keep = new Uint8Array(tri.triCount);
for (let i = 0; i < tri.triCount; i++) { keep[i] = r.exposure[i] >= 0.08 ? 1 : 0; if (keep[i] && r.flipped[i]) mesh.triFlip[i] = 1; }
keep = closeMask(keep, adjacency, 2);
const field = smoothNormalField(tri, adjacency, 6);
const artist = new Artist({ mesh, tri, materials, random: makeRandom(1), noise: makeNoise1D(makeRandom(2)), options: {} });
let total = 0; for (let i = 0; i < tri.triCount; i++) if (keep[i]) total += tri.area[i];
const { regions } = segmentRegions(mesh, tri, adjacency, keep, (t) => artist.colorOfTriangle(t),
  { normalTolerance: 26, colorTolerance: 0.07, minArea: total * 0.0008, normalField: field });
const use = regions.filter(x => x.triangles.length);
console.log(`total area ${total.toFixed(2)}, ${use.length} patches`);
for (const g of use.slice(0, 14)) {
  const lin = oklabToLinear(g.lab[0], g.lab[1], g.lab[2]);
  let alpha = 0;
  const sample = g.triangles.slice(0, 40);
  for (const t of sample) {
    let u = 0, v = 0;
    for (let c = 0; c < 3; c++) { const vi = mesh.indices[t*3+c]; u += mesh.uvs[vi*2]; v += mesh.uvs[vi*2+1]; }
    alpha += artist.alphaAt({ tri: t, u: u/3, v: v/3 });
  }
  alpha /= sample.length;
  console.log(`  ${(100*g.area/total).toFixed(1).padStart(5)}%  ${hexOf(Math.max(0,lin[0]),Math.max(0,lin[1]),Math.max(0,lin[2]))}  n=[${g.normal.map(v=>v.toFixed(2)).join(',')}]  centre y=${g.centroid[1].toFixed(2)}  extent ${g.frame.longExtent.toFixed(2)}x${g.frame.shortExtent.toFixed(2)}  mat=${mesh.triMaterial[g.triangles[0]]} alpha=${alpha.toFixed(2)}`);
}
