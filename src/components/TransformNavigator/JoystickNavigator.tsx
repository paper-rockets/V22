import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import * as THREE from 'three';
import type { StudioEngine } from '../../core/studioEngine';
import { haptics } from '../../utils/haptics';
import { PetalJoystick } from './joystick/PetalJoystick';
import { DiscJoystick } from './joystick/DiscJoystick';
import { CollarJoystick } from './joystick/CollarJoystick';
import type { AxisScreenInfo, JoystickMode } from './joystick/conceptTypes';
import type { Layer, TransformTargetScope } from '../../types';
import { NavigatorSettings, type NavigatorTransformMode } from './NavigatorSettings';
import './joystickNavigator.css';

export type NavigatorLayout = 'sphere' | 'disc' | 'petal' | 'collar';

interface JoystickNavigatorProps {
  engine?: StudioEngine | null;
  theme?: 'light' | 'dark';
  layout: Exclude<NavigatorLayout, 'sphere'>;
  onClose?: () => void;
  targetScope?: TransformTargetScope;
  onSelectTargetScope?: (scope: TransformTargetScope) => void;
  layers?: Layer[];
  activeLayerId?: string | null;
  onSelectLayer?: (id: string) => void;
  navigatorSensitivity?: number;
  onSensitivityChange?: (value: number) => void;
  projectionMode?: 'perspective' | 'orthographic';
  onToggleProjection?: () => void;
  /** Shared with the Select menu's Move / Rotate / Resize buttons. */
  transformMode?: NavigatorTransformMode;
  onTransformModeChange?: (mode: NavigatorTransformMode) => void;
}

const VIEWS = {
  front: [0, Math.PI / 2],
  side: [Math.PI / 2, Math.PI / 2],
  top: [0, 0.035],
  angle: [Math.PI / 4, Math.PI / 3],
} as const;

