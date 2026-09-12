/**
 * @license
 * Predictive Stroke: geometric intent recognition.
 *
 * Runs after the hand has finished a stroke (on release, or on a dwell at the
 * end) and asks what the trajectory was trying to be. The stroke is flattened
 * onto its own best-fit plane, then measured against each primitive with the
 * same yardstick -- how far the drawn samples actually sit from the candidate
 * shape, as a fraction of the shape's own size. Because every candidate is
 * scored the same way, they can be compared directly and the best fit wins,
 * instead of the first one tried taking the stroke.
 *
 *  1. Straight lines     max orthogonal deviation from the chord, then optional
 *                        snapping to the nearest cardinal or diagonal on screen
 *  2. Circles, ellipses  direct least-squares conic fit (Halir-Flusser) in the
 *                        stroke's plane
 *  3. Triangles, rects,  corners from angular change, edges by total least
 *     polygons           squares, true vertices from intersecting the edges
 *  4. Arcs               constant-curvature fit for open curved strokes
 */

import * as THREE from 'three';
import { StrokePoint } from '../types';
import { bestFitPlane, StrokePlane } from './strokeFitting';

/**
 * Default eagerness, shared by the engine and the UI so the sheet cannot show
 * one setting while the engine quietly runs another.
 */
export const DEFAULT_SHAPE_SNAP_TOLERANCE = 0.28;

export type DetectedShapeType =
  | 'line'
  | 'circle'
  | 'ellipse'
  | 'arc'
  | 'triangle'
  | 'rectangle'
  | 'polygon'
  | 'none';

export interface ShapeSnapResult {
  detectedShape: DetectedShapeType;
  confidence: number; // 0.0 to 1.0
  snappedPoints: StrokePoint[];
  center?: THREE.Vector3;
  radius?: number;
  length?: number;
  description: string;
}

export interface SnapOptions {
  /**
   * Screen right and up, in world space. When present, a fitted line that lands
   * within a few degrees of horizontal, vertical, or a diagonal is nudged onto
   * it -- the angles a person is actually aiming for.
   */
  screenRight?: THREE.Vector3;
  screenUp?: THREE.Vector3;
  /** Set false to fit only lines and curves, leaving corners and loops alone. */
  recognizePolygons?: boolean;
}

interface Candidate {
  result: ShapeSnapResult;
  /** Root-mean-square distance from the drawn samples, as a fraction of size. */
  normalizedError: number;
  /**
   * How many numbers the shape needs to describe it. A shape with more freedom
   * can always hug the samples a little closer, so without this a wobbly line
   * would come back as a two-segment polygon: it fits better by definition.
   * The winner has to be better by more than the extra freedom buys.
   */
  parameters: number;
}

const NONE_RESULT = (points: StrokePoint[], why: string): ShapeSnapResult => ({
  detectedShape: 'none',
  confidence: 0,
  snappedPoints: points,
  description: why,
});

export class ShapeSnappingEngine {
  /**
   * Evaluate a stroke and return the primitive it was aiming for, or 'none'
   * to leave it as drawn.
   */
  public static snapStroke(
    points: StrokePoint[],
    tolerance: number = DEFAULT_SHAPE_SNAP_TOLERANCE,
    options: SnapOptions = {}
  ): ShapeSnapResult {
    if (!points || points.length < 5) {
      return NONE_RESULT(points, 'Too few points to snap');
    }

    const n = points.length;
    const positions = points.map((p) => p.position);

    const avgNormal = new THREE.Vector3();
    let avgOffset = 0;
    let avgPressure = 0;
    for (const p of points) {
      avgNormal.add(p.normal);
      avgOffset += p.surfaceOffset;
      avgPressure += p.pressure;
    }
    avgNormal.divideScalar(n);
    if (avgNormal.lengthSq() < 1e-10) avgNormal.set(0, 1, 0);
    avgNormal.normalize();
    avgOffset /= n;
    avgPressure /= n;

    const plane = bestFitPlane(positions, avgNormal);
    const flat = positions.map((p) => this.toPlane(plane, p));

    // The stroke's own size, used to judge every error as a fraction of it.
    let scale = 0;
    const centroid = new THREE.Vector2();
    for (const p of flat) centroid.add(p);
    centroid.divideScalar(flat.length);
    for (const p of flat) scale = Math.max(scale, p.distanceTo(centroid));
    if (scale < 1e-7) return NONE_RESULT(points, 'Stroke too small to read');

    let pathLength = 0;
    for (let i = 1; i < n; i++) pathLength += flat[i].distanceTo(flat[i - 1]);
    const chord = flat[0].distanceTo(flat[n - 1]);

    // A larger tolerance is a more eager setting: it accepts a rougher sketch.
    const clampedTolerance = THREE.MathUtils.clamp(tolerance, 0.05, 0.5);
    const toleranceT = (clampedTolerance - 0.05) / 0.45;
    const errorBudget = THREE.MathUtils.lerp(0.02, 0.075, toleranceT);
    const closureLimit = THREE.MathUtils.lerp(0.16, 0.32, toleranceT);
    const isClosedLoop = chord / Math.max(pathLength, 1e-9) < closureLimit && n >= 8;

    // A stroke that does not lie in any plane is a 3D scribble, not a shape.
    if (plane.flatness < 0.72) {
      return NONE_RESULT(points, 'Stroke does not lie in a plane');
    }

    const ctx: FitContext = {
      points,
      straightnessLimit: scale * THREE.MathUtils.lerp(0.04, 0.10, toleranceT),
      flat,
      plane,
      scale,
      centroid,
      pathLength,
      avgNormal,
      avgOffset,
      avgPressure,
      options,
    };

    const candidates: Candidate[] = [];
    const line = this.fitLine(ctx);
    if (line) candidates.push(line);

    if (isClosedLoop) {
      const ellipse = this.fitEllipse(ctx);
      if (ellipse) candidates.push(ellipse);
    }
    if (options.recognizePolygons !== false) {
      const polygon = this.fitPolygon(ctx, isClosedLoop);
      if (polygon) candidates.push(polygon);
    }
    if (!isClosedLoop) {
      const arc = this.fitArc(ctx);
      if (arc) candidates.push(arc);
    }

    if (candidates.length === 0) return NONE_RESULT(points, 'Freeform Stroke');

    // Every candidate was measured the same way, so they can be compared
    // directly -- after charging each one for the freedom it had.
    const score = (c: Candidate) => c.normalizedError + c.parameters * 0.004;
    candidates.sort((a, b) => score(a) - score(b));
    const best = candidates[0];
    if (best.normalizedError > errorBudget) {
      return NONE_RESULT(points, 'Freeform Stroke');
    }
    return best.result;
  }

