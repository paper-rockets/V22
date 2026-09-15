import React, { useEffect, useState } from 'react';
import { CircleDot } from 'lucide-react';
import {
  IcPointer as MousePointer2,
  IcLasso as CircleDashed,
  IcReset as RotateCcw,
  IcSnapGround as ArrowDownToLine,
  IcCopy as Copy,
  IcDelete as Trash2,
  IcEye as Eye,
  IcEyeOff as EyeOff,
  IcCompass as Compass,
} from './StudioIcons';
import { StudioEngine } from '../../core/studioEngine';
import { ToolType, BrushSettings, TransformTargetScope, SelectionSummary } from '../../types';
import { haptics } from '../../utils/haptics';

interface SelectPanelProps {
  engine: StudioEngine | null;
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  brushSettings: BrushSettings;
  setBrushSettings: React.Dispatch<React.SetStateAction<BrushSettings>>;
  isGizmoActive: boolean;
  onToggleGizmo: () => void;
  isGizmoLocked: boolean;
  onToggleLock: () => void;
  onOpenNumpad?: any;
  targetScope: TransformTargetScope;
  onSelectTargetScope: (scope: TransformTargetScope) => void;
  onGizmoReset?: () => void;
  theme?: 'light' | 'dark';
  selectionMode?: 'pointer' | 'lasso';
  onSelectSelectionMode?: (mode: 'pointer' | 'lasso') => void;
  transformMode?: 'move' | 'rotate' | 'look' | 'scale';
  onSelectTransformMode?: (mode: 'move' | 'rotate' | 'look' | 'scale') => void;
}

const SCOPES: { id: TransformTargetScope; label: string }[] = [
  { id: 'active_layer', label: 'Current layer' },
  { id: 'selected_strokes', label: 'Lines' },
  { id: 'model', label: '3D models' },
  { id: 'all', label: 'Everything' },
];

const SCOPE_HINTS: Partial<Record<TransformTargetScope, string>> = {
  active_layer: 'Tap a line to pick its whole layer.',
  selected_strokes: 'Tap a line, Shift-tap to add more, or lasso several.',
  model: 'Tap a 3D model to pick it.',
  all: 'Moves the canvas, lines and models together.',
  guide: 'Moves the active 3D guide.',
};

