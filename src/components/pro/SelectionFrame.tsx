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
/** On-screen controls the label must never sit on top of. */
const OBSTACLE_SELECTOR = [
  '.nv-dock',
  '.nv-control-rail',
  '.jn-wrap',
  '[data-selection-action-bar]',
  '.paperrocket-studio-mode-group',
  '.paperrocket-studio-quick-group',
].join(',');

type ScreenBox = { left: number; top: number; right: number; bottom: number };

const overlaps = (a: ScreenBox, b: ScreenBox) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

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
    let lastObstacleKey = '';
    let obstacleCheckCountdown = 0;
    let obstacles: ScreenBox[] = [];
    const lastCamera = new Float32Array(16);

    // Controls open, close and move without the camera moving, so their
    // positions are re-read a few times a second rather than every frame.
    const readObstacles = (container: HTMLElement) => {
      const origin = container.getBoundingClientRect();
      const boxes: ScreenBox[] = [];
      document.querySelectorAll<HTMLElement>(OBSTACLE_SELECTOR).forEach((element) => {
        const r = element.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        boxes.push({ left: r.left - origin.left, top: r.top - origin.top, right: r.right - origin.left, bottom: r.bottom - origin.top });
      });
      const key = boxes.map((b) => `${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.right)},${Math.round(b.bottom)}`).join('|');
      const changed = key !== lastObstacleKey;
      lastObstacleKey = key;
      obstacles = boxes;
      return changed;
    };

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
      let obstaclesMoved = false;
      if (--obstacleCheckCountdown <= 0) {
        obstacleCheckCountdown = 15;
        obstaclesMoved = readObstacles(container);
      }
      if (!cameraMoved && !obstaclesMoved && revision === lastRevision && width === lastWidth && height === lastHeight) return;
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
      // Leave room above for the turn handle, which sits 60px over the frame,
      // and keep that handle clear of a toolbar pinned to the top of the screen.
      let topLimit = EDGE_INSET + 62;
      for (const o of obstacles) {
        if (o.top < height * 0.25 && o.left < width / 2 && o.right > width / 2) topLimit = Math.max(topLimit, o.bottom + 62);
      }
      const top = Math.max(topLimit, rect.y - FRAME_PAD);
      const right = Math.min(width - EDGE_INSET, rect.x + rect.width + FRAME_PAD);
      const bottom = Math.min(height - EDGE_INSET, rect.y + rect.height + FRAME_PAD);
      const w = Math.max(24, right - left);
      const h = Math.max(24, bottom - top);
      box.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
      box.style.width = `${Math.round(w)}px`;
      box.style.height = `${Math.round(h)}px`;
      // The label prefers the spot under the frame (the turn handle owns the
      // space above), then the frame's inner edges, and skips any spot that
      // would cover the View controls, the toolbars or the tool rail.
      const place = () => {
        const labelW = label.offsetWidth || 240;
        const labelH = label.offsetHeight || 46;
        const clampX = (x: number) => Math.min(Math.max(EDGE_INSET, x), Math.max(EDGE_INSET, width - labelW - EDGE_INSET));
        const candidates = [
          { placement: 'below', x: clampX(left), y: top + h + 14 },
          { placement: 'below', x: clampX(left + w - labelW), y: top + h + 14 },
          { placement: 'inside', x: clampX(left + 10), y: top + h - labelH - 10 },
          { placement: 'inside', x: clampX(left + 10), y: top + 10 },
        ];
        const fit = candidates.find((c) => {
          const b = { left: c.x, top: c.y, right: c.x + labelW, bottom: c.y + labelH };
          return b.top >= EDGE_INSET && b.bottom <= height - EDGE_INSET && !obstacles.some((o) => overlaps(b, o));
        });
        return { fit, fallback: candidates[top + h + labelH + 20 < height ? 0 : 2] };
      };
      // Full label outside the frame first; if the controls leave no room there,
      // drop the gesture hint and try again before covering the drawing.
      label.dataset.compact = 'false';
      const full = place();
      let chosen = full.fit;
      if (!chosen || chosen.placement === 'inside') {
        label.dataset.compact = 'true';
        const compact = place().fit;
        if (compact && (!chosen || compact.placement !== 'inside')) chosen = compact;
        else label.dataset.compact = 'false';
      }
      if (!chosen) chosen = full.fallback;
      label.dataset.placement = chosen.placement;
      label.style.transform = `translate(${Math.round(chosen.x)}px, ${Math.round(chosen.y)}px)`;
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
      ? 'Drag to move · pinch to resize · twist to rotate'
      : 'Drag to move · wheel to resize · Shift-drag to rotate';

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
        <div className="selection-frame-turn" role="slider" aria-label="Rotate selection" {...handleProps('turn')}>
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
