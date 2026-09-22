/**
 * 3D Model Deconstructor & Reverse-Engineering Engine
 * Extracts 3D drawing strokes with true colors from a high-res GLB model and texture.
 */

import fs from 'fs';
import path from 'path';

const GLB_PATH = 'C:\\Users\\macie\\Downloads\\Meshy_AI_Apple_Seed_Cover_0922105525_texture.glb';
const TEXTURE_RGBA_PATH = 'e:\\X\\AiStudio Workflow\\V25\\scripts\\temp_texture_1024.rgba';
const OUTPUT_DIR = 'e:\\X\\AiStudio Workflow\\V25\\public\\demos';

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('=== Starting 3D Model Deconstruction ===');
console.time('Total Deconstruction Time');

// 1. Read GLB Binary Buffers directly
console.log('Reading binary mesh buffers from GLB...');
const fd = fs.openSync(GLB_PATH, 'r');

const posBuf = Buffer.alloc(19629192);
fs.readSync(fd, posBuf, 0, 19629192, 1716);
const pos = new Float32Array(posBuf.buffer, posBuf.byteOffset, 1635766 * 3);

const normBuf = Buffer.alloc(19629192);
fs.readSync(fd, normBuf, 0, 19629192, 1716 + 19629192);
const normals = new Float32Array(normBuf.buffer, normBuf.byteOffset, 1635766 * 3);

const uvBuf = Buffer.alloc(13086128);
fs.readSync(fd, uvBuf, 0, 13086128, 1716 + 39258384);
const uvs = new Float32Array(uvBuf.buffer, uvBuf.byteOffset, 1635766 * 2);

const idxBuf = Buffer.alloc(37285068);
fs.readSync(fd, idxBuf, 0, 37285068, 1716 + 52344512);
const indices = new Uint32Array(idxBuf.buffer, idxBuf.byteOffset, 9321267);

fs.closeSync(fd);
console.log(`Loaded ${pos.length / 3} vertices and ${indices.length / 3} triangles.`);

// 2. Load 1024x1024 RGBA texture buffer for instant color sampling
console.log('Loading texture map...');
const rgba = fs.readFileSync(TEXTURE_RGBA_PATH);