  // -------------------------------------------------------------------------
  // Primitives
  // -------------------------------------------------------------------------

  /**
   * Straight line. The test is the largest orthogonal distance from the chord
   * joining the ends; a line a person meant to draw straight never strays far
   * from it, however shaky the hand was along the way.
   */
  private static fitLine(ctx: FitContext): Candidate | null {
    const { flat, plane, points, scale, options } = ctx;
    const n = flat.length;
    const start = flat[0];
    const end = flat[n - 1];
    const chord = start.distanceTo(end);
    if (chord < scale * 0.5) return null; // ends too close together to be a line

    let maxDeviation = 0;
    for (const p of flat) {
      maxDeviation = Math.max(maxDeviation, this.pointToSegment2D(p, start, end));
    }
    let sumSq = 0;
    for (const p of flat) {
      const d = this.pointToSegment2D(p, start, end);
      sumSq += d * d;
    }
    // Scored by root-mean-square like every other candidate, so the comparison
    // is fair, but rejected outright if any single excursion is gross.
    const normalizedError = Math.sqrt(sumSq / flat.length) / Math.max(chord, 1e-9);
    if (maxDeviation / Math.max(chord, 1e-9) > 0.16) return null;

    let a = start.clone();
    let b = end.clone();

    // Nudge onto the nearest cardinal or diagonal when it is already close --
    // those are the angles a person aims for, and missing by two degrees reads
    // as a mistake rather than a choice.
    const basis = this.screenBasisInPlane(plane, options);
    if (basis) {
      const dir = b.clone().sub(a);
      const angle = Math.atan2(dir.dot(basis.up), dir.dot(basis.right));
      const step = Math.PI / 4;
      const snappedAngle = Math.round(angle / step) * step;
      const delta = Math.atan2(Math.sin(snappedAngle - angle), Math.cos(snappedAngle - angle));
      if (Math.abs(delta) < THREE.MathUtils.degToRad(7)) {
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const half = dir.length() / 2;
        const snappedDir = basis.right
          .clone()
          .multiplyScalar(Math.cos(snappedAngle))
          .add(basis.up.clone().multiplyScalar(Math.sin(snappedAngle)));
        a = mid.clone().addScaledVector(snappedDir, -half);
        b = mid.clone().addScaledVector(snappedDir, half);
      }
    }

    const count = Math.max(16, Math.min(96, n));
    const snapped: StrokePoint[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      snapped.push(
        this.makePoint(ctx, a.clone().lerp(b, t), t, i === 0 ? 0 : t)
      );
    }

    return {
      normalizedError,
      parameters: 4,
      result: {
        detectedShape: 'line',
        confidence: this.toConfidence(normalizedError),
        snappedPoints: snapped,
        center: this.fromPlane(plane, a.clone().add(b).multiplyScalar(0.5)),
        length: chord,
        description: 'Straight Line',
      },
    };
  }

  /**
   * Circle or ellipse, by direct least-squares conic fitting (Halir-Flusser,
   * the numerically stable form of Fitzgibbon). Unlike fitting a circle and
   * hoping, this returns the ellipse that genuinely minimises the algebraic
   * residual, so an oval drawn at an angle comes back as that oval.
   */
  private static fitEllipse(ctx: FitContext): Candidate | null {
    const { flat, plane, scale, centroid } = ctx;
    const conic = fitConicDirect(flat, centroid, scale);
    if (!conic) return null;
    const ellipse = conicToEllipse(conic);
    if (!ellipse) return null;

    const { center, semiMajor, semiMinor, rotation } = ellipse;
    if (semiMinor < scale * 0.06 || semiMajor > scale * 3) return null;

    // Residual measured as real distance to the curve, not the algebraic value,
    // so it can be compared with the other candidates.
    let sumSq = 0;
    for (const p of flat) {
      sumSq += ellipseDistance(p, center, semiMajor, semiMinor, rotation) ** 2;
    }
    const rms = Math.sqrt(sumSq / flat.length);
    const normalizedError = rms / Math.max(semiMajor, 1e-9);

    const ratio = semiMinor / semiMajor;
    const isCircle = ratio > 0.9;
    const radius = (semiMajor + semiMinor) / 2;

    const steps = 72;
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    const snapped: StrokePoint[] = [];
    // Start the rebuilt loop where the stroke started, so the taper and
    // pressure ramp still land where the pen went down.
    const startAngle = Math.atan2(
      (flat[0].y - center.y) * cosR - (flat[0].x - center.x) * sinR,
      ((flat[0].x - center.x) * cosR + (flat[0].y - center.y) * sinR) * (semiMajor / Math.max(semiMinor, 1e-9))
    );
    const direction = signedArea(flat) >= 0 ? 1 : -1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = startAngle + direction * t * Math.PI * 2;
      const x = semiMajor * Math.cos(a);
      const y = semiMinor * Math.sin(a);
      const p = new THREE.Vector2(center.x + x * cosR - y * sinR, center.y + x * sinR + y * cosR);
      snapped.push(this.makePoint(ctx, p, t, t));
    }

