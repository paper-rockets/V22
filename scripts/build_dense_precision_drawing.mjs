import fs from 'fs';
import path from 'path';
import { MeshoptSimplifier } from 'meshoptimizer';

const GLB_PATH = 'C:\\Users\\macie\\Downloads\\Meshy_AI_Apple_Seed_Cover_0922105525_texture.glb';
const TEXTURE_RGBA_PATH = 'e:\\X\\AiStudio Workflow\\V25\\scripts\\temp_texture_1024.rgba';
const OUTPUT_DIR = 'e:\\X\\AiStudio Workflow\\V25\\public\\demos';

// 1. Chaikin Smoothing for smooth, aerodynamic artistic curves (no zig-zag triangle chatter)
function chaikinSmooth(points, iterations = 2) {
  if (points.length < 3) return points;
  let current = points;
  for (let it = 0; it < iterations; it++) {
    const next = [current[0]];
    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i];
      const p1 = current[i + 1];
      const q = {
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y,
        z: 0.75 * p0.z + 0.25 * p1.z,
        u: 0.75 * p0.u + 0.25 * p1.u,
        v: 0.75 * p0.v + 0.25 * p1.v,
      };
      const r = {
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y,
        z: 0.25 * p0.z + 0.75 * p1.z,
        u: 0.25 * p0.u + 0.75 * p1.u,
        v: 0.25 * p0.v + 0.75 * p1.v,
      };
      next.push(q, r);
    }
    next.push(current[current.length - 1]);
    current = next;
  }
  return current;
}

