import fs from 'fs';
import path from 'path';
import { MeshoptSimplifier } from 'meshoptimizer';

const GLB_PATH = 'C:\\Users\\macie\\Downloads\\Meshy_AI_Apple_Seed_Cover_0922105525_texture.glb';
const TEXTURE_RGBA_PATH = 'e:\\X\\AiStudio Workflow\\V25\\scripts\\temp_texture_1024.rgba';
const OUTPUT_DIR = 'e:\\X\\AiStudio Workflow\\V25\\public\\demos';

async function build() {
  await MeshoptSimplifier.ready;
  console.log('=== Building 3D Feature-Directed Drawing with Brush Size Variation ===');
  console.time('Total Pipeline');

  // 1. Load GLB Buffers
  console.time('Load GLB');
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
  console.timeEnd('Load GLB');

  // 2. Load Texture Buffer
  const rgba = fs.readFileSync(TEXTURE_RGBA_PATH);
  function getRGB(u, v) {
    u = ((u % 1) + 1) % 1;
    v = ((v % 1) + 1) % 1;
    const px = Math.min(1023, Math.max(0, Math.floor(u * 1024)));
    const py = Math.min(1023, Math.max(0, Math.floor((1 - v) * 1024)));
    const idx = (py * 1024 + px) * 4;
    return [rgba[idx], rgba[idx + 1], rgba[idx + 2]];
  }

  function getHex(u, v) {
    const [r, g, b] = getRGB(u, v);
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  // 3. Simplify Mesh to Extract True Feature Edges
  console.time('Simplify Mesh');
  const [simpIndices] = MeshoptSimplifier.simplify(indices, pos, 3, 55000 * 3, 0.02);
  const triCount = simpIndices.length / 3;
  console.log(`Simplified to ${triCount} feature-preserving triangles.`);
  console.timeEnd('Simplify Mesh');

  // 4. Compute Face Normals
  const faceNormals = new Float32Array(triCount * 3);
  for (let t = 0; t < triCount; t++) {
    const i0 = simpIndices[t * 3], i1 = simpIndices[t * 3 + 1], i2 = simpIndices[t * 3 + 2];
    const ax = pos[i1 * 3] - pos[i0 * 3], ay = pos[i1 * 3 + 1] - pos[i0 * 3 + 1], az = pos[i1 * 3 + 2] - pos[i0 * 3 + 2];
    const bx = pos[i2 * 3] - pos[i0 * 3], by = pos[i2 * 3 + 1] - pos[i0 * 3 + 1], bz = pos[i2 * 3 + 2] - pos[i0 * 3 + 2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const len = Math.hypot(nx, ny, nz) || 1;
    faceNormals[t * 3] = nx / len;
    faceNormals[t * 3 + 1] = ny / len;
    faceNormals[t * 3 + 2] = nz / len;
  }

  // 5. Build Edge Adjacency
  const edgeMap = new Map();
  function addEdge(vA, vB, tri) {
    const minV = Math.min(vA, vB), maxV = Math.max(vA, vB);
    const key = minV + '_' + maxV;
    if (!edgeMap.has(key)) edgeMap.set(key, { vA: minV, vB: maxV, tris: [tri] });
    else edgeMap.get(key).tris.push(tri);
  }

  for (let t = 0; t < triCount; t++) {
    const i0 = simpIndices[t * 3], i1 = simpIndices[t * 3 + 1], i2 = simpIndices[t * 3 + 2];
    addEdge(i0, i1, t);
    addEdge(i1, i2, t);
    addEdge(i2, i0, t);
  }

  // 6. Identify Feature Edges: Dihedral Creases + Color Boundaries + Silhouettes
  const adj = new Map();
  function link(v1, v2) {
    if (!adj.has(v1)) adj.set(v1, new Set());
    if (!adj.has(v2)) adj.set(v2, new Set());
    adj.get(v1).add(v2);
    adj.get(v2).add(v1);
  }

  for (const edge of edgeMap.values()) {
    const { vA, vB, tris } = edge;
    if (tris.length === 1) {
      link(vA, vB);
    } else if (tris.length === 2) {
      const t0 = tris[0], t1 = tris[1];
      const dot = faceNormals[t0*3]*faceNormals[t1*3] + faceNormals[t0*3+1]*faceNormals[t1*3+1] + faceNormals[t0*3+2]*faceNormals[t1*3+2];

      // Check color difference across edge
      const uA = uvs[vA * 2], v_A = uvs[vA * 2 + 1];
      const uB = uvs[vB * 2], v_B = uvs[vB * 2 + 1];
      const colA = getRGB(uA, v_A);
      const colB = getRGB(uB, v_B);
      const colorDist = Math.hypot(colA[0]-colB[0], colA[1]-colB[1], colA[2]-colB[2]);

      // If sharp crease (dihedral angle > 24 deg) OR color transition boundary (e.g. gold trim, skin, clothing)
      if (dot < 0.91 || colorDist > 45) {
        link(vA, vB);
      }
    }
  }

  // 7. Chain into Connected Continuous 3D Strokes
  console.time('Chain Strokes');
  const visitedEdges = new Set();
  function edgeKey(a, b) { return Math.min(a, b) + '_' + Math.max(a, b); }

  const chains = [];
  const startVerts = [];
  for (const [v, nbrs] of adj.entries()) {
    if (nbrs.size === 1) startVerts.push(v);
  }
  for (const v of adj.keys()) {
    if (!startVerts.includes(v)) startVerts.push(v);
  }

  for (const startV of startVerts) {
    const nbrs = adj.get(startV);
    if (!nbrs) continue;

    for (const nextV of nbrs) {
      const ek = edgeKey(startV, nextV);
      if (visitedEdges.has(ek)) continue;
      visitedEdges.add(ek);

      const chain = [startV, nextV];
      let curr = nextV;
      let prev = startV;

      while (true) {
        const currNbrs = adj.get(curr);
        let bestNext = null;
        let bestCos = -2;

        const cx = pos[curr*3] - pos[prev*3];
        const cy = pos[curr*3+1] - pos[prev*3+1];
        const cz = pos[curr*3+2] - pos[prev*3+2];
        const clen = Math.hypot(cx, cy, cz) || 1;

        for (const cand of currNbrs) {
          if (cand === prev) continue;
          const candKey = edgeKey(curr, cand);
          if (visitedEdges.has(candKey)) continue;

          const nx = pos[cand*3] - pos[curr*3];
          const ny = pos[cand*3+1] - pos[curr*3+1];
          const nz = pos[cand*3+2] - pos[curr*3+2];
          const nlen = Math.hypot(nx, ny, nz) || 1;
          const cos = (cx*nx + cy*ny + cz*nz) / (clen * nlen);

          if (cos > bestCos) {
            bestCos = cos;
            bestNext = cand;
          }
        }

        if (bestNext !== null && bestCos > -0.6) {
          visitedEdges.add(edgeKey(curr, bestNext));
          chain.push(bestNext);
          prev = curr;
          curr = bestNext;
        } else {
          break;
        }
      }

      // Compute total path length
      let totalLen = 0;
      for (let k = 1; k < chain.length; k++) {
        const v1 = chain[k-1], v2 = chain[k];
        totalLen += Math.hypot(pos[v2*3]-pos[v1*3], pos[v2*3+1]-pos[v1*3+1], pos[v2*3+2]-pos[v1*3+2]);
      }

      // Keep substantial feature curves (longer than 5cm, at least 4 vertices)
      if (totalLen >= 0.05 && chain.length >= 4) {
        chains.push({ verts: chain, length: totalLen });
      }
    }
  }

  // Sort chains by length descending
  chains.sort((a, b) => b.length - a.length);
  console.log(`Extracted ${chains.length} continuous 3D feature curves.`);
  console.timeEnd('Chain Strokes');

  // 8. Transform to StudioEngine Center: target (-0.08, 0.42, 0)
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

  // 9. Format strokes with dynamic brush selection, color, and size variation
  function formatFeatureStroke(chainObj, index) {
    const { verts, length } = chainObj;

    // Resample along curve to keep points spaced ~0.02
    const sampledVerts = [verts[0]];
    let lastV = verts[0];
    for (let i = 1; i < verts.length; i++) {
      const v = verts[i];
      const d = Math.hypot(pos[v*3]-pos[lastV*3], pos[v*3+1]-pos[lastV*3+1], pos[v*3+2]-pos[lastV*3+2]);
      if (d >= 0.02 || i === verts.length - 1) {
        sampledVerts.push(v);
        lastV = v;
      }
    }

    // Sample colors along curve
    const midIdx = Math.floor(sampledVerts.length / 2);
    const midV = sampledVerts[midIdx];
    const hex = getHex(uvs[midV * 2], uvs[midV * 2 + 1]);
    const [r, g, b] = getRGB(uvs[midV * 2], uvs[midV * 2 + 1]);

    // Characterize material & brush size variation
    const isSkin = (r > 150 && g > 105 && b > 75 && r > g && g > b);
    const isGold = (r > 140 && g > 120 && b < 90);
    const isWhite = (r > 170 && g > 170 && b > 165);

    let brushShape = 'round';
    let size = 0.016;
    let materialType = 'metallic';
    let roughness = 0.4;
    let metalness = 0.7;

    if (isSkin) {
      brushShape = 'round';
      size = length > 0.3 ? 0.032 : 0.022;
      materialType = 'clay';
      roughness = 0.7;
      metalness = 0.1;
    } else if (isGold) {
      brushShape = 'chisel';
      size = length > 0.25 ? 0.028 : 0.018;
      materialType = 'metallic';
      roughness = 0.25;
      metalness = 0.95;
    } else if (isWhite) {
      brushShape = 'wide_flat';
      size = length > 0.3 ? 0.038 : 0.024;
      materialType = 'clay';
      roughness = 0.5;
      metalness = 0.2;
    } else {
      // Bronze mech armor: broad strokes for long contours, fine drafting wire for sharp seams
      if (length > 0.4) {
        brushShape = 'wide_flat';
        size = 0.036;
        roughness = 0.45;
        metalness = 0.75;
      } else if (length > 0.2) {
        brushShape = 'round';
        size = 0.022;
        roughness = 0.4;
        metalness = 0.8;
      } else {
        brushShape = 'line';
        size = 0.012;
        roughness = 0.35;
        metalness = 0.85;
      }
    }

    const points = sampledVerts.map((vIdx, pIdx) => {
      const tp = transform(pos[vIdx * 3], pos[vIdx * 3 + 1], pos[vIdx * 3 + 2]);
      // Pressure curve: tapered start and end
      const t = pIdx / (sampledVerts.length - 1);
      const pressure = Number((0.35 + 0.6 * Math.sin(t * Math.PI)).toFixed(2));
      return {
        x: tp.x,
        y: tp.y,
        z: tp.z,
        pressure,
      };
    });

    return {
      id: 'stroke_feat_' + index,
      color: hex,
      size,
      brushShape,
      materialType,
      roughness,
      metalness,
      points,
    };
  }

  // 10. Curate Datasets
  // Mode 1: Feature Line Art (Top 450 purest feature curves)
  const contourStrokes = chains.slice(0, 450).map((c, i) => formatFeatureStroke(c, i));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'model-contours.json'), JSON.stringify(contourStrokes));
  console.log(`Saved ${contourStrokes.length} true 3D feature contour strokes.`);

  // Mode 2: Solid Form Reconstruction (Dense feature ribbons + cross-form flow)
  const solidStrokes = chains.slice(0, 750).map((c, i) => {
    const s = formatFeatureStroke(c, i);
    s.size *= 1.8; // Thicker ribbon coverage
    return s;
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'model-solid.json'), JSON.stringify(solidStrokes));
  console.log(`Saved ${solidStrokes.length} solid ribbon strokes.`);

  // Mode 3: Hybrid Master (Wide form ribbons + crisp fine detail overlay)
  const baseStrokes = chains.slice(0, 250).map((c, i) => {
    const s = formatFeatureStroke(c, i);
    s.size *= 1.6;
    return s;
  });
  const detailStrokes = chains.slice(0, 400).map((c, i) => {
    const s = formatFeatureStroke(c, i + 1000);
    s.size = 0.011;
    s.brushShape = 'line';
    return s;
  });
  const hybridStrokes = [...baseStrokes, ...detailStrokes];
  fs.writeFileSync(path.join(OUTPUT_DIR, 'model-hybrid.json'), JSON.stringify(hybridStrokes));
  console.log(`Saved ${hybridStrokes.length} hybrid master strokes.`);

  console.timeEnd('Total Pipeline');
  console.log('=== Finished Successfully ===');
}

build().catch(console.error);
