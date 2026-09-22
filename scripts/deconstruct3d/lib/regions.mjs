/**
 * Surface segmentation: finding the flat patches a person would fill in one go.
 *
 * Watching someone draw in Feather, the paint does not go on as a weave of
 * little strokes. A wall gets filled as a wall - a few very wide passes with
 * one colour - and the drawing reads because of the line work on top. To do
 * that from a model you first have to know where the walls are.
 *
 * Regions grow across the triangle adjacency graph while the surface stays
 * flat enough and the texture stays the same colour. What comes out is the
 * model's own panel breakdown: each roof slope, each wall, the door, the
 * water, as separate patches with a single colour each.
 */

import { linearToOklab, oklabDistance } from './texture.mjs';

/**
 * @param colorOfTriangle (t) => [r, g, b] in linear light
 * @returns { regionOf, regions } where regionOf[t] is -1 for unassigned
 */
export function segmentRegions(mesh, tri, adjacency, keep, colorOfTriangle, options = {}) {
  const {
    normalTolerance = 32,       // degrees a patch may bend before it splits
    colorTolerance = 0.075,     // OKLab distance from the patch's running mean
    alphaTolerance = 0.3,       // how far see-through-ness may drift
    alphaOfTriangle = null,
    minArea = 0,                // patches smaller than this get absorbed
    normalField = null,
  } = options;

  const field = normalField || tri.normal;
  const cosLimit = Math.cos((normalTolerance * Math.PI) / 180);
  const regionOf = new Int32Array(tri.triCount).fill(-1);

  // Largest triangles first: seeding on a big flat face makes the patch grow
  // outward the way a person's eye groups a surface.
  const order = [];
  for (let t = 0; t < tri.triCount; t++) if (!keep || keep[t]) order.push(t);
  order.sort((a, b) => tri.area[b] - tri.area[a]);

  const labCache = new Map();
  const labOf = (t) => {
    let lab = labCache.get(t);
    if (!lab) { lab = linearToOklab(...colorOfTriangle(t)); labCache.set(t, lab); }
    return lab;
  };
  // Solid surfaces and see-through ones are different paint, even where they
  // are the same colour, so they must not end up in the same patch.
  const alphaOf = alphaOfTriangle || (() => 1);

  const regions = [];
  const queue = new Int32Array(tri.triCount);

  for (const seed of order) {
    if (regionOf[seed] !== -1) continue;
    const id = regions.length;
    const seedLab = labOf(seed);
    const region = {
      id,
      triangles: [],
      area: 0,
      normal: [field[seed * 3], field[seed * 3 + 1], field[seed * 3 + 2]],
      lab: [seedLab[0], seedLab[1], seedLab[2]],
      centroid: [0, 0, 0],
    };

    // running means, weighted by area
    let nx = region.normal[0], ny = region.normal[1], nz = region.normal[2];
    let l0 = seedLab[0], l1 = seedLab[1], l2 = seedLab[2];
    let alphaMean = alphaOf(seed);
    let weight = 0;

    let head = 0, tail = 0;
    queue[tail++] = seed;
    regionOf[seed] = id;

    while (head < tail) {
      const t = queue[head++];
      const a = tri.area[t];
      region.triangles.push(t);
      region.area += a;

      const w = weight + a;
      nx = (nx * weight + field[t * 3] * a) / w;
      ny = (ny * weight + field[t * 3 + 1] * a) / w;
      nz = (nz * weight + field[t * 3 + 2] * a) / w;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      const lab = labOf(t);
      alphaMean = (alphaMean * weight + alphaOf(t) * a) / w;
      l0 = (l0 * weight + lab[0] * a) / w;
      l1 = (l1 * weight + lab[1] * a) / w;
      l2 = (l2 * weight + lab[2] * a) / w;
      region.centroid[0] = (region.centroid[0] * weight + tri.centroid[t * 3] * a) / w;
      region.centroid[1] = (region.centroid[1] * weight + tri.centroid[t * 3 + 1] * a) / w;
      region.centroid[2] = (region.centroid[2] * weight + tri.centroid[t * 3 + 2] * a) / w;
      weight = w;

      for (let e = 0; e < 3; e++) {
        const nb = adjacency[t * 3 + e];
        if (nb < 0 || regionOf[nb] !== -1) continue;
        if (keep && !keep[nb]) continue;
        const dot = field[nb * 3] * nx + field[nb * 3 + 1] * ny + field[nb * 3 + 2] * nz;
        if (dot < cosLimit) continue;
        if (oklabDistance(labOf(nb), [l0, l1, l2]) > colorTolerance) continue;
        if (Math.abs(alphaOf(nb) - alphaMean) > alphaTolerance) continue;
        regionOf[nb] = id;
        queue[tail++] = nb;
      }
    }

    region.normal = [nx, ny, nz];
    region.lab = [l0, l1, l2];
    region.alpha = alphaMean;
    regions.push(region);
  }

  if (minArea > 0) absorbSmallRegions(regions, regionOf, tri, adjacency, minArea);
  for (const r of regions) r.frame = regionFrame(r, tri);
  regions.sort((a, b) => b.area - a.area);
  return { regionOf, regions: regions.filter((r) => r.triangles.length > 0) };
}

