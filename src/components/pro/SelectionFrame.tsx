import React, { useEffect, useRef, useState } from 'react';
import type { StudioEngine } from '../../core/studioEngine';
import type { SelectionSummary, TransformTargetScope } from '../../types';
import './selectionFrame.css';

interface SelectionFrameProps {
  engine: StudioEngine | null;
  scope: TransformTargetScope;
  /** Always shown while the Select tool is on. */
  visible: boolean;
  /**
   * Outside the Select tool, flash the outline while the View controls are
   * being dragged (in Move, Rotate or Resize) so it is clear what they move.
   */
  followController?: boolean;
  theme?: 'light' | 'dark';
}

/** How long the outline lingers after the View controls are released. */
const CONTROLLER_LINGER_MS = 900;
/** How long the "drag to move" reminder stays up after the selection changes. Temporary 1.5s HUD toast. */
const HINT_MS = 1500;
/** Keeps the label on screen when the selection runs past the edges. */
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
 * The single on-screen highlight for the current selection: an outline drawn
 * around the selection as it actually sits in 3D, so it lies on a tilted
 * canvas instead of boxing it in, plus a small label naming what is selected.
 * Moving, resizing and turning are direct — drag, pinch or wheel, twist or
 * Shift-drag — so there are no handles to hunt for.
 */
export const SelectionFrame: React.FC<SelectionFrameProps> = ({
  engine,
  scope,
  visible,
  followController = false,
  theme = 'dark',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<SVGPolygonElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [summary, setSummary] = useState<SelectionSummary | null>(null);
  const [isCoarse] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches);
  const [controllerActive, setControllerActive] = useState(false);
  const [showHint, setShowHint] = useState(true);

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

  // The reminder shows when the selection changes, then gets out of the way.
  useEffect(() => {
    if (!shown) return;
    setShowHint(true);
    const timer = window.setTimeout(() => setShowHint(false), HINT_MS);
    return () => window.clearTimeout(timer);
  }, [shown, scope, summary?.label, summary?.detail]);

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
      const shape = shapeRef.current;
      const label = labelRef.current;
      if (!shape || !label) return;
      const selection = engine.getSelectionScreenShape(scope);
      root.hidden = false;
      if (!selection) {
        shape.setAttribute('points', '');
        // "Tap a line" style hints only make sense while the Select tool is on.
        label.hidden = !visible;
        label.dataset.placement = 'top-center';
        label.style.transform = `translate(${Math.round(width / 2)}px, 72px) translateX(-50%)`;
        return;
      }
      label.hidden = false;
      shape.setAttribute('points', selection.points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));

      const left = selection.rect.x;
      const top = selection.rect.y;
      const w = selection.rect.width;
      const h = selection.rect.height;

      // The label prefers the spot under the outline, then its inner edges, and
      // skips any spot that would cover the View controls or the toolbars.
      const place = () => {
        const labelW = label.offsetWidth || 240;
        const labelH = label.offsetHeight || 46;
        const clampX = (x: number) => Math.min(Math.max(EDGE_INSET, x), Math.max(EDGE_INSET, width - labelW - EDGE_INSET));
        const candidates = [
          { placement: 'below', x: clampX(left), y: top + h + 12 },
          { placement: 'below', x: clampX(left + w - labelW), y: top + h + 12 },
          { placement: 'inside', x: clampX(left + 10), y: top + h - labelH - 10 },
          { placement: 'inside', x: clampX(left + 10), y: top + 10 },
        ];
        const fit = candidates.find((c) => {
          const b = { left: c.x, top: c.y, right: c.x + labelW, bottom: c.y + labelH };
          return b.top >= EDGE_INSET && b.bottom <= height - EDGE_INSET && !obstacles.some((o) => overlaps(b, o));
        });
        return { fit, fallback: candidates[top + h + labelH + 20 < height ? 0 : 2] };
      };
      // Full label outside the outline first; if the controls leave no room
      // there, drop the reminder and try again before covering the drawing.
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

    // Picking something new does not move the camera, so listen for it too.
    const forceRemeasure = () => { lastRevision = -1; };
    window.addEventListener('STUDIO_SELECTION_TARGET_CHANGED', forceRemeasure);

    root.hidden = false;
    setSummary(engine.getSelectionSummary(scope));
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('STUDIO_SELECTION_TARGET_CHANGED', forceRemeasure);
    };
  }, [engine, scope, shown, visible]);

  // A scope change must re-measure immediately, even if nothing else moved.
  useEffect(() => {
    if (engine) setSummary(engine.getSelectionSummary(scope));
  }, [engine, scope]);

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
      data-hint={visible && showHint ? 'true' : 'false'}
      hidden
      aria-live="polite"
    >
      <svg className="selection-frame-shape" aria-hidden="true">
        <polygon ref={shapeRef} points="" />
      </svg>
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
