/**
 * Mesh preparation: bounds, normalisation into the app's world space,
 * per-triangle data, vertex welding and crease-edge extraction.
 */

export function computeBounds(positions) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    size: [maxX - minX, maxY - minY, maxZ - minZ],
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
  };
}

/**
 * Rescales + recentres the mesh in place so it sits where the app's default
 * camera is looking.
 *
 * The studio camera targets (-0.08, 0.42, 0) with a 45 deg FOV at radius 7.85,
 * so the visible frame is ~6.5 world units tall. `fitHeight` is how much of
 * that the drawing should occupy.
 */
export function normalizeInPlace(positions, { fitHeight, target = [-0.08, 0.42, 0], upAxis = 'y' }) {
  const bounds = computeBounds(positions);
  const maxDim = Math.max(...bounds.size);
  const scale = fitHeight / maxDim;
  const c = bounds.center;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (positions[i] - c[0]) * scale + target[0];
    positions[i + 1] = (positions[i + 1] - c[1]) * scale + target[1];
    positions[i + 2] = (positions[i + 2] - c[2]) * scale + target[2];
  }
  return { scale, sourceBounds: bounds, bounds: computeBounds(positions) };
}

/** Per-triangle geometric normal, centroid and area. */
export function triangleData(positions, indices) {
  const triCount = indices.length / 3;
  const normal = new Float32Array(triCount * 3);
  const centroid = new Float32Array(triCount * 3);
  const area = new Float32Array(triCount);
  let totalArea = 0;

  for (let t = 0; t < triCount; t++) {
    const a = indices[t * 3] * 3, b = indices[t * 3 + 1] * 3, c = indices[t * 3 + 2] * 3;
    const ax = positions[a], ay = positions[a + 1], az = positions[a + 2];
    const bx = positions[b], by = positions[b + 1], bz = positions[b + 2];
    const cx = positions[c], cy = positions[c + 1], cz = positions[c + 2];
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;
    const len = Math.hypot(nx, ny, nz);
    area[t] = len * 0.5;
    totalArea += area[t];
    if (len > 1e-20) { nx /= len; ny /= len; nz /= len; }
    normal[t * 3] = nx; normal[t * 3 + 1] = ny; normal[t * 3 + 2] = nz;
    centroid[t * 3] = (ax + bx + cx) / 3;
    centroid[t * 3 + 1] = (ay + by + cy) / 3;
    centroid[t * 3 + 2] = (az + bz + cz) / 3;
  }
  return { normal, centroid, area, totalArea, triCount };
}

/**
 * Welds vertices that share a position (models exported with split UV seams
 * have duplicated corners, which otherwise breaks edge adjacency).
 * Returns a remap array: original vertex index -> welded index.
 */
export function weldVertices(positions, epsilon = 1e-5) {
  const inv = 1 / epsilon;
  const map = new Map();
  const remap = new Uint32Array(positions.length / 3);
  let next = 0;
  for (let i = 0; i < positions.length / 3; i++) {
    const kx = Math.round(positions[i * 3] * inv);
    const ky = Math.round(positions[i * 3 + 1] * inv);
    const kz = Math.round(positions[i * 3 + 2] * inv);
    const key = `${kx},${ky},${kz}`;
    let id = map.get(key);
    if (id === undefined) { id = next++; map.set(key, id); }
    remap[i] = id;
  }
  return { remap, weldedCount: next };
}

/**
 * Extracts crease + boundary edges as 3D segments.
 * A crease is an edge whose two faces meet at more than `angleDeg`;
 * a boundary edge has only one face. These are the lines a person would
 * actually draw: panel gaps, silhouette folds, hard corners.
 */
export function creaseEdges(positions, indices, { remap }, angleDeg = 38) {
  const triCount = indices.length / 3;
  const edges = new Map();
  const tri = triangleData(positions, indices);
  const cosLimit = Math.cos((angleDeg * Math.PI) / 180);

  const addEdge = (va, vb, t) => {
    const a = remap[va], b = remap[vb];
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    const entry = edges.get(key);
    if (entry) entry.faces.push(t);
    else edges.set(key, { va, vb, faces: [t] });
  };

  for (let t = 0; t < triCount; t++) {
    const i0 = indices[t * 3], i1 = indices[t * 3 + 1], i2 = indices[t * 3 + 2];
    addEdge(i0, i1, t); addEdge(i1, i2, t); addEdge(i2, i0, t);
  }

  const out = [];
  for (const e of edges.values()) {
    let keep = false;
    if (e.faces.length === 1) keep = true;
    else {
      const [f0, f1] = e.faces;
      const d =
        tri.normal[f0 * 3] * tri.normal[f1 * 3] +
        tri.normal[f0 * 3 + 1] * tri.normal[f1 * 3 + 1] +
        tri.normal[f0 * 3 + 2] * tri.normal[f1 * 3 + 2];
      if (d < cosLimit) keep = true;
    }
    if (keep) out.push({ a: e.va, b: e.vb, faces: e.faces });
  }
  return out;
}

