import * as THREE from 'three';
import { StrokePoint } from '../types';

/**
 * Stroke Fitting: turning sampled pointer positions into the curve the hand meant.
 *
 * The old approach damped each incoming point against the last one, which
 * removes tremor only by holding the mark behind the pen -- the wobble is still
 * there, just late. This works the other way round: look at the whole path,
 * throw away the samples that carry no information, and refit what is left to
 * continuous curves. The tremor disappears because the fitted curve never had
 * it, and nothing lags, because the fit runs on a path already drawn.
 *
 * Pieces:
 *  - simplifyPath      Ramer-Douglas-Peucker decimation
 *  - detectCorners     angular change between successive segments
 *  - fitCubicPath      Schneider least-squares cubic Bezier fitting
 *  - bestFitPlane      principal component plane through a stroke
 *  - refitStrokePoints the whole chain, with per-point attributes carried across
 */

export interface CubicSegment {
  p0: THREE.Vector3;
  p1: THREE.Vector3;
  p2: THREE.Vector3;
  p3: THREE.Vector3;
}

export interface StrokePlane {
  origin: THREE.Vector3;
  normal: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
  /** Spread along each in-plane axis, largest first. */
  extent: THREE.Vector2;
  /** How flat the stroke is: 1 means it lies perfectly in one plane. */
  flatness: number;
}

/** Shortest distance from p to the segment ab. */
export function distanceToSegment(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  const ab = b.clone().sub(a);
  const lenSq = ab.lengthSq();
  if (lenSq < 1e-12) return p.distanceTo(a);
  const t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / lenSq, 0, 1);
  return p.distanceTo(a.clone().addScaledVector(ab, t));
}

/**
 * Ramer-Douglas-Peucker: keep only the points that carry the shape.
 * Returns kept indices, ascending, always including first and last.
 */
export function simplifyPath(points: THREE.Vector3[], epsilon: number): number[] {
  const n = points.length;
  if (n <= 2) return points.map((_, i) => i);

  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;

  const stack: Array<[number, number]> = [[0, n - 1]];
  while (stack.length > 0) {
    const range = stack.pop();
    if (!range) break;
    const [start, end] = range;
    let maxDist = -1;
    let maxIdx = -1;
    for (let i = start + 1; i < end; i++) {
      const d = distanceToSegment(points[i], points[start], points[end]);
      if (d > maxDist) {
        maxDist = d;
        maxIdx = i;
      }
    }
    if (maxDist > epsilon && maxIdx > start && maxIdx < end) {
      keep[maxIdx] = 1;
      stack.push([start, maxIdx], [maxIdx, end]);
    }
  }

  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(i);
  return out;
}

/** Running total of distance travelled along a path. */
export function cumulativeLengths(positions: THREE.Vector3[]): number[] {
  const acc = [0];
  for (let i = 1; i < positions.length; i++) {
    acc.push(acc[i - 1] + positions[i].distanceTo(positions[i - 1]));
  }
  return acc;
}

/**
 * Corners, told apart from curves by how concentrated the turn is.
 *
 * The direction is compared across a short, fixed span of the drawn path: a
 * corner turns hard within it, a smooth curve barely turns at all. Measuring
 * the turn between decimated points instead makes the answer depend on how
 * coarsely the path was decimated -- which meant that turning the smoothing up
 * manufactured corners out of a perfectly smooth curve, and a gentle wave came
 * back as a zigzag of straight segments.
 *
 * Returns indices into `points`.
 */