    return {
      normalizedError,
      parameters: isCircle ? 3 : 5,
      result: {
        detectedShape: isCircle ? 'circle' : 'ellipse',
        confidence: this.toConfidence(normalizedError),
        snappedPoints: snapped,
        center: this.fromPlane(plane, center),
        radius,
        description: isCircle ? 'Circle' : 'Ellipse',
      },
    };
  }

  /**
   * Triangles, rectangles and other polygons. Corners come from angular change
   * along the decimated path; each edge is then fitted by total least squares
   * and the true vertices are where consecutive edges cross -- which is where
   * the hand was aiming, not where it happened to round the turn.
   */
  private static fitPolygon(ctx: FitContext, isClosedLoop: boolean): Candidate | null {
    const { flat, plane, scale } = ctx;
    const n = flat.length;
    if (n < 12) return null;

    let cornerIdx = cornersByLocalTurn(flat, THREE.MathUtils.degToRad(52), 0.035);
    if (cornerIdx.length === 0) return null;

    // Wobble in a hand-drawn edge trips the corner detector more than once, so
    // a shaky square arrives claiming eight corners. Fit the edges, measure the
    // turn between the FITTED edges rather than between raw samples, and drop
    // the weakest corner until every remaining one is a real change of
    // direction. This is what separates four corners from four corners plus
    // four wobbles.
    let bounds: number[] = [];
    let edges: Line2D[] = [];
    for (let pass = 0; pass < 8; pass++) {
      bounds = [0, ...cornerIdx, n - 1];
      edges = [];
      let usable = true;
      for (let i = 0; i < bounds.length - 1; i++) {
        const span = flat.slice(bounds[i], bounds[i + 1] + 1);
        // An edge needs enough samples to have a direction worth trusting.
        if (span.length < 5) {
          usable = false;
          break;
        }
        // Drop the samples nearest each corner. Nobody turns a corner
        // instantly, and those rounded samples drag the edge's direction off
        // true -- which then shows up as extra corners that were never drawn.
        const trim = Math.min(Math.floor(span.length * 0.18), Math.floor((span.length - 4) / 2));
        const core = trim > 0 ? span.slice(trim, span.length - trim) : span;
        const line = fitLineTotalLeastSquares(core);
        if (!line) {
          usable = false;
          break;
        }
        // A polygon's edges are straight. If the samples along this one curve
        // away from their own fitted line, the stroke is a curve with bends in
        // it -- an S, say -- and calling it a polygon would wreck it.
        let bow = 0;
        for (const q of core) {
          bow = Math.max(bow, Math.abs(q.clone().sub(line.point).dot(new THREE.Vector2(-line.dir.y, line.dir.x))));
        }
        if (bow > ctx.straightnessLimit) return null;
        edges.push(line);
      }

      if (!usable) {
        if (cornerIdx.length === 0) return null;
        // Drop the corner that produced the too-short edge and try again.
        const shortest = shortestSpanCorner(bounds, cornerIdx);
        cornerIdx = cornerIdx.filter((c) => c !== shortest);
        continue;
      }

      let weakest = -1;
      let weakestTurn = Infinity;
      for (let i = 0; i < cornerIdx.length; i++) {
        const before = edges[i];
        const after = edges[i + 1];
        const turn = Math.acos(
          THREE.MathUtils.clamp(Math.abs(before.dir.dot(after.dir)), -1, 1)
        );
        const bend = Math.PI / 2 - turn; // 0 when perpendicular, PI/2 when parallel
        if (bend > weakestTurn) continue;
        weakestTurn = bend;
        weakest = i;
      }
      // A turn under ~30 degrees is a wobble in one edge, not a corner. Real
      // polygon corners turn much harder than that: 60 degrees for a hexagon,
      // 90 for a rectangle.
      const minTurn = Math.PI / 2 - THREE.MathUtils.degToRad(30);
      if (weakest >= 0 && weakestTurn > minTurn && cornerIdx.length > 0) {
        cornerIdx.splice(weakest, 1);
        continue;
      }
      break;
    }

    // If the refinement ran out of passes mid-rebuild, the edge list does not
    // match the corner list and nothing below it can be trusted.
    if (edges.length !== cornerIdx.length + 1) return null;
    if (edges.length < 2 || cornerIdx.length === 0) return null;

    // An open stroke only becomes a corner shape if it really turns a corner.
    // Otherwise a shaky straight line comes back as a bent one.
    if (!isClosedLoop) {
      let sharpest = 0;
      for (let i = 0; i < cornerIdx.length; i++) {
        const turn = Math.acos(
          THREE.MathUtils.clamp(Math.abs(edges[i].dir.dot(edges[i + 1].dir)), -1, 1)
        );
        sharpest = Math.max(sharpest, Math.PI / 2 - turn);
      }
      if (sharpest > Math.PI / 2 - THREE.MathUtils.degToRad(55)) return null;
    }
    const vertexCount = isClosedLoop ? cornerIdx.length + 1 : cornerIdx.length + 2;
    if (vertexCount < 3 || vertexCount > 8) return null;

    const vertices: THREE.Vector2[] = [];
    if (isClosedLoop) {
      // Closed: every vertex is the crossing of two edges, including the one
      // where the stroke came back round to its own start.
      for (let i = 0; i < edges.length; i++) {
        const prev = edges[(i - 1 + edges.length) % edges.length];
        const cur = edges[i];
        const fallback = flat[bounds[i]];
        vertices.push(intersectLines(prev, cur, fallback, scale));
      }
    } else {
      vertices.push(projectOnLine(edges[0], flat[0]));
      for (let i = 1; i < edges.length; i++) {
        vertices.push(intersectLines(edges[i - 1], edges[i], flat[bounds[i]], scale));
      }
      vertices.push(projectOnLine(edges[edges.length - 1], flat[n - 1]));
    }

    let shaped = vertices;
    let detected: DetectedShapeType = 'polygon';
    if (isClosedLoop && vertices.length === 3) detected = 'triangle';
    else if (isClosedLoop && vertices.length === 4) {
      const squared = squareUpQuad(vertices, this.screenBasisInPlane(plane, ctx.options));
      if (squared) {
        shaped = squared;
        detected = 'rectangle';
      }
    }

    // Error against the shape actually produced, including any squaring-up.
    let sumSq = 0;
    for (const p of flat) {
      let nearest = Infinity;
      const limit = isClosedLoop ? shaped.length : shaped.length - 1;
      for (let i = 0; i < limit; i++) {
        const a = shaped[i];
        const b = shaped[(i + 1) % shaped.length];
        nearest = Math.min(nearest, this.pointToSegment2D(p, a, b));
      }
      sumSq += nearest * nearest;
    }
    const normalizedError = Math.sqrt(sumSq / flat.length) / Math.max(scale, 1e-9);

    const perStep = 12;
    const snapped: StrokePoint[] = [];
    const edgeCount = isClosedLoop ? shaped.length : shaped.length - 1;
    for (let i = 0; i < edgeCount; i++) {
      const a = shaped[i];
      const b = shaped[(i + 1) % shaped.length];
      for (let s = 0; s < perStep; s++) {
        const t = (i + s / perStep) / edgeCount;
        snapped.push(this.makePoint(ctx, a.clone().lerp(b, s / perStep), t, t));
      }
    }
    snapped.push(this.makePoint(ctx, (isClosedLoop ? shaped[0] : shaped[shaped.length - 1]).clone(), 1, 1));

    const center = new THREE.Vector2();
    for (const v of shaped) center.add(v);
    center.divideScalar(shaped.length);

    return {
      normalizedError,
      parameters: detected === 'rectangle' ? 5 : shaped.length * 2,
      result: {
        detectedShape: detected,
        confidence: this.toConfidence(normalizedError),
        snappedPoints: snapped,
        center: this.fromPlane(plane, center),
        description:
          detected === 'triangle'
            ? 'Triangle'
            : detected === 'rectangle'
            ? 'Rectangle'
            : `Polygon (${shaped.length} corners)`,
      },
    };
  }

  /** Constant-curvature arc for an open curved stroke. */
  private static fitArc(ctx: FitContext): Candidate | null {
    const { flat, plane, scale } = ctx;
    const circle = fitCircleAlgebraic(flat);
    if (!circle) return null;
    const { center, radius } = circle;
    if (radius < scale * 0.4 || radius > scale * 40) return null;

    let sumSq = 0;
    for (const p of flat) {
      const d = p.distanceTo(center) - radius;
      sumSq += d * d;
    }
    const normalizedError = Math.sqrt(sumSq / flat.length) / Math.max(radius, 1e-9);

    let startAngle = Math.atan2(flat[0].y - center.y, flat[0].x - center.x);
    let endAngle = Math.atan2(
      flat[flat.length - 1].y - center.y,
      flat[flat.length - 1].x - center.x
    );
    // Follow the way the stroke actually went round.
    let sweep = endAngle - startAngle;
    const midAngle = Math.atan2(
      flat[Math.floor(flat.length / 2)].y - center.y,
      flat[Math.floor(flat.length / 2)].x - center.x
    );
    const normalize = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
    sweep = normalize(sweep);
    const midOnSweep = normalize(midAngle - startAngle);
    if (Math.sign(midOnSweep || 1) !== Math.sign(sweep || 1)) {
      sweep = sweep > 0 ? sweep - Math.PI * 2 : sweep + Math.PI * 2;
    }
    if (Math.abs(sweep) < THREE.MathUtils.degToRad(20)) return null;

    const steps = 64;
    const snapped: StrokePoint[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = startAngle + sweep * t;
      snapped.push(
        this.makePoint(
          ctx,
          new THREE.Vector2(center.x + Math.cos(a) * radius, center.y + Math.sin(a) * radius),
          t,
          t
        )
      );
    }

    return {
      normalizedError,
      parameters: 5,
      result: {
        detectedShape: 'arc',
        confidence: this.toConfidence(normalizedError),
        snappedPoints: snapped,
        center: this.fromPlane(plane, center),
        radius,
        description: 'Arc',
      },
    };
  }

  // -------------------------------------------------------------------------
  // Shared helpers
  // -------------------------------------------------------------------------

  /** Turn a normalized fit error into the 0..1 confidence the rest of the app reads. */
  private static toConfidence(normalizedError: number): number {
    return THREE.MathUtils.clamp(1 - normalizedError * 8, 0, 0.99);
  }

  private static toPlane(plane: StrokePlane, p: THREE.Vector3): THREE.Vector2 {
    const rel = p.clone().sub(plane.origin);
    return new THREE.Vector2(rel.dot(plane.right), rel.dot(plane.up));
  }

  private static fromPlane(plane: StrokePlane, p: THREE.Vector2): THREE.Vector3 {
    return plane.origin.clone().addScaledVector(plane.right, p.x).addScaledVector(plane.up, p.y);
  }

  /** Screen axes flattened into the stroke's plane, if they survive the flattening. */
  private static screenBasisInPlane(
    plane: StrokePlane,
    options: SnapOptions
  ): { right: THREE.Vector2; up: THREE.Vector2 } | null {
    if (!options.screenRight || !options.screenUp) return null;
    const right = new THREE.Vector2(
      options.screenRight.dot(plane.right),
      options.screenRight.dot(plane.up)
    );
    const up = new THREE.Vector2(options.screenUp.dot(plane.right), options.screenUp.dot(plane.up));
    if (right.lengthSq() < 1e-8 || up.lengthSq() < 1e-8) return null;
    return { right: right.normalize(), up: up.normalize() };
  }

  private static pointToSegment2D(p: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2): number {
    const ab = b.clone().sub(a);
    const lenSq = ab.lengthSq();
    if (lenSq < 1e-14) return p.distanceTo(a);
    const t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / lenSq, 0, 1);
    return p.distanceTo(a.clone().addScaledVector(ab, t));
  }

  /**
   * Build a stroke point on the fitted shape, borrowing pressure and normal
   * from the same place along the drawn stroke so the mark keeps its weight.
   */
  private static makePoint(ctx: FitContext, flatPos: THREE.Vector2, t: number, pressureT: number): StrokePoint {
    const { points, plane } = ctx;
    const srcIdx = THREE.MathUtils.clamp(
      Math.round(pressureT * (points.length - 1)),
      0,
      points.length - 1
    );
    const src = points[srcIdx];
    return {
      ...src,
      position: this.fromPlane(plane, flatPos),
      normal: (src.normal.lengthSq() > 1e-10 ? src.normal.clone() : ctx.avgNormal.clone()).normalize(),
      surfaceOffset: ctx.avgOffset,
      pressure: src.pressure,
      uv: src.uv?.clone(),
      isSurfaceHit: points[0].isSurfaceHit,
      time: performance.now() + t,
    };
  }

  /**
   * Scale and rotate an already-snapped shape about its centre. Used while the
   * pen is held still at the end of a stroke and the shape is being adjusted.
   */
  public static transformSnappedPoints(
    basePoints: StrokePoint[],
    center: THREE.Vector3,
    scale: number,
    rotationAngleRad: number,
    normal?: THREE.Vector3
  ): StrokePoint[] {
    const rotNormal = normal ? normal.clone().normalize() : new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromAxisAngle(rotNormal, rotationAngleRad);
    const turning = Math.abs(rotationAngleRad) > 1e-4;
    const safeScale = THREE.MathUtils.clamp(scale, 0.05, 10);

    return basePoints.map((p) => {
      const rel = p.position.clone().sub(center).multiplyScalar(safeScale);
      if (turning) rel.applyQuaternion(quat);
      return {
        ...p,
        position: center.clone().add(rel),
        normal: p.normal
          ? turning
            ? p.normal.clone().applyQuaternion(quat)
            : p.normal.clone()
          : rotNormal.clone(),
      };
    });
  }
}