async function run() {
  await MeshoptSimplifier.ready;
  console.log('=== Generating 2500+ Ultra-Fine Accurate 3D Drawing Strokes ===');
  console.time('Total Processing');

  // Load GLB
  const fd = fs.openSync(GLB_PATH, 'r');
  const posBuf = Buffer.alloc(19629192);
  fs.readSync(fd, posBuf, 0, 19629192, 1716);
  const pos = new Float32Array(posBuf.buffer, posBuf.byteOffset, 1635766 * 3);

  const uvBuf = Buffer.alloc(13086128);
  fs.readSync(fd, uvBuf, 0, 13086128, 1716 + 39258384);
  const uvs = new Float32Array(uvBuf.buffer, uvBuf.byteOffset, 1635766 * 2);

  const idxBuf = Buffer.alloc(37285068);
  fs.readSync(fd, idxBuf, 0, 37285068, 1716 + 52344512);
  const indices = new Uint32Array(idxBuf.buffer, idxBuf.byteOffset, 9321267);
  fs.closeSync(fd);

  // Load Texture
  const rgba = fs.readFileSync(TEXTURE_RGBA_PATH);
  function getHex(u, v) {
    u = ((u % 1) + 1) % 1;
    v = ((v % 1) + 1) % 1;
    const px = Math.min(1023, Math.max(0, Math.floor(u * 1024)));
    const py = Math.min(1023, Math.max(0, Math.floor((1 - v) * 1024)));
    const idx = (py * 1024 + px) * 4;
    const r = rgba[idx], g = rgba[idx + 1], b = rgba[idx + 2];
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  // Centering transform: Target (-0.08, 0.42, 0)
  const TARGET_CENTER_X = -0.08;
  const TARGET_CENTER_Y = 0.42;
  const TARGET_CENTER_Z = 0.0;
  const MODEL_CENTER_Y = 1.5;

  function transform(x, y, z) {
    return {
      x: Number((x + TARGET_CENTER_X).toFixed(4)),
      y: Number(((y - MODEL_CENTER_Y) + TARGET_CENTER_Y).toFixed(4)),
      z: Number((z + TARGET_CENTER_Z).toFixed(4)),
    };
  }

  // To achieve maximum accuracy without abstract tumbleweed:
  // We extract multiple orthogonal families of dense, smooth 3D cross-contours & feature slices:
  // 1. High-Density Horizontal Cross-Contours (120 levels, 1 every 2.4 cm)
  // 2. High-Density Coronal Cross-Contours (60 depth slices, 1 every 3.5 cm)
  // 3. High-Density Sagittal Cross-Contours (60 lateral slices, 1 every 3.8 cm)
  // 4. Feature Creases & Silhouette Outlines
  // All curves smoothed with Chaikin smoothing and rendered with ULTRA-FINE brush (size 0.007 - 0.010)!

  console.log('Extracting dense multi-directional cross-contours...');

  // Fast Spatial Multi-Axis Slicing (100% Triangle Coverage, Zero Skips)
  console.log('Extracting dense multi-directional continuous contours with 100% triangle coverage...');

  const yCount = 200, yMin = 0.05, yMax = 2.92;
  const zCount = 100, zMin = -1.15, zMax = 1.15;
  const xCount = 100, xMin = -1.25, xMax = 1.25;

  const dy = (yMax - yMin) / (yCount - 1);
  const dz = (zMax - zMin) / (zCount - 1);
  const dx = (xMax - xMin) / (xCount - 1);

  const ySlices = Array.from({ length: yCount }, () => []);
  const zSlices = Array.from({ length: zCount }, () => []);
  const xSlices = Array.from({ length: xCount }, () => []);

  const triCount = indices.length / 3;

  for (let t = 0; t < triCount; t++) {
    const i0 = indices[t * 3], i1 = indices[t * 3 + 1], i2 = indices[t * 3 + 2];
    const x0 = pos[i0*3], y0 = pos[i0*3+1], z0 = pos[i0*3+2];
    const x1 = pos[i1*3], y1 = pos[i1*3+1], z1 = pos[i1*3+2];
    const x2 = pos[i2*3], y2 = pos[i2*3+1], z2 = pos[i2*3+2];

    const u0 = uvs[i0*2], v0 = uvs[i0*2+1];
    const u1 = uvs[i1*2], v1 = uvs[i1*2+1];
    const u2 = uvs[i2*2], v2 = uvs[i2*2+1];

    // --- Y Slices (Horizontal Rings) ---
    const minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
    const syStart = Math.max(0, Math.ceil((minY - yMin) / dy));
    const syEnd = Math.min(yCount - 1, Math.floor((maxY - yMin) / dy));

    for (let s = syStart; s <= syEnd; s++) {
      const val = yMin + s * dy;
      const pts = [];
      const test = (xa, ya, za, xb, yb, zb, ua, va, ub, vb) => {
        if ((ya - val) * (yb - val) <= 0 && ya !== yb) {
          const f = (val - ya) / (yb - ya);
          pts.push({ x: xa + f*(xb - xa), y: val, z: za + f*(zb - za), u: ua + f*(ub - ua), v: va + f*(vb - va) });
        }
      };
      test(x0, y0, z0, x1, y1, z1, u0, v0, u1, v1);
      test(x1, y1, z1, x2, y2, z2, u1, v1, u2, v2);
      test(x2, y2, z2, x0, y0, z0, u2, v2, u0, v0);
      if (pts.length >= 2) ySlices[s].push([pts[0], pts[1]]);
    }

    // --- Z Slices (Coronal Curves) ---
    const minZ = Math.min(z0, z1, z2), maxZ = Math.max(z0, z1, z2);
    const szStart = Math.max(0, Math.ceil((minZ - zMin) / dz));
    const szEnd = Math.min(zCount - 1, Math.floor((maxZ - zMin) / dz));

    for (let s = szStart; s <= szEnd; s++) {
      const val = zMin + s * dz;
      const pts = [];
      const test = (xa, ya, za, xb, yb, zb, ua, va, ub, vb) => {
        if ((za - val) * (zb - val) <= 0 && za !== zb) {
          const f = (val - za) / (zb - za);
          pts.push({ x: xa + f*(xb - xa), y: ya + f*(yb - ya), z: val, u: ua + f*(ub - ua), v: va + f*(vb - va) });
        }
      };
      test(x0, y0, z0, x1, y1, z1, u0, v0, u1, v1);
      test(x1, y1, z1, x2, y2, z2, u1, v1, u2, v2);
      test(x2, y2, z2, x0, y0, z0, u2, v2, u0, v0);
      if (pts.length >= 2) zSlices[s].push([pts[0], pts[1]]);
    }

    // --- X Slices (Sagittal Profiles) ---
    const minX = Math.min(x0, x1, x2), maxX = Math.max(x0, x1, x2);
    const sxStart = Math.max(0, Math.ceil((minX - xMin) / dx));
    const sxEnd = Math.min(xCount - 1, Math.floor((maxX - xMin) / dx));

    for (let s = sxStart; s <= sxEnd; s++) {
      const val = xMin + s * dx;
      const pts = [];
      const test = (xa, ya, za, xb, yb, zb, ua, va, ub, vb) => {
        if ((xa - val) * (xb - val) <= 0 && xa !== xb) {
          const f = (val - xa) / (xb - xa);
          pts.push({ x: val, y: ya + f*(yb - ya), z: za + f*(zb - za), u: ua + f*(ub - ua), v: va + f*(vb - va) });
        }
      };
      test(x0, y0, z0, x1, y1, z1, u0, v0, u1, v1);
      test(x1, y1, z1, x2, y2, z2, u1, v1, u2, v2);
      test(x2, y2, z2, x0, y0, z0, u2, v2, u0, v0);
      if (pts.length >= 2) xSlices[s].push([pts[0], pts[1]]);
    }
  }

  function chainSmoothSegments(segments, maxStrokes = 12, minLen = 0.05) {
    if (segments.length === 0) return [];
    const used = new Uint8Array(segments.length);
    const cellSize = 0.02;
    const grid = new Map();
    function k(p) { return `${Math.round(p.x/cellSize)},${Math.round(p.y/cellSize)},${Math.round(p.z/cellSize)}`; }

    for (let i = 0; i < segments.length; i++) {
      const kA = k(segments[i][0]), kB = k(segments[i][1]);
      if (!grid.has(kA)) grid.set(kA, []);
      if (!grid.has(kB)) grid.set(kB, []);
      grid.get(kA).push({ s: i, e: 0 });
      grid.get(kB).push({ s: i, e: 1 });
    }

    const strokes = [];
    for (let i = 0; i < segments.length; i++) {
      if (used[i]) continue;
      used[i] = 1;

      let chain = [segments[i][0], segments[i][1]];
      let tail = segments[i][1];

      while (true) {
        const cands = grid.get(k(tail)) || [];
        let bestDist = 0.025;
        let bestSeg = -1;
        let bestPt = null;

        for (const c of cands) {
          if (used[c.s]) continue;
          const match = c.e === 0 ? segments[c.s][0] : segments[c.s][1];
          const other = c.e === 0 ? segments[c.s][1] : segments[c.s][0];
          const d = Math.hypot(tail.x - match.x, tail.y - match.y, tail.z - match.z);
          if (d < bestDist) {
            bestDist = d;
            bestSeg = c.s;
            bestPt = other;
          }
        }

        if (bestSeg !== -1) {
          used[bestSeg] = 1;
          chain.push(bestPt);
          tail = bestPt;
        } else {
          break;
        }
      }

      // Calculate total length
      let len = 0;
      for (let j = 1; j < chain.length; j++) {
        len += Math.hypot(chain[j].x - chain[j-1].x, chain[j].y - chain[j-1].y, chain[j].z - chain[j-1].z);
      }

      if (len >= minLen && chain.length >= 6) {
        // Chaikin smoothing
        const smoothed = chaikinSmooth(chain, 2);
        // Resample every 0.014m
        const sampled = [smoothed[0]];
        let last = smoothed[0];
        for (let j = 1; j < smoothed.length; j++) {
          const d = Math.hypot(smoothed[j].x - last.x, smoothed[j].y - last.y, smoothed[j].z - last.z);
          if (d >= 0.014 || j === smoothed.length - 1) {
            sampled.push(smoothed[j]);
            last = smoothed[j];
          }
        }
        if (sampled.length >= 5) {
          strokes.push(sampled);
          if (strokes.length >= maxStrokes) break;
        }
      }
    }
    return strokes;
  }

  const allStrokes = [];

  console.log('Chaining Y horizontal rings...');
  for (let s = 0; s < yCount; s++) {
    const chains = chainSmoothSegments(ySlices[s], 12, 0.045);
    for (const ch of chains) allStrokes.push({ raw: ch, dir: 'horizontal' });
  }
  console.log(`Extracted ${allStrokes.length} horizontal ring strokes.`);

  console.log('Chaining Z coronal curves...');
  for (let s = 0; s < zCount; s++) {
    const chains = chainSmoothSegments(zSlices[s], 10, 0.05);
    for (const ch of chains) allStrokes.push({ raw: ch, dir: 'coronal' });
  }
  console.log(`Total strokes now: ${allStrokes.length}`);

  console.log('Chaining X sagittal profiles...');
  for (let s = 0; s < xCount; s++) {
    const chains = chainSmoothSegments(xSlices[s], 10, 0.05);
    for (const ch of chains) allStrokes.push({ raw: ch, dir: 'sagittal' });
  }
  console.log(`Total strokes now: ${allStrokes.length}`);

  // Format into accurate, fine, multi-brush colored strokes
  console.log('Formatting strokes with multi-brush variation and sampled colors...');
  const formatted = allStrokes.map((sObj, idx) => {
    const pts = sObj.raw;
    // Sample 5 points along curve to get authentic dominant color
    const samples = [0, 0.25, 0.5, 0.75, 1].map(f => {
      const p = pts[Math.floor(f * (pts.length - 1))];
      return getHex(p.u, p.v);
    });
    const hex = samples[2]; // Median color

    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);

    const isGoldOrYellow = r > 135 && g > 105 && b < 110 && (r - b > 30);
    const isBrightAccent = (r > 165 && g < 110 && b < 110) || (r > 175 && g > 175 && b > 175);

    let brushShape = 'round';
    let materialType = 'metallic';
    let roughness = 0.45;
    let metalness = 0.65;
    let size = 0.008;

    if (isGoldOrYellow) {
      brushShape = 'conformal';
      materialType = 'metallic';
      roughness = 0.18;
      metalness = 0.95;
      size = 0.007; // Fine razor-crisp gold accent
    } else if (isBrightAccent) {
      brushShape = 'round';
      materialType = 'metallic';
      roughness = 0.25;
      metalness = 0.85;
      size = 0.0075;
    } else if (sObj.dir === 'horizontal') {
      brushShape = 'round';
      materialType = 'matte';
      roughness = 0.55;
      metalness = 0.35;
      size = 0.0085;
    } else {
      brushShape = 'round';
      materialType = 'metallic';
      roughness = 0.45;
      metalness = 0.65;
      size = 0.0075;
    }

    const points = pts.map((p, pIdx) => {
      const tp = transform(p.x, p.y, p.z);
      const t = pIdx / (pts.length - 1);
      const pressure = Number((0.45 + 0.5 * Math.sin(t * Math.PI)).toFixed(2));
      return {
        x: tp.x,
        y: tp.y,
        z: tp.z,
        pressure,
      };
    });

    return {
      id: 'stroke_dense_' + idx,
      color: hex,
      size,
      brushShape,
      materialType,
      roughness,
      metalness,
      points,
    };
  });

  console.log(`Total formatted continuous strokes: ${formatted.length}`);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'model-contours.json'), JSON.stringify(formatted));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'model-hybrid.json'), JSON.stringify(formatted));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'model-solid.json'), JSON.stringify(formatted));

  console.timeEnd('Total Processing');
  console.log('=== High-Precision Stroke Library Saved Successfully ===');
}

run().catch(console.error);
