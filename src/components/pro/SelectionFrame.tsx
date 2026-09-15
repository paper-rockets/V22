import React, { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import type { StudioEngine } from '../../core/studioEngine';
import type { SelectionSummary, TransformTargetScope } from '../../types';
import { haptics } from '../../utils/haptics';
import './selectionFrame.css';

interface SelectionFrameProps {
  engine: StudioEngine | null;
  scope: TransformTargetScope;
  /** Always shown while the Select tool is on. */
  visible: boolean;
  /**
   * Outside the Select tool, flash the frame while the View controls are being
   * dragged (in Move, Rotate or Resize) so it is clear what they are moving.
   */
  followController?: boolean;
  theme?: 'light' | 'dark';
}

/** How long the frame lingers after the View controls are released. */
const CONTROLLER_LINGER_MS = 900;

type HandleDrag = {
  pointerId: number;
  kind: 'scale' | 'turn';
  centerX: number;
  centerY: number;
  lastDist: number;
  lastAngle: number;
};

/** Space between the selection bounds and the drawn frame, in CSS pixels. */
const FRAME_PAD = 10;
/** Keeps handles reachable when the selection is larger than the screen. */
const EDGE_INSET = 12;

/**
 * The single on-screen highlight for the current selection: a frame that
 * follows the selection every frame, corner handles that resize it, a round
 * handle that turns it, and a label naming what is selected.
 */
export const SelectionFrame: React.FC<SelectionFrameProps> = ({
  engine,
  scope,
  visible,
  followController = false,
  theme = 'dark',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HandleDrag | null>(null);
  const [summary, setSummary] = useState<SelectionSummary | null>(null);
  const [isCoarse] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches);
  const [controllerActive, setControllerActive] = useState(false);

  useEffect(() => {
    if (!followController) {
      setControllerActive(false);
      return;
    }
    let linger: number | null = null;
    const onNavigatorActive = (e: Event) => {
      const active = Boolean((e as CustomEvent<{ active: boolean }>).detail?.active);
      if (linger !== null) window.clearTimeout(linger);
      if (active) setControllerActive(true);
      else linger = window.setTimeout(() => setControllerActive(false), CONTROLLER_LINGER_MS);
    };
    window.addEventListener('NAVIGATOR_ACTIVE', onNavigatorActive);
    return () => {
      if (linger !== null) window.clearTimeout(linger);
      window.removeEventListener('NAVIGATOR_ACTIVE', onNavigatorActive);
    };
  }, [followController]);

  const shown = visible || (followController && controllerActive);

  // Follow the selection. Measuring is skipped unless the camera, the
  // container size or the selection itself changed since the last frame.
  useEffect(() => {
    const root = rootRef.current;
    if (!engine || !shown || !root) {
      if (root) root.hidden = true;
      return;
    }
    let frame = 0;
    let lastRevision = -1;
    let lastWidth = -1;
    let lastHeight = -1;
    const lastCamera = new Float32Array(16);

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const container = root.parentElement;
      if (!container) return;
      const camera = engine.getCamera();
      const elements = camera.matrixWorld.elements;
      let cameraMoved = false;
      for (let i = 0; i < 16; i++) {
        if (lastCamera[i] !== elements[i]) {
          cameraMoved = true;
          lastCamera[i] = elements[i];
        }
      }
      const revision = engine.getSelectionRevision();
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!cameraMoved && revision === lastRevision && width === lastWidth && height === lastHeight) return;
      if (revision !== lastRevision) setSummary(engine.getSelectionSummary(scope));
      lastRevision = revision;
      lastWidth = width;
      lastHeight = height;
      layout(width, height);
    };

    const layout = (width: number, height: number) => {
      const box = boxRef.current;
      const label = labelRef.current;
      if (!box || !label) return;
      const rect = engine.getSelectionScreenRect(scope);
      root.hidden = false;
      if (!rect) {
        box.hidden = true;
        // "Tap a line" style hints only make sense while the Select tool is on.
        label.hidden = !visible;
        label.dataset.placement = 'top-center';
        label.style.transform = `translate(${Math.round(width / 2)}px, 72px) translateX(-50%)`;
        return;
      }
      box.hidden = false;
      label.hidden = false;
      const left = Math.max(EDGE_INSET, rect.x - FRAME_PAD);
      // Leave room above for the turn handle, which sits 60px over the frame.
      const top = Math.max(EDGE_INSET + 62, rect.y - FRAME_PAD);
      const right = Math.min(width - EDGE_INSET, rect.x + rect.width + FRAME_PAD);
      const bottom = Math.min(height - EDGE_INSET, rect.y + rect.height + FRAME_PAD);
      const w = Math.max(24, right - left);
      const h = Math.max(24, bottom - top);
      box.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
      box.style.width = `${Math.round(w)}px`;
      box.style.height = `${Math.round(h)}px`;
      // The label sits under the frame (the turn handle owns the space above),
      // or inside its bottom edge when the frame reaches the bottom of the screen.
      const below = top + h + 64 < height;
      label.dataset.placement = below ? 'below' : 'inside';
      const labelX = Math.min(Math.max(EDGE_INSET, left), width - 240);
      const labelY = below ? top + h + 14 : top + h - 58;
      label.style.transform = `translate(${Math.round(labelX)}px, ${Math.round(labelY)}px)`;
    };

    root.hidden = false;
    setSummary(engine.getSelectionSummary(scope));
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [engine, scope, shown, visible]);

  // A scope change must re-measure immediately, even if nothing else moved.
  useEffect(() => {
    if (engine) setSummary(engine.getSelectionSummary(scope));
  }, [engine, scope]);

  const beginHandleDrag = (kind: HandleDrag['kind']) => (e: React.PointerEvent<HTMLElement>) => {
    if (!engine || !boxRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const r = boxRef.current.getBoundingClientRect();
    const centerX = r.left + r.width / 2;
    const centerY = r.top + r.height / 2;
    dragRef.current = {
      pointerId: e.pointerId,
      kind,
      centerX,
      centerY,
      lastDist: Math.max(1, Math.hypot(e.clientX - centerX, e.clientY - centerY)),
      lastAngle: Math.atan2(e.clientY - centerY, e.clientX - centerX),
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    engine.beginTransform(scope);
    haptics.trigger('light');
  };

  const moveHandleDrag = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!engine || !drag || drag.pointerId !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    const dx = e.clientX - drag.centerX;
    const dy = e.clientY - drag.centerY;
    if (drag.kind === 'scale') {
      const dist = Math.hypot(dx, dy);
      if (dist < 6) return;
      const factor = Math.max(0.5, Math.min(2, dist / drag.lastDist));
      engine.scaleAxis('uniform', factor, scope, false);
      drag.lastDist = dist;
    } else {
      const angle = Math.atan2(dy, dx);
      let delta = angle - drag.lastAngle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      engine.rotateAroundViewAxis(delta, scope);
      drag.lastAngle = angle;
    }
  };

  const endHandleDrag = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!engine || !drag || drag.pointerId !== e.pointerId) return;
    e.stopPropagation();
    dragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
    engine.endTransform();
  };

  const handleProps = (kind: HandleDrag['kind']) => ({
    onPointerDown: beginHandleDrag(kind),
    onPointerMove: moveHandleDrag,
    onPointerUp: endHandleDrag,
    onPointerCancel: endHandleDrag,
  });

  const hint = summary?.isEmpty
    ? summary.detail
    : isCoarse
      ? 'Drag to move · pinch to resize · twist to turn'
      : 'Drag to move · wheel to resize · Shift-drag to turn';

  return (
    <div
      ref={rootRef}
      className="selection-frame"
      data-theme={theme}
      data-handles={visible ? 'true' : 'false'}
      hidden
      aria-live="polite"
    >
      <div ref={boxRef} className="selection-frame-box">
        {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
          <div
            key={corner}
            className="selection-frame-corner"
            data-corner={corner}
            role="slider"
            aria-label="Resize selection"
            {...handleProps('scale')}
          >
            <span />
          </div>
        ))}
        <div className="selection-frame-turn" role="slider" aria-label="Turn selection" {...handleProps('turn')}>
          <span>
            <RotateCw size={14} strokeWidth={2.4} />
          </span>
        </div>
      </div>
      <div ref={labelRef} className="selection-frame-label" data-empty={summary?.isEmpty ? 'true' : 'false'}>
        {summary && !summary.isEmpty && (
          <strong>
            {summary.label}
            {summary.scope === 'active_layer' || summary.scope === 'all' ? <em> · {summary.detail}</em> : null}
          </strong>
        )}
        <span>{hint}</span>
      </div>
    </div>
  );
};