interface FitContext {
  points: StrokePoint[];
  /** How far a polygon edge's own samples may stray before it is not an edge. */
  straightnessLimit: number;
  flat: THREE.Vector2[];
  plane: StrokePlane;
  scale: number;
  centroid: THREE.Vector2;
  pathLength: number;
  avgNormal: THREE.Vector3;
  avgOffset: number;
  avgPressure: number;
  options: SnapOptions;
}

interface Line2D {
  point: THREE.Vector2;
  dir: THREE.Vector2;
}

/** Total least squares line through a run of points (fits vertical lines too). */
function fitLineTotalLeastSquares(pts: THREE.Vector2[]): Line2D | null {
  if (pts.length < 2) return null;
  const mean = new THREE.Vector2();
  for (const p of pts) mean.add(p);
  mean.divideScalar(pts.length);
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of pts) {
    const dx = p.x - mean.x;
    const dy = p.y - mean.y;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  if (sxx + syy < 1e-16) return null;
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  return { point: mean, dir: new THREE.Vector2(Math.cos(theta), Math.sin(theta)) };
}

/**
 * Corners, told apart from curves by how concentrated the turn is.
 *
 * Total direction change is not enough: the two bends of an S can add up to
 * more than a right angle, which is why an S kept coming back as a polygon.
 * What makes a corner a corner is that the turn happens all at once. So the
 * direction is compared across a short, fixed span of the drawn path -- a
 * corner turns hard within it, a curve barely turns at all.
 */