function sampleColorAtUV(u, v) {
  u = ((u % 1) + 1) % 1;
  v = ((v % 1) + 1) % 1;
  const px = Math.min(1023, Math.max(0, Math.floor(u * 1024)));
  const py = Math.min(1023, Math.max(0, Math.floor((1 - v) * 1024)));
  const idx = (py * 1024 + px) * 4;
  const r = rgba[idx];
  const g = rgba[idx + 1];
  const b = rgba[idx + 2];
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

// 3. Coordinate transform: Fit cleanly to StudioEngine's camera frame
// Original bounds: X: [-1.31, 1.33], Y: [0, 3], Z: [-1.25, 1.23]
// StudioEngine camera looks at target: (-0.08, 0.42, 0)
const TARGET_CENTER_X = -0.08;
const TARGET_CENTER_Y = 0.42;
const TARGET_CENTER_Z = 0.0;
const MODEL_CENTER_Y = 1.5;

function transformPoint(x, y, z) {
  return {
    x: Number((x + TARGET_CENTER_X).toFixed(4)),
    y: Number(((y - MODEL_CENTER_Y) + TARGET_CENTER_Y).toFixed(4)),
    z: Number((z + TARGET_CENTER_Z).toFixed(4)),
  };
}

// 4. Triangle Slicing Engine
function sliceMeshWithPlane(planeAxis, planeVal) {
  const segments = [];
  const totalTriangles = indices.length / 3;

  for (let t = 0; t < totalTriangles; t++) {
    const i0 = indices[t * 3];
    const i1 = indices[t * 3 + 1];
    const i2 = indices[t * 3 + 2];

    const v0x = pos[i0 * 3], v0y = pos[i0 * 3 + 1], v0z = pos[i0 * 3 + 2];
    const v1x = pos[i1 * 3], v1y = pos[i1 * 3 + 1], v1z = pos[i1 * 3 + 2];
    const v2x = pos[i2 * 3], v2y = pos[i2 * 3 + 1], v2z = pos[i2 * 3 + 2];

    const val0 = planeAxis === 'y' ? v0y : (planeAxis === 'z' ? v0z : v0x);
    const val1 = planeAxis === 'y' ? v1y : (planeAxis === 'z' ? v1z : v1x);
    const val2 = planeAxis === 'y' ? v2y : (planeAxis === 'z' ? v2z : v2x);

    const minV = Math.min(val0, val1, val2);
    const maxV = Math.max(val0, val1, val2);

    if (minV > planeVal || maxV < planeVal) continue;

    // Check edges
    const pts = [];
    const edge = (vaX, vaY, vaZ, vbX, vbY, vbZ, valA, valB, uA, vA, uB, vB, nAx, nAy, nAz, nBx, nBy, nBz) => {
      if ((valA - planeVal) * (valB - planeVal) <= 0 && valA !== valB) {
        const factor = (planeVal - valA) / (valB - valA);
        const x = vaX + factor * (vbX - vaX);
        const y = vaY + factor * (vbY - vaY);
        const z = vaZ + factor * (vbZ - vaZ);
        const u = uA + factor * (uB - uA);
        const v = vA + factor * (vB - vA);
        const nx = nAx + factor * (nBx - nAx);
        const ny = nAy + factor * (nBy - nAy);
        const nz = nAz + factor * (nBz - nAz);
        pts.push({ x, y, z, u, v, nx, ny, nz });
      }
    };

    edge(
      v0x, v0y, v0z, v1x, v1y, v1z, val0, val1,
      uvs[i0*2], uvs[i0*2+1], uvs[i1*2], uvs[i1*2+1],
      normals[i0*3], normals[i0*3+1], normals[i0*3+2], normals[i1*3], normals[i1*3+1], normals[i1*3+2]
    );
    edge(
      v1x, v1y, v1z, v2x, v2y, v2z, val1, val2,
      uvs[i1*2], uvs[i1*2+1], uvs[i2*2], uvs[i2*2+1],
      normals[i1*3], normals[i1*3+1], normals[i1*3+2], normals[i2*3], normals[i2*3+1], normals[i2*3+2]
    );
    edge(
      v2x, v2y, v2z, v0x, v0y, v0z, val2, val0,
      uvs[i2*2], uvs[i2*2+1], uvs[i0*2], uvs[i0*2+1],
      normals[i2*3], normals[i2*3+1], normals[i2*3+2], normals[i0*3], normals[i0*3+1], normals[i0*3+2]
    );

    if (pts.length >= 2) {
      segments.push([pts[0], pts[1]]);
    }
  }

  return segments;
}

// 5. Chain line segments into smooth, continuous strokes
function chainSegments(segments, maxStrokes = 8, minLength = 0.15) {
  if (segments.length === 0) return [];

  const used = new Uint8Array(segments.length);
  const strokes = [];

  // Fast spatial bucket grid for segment endpoints
  const cellSize = 0.04;
  const grid = new Map();
  function keyOf(p) {
    const kx = Math.round(p.x / cellSize);
    const ky = Math.round(p.y / cellSize);
    const kz = Math.round(p.z / cellSize);
    return `${kx},${ky},${kz}`;
  }

  for (let i = 0; i < segments.length; i++) {
    const kA = keyOf(segments[i][0]);
    const kB = keyOf(segments[i][1]);
    if (!grid.has(kA)) grid.set(kA, []);
    if (!grid.has(kB)) grid.set(kB, []);
    grid.get(kA).push({ segIdx: i, end: 0 });
    grid.get(kB).push({ segIdx: i, end: 1 });
  }

  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    used[i] = 1;

    let chain = [segments[i][0], segments[i][1]];
    let currentTail = segments[i][1];

    // Grow forward
    let extended = true;
    while (extended) {
      extended = false;
      const k = keyOf(currentTail);
      const candidates = grid.get(k) || [];
      let bestDist = 0.035;
      let bestSeg = -1;
      let bestOtherPt = null;

      for (const cand of candidates) {
        if (used[cand.segIdx]) continue;
        const seg = segments[cand.segIdx];
        const matchPt = cand.end === 0 ? seg[0] : seg[1];
        const otherPt = cand.end === 0 ? seg[1] : seg[0];
        const d = Math.hypot(currentTail.x - matchPt.x, currentTail.y - matchPt.y, currentTail.z - matchPt.z);
        if (d < bestDist) {
          bestDist = d;
          bestSeg = cand.segIdx;
          bestOtherPt = otherPt;
        }
      }

      if (bestSeg !== -1) {
        used[bestSeg] = 1;
        chain.push(bestOtherPt);
        currentTail = bestOtherPt;
        extended = true;
      }
    }

    // Downsample chain: keep points with ~0.02 spacing
    const sampled = [chain[0]];
    let lastP = chain[0];
    let strokeLen = 0;

    for (let c = 1; c < chain.length; c++) {
      const p = chain[c];
      const stepDist = Math.hypot(p.x - lastP.x, p.y - lastP.y, p.z - lastP.z);
      strokeLen += stepDist;
      if (stepDist >= 0.018 || c === chain.length - 1) {
        sampled.push(p);
        lastP = p;
      }
    }

    if (strokeLen >= minLength && sampled.length >= 4) {
      strokes.push(sampled);
      if (strokes.length >= maxStrokes) break;
    }
  }

  return strokes;
}

