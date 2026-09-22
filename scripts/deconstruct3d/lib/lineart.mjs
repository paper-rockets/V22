/**
 * Blender's Line Art, used as the wireframe stage.
 *
 * Finding a model's drawable edges properly means handling creases, material
 * boundaries, self-intersections, hidden-line removal and chaining. Blender
 * ships all of that as production animation tooling, so we run it headless and
 * read the strokes back instead of reimplementing a worse version.
 *
 * Blender returns bare polylines. Each point is then dropped back onto the
 * mesh to recover the surface normal, the texture coordinate and which
 * triangle it belongs to, which is what lets the stroke be coloured from the
 * texture and oriented against the surface.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import * as THREE from 'three';
import { buildBVH } from './visibility.mjs';

const CANDIDATE_DIRS = [
  'C:/Program Files/Blender Foundation',
  'C:/Program Files (x86)/Blender Foundation',
  '/Applications/Blender.app/Contents/MacOS',
  '/usr/bin',
  '/usr/local/bin',
];

/** Finds a Blender executable, newest version first. */
export function findBlender() {
  if (process.env.BLENDER_PATH && fs.existsSync(process.env.BLENDER_PATH)) return process.env.BLENDER_PATH;
  const found = [];
  for (const dir of CANDIDATE_DIRS) {
    if (!fs.existsSync(dir)) continue;
    let entries = [];
    try { entries = fs.readdirSync(dir); } catch { continue; }
    for (const entry of entries) {
      for (const exe of [path.join(dir, entry, 'blender.exe'), path.join(dir, entry), path.join(dir, entry, 'Blender')]) {
        if (fs.existsSync(exe) && fs.statSync(exe).isFile()) found.push(exe);
      }
    }
  }
  found.sort().reverse();
  return found[0] || null;
}

/**
 * Runs the bake and returns polylines in glTF coordinates.
 * Cached on disk: baking is a few seconds and the answer never changes.
 */
export function bakeLineArt(modelPath, { crease = 45, contour = false, smooth = 0.2, cacheDir, blender = null } = {}) {
  const exe = blender || findBlender();
  if (!exe) return null;

  const key = crypto.createHash('sha1')
    .update([path.resolve(modelPath), fs.statSync(modelPath).size, crease, contour, smooth].join('|'))
    .digest('hex').slice(0, 16);
  const cacheFile = cacheDir ? path.join(cacheDir, `lineart_${key}.json`) : null;
  if (cacheFile && fs.existsSync(cacheFile)) {
    return { ...JSON.parse(fs.readFileSync(cacheFile, 'utf8')), cached: true, blender: exe };
  }

  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'blender', 'lineart.py');
  const outFile = path.join(os.tmpdir(), `lineart_${key}.json`);
  const argv = [
    '--background', '--factory-startup', '--python', script, '--',
    '--model', path.resolve(modelPath), '--out', outFile,
    '--crease', String(crease), '--smooth', String(smooth),
  ];
  if (contour) argv.push('--contour');

  execFileSync(exe, argv, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  if (!fs.existsSync(outFile)) throw new Error('Blender produced no line art output');
  const data = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  fs.unlinkSync(outFile);
  if (cacheFile) {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(data));
  }
  return { ...data, cached: false, blender: exe };
}

/**
 * Drops bare 3D points back onto the mesh, recovering normal, uv and triangle
 * for each one. Points that land nowhere near the surface are dropped, which
 * also removes any stray line Blender drew through empty space.
 */
export function projectOntoMesh(lines, mesh, tri, transform, { maxDistance = 0.02 } = {}) {
  const { bvh, index } = buildBVH(mesh.positions, mesh.indices);
  const resolve = (faceIndex) => (bvh.resolveTriangleIndex ? bvh.resolveTriangleIndex(faceIndex) : faceIndex);
  const target = {};
  const probe = new THREE.Vector3();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const bary = new THREE.Vector3();
  const hit = new THREE.Vector3();

  const out = [];
  for (const line of lines) {
    const points = [];
    for (const [px, py, pz] of line) {
      probe.set(...transform(px, py, pz));
      const result = bvh.closestPointToPoint(probe, target, 0, maxDistance);
      if (!result) continue;
      const face = resolve(result.faceIndex);
      const i0 = index[face * 3], i1 = index[face * 3 + 1], i2 = index[face * 3 + 2];
      a.fromArray(mesh.positions, i0 * 3);
      b.fromArray(mesh.positions, i1 * 3);
      c.fromArray(mesh.positions, i2 * 3);
      hit.copy(result.point);
      THREE.Triangle.getBarycoord(hit, a, b, c, bary);
      const flip = mesh.triFlip && mesh.triFlip[face] ? -1 : 1;
      let nx = 0, ny = 0, nz = 0, u = 0, v = 0;
      const w = [bary.x, bary.y, bary.z];
      const ids = [i0, i1, i2];
      for (let k = 0; k < 3; k++) {
        nx += w[k] * mesh.normals[ids[k] * 3];
        ny += w[k] * mesh.normals[ids[k] * 3 + 1];
        nz += w[k] * mesh.normals[ids[k] * 3 + 2];
        u += w[k] * mesh.uvs[ids[k] * 2];
        v += w[k] * mesh.uvs[ids[k] * 2 + 1];
      }
      const l = Math.hypot(nx, ny, nz) || 1;
      points.push({
        x: probe.x, y: probe.y, z: probe.z,
        nx: (nx / l) * flip, ny: (ny / l) * flip, nz: (nz / l) * flip,
        u, v, tri: face, coverage: 1,
      });
    }
    if (points.length >= 2) out.push({ points, closed: false });
  }
  return out;
}
