import React from 'react';
import { X } from 'lucide-react';
import type { Layer, TransformTargetScope } from '../../types';
import type { NavigatorLayout } from './JoystickNavigator';
import { haptics } from '../../utils/haptics';
import './navigatorControls.css';

export type NavigatorTransformMode = 'look' | 'move' | 'rotate' | 'scale';

const MODE_LABELS: Record<NavigatorTransformMode, string> = { look: 'Orbit', move: 'Move', rotate: 'Rotate', scale: 'Resize' };

export interface NavigatorSettingsProps {
  theme?: 'light' | 'dark';
  targetScope?: TransformTargetScope;
  onSelectTargetScope?: (scope: TransformTargetScope) => void;
  layers?: Layer[];
  activeLayerId?: string | null;
  onSelectLayer?: (id: string) => void;
  layout: NavigatorLayout;
  onLayoutChange?: (layout: NavigatorLayout) => void;
  sensitivity?: number;
  onSensitivityChange?: (value: number) => void;
  projectionMode?: 'perspective' | 'orthographic';
  onToggleProjection?: () => void;
  transformMode: NavigatorTransformMode;
  onTransformModeChange: (mode: NavigatorTransformMode) => void;
  /** Modes this navigator supports; Resize is only offered where it is wired. */
  modes?: NavigatorTransformMode[];
  onSelectView?: (view: 'front' | 'side' | 'top' | 'angle') => void;
  onResetView?: () => void;
  onHide?: () => void;
  onDismiss: () => void;
}

/** One set of settings for every navigator concept. The artwork stays in its
 * own component; target, layer, camera and testing controls share this menu. */
export function NavigatorSettings({
  theme = 'dark', targetScope = 'all', onSelectTargetScope,
  layers = [], activeLayerId, onSelectLayer, layout, onLayoutChange,
  sensitivity = 1, onSensitivityChange, projectionMode = 'perspective',
  onToggleProjection, transformMode, onTransformModeChange, modes = ['look', 'move', 'rotate'],
  onSelectView, onResetView, onHide, onDismiss,
}: NavigatorSettingsProps) {
  const tap = (action: () => void) => { haptics.trigger('light'); action(); };
  return (
    <div className="navigator-settings" data-theme={theme}>
      <header className="navigator-settings-header">
        <h2>View controls</h2>
        <button type="button" className="navigator-menu-close" onClick={onDismiss} aria-label="Close view controls menu"><X size={14} /></button>
      </header>

      <fieldset className="navigator-field">
        <legend>Mode</legend>
        <div className="navigator-segments" role="group" aria-label="Navigator mode">
          {modes.map((value) => <button key={value} type="button" aria-pressed={transformMode === value} onClick={() => tap(() => onTransformModeChange(value))}>{MODE_LABELS[value]}</button>)}
        </div>
      </fieldset>

      {onSelectTargetScope && <fieldset className="navigator-field">
        <legend>What to select</legend>
        {/* Same choices, in the same words, as the Select panel. */}
        <div className="navigator-target-grid" role="group" aria-label="What to select">
          {([
            ['active_layer', 'Current layer'], ['selected_strokes', 'Lines'],
            ['model', '3D models'], ['all', 'Everything'],
          ] as const).map(([scope, label]) => <button key={scope} type="button" aria-pressed={targetScope === scope} onClick={() => tap(() => onSelectTargetScope(scope))}>{label}</button>)}
        </div>
      </fieldset>}

      {onSelectLayer && layers.length > 0 && <label className="navigator-field">
        <span>Active layer</span>
        <select aria-label="Layer to move and rotate" value={activeLayerId ?? layers[0].id} onChange={(event) => tap(() => { onSelectLayer(event.target.value); onSelectTargetScope?.('active_layer'); })}>
          {layers.map((layer) => <option key={layer.id} value={layer.id}>{layer.name || 'Untitled layer'}{layer.locked ? ' (locked)' : ''}</option>)}
        </select>
      </label>}

      {onLayoutChange && <fieldset className="navigator-field">
        <legend>Navigator style</legend>
        <div className="navigator-segments" role="group" aria-label="Gizmo version">
          {(['sphere', 'disc', 'petal', 'collar'] as const).map((value) => <button key={value} type="button" aria-pressed={layout === value} onClick={() => tap(() => onLayoutChange(value))}>{value[0].toUpperCase() + value.slice(1)}</button>)}
        </div>
      </fieldset>}

      {onSensitivityChange && <fieldset className="navigator-field">
        <legend>Sensitivity <output>{Number(sensitivity.toFixed(2))}×</output></legend>
        <div className="navigator-segments" role="group" aria-label="Navigator sensitivity">
          {[0.5, 1, 1.5, 2].map((value) => <button key={value} type="button" aria-pressed={Math.abs(sensitivity - value) < 0.025} onClick={() => tap(() => onSensitivityChange(value))}>{value}×</button>)}
        </div>
        <input aria-label="Navigator sensitivity slider" type="range" min="0.2" max="2.5" step="0.05" value={sensitivity} onChange={(event) => onSensitivityChange(Number(event.target.value))} />
      </fieldset>}

      {onToggleProjection && <fieldset className="navigator-field">
        <legend>Camera projection</legend>
        <div className="navigator-segments" role="group" aria-label="Camera projection">
          {(['perspective', 'orthographic'] as const).map((value) => <button key={value} type="button" aria-pressed={projectionMode === value} onClick={() => tap(() => { if (projectionMode !== value) onToggleProjection(); })}>{value === 'perspective' ? 'Perspective' : 'Orthographic'}</button>)}
        </div>
      </fieldset>}

      {onSelectView && <fieldset className="navigator-field">
        <legend>Camera view</legend>
        <div className="navigator-segments" role="group" aria-label="Camera view presets">
          {(['front', 'side', 'top', 'angle'] as const).map((view) => <button key={view} type="button" onClick={() => tap(() => onSelectView(view))}>{view[0].toUpperCase() + view.slice(1)}</button>)}
        </div>
      </fieldset>}
      {(onResetView || onHide) && <div className="navigator-menu-actions">
        {onResetView && <button type="button" onClick={() => tap(onResetView)}>Reset view</button>}
        {onHide && <button type="button" onClick={() => tap(onHide)}>Hide navigator</button>}
      </div>}
    </div>
  );
}