/** Deterministic, seedable PRNG (mulberry32) so every run reproduces exactly. */
export function makeRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth 1D value noise - the wobble of a hand that cannot draw a true line. */
export function makeNoise1D(random) {
  const table = new Float32Array(512);
  for (let i = 0; i < 512; i++) table[i] = random() * 2 - 1;
  return function noise(x) {
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    const a = table[((i % 512) + 512) % 512];
    const b = table[(((i + 1) % 512) + 512) % 512];
    return a + (b - a) * s;
  };
}

/**
 * Triangle adjacency across shared (welded) edges. Up to three neighbours per
 * triangle, -1 where an edge is a boundary or non-manifold.
 */
export function buildAdjacency(indices, remap) {
  const triCount = indices.length / 3;
  const adjacency = new Int32Array(triCount * 3).fill(-1);
  const edgeOwner = new Map();
  for (let t = 0; t < triCount; t++) {
    for (let e = 0; e < 3; e++) {
      const a = remap[indices[t * 3 + e]];
      const b = remap[indices[t * 3 + ((e + 1) % 3)]];
      const key = a < b ? a * 4294967296 + b : b * 4294967296 + a;
      const owner = edgeOwner.get(key);
      if (owner === undefined) edgeOwner.set(key, t * 3 + e);
      else {
        const ot = (owner / 3) | 0;
        adjacency[t * 3 + e] = ot;
        adjacency[owner] = t;
      }
    }
  }
  return adjacency;
}

/**
 * Blurs the triangle normal field over the adjacency graph.
 *
 * The slicing axis is picked from this field rather than the raw normals: raw
 * normals flip their best axis every few triangles on a curved surface, which
 * chops every contour into confetti. Blurring first means the axis only
 * changes where the form genuinely turns, so contours stay long.
 */
export function smoothNormalField(tri, adjacency, iterations = 6) {
  let current = Float32Array.from(tri.normal);
  let next = new Float32Array(current.length);
  for (let it = 0; it < iterations; it++) {
    for (let t = 0; t < tri.triCount; t++) {
      let x = current[t * 3] * 1.4, y = current[t * 3 + 1] * 1.4, z = current[t * 3 + 2] * 1.4;
      for (let e = 0; e < 3; e++) {
        const n = adjacency[t * 3 + e];
        if (n < 0) continue;
        x += current[n * 3]; y += current[n * 3 + 1]; z += current[n * 3 + 2];
      }
      const l = Math.hypot(x, y, z) || 1;
      next[t * 3] = x / l; next[t * 3 + 1] = y / l; next[t * 3 + 2] = z / l;
    }
    const swap = current; current = next; next = swap;
  }
  return current;
}

/**
 * Fills pinholes in a keep/drop mask. Ray-based culling leaves speckle at
 * grazing angles, and every speckle punches a hole that breaks a contour.
 */
export function closeMask(mask, adjacency, iterations = 2) {
  let current = Uint8Array.from(mask);
  for (let it = 0; it < iterations; it++) {
    const next = Uint8Array.from(current);
    for (let t = 0; t < current.length; t++) {
      let neighbours = 0, alive = 0;
      for (let e = 0; e < 3; e++) {
        const n = adjacency[t * 3 + e];
        if (n < 0) continue;
        neighbours++;
        if (current[n]) alive++;
      }
      if (!neighbours) continue;
      // Only genuinely enclosed holes get filled: a dropped triangle whose
      // every neighbour survived was almost certainly ray-culling speckle.
      if (!current[t] && alive === neighbours && neighbours === 3) next[t] = 1;
      else if (current[t] && alive === 0) next[t] = 0;      // lone island
    }
    current = next;
  }
  return current;
}
