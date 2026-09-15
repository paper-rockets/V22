import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { StudioEngine } from '../../core/studioEngine';
import { TransformTargetScope } from '../../types';
import { haptics } from '../../utils/haptics';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { NavigatorSettings } from './NavigatorSettings';
import './navigatorStyles.css';

export interface Option3SphereNavigatorProps {
  engine?: StudioEngine | null;
  theme?: 'light' | 'dark';
  targetScope?: TransformTargetScope;
  onSelectTargetScope?: (scope: TransformTargetScope) => void;
  isLocked?: boolean;
  onLockChange?: (locked: boolean) => void;
  onClose?: () => void;
  uiScale?: number;
  layers?: any[];
  activeLayerId?: string | null;
  onSelectLayer?: (id: string) => void;
  models?: any[];
  activeModelId?: string | null;
  onSelectModel?: (id: string) => void;
  navigatorLayout?: 'sphere' | 'disc' | 'petal' | 'collar';
  onNavigatorLayoutChange?: (layout: 'sphere' | 'disc' | 'petal' | 'collar') => void;
  navigatorSensitivity?: number;
  onSensitivityChange?: (sens: number) => void;
  projectionMode?: 'perspective' | 'orthographic';
  onToggleProjection?: () => void;
  transformMode?: 'move' | 'rotate' | 'look' | 'scale';
  onTransformModeChange?: (mode: 'move' | 'rotate' | 'look' | 'scale') => void;
}

interface TargetItem {
  id: string;
  name: string;
  note?: string;
  /** The shared selection scope this entry stands for. */
  scope: TransformTargetScope;
  object: THREE.Object3D;
  home?: { p: THREE.Vector3; q: THREE.Quaternion };
}

interface AxisDef {
  dir: [number, number, number];
  lbl: string;
  back: string;
  tone: string;
}

const PRO_AXES: AxisDef[] = [
  { dir: [0, 1, 0], lbl: 'Y', back: '−Y', tone: '#5d9e35' },
  { dir: [1, 0, 0], lbl: 'X', back: '−X', tone: '#c84356' },
  { dir: [0, 0, 1], lbl: 'Z', back: '−Z', tone: '#3775cc' }
];

const ROT_STEPS = [
  { v: 0, lbl: 'Free' },
  { v: 5, lbl: '5°' },
  { v: 15, lbl: '15°' },
  { v: 45, lbl: '45°' }
];
const MOVE_STEPS = [
  { v: 0, lbl: 'Free' },
  { v: 0.25, lbl: '0.25' },
  { v: 0.5, lbl: '0.5' },
  { v: 1, lbl: '1' }
];

type NavMode = 'move' | 'rotate' | 'look' | 'scale';

const MODE_LABELS: Record<NavMode, string> = { look: 'Orbit', move: 'Move', rotate: 'Rotate', scale: 'Resize' };

const DEG = Math.PI / 180;
const CROP = 0.055;
const MIN_RAD = 0.55;
const STORE = 'nv.layout.v1';