function cornersByLocalTurn(
  flat: THREE.Vector2[],
  thresholdRad: number,
  spanRatio: number
): number[] {
  const n = flat.length;
  if (n < 8) return [];
  const cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + flat[i].distanceTo(flat[i - 1]));
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
    const inDir = flat[i].clone().sub(flat[back]);
    const outDir = flat[fwd].clone().sub(flat[i]);
    if (inDir.lengthSq() < 1e-14 || outDir.lengthSq() < 1e-14) continue;
    turns[i] = Math.acos(
      THREE.MathUtils.clamp(inDir.normalize().dot(outDir.normalize()), -1, 1)
    );
  }

  // Keep only the sharpest sample in each turn, so one corner is one corner.
  // The window is found by walking two pointers along the path rather than
  // rescanning every sample, which matters on a stylus reporting at 240Hz.
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

/** The corner sitting next to the shortest run of samples. */
function shortestSpanCorner(bounds: number[], cornerIdx: number[]): number {
  let bestCorner = cornerIdx[0];
  let bestLen = Infinity;
  for (let i = 0; i < bounds.length - 1; i++) {
    const len = bounds[i + 1] - bounds[i];
    if (len >= bestLen) continue;
    bestLen = len;
    bestCorner = cornerIdx[Math.min(cornerIdx.length - 1, i)];
  }
  return bestCorner;
}

