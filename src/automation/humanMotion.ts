import { PressureCurve, StrokePointDef } from './types';

/**
 * Natural cubic ease-in-out curve for smooth human pointer travel.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Calculates pressure across stroke progress [0..1] based on human dynamics:
 * Gentle touch-down -> firm body -> soft release taper.
 */
export function calculateDynamicPressure(
  progress: number,
  curve?: PressureCurve | number
): number {
  if (typeof curve === 'number') return curve;
  const start = curve?.start ?? 0.3;
  const middle = curve?.middle ?? 0.75;
  const end = curve?.end ?? 0.25;

  if (progress <= 0.5) {
    const t = progress / 0.5;
    const eased = Math.sin((t * Math.PI) / 2);
    return start + (middle - start) * eased;
  } else {
    const t = (progress - 0.5) / 0.5;
    const eased = Math.sin((t * Math.PI) / 2);
    return middle - (middle - end) * eased;
  }
}

/**
 * Evaluates a Catmull-Rom spline at parameter t [0..1] across control points.
 */
function catmullRomPoint(
  p0: StrokePointDef,
  p1: StrokePointDef,
  p2: StrokePointDef,
  p3: StrokePointDef,
  t: number
): { x: number; y: number } {
  const t2 = t * t;
  const t3 = t2 * t;

  const f0 = -0.5 * t3 + t2 - 0.5 * t;
  const f1 = 1.5 * t3 - 2.5 * t2 + 1.0;
  const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
  const f3 = 0.5 * t3 - 0.5 * t2;

  return {
    x: p0.x * f0 + p1.x * f1 + p2.x * f2 + p3.x * f3,
    y: p0.y * f0 + p1.y * f1 + p2.y * f2 + p3.y * f3,
  };
}

export interface GeneratedSample {
  x: number;
  y: number;
  pressure: number;
  timeMs: number;
}

/**
 * Generates an array of timestamped, pressure-interpolated points simulating human drawing.
 */
export function generateHumanStrokePath(
  controlPoints: StrokePointDef[],
  durationMs: number,
  pressureCurve?: PressureCurve | number,
  microVariation = 0.003
): GeneratedSample[] {
  if (controlPoints.length === 0) return [];
  if (controlPoints.length === 1) {
    return [
      {
        x: controlPoints[0].x,
        y: controlPoints[0].y,
        pressure: calculateDynamicPressure(0.5, pressureCurve),
        timeMs: 0,
      },
    ];
  }

  // Extend endpoints for smooth Catmull-Rom tangents
  const pts: StrokePointDef[] = [
    controlPoints[0],
    ...controlPoints,
    controlPoints[controlPoints.length - 1],
  ];

  const totalSegments = pts.length - 3;
  const frameIntervalMs = 16.67; // ~60 FPS
  const totalFrames = Math.max(10, Math.round(durationMs / frameIntervalMs));
  const samples: GeneratedSample[] = [];

  for (let i = 0; i <= totalFrames; i++) {
    const overallT = i / totalFrames;
    const timeMs = Math.round(overallT * durationMs);

    // Human micro-jitter (sub-pixel organic tremor)
    const jitterPhase = overallT * 28;
    const jitterX = Math.sin(jitterPhase) * microVariation * (0.8 + 0.4 * Math.cos(jitterPhase * 1.7));
    const jitterY = Math.cos(jitterPhase * 1.3) * microVariation * (0.8 + 0.4 * Math.sin(jitterPhase * 2.1));

    // Determine which segment
    const segmentExact = overallT * totalSegments;
    const segIdx = Math.min(Math.floor(segmentExact), totalSegments - 1);
    const segT = segmentExact - segIdx;

    const p0 = pts[segIdx];
    const p1 = pts[segIdx + 1];
    const p2 = pts[segIdx + 2];
    const p3 = pts[segIdx + 3];

    const pt = catmullRomPoint(p0, p1, p2, p3, segT);
    const pressure = calculateDynamicPressure(overallT, pressureCurve);

    samples.push({
      x: Math.max(0, Math.min(1, pt.x + jitterX)),
      y: Math.max(0, Math.min(1, pt.y + jitterY)),
      pressure,
      timeMs,
    });
  }

  return samples;
}