export const SelectPanel: React.FC<SelectPanelProps> = ({
  engine,
  tool,
  setTool,
  isGizmoActive,
  onToggleGizmo,
  targetScope,
  onSelectTargetScope,
  theme = 'dark',
  selectionMode = 'pointer',
  onSelectSelectionMode,
  transformMode = 'move',
  onSelectTransformMode,
}) => {
  const isLight = theme === 'light';
  const isSelecting = tool === 'pointer' || tool === 'select';
  const [summary, setSummary] = useState<SelectionSummary | null>(null);
  const [hasGuide, setHasGuide] = useState(false);

  // Keep the "Selected" line in step with taps, lassos, undo and the controller.
  useEffect(() => {
    if (!engine) return;
    let lastRevision = -1;
    const refresh = () => {
      lastRevision = engine.getSelectionRevision();
      setSummary(engine.getSelectionSummary(targetScope));
      setHasGuide(Boolean(engine.getActiveGuide()));
    };
    refresh();
    const poll = window.setInterval(() => {
      if (engine.getSelectionRevision() !== lastRevision) refresh();
    }, 300);
    window.addEventListener('STUDIO_SELECTION_TARGET_CHANGED', refresh);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('STUDIO_SELECTION_TARGET_CHANGED', refresh);
    };
  }, [engine, targetScope]);

  const pickSelectionMode = (mode: 'pointer' | 'lasso') => {
    haptics.trigger('light');
    onSelectSelectionMode?.(mode);
    setTool('select');
  };

  const pickTransformMode = (mode: 'move' | 'rotate' | 'scale') => {
    haptics.trigger('light');
    onSelectTransformMode?.(mode);
    if (!isSelecting) setTool('select');
  };

  const nothingToActOn = !summary || summary.isEmpty;
  // Duplicate and Delete need one specific thing; "all models" is too broad to delete by accident.
  const canEditContents =
    !nothingToActOn &&
    (targetScope === 'active_layer' ||
      targetScope === 'selected_strokes' ||
      (targetScope === 'model' && Boolean(engine?.getActiveSelectedModelId()) && !engine?.isCanvasSelected()));

  const cardClass = isLight
    ? 'p-2.5 rounded-xl bg-neutral-100/50 border border-black/5 space-y-1.5'
    : 'p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5';

  const subHeadingClass = `text-[10px] font-bold uppercase tracking-wider ${
    isLight ? 'text-neutral-500' : 'text-neutral-400'
  }`;

  const hintClass = `text-[11px] leading-snug ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`;

  const segmentClass = (active: boolean) =>
    `min-h-[44px] px-2 py-1 rounded-lg border flex items-center justify-center gap-1.5 font-semibold text-xs transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 ${
      active
        ? isLight
          ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm'
          : 'bg-white border-white text-neutral-950 shadow-sm'
        : isLight
        ? 'bg-white border-black/10 text-neutral-700 hover:bg-neutral-200/50'
        : 'bg-black/30 border-white/10 text-neutral-300 hover:bg-white/5'
    }`;

  const actionClass = (tone: 'neutral' | 'danger', disabled: boolean) =>
    `min-h-[44px] p-1.5 rounded-lg border flex flex-col items-center justify-center gap-0.5 font-semibold text-[11px] transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-95 disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed ${
      tone === 'danger'
        ? isLight
          ? 'bg-red-50 border-red-200 enabled:hover:bg-red-100 text-red-700'
          : 'bg-red-950/40 border-red-900/60 enabled:hover:bg-red-900/40 text-red-300'
        : isLight
        ? 'bg-white border-black/10 enabled:hover:bg-neutral-200/50 text-neutral-800'
        : 'bg-black/30 border-white/10 enabled:hover:bg-white/10 text-white'
    }`;

  const scopes = hasGuide ? [...SCOPES, { id: 'guide' as const, label: '3D guide' }] : SCOPES;

  return (
    <div className="space-y-2 text-xs select-none">
      {/* What is selected right now: the same words the on-screen label shows. */}
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-2 min-h-[44px] px-3 rounded-xl border ${
          nothingToActOn
            ? isLight
              ? 'bg-white border-black/10 text-neutral-600'
              : 'bg-black/30 border-white/10 text-neutral-400'
            : isLight
            ? 'bg-cyan-50 border-cyan-600/40 text-neutral-900'
            : 'bg-cyan-950/40 border-cyan-400/40 text-neutral-50'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            nothingToActOn ? (isLight ? 'bg-neutral-400' : 'bg-neutral-500') : isLight ? 'bg-cyan-600' : 'bg-cyan-400'
          }`}
        />
        <span className="min-w-0 truncate">
          {summary ? (
            nothingToActOn ? (
              summary.detail
            ) : (
              <>
                <span className="font-semibold">Selected: {summary.label}</span>
                {summary.scope === 'active_layer' || summary.scope === 'all' ? (
                  <span className={isLight ? 'text-cyan-900/80' : 'text-cyan-100/70'}> · {summary.detail}</span>
                ) : null}
              </>
            )
          ) : (
            'Nothing selected'
          )}
        </span>
      </div>

      <div className={cardClass}>
        <div className={subHeadingClass}>How to select</div>
        <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="How to select">
          <button
            type="button"
            aria-pressed={isSelecting && selectionMode === 'pointer'}
            onClick={() => pickSelectionMode('pointer')}
            className={segmentClass(isSelecting && selectionMode === 'pointer')}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
            <span>Tap</span>
          </button>
          <button
            type="button"
            aria-pressed={isSelecting && selectionMode === 'lasso'}
            onClick={() => pickSelectionMode('lasso')}
            className={segmentClass(isSelecting && selectionMode === 'lasso')}
          >
            <CircleDashed className="w-3.5 h-3.5" />
            <span>Lasso</span>
          </button>
        </div>
        <p className={hintClass}>
          {selectionMode === 'lasso'
            ? 'Draw a loop around lines. Drag inside the frame to move them.'
            : 'Tap to pick. Drag something to pick it and move it at once.'}
        </p>
      </div>

      <div className={cardClass}>
        <div className={subHeadingClass}>What to select</div>
        <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="What to select">
          {scopes.map((scope) => (
            <button
              key={scope.id}
              type="button"
              aria-pressed={targetScope === scope.id}
              onClick={() => {
                haptics.trigger('light');
                onSelectTargetScope(scope.id);
                if (!isSelecting) setTool('select');
              }}
              className={segmentClass(targetScope === scope.id)}
            >
              {scope.label}
            </button>
          ))}
        </div>
        <p className={hintClass}>{SCOPE_HINTS[targetScope]}</p>
      </div>

      <div className={cardClass}>
        <div className={subHeadingClass}>Dragging the selection</div>
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="What dragging the selection does">
          {(
            [
              { id: 'move', label: 'Move', Icon: Compass },
              { id: 'rotate', label: 'Rotate', Icon: RotateCcw },
              { id: 'scale', label: 'Resize', Icon: CircleDot },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={transformMode === id}
              onClick={() => pickTransformMode(id)}
              className={segmentClass(transformMode === id)}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <p className={hintClass}>
          {transformMode === 'look'
            ? 'The View controls are set to Orbit. Pick one to start editing.'
            : 'Also: corner handles resize, the round handle rotates. Two fingers pinch and twist.'}
        </p>

        <button
          type="button"
          aria-pressed={isGizmoActive}
          onClick={() => {
            haptics.trigger('light');
            onToggleGizmo();
          }}
          className={`w-full min-h-[44px] px-2.5 py-1 rounded-lg border flex items-center justify-between font-medium text-xs transition-colors ${
            isLight
              ? 'bg-white border-black/10 text-neutral-700 hover:bg-neutral-200/40'
              : 'bg-black/30 border-white/10 text-neutral-300 hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            View controls
          </span>
          <span className="flex items-center gap-1.5 text-[11px]">
            {isGizmoActive ? 'Shown' : 'Hidden'}
            {isGizmoActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-60" />}
          </span>
        </button>
      </div>

      <div className={cardClass}>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            disabled={nothingToActOn}
            onClick={() => {
              haptics.trigger('medium');
              engine?.snapActiveToGround(targetScope);
            }}
            className={actionClass('neutral', nothingToActOn)}
            title="Set the selection down on the ground grid"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>To ground</span>
          </button>
          <button
            type="button"
            disabled={!canEditContents}
            onClick={() => {
              haptics.trigger('medium');
              engine?.cloneSelection(targetScope);
            }}
            className={actionClass('neutral', !canEditContents)}
            title="Duplicate the selection"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            disabled={!canEditContents}
            onClick={() => {
              haptics.trigger('medium');
              engine?.deleteSelection(targetScope);
            }}
            className={actionClass('danger', !canEditContents)}
            title="Delete the selection (Undo brings it back)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