function projectOnLine(line: Line2D, p: THREE.Vector2): THREE.Vector2 {
  const t = p.clone().sub(line.point).dot(line.dir);
  return line.point.clone().addScaledVector(line.dir, t);
}

/** Where two fitted edges cross. Near-parallel edges fall back to the drawn corner. */
function intersectLines(a: Line2D, b: Line2D, fallback: THREE.Vector2, scale: number): THREE.Vector2 {
  const denom = a.dir.x * b.dir.y - a.dir.y * b.dir.x;
  if (Math.abs(denom) < 0.08) return fallback.clone();
  const dx = b.point.x - a.point.x;
  const dy = b.point.y - a.point.y;
  const t = (dx * b.dir.y - dy * b.dir.x) / denom;
  const hit = a.point.clone().addScaledVector(a.dir, t);
  // A crossing far outside the drawing is a sign the edges were nearly
  // parallel after all.
  if (hit.distanceTo(fallback) > scale * 0.9) return fallback.clone();
  return hit;
}

/**
 * If four corners turn through roughly right angles, rebuild them as a true
 * rectangle: one dominant direction, and the bounding box of the corners in it.
 */
function squareUpQuad(
  vertices: THREE.Vector2[],
  basis: { right: THREE.Vector2; up: THREE.Vector2 } | null
): THREE.Vector2[] | null {
  const dirs: THREE.Vector2[] = [];
  for (let i = 0; i < 4; i++) {
    const d = vertices[(i + 1) % 4].clone().sub(vertices[i]);
    if (d.lengthSq() < 1e-14) return null;
    dirs.push(d.normalize());
  }
  for (let i = 0; i < 4; i++) {
    const dot = Math.abs(dirs[i].dot(dirs[(i + 1) % 4]));
    if (dot > 0.34) return null; // more than ~20 degrees off square
  }

  // Average the four edge directions modulo a quarter turn.
  let sumSin = 0;
  let sumCos = 0;
  for (let i = 0; i < 4; i++) {
    const a = Math.atan2(dirs[i].y, dirs[i].x) * 4;
    sumSin += Math.sin(a);
    sumCos += Math.cos(a);
  }
  let angle = Math.atan2(sumSin, sumCos) / 4;

  // The magnet: a rectangle drawn nearly square to the screen, or nearly on the
  // diagonal, is almost always meant to be exactly that. Left off, a deliberate
  // slight tilt survives.
  if (basis) {
    const screenAngle = Math.atan2(
      Math.sin(angle) * basis.right.y + Math.cos(angle) * basis.right.x,
      Math.sin(angle) * basis.up.y + Math.cos(angle) * basis.up.x
    );
    const step = Math.PI / 4;
    const nearest = Math.round(screenAngle / step) * step;
    const delta = Math.atan2(Math.sin(nearest - screenAngle), Math.cos(nearest - screenAngle));
    if (Math.abs(delta) < THREE.MathUtils.degToRad(8)) angle += delta;
  }

  const ex = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
  const ey = new THREE.Vector2(-Math.sin(angle), Math.cos(angle));

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const v of vertices) {
    const x = v.dot(ex);
    const y = v.dot(ey);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  const corner = (x: number, y: number) =>
    new THREE.Vector2(ex.x * x + ey.x * y, ex.y * x + ey.y * y);
  const rect = [corner(minX, minY), corner(maxX, minY), corner(maxX, maxY), corner(minX, maxY)];

  // Keep the winding and starting corner the stroke had.
  let bestStart = 0;
  let bestDist = Infinity;
  for (let i = 0; i < 4; i++) {
    const d = rect[i].distanceTo(vertices[0]);
    if (d < bestDist) {
      bestDist = d;
      bestStart = i;
    }
  }
  const ordered = [0, 1, 2, 3].map((i) => rect[(bestStart + i) % 4]);
  const drawnCCW = signedArea(vertices) >= 0;
  const rectCCW = signedArea(ordered) >= 0;
  if (drawnCCW !== rectCCW) ordered.reverse();
  return ordered;
}

