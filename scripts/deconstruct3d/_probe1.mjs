import { readGLB, flattenScene } from './lib/glb.mjs';
import { loadMaterialTextures } from './lib/texture.mjs';
import { computeBounds, normalizeInPlace, triangleData, weldVertices, creaseEdges } from './lib/mesh.mjs';
import { computeExposure } from './lib/visibility.mjs';

const GLB = 'C:/Users/macie/Downloads/Meshy_AI_Apple_Seed_Cover_0922105525_texture_compressed.glb';
const CACHE = 'E:/X/AiStudio Workflow/V25/scripts/deconstruct3d/.cache';

console.time('read');
const gltf = readGLB(GLB);
const mesh = flattenScene(gltf);
console.timeEnd('read');
console.log('verts', mesh.positions.length/3, 'tris', mesh.indices.length/3, 'normals', mesh.hasNormals, 'uvs', mesh.hasUVs);
console.log('source bounds', JSON.stringify(computeBounds(mesh.positions)));

console.time('tex');
const mats = loadMaterialTextures(gltf, CACHE, 2048);
console.timeEnd('tex');
console.log('materials', mats.map(m=>({name:m.name, base:m.baseColor && [m.baseColor.width,m.baseColor.height], mr:m.metallicRoughness&&[m.metallicRoughness.width,m.metallicRoughness.height], bcf:m.baseColorFactor})));

const norm = normalizeInPlace(mesh.positions, { fitHeight: 3.6 });
console.log('normalized', JSON.stringify(norm.bounds), 'scale', norm.scale);

console.time('tri');
const tri = triangleData(mesh.positions, mesh.indices);
console.timeEnd('tri');
console.log('total surface area', tri.totalArea.toFixed(3));

console.time('weld');
const weld = weldVertices(mesh.positions, 1e-5);
console.timeEnd('weld');
console.log('welded', weld.weldedCount, 'of', mesh.positions.length/3);

console.time('exposure-sample');
// time a 5000-triangle subset to extrapolate
const sub = { positions: mesh.positions, indices: mesh.indices, tri: { ...tri, triCount: Math.min(5000, tri.triCount) } };
const t0 = Date.now();
const r = computeExposure(sub, { rays: 7 });
const dt = Date.now() - t0;
console.timeEnd('exposure-sample');
let open=0; for (let i=0;i<5000;i++) if (r.exposure[i]>0.05) open++;
console.log('exposed in subset', open, '/5000; est full time', (dt/5000*tri.triCount/1000).toFixed(1),'s');
