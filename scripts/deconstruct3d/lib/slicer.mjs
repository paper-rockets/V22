/**
 * Contour extraction.
 *
 * Cutting a mesh with a stack of parallel planes gives you lines that wrap the
 * form - the same lines a person draws when they shade around a shape. The
 * catch is that a plane parallel to a surface produces contours that are miles
 * apart, so a single slice direction leaves bald patches on every surface it
 * happens to graze.
 *
 * Fix: slice on all three axes and give every triangle to whichever axis cuts
 * it most steeply (with a little overlap at the ties so the seams close). The
 * worst case then becomes 1.22x the nominal spacing instead of infinity.
 */

const AXES = ['x', 'y', 'z'];

/**
 * Splits the surface into slicing families.
 *
 * The obvious scheme - give every triangle to whichever axis cuts it most
 * steeply - looks right on paper and destroys the drawing in practice: the
 * winning axis flips back and forth around any curved form, so every contour
 * ring comes out as a dozen crumbs a few millimetres long. Measured on the
 * mech, it cut the longest arc in a slice from 0.70 down to 0.21.
 *
 * So instead of picking a winner per triangle, one axis takes everything it
 * can cut steeply enough (a threshold, not a contest) and a second axis picks
 * up the near-parallel leftovers - the tops of shoulders and feet. Both
 * families are big connected regions, so the contours stay long.
 */
export function familyMasks(tri, keep, normalField, { gate = 0.75, overlap = 0.07 } = {}) {
  const field = normalField || tri.normal;
  const axes = ['x', 'y', 'z'];

  // Primary axis = whichever one can carry the most surface area.
  let primary = 1, bestArea = -1;
  for (let a = 0; a < 3; a++) {
    let area = 0;
    for (let t = 0; t < tri.triCount; t++) {
      if (keep && !keep[t]) continue;
      if (Math.abs(field[t * 3 + a]) <= gate) area += tri.area[t];
    }
    if (area > bestArea) { bestArea = area; primary = a; }
  }

  // Secondary axis = the one that cuts the leftovers most steeply.
  let secondary = (primary + 1) % 3, bestLeft = -1;
  for (let a = 0; a < 3; a++) {
    if (a === primary) continue;
    let area = 0;
    for (let t = 0; t < tri.triCount; t++) {
      if (keep && !keep[t]) continue;
      if (Math.abs(field[t * 3 + primary]) > gate - overlap && Math.abs(field[t * 3 + a]) <= gate) area += tri.area[t];
    }
    if (area > bestLeft) { bestLeft = area; secondary = a; }
  }

  const primaryMask = new Uint8Array(tri.triCount);
  const secondaryMask = new Uint8Array(tri.triCount);
  const bit = (i) => 1 << i;
  for (let t = 0; t < tri.triCount; t++) {
    if (keep && !keep[t]) continue;
    const p = Math.abs(field[t * 3 + primary]);
    if (p <= gate) primaryMask[t] = bit(primary);
    if (p > gate - overlap) secondaryMask[t] = bit(secondary);
  }

  return [
    { axis: axes[primary], axisIndex: primary, mask: primaryMask, area: bestArea },
    { axis: axes[secondary], axisIndex: secondary, mask: secondaryMask, area: bestLeft },
  ];
}

/**
 * Slices the mesh along one axis and returns the raw intersection segments,
 * grouped per slice plane. Each endpoint carries interpolated uv + normal so
 * colour and orientation stay exact.
 */