function signedArea(pts: THREE.Vector2[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

/** Algebraic (Kasa) circle fit, used for arcs. */
function fitCircleAlgebraic(pts: THREE.Vector2[]): { center: THREE.Vector2; radius: number } | null {
  const n = pts.length;
  if (n < 3) return null;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  let sxz = 0;
  let syz = 0;
  let sz = 0;
  for (const p of pts) {
    const z = p.x * p.x + p.y * p.y;
    sx += p.x;
    sy += p.y;
    sxx += p.x * p.x;
    syy += p.y * p.y;
    sxy += p.x * p.y;
    sxz += p.x * z;
    syz += p.y * z;
    sz += z;
  }
  const a = [
    [sxx, sxy, sx],
    [sxy, syy, sy],
    [sx, sy, n],
  ];
  const rhs = [sxz, syz, sz];
  const sol = solve3x3(a, rhs);
  if (!sol) return null;
  const center = new THREE.Vector2(sol[0] / 2, sol[1] / 2);
  const radiusSq = sol[2] + center.x * center.x + center.y * center.y;
  if (radiusSq <= 0) return null;
  return { center, radius: Math.sqrt(radiusSq) };
}

function solve3x3(m: number[][], rhs: number[]): number[] | null {
  const a = m.map((row, i) => [...row, rhs[i]]);
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let r = col + 1; r < 3; r++) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    }
    if (Math.abs(a[pivot][col]) < 1e-14) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = a[r][col] / a[col][col];
      for (let c = col; c < 4; c++) a[r][c] -= f * a[col][c];
    }
  }
  return [a[0][3] / a[0][0], a[1][3] / a[1][1], a[2][3] / a[2][2]];
}

export interface Conic {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/**
 * Direct least-squares ellipse fit (Halir-Flusser). Solves the scatter system
 * under the constraint 4ac - b^2 = 1, which makes the answer an ellipse by
 * construction rather than by luck, and does it without iterating.
 */
export function fitConicDirect(
  pts: THREE.Vector2[],
  centroid: THREE.Vector2,
  scale: number
): Conic | null {
  if (pts.length < 6) return null;
  const inv = 1 / Math.max(scale, 1e-9);

  // Quadratic and linear scatter blocks, on centred and scaled coordinates.
  const s1 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const s2 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const s3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const p of pts) {
    const x = (p.x - centroid.x) * inv;
    const y = (p.y - centroid.y) * inv;
    const d1 = [x * x, x * y, y * y];
    const d2 = [x, y, 1];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        s1[i * 3 + j] += d1[i] * d1[j];
        s2[i * 3 + j] += d1[i] * d2[j];
        s3[i * 3 + j] += d2[i] * d2[j];
      }
    }
  }

  const s3inv = invert3x3(s3);
  if (!s3inv) return null;

  // T = -S3^-1 * S2^T, M = S1 + S2 * T
  const t = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) sum += s3inv[i * 3 + k] * s2[j * 3 + k];
      t[i * 3 + j] = -sum;
    }
  }
  const m = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = s1[i * 3 + j];
      for (let k = 0; k < 3; k++) sum += s2[i * 3 + k] * t[k * 3 + j];
      m[i * 3 + j] = sum;
    }
  }

  // Premultiply by the inverse of the constraint matrix.
  const mp = [
    m[6] / 2, m[7] / 2, m[8] / 2,
    -m[3], -m[4], -m[5],
    m[0] / 2, m[1] / 2, m[2] / 2,
  ];

  const eigenvectors = eigenvectors3(mp);
  let a1: number[] | null = null;
  for (const v of eigenvectors) {
    if (4 * v[0] * v[2] - v[1] * v[1] > 0) {
      a1 = v;
      break;
    }
  }
  if (!a1) return null;

  const a2 = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    a2[i] = t[i * 3] * a1[0] + t[i * 3 + 1] * a1[1] + t[i * 3 + 2] * a1[2];
  }

  // Undo the centring and scaling so the conic lives in plane coordinates.
  const [A, B, C] = a1;
  const [D, E, F] = a2;
  const sx = centroid.x;
  const sy = centroid.y;
  const k = inv;
  return {
    a: A * k * k,
    b: B * k * k,
    c: C * k * k,
    d: k * (D - 2 * A * k * sx - B * k * sy),
    e: k * (E - 2 * C * k * sy - B * k * sx),
    f:
      F -
      k * (D * sx + E * sy) +
      k * k * (A * sx * sx + B * sx * sy + C * sy * sy),
  };
}

function invert3x3(m: number[]): number[] | null {
  const [a, b, c, d, e, f, g, h, i] = m;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-16) return null;
  const invDet = 1 / det;
  return [
    (e * i - f * h) * invDet,
    (c * h - b * i) * invDet,
    (b * f - c * e) * invDet,
    (f * g - d * i) * invDet,
    (a * i - c * g) * invDet,
    (c * d - a * f) * invDet,
    (d * h - e * g) * invDet,
    (b * g - a * h) * invDet,
    (a * e - b * d) * invDet,
  ];
}

/** Real eigenvectors of a general 3x3, via the characteristic cubic. */
function eigenvectors3(m: number[]): number[][] {
  const [a, b, c, d, e, f, g, h, i] = m;
  // det(M - xI) = -x^3 + c2 x^2 + c1 x + c0
  const c2 = a + e + i;
  const c1 = -(a * e + a * i + e * i - b * d - c * g - f * h);
  const c0 = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  const roots = solveCubic(-1, c2, c1, c0);

  const out: number[][] = [];
  for (const lambda of roots) {
    const rows = [
      [a - lambda, b, c],
      [d, e - lambda, f],
      [g, h, i - lambda],
    ];
    // The null vector is perpendicular to two independent rows.
    let best: number[] | null = null;
    let bestLen = 0;
    for (let p = 0; p < 3; p++) {
      for (let q = p + 1; q < 3; q++) {
        const v = cross3(rows[p], rows[q]);
        const len = Math.hypot(v[0], v[1], v[2]);
        if (len > bestLen) {
          bestLen = len;
          best = v;
        }
      }
    }
    if (best && bestLen > 1e-12) {
      out.push(best.map((x) => x / bestLen));
    }
  }
  return out;
}

