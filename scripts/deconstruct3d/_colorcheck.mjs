/**
 * Cross-checks stroke colours against the model's texture.
 *
 * For each stroke, finds the nearest point on the mesh by an independent route
 * (BVH closest point, its own barycentric UV) and samples the texture there.
 * If that disagrees with the colour the generator assigned, the sampling path
 * used during generation is wrong.
 */
import fs from 'fs';
import * as THREE from 'three';
import { readGLB, flattenScene } from './lib/glb.mjs';
import { loadMaterialTextures, srgbToLinear, hexOf } from './lib/texture.mjs';
import { normalizeInPlace, triangleData, weldVertices } from './lib/mesh.mjs';
import { buildBVH } from './lib/visibility.mjs';

const glb = process.argv[2];
const strokeFile = process.argv[3];
const gltf = await readGLB(glb);
const mesh = await flattenScene(gltf);
normalizeInPlace(mesh.positions, { fitHeight: 3.6 });
const tri = triangleData(mesh.positions, mesh.indices);
const weld = weldVertices(mesh.positions, 1e-5);
mesh.remap = weld.remap;
const materials = loadMaterialTextures(gltf, './scripts/deconstruct3d/.cache', 2048);
const { bvh, index } = buildBVH(mesh.positions, mesh.indices);

const strokes = JSON.parse(fs.readFileSync(strokeFile, 'utf8')).filter((s) => s.pass === 'fill');
const probe = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
const bary = new THREE.Vector3(), target = {};
const rgba = [0, 0, 0, 0];
const lum = (hex) => (parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16)) / 3;

let checked = 0, agree = 0, skipped = 0, worst = [];
for (const s of strokes) {
  const p = s.points[Math.floor(s.points.length / 2)];
  probe.set(p.x, p.y, p.z);
  const r = bvh.closestPointToPoint(probe, target, 0, 0.03);
  if (!r) { skipped++; continue; }
  const face = bvh.resolveTriangleIndex ? bvh.resolveTriangleIndex(r.faceIndex) : r.faceIndex;
  const ids = [index[face * 3], index[face * 3 + 1], index[face * 3 + 2]];
  a.fromArray(mesh.positions, ids[0] * 3);
  b.fromArray(mesh.positions, ids[1] * 3);
  c.fromArray(mesh.positions, ids[2] * 3);
  THREE.Triangle.getBarycoord(new THREE.Vector3().copy(r.point), a, b, c, bary);
  const w = [bary.x, bary.y, bary.z];
  let u = 0, v = 0;
  for (let k = 0; k < 3; k++) { u += w[k] * mesh.uvs[ids[k] * 2]; v += w[k] * mesh.uvs[ids[k] * 2 + 1]; }
  const mat = materials[mesh.triMaterial[face] ?? 0] || materials[0];
  if (!mat?.baseColor) continue;
  if (mat.alphaMode === 'BLEND') continue;   // alpha-weighted on purpose
  const t = mat.baseColor.sample(u, v, rgba);
  const expected = hexOf(srgbToLinear(t[0]), srgbToLinear(t[1]), srgbToLinear(t[2]));
  const d = Math.abs(lum(expected) - lum(s.color));
  checked++;
  if (d < 25) agree++;
  worst.push({ d, got: s.color, want: expected, y: p.y.toFixed(2), mat: mesh.triMaterial[face] });
}
worst.sort((x, y) => y.d - x.d);
console.log(`checked ${checked} fill strokes, ${agree} within 25 luma (${((agree / checked) * 100).toFixed(0)}%), ${skipped} drifted off the surface`);
console.log('worst disagreements:');
for (const w of worst.slice(0, 12)) console.log(`   got ${w.got} want ${w.want}  dLuma ${w.d.toFixed(0)}  y=${w.y} mat=${w.mat}`);
