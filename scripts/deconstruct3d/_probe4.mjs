import { readGLB, flattenScene } from './lib/glb.mjs';
import { normalizeInPlace, triangleData, weldVertices, buildAdjacency, smoothNormalField, closeMask } from './lib/mesh.mjs';
import { computeExposure, cacheKeyFor } from './lib/visibility.mjs';
import { sliceAxis, familyMasks } from './lib/slicer.mjs';
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
const pct = (arr, f) => arr[Math.floor((arr.length - 1) * f)];

for (const gate of [0.7, 0.75, 0.85]) {
  const fams = familyMasks(tri, keep, normalField, { gate });
  let all = [];
  for (const fam of fams) {
    for (const slice of sliceAxis(mesh, tri, { axis: fam.axis, spacing: 0.1359, mask: fam.mask, keep })) {
      for (const poly of chainSlice(slice.segments)) all.push(polylineLength(poly.points));
    }
  }
  all.sort((a,b)=>a-b);
  console.log(`gate ${gate}: families ${fams.map(f=>f.axis+':'+f.area.toFixed(1)).join(' ')} | ${all.length} arcs total ${all.reduce((a,b)=>a+b,0).toFixed(1)} ` +
    `p50 ${pct(all,0.5).toFixed(3)} p90 ${pct(all,0.9).toFixed(3)} max ${all[all.length-1].toFixed(2)} >0.4: ${all.filter(l=>l>0.4).length}`);
}