export function detectCorners(
  points: THREE.Vector3[],
  thresholdRad: number = Math.PI / 4,
  spanRatio: number = 0.035
): number[] {
  const n = points.length;
  if (n < 8) return [];
  const cum = cumulativeLengths(points);
  const pathLength = cum[n - 1];
  if (pathLength < 1e-9) return [];
  const span = pathLength * spanRatio;

  const turns = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let back = i;
    while (back > 0 && cum[i] - cum[back] < span) back--;
    let fwd = i;
    while (fwd < n - 1 && cum[fwd] - cum[i] < span) fwd++;
    if (cum[i] - cum[back] < span * 0.6 || cum[fwd] - cum[i] < span * 0.6) continue;
    const inDir = points[i].clone().sub(points[back]);
    const outDir = points[fwd].clone().sub(points[i]);
    if (inDir.lengthSq() < 1e-14 || outDir.lengthSq() < 1e-14) continue;
    turns[i] = Math.acos(
      THREE.MathUtils.clamp(inDir.normalize().dot(outDir.normalize()), -1, 1)
    );
  }

  // Keep only the sharpest sample in each turn, so one corner is one corner.
  const corners: number[] = [];
  let lo = 0;
  let hi = 0;
  for (let i = 0; i < n; i++) {
    while (cum[i] - cum[lo] > span) lo++;
    if (hi < i) hi = i;
    while (hi < n - 1 && cum[hi + 1] - cum[i] <= span) hi++;
    if (turns[i] < thresholdRad) continue;
    let isPeak = true;
    for (let k = lo; k <= hi; k++) {
      if (k === i) continue;
      if (turns[k] > turns[i] || (turns[k] === turns[i] && k < i)) {
        isPeak = false;
        break;
      }
    }
    if (isPeak) corners.push(i);
  }
  return corners;
}

/**
 * Eigen decomposition of a symmetric 3x3 matrix by Jacobi rotations.
 * Eigenvalues come back descending, with matching eigenvectors.
 */
