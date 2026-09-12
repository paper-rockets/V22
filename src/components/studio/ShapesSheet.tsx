import React from 'react';
import { BrushSettings } from '../../types';
import { StudioSheet } from './StudioSheet';
import { haptics } from '../../utils/haptics';
import { Check, Magnet, Ruler, Sparkles, Waves } from 'lucide-react';

/**
 * Drawing aids: Steady Stroke, Predictive Stroke, and the Ruler.
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

const RECOGNISES = ['Lines', 'Circles', 'Ovals', 'Arcs', 'Triangles', 'Rectangles'];

const PREDICTIVE_HINTS: Record<number, string> = {
  1: 'Barely tidies. Keeps almost every wiggle you drew.',
  2: 'Light tidying. Good for detail work.',
  3: 'Smooths the line without changing what you drew.',
  4: 'Smooths, and swaps a stroke for the shape it was meant to be.',
  5: 'Smooths hard, and reads shapes from rough sketches.',
};

const STEADY_PRESETS = [0, 25, 60, 120, 181];

export const ShapesSheet: React.FC<ShapesSheetProps> = ({
  brushSettings,
  setBrushSettings,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const predictiveOn = brushSettings.shapeSnapping ?? false;
  const straightOnly = brushSettings.straightLineMode ?? false;
  const level = Math.round(brushSettings.predictiveLevel ?? 3);
  const steadyLevel = Math.round(brushSettings.steadyStrokeLevel ?? 0);
  const magnetOn = brushSettings.angleSnapping !== false;

  const soft = isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-white/5 border-neutral-800';
  const accent = isLight
    ? 'border-sky-500 bg-sky-50 text-sky-950'
    : 'border-sky-400 bg-sky-400/15 text-sky-50';

  const update = (patch: Partial<BrushSettings>) => {
    haptics.trigger('light');
    setBrushSettings((p) => ({ ...p, ...patch }));
  };

  return (
    <StudioSheet id="shapes" title="Drawing Aids" theme={theme} tall>
      <p className="pb-2 text-[11px] leading-4 opacity-65">
        These steady your hand as you draw. 3D Forms are separate surfaces you can draw on.
      </p>

      {/* ---------------------------------------------------------------- */}
      {/* Steady Stroke                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className={`rounded-2xl border p-3 ${steadyLevel > 0 ? accent : soft}`}>
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 shrink-0" strokeWidth={1.8} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">Steady Stroke</div>
            <div className="text-[10px] leading-4 opacity-65">
              The brush trails behind your pen on a leash, so a shaky hand cannot push the line
              around.
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-bold leading-none tabular-nums">{steadyLevel}</div>
            <div className="text-[9px] uppercase tracking-wide opacity-55">
              {steadyLevel === 0 ? 'off' : 'offset'}
            </div>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={200}
          step={1}
          value={steadyLevel}
          aria-label="Steady Stroke offset"
          onChange={(e) => setBrushSettings((p) => ({ ...p, steadyStrokeLevel: Number(e.target.value) }))}
          onPointerUp={() => haptics.trigger('light')}
          className="mt-3 h-9 w-full accent-sky-500"
        />

        <div className="mt-1 flex items-center justify-between gap-1">
          {STEADY_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={steadyLevel === preset}
              onClick={() => update({ steadyStrokeLevel: preset })}
              className={`min-h-[32px] flex-1 rounded-lg border text-[11px] font-bold tabular-nums transition-colors ${
                steadyLevel === preset
                  ? isLight
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-white bg-white text-neutral-950'
                  : isLight
                  ? 'border-neutral-300 bg-white/60'
                  : 'border-neutral-700 bg-white/5'
              }`}
            >
              {preset === 0 ? 'Off' : preset}
            </button>
          ))}
        </div>
        <div className="mt-1.5 text-[10px] leading-4 opacity-60">
          {steadyLevel === 0
            ? 'Off: the brush sits exactly where your pen is.'
            : steadyLevel < 70
            ? 'Short leash: steadier, and still turns tightly.'
            : 'Long leash: long sweeping curves, hard to turn sharply.'}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Predictive Stroke                                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className={`mt-2 rounded-2xl border p-3 ${predictiveOn && !straightOnly ? accent : soft}`}>
        <button
          type="button"
          aria-pressed={predictiveOn && !straightOnly}
          onClick={() =>
            update({
              shapeSnapping: !(predictiveOn && !straightOnly),
              straightLineMode: false,
            })
          }
          className="flex w-full items-center gap-2 text-left"
        >
          <Sparkles className="h-5 w-5 shrink-0" strokeWidth={1.8} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">Predictive Stroke</div>
            <div className="text-[10px] leading-4 opacity-65">
              Cleans the line up after you lift your pen, so nothing lags while you draw.
            </div>
          </div>
          {predictiveOn && !straightOnly && <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
        </button>

        <div className={predictiveOn && !straightOnly ? 'mt-3' : 'mt-3 opacity-40'}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">Level</span>
            <span className="text-sm font-bold tabular-nums">{level}</span>
          </div>
          <div className="mt-1.5 grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={level === value}
                disabled={!predictiveOn || straightOnly}
                onClick={() => update({ predictiveLevel: value, shapeSnapTolerance: undefined })}
                className={`min-h-[44px] rounded-xl border text-sm font-bold tabular-nums transition-colors ${
                  level === value
                    ? isLight
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-white bg-white text-neutral-950'
                    : isLight
                    ? 'border-neutral-300 bg-white/60'
                    : 'border-neutral-700 bg-white/5'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="mt-1.5 text-[10px] leading-4 opacity-60">{PREDICTIVE_HINTS[level]}</div>

          <button
            type="button"
            role="switch"
            aria-checked={magnetOn}
            disabled={!predictiveOn || straightOnly}
            onClick={() => update({ angleSnapping: !magnetOn })}
            className={`mt-2 flex w-full items-center gap-2 rounded-xl border p-2 text-left transition-colors ${
              magnetOn
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
              <div className="text-xs font-bold">Snap to angles</div>
              <div className="text-[10px] leading-4 opacity-70">
                Straightens a near-level line, and squares up a near-square box. Turn off to keep a
                slight tilt you meant.
              </div>
            </div>
          </button>

          {level < 4 && (
            <div className="mt-2 text-[10px] leading-4 opacity-60">
              Levels 1 to 3 only tidy the line. Choose 4 or 5 to also turn strokes into shapes.
            </div>
          )}
        </div>
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

      <div className="pb-1 pt-3">
        <div className="mb-1.5 text-[11px] font-bold opacity-60">
          Shapes Predictive Stroke can read
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RECOGNISES.map((r) => (
            <span key={r} className={`rounded-lg border px-2.5 py-1 text-[11px] ${soft}`}>
              {r}
            </span>
          ))}
        </div>
      </div>
    </StudioSheet>
  );
};
