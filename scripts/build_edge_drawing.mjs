import fs from 'fs';
import path from 'path';

const GLB_PATH = 'C:\\Users\\macie\\Downloads\\Meshy_AI_Apple_Seed_Cover_0922105525_texture.glb';
const TEXTURE_RGBA_PATH = 'e:\\X\\AiStudio Workflow\\V25\\scripts\\temp_texture_1024.rgba';
const OUTPUT_DIR = 'e:\\X\\AiStudio Workflow\\V25\\public\\demos';

// Chaikin smoothing for natural strokes
function chaikinSmooth(points, iterations = 2) {
  if (points.length < 3) return points;
  let current = points;
  for (let it = 0; it < iterations; it++) {
    const next = [current[0]];
    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i], p1 = current[i + 1];
      next.push(
        { x: 0.75*p0.x + 0.25*p1.x, y: 0.75*p0.y + 0.25*p1.y, z: 0.75*p0.z + 0.25*p1.z, u: p0.u, v: p0.v },
        { x: 0.25*p0.x + 0.75*p1.x, y: 0.25*p0.y + 0.75*p1.y, z: 0.25*p0.z + 0.75*p1.z, u: p1.u, v: p1.v }
      );
    }
    next.push(current[current.length - 1]);
    current = next;
  }
  return current;
}

// Resample a chain to keep points at least minDist apart
function resample(pts, minDist) {
  if (pts.length < 2) return pts;
  const out = [pts[0]];
  let last = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - last.x, pts[i].y - last.y, pts[i].z - last.z);
    if (d >= minDist || i === pts.length - 1) {
      out.push(pts[i]);
      last = pts[i];
    }
  }
  return out;
}

// Chain unordered edge segments into polylines
function chainSegments(segments, threshold = 0.02) {
  const used = new Uint8Array(segments.length);
  const chains = [];

  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const chain = [{ ...segments[i][0] }, { ...segments[i][1] }];

    // Extend forward from tail
    let tail = chain[chain.length - 1];
    let extended = true;
    while (extended) {
      extended = false;
      let bestD = threshold, bestJ = -1, bestFlip = false;
      for (let j = 0; j < segments.length; j++) {
        if (used[j]) continue;
        const d0 = Math.hypot(tail.x - segments[j][0].x, tail.y - segments[j][0].y, tail.z - segments[j][0].z);
        const d1 = Math.hypot(tail.x - segments[j][1].x, tail.y - segments[j][1].y, tail.z - segments[j][1].z);
        if (d0 < bestD) { bestD = d0; bestJ = j; bestFlip = false; }
        if (d1 < bestD) { bestD = d1; bestJ = j; bestFlip = true; }
      }
      if (bestJ !== -1) {
        used[bestJ] = 1;
        const seg = segments[bestJ];
        chain.push(bestFlip ? { ...seg[0] } : { ...seg[1] });
        tail = chain[chain.length - 1];
        extended = true;
      }
    }

    if (chain.length >= 4) chains.push(chain);
  }
  return chains;
}