export const JoystickNavigator: React.FC<JoystickNavigatorProps> = ({
  engine,
  theme = 'dark',
  layout,
  onClose,
  targetScope = 'all', onSelectTargetScope, layers = [], activeLayerId, onSelectLayer,
  navigatorSensitivity = 1, onSensitivityChange, projectionMode = 'perspective', onToggleProjection,
  transformMode: transformModeProp, onTransformModeChange,
}: JoystickNavigatorProps) => {
  const [mode, setMode] = useState<JoystickMode>('3d');
  const [localTransformMode, setLocalTransformMode] = useState<NavigatorTransformMode>('look');
  const transformMode = transformModeProp ?? localTransformMode;
  const setTransformMode = (next: NavigatorTransformMode) => {
    setLocalTransformMode(next);
    onTransformModeChange?.(next);
  };
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const transformGestureRef = useRef(false);
  const axisCarryRef = useRef(0);
  const [menuPosition, setMenuPosition] = useState({ left: 12, top: 56, maxHeight: 480 });
  const [locked, setLocked] = useState(false);
  const [axisInfo, setAxisInfo] = useState<AxisScreenInfo[]>([
    { axis: 'y', dx: 0, dy: -1, angle: -90, usable: 1 },
    { axis: 'x', dx: 0.866, dy: 0.5, angle: 30, usable: 1 },
    { axis: 'z', dx: -0.866, dy: 0.5, angle: 150, usable: 1 },
  ]);

  // Position & Repositioning State
  const [customPos, setCustomPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('paperrocket_nav_custom_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const clampedX = Math.min(Math.max(parsed.x, 10), Math.max(10, window.innerWidth - 150));
        const clampedY = Math.min(Math.max(parsed.y, 55), Math.max(55, window.innerHeight - 170));
          return { x: clampedX, y: clampedY };
        }
      }
    } catch (_) {}
    return null;
  });
  const [isRepositioning, setIsRepositioning] = useState<boolean>(false);
  const [isInUse, setIsInUse] = useState<boolean>(false);

  const wrapRef = useRef<HTMLElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPosRef = useRef<{ x: number; y: number } | null>(customPos);

  useEffect(() => {
    currentPosRef.current = customPos;
  }, [customPos]);

  // Clamp position when window resizes or device orientation changes
  useEffect(() => {
    const handleResize = () => {
      setCustomPos((prev) => {
        if (!prev) return null;
        const width = wrapRef.current?.offsetWidth || 150;
        const height = wrapRef.current?.offsetHeight || 220;
        const minX = 10;
        const maxX = Math.max(minX, window.innerWidth - width - 10);
        const minY = 55;
        const maxY = Math.max(minY, window.innerHeight - height - 10);
        const clampedX = Math.min(Math.max(prev.x, minX), maxX);
        const clampedY = Math.min(Math.max(prev.y, minY), maxY);
        if (clampedX !== prev.x || clampedY !== prev.y) {
          const next = { x: clampedX, y: clampedY };
          try {
            localStorage.setItem('paperrocket_nav_custom_pos', JSON.stringify(next));
          } catch (_) {}
          return next;
        }
        return prev;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global pointer listeners while dragging to reposition
  useEffect(() => {
    if (!isRepositioning) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      const targetX = e.clientX - dragOffsetRef.current.x;
      const targetY = e.clientY - dragOffsetRef.current.y;
      const width = wrapRef.current?.offsetWidth || 150;
      const height = wrapRef.current?.offsetHeight || 220;
      const minX = 10;
      const maxX = Math.max(minX, window.innerWidth - width - 10);
      const minY = 55;
      const maxY = Math.max(minY, window.innerHeight - height - 10);
      const clampedX = Math.min(Math.max(targetX, minX), maxX);
      const clampedY = Math.min(Math.max(targetY, minY), maxY);

      const nextPos = { x: clampedX, y: clampedY };
      currentPosRef.current = nextPos;
      setCustomPos(nextPos);
    };

    const handleWindowPointerUp = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setIsRepositioning(false);
      setIsInUse(false);
      haptics.trigger('light');
      if (currentPosRef.current) {
        try {
          localStorage.setItem('paperrocket_nav_custom_pos', JSON.stringify(currentPosRef.current));
        } catch (_) {}
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp, { capture: true });
    window.addEventListener('pointercancel', handleWindowPointerUp, { capture: true });

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp, { capture: true });
      window.removeEventListener('pointercancel', handleWindowPointerUp, { capture: true });
    };
  }, [isRepositioning]);

  // Global listener to release in-use enlargement when pointer lifts
  useEffect(() => {
    if (!isInUse || isRepositioning) return;

    const handleGlobalPointerUp = () => {
      setIsInUse(false);
    };

    window.addEventListener('pointerup', handleGlobalPointerUp, { capture: true });
    window.addEventListener('pointercancel', handleGlobalPointerUp, { capture: true });

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp, { capture: true });
      window.removeEventListener('pointercancel', handleGlobalPointerUp, { capture: true });
    };
  }, [isInUse, isRepositioning]);

  const handleGripPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // 350ms hold triggers reposition mode with tactile vibration
    longPressTimerRef.current = window.setTimeout(() => {
      setIsRepositioning(true);
      setIsInUse(true);
      haptics.trigger('medium');

      if (wrapRef.current) {
        const rect = wrapRef.current.getBoundingClientRect();
        dragOffsetRef.current = {
          x: pointerStartRef.current.x - rect.left,
          y: pointerStartRef.current.y - rect.top,
        };
        const initial = { x: rect.left, y: rect.top };
        currentPosRef.current = initial;
        setCustomPos(initial);
      }
    }, 350);
  };

  const handleGripPointerMove = (e: React.PointerEvent) => {
    if (!isRepositioning) {
      const dist = Math.hypot(
        e.clientX - pointerStartRef.current.x,
        e.clientY - pointerStartRef.current.y
      );
      if (dist > 8 && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleGripPointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleResetPosition = () => {
    setCustomPos(null);
    currentPosRef.current = null;
    try {
      localStorage.removeItem('paperrocket_nav_custom_pos');
    } catch (_) {}
    haptics.trigger('light');
  };

  const updateAxisScreenInfo = useCallback(() => {
    const cam = engine?.getCamera?.() || (engine as any)?.cameraController?.camera;
    if (!cam) return;
    try {
      cam.updateMatrixWorld();
      const origin = (engine as any)?.cameraTarget?.clone?.() || new THREE.Vector3(0, 0.6, 0);
      const viewDir = cam.getWorldDirection(new THREE.Vector3());
      const axes: Array<'x' | 'y' | 'z'> = ['y', 'x', 'z'];
      const updated = axes.map((axis) => {
        const dir = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0);
        const a = origin.clone().project(cam);
        const b = origin.clone().addScaledVector(dir, 0.5).project(cam);
        let dx = b.x - a.x;
        let dy = -(b.y - a.y);
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        const dot = Math.abs(dir.dot(viewDir));
        const usable = Math.sqrt(Math.max(0, 1 - dot * dot));
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return { axis, dx, dy, angle, usable };
      });
      setAxisInfo(updated);
    } catch {
      // Keep previous
    }
  }, [engine]);

  useEffect(() => {
    updateAxisScreenInfo();
    let animId: number;
    let lastTime = 0;
    const loop = (time: number) => {
      if (time - lastTime > 80) {
        lastTime = time;
        updateAxisScreenInfo();
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [updateAxisScreenInfo]);

  const handleOrbit = useCallback(
    (dx: number, dy: number) => {
      if (!engine) return;
      if (transformMode === 'look') {
        engine.orbitNavigator(dx, dy);
      } else {
        if (!transformGestureRef.current) {
          engine.beginTransform(targetScope);
          transformGestureRef.current = true;
        }
        if (transformMode === 'move') engine.translateScreenSpace(dx, dy, targetScope, locked);
        else if (transformMode === 'scale') engine.scaleAxis('uniform', Math.exp(-dy * 0.006), targetScope, false);
        else engine.rotateTrackball(dx, dy, targetScope);
      }
      updateAxisScreenInfo();
    },
    [engine, updateAxisScreenInfo, transformMode, targetScope, locked]
  );

  const handleZoom = useCallback(
    (dy: number) => {
      if (!engine) return;
      engine.zoom(dy * 1.1);
      updateAxisScreenInfo();
    },
    [engine, updateAxisScreenInfo]
  );

  const handleSelectView = useCallback(
    (view: 'front' | 'side' | 'top' | 'angle') => {
      const [theta, phi] = VIEWS[view];
      engine?.setCameraView(theta, phi, undefined, false);
      haptics.trigger('light');
      setTimeout(updateAxisScreenInfo, 60);
    },
    [engine, updateAxisScreenInfo]
  );

  const handleSelectAxis = useCallback(
    (axis: 'x' | 'y' | 'z') => {
      axisCarryRef.current = 0;
      if (transformMode !== 'look') return;
      haptics.trigger('light');
      if (axis === 'y') handleSelectView('top');
      else if (axis === 'x') handleSelectView('side');
      else if (axis === 'z') handleSelectView('front');
    },
    [handleSelectView, transformMode]
  );

  const handleAxisDrag = useCallback((axis: 'x' | 'y' | 'z', pixels: number) => {
    if (!engine || transformMode === 'look') return;
    if (!transformGestureRef.current) {
      engine.beginTransform(targetScope);
      transformGestureRef.current = true;
    }
    if (transformMode === 'move') {
      const cameraDistance = engine.getCamera().position.distanceTo(engine.getSelectionCenter(targetScope));
      let amount = pixels * Math.max(0.5, cameraDistance) * 0.0022;
      if (locked) {
        axisCarryRef.current += amount;
        amount = Math.trunc(axisCarryRef.current / 0.25) * 0.25;
        axisCarryRef.current -= amount;
      }
      if (amount) engine.translateWorldAxis(axis, amount, targetScope);
    } else if (transformMode === 'scale') {
      engine.scaleAxis(axis, Math.exp(pixels * 0.006), targetScope, false);
    } else {
      let angle = pixels * 0.005;
      if (locked) {
        axisCarryRef.current += angle;
        angle = Math.trunc(axisCarryRef.current / (Math.PI / 12)) * (Math.PI / 12);
        axisCarryRef.current -= angle;
      }
      if (angle) engine.rotateWorldAxis(axis, angle, targetScope);
    }
  }, [engine, transformMode, targetScope, locked]);

  useEffect(() => {
    const finish = () => {
      if (transformGestureRef.current) engine?.endTransform();
      transformGestureRef.current = false;
      axisCarryRef.current = 0;
    };
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => { finish(); window.removeEventListener('pointerup', finish); window.removeEventListener('pointercancel', finish); };
  }, [engine]);

  useEffect(() => { setSettingsOpen(false); }, [layout]);

  useEffect(() => {
    if (!settingsOpen) return;
    const position = () => {
      const viewport = window.visualViewport;
      const left = (viewport?.offsetLeft ?? 0) + 12;
      const top = Math.max(56, (viewport?.offsetTop ?? 0) + 12);
      const right = (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - 12;
      const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 12;
      const anchor = wrapRef.current?.getBoundingClientRect();
      const width = menuRef.current?.offsetWidth ?? 260;
      const height = Math.min(menuRef.current?.scrollHeight ?? 480, bottom - top);
      const x = anchor && anchor.left - width - 8 >= left ? anchor.left - width - 8 : anchor ? anchor.right + 8 : left;
      setMenuPosition({ left: Math.max(left, Math.min(right - width, x)), top: Math.max(top, Math.min(bottom - height, anchor?.top ?? top)), maxHeight: bottom - top });
    };
    const dismiss = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !wrapRef.current?.contains(event.target as Node)) setSettingsOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSettingsOpen(false); };
    position();
    document.addEventListener('pointerdown', dismiss, true);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', position);
    window.visualViewport?.addEventListener('resize', position);
    return () => { document.removeEventListener('pointerdown', dismiss, true); document.removeEventListener('keydown', escape); window.removeEventListener('resize', position); window.visualViewport?.removeEventListener('resize', position); };
  }, [settingsOpen]);

  const commonProps = {
    mode,
    onSetMode: setMode,
    locked,
    onToggleLock: () => {
      setLocked((prev) => !prev);
      haptics.trigger('light');
    },
    axisInfo,
    onOrbit: handleOrbit,
    onZoom: handleZoom,
    onSelectView: (view: 'front' | 'side' | 'top' | 'angle') => {
      if (transformMode === 'look') handleSelectView(view);
    },
    onSelectAxis: handleSelectAxis,
    onAxisDrag: handleAxisDrag,
  };

  return (
    <aside
      ref={wrapRef}
      className={`jn-wrap jn-${theme} ${settingsOpen ? 'jn-menu-open' : ''} ${isInUse ? 'jn-in-use' : ''} ${isRepositioning ? 'jn-repositioning' : ''}`}
      style={
        customPos
          ? {
              left: `${customPos.x}px`,
              top: `${customPos.y}px`,
              right: 'auto',
              bottom: 'auto',
              transformOrigin: 'center center',
            }
          : undefined
      }
      onPointerDownCapture={(e) => {
        const target = e.target as HTMLElement | null;
        if (!target?.closest('.jsk')) return;
        setIsInUse(true);
      }}
      aria-label="Precision Navigation Control"
    >
      <div className="jn-rig">
        <div className="jn-control-rail">
          <button type="button" className="jn-mode-trigger" aria-label="Choose navigator mode and target"
            aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)}>
            {transformMode === 'look' ? 'Orbit' : transformMode === 'move' ? 'Move' : transformMode === 'scale' ? 'Resize' : 'Rotate'}
            <ChevronDown size={11} />
          </button>
          <div className="jn-drag-handle" onPointerDown={handleGripPointerDown}
            onPointerMove={handleGripPointerMove} onPointerUp={handleGripPointerUp}
            onPointerCancel={handleGripPointerUp} onDoubleClick={handleResetPosition}
            title="Hold to reposition; double-click to reset position" aria-label="Reposition navigator">
            <span className="jn-drag-pill" />
          </div>
          <button type="button" className="jn-settings-trigger" aria-label="View controls menu"
            title="Target, layer and navigator settings" aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}><SlidersHorizontal size={13} /></button>
        </div>

        {/* The active Joystick component from Joystick Lab */}
        {layout === 'disc' && <DiscJoystick {...commonProps} />}
        {layout === 'petal' && <PetalJoystick {...commonProps} />}
        {layout === 'collar' && <CollarJoystick {...commonProps} />}
      </div>

      {settingsOpen && createPortal(
        <div ref={menuRef} className="jn-settings-menu navigator-settings-surface" data-theme={theme}
          style={menuPosition} role="dialog" aria-label="View controls">
          <NavigatorSettings theme={theme} targetScope={targetScope}
            onSelectTargetScope={onSelectTargetScope} layers={layers} activeLayerId={activeLayerId}
            onSelectLayer={onSelectLayer} layout={layout}
            sensitivity={navigatorSensitivity} onSensitivityChange={onSensitivityChange}
            projectionMode={projectionMode} onToggleProjection={onToggleProjection}
            modes={['look', 'move', 'rotate', 'scale']}
            transformMode={transformMode} onTransformModeChange={(next) => {
              if (transformGestureRef.current) engine?.endTransform();
              transformGestureRef.current = false;
              setTransformMode(next);
            }} onSelectView={handleSelectView}
            onResetView={() => { engine?.resetCamera(); handleSelectView('angle'); handleResetPosition(); }}
            onHide={onClose} onDismiss={() => setSettingsOpen(false)} />
        </div>, document.body
      )}
    </aside>
  );
};