export const Option3SphereNavigator: React.FC<Option3SphereNavigatorProps> = ({
  engine,
  theme = 'dark',
  targetScope = 'all',
  onSelectTargetScope,
  layers = [],
  activeLayerId,
  onSelectLayer,
  models = [],
  activeModelId,
  onSelectModel,
  navigatorLayout = 'sphere',
  onNavigatorLayoutChange,
  onClose,
  navigatorSensitivity = 1.0,
  onSensitivityChange,
  projectionMode = 'perspective',
  onToggleProjection,
  transformMode,
  onTransformModeChange,
}: Option3SphereNavigatorProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isListOpen, setIsListOpen] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [targetsList, setTargetsList] = useState<TargetItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [mode, setModeState] = useState<NavMode>('look');
  const [rotStep, setRotStep] = useState<number>(15);
  const [moveStep, setMoveStep] = useState<number>(0.5);
  const [historyLen, setHistoryLen] = useState<number>(0);
  const [isTourRunning, setIsTourRunning] = useState<boolean>(false);

  const nvRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const tabRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const numRef = useRef<HTMLDivElement | null>(null);

  const axesRef = useRef<AxisDef[]>(PRO_AXES.map(a => ({ ...a })));

  // Mutable math state (exact mirror of Build 9 reference script)
  const gzRef = useRef({
    size: 210,
    mode: 'look' as NavMode,
    rotStep: 15,
    moveStep: 0.5,
    active: null as any,
    hover: null as any,
    ring: null as any,
  });

  const objRef = useRef({ pos: new THREE.Vector3(), quat: new THREE.Quaternion() });
  const dispRef = useRef({ pos: new THREE.Vector3(), quat: new THREE.Quaternion() });
  const committedPoseRef = useRef({ pos: new THREE.Vector3(), quat: new THREE.Quaternion() });
  const scopeRef = useRef(targetScope);
  scopeRef.current = targetScope;
  const targetObjRef = useRef<THREE.Object3D | null>(null);
  const targetsRef = useRef<TargetItem[]>([]);
  const currentRef = useRef<number>(0);
  const anchorRef = useRef({ ax: 1, ay: 1 });

  const camRef = useRef({
    radius: engine?.cameraSpherical?.radius ?? 7.85,
    theta: engine?.cameraSpherical?.theta ?? 0.78,
    phi: engine?.cameraSpherical?.phi ?? 1.05,
    target: engine?.cameraTarget ? engine.cameraTarget.clone() : new THREE.Vector3(0, 1.1, 0)
  });

  /** Engine selection revision after this navigator's own last change; anything else means re-sync. */
  const ownRevisionRef = useRef(-1);
  const historyRef = useRef<Array<{ o: THREE.Object3D; p: THREE.Vector3; q: THREE.Quaternion }>>([]);
  const flightRef = useRef<{
    p0: number;
    t0: number;
    r0: number;
    target0: THREE.Vector3;
    p1: number;
    t1: number;
    r1: number;
    target1: THREE.Vector3;
    hasRadiusChange: boolean;
    hasTargetChange: boolean;
    start: number;
    ms: number;
  } | null>(null);
  const tourRef = useRef<any>(null);
  const themeRef = useRef<any>({
    up: '#e0822a',
    side: '#2f80c4',
    front: '#3f9a62',
    ghost: 'rgba(51,46,40,.26)',
    hub: 'rgba(255,255,255,.96)',
    ink: '#332e28',
    shadow: 'rgba(51,46,40,.20)',
    onColor: '#ffffff',
    line: 'rgba(51,46,40,.13)'
  });
  const lastStepRef = useRef<any>(null);
  const dragRef = useRef<any>(null);
  const hintTimerRef = useRef<any>(null);
  const reduceMotionRef = useRef<boolean>(false);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Theme checking
  const isDark = useCallback(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    const root = document.documentElement;
    const forced = root.dataset.nvTheme;
    if (forced === 'dark') return true;
    if (forced === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, [theme]);

  const readTheme = useCallback(() => {
    const nvEl = nvRef.current || document.getElementById('nv');
    if (!nvEl) return;
    const cs = getComputedStyle(nvEl);
    const v = (n: string) => cs.getPropertyValue(n).trim();
    const dark = isDark();

    themeRef.current = {
      up: v('--nv-y') || (dark ? '#84c94f' : '#5d9e35'),
      side: v('--nv-x') || (dark ? '#e8697c' : '#c84356'),
      front: v('--nv-z') || (dark ? '#5e9ff0' : '#3775cc'),
      accent: v('--nv-accent') || (dark ? '#5e9ff0' : '#3775cc'),
      ghost: v('--nv-ghost') || (dark ? 'rgba(242,237,230,.32)' : 'rgba(51,46,40,.26)'),
      hub: v('--nv-hub') || (dark ? 'rgba(46,44,41,.96)' : 'rgba(255,255,255,.96)'),
      ink: v('--nv-ink') || (dark ? '#f2ede6' : '#332e28'),
      shadow: dark ? 'rgba(0,0,0,0.55)' : 'rgba(51,46,40,0.28)',
      onColor: v('--nv-btn-on') || (dark ? 'rgba(255,255,255,.16)' : '#ffffff'),
      line: v('--nv-line') || (dark ? 'rgba(255,255,255,.14)' : 'rgba(51,46,40,.13)')
    };

    if (axesRef.current && axesRef.current.length >= 3) {
      axesRef.current[0].tone = themeRef.current.up;
      axesRef.current[1].tone = themeRef.current.side;
      axesRef.current[2].tone = themeRef.current.front;
    }
  }, [isDark]);

  // Safe area metrics: unconstrained full-screen movement
  const cssPx = (n: string, fallback: number = 0) => {
    if (typeof document === 'undefined') return fallback;
    const raw = getComputedStyle(document.documentElement).getPropertyValue(n);
    if (!raw) return fallback;
    const val = parseFloat(raw.trim());
    return isNaN(val) ? fallback : val;
  };

  const setNavActive = useCallback((active: boolean) => {
    if (typeof window !== 'undefined') {
      (window as any).__NAVIGATOR_ACTIVE__ = active;
      window.dispatchEvent(new CustomEvent('NAVIGATOR_ACTIVE', { detail: { active } }));
    }
    const nv = nvRef.current;
    if (nv) {
      if (active) {
        nv.classList.add('nv-interacting');
      } else {
        nv.classList.remove('nv-interacting');
      }
    }
  }, []);

  const safeBox = useCallback(() => {
    const viewport = window.visualViewport;
    return {
      left: (viewport?.offsetLeft ?? 0) + 12,
      top: Math.max(56, (viewport?.offsetTop ?? 0) + 12),
      right: (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - 12,
      bottom: (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 12,
    };
  }, []);

  const positionMenu = useCallback(() => {
    const nv = nvRef.current;
    const dock = dockRef.current;
    const menu = menuRef.current;
    if (!nv || !dock || !menu) return;
    if (nv.dataset.menu !== 'open') return;

    const s = safeBox();
    menu.style.maxHeight = Math.max(100, s.bottom - s.top) + 'px';
    const r = dock.getBoundingClientRect();
    const w = menu.offsetWidth || 260;
    const h = menu.offsetHeight || 380;
    const gap = 8;

    const cy = Math.max(s.top, Math.min(s.bottom - h, r.top + r.height / 2 - h / 2));
    const cx = Math.max(s.left, Math.min(s.right - w, r.left + r.width / 2 - w / 2));
    const right = { x: r.right + gap, y: cy, axis: 'x' };
    const left = { x: r.left - w - gap, y: cy, axis: 'x' };
    const below = { x: cx, y: r.bottom + gap, axis: 'y' };
    const above = { x: cx, y: r.top - h - gap, axis: 'y' };

    const order: any[] = [];
    order.push((r.left + r.width / 2) > window.innerWidth / 2 ? left : right);
    order.push(order[0] === left ? right : left);
    order.push((r.top + r.height / 2) > window.innerHeight / 2 ? above : below);
    order.push(order[2] === above ? below : above);

    const fits = (p: any) => p.axis === 'x'
      ? (p.x >= s.left && p.x + w <= s.right && h <= s.bottom - s.top)
      : (p.y >= s.top && p.y + h <= s.bottom && w <= s.right - s.left);

    const pick = order.find(fits) || order[0];
    const x = Math.max(s.left, Math.min(s.right - w, pick.x));
    const y = Math.max(s.top, Math.min(s.bottom - h, pick.y));
    menu.style.left = Math.round(x) + 'px';
    menu.style.top = Math.round(y) + 'px';

    nv.classList.toggle('nv-covered',
      !(x + w < r.left || x > r.right || y + h < r.top || y > r.bottom));
  }, [safeBox]);

  const saveLayout = useCallback(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        ax: +anchorRef.current.ax.toFixed(4),
        ay: +anchorRef.current.ay.toFixed(4),
        rotStep: gzRef.current.rotStep,
        moveStep: gzRef.current.moveStep
      }));
    } catch (_) {}
  }, []);

  const place = useCallback((x: number, y: number, remember = false) => {
    const dock = dockRef.current;
    if (!dock) return;
    const dw = dock.offsetWidth || 160;
    const dh = (dock.offsetHeight && dock.offsetHeight > 100) ? dock.offsetHeight : (gzRef.current.size || 160);
    const rightMargin = 28;
    const bottomClearance = 12;
    const topClearance = 52;
    const minLeft = 16;
    const maxLeft = Math.max(minLeft, window.innerWidth - dw - rightMargin);
    const minTop = topClearance;
    const maxTop = Math.max(minTop, window.innerHeight - dh - bottomClearance);
    const left = Math.max(minLeft, Math.min(maxLeft, x));
    const top = Math.max(minTop, Math.min(maxTop, y));
    dock.style.left = Math.round(left) + 'px';
    dock.style.top = Math.round(top) + 'px';
    if (remember) {
      const denomW = Math.max(1, maxLeft - minLeft);
      const denomH = Math.max(1, maxTop - minTop);
      anchorRef.current = {
        ax: Math.max(0, Math.min(1, (left - minLeft) / denomW)),
        ay: Math.max(0, Math.min(1, (top - minTop) / denomH)),
      };
      saveLayout();
    }
    positionMenu();
  }, [positionMenu, saveLayout]);

  const placeFromAnchor = useCallback(() => {
    const dock = dockRef.current;
    const dw = dock ? dock.offsetWidth : 160;
    const dh = (dock && dock.offsetHeight > 100) ? dock.offsetHeight : (gzRef.current.size || 160);
    const rightMargin = 28;
    const bottomClearance = 12;
    const topClearance = 52;
    const minLeft = 16;
    const maxLeft = Math.max(minLeft, window.innerWidth - dw - rightMargin);
    const minTop = topClearance;
    const maxTop = Math.max(minTop, window.innerHeight - dh - bottomClearance);
    place(minLeft + anchorRef.current.ax * (maxLeft - minLeft), minTop + anchorRef.current.ay * (maxTop - minTop));
  }, [place]);

  const setMenu = useCallback((open: boolean) => {
    setIsMenuOpen(open);
    const nv = nvRef.current;
    const tab = tabRef.current;
    if (nv) nv.dataset.menu = open ? 'open' : 'closed';
    if (tab) tab.setAttribute('aria-expanded', String(open));
    if (open) {
      requestAnimationFrame(positionMenu);
    } else {
      nv?.classList.remove('nv-covered');
      setIsListOpen(false);
    }
  }, [positionMenu]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const frame = requestAnimationFrame(positionMenu);
    window.addEventListener('resize', positionMenu);
    window.visualViewport?.addEventListener('resize', positionMenu);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', positionMenu);
      window.visualViewport?.removeEventListener('resize', positionMenu);
    };
  }, [isMenuOpen, showAdvanced, isListOpen, positionMenu]);

  // The selection highlight is the shared on-screen SelectionFrame, drawn by the
  // viewport; the navigator only asks for a redraw after it changes the scene.
  const markSelection = useCallback(() => {
    engine?.markDirty();
  }, [engine]);

  // Target sync: the gizmo pivots on the center of exactly what the shared
  // selection would move, so it always agrees with the frame and the Select panel.
  const syncFromTarget = useCallback(() => {
    const targetObj = targetObjRef.current;
    if (engine) {
      objRef.current.pos.copy(engine.getSelectionCenter(scopeRef.current));
      if (scopeRef.current === 'model' && targetObj) {
        targetObj.updateWorldMatrix(true, false);
        targetObj.getWorldQuaternion(objRef.current.quat);
      } else {
        objRef.current.quat.identity();
      }
      ownRevisionRef.current = engine.getSelectionRevision();
    } else if (targetObj) {
      targetObj.updateWorldMatrix(true, false);
      targetObj.getWorldPosition(objRef.current.pos);
      targetObj.getWorldQuaternion(objRef.current.quat);
    } else {
      return;
    }
    dispRef.current.pos.copy(objRef.current.pos);
    dispRef.current.quat.copy(objRef.current.quat);
    committedPoseRef.current.pos.copy(objRef.current.pos);
    committedPoseRef.current.quat.copy(objRef.current.quat);
  }, [engine]);

  useEffect(() => { syncFromTarget(); }, [targetScope, activeLayerId, activeModelId, syncFromTarget]);

  // Sync external transformMode from SelectPanel
  useEffect(() => {
    if (!transformMode) return;
    if (transformMode !== gzRef.current.mode) {
      setMode(transformMode);
    }
  }, [transformMode]);



  const commit = useCallback(() => {
    const targetObj = targetObjRef.current;
    if (!targetObj) return;
    if (engine) {
      const previous = committedPoseRef.current;
      if (previous.pos.distanceToSquared(dispRef.current.pos) < 1e-14 &&
          1 - Math.abs(previous.quat.dot(dispRef.current.quat)) < 1e-14) return;
      const deltaRotation = dispRef.current.quat.clone().multiply(previous.quat.clone().invert());
      const matrix = new THREE.Matrix4()
        .compose(dispRef.current.pos, deltaRotation, new THREE.Vector3(1, 1, 1))
        .multiply(new THREE.Matrix4().makeTranslation(-previous.pos.x, -previous.pos.y, -previous.pos.z));
      // Use the engine's scope-aware path so layer gestures touch only that
      // layer's meshes and keep stroke descriptors/export coordinates in sync.
      engine.applyTransformMatrix(matrix, scopeRef.current);
      ownRevisionRef.current = engine.getSelectionRevision();
      previous.pos.copy(dispRef.current.pos);
      previous.quat.copy(dispRef.current.quat);
      markSelection();
      return;
    }
    const p = targetObj.parent;
    if (p) {
      p.updateWorldMatrix(true, false);
      targetObj.position.copy(p.worldToLocal(dispRef.current.pos.clone()));
      targetObj.quaternion.copy(
        p.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(dispRef.current.quat)
      );
    } else {
      targetObj.position.copy(dispRef.current.pos);
      targetObj.quaternion.copy(dispRef.current.quat);
    }
    targetObj.updateMatrixWorld(true);
    markSelection();
    engine?.markDirty();
  }, [markSelection, engine]);

  const jumpDisplay = useCallback(() => {
    dispRef.current.pos.copy(objRef.current.pos);
    dispRef.current.quat.copy(objRef.current.quat);
    commit();
  }, [commit]);

  const easeDisplay = useCallback((dt: number) => {
    const gz = gzRef.current;
    if (reduceMotionRef.current || !(gz.rotStep || gz.moveStep)) {
      jumpDisplay();
      return false;
    }
    const near = dispRef.current.pos.distanceToSquared(objRef.current.pos) < 1e-7 &&
                 1 - Math.abs(dispRef.current.quat.dot(objRef.current.quat)) < 1e-8;
    if (near) {
      if (!dispRef.current.pos.equals(objRef.current.pos) || !dispRef.current.quat.equals(objRef.current.quat)) {
        jumpDisplay();
        return true;
      }
      return false;
    }
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 20);
    dispRef.current.pos.lerp(objRef.current.pos, k);
    dispRef.current.quat.slerp(objRef.current.quat, k);
    commit();
    return true;
  }, [jumpDisplay, commit]);

  // Build 9 Metrics
  const metrics = (S: number) => ({
    S,
    c: S / 2,
    arm: S * 0.235,
    hand: S * 0.102,
    hub: S * 0.072
  });

  const fitGizmo = (size: number) => {
    const gzc = canvasRef.current;
    const dock = dockRef.current;
    if (!gzc) return;
    const gctx = gzc.getContext('2d');
    if (!gctx) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const h = Math.round(size * (1 - CROP * 2));
    gzc.style.width = size + 'px';
    gzc.style.height = h + 'px';
    gzc.width = Math.round(size * dpr);
    gzc.height = Math.round(h * dpr);
    gctx.setTransform(dpr, 0, 0, dpr, 0, -size * CROP * dpr);
    gzc.style.clipPath = 'circle(' + Math.round(size * 0.47) + 'px at 50% 50%)';
    (gzc.style as any).webkitClipPath = gzc.style.clipPath;
    if (dock) {
      dock.style.width = size + 'px';
      dock.style.height = h + 'px';
    }
  };

  const axisDir = (a: AxisDef) => {
    const v = new THREE.Vector3(a.dir[0], a.dir[1], a.dir[2]);
    if (gzRef.current.mode !== 'look') v.applyQuaternion(dispRef.current.quat);
    return v.normalize();
  };

  const project = useCallback((v: THREE.Vector3, m: ReturnType<typeof metrics>) => {
    const cam = camRef.current;
    const sp = Math.sin(cam.phi), cp = Math.cos(cam.phi);
    const st = Math.sin(cam.theta), ct = Math.cos(cam.theta);
    const sx = v.x * ct + v.z * -st;
    const sy = v.x * (-cp * st) + v.y * sp + v.z * (-cp * ct);
    const depth = v.x * (sp * st) + v.y * cp + v.z * (sp * ct);
    const len = Math.hypot(sx, sy);
    const draw = Math.max(len, MIN_RAD);
    const k = len < 1e-6 ? 0 : draw / len;
    const rad = m.arm * draw;
    return { x: m.c + sx * m.arm * k, y: m.c - sy * m.arm * k, depth, len, rad };
  }, []);

  const handles = useCallback((m: ReturnType<typeof metrics>) => {
    const out: any[] = [];
    const axes = axesRef.current || PRO_AXES;
    axes.forEach((a, i) => {
      const d = axisDir(a);
      out.push({ a, i, sign: 1, dir: d, p: project(d, m) });
      const n = d.clone().negate();
      out.push({ a, i, sign: -1, dir: n, p: project(n, m) });
    });
    return out;
  }, [project]);

  const labelFont = (ctx: CanvasRenderingContext2D, text: string, r: number) => {
    let size = r * 0.66;
    const fam = getComputedStyle(document.body).fontFamily || 'sans-serif';
    for (let i = 0; i < 6; i++) {
      ctx.font = '600 ' + size.toFixed(1) + 'px ' + fam;
      if (ctx.measureText(text).width <= r * 1.62) break;
      size *= 0.9;
    }
  };

  const hubIcon = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
    const T = themeRef.current;
    ctx.save();
    ctx.strokeStyle = T.ink; ctx.fillStyle = T.ink; ctx.lineWidth = 1.5;
    if (gzRef.current.mode === 'move') {
      for (let k = 0; k < 4; k++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(k * Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.86, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(r * 0.6, -r * 0.32); ctx.lineTo(r * 0.6, r * 0.32);
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
    } else if (gzRef.current.mode === 'rotate') {
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, -2.5, 1.7); ctx.stroke();
      const ax = cx + Math.cos(1.7) * r * 0.82, ay = cy + Math.sin(1.7) * r * 0.82;
      ctx.beginPath();
      ctx.moveTo(ax + 3.6, ay - 0.4); ctx.lineTo(ax - 1.5, ay + 3.6); ctx.lineTo(ax - 2.8, ay - 2.6);
      ctx.closePath(); ctx.fill();
    } else if (gzRef.current.mode === 'scale') {
      // Two corner brackets pulling apart: resize.
      const s = r * 0.78, k = r * 0.42;
      ctx.beginPath();
      ctx.moveTo(cx - s, cy - s + k); ctx.lineTo(cx - s, cy - s); ctx.lineTo(cx - s + k, cy - s);
      ctx.moveTo(cx + s, cy + s - k); ctx.lineTo(cx + s, cy + s); ctx.lineTo(cx + s - k, cy + s);
      ctx.moveTo(cx - s * 0.45, cy - s * 0.45); ctx.lineTo(cx + s * 0.45, cy + s * 0.45);
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  };

  const pulse = (ctx: CanvasRenderingContext2D, m: ReturnType<typeof metrics>, now?: number) => {
    const gz = gzRef.current;
    const t = ((now || performance.now()) % 1100) / 1100;
    let x = m.c, y = m.c, r0 = m.hub * 1.4;
    if (gz.ring.type === 'axis') {
      const h = handles(m).filter((k: any) => k.i === gz.ring.i && k.sign === 1)[0];
      if (h) { x = h.p.x; y = h.p.y; r0 = m.hand * 1.4; }
    }
    ctx.save();
    ctx.strokeStyle = themeRef.current.ink;
    ctx.globalAlpha = 0.5 * (1 - t);
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(x, y, r0 + t * m.hand * 1.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  const paint = useCallback((ctx: CanvasRenderingContext2D, m: ReturnType<typeof metrics>, live: boolean, now?: number) => {
    const gz = gzRef.current;
    const T = themeRef.current;
    ctx.clearRect(-2, -2, m.S + 4, m.S + 4);
    const hs = handles(m).sort((p: any, q: any) => p.p.depth - q.p.depth);

    ctx.save();
    ctx.shadowColor = T.shadow;
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1.5;

    // 1. Back-facing positive axes (+X, +Y, +Z with depth < -0.04): draw stems and handles behind center hub
    hs.forEach((h: any) => {
      if (h.sign <= 0) return;
      const front = h.p.depth >= -0.04;
      if (front) return;

      const on = live && gz.active && gz.active.type === 'axis' && gz.active.i === h.i && gz.active.sign === h.sign;
      const hov = live && gz.hover && gz.hover.i === h.i && gz.hover.sign === h.sign;

      // Stem connecting to center
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(m.c, m.c);
      ctx.lineTo(h.p.x, h.p.y);
      ctx.strokeStyle = h.a.tone;
      ctx.globalAlpha = on || hov ? 0.9 : 0.6;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      // Back handle
      ctx.save();
      ctx.globalAlpha = on || hov ? 1.0 : 0.82;

      // Arrow head for back-facing axis
      if (h.p.len > (gz.mode === 'rotate' ? 0.34 : 0.22)) {
        const ux = (h.p.x - m.c) / h.p.rad, uy = (h.p.y - m.c) / h.p.rad;
        ctx.save();
        ctx.translate(h.p.x, h.p.y);
        ctx.rotate(Math.atan2(uy, ux));
        ctx.fillStyle = h.a.tone;
        ctx.strokeStyle = h.a.tone;
        if (gz.mode === 'rotate') {
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(0, 0, m.hand * 1.25, -0.92, 0.92);
          ctx.stroke();
          const ax = Math.cos(0.92) * m.hand * 1.25, ay = Math.sin(0.92) * m.hand * 1.25;
          ctx.beginPath();
          ctx.moveTo(ax + 3, ay + 1);
          ctx.lineTo(ax - 2.5, ay + 3);
          ctx.lineTo(ax - 1, ay - 2.5);
          ctx.closePath();
          ctx.fill();
        } else if (gz.mode === 'scale') {
          const side = m.hand * 0.78;
          ctx.fillRect(m.hand * 1.0, -side / 2, side, side);
        } else {
          const base = m.hand * 0.92, wide = m.hand * 0.5;
          ctx.beginPath();
          ctx.moveTo(base + m.hand * 0.88, 0);
          ctx.lineTo(base, -wide);
          ctx.lineTo(base, wide);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      const r = m.hand * (on || hov ? 1.05 : 0.9);
      ctx.beginPath();
      ctx.arc(h.p.x, h.p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = h.a.tone;
      ctx.fill();

      if (on || hov) {
        ctx.strokeStyle = T.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(h.p.x, h.p.y, m.hand * 1.25, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      labelFont(ctx, h.a.lbl, r);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(h.a.lbl, h.p.x, h.p.y + 0.5);
      ctx.restore();
    });

    // 2. Center Hub (placed over back handles, under front handles)
    ctx.beginPath();
    ctx.arc(m.c, m.c, m.hub, 0, Math.PI * 2);
    ctx.fillStyle = T.hub;
    ctx.fill();
    ctx.strokeStyle = live && gz.active && gz.active.type === 'hub' ? T.ink : T.ghost;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();

    hubIcon(ctx, m.c, m.c, m.hub * 0.72);

    // 3. Front-facing positive axes (depth >= -0.04): draw stems and handles on top of hub
    hs.forEach((h: any) => {
      if (h.sign <= 0) return;
      const front = h.p.depth >= -0.04;
      if (!front) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(m.c, m.c);
      ctx.lineTo(h.p.x, h.p.y);
      ctx.strokeStyle = h.a.tone;
      ctx.lineWidth = 2.8;
      ctx.stroke();
      ctx.restore();
    });

    // 4. Front-facing vibrant handles (+X, +Y, +Z)
    ctx.save();
    ctx.shadowColor = T.shadow;
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1.5;

    hs.forEach((h: any) => {
      if (h.sign <= 0) return;
      const front = h.p.depth >= -0.04;
      if (!front) return;

      const on = live && gz.active && gz.active.type === 'axis' && gz.active.i === h.i && gz.active.sign === h.sign;
      const hov = live && gz.hover && gz.hover.i === h.i && gz.hover.sign === h.sign;

      if (h.p.len > (gz.mode === 'rotate' ? 0.34 : 0.22)) {
        const ux = (h.p.x - m.c) / h.p.rad, uy = (h.p.y - m.c) / h.p.rad;
        ctx.save();
        ctx.translate(h.p.x, h.p.y);
        ctx.rotate(Math.atan2(uy, ux));
        ctx.fillStyle = h.a.tone;
        ctx.strokeStyle = h.a.tone;
        if (gz.mode === 'rotate') {
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.arc(0, 0, m.hand * 1.4, -0.92, 0.92);
          ctx.stroke();
          const ax = Math.cos(0.92) * m.hand * 1.4, ay = Math.sin(0.92) * m.hand * 1.4;
          ctx.beginPath();
          ctx.moveTo(ax + 3.6, ay + 1.2);
          ctx.lineTo(ax - 3, ay + 3.8);
          ctx.lineTo(ax - 1.2, ay - 2.9);
          ctx.closePath();
          ctx.fill();
        } else if (gz.mode === 'scale') {
          // Square caps read as "stretch along this axis".
          const side = m.hand * 0.9;
          ctx.fillRect(m.hand * 1.08, -side / 2, side, side);
        } else {
          const base = m.hand * 1.02, wide = m.hand * 0.56;
          ctx.beginPath();
          ctx.moveTo(base + m.hand * 0.98, 0);
          ctx.lineTo(base, -wide);
          ctx.lineTo(base, wide);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(h.p.x, h.p.y, m.hand * (on || hov ? 1.08 : 1), 0, Math.PI * 2);
      ctx.fillStyle = h.a.tone;
      ctx.fill();
      if (on || hov) {
        ctx.strokeStyle = T.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(h.p.x, h.p.y, m.hand * 1.36, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      labelFont(ctx, h.a.lbl, m.hand);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(h.a.lbl, h.p.x, h.p.y + 0.5);
    });
    ctx.restore();

    // 5. Negative axes (-X, -Y, -Z): render on hover/active or subtle front-facing pip
    hs.forEach((h: any) => {
      if (h.sign >= 0) return;
      const on = live && gz.active && gz.active.type === 'axis' && gz.active.i === h.i && gz.active.sign === h.sign;
      const hov = live && gz.hover && gz.hover.i === h.i && gz.hover.sign === h.sign;
      const front = h.p.depth >= -0.04;

      if (on || hov) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(h.p.x, h.p.y, m.hand * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = h.a.tone;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ffffff';
        labelFont(ctx, h.a.back, m.hand * 0.65);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(h.a.back, h.p.x, h.p.y + 0.5);
        ctx.restore();
      } else if (front) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(h.p.x, h.p.y, m.hand * 0.32, 0, Math.PI * 2);
        ctx.fillStyle = h.a.tone;
        ctx.globalAlpha = 0.45;
        ctx.fill();
        ctx.restore();
      }
    });

    if (live && gz.ring) pulse(ctx, m, now);
  }, [handles]);

  const drawGizmo = useCallback((now?: number) => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) paint(ctx, metrics(gzRef.current.size), true, now);
    }
  }, [paint]);

  const applyObject = useCallback(() => {
    if (reduceMotionRef.current || !(gzRef.current.rotStep || gzRef.current.moveStep)) jumpDisplay();
    const e = new THREE.Euler().setFromQuaternion(objRef.current.quat, 'YXZ');
    if (numRef.current) {
      numRef.current.innerHTML =
        '<i>pos</i><b>' + objRef.current.pos.x.toFixed(2) + '</b><b>' + objRef.current.pos.y.toFixed(2) + '</b><b>' + objRef.current.pos.z.toFixed(2) + '</b>' +
        '<i>rot</i><b>' + Math.round(e.x / DEG) + '°</b><b>' + Math.round(e.y / DEG) + '°</b><b>' + Math.round(e.z / DEG) + '°</b>';
    }
    drawGizmo();
  }, [jumpDisplay, drawGizmo]);

  const applyCamera = useCallback((instant: boolean = true, overrideRadius?: number) => {
    const cam = camRef.current;
    if (engine) {
      if (overrideRadius !== undefined) {
        cam.radius = overrideRadius;
        engine.setCameraView(cam.theta, cam.phi, overrideRadius, instant);
      } else {
        cam.radius = engine.cameraSpherical.radius;
        // Never pass radius when not explicitly overriding, so setCameraView never snaps user's zoom!
        engine.setCameraView(cam.theta, cam.phi, undefined, instant);
      }
      engine.cameraTarget.copy(cam.target);
      engine.markDirty();
    }
    drawGizmo();
  }, [engine, drawGizmo]);

  // Labels and hints
  const idleHint = useCallback(() => {
    if (tourRef.current) return;
    const el = labelRef.current;
    if (!el) return;
    el.classList.remove('nv-live');
    const targets = targetsRef.current;
    const current = currentRef.current;
    // Name the target in the same words as the selection frame and Select panel.
    const what = engine
      ? engine.getSelectionSummary(scopeRef.current).label
      : targets[current] ? targets[current].name : '—';
    if (gzRef.current.mode === 'look') {
      el.innerHTML = '';
      return;
    }
    el.textContent = '';
    const name = document.createElement('b');
    name.textContent = what;
    el.append(name, ' · ' + MODE_LABELS[gzRef.current.mode].toLowerCase());
  }, [engine]);

  const say = useCallback((text: string, live?: boolean) => {
    if (gzRef.current.mode === 'look' && !tourRef.current) return;
    const el = labelRef.current;
    if (!el) return;
    el.innerHTML = text;
    el.classList.toggle('nv-live', !!live);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (live) hintTimerRef.current = setTimeout(idleHint, 1600);
  }, [idleHint]);

  const snap = (v: number, step: number) => Math.round(v / step) * step;

  const clampPos = () => {
    // Unconstrained 3D movement: objects and layers can move completely freely past canvas edges and grid lines
  };

  const tick = (step: any) => {
    if (lastStepRef.current === step) return;
    lastStepRef.current = step;
    if (navigator.vibrate) { try { navigator.vibrate(4); } catch (_) {} }
  };

  const camBasis = () => {
    const camera = engine?.getCamera();
    if (camera) {
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      return { right, up };
    }
    const cam = camRef.current;
    const sp = Math.sin(cam.phi), cp = Math.cos(cam.phi);
    const st = Math.sin(cam.theta), ct = Math.cos(cam.theta);
    return { right: new THREE.Vector3(ct, 0, -st), up: new THREE.Vector3(-cp * st, sp, -cp * ct) };
  };

  const unitsPerPixel = () => {
    const camera = engine?.getCamera();
    const H = window.innerHeight || 900;
    if (camera && camera instanceof THREE.PerspectiveCamera) {
      const targetPos = objRef.current.pos;
      const distanceToTarget = camera.position.distanceTo(targetPos) || camRef.current.radius || 10;
      return (2 * distanceToTarget * Math.tan((camera.fov * DEG) / 2)) / H;
    }
    return (2 * camRef.current.radius * Math.tan((46 * DEG) / 2)) / H;
  };

  const pushHistory = () => {
    const targetObj = targetObjRef.current;
    if (!targetObj) return;
    historyRef.current.push({ o: targetObj, p: objRef.current.pos.clone(), q: objRef.current.quat.clone() });
    if (historyRef.current.length > 40) historyRef.current.shift();
    setHistoryLen(historyRef.current.length);
  };

  const undo = () => {
    const s = historyRef.current.pop();
    if (!s) return;
    if (s.o !== targetObjRef.current) {
      const idx = targetsRef.current.findIndex(t => t.object === s.o);
      if (idx >= 0) selectTarget(idx, true);
    }
    objRef.current.pos.copy(s.p);
    objRef.current.quat.copy(s.q);
    applyObject();
    setHistoryLen(historyRef.current.length);
    say('undo', true);
  };

  const flyTo = (
    phi: number,
    theta: number,
    targetRadius?: number,
    targetPos?: THREE.Vector3,
    ms?: number
  ) => {
    if (engine) {
      camRef.current.radius = engine.cameraSpherical.radius;
      camRef.current.target.copy(engine.cameraTarget);
    }
    const cam = camRef.current;
    let t = theta;
    while (t - cam.theta > Math.PI) t -= Math.PI * 2;
    while (t - cam.theta < -Math.PI) t += Math.PI * 2;
    const p1 = Math.max(0.06, Math.min(Math.PI - 0.06, phi));
    const r0 = cam.radius;
    const r1 = targetRadius !== undefined ? Math.max(0.4, Math.min(25.0, targetRadius)) : r0;
    const hasRadiusChange = targetRadius !== undefined && Math.abs(r1 - r0) > 0.01;

    const t0 = cam.target.clone();
    const t1 = targetPos ? targetPos.clone() : cam.target.clone();
    const hasTargetChange = targetPos !== undefined && t0.distanceToSquared(t1) > 1e-4;

    if (reduceMotionRef.current) {
      cam.phi = p1;
      cam.theta = t;
      if (hasRadiusChange) cam.radius = r1;
      if (hasTargetChange) cam.target.copy(t1);
      applyCamera(true, hasRadiusChange ? r1 : undefined);
      return;
    }

    flightRef.current = {
      p0: cam.phi,
      t0: cam.theta,
      r0,
      target0: t0,
      p1,
      t1: t,
      r1,
      target1: t1,
      hasRadiusChange,
      hasTargetChange,
      start: performance.now(),
      ms: ms || 500
    };
  };

  const stepFlight = (now: number) => {
    const flight = flightRef.current;
    if (!flight) return;
    const k = Math.min(1, (now - flight.start) / flight.ms);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camRef.current.phi = flight.p0 + (flight.p1 - flight.p0) * e;
    camRef.current.theta = flight.t0 + (flight.t1 - flight.t0) * e;
    if (flight.hasTargetChange) {
      camRef.current.target.lerpVectors(flight.target0, flight.target1, e);
    }
    if (flight.hasRadiusChange) {
      camRef.current.radius = flight.r0 + (flight.r1 - flight.r0) * e;
      applyCamera(true, camRef.current.radius);
    } else {
      applyCamera(true, undefined);
    }
    if (k >= 1) flightRef.current = null;
  };

  const faceDirection = (dir: THREE.Vector3, label?: string) => {
    const d = dir.clone().normalize();
    flyTo(Math.acos(Math.max(-1, Math.min(1, d.y))), Math.atan2(d.x, d.z), undefined, undefined, 500);
    if (label) say('view · ' + label, true);
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch (_) {} }
  };

  const gzPoint = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent) => {
    const gzc = canvasRef.current;
    if (!gzc) return { x: 0, y: 0 };
    const r = gzc.getBoundingClientRect();
    const k = gzRef.current.size / r.width;
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k + gzRef.current.size * CROP };
  };

  const pickHandle = (pt: { x: number; y: number }) => {
    const m = metrics(gzRef.current.size);
    const near: any[] = [];
    handles(m).forEach((h: any) => {
      const d = Math.hypot(pt.x - h.p.x, pt.y - h.p.y);
      if (d < m.hand * (h.sign > 0 ? 1.8 : 1.45)) near.push({ h, d, front: h.p.depth >= -0.04 });
    });
    if (!near.length) return null;
    near.sort((a: any, b: any) => a.d - b.d);
    const tie = near.find((c: any) => c.front && c.d <= near[0].d + m.hand * 0.4);
    return (tie || near[0]).h;
  };

  const setMode = (m: NavMode) => {
    gzRef.current.mode = m;
    setModeState(m);
    if (nvRef.current) nvRef.current.dataset.mode = m;
    markSelection();
    idleHint();
    drawGizmo();
    saveLayout();
    onTransformModeChange?.(m);
  };

  const setOrient = (pitch: number, roll: number, label: string) => {
    stopTour(); pushHistory();
    const e = new THREE.Euler().setFromQuaternion(objRef.current.quat, 'YXZ');
    objRef.current.quat.setFromEuler(new THREE.Euler(pitch * DEG, e.y, roll * DEG, 'YXZ'));
    applyObject(); say(label, true);
  };

  const lookAtIt = () => {
    stopTour();
    let center = objRef.current.pos.clone();
    let desiredRadius: number | undefined = undefined;

    if (engine) {
      const box = engine.getSelectionBox(scopeRef.current);
      if (!box.isEmpty()) {
        box.getCenter(center);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        desiredRadius = Math.max(1.5, Math.min(20.0, sphere.radius * 2.2));
      }
    }

    flyTo(camRef.current.phi, camRef.current.theta, desiredRadius, center, 600);
    say('framed', true);
  };

  const resetTarget = () => {
    // Lines and layers keep their shape in their points, so snapping their scene
    // object back would desync them; Undo is the way back for those.
    if (scopeRef.current !== 'model') return;
    stopTour(); pushHistory();
    const targets = targetsRef.current;
    const current = currentRef.current;
    const targetObj = targetObjRef.current;
    const home = targets[current] && targets[current].home;
    if (home && targetObj) {
      targetObj.position.copy(home.p);
      targetObj.quaternion.copy(home.q);
    }
    syncFromTarget();
    applyObject();
    flyTo(camRef.current.phi, camRef.current.theta, undefined, objRef.current.pos, 500);
    say('reset', true);
  };

  const TOUR_PRO = [
    { t: 0, dur: 3600, ring: { type: 'axis', i: 0 }, cap: 'Drag an axis to constrain the transform to it.' },
    { t: 3600, dur: 3600, ring: { type: 'axis', i: 1 }, cap: 'Tap an axis to snap the view down it — tapping never transforms.' },
    { t: 7200, dur: 4000, ring: { type: 'hub' }, cap: 'Tap the hub to cycle Orbit · Move · Rotate · Resize.' },
    { t: 11200, dur: 1800, ring: null, cap: 'Hold Shift, or set snap to Free, for unconstrained drags.' }
  ];

  const stopTour = () => {
    const tour = tourRef.current;
    if (!tour) return;
    const s = tour.save;
    objRef.current.pos.copy(s.pos);
    objRef.current.quat.copy(s.quat);
    flightRef.current = null;
    gzRef.current.ring = null;
    tourRef.current = null;
    setIsTourRunning(false);
    setMode(s.mode);
    applyObject();
    flyTo(s.phi, s.theta, s.radius, s.target, 500);
    idleHint();
  };

  const startTour = () => {
    stopTour();
    tourRef.current = {
      start: performance.now(),
      step: -1,
      save: {
        pos: objRef.current.pos.clone(),
        quat: objRef.current.quat.clone(),
        phi: camRef.current.phi,
        theta: camRef.current.theta,
        radius: engine ? engine.cameraSpherical.radius : camRef.current.radius,
        target: (engine ? engine.cameraTarget : camRef.current.target).clone(),
        mode: gzRef.current.mode
      }
    };
    setMode('move');
    setMenu(false);
    setIsTourRunning(true);
  };

  const stepTour = (now: number) => {
    const tour = tourRef.current;
    if (!tour) return;
    const activeTour = TOUR_PRO;
    const el = Math.max(0, now - tour.start);
    let idx = 0;
    for (let i = 0; i < activeTour.length; i++) if (el >= activeTour[i].t) idx = i;
    const last = activeTour[activeTour.length - 1];
    if (el > last.t + last.dur) { stopTour(); return; }

    if (idx !== tour.step) {
      tour.step = idx;
      const s = activeTour[idx];
      gzRef.current.ring = s.ring;
      const label = labelRef.current;
      if (label) {
        label.textContent = s.cap;
        label.classList.add('nv-live');
      }
      if (idx === 1) {
        const h = handles(metrics(gzRef.current.size)).filter((k: any) => k.i === 1 && k.sign === 1)[0];
        if (h) faceDirection(h.dir, '');
      }
      if (idx === 2) setMode('rotate');
      if (idx === 3) { setMode('move'); flyTo(tour.save.phi, tour.save.theta, 600); }
    }
    const s = activeTour[idx];
    const wave = Math.sin(Math.min(1, (el - s.t) / s.dur * 1.25) * Math.PI);
    if (idx === 0) {
      objRef.current.pos.copy(tour.save.pos);
      objRef.current.pos.y = tour.save.pos.y + wave * 1.6;
      applyObject();
    } else if (idx === 2) {
      objRef.current.quat.copy(tour.save.quat).premultiply(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), wave * 50 * DEG)
      );
      applyObject();
    }
    drawGizmo(now);
  };

  const selectTarget = useCallback((i: number, quiet?: boolean) => {
    const targets = targetsRef.current;
    if (i < 0 || !targets[i]) return;
    currentRef.current = i;
    setCurrentIdx(i);
    targetObjRef.current = targets[i].object;
    syncFromTarget();
    jumpDisplay();
    markSelection();
    applyObject();
    if (!quiet) {
      setMenu(false);
      const safeName = targets[i].name.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
      say('target · <b>' + safeName + '</b>', true);
    }
    if (!quiet) {
      // Picking a target here changes "What to select" in the Select panel too.
      const target = targets[i];
      if (target.scope === 'active_layer') {
        onSelectLayer?.(target.id);
      } else if (target.scope === 'model') {
        onSelectModel?.(target.id);
      }
      onSelectTargetScope?.(target.scope);
    }
  }, [syncFromTarget, jumpDisplay, markSelection, applyObject, say, onSelectLayer, onSelectModel, onSelectTargetScope, setMenu]);

  const setTargets = useCallback((list: TargetItem[]) => {
    const formatted = list.map(t => {
      t.object.updateWorldMatrix(true, false);
      return Object.assign({}, t, {
        home: { p: t.object.position.clone(), q: t.object.quaternion.clone() }
      });
    });
    targetsRef.current = formatted;
    setTargetsList(formatted);
  }, []);

  /** The list entry that stands for the shared selection right now. */
  const indexForSelection = useCallback((list: TargetItem[]) => {
    const selectedModelId = engine?.getActiveSelectedModelId() ?? activeModelId;
    const byScope = (scope: TransformTargetScope, id?: string | null) =>
      list.findIndex((t) => t.scope === scope && (id ? t.id === id : true));
    if (targetScope === 'active_layer') {
      const idx = byScope('active_layer', activeLayerId);
      return idx >= 0 ? idx : byScope('active_layer');
    }
    if (targetScope === 'model') {
      const idx = byScope('model', selectedModelId);
      return idx >= 0 ? idx : byScope('model');
    }
    return byScope(targetScope);
  }, [engine, targetScope, activeLayerId, activeModelId]);

  // Build the target list in the same terms as the Select panel's "What to select".
  useEffect(() => {
    if (!engine) return;
    const list: TargetItem[] = [];
    const drawingPlane = engine.getDrawingPlane();
    const sceneRoot = engine.getModelRoot();
    const strokeRoot = engine.getStrokeRoot();

    if (layers && layers.length > 0) {
      layers.forEach((l) => {
        list.push({ id: l.id, name: l.name || 'Layer', note: 'layer', scope: 'active_layer', object: strokeRoot });
      });
    }

    list.push({ id: 'selected_strokes', name: 'Picked lines', note: 'lines', scope: 'selected_strokes', object: strokeRoot });

    if (sceneRoot?.children) {
      let modelCount = 0;
      sceneRoot.children.forEach((child) => {
        if (child === strokeRoot || child === drawingPlane || child.name === 'DrawingPlaneCanvas') return;
        if ((child as any).isLine || (child as any).isPoints || (child as any).isCamera) return;
        modelCount++;
        const modelName = child.name && child.name !== 'Scene' && child.name !== 'Object3D'
          ? child.name
          : `3D model ${modelCount}`;
        list.push({ id: child.uuid, name: modelName, note: '3D model', scope: 'model', object: child });
      });
    }

    if (drawingPlane) {
      list.push({ id: drawingPlane.uuid, name: 'Drawing canvas', note: '3D model', scope: 'model', object: drawingPlane });
    }

    list.push({ id: 'scene', name: 'Everything', note: 'all', scope: 'all', object: sceneRoot });

    setTargets(list);
  }, [engine, models, layers, setTargets]);

  // Follow the shared selection: panel choice, tapped layer or model, lasso.
  useEffect(() => {
    if (!targetsList || targetsList.length === 0) return;
    const idx = indexForSelection(targetsList);
    if (idx >= 0) {
      if (idx !== currentRef.current || targetObjRef.current !== targetsList[idx].object) {
        selectTarget(idx, true);
      }
    } else {
      // No list entry (e.g. a 3D guide): still pivot on what the scope moves.
      syncFromTarget();
    }
    idleHint();
  }, [targetsList, indexForSelection, selectTarget, syncFromTarget, idleHint]);

  const sizeToBox = useCallback(() => {
    gzRef.current.size = window.innerWidth < 640 ? 160 : 190;
    fitGizmo(gzRef.current.size);
    drawGizmo();
  }, [drawGizmo]);

  // Gizmo pointer events
  useEffect(() => {
    const gzc = canvasRef.current;
    const dock = dockRef.current;
    if (!gzc) return;

    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let isRepositioning = false;
    let repositionDrag: { startX: number; startY: number; left: number; top: number; moved: boolean } | null = null;
    let downX = 0;
    let downY = 0;

    const onDown = (e: PointerEvent) => {
      stopTour();
      setNavActive(true);
      downX = e.clientX;
      downY = e.clientY;
      isRepositioning = false;
      repositionDrag = null;

      if (longPressTimer) clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        isRepositioning = true;
        haptics.trigger('medium');
        if (dock) {
          const rect = dock.getBoundingClientRect();
          repositionDrag = {
            startX: downX,
            startY: downY,
            left: rect.left,
            top: rect.top,
            moved: false,
          };
        }
        nvRef.current?.classList.add('nv-repositioning', 'nv-grabbing');
        say('Reposition navigator', true);
      }, 400);

      const pt = gzPoint(e);
      const m = metrics(gzRef.current.size);
      const r = Math.hypot(pt.x - m.c, pt.y - m.c);
      const hit = pickHandle(pt);

      e.preventDefault();
      e.stopPropagation();
      if (hit) gzRef.current.active = { type: 'axis', i: hit.i, sign: hit.sign };
      else if (r <= m.hub * 1.7) gzRef.current.active = { type: 'hub' };
      else gzRef.current.active = { type: 'orbit' };

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        hit,
        pos: objRef.current.pos.clone(),
        quat: objRef.current.quat.clone(),
        theta: camRef.current.theta,
        phi: camRef.current.phi,
        startAngle: Math.atan2(pt.y - m.c, pt.x - m.c),
        committed: false,
      };
      lastStepRef.current = null;
      nvRef.current?.classList.add('nv-grabbing', 'nv-focus');
      try { gzc.setPointerCapture(e.pointerId); } catch (_) {}
      drawGizmo();
    };

    const onMove = (e: PointerEvent) => {
      if (longPressTimer && Math.hypot(e.clientX - downX, e.clientY - downY) > 7) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      if (isRepositioning && repositionDrag) {
        const dx = e.clientX - repositionDrag.startX;
        const dy = e.clientY - repositionDrag.startY;
        if (!repositionDrag.moved && Math.hypot(dx, dy) < 2) return;
        repositionDrag.moved = true;
        place(repositionDrag.left + dx, repositionDrag.top + dy);
        return;
      }

      const m = metrics(gzRef.current.size);
      const drag = dragRef.current;
      if (!drag) {
        const hit = pickHandle(gzPoint(e));
        const changed = (hit ? hit.i + ':' + hit.sign : '') !== (gzRef.current.hover ? gzRef.current.hover.i + ':' + gzRef.current.hover.sign : '');
        gzRef.current.hover = hit ? { i: hit.i, sign: hit.sign } : null;
        gzc.style.cursor = hit ? 'pointer' : 'grab';
        if (changed) drawGizmo();
        return;
      }
      const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      const act = gzRef.current.active;
      if (!act) return;

      if (act.type === 'orbit' || gzRef.current.mode === 'look') {
        camRef.current.theta = drag.theta - dx * 0.0062;
        camRef.current.phi = Math.max(0.06, Math.min(Math.PI - 0.06, drag.phi - dy * 0.0062));
        applyCamera(true, undefined);
        say('orbit', true);
        return;
      }
      if (!drag.committed) {
        pushHistory();
        engine?.beginTransform(scopeRef.current);
        drag.committed = true;
        drag.lastX = e.clientX;
        drag.lastY = e.clientY;
      }

      if (gzRef.current.mode === 'scale') {
        // Resize applies straight to the engine: the hub resizes evenly (drag
        // up to grow), an axis handle stretches along that axis.
        if (!engine) return;
        const ddx = e.clientX - drag.lastX, ddy = e.clientY - drag.lastY;
        drag.lastX = e.clientX;
        drag.lastY = e.clientY;
        if (act.type === 'hub') {
          const factor = Math.exp(-ddy * 0.006);
          engine.scaleAxis('uniform', factor, scopeRef.current, false);
          say('resize', true);
        } else if (drag.hit) {
          const hp = project(drag.hit.dir, m);
          const nx = (hp.x - m.c) / hp.rad, ny = (hp.y - m.c) / hp.rad;
          const along = ddx * nx + ddy * ny;
          const axis = drag.hit.a.lbl.toLowerCase() as 'x' | 'y' | 'z';
          engine.scaleAxis(axis, Math.exp(along * 0.006), scopeRef.current, false);
          say(drag.hit.a.lbl + '  stretch', true);
        }
        ownRevisionRef.current = engine.getSelectionRevision();
        tick(Math.round((ddx + ddy) / 12));
        return;
      }

      if (act.type === 'hub') {
        if (gzRef.current.mode === 'move') {
          const b = camBasis(), k = unitsPerPixel();
          objRef.current.pos.copy(drag.pos).addScaledVector(b.right, dx * k).addScaledVector(b.up, -dy * k);
          if (gzRef.current.moveStep) {
            objRef.current.pos.x = snap(objRef.current.pos.x, gzRef.current.moveStep);
            objRef.current.pos.y = snap(objRef.current.pos.y, gzRef.current.moveStep);
            objRef.current.pos.z = snap(objRef.current.pos.z, gzRef.current.moveStep);
          }
          clampPos(); applyObject();
          tick(objRef.current.pos.x + ':' + objRef.current.pos.y + ':' + objRef.current.pos.z);
          say('screen move', true);
        } else {
          const b = camBasis();
          let ay = -dx * 0.5, ax = -dy * 0.5;
          if (gzRef.current.rotStep) { ay = snap(ay, gzRef.current.rotStep); ax = snap(ax, gzRef.current.rotStep); }
          const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ay * DEG)
            .multiply(new THREE.Quaternion().setFromAxisAngle(b.right, ax * DEG));
          objRef.current.quat.copy(drag.quat).premultiply(q);
          applyObject();
          tick(ay + ':' + ax);
          say('trackball', true);
        }
        return;
      }

      const h = drag.hit;
      if (!h) return;
      const a = (axesRef.current || PRO_AXES)[h.i], worldDir = h.dir, p = project(worldDir, m);
      if (gzRef.current.mode === 'move') {
        const len = Math.max(0.001, p.len);
        const nx = (p.x - m.c) / p.rad, ny = (p.y - m.c) / p.rad;
        let amount = (dx * nx + dy * ny) * unitsPerPixel() / Math.max(0.30, len);
        if (gzRef.current.moveStep) amount = snap(amount, gzRef.current.moveStep);
        objRef.current.pos.copy(drag.pos).addScaledVector(worldDir, amount);
        clampPos(); applyObject();
        tick(amount);
        say(a.lbl + '  ' + (amount >= 0 ? '+' : '−') + Math.abs(amount).toFixed(2), true);
      } else {
        const pt = gzPoint(e);
        let d = Math.atan2(pt.y - m.c, pt.x - m.c) - drag.startAngle;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        let deg = -(d / DEG) * (p.depth >= 0 ? 1 : -1);
        if (gzRef.current.rotStep) deg = snap(deg, gzRef.current.rotStep);
        objRef.current.quat.copy(drag.quat).premultiply(new THREE.Quaternion().setFromAxisAngle(worldDir, deg * DEG));
        applyObject();
        tick(deg);
        say(a.lbl + '  ' + (deg >= 0 ? '+' : '−') + Math.abs(Math.round(deg)) + '°', true);
      }
    };

    const onUp = (e: PointerEvent) => {
      setNavActive(false);
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      if (isRepositioning) {
        isRepositioning = false;
        nvRef.current?.classList.remove('nv-repositioning', 'nv-grabbing', 'nv-focus');
        if (repositionDrag) {
          const dx = e.clientX - repositionDrag.startX;
          const dy = e.clientY - repositionDrag.startY;
          place(repositionDrag.left + dx, repositionDrag.top + dy, true);
          haptics.trigger('light');
        }
        repositionDrag = null;
        dragRef.current = null;
        gzRef.current.active = null;
        try { gzc.releasePointerCapture(e.pointerId); } catch (_) {}
        drawGizmo();
        idleHint();
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;
      if (drag.committed) {
        jumpDisplay();
        engine?.endTransform();
      }
      if (!drag.moved && drag.hit) {
        faceDirection(drag.hit.dir, drag.hit.sign > 0 ? drag.hit.a.lbl : drag.hit.a.back);
      } else if (!drag.moved && gzRef.current.active && gzRef.current.active.type === 'hub') {
        const cycle: Record<NavMode, NavMode> = { look: 'move', move: 'rotate', rotate: 'scale', scale: 'look' };
        setMode(cycle[gzRef.current.mode]);
      }
      gzRef.current.active = null; dragRef.current = null;
      nvRef.current?.classList.remove('nv-grabbing', 'nv-focus');
      try { gzc.releasePointerCapture(e.pointerId); } catch (_) {}
      drawGizmo(); idleHint();
      setHistoryLen(historyRef.current.length);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (engine) {
        engine.zoom(e.deltaY * 0.8);
        camRef.current.radius = engine.cameraSpherical.radius;
        drawGizmo();
      }
    };

    gzc.addEventListener('pointerdown', onDown);
    gzc.addEventListener('pointermove', onMove);
    gzc.addEventListener('pointerup', onUp);
    gzc.addEventListener('pointercancel', onUp);
    gzc.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      setNavActive(false);
      if (longPressTimer) clearTimeout(longPressTimer);
      gzc.removeEventListener('pointerdown', onDown);
      gzc.removeEventListener('pointermove', onMove);
      gzc.removeEventListener('pointerup', onUp);
      gzc.removeEventListener('pointercancel', onUp);
      gzc.removeEventListener('wheel', onWheel);
    };
  }, [drawGizmo, applyCamera, applyObject, idleHint, say, engine, place]);

  // Keep gizmo active and fully visible when painting, close dropdown menu when tapping outside
  useEffect(() => {
    const onDocDown = (e: PointerEvent) => {
      if (nvRef.current && !nvRef.current.contains(e.target as Node)) {
        setMenu(false);
      } else if (e.target === canvasRef.current) {
        setMenu(false);
      }
    };
    document.addEventListener('pointerdown', onDocDown, true);

    return () => {
      document.removeEventListener('pointerdown', onDocDown, true);
    };
  }, [setMenu]);

  // Boot & main animation loop
  useEffect(() => {
    let animId: number;
    let lastFrame = 0;

    // Restore placement and increments, but always begin in Orbit. A persisted
    // transform mode made a fresh navigator feel unsafe and unpredictable.
    try {
      const v = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (v) {
        if (typeof v.ax === 'number') anchorRef.current.ax = Math.max(0, Math.min(1, v.ax));
        if (typeof v.ay === 'number') anchorRef.current.ay = Math.max(0, Math.min(1, v.ay));
        if (typeof v.rotStep === 'number') { gzRef.current.rotStep = v.rotStep; setRotStep(v.rotStep); }
        if (typeof v.moveStep === 'number') { gzRef.current.moveStep = v.moveStep; setMoveStep(v.moveStep); }
      }
    } catch (_) {}

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const dt = lastFrame ? Math.min(0.06, (now - lastFrame) / 1000) : 0.016;
      lastFrame = now;

      stepFlight(now);
      stepTour(now);

      if (!dragRef.current && !flightRef.current && !tourRef.current && engine) {
        const engCam = engine.cameraSpherical;
        const thetaDiff = Math.abs(camRef.current.theta - engCam.theta);
        const phiDiff = Math.abs(camRef.current.phi - engCam.phi);
        const radiusDiff = Math.abs(camRef.current.radius - engCam.radius);
        const targetDiff = camRef.current.target.distanceToSquared(engine.cameraTarget);
        if (thetaDiff > 1e-4 || phiDiff > 1e-4 || radiusDiff > 1e-4 || targetDiff > 1e-4) {
          camRef.current.theta = engCam.theta;
          camRef.current.phi = engCam.phi;
          camRef.current.radius = engCam.radius;
          camRef.current.target.copy(engine.cameraTarget);
          drawGizmo(now);
        }
      }

      const easing = easeDisplay(dt);
      if (easing) drawGizmo(now);

      // Something other than this navigator changed the selection (a tap, a
      // drag on the frame, undo): re-center the gizmo on it once settled.
      if (engine && !easing && !dragRef.current && !tourRef.current &&
          engine.getSelectionRevision() !== ownRevisionRef.current) {
        syncFromTarget();
        idleHint();
        drawGizmo(now);
      }
    };

    sizeToBox();
    document.documentElement.dataset.nvTheme = theme;
    readTheme();
    applyObject();

    if (engine?.cameraSpherical) {
      camRef.current.theta = engine.cameraSpherical.theta;
      camRef.current.phi = engine.cameraSpherical.phi;
      camRef.current.radius = engine.cameraSpherical.radius;
      if (engine.cameraTarget) camRef.current.target.copy(engine.cameraTarget);
    }
    idleHint();
    placeFromAnchor();
    drawGizmo();

    animId = requestAnimationFrame(loop);

    const onResize = () => {
      sizeToBox();
      placeFromAnchor();
      drawGizmo();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [sizeToBox, readTheme, applyObject, applyCamera, idleHint, placeFromAnchor, drawGizmo, easeDisplay, engine, syncFromTarget]);

  // Theme change
  useEffect(() => {
    document.documentElement.dataset.nvTheme = theme;
    readTheme();
    drawGizmo();
  }, [theme, readTheme, drawGizmo]);

  const currentTarget = targetsList[currentIdx];

  return (
    <div
      id="nv"
      ref={nvRef}
      data-menu={isMenuOpen ? 'open' : 'closed'}
      data-corner="br"
      data-mode={mode}
    >
      <div className="nv-dock" id="nv-dock" ref={dockRef}>
        <canvas className="nv-canvas" id="nv-canvas" ref={canvasRef}></canvas>

        {/* One discreet rail; presets and targeting live in the shared menu. */}
        <div className="nv-control-rail">
          <button type="button" className="nv-mode-badge"
            onClick={(event) => { event.stopPropagation(); setMenu(!isMenuOpen); }}
            aria-label="Choose navigator mode and target" aria-expanded={isMenuOpen}>
            {MODE_LABELS[mode]}
            <ChevronDown size={11} />
          </button>
          <button type="button" className="nv-view-btn nv-view-btn--more"
            ref={tabRef} id="nv-tab" data-testid="nav-more" aria-expanded={isMenuOpen}
            onClick={(event) => { event.stopPropagation(); haptics.trigger('light'); setMenu(!isMenuOpen); }}
            aria-label="View controls menu" title="Target, layer and navigator settings">
            <SlidersHorizontal size={13} />
          </button>
        </div>
        <div className="nv-label" id="nv-label" ref={labelRef}></div>
      </div>

      <div className="nv-menu navigator-settings-surface" data-theme={theme} id="nv-menu" ref={menuRef}>
        <NavigatorSettings
          theme={theme} targetScope={targetScope} onSelectTargetScope={onSelectTargetScope}
          layers={layers} activeLayerId={activeLayerId} onSelectLayer={onSelectLayer}
          layout={navigatorLayout}
          sensitivity={navigatorSensitivity} onSensitivityChange={onSensitivityChange}
          projectionMode={projectionMode} onToggleProjection={onToggleProjection}
          transformMode={mode} onTransformModeChange={(next) => { stopTour(); setMode(next); }}
          modes={['look', 'move', 'rotate', 'scale']}
          onSelectView={(view) => engine?.snapToView(view === 'side' ? 'right' : view === 'angle' ? 'isometric' : view)}
          onResetView={() => { engine?.resetCamera(); engine?.snapToView('isometric'); }}
          onHide={onClose} onDismiss={() => setMenu(false)}
        />

        {/* 5. Collapsible Advanced Section */}
        <div style={{ marginTop: '8px', borderTop: '1px solid var(--nv-line)', paddingTop: '6px' }}>
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="nv-act nv-wide"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', fontSize: '11px', fontWeight: 600 }}
          >
            <span>Advanced settings</span>
            <span>{showAdvanced ? '▴' : '▾'}</span>
          </button>
        </div>

        {showAdvanced && (
          <div style={{ marginTop: '6px' }}>
            <div className="nv-sec" style={{ marginTop: '1px' }}>Target item</div>
            <button
              className="nv-pick"
              id="nv-pick"
              aria-expanded={isListOpen}
              onClick={() => {
                setIsListOpen(prev => !prev);
                requestAnimationFrame(() => positionMenu());
              }}
            >
              <b id="nv-pick-name">{currentTarget?.name || 'Canvas'}</b><span>▾</span>
            </button>

            <div id="nv-list" className={isListOpen ? 'nv-on' : ''} role="listbox">
              {targetsList.map((t, idx) => (
                <button
                  key={t.id + '_' + idx}
                  className="nv-opt"
                  role="option"
                  aria-selected={currentIdx === idx}
                  onClick={() => {
                    selectTarget(idx);
                    if (gzRef.current.mode === 'look') {
                      setMode('move');
                    }
                    setIsListOpen(false);
                  }}
                >
                  <span className="nv-swatch"></span>
                  <span>{t.name}{t.note ? <em> {t.note}</em> : null}</span>
                </button>
              ))}
            </div>

            <div className="nv-sec">Transform</div>
            <div className="nv-num" id="nv-num" ref={numRef}></div>

            <div className="nv-sec">Tool</div>
            <div className="nv-modes">
              <button
                className="nv-mode"
                id="nv-look"
                aria-pressed={mode === 'look'}
                onClick={() => { stopTour(); setMode('look'); }}
              >
                Orbit
              </button>
              <button
                className="nv-mode"
                id="nv-move"
                aria-pressed={mode === 'move'}
                onClick={() => { stopTour(); setMode('move'); }}
              >
                Move
              </button>
              <button
                className="nv-mode"
                id="nv-turn"
                aria-pressed={mode === 'rotate'}
                onClick={() => { stopTour(); setMode('rotate'); }}
              >
                Rotate
              </button>
              <button
                className="nv-mode"
                id="nv-scale"
                aria-pressed={mode === 'scale'}
                onClick={() => { stopTour(); setMode('scale'); }}
              >
                Resize
              </button>
            </div>

            <div className="nv-sec">Rotate snap</div>
            <div className="nv-chips" id="nv-rot-steps">
              {ROT_STEPS.map(o => (
                <button
                  key={o.v}
                  className="nv-chip"
                  aria-pressed={rotStep === o.v}
                  onClick={() => {
                    gzRef.current.rotStep = o.v;
                    setRotStep(o.v);
                    saveLayout();
                    say(o.lbl === 'Free' ? 'snap off' : 'snap ' + o.lbl, true);
                  }}
                >
                  {o.lbl}
                </button>
              ))}
            </div>

            <div className="nv-sec">Move snap</div>
            <div className="nv-chips" id="nv-move-steps">
              {MOVE_STEPS.map(o => (
                <button
                  key={o.v}
                  className="nv-chip"
                  aria-pressed={moveStep === o.v}
                  onClick={() => {
                    gzRef.current.moveStep = o.v;
                    setMoveStep(o.v);
                    saveLayout();
                    say(o.lbl === 'Free' ? 'snap off' : 'snap ' + o.lbl, true);
                  }}
                >
                  {o.lbl}
                </button>
              ))}
            </div>

            <div className="nv-sec">Align</div>
            <div className="nv-acts">
              <button className="nv-act" id="nv-flat" onClick={() => setOrient(0, 0, 'aligned flat')}>
                Flat
              </button>
              <button className="nv-act" id="nv-wall" onClick={() => setOrient(90, 0, 'upright')}>
                Upright
              </button>
              <button className="nv-act" id="nv-lean" onClick={() => setOrient(45, 0, '45°')}>
                45°
              </button>
              <button className="nv-act" id="nv-face" onClick={lookAtIt}>
                Frame
              </button>
              <button className="nv-act" id="nv-undo" disabled={historyLen === 0} onClick={() => { stopTour(); undo(); }}>
                Undo
              </button>
              {targetScope === 'model' && (
                <button className="nv-act" id="nv-reset" onClick={resetTarget}>
                  Reset
                </button>
              )}
            </div>

            <button
              className="nv-act nv-wide"
              id="nv-tour"
              onClick={() => { isTourRunning ? stopTour() : startTour(); }}
            >
              {isTourRunning ? 'Stop walkthrough' : 'Walkthrough'}
            </button>
          </div>
        )}

        <div className="nv-sec" style={{ textAlign: 'center', margin: '6px 0 0' }}>
          view controls · pro
        </div>
      </div>
    </div>
  );
};