export function symmetricEigen3(m: THREE.Matrix3): { values: number[]; vectors: THREE.Vector3[] } {
  const a = [
    [m.elements[0], m.elements[3], m.elements[6]],
    [m.elements[1], m.elements[4], m.elements[7]],
    [m.elements[2], m.elements[5], m.elements[8]],
  ];
  const v = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  for (let sweep = 0; sweep < 24; sweep++) {
    const off = Math.abs(a[0][1]) + Math.abs(a[0][2]) + Math.abs(a[1][2]);
    if (off < 1e-15) break;
    for (let p = 0; p < 2; p++) {
      for (let q = p + 1; q < 3; q++) {
        if (Math.abs(a[p][q]) < 1e-20) continue;
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const sign = theta >= 0 ? 1 : -1;
        const t = sign / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < 3; k++) {
          const akp = a[k][p];
          const akq = a[k][q];
          a[k][p] = c * akp - s * akq;
          a[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < 3; k++) {
          const apk = a[p][k];
          const aqk = a[q][k];
          a[p][k] = c * apk - s * aqk;
          a[q][k] = s * apk + c * aqk;
          const vkp = v[k][p];
          const vkq = v[k][q];
          v[k][p] = c * vkp - s * vkq;
          v[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }

  const order = [0, 1, 2].sort((i, j) => a[j][j] - a[i][i]);
  return {
    values: order.map((i) => a[i][i]),
    vectors: order.map((i) => new THREE.Vector3(v[0][i], v[1][i], v[2][i]).normalize()),
  };
}

/**
 * Best-fit plane through a stroke, from the covariance matrix of its points.
 * The smallest principal axis is the plane normal; the other two give an
 * in-plane frame ordered by how far the stroke spreads along each.
 */
export function bestFitPlane(positions: THREE.Vector3[], fallbackNormal?: THREE.Vector3): StrokePlane {
  const n = Math.max(1, positions.length);
  const origin = new THREE.Vector3();
  for (const p of positions) origin.add(p);
  origin.divideScalar(n);

  let xx = 0;
  let xy = 0;
  let xz = 0;
  let yy = 0;
  let yz = 0;
  let zz = 0;
  for (const p of positions) {
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    const dz = p.z - origin.z;
    xx += dx * dx;
    xy += dx * dy;
    xz += dx * dz;
    yy += dy * dy;
    yz += dy * dz;
    zz += dz * dz;
  }
  const inv = 1 / n;
  const cov = new THREE.Matrix3().set(
    xx * inv, xy * inv, xz * inv,
    xy * inv, yy * inv, yz * inv,
    xz * inv, yz * inv, zz * inv
  );

  const { values, vectors } = symmetricEigen3(cov);
  const right = vectors[0].clone();
  const normal = vectors[2].clone();
  if (fallbackNormal && normal.dot(fallbackNormal) < 0) normal.negate();
  const up = new THREE.Vector3().crossVectors(normal, right).normalize();

  const spread0 = Math.sqrt(Math.max(0, values[0]));
  const spread1 = Math.sqrt(Math.max(0, values[1]));
  const spread2 = Math.sqrt(Math.max(0, values[2]));

  return {
    origin,
    normal,
    right,
    up,
    extent: new THREE.Vector2(spread0, spread1),
    flatness: THREE.MathUtils.clamp(1 - spread2 / Math.max(spread0, 1e-9), 0, 1),
  };
}

// ---------------------------------------------------------------------------
// Schneider least-squares cubic Bezier fitting
// ---------------------------------------------------------------------------

export function evaluateCubic(seg: CubicSegment, t: number, out = new THREE.Vector3()): THREE.Vector3 {
  const mt = 1 - t;
  const w0 = mt * mt * mt;
  const w1 = 3 * mt * mt * t;
  const w2 = 3 * mt * t * t;
  const w3 = t * t * t;
  return out.set(
    seg.p0.x * w0 + seg.p1.x * w1 + seg.p2.x * w2 + seg.p3.x * w3,
    seg.p0.y * w0 + seg.p1.y * w1 + seg.p2.y * w2 + seg.p3.y * w3,
    seg.p0.z * w0 + seg.p1.z * w1 + seg.p2.z * w2 + seg.p3.z * w3
  );
}

function cubicTangent(seg: CubicSegment, t: number): THREE.Vector3 {
  const mt = 1 - t;
  return new THREE.Vector3()
    .addScaledVector(seg.p1.clone().sub(seg.p0), 3 * mt * mt)
    .addScaledVector(seg.p2.clone().sub(seg.p1), 6 * mt * t)
    .addScaledVector(seg.p3.clone().sub(seg.p2), 3 * t * t);
}

function chordLengthParameterize(points: THREE.Vector3[]): number[] {
  const u = [0];
  for (let i = 1; i < points.length; i++) {
    u.push(u[i - 1] + points[i].distanceTo(points[i - 1]));
  }
  const total = u[u.length - 1] || 1;
  return u.map((value) => value / total);
}

/** Least-squares solve for the two inner control points, with the end tangents fixed. */
function generateBezier(
  points: THREE.Vector3[],
  params: number[],
  tHat1: THREE.Vector3,
  tHat2: THREE.Vector3
): CubicSegment {
  const first = points[0];
  const last = points[points.length - 1];
  let c00 = 0;
  let c01 = 0;
  let c11 = 0;
  let x0 = 0;
  let x1 = 0;

  for (let i = 0; i < points.length; i++) {
    const t = params[i];
    const mt = 1 - t;
    const b0 = mt * mt * mt;
    const b1 = 3 * mt * mt * t;
    const b2 = 3 * mt * t * t;
    const b3 = t * t * t;

    const a1 = tHat1.clone().multiplyScalar(b1);
    const a2 = tHat2.clone().multiplyScalar(b2);

    c00 += a1.dot(a1);
    c01 += a1.dot(a2);
    c11 += a2.dot(a2);

    const tmp = points[i]
      .clone()
      .sub(first.clone().multiplyScalar(b0 + b1))
      .sub(last.clone().multiplyScalar(b2 + b3));
    x0 += a1.dot(tmp);
    x1 += a2.dot(tmp);
  }

  const det = c00 * c11 - c01 * c01;
  const chord = first.distanceTo(last);
  let alphaL: number;
  let alphaR: number;
  if (Math.abs(det) < 1e-14) {
    alphaL = chord / 3;
    alphaR = chord / 3;
  } else {
    alphaL = (x0 * c11 - x1 * c01) / det;
    alphaR = (c00 * x1 - c01 * x0) / det;
  }
  if (alphaL < 1e-7 || alphaR < 1e-7) {
    alphaL = chord / 3;
    alphaR = chord / 3;
  }

  return {
    p0: first.clone(),
    p1: first.clone().addScaledVector(tHat1, alphaL),
    p2: last.clone().addScaledVector(tHat2, alphaR),
    p3: last.clone(),
  };
}

function computeMaxError(
  points: THREE.Vector3[],
  seg: CubicSegment,
  params: number[]
): { error: number; index: number } {
  let maxError = 0;
  let index = Math.floor(points.length / 2);
  const scratch = new THREE.Vector3();
  for (let i = 1; i < points.length - 1; i++) {
    const dist = evaluateCubic(seg, params[i], scratch).distanceToSquared(points[i]);
    if (dist > maxError) {
      maxError = dist;
      index = i;
    }
  }
  return { error: Math.sqrt(maxError), index };
}

/** One Newton-Raphson step pulling each sample onto its nearest curve parameter. */
function reparameterize(points: THREE.Vector3[], seg: CubicSegment, params: number[]): number[] {
  return params.map((t, i) => {
    const pt = evaluateCubic(seg, t);
    const d1 = cubicTangent(seg, t);
    const mt = 1 - t;
    const d2 = new THREE.Vector3()
      .addScaledVector(seg.p2.clone().sub(seg.p1.clone().multiplyScalar(2)).add(seg.p0), 6 * mt)
      .addScaledVector(seg.p3.clone().sub(seg.p2.clone().multiplyScalar(2)).add(seg.p1), 6 * t);
    const diff = pt.sub(points[i]);
    const numerator = diff.dot(d1);
    const denominator = d1.lengthSq() + diff.dot(d2);
    if (Math.abs(denominator) < 1e-14) return t;
    return THREE.MathUtils.clamp(t - numerator / denominator, 0, 1);
  });
}

function fitCubicRecursive(
  points: THREE.Vector3[],
  tHat1: THREE.Vector3,
  tHat2: THREE.Vector3,
  errorTolerance: number,
  depth: number,
  out: CubicSegment[]
): void {
  if (points.length < 3) {
    const a = points[0];
    const b = points[points.length - 1];
    const third = a.distanceTo(b) / 3;
    out.push({
      p0: a.clone(),
      p1: a.clone().addScaledVector(tHat1, third),
      p2: b.clone().addScaledVector(tHat2, third),
      p3: b.clone(),
    });
    return;
  }

  let params = chordLengthParameterize(points);
  let seg = generateBezier(points, params, tHat1, tHat2);
  let { error, index } = computeMaxError(points, seg, params);

  if (error < errorTolerance) {
    out.push(seg);
    return;
  }

  // Close enough to be worth pulling the samples onto the curve and retrying
  // before giving up and splitting.
  if (error < errorTolerance * 4 || depth < 2) {
    for (let attempt = 0; attempt < 4; attempt++) {
      params = reparameterize(points, seg, params);
      seg = generateBezier(points, params, tHat1, tHat2);
      const next = computeMaxError(points, seg, params);
      error = next.error;
      index = next.index;
      if (error < errorTolerance) {
        out.push(seg);
        return;
      }
    }
  }

  if (depth >= 12 || index <= 0 || index >= points.length - 1) {
    out.push(seg);
    return;
  }

  const centerTangent = points[index - 1].clone().sub(points[index + 1]);
  if (centerTangent.lengthSq() < 1e-14) {
    out.push(seg);
    return;
  }
  centerTangent.normalize();
  fitCubicRecursive(points.slice(0, index + 1), tHat1, centerTangent, errorTolerance, depth + 1, out);
  fitCubicRecursive(
    points.slice(index),
    centerTangent.clone().negate(),
    tHat2,
    errorTolerance,
    depth + 1,
    out
  );
}

/**
 * Moving average over a run, with the window shrinking to nothing at the ends
 * so the first and last positions -- where the pen went down and lifted -- are
 * left exactly where they were.
 *
 * This exists because sample-to-sample noise is what a least-squares fit is
 * worst at: it anchors the curve to two noisy endpoints and takes its direction
 * from two adjacent noisy samples. Averaging first costs nothing and makes
 * everything downstream better behaved.
 */
export function smoothRun(points: THREE.Vector3[], window: number): THREE.Vector3[] {
  const n = points.length;
  if (n < 3 || window < 1) return points.map((p) => p.clone());
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const half = Math.min(window, i, n - 1 - i);
    if (half > 0) {
      const sum = new THREE.Vector3();
      for (let k = i - half; k <= i + half; k++) sum.add(points[k]);
      out.push(sum.divideScalar(half * 2 + 1));
      continue;
    }
    // At the two ends there is nothing on one side, so average what there is.
    // Leaving the end samples untouched pins the fitted curve to two of the
    // noisiest points in the run -- and since the curve must pass through both,
    // that noise survives everything downstream.
    const dir = i === 0 ? 1 : -1;
    const reach = Math.min(window, n - 1);
    const sum = new THREE.Vector3();
    for (let k = 0; k <= reach; k++) sum.add(points[i + dir * k]);
    out.push(sum.divideScalar(reach + 1));
  }
  return out;
}

/**
 * Direction at one end of a run, measured across a window rather than between
 * two neighbouring samples -- two adjacent samples of a shaky line point almost
 * anywhere.
 */
function endTangent(points: THREE.Vector3[], fromStart: boolean): THREE.Vector3 {
  const n = points.length;
  const window = THREE.MathUtils.clamp(Math.floor(n / 4), 1, 8);
  const head = new THREE.Vector3();
  const tail = new THREE.Vector3();
  for (let i = 0; i < window; i++) {
    const a = fromStart ? points[i] : points[n - 1 - i];
    const b = fromStart ? points[window + i] : points[n - 1 - window - i];
    head.add(a);
    tail.add(b);
  }
  return tail.divideScalar(window).sub(head.divideScalar(window));
}

/** Fit a chain of cubic Beziers through the given positions. */
export function fitCubicPath(points: THREE.Vector3[], errorTolerance: number): CubicSegment[] {
  if (points.length < 2) return [];
  let tHat1: THREE.Vector3;
  let tHat2: THREE.Vector3;
  if (points.length >= 8) {
    tHat1 = endTangent(points, true);
    tHat2 = endTangent(points, false);
  } else {
    tHat1 = points[1].clone().sub(points[0]);
    tHat2 = points[points.length - 2].clone().sub(points[points.length - 1]);
  }
  if (tHat1.lengthSq() < 1e-16 || tHat2.lengthSq() < 1e-16) return [];
  const out: CubicSegment[] = [];
  fitCubicRecursive(points, tHat1.normalize(), tHat2.normalize(), errorTolerance, 0, out);
  return out;
}

/** Sample a fitted chain at roughly even spacing. */
export function sampleCubicPath(segments: CubicSegment[], spacing: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  for (const seg of segments) {
    const rough =
      seg.p0.distanceTo(seg.p1) + seg.p1.distanceTo(seg.p2) + seg.p2.distanceTo(seg.p3);
    const steps = THREE.MathUtils.clamp(Math.ceil(rough / Math.max(spacing, 1e-7)), 2, 128);
    for (let i = 0; i < steps; i++) out.push(evaluateCubic(seg, i / steps));
  }
  const last = segments[segments.length - 1];
  if (last) out.push(last.p3.clone());
  return out;
}

// ---------------------------------------------------------------------------
// Attribute transfer
// ---------------------------------------------------------------------------

/**
 * Rebuild whole stroke points on a new set of positions, carrying pressure,
 * normals, UVs and the rest across from the drawn samples by matching how far
 * along the stroke each one sits.
 */
export function rebuildStrokePoints(source: StrokePoint[], positions: THREE.Vector3[]): StrokePoint[] {
  if (positions.length === 0 || source.length === 0) return [];
  const srcAcc = cumulativeLengths(source.map((p) => p.position));
  const srcTotal = srcAcc[srcAcc.length - 1] || 1;
  const dstAcc = cumulativeLengths(positions);
  const dstTotal = dstAcc[dstAcc.length - 1] || 1;

  const out: StrokePoint[] = [];
  let cursor = 0;
  for (let i = 0; i < positions.length; i++) {
    const target = (dstAcc[i] / dstTotal) * srcTotal;
    while (cursor < source.length - 2 && srcAcc[cursor + 1] < target) cursor++;
    const nextIdx = Math.min(source.length - 1, cursor + 1);
    const a = source[cursor];
    const b = source[nextIdx];
    const span = Math.max(1e-9, srcAcc[nextIdx] - srcAcc[cursor]);
    const t = THREE.MathUtils.clamp((target - srcAcc[cursor]) / span, 0, 1);

    const normal = a.normal.clone().lerp(b.normal, t);
    if (normal.lengthSq() < 1e-12) normal.copy(a.normal);
    out.push({
      ...a,
      position: positions[i].clone(),
      normal: normal.normalize(),
      surfaceOffset: a.surfaceOffset * (1 - t) + b.surfaceOffset * t,
      pressure: a.pressure * (1 - t) + b.pressure * t,
      uv: a.uv && b.uv ? a.uv.clone().lerp(b.uv, t) : a.uv?.clone(),
      isSurfaceHit: a.isSurfaceHit,
      time: a.time * (1 - t) + b.time * t,
    });
  }
  return out;
}

export interface RefitOptions {
  /** Decimation distance, as a fraction of the stroke's own path length. */
  simplifyRatio: number;
  /** Turns sharper than this (radians) are kept as corners. */
  cornerAngle: number;
  /** Fitting error budget, as a fraction of the stroke's own path length. */
  errorRatio: number;
  /**
   * Half-width of the moving average, as a fraction of the stroke's own path
   * length. Expressed as a distance rather than a sample count on purpose: a
   * tablet reporting at 240Hz produces four times the samples of one at 60Hz
   * for the same drawn line, and a window counted in samples would mean four
   * times less smoothing on the faster device.
   */
  smoothRatio: number;
}

/**
 * The full refit: decimate, split at genuine corners, fit cubics per run, and
 * resample. Tremor is gone because the fitted curve never had it, and the mark
 * does not lag, because this runs on a path that has already been drawn.
 */
export function refitStrokePoints(source: StrokePoint[], opts: RefitOptions): StrokePoint[] {
  if (source.length < 6) return source;

  const positions = source.map((p) => p.position);
  const acc = cumulativeLengths(positions);
  const pathLength = acc[acc.length - 1];
  if (pathLength < 1e-7) return source;

  // Thresholds are measured against the stroke's own size, capped so that a
  // long stroke still gets long-stroke treatment.
  //
  // Path length alone is the wrong yardstick: tremor adds to it on every
  // sample, so a shaky stroke reports a longer path than a steady one covering
  // the same ground, and every threshold derived from it grows with the noise
  // it is meant to remove. On a 240Hz stylus that was enough to collapse a
  // whole stroke to a straight line.
  const bounds = new THREE.Box3().setFromPoints(positions);
  const size = bounds.getSize(new THREE.Vector3()).length();
  const reference = Math.min(pathLength, Math.max(size * 6, 1e-7));

  // Corners are found on the path as drawn, at a fixed span, so the smoothing
  // level cannot invent them.
  const corners = detectCorners(positions, opts.cornerAngle, 0.035);

  const spacingAvg = pathLength / Math.max(1, positions.length - 1);
  const smoothWindow = THREE.MathUtils.clamp(
    Math.round((opts.smoothRatio * reference) / Math.max(spacingAvg, 1e-9)),
    1,
    40
  );

  // A corner needs enough drawn samples on either side to fit an edge through.
  const minRun = Math.max(6, smoothWindow * 2 + 2);
  const breaks: number[] = [0];
  for (const idx of corners) {
    if (idx - breaks[breaks.length - 1] < minRun) continue;
    if (positions.length - 1 - idx < minRun) continue;
    breaks.push(idx);
  }
  breaks.push(positions.length - 1);

  const errorTolerance = Math.max(1e-7, reference * opts.errorRatio);
  // Output density is capped: a refitted curve needs enough samples to look
  // smooth, not one per input sample. A 240Hz stylus can report thousands for
  // one stroke, and carrying them all forward costs geometry for nothing.
  const targetSamples = THREE.MathUtils.clamp(source.length, 24, 600);
  const spacing = Math.max(1e-7, pathLength / targetSamples);

  const fitted: THREE.Vector3[] = [];
  for (let b = 0; b < breaks.length - 1; b++) {
    const startIdx = breaks[b];
    const endIdx = breaks[b + 1];
    if (endIdx - startIdx < 1) continue;
    const raw = positions.slice(startIdx, endIdx + 1);
    // Average out sample-to-sample noise before fitting. Corners survive it
    // because they are run boundaries, not points inside a run.
    let runPoints = smoothRun(raw, smoothWindow);
    // Only a very long run needs decimating before the fit, to bound the cost.
    if (runPoints.length > 400) {
      const kept = simplifyPath(runPoints, Math.max(1e-7, reference * opts.simplifyRatio));
      if (kept.length >= 4) runPoints = kept.map((i) => runPoints[i]);
    }
    const segments = fitCubicPath(runPoints, errorTolerance);
    const sampled =
      segments.length > 0 ? sampleCubicPath(segments, spacing) : runPoints.map((p) => p.clone());
    if (fitted.length > 0 && sampled.length > 0) sampled.shift();
    for (const p of sampled) fitted.push(p);
  }

  if (fitted.length < 3) return source;
  return rebuildStrokePoints(source, fitted);
}