export function sliceAxis(mesh, tri, { axis, spacing, mask, keep, phase = 0 }) {
  const axisIndex = AXES.indexOf(axis);
  const bit = 1 << axisIndex;
  const { positions, normals, uvs, indices } = mesh;

  let lo = Infinity, hi = -Infinity;
  for (let t = 0; t < tri.triCount; t++) {
    if (!(mask[t] & bit)) continue;
    for (let c = 0; c < 3; c++) {
      const v = positions[indices[t * 3 + c] * 3 + axisIndex];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  if (!isFinite(lo)) return [];

  const start = lo + spacing * phase;
  const sliceCount = Math.max(1, Math.ceil((hi - start) / spacing) + 1);
  const buckets = Array.from({ length: sliceCount }, () => []);

  // Bucket triangles by the slices they straddle so each plane only tests the
  // triangles it can possibly hit.
  for (let t = 0; t < tri.triCount; t++) {
    if (!(mask[t] & bit)) continue;
    if (keep && !keep[t]) continue;
    let tmin = Infinity, tmax = -Infinity;
    for (let c = 0; c < 3; c++) {
      const v = positions[indices[t * 3 + c] * 3 + axisIndex];
      if (v < tmin) tmin = v;
      if (v > tmax) tmax = v;
    }
    const first = Math.max(0, Math.ceil((tmin - start) / spacing));
    const last = Math.min(sliceCount - 1, Math.floor((tmax - start) / spacing));
    for (let s = first; s <= last; s++) buckets[s].push(t);
  }

  const slices = [];
  for (let s = 0; s < sliceCount; s++) {
    if (!buckets[s].length) continue;
    const planeValue = start + s * spacing;
    const segments = [];
    for (const t of buckets[s]) {
      const seg = intersectTriangle(mesh, t, axisIndex, planeValue);
      if (seg) segments.push(seg);
    }
    if (segments.length) slices.push({ axis, axisIndex, planeValue, sliceIndex: s, segments });
  }
  return slices;
}

const EDGE_PAIRS = [[0, 1], [1, 2], [2, 0]];

function intersectTriangle(mesh, t, axisIndex, planeValue) {
  const { positions, normals, uvs, indices } = mesh;
  const vi = [indices[t * 3], indices[t * 3 + 1], indices[t * 3 + 2]];
  const d = [
    positions[vi[0] * 3 + axisIndex] - planeValue,
    positions[vi[1] * 3 + axisIndex] - planeValue,
    positions[vi[2] * 3 + axisIndex] - planeValue,
  ];

  const hits = [];
  for (const [a, b] of EDGE_PAIRS) {
    const da = d[a], db = d[b];
    if ((da > 0 && db > 0) || (da < 0 && db < 0)) continue;
    if (da === db) continue; // edge lies in the plane - the other two edges cover it
    const f = da / (da - db);
    if (f < 0 || f > 1) continue;
    const ia = vi[a], ib = vi[b];
    hits.push({
      x: positions[ia * 3] + f * (positions[ib * 3] - positions[ia * 3]),
      y: positions[ia * 3 + 1] + f * (positions[ib * 3 + 1] - positions[ia * 3 + 1]),
      z: positions[ia * 3 + 2] + f * (positions[ib * 3 + 2] - positions[ia * 3 + 2]),
      nx: normals[ia * 3] + f * (normals[ib * 3] - normals[ia * 3]),
      ny: normals[ia * 3 + 1] + f * (normals[ib * 3 + 1] - normals[ia * 3 + 1]),
      nz: normals[ia * 3 + 2] + f * (normals[ib * 3 + 2] - normals[ia * 3 + 2]),
      u: uvs[ia * 2] + f * (uvs[ib * 2] - uvs[ia * 2]),
      v: uvs[ia * 2 + 1] + f * (uvs[ib * 2 + 1] - uvs[ia * 2 + 1]),
      tri: t,
      // Sort key along the shared edge, so two triangles sharing an edge
      // produce byte-identical endpoints and chaining never drops a link.
      key: edgeKey(mesh.remap ? mesh.remap[ia] : ia, mesh.remap ? mesh.remap[ib] : ib, f),
    });
    if (hits.length === 2) break;
  }
  if (hits.length !== 2) return null;

  const dx = hits[0].x - hits[1].x, dy = hits[0].y - hits[1].y, dz = hits[0].z - hits[1].z;
  if (dx * dx + dy * dy + dz * dz < 1e-14) return null;
  normaliseHits(hits, mesh, t);
  return hits;
}

/**
 * Normalises the interpolated normals, flipping them for triangles whose
 * winding was inside out. The flip is applied here rather than by negating
 * vertex normals in place: vertices are shared, so negating them per triangle
 * corrupts the neighbours and cancels itself out where two flipped triangles
 * meet.
 */
function normaliseHits(hits, mesh, t) {
  const flip = mesh.triFlip && mesh.triFlip[t] ? -1 : 1;
  for (const h of hits) {
    const l = Math.hypot(h.nx, h.ny, h.nz) || 1;
    h.nx = (h.nx / l) * flip;
    h.ny = (h.ny / l) * flip;
    h.nz = (h.nz / l) * flip;
  }
}

/**
 * Identifies an intersection point by the (welded) mesh edge it lies on plus
 * the fraction along it. Both triangles sharing that edge derive the same
 * string, which makes chaining exact instead of distance-tolerant. Welded ids
 * matter because exporters split vertices along UV seams.
 */
function edgeKey(ia, ib, f) {
  return ia < ib ? `${ia}:${ib}:${f.toFixed(6)}` : `${ib}:${ia}:${(1 - f).toFixed(6)}`;
}

/**
 * Slices a set of triangles with planes perpendicular to an arbitrary
 * direction.
 *
 * The axis-aligned version above is for wrapping a whole model. This one is
 * for filling one patch: the direction is the patch's own short axis, so the
 * lines that come out run along its length - a wall brushed along the wall,
 * not hatched across it.
 */
export function sliceDirection(mesh, tri, { triangles, dir, spacing, phase = 0, inset = 0 }) {
  const { positions, indices } = mesh;
  const [dx, dy, dz] = dir;
  const distance = (v) => positions[v * 3] * dx + positions[v * 3 + 1] * dy + positions[v * 3 + 2] * dz;

  let lo = Infinity, hi = -Infinity;
  for (const t of triangles) {
    for (let c = 0; c < 3; c++) {
      const d = distance(indices[t * 3 + c]);
      if (d < lo) lo = d;
      if (d > hi) hi = d;
    }
  }
  if (!isFinite(lo)) return [];

  // Pull the stack in from both edges by half a stroke width, so a wide pass
  // sits inside the patch instead of hanging over its boundary.
  const margin = Math.min(inset, (hi - lo) * 0.4);
  const innerLo = lo + margin, innerHi = hi - margin;
  const span = Math.max(innerHi - innerLo, 1e-6);
  const count = Math.max(1, Math.round(span / spacing));
  const step = span / count;
  const start = innerLo + (count > 1 ? 0 : step * 0.5) + step * phase * 0.5;

  const buckets = Array.from({ length: count + 1 }, () => []);
  for (const t of triangles) {
    let tmin = Infinity, tmax = -Infinity;
    for (let c = 0; c < 3; c++) {
      const d = distance(indices[t * 3 + c]);
      if (d < tmin) tmin = d;
      if (d > tmax) tmax = d;
    }
    const first = Math.max(0, Math.ceil((tmin - start) / step));
    const last = Math.min(count, Math.floor((tmax - start) / step));
    for (let s = first; s <= last; s++) buckets[s].push(t);
  }

  const slices = [];
  for (let s = 0; s <= count; s++) {
    if (!buckets[s].length) continue;
    const planeValue = start + s * step;
    const segments = [];
    for (const t of buckets[s]) {
      const seg = intersectTriangleDirection(mesh, t, dir, planeValue);
      if (seg) segments.push(seg);
    }
    if (segments.length) slices.push({ planeValue, sliceIndex: s, segments, spacing: step });
  }
  return slices;
}

function intersectTriangleDirection(mesh, t, dir, planeValue) {
  const { positions, normals, uvs, indices } = mesh;
  const [dx, dy, dz] = dir;
  const vi = [indices[t * 3], indices[t * 3 + 1], indices[t * 3 + 2]];
  const d = vi.map((v) => positions[v * 3] * dx + positions[v * 3 + 1] * dy + positions[v * 3 + 2] * dz - planeValue);

  const hits = [];
  for (const [a, b] of EDGE_PAIRS) {
    const da = d[a], db = d[b];
    if ((da > 0 && db > 0) || (da < 0 && db < 0)) continue;
    if (da === db) continue;
    const f = da / (da - db);
    if (f < 0 || f > 1) continue;
    const ia = vi[a], ib = vi[b];
    hits.push({
      x: positions[ia * 3] + f * (positions[ib * 3] - positions[ia * 3]),
      y: positions[ia * 3 + 1] + f * (positions[ib * 3 + 1] - positions[ia * 3 + 1]),
      z: positions[ia * 3 + 2] + f * (positions[ib * 3 + 2] - positions[ia * 3 + 2]),
      nx: normals[ia * 3] + f * (normals[ib * 3] - normals[ia * 3]),
      ny: normals[ia * 3 + 1] + f * (normals[ib * 3 + 1] - normals[ia * 3 + 1]),
      nz: normals[ia * 3 + 2] + f * (normals[ib * 3 + 2] - normals[ia * 3 + 2]),
      u: uvs[ia * 2] + f * (uvs[ib * 2] - uvs[ia * 2]),
      v: uvs[ia * 2 + 1] + f * (uvs[ib * 2 + 1] - uvs[ia * 2 + 1]),
      tri: t,
      key: edgeKey(mesh.remap ? mesh.remap[ia] : ia, mesh.remap ? mesh.remap[ib] : ib, f),
    });
    if (hits.length === 2) break;
  }
  if (hits.length !== 2) return null;
  const ddx = hits[0].x - hits[1].x, ddy = hits[0].y - hits[1].y, ddz = hits[0].z - hits[1].z;
  if (ddx * ddx + ddy * ddy + ddz * ddz < 1e-14) return null;
  normaliseHits(hits, mesh, t);
  return hits;
}