// 6. Format into V25 Stroke Definition with sampled colors and settings
function formatStroke(rawPoints, options) {
  const transformed = rawPoints.map((p) => {
    const tp = transformPoint(p.x, p.y, p.z);
    return {
      x: tp.x,
      y: tp.y,
      z: tp.z,
      nx: Number(p.nx.toFixed(3)),
      ny: Number(p.ny.toFixed(3)),
      nz: Number(p.nz.toFixed(3)),
      pressure: 0.85,
    };
  });

  const midIdx = Math.floor(rawPoints.length / 2);
  const col1 = sampleColorAtUV(rawPoints[0].u, rawPoints[0].v);
  const col2 = sampleColorAtUV(rawPoints[midIdx].u, rawPoints[midIdx].v);

  return {
    id: 'stroke_' + Math.random().toString(36).substring(2, 9),
    color: col2 || col1 || '#6a5b54',
    secondaryColor: col1,
    size: options.size || 0.025,
    materialType: options.materialType || 'metallic',
    roughness: options.roughness ?? 0.5,
    metalness: options.metalness ?? 0.6,
    brushShape: options.brushShape || 'round',
    points: transformed,
  };
}

console.log('\n--- Building Mode 1: 3D Contour Line Art ---');
const contourStrokes = [];

const yLevelsCount = 55;
for (let i = 0; i < yLevelsCount; i++) {
  const y = 0.08 + (2.85 * i) / (yLevelsCount - 1);
  const segs = sliceMeshWithPlane('y', y);
  const chains = chainSegments(segs, 5, 0.12);
  for (const ch of chains) {
    contourStrokes.push(formatStroke(ch, { size: 0.014, materialType: 'metallic', roughness: 0.4, metalness: 0.7 }));
  }
}

const zLevelsCount = 20;
for (let i = 0; i < zLevelsCount; i++) {
  const z = -1.1 + (2.2 * i) / (zLevelsCount - 1);
  const segs = sliceMeshWithPlane('z', z);
  const chains = chainSegments(segs, 4, 0.2);
  for (const ch of chains) {
    contourStrokes.push(formatStroke(ch, { size: 0.013, materialType: 'metallic', roughness: 0.4, metalness: 0.7 }));
  }
}
console.log(`Generated ${contourStrokes.length} contour line art strokes.`);
fs.writeFileSync(path.join(OUTPUT_DIR, 'model-contours.json'), JSON.stringify(contourStrokes));

console.log('\n--- Building Mode 2: Solid Painted 3D Reconstruction ---');
const solidStrokes = [];

const denseYCount = 75;
for (let i = 0; i < denseYCount; i++) {
  const y = 0.06 + (2.88 * i) / (denseYCount - 1);
  const segs = sliceMeshWithPlane('y', y);
  const chains = chainSegments(segs, 8, 0.1);
  for (const ch of chains) {
    solidStrokes.push(formatStroke(ch, { size: 0.048, materialType: 'clay', roughness: 0.6, metalness: 0.3 }));
  }
}

const denseZCount = 28;
for (let i = 0; i < denseZCount; i++) {
  const z = -1.15 + (2.3 * i) / (denseZCount - 1);
  const segs = sliceMeshWithPlane('z', z);
  const chains = chainSegments(segs, 6, 0.18);
  for (const ch of chains) {
    solidStrokes.push(formatStroke(ch, { size: 0.044, materialType: 'clay', roughness: 0.6, metalness: 0.3 }));
  }
}
console.log(`Generated ${solidStrokes.length} solid ribbon strokes.`);
fs.writeFileSync(path.join(OUTPUT_DIR, 'model-solid.json'), JSON.stringify(solidStrokes));

console.log('\n--- Building Mode 3: Hybrid Master (Solid Core + Crisp Detail Lines) ---');
const hybridStrokes = [];

const hybridYCount = 45;
for (let i = 0; i < hybridYCount; i++) {
  const y = 0.08 + (2.84 * i) / (hybridYCount - 1);
  const segs = sliceMeshWithPlane('y', y);
  const chains = chainSegments(segs, 4, 0.15);
  for (const ch of chains) {
    hybridStrokes.push(formatStroke(ch, { size: 0.046, materialType: 'clay', roughness: 0.55, metalness: 0.4 }));
  }
}

for (let i = 0; i < 40; i++) {
  const y = 0.1 + (2.8 * i) / 39;
  const segs = sliceMeshWithPlane('y', y);
  const chains = chainSegments(segs, 3, 0.15);
  for (const ch of chains) {
    hybridStrokes.push(formatStroke(ch, { size: 0.012, materialType: 'metallic', roughness: 0.3, metalness: 0.8 }));
  }
}

const hybridZCount = 18;
for (let i = 0; i < hybridZCount; i++) {
  const z = -1.1 + (2.2 * i) / (hybridZCount - 1);
  const segs = sliceMeshWithPlane('z', z);
  const chains = chainSegments(segs, 3, 0.2);
  for (const ch of chains) {
    hybridStrokes.push(formatStroke(ch, { size: 0.012, materialType: 'metallic', roughness: 0.3, metalness: 0.8 }));
  }
}
console.log(`Generated ${hybridStrokes.length} hybrid master strokes.`);
fs.writeFileSync(path.join(OUTPUT_DIR, 'model-hybrid.json'), JSON.stringify(hybridStrokes));

console.timeEnd('Total Deconstruction Time');
console.log('=== 3D Model Deconstruction Completed Successfully ===');
