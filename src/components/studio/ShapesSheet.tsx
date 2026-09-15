import React from 'react';
import { BrushSettings, SmoothingAlgorithm } from '../../types';
import { StudioSheet } from './StudioSheet';
import { haptics } from '../../utils/haptics';
import { Check, Compass, Magnet, Ruler, Spline, Waves } from 'lucide-react';

/**
 * Stroke assist: steadying, finish-stroke cleanup, and straight lines.
 *
 * The two stroke aids do different jobs and are worth keeping apart:
 *
 *  - Steady Stroke puts the brush on a leash behind the pen. Nothing is
 *    guessed; the offset is simply long enough that a shaky hand cannot push
 *    the mark around. Big offsets draw long calm arcs, short ones turn tightly.
 *
 *  - Predictive Stroke waits until the stroke is finished and then refits it to
 *    clean curves, so tremor never reaches the mark and nothing lags. From
 *    level 4 it also reads the whole stroke's intent and will replace it with
 *    the line, circle, ellipse, triangle or rectangle it was aiming at.
 */

interface ShapesSheetProps {
  brushSettings: BrushSettings;
  setBrushSettings: React.Dispatch<React.SetStateAction<BrushSettings>>;
  theme?: 'light' | 'dark';
}

const STEADY_PRESETS = [
  { value: 0, label: 'Off' },
  { value: 25, label: 'Low' },
  { value: 60, label: 'Medium' },
  { value: 181, label: 'High' },
];

const CLEANUP_PRESETS = [
  { value: 0, label: 'Off' },
  { value: 1, label: 'Low' },
  { value: 3, label: 'Medium' },
  { value: 5, label: 'High' },
];

const LIVE_FEEL_OPTIONS: Array<{ value: SmoothingAlgorithm; label: string }> = [
  { value: 'streamline', label: 'Smooth Glide' },
  { value: 'exponential', label: 'Natural' },
  { value: 'none', label: 'Direct Raw' },
];