function cross3(u: number[], v: number[]): number[] {
  return [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
}

/** Real roots of a cubic, by trigonometric solution. */
function solveCubic(a: number, b: number, c: number, d: number): number[] {
  if (Math.abs(a) < 1e-16) return [];
  const p = (3 * a * c - b * b) / (3 * a * a);
  const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
  const shift = -b / (3 * a);
  const roots: number[] = [];

  if (Math.abs(p) < 1e-16) {
    roots.push(Math.cbrt(-q) + shift);
  } else {
    const discriminant = (q * q) / 4 + (p * p * p) / 27;
    if (discriminant > 1e-16) {
      const sq = Math.sqrt(discriminant);
      roots.push(Math.cbrt(-q / 2 + sq) + Math.cbrt(-q / 2 - sq) + shift);
    } else {
      const r = 2 * Math.sqrt(-p / 3);
      const phi = Math.acos(THREE.MathUtils.clamp((3 * q) / (p * r), -1, 1)) / 3;
      for (let k = 0; k < 3; k++) {
        roots.push(r * Math.cos(phi - (2 * Math.PI * k) / 3) + shift);
      }
    }
  }
  return roots;
}

export interface EllipseParams {
  center: THREE.Vector2;
  semiMajor: number;
  semiMinor: number;
  rotation: number;
}

/** Centre, axes and tilt of a conic, or null when it is not an ellipse. */
export function conicToEllipse(conic: Conic): EllipseParams | null {
  const { a, b, c, d, e, f } = conic;
  const denom = b * b - 4 * a * c;
  if (denom >= -1e-18) return null; // not an ellipse

  const cx = (2 * c * d - b * e) / denom;
  const cy = (2 * a * e - b * d) / denom;

  // Move the conic to its own centre, then read the axes off the eigenvectors
  // of the quadratic part. Taking the angle straight from atan2(b, a - c) is
  // ambiguous -- it can name either axis -- which put every tilted ellipse a
  // quarter turn out.
  const f0 = a * cx * cx + b * cx * cy + c * cy * cy + d * cx + e * cy + f;
  const root = Math.sqrt(Math.max(0, (a - c) * (a - c) + b * b));
  const lambdaLow = (a + c - root) / 2;
  const lambdaHigh = (a + c + root) / 2;
  // A longer axis means a smaller eigenvalue, so the low one is the major axis.
  const majorSq = -f0 / lambdaLow;
  const minorSq = -f0 / lambdaHigh;
  if (!(majorSq > 0) || !(minorSq > 0)) return null;

  const semiMajor = Math.sqrt(majorSq);
  const semiMinor = Math.sqrt(minorSq);

  // Eigenvector for the major axis.
  let rotation: number;
  if (Math.abs(b) < 1e-18) {
    rotation = a <= c ? 0 : Math.PI / 2;
  } else {
    rotation = Math.atan2(lambdaLow - a, b / 2);
  }

  return { center: new THREE.Vector2(cx, cy), semiMajor, semiMinor, rotation };
}

/**
 * Distance from a point to an ellipse's outline.
 *
 * Newton's method on the closest-point parameter wanders badly on elongated
 * ellipses -- it was reporting roughly twice the real distance, which made
 * every oval look like a bad fit. This brackets the root instead and bisects,
 * which cannot diverge.
 */
export function ellipseDistance(
  p: THREE.Vector2,
  center: THREE.Vector2,
  semiMajor: number,
  semiMinor: number,
  rotation: number
): number {
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  // Into the ellipse's own frame, then into the first quadrant by symmetry.
  const px = Math.abs(dx * cos - dy * sin);
  const py = Math.abs(dx * sin + dy * cos);
  const a = Math.max(semiMajor, 1e-9);
  const b = Math.max(semiMinor, 1e-9);

  if (px < 1e-12) return Math.abs(py - b);
  if (py < 1e-12) {
    const gap = px - (a * a - b * b) / a;
    if (gap <= 0) {
      const ratio = px / a;
      return b * Math.sqrt(Math.max(0, 1 - ratio * ratio)) - py;
    }
    return Math.abs(px - a);
  }

  // Solve F(t) = (a*px/(t+a^2))^2 + (b*py/(t+b^2))^2 - 1 = 0. F decreases in t,
  // so a sign change brackets the answer.
  const f = (t: number) => {
    const u = (a * px) / (t + a * a);
    const v = (b * py) / (t + b * b);
    return u * u + v * v - 1;
  };
  let lo = -b * b + b * py;
  let hi = -b * b + Math.hypot(a * px, b * py);
  if (f(lo) < 0) {
    // Point is inside: search below the lower bracket instead.
    lo = -b * b + 1e-9 - Math.max(a * a, 1);
    while (f(lo) < 0 && lo > -1e9) lo *= 2;
  }
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  const t = (lo + hi) / 2;
  const ex = (a * a * px) / (t + a * a);
  const ey = (b * b * py) / (t + b * b);
  return Math.hypot(px - ex, py - ey);
}