/**
 * Small scraps get folded into whichever neighbour they touch most. Without
 * this every bevel and seam becomes its own patch and the fill turns back into
 * confetti.
 */
function absorbSmallRegions(regions, regionOf, tri, adjacency, minArea) {
  const byArea = [...regions].sort((a, b) => a.area - b.area);
  for (const region of byArea) {
    if (region.area >= minArea || !region.triangles.length) continue;
    const touching = new Map();
    for (const t of region.triangles) {
      for (let e = 0; e < 3; e++) {
        const nb = adjacency[t * 3 + e];
        if (nb < 0) continue;
        const other = regionOf[nb];
        if (other === region.id || other < 0) continue;
        touching.set(other, (touching.get(other) || 0) + 1);
      }
    }
    if (!touching.size) continue;
    let bestId = -1, bestCount = -1;
    for (const [id, c] of touching) {
      if (regions[id].area < minArea && regions[id].area <= region.area) continue;
      if (c > bestCount) { bestCount = c; bestId = id; }
    }
    if (bestId < 0) continue;
    const host = regions[bestId];
    for (const t of region.triangles) {
      regionOf[t] = bestId;
      host.triangles.push(t);
      host.area += tri.area[t];
    }
    region.triangles = [];
    region.area = 0;
  }
}

/**
 * A patch's own axes: the plane normal plus the long and short directions of
 * the shape lying in it. Strokes run along the long one, which is what makes a
 * wall read as brushed along its length rather than hatched at random.
 */
export function regionFrame(region, tri) {
  const n = region.normal;
  // any vector not parallel to n
  const helper = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = helper[1] * n[2] - helper[2] * n[1];
  let uy = helper[2] * n[0] - helper[0] * n[2];
  let uz = helper[0] * n[1] - helper[1] * n[0];
  const ul = Math.hypot(ux, uy, uz) || 1;
  ux /= ul; uy /= ul; uz /= ul;
  let vx = n[1] * uz - n[2] * uy;
  let vy = n[2] * ux - n[0] * uz;
  let vz = n[0] * uy - n[1] * ux;

  // 2x2 covariance of the patch in the (u, v) plane, area weighted
  let suu = 0, svv = 0, suv = 0, total = 0;
  for (const t of region.triangles) {
    const a = tri.area[t];
    const dx = tri.centroid[t * 3] - region.centroid[0];
    const dy = tri.centroid[t * 3 + 1] - region.centroid[1];
    const dz = tri.centroid[t * 3 + 2] - region.centroid[2];
    const u = dx * ux + dy * uy + dz * uz;
    const v = dx * vx + dy * vy + dz * vz;
    suu += a * u * u; svv += a * v * v; suv += a * u * v; total += a;
  }
  if (total > 0) { suu /= total; svv /= total; suv /= total; }

  // principal direction of that covariance
  const theta = 0.5 * Math.atan2(2 * suv, suu - svv);
  const c = Math.cos(theta), s = Math.sin(theta);
  const longAxis = [ux * c + vx * s, uy * c + vy * s, uz * c + vz * s];
  const shortAxis = [
    n[1] * longAxis[2] - n[2] * longAxis[1],
    n[2] * longAxis[0] - n[0] * longAxis[2],
    n[0] * longAxis[1] - n[1] * longAxis[0],
  ];

  // extents along each axis
  let longMin = Infinity, longMax = -Infinity, shortMin = Infinity, shortMax = -Infinity;
  for (const t of region.triangles) {
    const dx = tri.centroid[t * 3] - region.centroid[0];
    const dy = tri.centroid[t * 3 + 1] - region.centroid[1];
    const dz = tri.centroid[t * 3 + 2] - region.centroid[2];
    const a = dx * longAxis[0] + dy * longAxis[1] + dz * longAxis[2];
    const b = dx * shortAxis[0] + dy * shortAxis[1] + dz * shortAxis[2];
    if (a < longMin) longMin = a; if (a > longMax) longMax = a;
    if (b < shortMin) shortMin = b; if (b > shortMax) shortMax = b;
  }

  return {
    normal: n,
    longAxis,
    shortAxis,
    longExtent: longMax - longMin,
    shortExtent: shortMax - shortMin,
  };
}