export const ShapesSheet: React.FC<ShapesSheetProps> = ({
  brushSettings,
  setBrushSettings,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const predictiveOn = brushSettings.shapeSnapping ?? false;
  const straightOnly = brushSettings.straightLineMode ?? false;
  const level = Math.round(brushSettings.predictiveLevel ?? 3);
  const cleanupStrength = !predictiveOn || straightOnly ? 0 : level <= 1 ? 1 : level <= 3 ? 3 : 5;
  const steadyLevel = Math.round(brushSettings.steadyStrokeLevel ?? 0);
  const shapesOn = brushSettings.shapeRecognition === true;

  const soft = isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-white/5 border-neutral-800';
  const accent = isLight
    ? 'border-sky-500 bg-sky-50 text-sky-950'
    : 'border-sky-400 bg-sky-400/15 text-sky-50';

  const update = (patch: Partial<BrushSettings>) => {
    haptics.trigger('light');
    setBrushSettings((p) => ({ ...p, ...patch }));
  };

  return (
    <StudioSheet id="shapes" title="Stroke Assist" theme={theme} tall compact>
      <p className="pb-2 text-[11px] leading-4 opacity-65">
        One place to steady a stroke, clean it up, or make it straight.
      </p>

      {/* ---------------------------------------------------------------- */}
      {/* Steady Stroke                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className={`rounded-xl border px-3 py-2.5 ${steadyLevel > 0 ? accent : soft}`}>
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 shrink-0" strokeWidth={1.8} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">Steady while drawing</div>
            <div className="text-[10px] leading-4 opacity-65">Stabilizes the brush as you draw.</div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {STEADY_PRESETS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={steadyLevel === value}
              onClick={() => update({ steadyStrokeLevel: value })}
              className={`min-h-[40px] rounded-lg border px-1 text-[10px] font-bold transition-colors ${
                steadyLevel === value
                  ? isLight
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-white bg-white text-neutral-950'
                  : isLight
                  ? 'border-neutral-300 bg-white/60'
                  : 'border-neutral-700 bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Live stroke feel acts while the pen is down, so it belongs beside
          the stabilizer—not in a duplicate Draw inspector. */}
      <div className={`mt-2 rounded-xl border px-3 py-2.5 ${soft}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-bold">Live stroke feel</div>
            <div className="text-[10px] leading-4 opacity-65">Shapes the line while you draw.</div>
          </div>
          <span className="shrink-0 font-mono text-[10px] font-bold opacity-70">
            {Math.round((brushSettings.smoothingStrength ?? 0.55) * 100)}%
          </span>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {LIVE_FEEL_OPTIONS.map(({ value, label }) => {
            const selected = (brushSettings.smoothingAlgorithm ?? 'streamline') === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ smoothingAlgorithm: value })}
                className={`min-h-[40px] rounded-lg border px-1 text-[10px] font-bold transition-colors ${
                  selected
                    ? isLight
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-white bg-white text-neutral-950'
                    : isLight
                    ? 'border-neutral-300 bg-white/60'
                    : 'border-neutral-700 bg-white/5'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <input
          className="mt-2 h-1.5 w-full cursor-pointer rounded accent-sky-500"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={brushSettings.smoothingStrength ?? 0.55}
          onChange={(event) => update({ smoothingStrength: Number(event.target.value) })}
          aria-label="Live stroke feel strength"
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Predictive Stroke                                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className={`mt-2 rounded-xl border px-3 py-2.5 ${predictiveOn && !straightOnly ? accent : soft}`}>
        <div className="flex w-full items-center gap-2 text-left">
          <Spline className="h-5 w-5 shrink-0" strokeWidth={1.8} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">Clean up after drawing</div>
            <div className="text-[10px] leading-4 opacity-65">Smooths the stroke after you lift the pen.</div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {CLEANUP_PRESETS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={cleanupStrength === value}
                onClick={() => update(value === 0
                  ? { shapeSnapping: false }
                  : {
                      shapeSnapping: true,
                      straightLineMode: false,
                      predictiveLevel: value,
                      shapeSnapTolerance: undefined,
                    }
                )}
                className={`min-h-[40px] rounded-lg border px-1 text-[10px] font-bold transition-colors ${
                  cleanupStrength === value
                    ? isLight
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-white bg-white text-neutral-950'
                    : isLight
                    ? 'border-neutral-300 bg-white/60'
                    : 'border-neutral-700 bg-white/5'
                }`}
              >
                {label}
              </button>
          ))}
        </div>

        {cleanupStrength > 0 && (
          <button
            type="button"
            role="switch"
            aria-checked={shapesOn}
            onClick={() => update({ shapeRecognition: !shapesOn })}
            className={`mt-2 flex min-h-[44px] w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
              shapesOn
                ? isLight
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-white bg-white text-neutral-950'
                : isLight
                ? 'border-neutral-300 bg-white/60'
                : 'border-neutral-700 bg-white/5'
            }`}
          >
            <Magnet className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold">Also turn strokes into shapes</div>
              <div className="text-[10px] leading-4 opacity-70">Recognizes lines, circles, and basic shapes.</div>
            </div>
            {shapesOn && <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
          </button>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Ruler                                                             */}
      {/* ---------------------------------------------------------------- */}
      <button
        type="button"
        aria-pressed={straightOnly}
        onClick={() =>
          update({
            straightLineMode: !straightOnly,
            shapeSnapping: straightOnly ? brushSettings.shapeSnapping : false,
          })
        }
        className={`mt-2 flex w-full items-center gap-2 rounded-2xl border p-3 text-left transition-colors ${
          straightOnly ? accent : soft
        }`}
      >
        <Ruler className="h-5 w-5 shrink-0" strokeWidth={1.8} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">Ruler</div>
          <div className="text-[10px] leading-4 opacity-65">
            Every stroke comes out perfectly straight, whatever you draw.
          </div>
        </div>
        {straightOnly && <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
      </button>

      {/* ---------------------------------------------------------------- */}
      {/* Axis & Isometric Snapping                                         */}
      {/* ---------------------------------------------------------------- */}
      <button
        type="button"
        role="switch"
        aria-checked={brushSettings.angleSnapping !== false}
        onClick={() => update({ angleSnapping: brushSettings.angleSnapping === false ? true : false })}
        className={`mt-2 flex w-full items-center gap-2 rounded-2xl border p-3 text-left transition-colors ${
          brushSettings.angleSnapping !== false ? accent : soft
        }`}
      >
        <Compass className="h-5 w-5 shrink-0" strokeWidth={1.8} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">Auto-Align to Axes & Isometric Steps</div>
          <div className="text-[10px] leading-4 opacity-65">
            Straight lines snap cleanly to vertical (90°), horizontal, and 30° isometric angles for buildings, stairs, and walls.
          </div>
        </div>
        {brushSettings.angleSnapping !== false && <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
      </button>

    </StudioSheet>
  );
};
