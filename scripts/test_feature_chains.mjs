import fs from 'fs';
import { MeshoptSimplifier } from 'meshoptimizer';

async function test() {
  await MeshoptSimplifier.ready;
  const fd = fs.openSync('C:\\Users\\macie\\Downloads\\Meshy_AI_Apple_Seed_Cover_0922105525_texture.glb', 'r');
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

  const [simpIndices] = MeshoptSimplifier.simplify(indices, pos, 3, 50000 * 3, 0.02);
  const triCount = simpIndices.length / 3;

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

  // Feature edges: dihedral angle > 25 deg (dot < 0.90) or boundary edges
  const adj = new Map(); // v -> Set of neighbors
  function link(v1, v2) {
    if (!adj.has(v1)) adj.set(v1, new Set());
    if (!adj.has(v2)) adj.set(v2, new Set());
    adj.get(v1).add(v2);
    adj.get(v2).add(v1);
  }

  for (const edge of edgeMap.values()) {
    if (edge.tris.length === 1) {
      link(edge.vA, edge.vB);
    } else if (edge.tris.length === 2) {
      const t0 = edge.tris[0], t1 = edge.tris[1];
      const dot = faceNormals[t0*3]*faceNormals[t1*3] + faceNormals[t0*3+1]*faceNormals[t1*3+1] + faceNormals[t0*3+2]*faceNormals[t1*3+2];
      if (dot < 0.89) {
        link(edge.vA, edge.vB);
      }
    }
  }

  // Chain edges into connected strokes
  const visitedEdges = new Set();
  function edgeKey(a, b) { return Math.min(a, b) + '_' + Math.max(a, b); }

  const chains = [];

  // Start with degree-1 vertices (line endpoints)
  const startVerts = [];
  for (const [v, nbrs] of adj.entries()) {
    if (nbrs.size === 1) startVerts.push(v);
  }
  // Then degree-2 or higher vertices
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

        // Vector of current segment
        const cx = pos[curr*3] - pos[prev*3];
        const cy = pos[curr*3+1] - pos[prev*3+1];
        const cz = pos[curr*3+2] - pos[prev*3+2];
        const clen = Math.hypot(cx, cy, cz) || 1;

        for (const cand of currNbrs) {
          if (cand === prev) continue;
          const candKey = edgeKey(curr, cand);
          if (visitedEdges.has(candKey)) continue;

          // Pick candidate with smoothest direction (highest dot product)
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

        if (bestNext !== null && bestCos > -0.5) { // sharp angle cutoff
          visitedEdges.add(edgeKey(curr, bestNext));
          chain.push(bestNext);
          prev = curr;
          curr = bestNext;
        } else {
          break;
        }
      }

      if (chain.length >= 4) {
        chains.push(chain);
      }
    }
  }

  console.log('Chained feature strokes count:', chains.length);
  // Sort chains by length
  chains.sort((a, b) => b.length - a.length);
  console.log('Longest chain length (vertices):', chains[0].length);
  console.log('Top 10 chain lengths:', chains.slice(0, 10).map(c => c.length));
}

test().catch(console.error);
