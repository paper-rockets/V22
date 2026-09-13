import * as THREE from 'three';
import { SmoothingAlgorithm } from '../types';

/**
 * Live input stabilization, applied to screen coordinates as the pen moves.
 *
 * Three behaviours, and they are not the same idea:
 *
 *  - lazy (the Steady Stroke tether): the brush trails the pen on a fixed
 *    leash. While the pen moves inside the leash radius the brush does not
 *    move at all, so tremor produces no mark whatsoever; when the pen pulls
 *    past the radius the brush follows exactly, with no damping. Long, calm
 *    arcs come out of a shaky hand, which is what a big Level is for.
 *
 *  - streamline / exponential: each new point is damped against the last. These
 *    hide tremor by holding the mark behind the pen, so the wobble is still in
 *    the stroke, just late. Kept for the brush presets that ask for them.
 *
 * Tremor that survives here is dealt with after the stroke by refitting it to
 * curves, which costs nothing in lag. See strokeFitting.ts.
 */
export class StrokeSmoother {
  private lastSmoothed: { x: number; y: number; pressure: number } = { x: 0, y: 0, pressure: 1.0 };
  private hasLastSmoothed = false;
  private lastTimestamp = 0;
  /** Set on release so the brush runs the last of the leash out to the pen. */
  private tetherReleased = false;

  public reset(): void {
    this.hasLastSmoothed = false;
    this.lastTimestamp = 0;
    this.tetherReleased = false;
  }

  /**
   * Let the brush catch up to where the pen actually is. Called when the stroke
   * ends, so a long leash does not simply cut the end of the mark off.
   */
  public releaseTether(): void {
    this.tetherReleased = true;
  }

  public get hasStarted(): boolean {
    return this.hasLastSmoothed;
  }

  /** How far the brush is currently trailing the pen, in screen units. */
  public tetherLag(rawX: number, rawY: number): number {
    if (!this.hasLastSmoothed) return 0;
    return Math.hypot(rawX - this.lastSmoothed.x, rawY - this.lastSmoothed.y);
  }

  /**
   * Process a raw input coordinate into the coordinate the brush should use.
   * `strength` is 0..1; for the tether it scales the leash radius.
   */
  public processPoint(
    rawX: number,
    rawY: number,
    pressure: number,
    algorithm: SmoothingAlgorithm = 'streamline',
    strength: number = 0.55,
    timestamp: number = performance.now(),
    tetherRadius: number = 0
  ): { x: number; y: number; pressure: number } {
    if (algorithm === 'none') {
      this.lastSmoothed.x = rawX;
      this.lastSmoothed.y = rawY;
      this.lastSmoothed.pressure = pressure;
      this.hasLastSmoothed = true;
      this.lastTimestamp = timestamp;
      return { x: rawX, y: rawY, pressure };
    }

    let outX = rawX;
    let outY = rawY;
    let outP = pressure;

    switch (algorithm) {
      case 'lazy': {
        if (!this.hasLastSmoothed) break;
        const radius = Math.max(0, tetherRadius);
        const dx = rawX - this.lastSmoothed.x;
        const dy = rawY - this.lastSmoothed.y;
        const dist = Math.hypot(dx, dy);
        if (this.tetherReleased) {
          // Stroke is over: run the brush out to the pen.
          outX = rawX;
          outY = rawY;
        } else if (dist <= radius || dist < 1e-9) {
          // Inside the leash the brush simply does not move. This is what makes
          // the tether different from damping: tremor produces nothing at all.
          outX = this.lastSmoothed.x;
          outY = this.lastSmoothed.y;
        } else {
          const pull = (dist - radius) / dist;
          outX = this.lastSmoothed.x + dx * pull;
          outY = this.lastSmoothed.y + dy * pull;
        }
        // Pressure should not be held back by the leash or light marks feel
        // disconnected from the pen.
        outP = this.lastSmoothed.pressure + (pressure - this.lastSmoothed.pressure) * 0.5;
        break;
      }

      case 'streamline': {
        // Velocity-adaptive pull-string smoothing. Slow, shaky movements are
        // damped firmly; faster intentional sweeps catch up to the stylus so
        // smoothing does not feel like input lag.
        if (!this.hasLastSmoothed) break;
        const dist = Math.hypot(rawX - this.lastSmoothed.x, rawY - this.lastSmoothed.y);
        const userStrength = THREE.MathUtils.clamp(strength, 0, 1);
        const dt = THREE.MathUtils.clamp(
          timestamp === this.lastTimestamp ? 4 : (timestamp - this.lastTimestamp || 16),
          4,
          32
        );
        const speed = dist / dt;
        const slowLead = THREE.MathUtils.lerp(0.92, 0.24, Math.pow(userStrength, 0.85));
        const speedBoost = THREE.MathUtils.clamp(speed / 0.0025, 0, 1);
        const dynamicLead = THREE.MathUtils.lerp(slowLead, 0.94, speedBoost);

        outX = this.lastSmoothed.x + (rawX - this.lastSmoothed.x) * dynamicLead;
        outY = this.lastSmoothed.y + (rawY - this.lastSmoothed.y) * dynamicLead;
        const pressureLead = Math.min(0.94, dynamicLead + 0.16);
        outP = this.lastSmoothed.pressure + (pressure - this.lastSmoothed.pressure) * pressureLead;
        break;
      }

      case 'exponential': {
        if (!this.hasLastSmoothed) break;
        const dist = Math.hypot(rawX - this.lastSmoothed.x, rawY - this.lastSmoothed.y);
        const dynamicAlpha = THREE.MathUtils.clamp((1.0 - strength * 0.75) + dist * 5.0, 0.1, 0.95);
        outX = this.lastSmoothed.x + (rawX - this.lastSmoothed.x) * dynamicAlpha;
        outY = this.lastSmoothed.y + (rawY - this.lastSmoothed.y) * dynamicAlpha;
        outP = this.lastSmoothed.pressure + (pressure - this.lastSmoothed.pressure) * dynamicAlpha;
        break;
      }

      default:
        break;
    }

    this.lastSmoothed.x = outX;
    this.lastSmoothed.y = outY;
    this.lastSmoothed.pressure = outP;
    this.hasLastSmoothed = true;
    this.lastTimestamp = timestamp;
    return { x: outX, y: outY, pressure: THREE.MathUtils.clamp(outP, 0.05, 1.0) };
  }
}
