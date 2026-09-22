/**
 * The hand.
 *
 * A contour extracted from a mesh is mathematically perfect, and perfect is the
 * one thing a drawing never looks like. Everything here is about putting the
 * error back: tremor across the intended line, a wrist that drifts, pressure
 * that ramps in and dies out, ends that overshoot, and the odd stroke that just
 * goes wrong.
 */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const smoothstep = (x) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

function tangentAt(points, i) {
  const a = points[Math.max(0, i - 1)];
  const b = points[Math.min(points.length - 1, i + 1)];
  let tx = b.x - a.x, ty = b.y - a.y, tz = b.z - a.z;
  const l = Math.hypot(tx, ty, tz) || 1;
  return [tx / l, ty / l, tz / l];
}

/**
 * Applies hand character to one resampled polyline.
 *
 * `width` is the stroke's drawn width in world units; every wobble is scaled by
 * it so a hairline detail stroke trembles by a hair and a loaded block-in
 * brush wanders by a brush width.
 */
export function humanizeStroke(points, opts) {
  const {
    width,
    random,
    noise,
    wobble = 0.22,        // lateral tremor, in stroke widths
    drift = 0.35,         // slow wander of the wrist, in stroke widths
    lift = 0.12,          // how far the brush floats off the surface
    pressure = [0.55, 1.0],
    taper = [0.12, 0.3],  // fraction of the stroke spent ramping in / out
    overshoot = 0.5,      // extra length past each end, in point spacings
    slip = 0,             // 0..1 chance this stroke goes badly wrong
    endFloor = 0.25,      // width at the very ends, as a fraction of full
    swellAmount = 0.22,   // how much the width breathes along the stroke
  } = opts;

  const n = points.length;
  if (n < 2) return null;

  const isSlip = random() < slip;
  const slipScale = isSlip ? 2.2 + random() * 2.0 : 1;
  const phase = random() * 400;
  const freq = (0.9 + random() * 1.8) * slipScale;
  const driftAmount = (random() * 2 - 1) * drift * slipScale;
  const wobbleAmount = wobble * (0.5 + random()) * slipScale;
  const liftAmount = lift * (0.4 + random());
  const pBase = pressure[0] + random() * (pressure[1] - pressure[0]);
  const taperIn = taper[0] + random() * (taper[1] - taper[0]);
  const taperOut = taper[0] + random() * (taper[1] - taper[0]);
  const swellPhase = random() * 100;

  const out = [];
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const t = n === 1 ? 0 : i / (n - 1);
    const [tx, ty, tz] = tangentAt(points, i);
    // binormal = normal x tangent, i.e. across the stroke but still on the surface
    let bx = p.ny * tz - p.nz * ty;
    let by = p.nz * tx - p.nx * tz;
    let bz = p.nx * ty - p.ny * tx;
    const bl = Math.hypot(bx, by, bz) || 1;
    bx /= bl; by /= bl; bz /= bl;

    // 1 to 3.5 direction changes over a stroke, per the reference breakdown.
    // Six times that reads as fur, not as a hand.
    const tremor = noise(phase + t * freq * 1.5) * wobbleAmount;
    const wander = (t - 0.5) * 2 * driftAmount;
    const lateral = (tremor + wander) * width;
    const normalOffset = noise(phase * 0.7 + t * 2.1 + 51) * liftAmount * width;

    const taperFactor =
      smoothstep(t / Math.max(1e-3, taperIn)) * smoothstep((1 - t) / Math.max(1e-3, taperOut));
    // A fill pass has to keep its full width almost everywhere or the next
    // pass will not meet it; a drawn line is allowed to breathe.
    const swell = 1 + noise(swellPhase + t * 2.7) * swellAmount;
    const envelope = endFloor + (1 - endFloor) * taperFactor;
    const press = clamp(pBase * envelope * swell * (p.coverage ?? 1), 0.12, 1);

    out.push({
      x: p.x + bx * lateral + p.nx * normalOffset,
      y: p.y + by * lateral + p.ny * normalOffset,
      z: p.z + bz * lateral + p.nz * normalOffset,
      nx: p.nx, ny: p.ny, nz: p.nz,
      u: p.u, v: p.v, tri: p.tri,
      pressure: press,
    });
  }

  // Flick past the ends, the way a brush leaves the surface while still
  // moving. Measured in stroke widths, which is how the reference reports it.
  if (overshoot > 0 && out.length >= 2) {
    const spacing = width;
    const addEnd = (fromIdx, toIdx, at) => {
      const a = out[fromIdx], b = out[toIdx];
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      const l = Math.hypot(dx, dy, dz) || 1;
      const amount = spacing * overshoot * (0.4 + random());
      const p = {
        x: b.x + (dx / l) * amount,
        y: b.y + (dy / l) * amount,
        z: b.z + (dz / l) * amount,
        nx: b.nx, ny: b.ny, nz: b.nz, u: b.u, v: b.v, tri: b.tri,
        pressure: clamp(b.pressure * 0.35, 0.1, 1),
      };
      if (at === 'start') out.unshift(p);
      else out.push(p);
    };
    if (random() < 0.75) addEnd(1, 0, 'start');
    if (random() < 0.75) addEnd(out.length - 2, out.length - 1, 'end');
  }

  return { points: out, slipped: isSlip };
}

/**
 * Per-stroke colour wobble. A painter reloads the brush and never mixes the
 * same value twice; a few percent of variation is what keeps a flat colour
 * area from looking like a fill tool.
 */
export function jitterColorOklab(lab, random, amount) {
  return [
    lab[0] + (random() * 2 - 1) * amount * 0.9,
    lab[1] + (random() * 2 - 1) * amount * 0.35,
    lab[2] + (random() * 2 - 1) * amount * 0.35,
  ];
}

export { clamp, smoothstep };
