/**
 * Exterior-shell detection.
 *
 * A model like this one is full of geometry nobody can see: the inside faces of
 * hollow armour, the rider's body buried under the mech, backing shells behind
 * panels. Slicing the raw mesh draws all of it, which is exactly why a naive
 * contour pass turns into a ball of wire.
 *
 * For every triangle we fire a small fan of rays outward and ask how many of
 * them escape the model. Zero escapes means the triangle is sealed inside and
 * gets dropped. Results are cached on disk because it is the slowest stage.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

export function buildBVH(positions, indices) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  // `indirect` keeps the caller's index buffer untouched - MeshBVH normally
  // permutes it as it builds, which would silently point every per-triangle
  // array we already computed at the wrong face. Hit results are mapped back
  // with resolveTriangleIndex.
  const bvh = new MeshBVH(geometry, { targetLeafSize: 8, indirect: true });
  return { geometry, bvh, index: indices };
}

/** Deterministic fan of directions around +Z, tilted out to `spreadDeg`. */
function coneDirections(count, spreadDeg) {
  const dirs = [];
  const spread = (spreadDeg * Math.PI) / 180;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    // first ray straight along the normal, the rest spiralling out
    const t = count === 1 ? 0 : i / (count - 1);
    const theta = spread * Math.sqrt(t);
    const phi = i * golden;
    dirs.push([Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)]);
  }
  return dirs;
}

function basisFromNormal(nx, ny, nz) {
  // Duff et al. branchless orthonormal basis
  const sign = nz >= 0 ? 1 : -1;
  const a = -1 / (sign + nz);
  const b = nx * ny * a;
  return [
    [1 + sign * nx * nx * a, sign * b, -sign * nx],
    [b, sign + ny * ny * a, -ny],
  ];
}

export function computeExposure(
  { positions, indices, tri },
  { rays = 7, spreadDeg = 62, cacheKey = null, cacheDir = null, onProgress = null } = {}
) {
  const cacheFile = cacheKey && cacheDir ? path.join(cacheDir, `exposure_${cacheKey}.bin`) : null;
  if (cacheFile && fs.existsSync(cacheFile)) {
    const buf = fs.readFileSync(cacheFile);
    if (buf.length === tri.triCount * 2) {
      const exposure = new Float32Array(tri.triCount);
      const flipped = new Uint8Array(tri.triCount);
      for (let i = 0; i < tri.triCount; i++) {
        exposure[i] = buf[i] / 255;
        flipped[i] = buf[tri.triCount + i];
      }
      return { exposure, flipped, cached: true };
    }
  }

  const { bvh } = buildBVH(positions, indices);
  const dirs = coneDirections(rays, spreadDeg);
  const bounds = new THREE.Box3();
  bvh.getBoundingBox(bounds);
  const diag = bounds.min.distanceTo(bounds.max);
  const eps = diag * 4e-4;
  const far = diag * 1.02;

  const exposure = new Float32Array(tri.triCount);
  const flipped = new Uint8Array(tri.triCount);
  const ray = new THREE.Ray();
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const countEscapes = (cx, cy, cz, nx, ny, nz) => {
    const [t1, t2] = basisFromNormal(nx, ny, nz);
    let escapes = 0;
    for (const d of dirs) {
      const dx = t1[0] * d[0] + t2[0] * d[1] + nx * d[2];
      const dy = t1[1] * d[0] + t2[1] * d[1] + ny * d[2];
      const dz = t1[2] * d[0] + t2[2] * d[1] + nz * d[2];
      origin.set(cx + nx * eps, cy + ny * eps, cz + nz * eps);
      dir.set(dx, dy, dz).normalize();
      ray.set(origin, dir);
      const hit = bvh.raycastFirst(ray, THREE.DoubleSide);
      if (!hit || hit.distance > far) escapes++;
    }
    return escapes;
  };

  // Both sides are measured. Which one counts is decided afterwards, for the
  // mesh as a whole: rescuing individual triangles by their back face sounds
  // reasonable but quietly resurrects the inside of every hollow wall, and
  // then the dark interior gets painted on top of the exterior.
  const backExposure = new Float32Array(tri.triCount);
  let frontOnly = 0, backOnly = 0;
  for (let t = 0; t < tri.triCount; t++) {
    const cx = tri.centroid[t * 3], cy = tri.centroid[t * 3 + 1], cz = tri.centroid[t * 3 + 2];
    const nx = tri.normal[t * 3], ny = tri.normal[t * 3 + 1], nz = tri.normal[t * 3 + 2];
    const front = countEscapes(cx, cy, cz, nx, ny, nz);
    const back = front > 0 ? 0 : countEscapes(cx, cy, cz, -nx, -ny, -nz);
    exposure[t] = front / dirs.length;
    backExposure[t] = back / dirs.length;
    if (front > 0) frontOnly++;
    else if (back > 0) backOnly++;
    if (onProgress && (t & 8191) === 0) onProgress(t, tri.triCount);
  }

  // Only if the model as a whole is wound inside out do we swap sides, and
  // then we swap every triangle together.
  if (backOnly > frontOnly) {
    for (let t = 0; t < tri.triCount; t++) {
      exposure[t] = backExposure[t];
      flipped[t] = backExposure[t] > 0 ? 1 : 0;
    }
  }

  if (cacheFile) {
    fs.mkdirSync(cacheDir, { recursive: true });
    const buf = Buffer.alloc(tri.triCount * 2);
    for (let i = 0; i < tri.triCount; i++) {
      buf[i] = Math.round(exposure[i] * 255);
      buf[tri.triCount + i] = flipped[i];
    }
    fs.writeFileSync(cacheFile, buf);
  }

  return { exposure, flipped, cached: false };
}

export function cacheKeyFor(...parts) {
  return crypto.createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 16);
}
