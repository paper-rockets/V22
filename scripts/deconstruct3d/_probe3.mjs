import { readGLB, flattenScene } from './lib/glb.mjs';
import { normalizeInPlace, triangleData, weldVertices, buildAdjacency, smoothNormalField, closeMask } from './lib/mesh.mjs';
import { computeExposure, cacheKeyFor } from './lib/visibility.mjs';
import { sliceAxis, partitionByAxis } from './lib/slicer.mjs';
import { chainSlice, polylineLength } from './lib/chain.mjs';
import fs from 'fs';

const GLB = '../../public/demos/source-model.glb';
const gltf = await readGLB(GLB);
const mesh = await flattenScene(gltf);
normalizeInPlace(mesh.positions, { fitHeight: 3.6 });
const tri = triangleData(mesh.positions, mesh.indices);
const weld = weldVertices(mesh.positions, 1e-5);
mesh.remap = weld.remap;
const adjacency = buildAdjacency(mesh.indices, weld.remap);
const key = cacheKeyFor(GLB, fs.statSync(GLB).size, 3.6, tri.triCount, 'v2');
const ex = computeExposure({ positions: mesh.positions, indices: mesh.indices, tri }, { rays: 7, spreadDeg: 62, cacheKey: key, cacheDir: './.cache' });
let keep = new Uint8Array(tri.triCount);
for (let i = 0; i < tri.triCount; i++) keep[i] = ex.exposure[i] >= 0.08 ? 1 : 0;
keep = closeMask(keep, adjacency, 2);
const normalField = smoothNormalField(tri, adjacency, 8);

function report(tag, maskArg, keepArg) {
  const slices = sliceAxis(mesh, tri, { axis: 'y', spacing: 0.1359, mask: maskArg, keep: keepArg });
  const mid = slices[Math.floor(slices.length / 2)];
  const polys = chainSlice(mid.segments);
  // how many endpoint keys are shared by exactly 2 segments?
  const counts = new Map();
  for (const seg of mid.segments) for (const e of [0,1]) counts.set(seg[e].key, (counts.get(seg[e].key)||0)+1);
  const deg = [0,0,0,0];
  for (const c of counts.values()) deg[Math.min(3,c)]++;
  const lens = polys.map(p=>polylineLength(p.points)).sort((a,b)=>b-a);
  console.log(`${tag}: slice y=${mid.planeValue.toFixed(2)} segs ${mid.segments.length} -> ${polys.length} arcs; ` +
    `endpoint degree 1:${deg[1]} 2:${deg[2]} 3+:${deg[3]}; longest ${lens.slice(0,4).map(v=>v.toFixed(2)).join(',')} total ${lens.reduce((a,b)=>a+b,0).toFixed(2)}`);
}
const full = new Uint8Array(tri.triCount).fill(7);
const allKeep = new Uint8Array(tri.triCount).fill(1);
report('no mask, no cull  ', full, allKeep);
report('axis mask, no cull', partitionByAxis(tri, allKeep, 0.08, normalField), allKeep);
report('no mask, culled   ', full, keep);
report('axis mask + cull  ', partitionByAxis(tri, keep, 0.08, normalField), keep);