async function run() {
  console.log('=== Edge-Based Artist Drawing Generator ===');
  console.time('Total');

  // Load GLB mesh data
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

  const rgba = fs.readFileSync(TEXTURE_RGBA_PATH);
  function getHex(u, v) {
    u = ((u % 1) + 1) % 1;
    v = ((v % 1) + 1) % 1;
    const px = Math.min(1023, Math.max(0, Math.floor(u * 1024)));
    const py = Math.min(1023, Math.max(0, Math.floor((1 - v) * 1024)));
    const off = (py * 1024 + px) * 4;
    return '#' + [rgba[off], rgba[off+1], rgba[off+2]].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  function transform(x, y, z) {
    return {
      x: Number((x - 0.08).toFixed(4)),
      y: Number(((y - 1.5) + 0.42).toFixed(4)),
      z: Number(z.toFixed(4)),
    };
  }

  const triCount = indices.length / 3;
  console.log(`Loaded ${triCount} triangles`);

  // ================================================================
  // STEP 1: Build edge → adjacent face map
  // ================================================================
  console.log('Building edge adjacency...');

  // We'll work with a SUBSET of triangles for speed (every 3rd tri = ~1M tris)
  // This gives us dense edge coverage without processing all 3M
  const STRIDE = 3;
  const usedTriCount = Math.floor(triCount / STRIDE);

  // face normals + centers
  const faceNx = new Float32Array(usedTriCount);
  const faceNy = new Float32Array(usedTriCount);
  const faceNz = new Float32Array(usedTriCount);
  const faceCx = new Float32Array(usedTriCount);
  const faceCy = new Float32Array(usedTriCount);
  // UV centroid per face
  const faceU = new Float32Array(usedTriCount);
  const faceV = new Float32Array(usedTriCount);

  // Edge map: "vi,vj" (sorted) -> [faceA, faceB]
  const edgeMap = new Map();

  for (let t = 0; t < usedTriCount; t++) {
    const ti = t * STRIDE;
    const i0 = indices[ti * 3], i1 = indices[ti * 3 + 1], i2 = indices[ti * 3 + 2];
    const x0 = pos[i0*3], y0 = pos[i0*3+1], z0 = pos[i0*3+2];
    const x1 = pos[i1*3], y1 = pos[i1*3+1], z1 = pos[i1*3+2];
    const x2 = pos[i2*3], y2 = pos[i2*3+1], z2 = pos[i2*3+2];

    // Face normal (cross product)
    const ax = x1-x0, ay = y1-y0, az = z1-z0;
    const bx = x2-x0, by = y2-y0, bz = z2-z0;
    let nx = ay*bz - az*by, ny = az*bx - ax*bz, nz = ax*by - ay*bx;
    const nl = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
    faceNx[t] = nx / nl; faceNy[t] = ny / nl; faceNz[t] = nz / nl;

    // Face center
    faceCx[t] = (x0 + x1 + x2) / 3;
    faceCy[t] = (y0 + y1 + y2) / 3;

    // UV centroid
    faceU[t] = (uvs[i0*2] + uvs[i1*2] + uvs[i2*2]) / 3;
    faceV[t] = (uvs[i0*2+1] + uvs[i1*2+1] + uvs[i2*2+1]) / 3;

    // Register each edge
    const verts = [i0, i1, i2];
    for (let e = 0; e < 3; e++) {
      const va = verts[e], vb = verts[(e+1) % 3];
      const key = va < vb ? `${va},${vb}` : `${vb},${va}`;
      if (!edgeMap.has(key)) edgeMap.set(key, [t]);
      else { const arr = edgeMap.get(key); if (arr.length < 2) arr.push(t); }
    }
  }

  console.log(`Edge map built with ${edgeMap.size} edges`);

  // ================================================================
  // STEP 2: SILHOUETTE EDGES
  // Camera is roughly at (0, 1.5, 8) looking at origin
  // Silhouette edge: one adjacent face toward camera, one away
  // ================================================================
  console.log('Finding silhouette edges...');

  // Camera is in front of the model (positive Z), slightly above center
  const camX = 0, camY = 1.5, camZ = 8;

  const silhouetteSegs = [];

  for (const [key, faces] of edgeMap) {
    if (faces.length !== 2) continue;

    const fA = faces[0], fB = faces[1];

    // Full 3D view direction from each face center to camera
    const dAx = camX - faceCx[fA], dAy = camY - faceCy[fA], dAz = camZ - 0; // face z ~= 0
    const dBx = camX - faceCx[fB], dBy = camY - faceCy[fB], dBz = camZ - 0;

    // Dot: face normal · view direction
    const dotA = faceNx[fA]*dAx + faceNy[fA]*dAy + faceNz[fA]*dAz;
    const dotB = faceNx[fB]*dBx + faceNy[fB]*dBy + faceNz[fB]*dBz;

    // Silhouette: one dot positive, one negative (boundary between visible/hidden)
    if ((dotA > 0) !== (dotB > 0)) {
      // Only keep edges where at least one face is clearly front-facing (z-normal > -0.3)
      // This removes interior tunnels and self-intersecting geometry noise
      if (faceNz[fA] < -0.5 && faceNz[fB] < -0.5) continue;

      const [va, vb] = key.split(',').map(Number);
      const u = (faceU[fA] + faceU[fB]) / 2;
      const v = (faceV[fA] + faceV[fB]) / 2;
      silhouetteSegs.push([
        { x: pos[va*3], y: pos[va*3+1], z: pos[va*3+2], u, v },
        { x: pos[vb*3], y: pos[vb*3+1], z: pos[vb*3+2], u, v },
      ]);
    }
  }

  console.log(`Found ${silhouetteSegs.length} silhouette edge segments`);

  // ================================================================
  // STEP 3: CREASE / FEATURE EDGES
  // Sharper threshold = only hard mechanical edges, no soft surface noise
  // ================================================================
  console.log('Finding crease edges...');

  // 55 degrees = only sharp mechanical creases, skip soft organic surfaces
  const CREASE_THRESHOLD_COS = Math.cos((55 * Math.PI) / 180);

  const creaseSegs = [];

  for (const [key, faces] of edgeMap) {
    if (faces.length !== 2) continue;
    const fA = faces[0], fB = faces[1];

    // Skip if both faces point strongly away from camera (back of model)
    if (faceNz[fA] < -0.4 && faceNz[fB] < -0.4) continue;

    const dot = faceNx[fA]*faceNx[fB] + faceNy[fA]*faceNy[fB] + faceNz[fA]*faceNz[fB];
    if (dot < CREASE_THRESHOLD_COS) {
      const [va, vb] = key.split(',').map(Number);
      const u = (faceU[fA] + faceU[fB]) / 2;
      const v = (faceV[fA] + faceV[fB]) / 2;
      creaseSegs.push([
        { x: pos[va*3], y: pos[va*3+1], z: pos[va*3+2], u, v },
        { x: pos[vb*3], y: pos[vb*3+1], z: pos[vb*3+2], u, v },
      ]);
    }
  }

  console.log(`Found ${creaseSegs.length} crease edge segments`);

  // ================================================================
  // STEP 4: CHAIN EDGES INTO STROKES
  // ================================================================
  console.log('Chaining silhouette edges into strokes...');
  const silhouetteChains = chainSegments(silhouetteSegs, 0.025);
  console.log(`Silhouette: ${silhouetteChains.length} chains`);

  console.log('Chaining crease edges into strokes...');
  const creaseChains = chainSegments(creaseSegs, 0.025);
  console.log(`Crease: ${creaseChains.length} chains`);

  // ================================================================
  // STEP 5: SURFACE HATCHING
  // For each significant face cluster, add short directional hatch strokes
  // Hatch direction follows the surface tangent (not a circle, but a sweep)
  // ================================================================
  console.log('Generating surface hatching...');

  const hatchSegs = [];

  // Sample every Nth triangle, project along its longest edge direction
  // to make hatching that follows the surface curvature
  const HATCH_STRIDE = 200; // 1 in every 200 triangles (less noise)
  for (let t = 0; t < usedTriCount; t += HATCH_STRIDE) {
    const ti = t * STRIDE;
    const i0 = indices[ti * 3], i1 = indices[ti * 3 + 1], i2 = indices[ti * 3 + 2];
    const x0 = pos[i0*3], y0 = pos[i0*3+1], z0 = pos[i0*3+2];
    const x1 = pos[i1*3], y1 = pos[i1*3+1], z1 = pos[i1*3+2];
    const x2 = pos[i2*3], y2 = pos[i2*3+1], z2 = pos[i2*3+2];

    // Only front-facing faces (nz must be clearly positive = facing camera)
    const nz = faceNz[t];
    if (nz < 0.15) continue;

    // Find longest edge — this defines the hatch direction (tangent to surface)
    const e01x = x1-x0, e01y = y1-y0, e01z = z1-z0;
    const e12x = x2-x1, e12y = y2-y1, e12z = z2-z1;
    const l01 = Math.hypot(e01x, e01y, e01z);
    const l12 = Math.hypot(e12x, e12y, e12z);

    let dirX, dirY, dirZ, startX, startY, startZ;
    if (l01 > l12) {
      const il = 1 / (l01 || 1);
      dirX = e01x*il; dirY = e01y*il; dirZ = e01z*il;
      startX = x0; startY = y0; startZ = z0;
    } else {
      const il = 1 / (l12 || 1);
      dirX = e12x*il; dirY = e12y*il; dirZ = e12z*il;
      startX = x1; startY = y1; startZ = z1;
    }

    // Skip strokes that go mostly backwards into the screen (z > 0.7 dominant)
    if (Math.abs(dirZ) > 0.75) continue;

    const u = faceU[t], v = faceV[t];
    // Hatch length: 0.025 to 0.08m (shorter, more precise hatching)
    const hLen = 0.025 + 0.055 * Math.random();
    const steps = 4;
    const pts = [];
    for (let s = 0; s <= steps; s++) {
      const f = (s / steps) * hLen;
      pts.push({ x: startX + dirX*f, y: startY + dirY*f, z: startZ + dirZ*f, u, v });
    }

    hatchSegs.push(pts);
  }

  console.log(`Generated ${hatchSegs.length} hatch strokes`);

  // ================================================================
  // STEP 6: MERGE, FILTER, LIMIT & FORMAT
  // ================================================================
  console.log('Merging and formatting strokes...');

  const allStrokes = [];

  // Helper to convert a chain to stroke format
  function addChain(chain, strokeType) {
    const smoothed = chaikinSmooth(chain, 2);
    const pts = resample(smoothed, 0.01);
    if (pts.length < 3) return;

    let len = 0;
    let minZ = Infinity, maxZ = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) len += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y, pts[i].z - pts[i-1].z);
      if (pts[i].z < minZ) minZ = pts[i].z;
      if (pts[i].z > maxZ) maxZ = pts[i].z;
      if (pts[i].y < minY) minY = pts[i].y;
      if (pts[i].y > maxY) maxY = pts[i].y;
    }
    if (len < 0.03) return; // eliminate tiny scattered fragments

    // Reject strokes that go far behind the model (interior/backside geometry)
    if (minZ < -1.0) return;
    // Reject strokes outside vertical model bounds
    if (maxY > 3.2 || minY < -0.2) return;
    // Reject strokes too far outside horizontal model bounds
    let minX = Infinity, maxX = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
    }
    if (minX > 1.5 || maxX < -1.5) return;
    // Reject hatch strokes that span too large a Z range (piercing through model)
    if (strokeType === 'hatch' && (maxZ - minZ) > 0.4) return;

    const midPt = pts[Math.floor(pts.length / 2)];
    const hex = getHex(midPt.u, midPt.v);
    const cat = len < 0.08 ? 'short' : (len < 0.25 ? 'medium' : 'long');

    allStrokes.push({ pts, type: strokeType, category: cat, hex, len });
  }

  // Add silhouette chains — these are the most important (outline of the figure)
  for (const chain of silhouetteChains) addChain(chain, 'silhouette');

  // Add crease chains — armor panel lines, joints
  for (const chain of creaseChains) addChain(chain, 'crease');

  // Add hatch strokes
  for (const h of hatchSegs) addChain(h, 'hatch');

  console.log(`Total before sampling: ${allStrokes.length}`);

  // Sort: silhouette first (most important), then crease, then hatch
  const silStrokes = allStrokes.filter(s => s.type === 'silhouette');
  const crStrokes = allStrokes.filter(s => s.type === 'crease');
  const htStrokes = allStrokes.filter(s => s.type === 'hatch');

  console.log(`Silhouette: ${silStrokes.length}, Crease: ${crStrokes.length}, Hatch: ${htStrokes.length}`);

  // Target: 2500 total. Weight: silhouette > crease >> hatch
  const TARGET = 2500;
  const silTarget = Math.min(silStrokes.length, Math.floor(TARGET * 0.50)); // 50% outline
  const crTarget = Math.min(crStrokes.length, Math.floor(TARGET * 0.35));   // 35% panel lines
  const htTarget = Math.min(htStrokes.length, TARGET - silTarget - crTarget); // 15% hatch

  function sample(arr, n) {
    if (arr.length <= n) return arr;
    const step = arr.length / n;
    const out = [];
    for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
    return out;
  }

  const finalStrokes = [
    ...sample(silStrokes, silTarget),
    ...sample(crStrokes, crTarget),
    ...sample(htStrokes, htTarget),
  ];

  console.log(`Final stroke count: ${finalStrokes.length}`);
  const sc = finalStrokes.filter(s => s.category === 'short').length;
  const mc = finalStrokes.filter(s => s.category === 'medium').length;
  const lc = finalStrokes.filter(s => s.category === 'long').length;
  console.log(`Short: ${sc}, Medium: ${mc}, Long: ${lc}`);

  // ================================================================
  // STEP 7: Format for the 3D drawing engine
  // ================================================================
  const formatted = finalStrokes.map((sObj, idx) => {
    const { pts, type, hex, category } = sObj;

    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);

    const isGold = r > 140 && g > 105 && b < 105 && r - b > 35;
    const isWhite = r > 185 && g > 185 && b > 185;
    const isDark = r < 60 && g < 60 && b < 60;

    let size, brushShape, materialType, roughness, metalness;

    if (type === 'silhouette') {
      // Silhouette = bold, confident strokes
      brushShape = 'round';
      materialType = 'metallic';
      roughness = 0.4;
      metalness = 0.6;
      size = category === 'long' ? 0.011 : (category === 'medium' ? 0.009 : 0.007);
    } else if (type === 'crease') {
      // Crease = precise, thinner
      brushShape = 'round';
      materialType = 'metallic';
      roughness = 0.35;
      metalness = 0.7;
      size = 0.007;
      if (isGold) { metalness = 0.96; roughness = 0.12; size = 0.0065; }
    } else {
      // Hatch = fine, light
      brushShape = 'round';
      materialType = 'standard';
      roughness = 0.55;
      metalness = 0.3;
      size = 0.006;
    }

    if (isWhite) { roughness = 0.55; metalness = 0.15; }

    const points = pts.map((p, pIdx) => {
      const tp = transform(p.x, p.y, p.z);
      const t = pIdx / Math.max(1, pts.length - 1);
      // Pressure: thin at ends, thick in middle (like a real brush stroke)
      const pressure = Number((0.30 + 0.65 * Math.sin(t * Math.PI)).toFixed(2));
      return { x: tp.x, y: tp.y, z: tp.z, pressure };
    });

    return {
      id: `stroke_${type}_${idx}`,
      color: hex,
      size,
      brushShape,
      materialType,
      roughness,
      metalness,
      points,
    };
  });

  // Write all three demo files
  const json = JSON.stringify(formatted);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'model-contours.json'), json);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'model-hybrid.json'), json);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'model-solid.json'), json);

  console.timeEnd('Total');
  console.log(`Saved ${formatted.length} strokes to ${OUTPUT_DIR}`);
}

run().catch(console.error);
