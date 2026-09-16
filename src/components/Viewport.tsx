import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BrushSettings,
  Layer,
  ModelMetadata,
  SymmetryMode,
  ToolType,
  LightingPreset,
  LiquifySettings,
  NumpadTarget,
  TransformTargetScope,
} from '../types';
import { StudioEngine } from '../core/studioEngine';
import { StylusRadialMenu, RadialMenuPosition } from './StylusRadialMenu';
import { SelectionActionBar, SelectionInfo } from './pro/SelectionActionBar';
import { SelectionFrame } from './pro/SelectionFrame';
import {
  RotateCw,
  Maximize2,
  Compass,
  Eye,
  ShieldAlert,
  Cpu,
  Hand,
  Paintbrush,
  ZoomIn,
  ZoomOut,
  PenTool,
  Move,
  Touchpad,
  Box,
  Layers,
  Pipette,
  Trash2,
} from 'lucide-react';

interface ViewportProps {
  tool: ToolType;
  onSelectTool?: (tool: ToolType) => void;
  brushSettings: BrushSettings;
  onUpdateBrushSettings?: (settings: Partial<BrushSettings>) => void;
  activeLayer: Layer;
  layers: Layer[];
  symmetry: SymmetryMode;
  onSelectSymmetry?: (sym: SymmetryMode) => void;
  lightingPreset: LightingPreset;
  showWireframe: boolean;
  showGrid: boolean;
  onEngineReady: (engine: StudioEngine) => void;
  onColorPick?: (hex: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  cameraInteracting: boolean;
  setCameraInteracting: (val: boolean) => void;
  fingerPenMode?: boolean;
  onToggleFingerPenMode?: (enabled: boolean) => void;
  liquifySettings?: LiquifySettings;
  onOpenColorPanel?: () => void;
  onOpenNumpad?: (target: NumpadTarget) => void;
  disableContextMenu?: boolean;
  onToggleDisableContextMenu?: () => void;
  theme?: 'light' | 'dark';
  onStylusDetected?: (detected: boolean) => void;
  selectionMode?: 'pointer' | 'lasso';
  targetScope?: TransformTargetScope;
  onSelectTargetScope?: (scope: TransformTargetScope) => void;
  onSelectLayer?: (layerId: string) => void;
  onSelectModel?: (modelId: string | null) => void;
  /** What a one-finger or mouse drag on the selection does. */
  transformMode?: 'move' | 'rotate' | 'look' | 'scale';
  /** Auto select: a tap decides for itself what it picked, and a tap on nothing lets go. */
  autoSelect?: boolean;
  /** Keeps a model that was dragged downwards sitting on the ground instead of sinking in. */
  keepModelsOnGround?: boolean;
  /** Shows the selection frame outside the Select tool, e.g. while the controller is in Move. */
  showSelectionFrame?: boolean;
}

/** One pointer gesture of the Select tool, from press to release. */
type SelectGesture =
  | { kind: 'idle' }
  | { kind: 'pending'; pointerId: number; startX: number; startY: number; lastX: number; lastY: number; onSelection: boolean }
  | { kind: 'transform'; pointerId: number; lastX: number; lastY: number; action: 'move' | 'turn' | 'scale' }
  | { kind: 'camera'; pointerId: number; lastX: number; lastY: number; pan: boolean }
  | { kind: 'lasso'; pointerId: number; points: { x: number; y: number }[] }
  | { kind: 'pinch'; onSelection: boolean; lastDist: number; lastAngle: number; lastMidX: number; lastMidY: number }
  /** A pinch ended while a finger is still down; ignore it until it lifts. */
  | { kind: 'finished' };

const DRAG_THRESHOLD_MOUSE = 5;
const DRAG_THRESHOLD_TOUCH = 10;
/** How close a tap must land to a thin line to pick it. */
const PICK_RADIUS_MOUSE = 14;
const PICK_RADIUS_TOUCH = 28;

export const Viewport: React.FC<ViewportProps> = ({
  tool,
  onSelectTool,
  brushSettings,
  onUpdateBrushSettings,
  activeLayer,
  layers,
  symmetry,
  onSelectSymmetry,
  lightingPreset,
  showWireframe,
  showGrid,
  onEngineReady,
  onColorPick,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  cameraInteracting,
  setCameraInteracting,
  fingerPenMode = true,
  onToggleFingerPenMode,
  liquifySettings,
  onOpenColorPanel,
  onOpenNumpad,
  disableContextMenu = false,
  onToggleDisableContextMenu,
  theme = 'dark',
  onStylusDetected,
  selectionMode = 'pointer',
  targetScope: targetScopeProp,
  onSelectTargetScope,
  onSelectLayer,
  onSelectModel,
  transformMode = 'move',
  showSelectionFrame = false,
  autoSelect = true,
  keepModelsOnGround = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<StudioEngine | null>(null);
  const [engineInstance, setEngineInstance] = useState<StudioEngine | null>(null);

  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const targetScope: TransformTargetScope = targetScopeProp ?? 'active_layer';
  const isSelectTool = tool === 'pointer' || tool === 'select';
  const selectGestureRef = useRef<SelectGesture>({ kind: 'idle' });
  const selectPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const [isLassoVisible, setIsLassoVisible] = useState(false);
  const lassoPathRef = useRef<SVGPolylineElement | null>(null);
  const wheelTransformTimerRef = useRef<number | null>(null);
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const [touchDist, setTouchDist] = useState<number | null>(null);
  const [isStylusDetected, setIsStylusDetected] = useState<boolean>(() => {
    try {
      return localStorage.getItem('remix3d.hasStylus') === 'true';
    } catch {
      return false;
    }
  });
  const [isPanMode, setIsPanMode] = useState<boolean>(false);

  // Floating Navigation Pod Auto-Hide State
  const [isNavPodVisible, setIsNavPodVisible] = useState<boolean>(false);
  const navPodTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showNavPod = (durationMs: number = 3000) => {
    setIsNavPodVisible(true);
    if (navPodTimerRef.current) {
      clearTimeout(navPodTimerRef.current);
    }
    navPodTimerRef.current = setTimeout(() => {
      setIsNavPodVisible(false);
    }, durationMs);
  };

  // Radial context menu state anchored at stylus tip
  const [isRadialMenuOpen, setIsRadialMenuOpen] = useState<boolean>(false);
  const [radialMenuPos, setRadialMenuPos] = useState<RadialMenuPosition | null>(null);
  const lastStylusHoverPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3-Finger Gesture Feedback Toast
  const [gestureToast, setGestureToast] = useState<{ title: string; subtitle?: string } | null>(null);
  const gestureToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const lastPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastNormalizedPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPointerDown = useRef<boolean>(false);
  const strokeStartTime = useRef<number>(0);
  const rightClickDragDistance = useRef<number>(0);
  const isRightClickDown = useRef<boolean>(false);

  // 1. Hardware-Isolated Stylus State & Contact Protection
  const penActiveRef = useRef<boolean>(false);
  const penInProximityRef = useRef<boolean>(false);
  const activePenIdRef = useRef<number | null>(null);
  const isPenDrawingRef = useRef<boolean>(false);
  const lastPenEventTimeRef = useRef<number>(0);
  const [isStylusLockEnabled, setIsStylusLockEnabled] = useState<boolean>(true);

  const cursorSvgRef = useRef<SVGSVGElement | null>(null);
  const cursorGroupRef = useRef<SVGGElement | null>(null);
  const [rulerDrag, setRulerDrag] = useState<{ startX: number; startY: number; currentX: number; currentY: number; active: boolean } | null>(null);

  // Selection action bar: follows the shared selection while the Select tool is on.
  const [activeSelection, setActiveSelection] = useState<SelectionInfo | null>(null);
  const targetScopeRef = useRef(targetScope);
  targetScopeRef.current = targetScope;
  // A tap that picks something also changes "what to select" in App, but that
  // only lands on the next render. The rest of the gesture has to move the
  // thing that was just picked, so the new scope is remembered here and used
  // until the prop catches up.
  const pendingScopeRef = useRef<TransformTargetScope | null>(null);
  const scopeNow = (): TransformTargetScope => pendingScopeRef.current ?? targetScopeRef.current;
  const setScopeNow = (scope: TransformTargetScope) => {
    pendingScopeRef.current = scope;
    onSelectTargetScope?.(scope);
  };
  useEffect(() => {
    pendingScopeRef.current = null;
  }, [targetScope]);
  const isSelectToolRef = useRef(isSelectTool);
  isSelectToolRef.current = isSelectTool;

  useEffect(() => {
    const refresh = () => {
      const engine = engineRef.current;
      const scope = targetScopeRef.current;
      if (!engine || !isSelectToolRef.current || scope === 'all' || scope === 'guide') {
        setActiveSelection(null);
        return;
      }
      const summary = engine.getSelectionSummary(scope);
      setActiveSelection(
        summary.isEmpty || (scope === 'model' && (!engine.getActiveSelectedModelId() || engine.isCanvasSelected()))
          ? null
          : { type: scope === 'model' ? 'model' : 'stroke', id: scope, name: summary.label }
      );
    };
    refresh();
    window.addEventListener('STUDIO_SELECTION_TARGET_CHANGED', refresh);
    return () => window.removeEventListener('STUDIO_SELECTION_TARGET_CHANGED', refresh);
  }, [isSelectTool, targetScope, engineInstance]);

  const handleCloneSelection = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const count = engine.cloneSelection(targetScopeRef.current);
    if (count > 0) {
      triggerHaptic(25);
      showGestureToast('Copied', targetScopeRef.current === 'model' ? 'Model duplicated' : `${count} line${count === 1 ? '' : 's'} duplicated`);
    }
  }, []);

  const handleDeleteSelection = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const count = engine.deleteSelection(targetScopeRef.current);
    if (count > 0) {
      triggerHaptic(30);
      showGestureToast('Deleted', 'Undo brings it back');
    }
  }, []);

  const handleResetSelectionTransform = useCallback(() => {
    if (!engineRef.current) return;
    if (!engineRef.current.resetPickedModel()) {
      showGestureToast('Already in place', 'This model hasn’t been moved');
      return;
    }
    triggerHaptic(15);
    showGestureToast('Model put back', 'Undo moves it again');
  }, []);

  const handleDeselect = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setSelectedStrokes([]);
    engine.setActiveSelectedModel(null);
    onSelectModel?.(null);
    onSelectTargetScope?.('none');
    onSelectTool?.('brush');
  }, [onSelectModel, onSelectTool, onSelectTargetScope]);

  // Delete / Backspace removes the selection, only while selecting.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || !isSelectToolRef.current) return;
      e.preventDefault();
      handleDeleteSelection();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelection]);

  // 2. Hardware-Isolated Touch Pointer Map (Strictly segregated from stylus)
  const touchPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const lastTouchMidpointRef = useRef<{ x: number; y: number } | null>(null);

  // Strict Palm Rejection & Drawing Intent Locking:
  // When a drawing stroke is active (pen or intentional finger draw), reject incoming multi-touch
  // and maintain a 150ms buffer after stroke completion before enabling camera rotation.
  const activeDrawingPointerIdRef = useRef<number | null>(null);
  const drawingIntentUntilRef = useRef<number>(0);

  /**
   * Reads the first two active touch points into a fixed pair without allocating.
   * Array.from() on the pointer map ran on every sample of every pinch gesture.
   */
  const touchPairScratch = useRef<[{ x: number; y: number }, { x: number; y: number }]>([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);

  const readTouchPair = useCallback((): boolean => {
    let i = 0;
    for (const pt of touchPointersRef.current.values()) {
      touchPairScratch.current[i].x = pt.x;
      touchPairScratch.current[i].y = pt.y;
      if (++i === 2) return true;
    }
    return false;
  }, []);

  // 3-Finger Gesture Tracking (Touch channel only)
  const threeFingerStartY = useRef<number | null>(null);
  const threeFingerStartX = useRef<number | null>(null);
  const threeFingerStartTime = useRef<number>(0);
  const threeFingerInitialFov = useRef<number>(45);
  const lastToastFovRef = useRef<number>(-1);

  const showGestureToast = (title: string, subtitle?: string) => {
    if (gestureToastTimerRef.current) {
      clearTimeout(gestureToastTimerRef.current);
    }
    setGestureToast({ title, subtitle });
    gestureToastTimerRef.current = setTimeout(() => {
      setGestureToast(null);
    }, 1500);
  };

  const triggerHaptic = (ms: number = 15) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch (_) {}
  };

  // Initialize Three.js Studio Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new StudioEngine(containerRef.current);
    engineRef.current = engine;    setEngineInstance(engine);

    engine.onMetadataUpdate = (m) => setMetadata(m);

    onEngineReady(engine);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          engine.resize(width, height);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      if (navPodTimerRef.current) clearTimeout(navPodTimerRef.current);
      resizeObserver.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Sync Layers with engine
  useEffect(() => {
    engineRef.current?.syncLayers(layers);
  }, [layers]);

  // Sync Active Layer
  useEffect(() => {
    engineRef.current?.setActiveLayer(activeLayer.id);
  }, [activeLayer.id]);

  // Sync Lighting Preset
  useEffect(() => {
    engineRef.current?.setLightingPreset(lightingPreset);
  }, [lightingPreset]);

  // Sync Theme
  useEffect(() => {
    engineRef.current?.setTheme(theme);
  }, [theme]);

  // Sync Wireframe & Grid
  useEffect(() => {
    engineRef.current?.setWireframe(showWireframe);
  }, [showWireframe]);

  useEffect(() => {
    engineRef.current?.setGrid(showGrid);
  }, [showGrid]);

  /**
   * Cached viewport rect.
   *
   * getBoundingClientRect() forces a synchronous layout. It was previously called
   * two to three times per pointer-move (coordinate conversion, nav-pod proximity
   * check, coalesced-event conversion), which on a tablet at stylus sample rates
   * is thousands of forced layouts per second. The rect only changes on resize,
   * scroll or orientation change, so it is cached and invalidated on those.
   */
  const cachedRectRef = useRef<DOMRect | null>(null);

  const refreshRect = useCallback((): DOMRect | null => {
    if (!containerRef.current) return null;
    cachedRectRef.current = containerRef.current.getBoundingClientRect();
    return cachedRectRef.current;
  }, []);

  const getRect = useCallback((): DOMRect | null => {
    return cachedRectRef.current || refreshRect();
  }, [refreshRect]);

  useEffect(() => {
    const invalidate = () => {
      cachedRectRef.current = null;
    };
    window.addEventListener('resize', invalidate);
    window.addEventListener('scroll', invalidate, true);
    window.addEventListener('orientationchange', invalidate);
    return () => {
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('scroll', invalidate, true);
      window.removeEventListener('orientationchange', invalidate);
    };
  }, []);

  // Reused output for coordinate conversion: this runs on every pointer sample.
  const normalizedScratch = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const getSafeNormalizedPoint = (clientX: number, clientY: number, rect: DOMRect) => {
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY) || rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    // Android WebView can briefly emit stale coalesced coordinates while its
    // visual viewport is changing. Do not feed those outliers into a 3D stroke.
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1.02 || Math.abs(y) > 1.02) {
      return null;
    }
    return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
  };

  // Convert client pointer coordinate to normalized device coordinates (-1 to 1).
  // The returned object is reused - read x/y immediately, do not retain it.
  const getNormalizedCoords = (e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
    const out = normalizedScratch.current;
    const rect = getRect();
    if (!rect) {
      out.x = 0;
      out.y = 0;
      return out;
    }
    // Pointer capture may keep a stroke alive after a finger leaves the canvas.
    // Clamp that final sample to the edge instead of letting a stale mobile
    // coordinate create an enormous world-space segment.
    const rawX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const rawY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    out.x = Number.isFinite(rawX) ? Math.max(-1, Math.min(1, rawX)) : lastNormalizedPos.current.x;
    out.y = Number.isFinite(rawY) ? Math.max(-1, Math.min(1, rawY)) : lastNormalizedPos.current.y;
    return out;
  };

  useEffect(() => {
    const onNavActive = (e: CustomEvent<{ active: boolean }>) => {
      if (e.detail?.active) {
        // Drop background viewport camera touch orbit gestures while navigator is being used,
        // but preserve active pen / brush drawing so the user can paint freely.
        touchPointersRef.current.clear();
        setIsOrbiting(false);
      }
    };
    window.addEventListener('NAVIGATOR_ACTIVE', onNavActive as EventListener);
    return () => window.removeEventListener('NAVIGATOR_ACTIVE', onNavActive as EventListener);
  }, []);

  const getFovDescription = (fov: number): string => {
    if (fov <= 25) return 'Zoomed in, flatter look';
    if (fov <= 40) return 'Close-up';
    if (fov <= 55) return 'Natural view';
    if (fov <= 75) return 'Wide view';
    return 'Extra-wide view';
  };

  // =========================================================================
  // SELECT TOOL: tap, lasso, and direct move / resize / turn
  // Mouse, finger and pen share one path. Only right / middle / Alt mouse
  // drags fall through to the camera code below.
  // =========================================================================

  const toContainerPoint = (clientX: number, clientY: number) => {
    const rect = getRect();
    return rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: clientX, y: clientY };
  };

  const isOverSelection = (engine: StudioEngine, clientX: number, clientY: number, pad: number) => {
    const scope = scopeNow();
    if (engine.getSelectionSummary(scope).isEmpty) return false;
    const r = engine.getSelectionScreenRect(scope);
    if (!r) return false;
    const p = toContainerPoint(clientX, clientY);
    return p.x >= r.x - pad && p.x <= r.x + r.width + pad && p.y >= r.y - pad && p.y <= r.y + r.height + pad;
  };

  /**
   * One finger always moves. Turning and resizing are gestures rather than
   * modes: two fingers twist to turn and pinch to resize, and on a mouse it is
   * Shift-drag to turn and the wheel to resize. Nothing to switch on first.
   */
  const dragActionForMode = (shiftKey: boolean): 'move' | 'turn' | 'scale' => (shiftKey ? 'turn' : 'move');

  /**
   * Picks what is under a tap and makes it the selection.
   *
   * With Auto on (the normal way to work) the tap decides for itself: a line
   * hands you the whole layer it is drawn on, the canvas or a model hands you
   * that object, and a tap on empty space lets go of everything. Pinning a row
   * in "What to select" by hand turns that off and keeps the old behaviour,
   * where a tap can only pick the kind of thing that is pinned.
   */
  const selectAtPoint = (engine: StudioEngine, clientX: number, clientY: number, isTouch: boolean, additive: boolean): boolean => {
    const rect = getRect();
    if (!rect) return false;
    const point = getSafeNormalizedPoint(clientX, clientY, rect);
    if (!point) return false;
    const scope = scopeNow();
    const hit = engine.pickSelectable(point.x, point.y, isTouch ? PICK_RADIUS_TOUCH : PICK_RADIUS_MOUSE);

    // Pinned to "Everything": the whole scene moves as one, so a tap inside it
    // never changes what is picked.
    if (!autoSelect && scope === 'all') return hit !== null;

    if (hit?.type === 'stroke') {
      // Tapping single lines together is only for the pinned "Lines" row. In
      // Auto a tap hands over the whole layer, which is what a drawing is.
      if (!autoSelect && scope === 'selected_strokes') {
        const current = engine.getSelectedStrokeIds();
        const next = additive
          ? current.includes(hit.id) ? current.filter((id) => id !== hit.id) : [...current, hit.id]
          : [hit.id];
        engine.setSelectedStrokes(next);
        showGestureToast(`${next.length} line${next.length === 1 ? '' : 's'} picked`, 'Drag to move it');
      } else {
        engine.setSelectedStrokes([]);
        engine.setActiveSelectedModel(null);
        onSelectModel?.(null);
        engine.setActiveLayer(hit.layerId);
        onSelectLayer?.(hit.layerId);
        setScopeNow('active_layer');
        const layerName = layers.find((l) => l.id === hit.layerId)?.name || 'Layer';
        showGestureToast(`${layerName} selected`, 'Drag to move the whole layer');
      }
      triggerHaptic(15);
      return true;
    }

    if (hit?.type === 'model' || hit?.type === 'canvas') {
      engine.setSelectedStrokes([]);
      engine.setActiveSelectedModel(hit.id);
      onSelectModel?.(hit.id);
      setScopeNow('model');
      showGestureToast(
        hit.type === 'canvas' ? 'Canvas selected' : '3D model selected',
        hit.type === 'canvas' ? 'Drag to move it · lines stay put' : 'Drag to move it'
      );
      triggerHaptic(15);
      return true;
    }

    // Auto deselect: a tap on empty space lets go of everything, leaving the
    // next tap free to pick anything. With a row pinned by hand the pin stays
    // put and only the picked lines and model are dropped.
    const hadSomething = !engine.getSelectionSummary(scope).isEmpty;
    engine.setSelectedStrokes([]);
    if (engine.getActiveSelectedModelId()) {
      engine.setActiveSelectedModel(null);
      onSelectModel?.(null);
    }
    if (autoSelect && scope !== 'none') {
      setScopeNow('none');
      if (hadSomething) {
        triggerHaptic(8);
        showGestureToast('Let go', 'Tap anything to pick it');
      }
    }
    return false;
  };

  const startSelectTransform = (engine: StudioEngine, pointerId: number, x: number, y: number, action: 'move' | 'turn' | 'scale') => {
    engine.beginTransform(scopeNow());
    selectGestureRef.current = { kind: 'transform', pointerId, lastX: x, lastY: y, action };
  };

  /** Moves the selection so the point under (fromX, fromY) ends up under (toX, toY). */
  const dragSelectionBetween = (engine: StudioEngine, fromX: number, fromY: number, toX: number, toY: number) => {
    const rect = getRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const ndc = (x: number, y: number) => [((x - rect.left) / rect.width) * 2 - 1, -(((y - rect.top) / rect.height) * 2 - 1)];
    const [fx, fy] = ndc(fromX, fromY);
    const [tx, ty] = ndc(toX, toY);
    engine.dragSelection(fx, fy, tx, ty, scopeNow());
  };

  const applySelectTransform = (
    engine: StudioEngine,
    action: 'move' | 'turn' | 'scale',
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    if (action === 'move') dragSelectionBetween(engine, fromX, fromY, toX, toY);
    else if (action === 'turn') engine.rotateTrackball(toX - fromX, toY - fromY, scopeNow());
    else engine.scaleAxis('uniform', Math.exp(-(toY - fromY) * 0.006), scopeNow(), false);
  };

  const pinchValues = () => {
    const pts: { x: number; y: number }[] = Array.from(selectPointersRef.current.values());
    const [a, b] = pts;
    return {
      dist: Math.hypot(b.x - a.x, b.y - a.y),
      angle: Math.atan2(b.y - a.y, b.x - a.x),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2,
    };
  };

  const updateLassoPath = (points: { x: number; y: number }[]) => {
    lassoPathRef.current?.setAttribute('points', points.map((p) => `${p.x},${p.y}`).join(' '));
  };

  const finishGesture = (engine: StudioEngine) => {
    const g = selectGestureRef.current;
    if (g.kind === 'transform' || (g.kind === 'pinch' && g.onSelection)) {
      // What people expect of a thing on a floor: let go and it sits on the
      // floor. This only ever lifts, so a model raised into the air stays up.
      // The drawing canvas is a surface you place where you like, so it is
      // never pulled back to the ground; only real models are.
      if (keepModelsOnGround && scopeNow() === 'model' && !engine.isCanvasSelected() && engine.liftOntoGround('model')) {
        showGestureToast('Set down on the ground', 'Undo puts it back');
      }
      engine.endTransform();
    }
    if (g.kind === 'lasso') setIsLassoVisible(false);
  };

  const handleSelectPointerDown = (e: React.PointerEvent<HTMLDivElement>, engine: StudioEngine): boolean => {
    if (e.pointerType === 'mouse' && (e.button === 1 || e.button === 2 || e.altKey || isPanMode)) return false;
    const isTouch = e.pointerType === 'touch';
    if (e.pointerType === 'pen') lastPenEventTimeRef.current = Date.now();
    // Palm rejection: a finger landing while the pen is down, or just after, is
    // ignored. Time-based only: the hover flag can stay set long after the pen
    // is put away, which would make every finger tap do nothing.
    if (isTouch && Date.now() - lastPenEventTimeRef.current < 500) return true;

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
    selectPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (selectPointersRef.current.size === 2) {
      const g = selectGestureRef.current;
      const onSelection =
        (g.kind === 'pending' && g.onSelection) || (g.kind === 'transform');
      if (g.kind === 'lasso') setIsLassoVisible(false);
      if (onSelection && g.kind !== 'transform') engine.beginTransform(scopeNow());
      const v = pinchValues();
      selectGestureRef.current = { kind: 'pinch', onSelection, lastDist: v.dist, lastAngle: v.angle, lastMidX: v.midX, lastMidY: v.midY };
      return true;
    }
    if (selectPointersRef.current.size > 2) return true;

    const isPen = e.pointerType === 'pen';
    const onSelection = !isPen && isOverSelection(engine, e.clientX, e.clientY, isTouch ? 16 : 6);
    if (selectionMode === 'lasso' && (!onSelection || isPen)) {
      const p = toContainerPoint(e.clientX, e.clientY);
      selectGestureRef.current = { kind: 'lasso', pointerId: e.pointerId, points: [p] };
      updateLassoPath([p]);
      setIsLassoVisible(true);
      return true;
    }
    selectGestureRef.current = {
      kind: 'pending',
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      onSelection,
    };
    return true;
  };

  const handleSelectPointerMove = (e: React.PointerEvent<HTMLDivElement>, engine: StudioEngine): boolean => {
    const g = selectGestureRef.current;
    const tracked = selectPointersRef.current.get(e.pointerId);
    if (!tracked) {
      // Hover: show a move cursor over the selection.
      if (e.pointerType === 'mouse' && containerRef.current) {
        containerRef.current.style.cursor = isOverSelection(engine, e.clientX, e.clientY, 6) ? 'move' : '';
      }
      return g.kind !== 'idle';
    }
    tracked.x = e.clientX;
    tracked.y = e.clientY;

    if (g.kind === 'pinch') {
      if (selectPointersRef.current.size < 2) return true;
      const v = pinchValues();
      const dMidX = v.midX - g.lastMidX;
      const dMidY = v.midY - g.lastMidY;
      if (g.onSelection) {
        if (g.lastDist > 4 && v.dist > 4) engine.scaleAxis('uniform', Math.max(0.5, Math.min(2, v.dist / g.lastDist)), scopeNow(), false);
        let dAngle = v.angle - g.lastAngle;
        while (dAngle > Math.PI) dAngle -= Math.PI * 2;
        while (dAngle < -Math.PI) dAngle += Math.PI * 2;
        engine.rotateAroundViewAxis(dAngle, scopeNow());
        dragSelectionBetween(engine, g.lastMidX, g.lastMidY, v.midX, v.midY);
      } else {
        engine.zoom((g.lastDist - v.dist) * 2.2);
        engine.pan(dMidX * 1.2, dMidY * 1.2);
      }
      g.lastDist = v.dist;
      g.lastAngle = v.angle;
      g.lastMidX = v.midX;
      g.lastMidY = v.midY;
      return true;
    }

    if (g.kind === 'lasso' && g.pointerId === e.pointerId) {
      const p = toContainerPoint(e.clientX, e.clientY);
      const last = g.points[g.points.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) >= 4) {
        g.points.push(p);
        updateLassoPath(g.points);
      }
      return true;
    }

    if (g.kind === 'pending' && g.pointerId === e.pointerId) {
      const isPen = e.pointerType === 'pen';
      const threshold = isPen ? 6 : (e.pointerType === 'touch' ? DRAG_THRESHOLD_TOUCH : DRAG_THRESHOLD_MOUSE);
      if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < threshold) return true;

      // Stylus on tablet: DO NOT move/transform the selection. Stylus is dedicated exclusively to selecting.
      if (isPen) {
        const p1 = toContainerPoint(g.startX, g.startY);
        const p2 = toContainerPoint(e.clientX, e.clientY);
        selectGestureRef.current = { kind: 'lasso', pointerId: e.pointerId, points: [p1, p2] };
        updateLassoPath([p1, p2]);
        setIsLassoVisible(true);
        return true;
      }

      let grab = g.onSelection;
      // Grab-and-drag: pressing on something new picks it and moves it in one motion.
      if (!grab && (autoSelect || targetScope !== 'all')) {
        grab = selectAtPoint(engine, g.startX, g.startY, e.pointerType === 'touch', false);
      }
      if (grab && !engine.getSelectionSummary(scopeNow()).isEmpty) {
        startSelectTransform(engine, e.pointerId, g.startX, g.startY, dragActionForMode(e.shiftKey));
      } else {
        selectGestureRef.current = {
          kind: 'camera',
          pointerId: e.pointerId,
          lastX: g.startX,
          lastY: g.startY,
          pan: e.shiftKey || e.buttons === 4,
        };
      }
    }

    const active = selectGestureRef.current;
    if (active.kind === 'transform' && active.pointerId === e.pointerId) {
      applySelectTransform(engine, active.action, active.lastX, active.lastY, e.clientX, e.clientY);
      active.lastX = e.clientX;
      active.lastY = e.clientY;
      return true;
    }
    if (active.kind === 'camera' && active.pointerId === e.pointerId) {
      const dx = e.clientX - active.lastX;
      const dy = e.clientY - active.lastY;
      if (active.pan) engine.pan(dx * 1.2, dy * 1.2);
      else engine.orbit(dx * 1.2, dy * 1.2);
      active.lastX = e.clientX;
      active.lastY = e.clientY;
      return true;
    }
    return true;
  };

  const handleSelectPointerUp = (e: React.PointerEvent<HTMLDivElement>, engine: StudioEngine): boolean => {
    if (!selectPointersRef.current.has(e.pointerId)) return false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    selectPointersRef.current.delete(e.pointerId);
    const g = selectGestureRef.current;
    const remaining = selectPointersRef.current.size;

    if (g.kind === 'pinch') {
      if (remaining < 2) {
        finishGesture(engine);
        selectGestureRef.current = remaining === 0 ? { kind: 'idle' } : { kind: 'finished' };
      }
      return true;
    }
    if (remaining > 0 && g.kind === 'finished') return true;

    if (g.kind === 'pending' && g.pointerId === e.pointerId && e.type !== 'pointercancel') {
      selectAtPoint(engine, g.startX, g.startY, e.pointerType === 'touch' || e.pointerType === 'pen', e.shiftKey);
    } else if (g.kind === 'lasso' && g.pointerId === e.pointerId) {
      const lassoScope = scopeNow() === 'model' ? 'model' : 'selected_strokes';
      const result = g.points.length >= 3 ? engine.lassoSelect(g.points, lassoScope) : { count: 0, type: 'none' as const };
      if (result.count > 0) {
        if (lassoScope === 'selected_strokes') setScopeNow('selected_strokes');
        else onSelectModel?.((result as { ids: string[] }).ids[0] ?? null);
        showGestureToast(
          lassoScope === 'model' ? '3D model picked' : `${result.count} line${result.count === 1 ? '' : 's'} picked`,
          'Drag inside the frame to move'
        );
        triggerHaptic(20);
      } else {
        showGestureToast('Nothing inside the loop', 'Draw a loop around the lines you want');
      }
    } else if (g.kind === 'transform') {
      triggerHaptic(10);
    }

    finishGesture(engine);
    if (remaining === 0) selectGestureRef.current = { kind: 'idle' };
    return true;
  };

  // Leaving the Select tool mid-gesture must not leave a transform open.
  useEffect(() => {
    if (isSelectTool) return;
    const engine = engineRef.current;
    if (engine) finishGesture(engine);
    selectGestureRef.current = { kind: 'idle' };
    selectPointersRef.current.clear();
    if (containerRef.current) containerRef.current.style.cursor = '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelectTool]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isRadialMenuOpen) return;
    e.preventDefault();
    if ((window as any).__NAVIGATOR_ACTIVE__ && e.pointerType !== 'pen') return;
    refreshRect();
    const engine = engineRef.current;
    if (!engine) return;
    if (isSelectTool && handleSelectPointerDown(e, engine)) return;

    // =========================================================================
    // 1. HARDWARE BRANCH: STYLUS / PEN (STRICTLY DRAWING / MANIPULATION)
    // =========================================================================
    if (e.pointerType === 'pen') {
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch (_) {}

      lastPenEventTimeRef.current = Date.now();
      penActiveRef.current = true;
      penInProximityRef.current = true;
      activePenIdRef.current = e.pointerId;
      touchPointersRef.current.clear(); // Drop any concurrent touch/palm touches
      setIsOrbiting(false); // Hard guarantee: stylus never triggers orbit

      setIsStylusDetected(true);
      try {
        localStorage.setItem('remix3d.hasStylus', 'true');
      } catch (_) {}
      onStylusDetected?.(true);
      lastStylusHoverPos.current.x = e.clientX;
      lastStylusHoverPos.current.y = e.clientY;

      // S-Pen / Stylus Hardware Barrel / Side-Button Event (button 2 or buttons 2 or button 5 or buttons 32)
      const isStylusSideButton =
        e.button === 2 || e.buttons === 2 || e.button === 5 || e.buttons === 32;

      if (isStylusSideButton) {
        if (!disableContextMenu) {
          triggerHaptic(20);
          setRadialMenuPos({ x: e.clientX, y: e.clientY });
          setIsRadialMenuOpen(true);
        }
        return;
      }

      const coords = getNormalizedCoords(e);
      isPenDrawingRef.current = true;
      isPointerDown.current = true;
      activeDrawingPointerIdRef.current = e.pointerId;
      strokeStartTime.current = performance.now();
      lastNormalizedPos.current.x = coords.x;
      lastNormalizedPos.current.y = coords.y;
      lastPointerPos.current.x = e.clientX;
      lastPointerPos.current.y = e.clientY;

      // Ruler / Straight Line Drag Setup
      if (brushSettings.straightLineMode) {
        setRulerDrag({
          startX: e.clientX,
          startY: e.clientY,
          currentX: e.clientX,
          currentY: e.clientY,
          active: true,
        });
      }

      // Brush DNA Picker tool (Clones complete 3D stroke DNA and returns to Brush mode)
      if (tool === 'brush_picker') {
        const dna = engine.sampleHolisticDNA(coords.x, coords.y, e.clientX, e.clientY);
        if (dna) {
          if (onUpdateBrushSettings) {
            onUpdateBrushSettings({
              color: dna.colorHex,
              size: dna.size,
              opacity: dna.opacity,
              roughness: dna.roughness,
              metalness: dna.metalness,
              emissiveIntensity: dna.emissiveIntensity,
              materialType: dna.materialType,
              profile: dna.profile,
              patternType: dna.patternType,
              patternScale: dna.patternScale,
              patternIntensity: dna.patternIntensity,
              shaderEffect: dna.shaderEffect,
            });
          }
          if (onColorPick) {
            onColorPick(dna.colorHex);
          }
          onSelectTool?.('brush');
          triggerHaptic(30);
          showGestureToast(
            'Brush look copied',
            `${dna.colorHex} • back to Brush`
          );
        }
        return;
      }

      // Paint & Finish Eyedropper tool
      if (tool === 'paint_picker' || tool === 'eyedropper') {
        const sampledColor = engine.sampleColorAtScreen(coords.x, coords.y, e.clientX, e.clientY);
        if (sampledColor) {
          if (onColorPick) {
            onColorPick(sampledColor);
          }
          // Check if a 3D model mesh with material was hit to sample PBR finish
          const modelHit = engine.raycastModel(coords.x, coords.y);
          if (modelHit && modelHit.hit && modelHit.mesh && onUpdateBrushSettings) {
            const m = modelHit.mesh.material as any;
            if (m) {
              onUpdateBrushSettings({
                color: sampledColor,
                roughness: typeof m.roughness === 'number' ? m.roughness : brushSettings.roughness,
                metalness: typeof m.metalness === 'number' ? m.metalness : brushSettings.metalness,
              });
            }
          } else if (onUpdateBrushSettings) {
            onUpdateBrushSettings({ color: sampledColor });
          }
          triggerHaptic(25);
          showGestureToast('Paint Sampled', sampledColor.toUpperCase());
        }
        return;
      }

      // Liquify Tool
      if (tool === 'liquify') {
        engine.startLiquifySession();
        return;
      }

      // Standard Painting action
      const pressure = e.pressure > 0 ? e.pressure : 1.0;
      engine.startStroke(coords.x, coords.y, brushSettings, tool, activeLayer, pressure, symmetry);
      return;
    }

    // =========================================================================
    // 2. HARDWARE BRANCH: TOUCH (CAMERA NAVIGATION OR FINGER DRAWING)
    // =========================================================================
    if (e.pointerType === 'touch') {
      const now = Date.now();
      const isPenNear =
        penActiveRef.current ||
        penInProximityRef.current ||
        activePenIdRef.current !== null ||
        (now - lastPenEventTimeRef.current < 1200);

      // Hardware Palm Rejection: If pen is active, in proximity, or recently used, drop touch
      if (isPenNear || isPenDrawingRef.current) {
        return;
      }

      // Drawing Intent Locking: Only drop touch if STYLUS/PEN was actively drawing
      if (
        isStylusDetected &&
        (activeDrawingPointerIdRef.current !== null || performance.now() < drawingIntentUntilRef.current)
      ) {
        return;
      }

      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch (_) {}

      touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const touchCount = touchPointersRef.current.size;

      // 3-Finger Gesture: track start coordinates for dynamic FOV / Projection shift
      if (touchCount === 3) {
        if (isPointerDown.current) {
          isPointerDown.current = false;
          engine.cancelStroke();
        }
        threeFingerStartY.current = e.clientY;
        threeFingerStartX.current = e.clientX;
        threeFingerStartTime.current = performance.now();
        threeFingerInitialFov.current = engine.getFov();
        setIsOrbiting(false);
        return;
      }

      // 2-Finger Multi-Touch: Pinch Zoom & Pan
      if (touchCount === 2) {
        if (isPointerDown.current) {
          isPointerDown.current = false;
          engine.cancelStroke();
        }
        if (readTouchPair()) {
          const [p0, p1] = touchPairScratch.current;
          initialPinchDistRef.current = Math.hypot(p1.x - p0.x, p1.y - p0.y);
          lastTouchMidpointRef.current = {
            x: (p0.x + p1.x) / 2,
            y: (p0.y + p1.y) / 2,
          };
        }
        setIsOrbiting(false);
        return;
      }

      // 1-Finger Touch: Selection, Finger Drawing (if fingerPenMode is ON and NO stylus is detected) or Camera Orbit
      if (touchCount === 1) {
        const coords = getNormalizedCoords(e);

        // STRICT HARDWARE LOCK: If a stylus is detected on the device,
        // touch is strictly reserved for camera navigation (orbiting) and never draws,
        // preventing accidental strokes from finger/palm contact.
        const allowFingerDraw = fingerPenMode && !isStylusDetected;

        if (allowFingerDraw) {
          isPointerDown.current = true;
          strokeStartTime.current = performance.now();
          lastNormalizedPos.current.x = coords.x;
          lastNormalizedPos.current.y = coords.y;
          lastPointerPos.current.x = e.clientX;
          lastPointerPos.current.y = e.clientY;
          engine.startStroke(coords.x, coords.y, brushSettings, tool, activeLayer, 1.0, symmetry);
          setIsOrbiting(false);
        } else {
          setIsOrbiting(true);
          lastPointerPos.current.x = e.clientX;
          lastPointerPos.current.y = e.clientY;
        }
      }
      return;
    }

    // =========================================================================
    // 3. HARDWARE BRANCH: MOUSE (DESKTOP WORKFLOW)
    // =========================================================================
    if (e.pointerType === 'mouse') {
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch (_) {}

      if (e.button === 2) {
        isRightClickDown.current = true;
        rightClickDragDistance.current = 0;
      }

      const coords = getNormalizedCoords(e);
      const isCameraAction =
        e.button === 2 ||
        e.button === 1 ||
        e.altKey ||
        cameraInteracting ||
        isPanMode;

      if (isCameraAction) {
        setIsOrbiting(true);
        lastPointerPos.current.x = e.clientX;
        lastPointerPos.current.y = e.clientY;
        return;
      }

      isPointerDown.current = true;
      strokeStartTime.current = performance.now();
      lastNormalizedPos.current.x = coords.x;
      lastNormalizedPos.current.y = coords.y;
      lastPointerPos.current.x = e.clientX;
      lastPointerPos.current.y = e.clientY;

      // Ruler / Straight Line Drag Setup
      if (brushSettings.straightLineMode) {
        setRulerDrag({
          startX: e.clientX,
          startY: e.clientY,
          currentX: e.clientX,
          currentY: e.clientY,
          active: true,
        });
      }

      if (tool === 'brush_picker') {
        const dna = engine.sampleHolisticDNA(coords.x, coords.y, e.clientX, e.clientY);
        if (dna) {
          if (onUpdateBrushSettings) {
            onUpdateBrushSettings({
              color: dna.colorHex,
              size: dna.size,
              opacity: dna.opacity,
              roughness: dna.roughness,
              metalness: dna.metalness,
              emissiveIntensity: dna.emissiveIntensity,
              materialType: dna.materialType,
              profile: dna.profile,
              patternType: dna.patternType,
              patternScale: dna.patternScale,
              patternIntensity: dna.patternIntensity,
              shaderEffect: dna.shaderEffect,
            });
          }
          onColorPick?.(dna.colorHex);
          onSelectTool?.('brush');
          triggerHaptic(30);
          showGestureToast('Brush look copied', `${dna.colorHex} • back to Brush`);
        }
        return;
      }

      if (tool === 'liquify') {
        engine.startLiquifySession();
        return;
      }

      engine.startStroke(coords.x, coords.y, brushSettings, tool, activeLayer, 1.0, symmetry);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if ((window as any).__NAVIGATOR_ACTIVE__ && e.pointerType !== 'pen') return;
    const engine = engineRef.current;
    if (!engine) return;
    if (isSelectTool && !isOrbiting && handleSelectPointerMove(e, engine)) return;

    // Track 2D screen coordinates for cursor reticle preview (DOM-based, zero React re-renders)
    if (cursorGroupRef.current && (tool === 'brush' || tool === 'eraser') && !rulerDrag?.active) {
      if (e.pointerType === 'pen' && isPenDrawingRef.current) {
        if (cursorSvgRef.current) cursorSvgRef.current.style.display = 'none';
      } else if (e.pointerType === 'touch' && (isStylusDetected || !fingerPenMode)) {
        if (cursorSvgRef.current) cursorSvgRef.current.style.display = 'none';
      } else {
        cursorGroupRef.current.setAttribute('transform', `translate(${e.clientX}, ${e.clientY})`);
        if (cursorSvgRef.current) cursorSvgRef.current.style.display = 'block';
      }
    }
    if (rulerDrag?.active) {
      setRulerDrag((prev) => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));
    }

    // Auto-reveal camera navigation pod when cursor approaches bottom-right corner
    if (!isPointerDown.current) {
      const rect = getRect();
      if (rect) {
        const distFromRight = rect.right - e.clientX;
        const distFromBottom = rect.bottom - e.clientY;
        // Only fire when the pod is actually hidden: showNavPod sets React state
        // and resets a timer, and calling it on every hover sample re-rendered
        // this component at pointer frequency.
        if (distFromRight < 120 && distFromBottom < 220 && !isNavPodVisible) {
          showNavPod(3000);
        }
      }
    }

    // -----------------------------------------------------------------------
    // BRANCH 1: STYLUS / PEN MOVE (STRICT DRAWING, NO CAMERA INTERFERENCE)
    // -----------------------------------------------------------------------
    if (e.pointerType === 'pen') {
      if (!isStylusDetected) {
        setIsStylusDetected(true);
        try {
          localStorage.setItem('remix3d.hasStylus', 'true');
        } catch (_) {}
      }
      lastPenEventTimeRef.current = Date.now();
      penActiveRef.current = true;
      penInProximityRef.current = true;
      // Hard lock: stylus can never orbit. Guarded so a hover sweep does not
      // dispatch a state update on every one of its samples.
      if (isOrbiting) setIsOrbiting(false);
      lastStylusHoverPos.current.x = e.clientX;
      lastStylusHoverPos.current.y = e.clientY;

      const coords = getNormalizedCoords(e);

      if (isPenDrawingRef.current && isPointerDown.current) {
        if (tool === 'liquify') {
          const deltaScreenX = coords.x - lastNormalizedPos.current.x;
          const deltaScreenY = coords.y - lastNormalizedPos.current.y;
          if (liquifySettings && (Math.abs(deltaScreenX) > 0.0001 || Math.abs(deltaScreenY) > 0.0001)) {
            engine.applyLiquifyAtScreen(coords.x, coords.y, deltaScreenX, deltaScreenY, liquifySettings);
          }
        } else {
          // Coalesced Hardware Sampling for Sub-Pixel Precision.
          // Fed in batch straight to the engine to update geometry only once per frame.
          const native = e.nativeEvent as any;
          const rect = getRect();
          let consumedCoalesced = false;

          if (native && typeof native.getCoalescedEvents === 'function' && rect) {
            const cEvents = native.getCoalescedEvents();
            if (cEvents && cEvents.length > 0) {
              const fallbackPressure = e.pressure > 0 ? e.pressure : 1.0;
              const batch: Array<{ x: number; y: number; pressure: number }> = [];
              for (let i = 0; i < cEvents.length; i++) {
                const ev = cEvents[i];
                const point = getSafeNormalizedPoint(ev.clientX, ev.clientY, rect);
                if (!point) continue;
                const pressure = ev.pressure > 0 ? ev.pressure : fallbackPressure;
                batch.push({ ...point, pressure });
              }
              if (batch.length > 0) {
                engine.addStrokePointsBatch(batch, brushSettings, tool, symmetry);
                consumedCoalesced = true;
              }
            }
          }

          if (!consumedCoalesced) {
            const pressure = e.pressure > 0 ? e.pressure : 1.0;
            engine.addStrokePoint(coords.x, coords.y, brushSettings, tool, pressure, symmetry);
          }
        }

        lastNormalizedPos.current.x = coords.x;
        lastNormalizedPos.current.y = coords.y;
        lastPointerPos.current.x = e.clientX;
        lastPointerPos.current.y = e.clientY;
      } else {
        // Stylus Hover Decal Tracking
        engine.updateCursor(coords.x, coords.y, brushSettings.size, brushSettings, tool);
      }
      return;
    }

    // -----------------------------------------------------------------------
    // BRANCH 2: TOUCH MOVE (CAMERA OR FINGER DRAW)
    // -----------------------------------------------------------------------
    if (e.pointerType === 'touch') {
      const now = Date.now();
      if (
        penActiveRef.current ||
        penInProximityRef.current ||
        activePenIdRef.current !== null ||
        (now - lastPenEventTimeRef.current < 500)
      ) {
        return;
      }

      const p = touchPointersRef.current.get(e.pointerId);
      if (p) {
        p.x = e.clientX;
        p.y = e.clientY;
      }

      const touchCount = touchPointersRef.current.size;

      // 3-Finger Gesture: vertical swipe changes the camera lens width
      if (touchCount === 3 && threeFingerStartY.current !== null) {
        const deltaY = e.clientY - threeFingerStartY.current;
        const newFov = Math.round(
          Math.max(15, Math.min(95, threeFingerInitialFov.current + deltaY * 0.22))
        );
        engine.setFov(newFov);
        // Only re-render the toast when the displayed integer actually changes;
        // a slow drag otherwise fires a state update per touch sample.
        if (newFov !== lastToastFovRef.current) {
          lastToastFovRef.current = newFov;
          showGestureToast(`Lens: ${newFov}°`, getFovDescription(newFov));
        }
        return;
      }

      // 2-Finger Multi-Touch: Pinch-Zoom & Pan
      if (touchCount === 2) {
        if (!readTouchPair()) return;
        const [p0, p1] = touchPairScratch.current;
        const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;

        if (initialPinchDistRef.current !== null) {
          const deltaDist = initialPinchDistRef.current - dist;
          engine.zoom(deltaDist * 2.2);
        }
        initialPinchDistRef.current = dist;

        const lastMid = lastTouchMidpointRef.current;
        if (lastMid) {
          engine.pan((midX - lastMid.x) * 1.2, (midY - lastMid.y) * 1.2);
          lastMid.x = midX;
          lastMid.y = midY;
        } else {
          lastTouchMidpointRef.current = { x: midX, y: midY };
        }
        return;
      }

      // 1-Finger Drawing or Camera Orbit
      if (touchCount === 1) {
        const coords = getNormalizedCoords(e);
        const allowFingerDraw = fingerPenMode && !isStylusDetected;
        if (allowFingerDraw && isPointerDown.current) {
          const native = e.nativeEvent as any;
          const rect = getRect();
          let consumedCoalesced = false;

          if (native && typeof native.getCoalescedEvents === 'function' && rect) {
            const cEvents = native.getCoalescedEvents();
            if (cEvents && cEvents.length > 0) {
              const batch: Array<{ x: number; y: number; pressure: number }> = [];
              for (let i = 0; i < cEvents.length; i++) {
                const ev = cEvents[i];
                const point = getSafeNormalizedPoint(ev.clientX, ev.clientY, rect);
                if (!point) continue;
                batch.push({ ...point, pressure: 1.0 });
              }
              if (batch.length > 0) {
                engine.addStrokePointsBatch(batch, brushSettings, tool, symmetry);
                consumedCoalesced = true;
              }
            }
          }

          if (!consumedCoalesced) {
            engine.addStrokePoint(coords.x, coords.y, brushSettings, tool, 1.0, symmetry);
          }
          lastNormalizedPos.current.x = coords.x;
          lastNormalizedPos.current.y = coords.y;
          lastPointerPos.current.x = e.clientX;
          lastPointerPos.current.y = e.clientY;
        } else if (isOrbiting) {
          const deltaX = e.clientX - lastPointerPos.current.x;
          const deltaY = e.clientY - lastPointerPos.current.y;
          if (isPanMode || cameraInteracting) {
            engine.pan(deltaX * 1.2, deltaY * 1.2);
          } else {
            engine.orbit(deltaX * 1.2, deltaY * 1.2);
          }
          lastPointerPos.current.x = e.clientX;
          lastPointerPos.current.y = e.clientY;
        }
      }
      return;
    }

    // -----------------------------------------------------------------------
    // BRANCH 3: MOUSE MOVE
    // -----------------------------------------------------------------------
    if (e.pointerType === 'mouse') {
      const coords = getNormalizedCoords(e);
      if (isOrbiting) {
        const deltaX = e.clientX - lastPointerPos.current.x;
        const deltaY = e.clientY - lastPointerPos.current.y;

        if (isRightClickDown.current) {
          rightClickDragDistance.current += Math.hypot(deltaX, deltaY);
        }

        if (e.buttons === 4 || e.shiftKey || isPanMode) {
          engine.pan(deltaX * 1.2, deltaY * 1.2);
        } else {
          engine.orbit(deltaX * 1.2, deltaY * 1.2);
        }

        lastPointerPos.current.x = e.clientX;
        lastPointerPos.current.y = e.clientY;
        return;
      }

      if (isPointerDown.current) {
        if (tool === 'liquify') {
          const deltaScreenX = coords.x - lastNormalizedPos.current.x;
          const deltaScreenY = coords.y - lastNormalizedPos.current.y;
          if (liquifySettings && (Math.abs(deltaScreenX) > 0.0001 || Math.abs(deltaScreenY) > 0.0001)) {
            engine.applyLiquifyAtScreen(coords.x, coords.y, deltaScreenX, deltaScreenY, liquifySettings);
          }
        } else {
          const native = e.nativeEvent as any;
          const rect = getRect();
          let consumedCoalesced = false;

          if (native && typeof native.getCoalescedEvents === 'function' && rect) {
            const cEvents = native.getCoalescedEvents();
            if (cEvents && cEvents.length > 0) {
              const batch: Array<{ x: number; y: number; pressure: number }> = [];
              for (let i = 0; i < cEvents.length; i++) {
                const ev = cEvents[i];
                const point = getSafeNormalizedPoint(ev.clientX, ev.clientY, rect);
                if (!point) continue;
                batch.push({ ...point, pressure: 1.0 });
              }
              if (batch.length > 0) {
                engine.addStrokePointsBatch(batch, brushSettings, tool, symmetry);
                consumedCoalesced = true;
              }
            }
          }

          if (!consumedCoalesced) {
            engine.addStrokePoint(coords.x, coords.y, brushSettings, tool, 1.0, symmetry);
          }
        }
        lastNormalizedPos.current.x = coords.x;
        lastNormalizedPos.current.y = coords.y;
        lastPointerPos.current.x = e.clientX;
        lastPointerPos.current.y = e.clientY;
      } else {
        engine.updateCursor(coords.x, coords.y, brushSettings.size, brushSettings, tool);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    const engine = engineRef.current;
    if (engine && handleSelectPointerUp(e, engine)) return;
    if (rulerDrag?.active) {
      setRulerDrag(null);
    }

    // -----------------------------------------------------------------------
    // BRANCH 1: STYLUS / PEN UP
    // -----------------------------------------------------------------------
    if (e.pointerType === 'pen') {
      lastPenEventTimeRef.current = Date.now();
      if (isPenDrawingRef.current) {
        isPenDrawingRef.current = false;
        isPointerDown.current = false;
        if (tool !== 'liquify') {
          engine?.endStroke(brushSettings, tool, activeLayer.id, symmetry);
        }
      }
      activePenIdRef.current = null;
      penActiveRef.current = false;
      activeDrawingPointerIdRef.current = null;
      drawingIntentUntilRef.current = performance.now() + 150;
      setIsOrbiting(false);
      return;
    }

    // -----------------------------------------------------------------------
    // BRANCH 2: TOUCH UP
    // -----------------------------------------------------------------------
    if (e.pointerType === 'touch') {
      const endedTouch = touchPointersRef.current.get(e.pointerId);

      // Check 3-finger quick tap / horizontal swipe for Perspective <-> Orthographic toggle
      if (touchPointersRef.current.size === 3 && endedTouch && threeFingerStartX.current !== null && engine) {
        const dt = performance.now() - threeFingerStartTime.current;
        const dx = endedTouch.x - threeFingerStartX.current;
        const dy = threeFingerStartY.current !== null ? endedTouch.y - threeFingerStartY.current : 0;

        const isQuickTap = dt < 350 && Math.hypot(dx, dy) < 25;
        const isHorizSwipe = Math.abs(dx) > 60 && Math.abs(dy) < 40;

        if (isQuickTap || isHorizSwipe) {
          triggerHaptic(25);
          const newMode = engine.toggleProjectionMode();
          showGestureToast(
            newMode === 'orthographic' ? 'Flat View' : 'Depth View',
            newMode === 'orthographic' ? 'Things stay the same size far away' : 'Far things look smaller'
          );
        }
      }

      touchPointersRef.current.delete(e.pointerId);

      if (touchPointersRef.current.size === 0) {
        setIsOrbiting(false);
        if (fingerPenMode && isPointerDown.current) {
          isPointerDown.current = false;
          if (tool !== 'liquify') {
            engine?.endStroke(brushSettings, tool, activeLayer.id, symmetry);
          }
        }
        initialPinchDistRef.current = null;
        lastTouchMidpointRef.current = null;
        threeFingerStartY.current = null;
        threeFingerStartX.current = null;
        engine?.hideCursor();
      } else if (touchPointersRef.current.size === 1) {
        const remaining = Array.from(touchPointersRef.current.values())[0] as { x: number; y: number } | undefined;
        if (remaining) {
          lastPointerPos.current.x = remaining.x;
          lastPointerPos.current.y = remaining.y;
        }
        initialPinchDistRef.current = null;
        lastTouchMidpointRef.current = null;
        isPointerDown.current = false;
      } else if (touchPointersRef.current.size === 2) {
        if (readTouchPair()) {
          const [p0, p1] = touchPairScratch.current;
          initialPinchDistRef.current = Math.hypot(p1.x - p0.x, p1.y - p0.y);
          lastTouchMidpointRef.current = {
            x: (p0.x + p1.x) / 2,
            y: (p0.y + p1.y) / 2,
          };
        }
      }
      return;
    }

    // -----------------------------------------------------------------------
    // BRANCH 3: MOUSE UP
    // -----------------------------------------------------------------------
    if (e.pointerType === 'mouse') {
      setIsOrbiting(false);
      if (e.button === 2) {
        isRightClickDown.current = false;
      }
      if (isPointerDown.current) {
        isPointerDown.current = false;
        if (tool !== 'liquify') {
          engine?.endStroke(brushSettings, tool, activeLayer.id, symmetry);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const engine = engineRef.current;
    // Over the selection, the wheel resizes it; one wheel burst is one undo step.
    if (engine && isSelectTool && isOverSelection(engine, e.clientX, e.clientY, 6)) {
      if (wheelTransformTimerRef.current === null) engine.beginTransform(scopeNow());
      else window.clearTimeout(wheelTransformTimerRef.current);
      engine.scaleAxis('uniform', Math.max(0.8, Math.min(1.25, Math.exp(-e.deltaY * 0.0015))), scopeNow(), false);
      wheelTransformTimerRef.current = window.setTimeout(() => {
        wheelTransformTimerRef.current = null;
        engineRef.current?.endTransform();
      }, 250);
      return;
    }
    engine?.zoom(e.deltaY * 0.8);
    showNavPod(2500);
  };

  const handleContextMenu = (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent) => {
    e.preventDefault();
    const wasDragging = rightClickDragDistance.current > 5;
    rightClickDragDistance.current = 0;
    if (disableContextMenu || wasDragging) {
      // Suppress radial menu when disabled via menu toggle or when user was orbiting
      return;
    }
    triggerHaptic(18);
    setRadialMenuPos({ x: e.clientX, y: e.clientY });
    setIsRadialMenuOpen(true);
  };

  const handleZoomIn = () => {
    triggerHaptic(8);
    engineRef.current?.zoom(-120);
  };

  const handleZoomOut = () => {
    triggerHaptic(8);
    engineRef.current?.zoom(120);
  };

  const handleResetView = () => {
    triggerHaptic(12);
    engineRef.current?.resetCamera();
    showGestureToast('Camera Reset', 'Default 3D Perspective');
  };

  const handleToggleProjection = () => {
    triggerHaptic(15);
    const newMode = engineRef.current?.toggleProjectionMode();
    if (newMode) {
      showGestureToast(
        newMode === 'orthographic' ? 'Flat View' : 'Depth View',
        newMode === 'orthographic' ? 'Things stay the same size far away' : 'Far things look smaller'
      );
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="3D drawing canvas"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerEnter={(e) => {
        if (e.pointerType === 'pen') {
          penInProximityRef.current = true;
          penActiveRef.current = true;
          setIsStylusDetected(true);
          onStylusDetected?.(true);
        }
      }}
      onPointerLeave={(e) => {
        if (cursorSvgRef.current) cursorSvgRef.current.style.display = 'none';
        engineRef.current?.hideCursor();
        if (rulerDrag?.active) setRulerDrag(null);
        if (e.pointerType === 'pen') {
          penInProximityRef.current = false;
          if (!isPenDrawingRef.current) {
            penActiveRef.current = false;
          }
        }
      }}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      className={`relative w-full h-full touch-none select-none overflow-hidden ${isSelectTool ? 'cursor-default' : 'cursor-crosshair'}`}
    >
      {/* Dynamic 2D / Screen-Space Brush & Super Zap Vacuum Eraser Reticle Indicator (Direct DOM, zero React re-renders) */}
      {!rulerDrag?.active && (tool === 'brush' || tool === 'eraser') && (
        <svg
          ref={cursorSvgRef}
          style={{ display: 'none' }}
          className="pointer-events-none fixed inset-0 w-full h-full z-20 overflow-visible"
        >
          <g ref={cursorGroupRef}>
            {tool === 'eraser' ? (
              <g>
                <circle
                  cx={0}
                  cy={0}
                  r={Math.max(18, (brushSettings.size * 60) / 2)}
                  fill="rgba(244, 63, 94, 0.12)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  className="animate-spin"
                  style={{ animationDuration: '6s' }}
                />
                <circle
                  cx={0}
                  cy={0}
                  r={3}
                  fill="#f43f5e"
                />
              </g>
            ) : (
              <g>
                <circle
                  cx={0}
                  cy={0}
                  r={Math.max(2, (brushSettings.size * 30) / 2)}
                  fill="none"
                  stroke={brushSettings.color || '#38bdf8'}
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  className="opacity-80"
                />
                <circle
                  cx={0}
                  cy={0}
                  r={1.2}
                  fill={brushSettings.color || '#38bdf8'}
                />
              </g>
            )}
          </g>
        </svg>
      )}

      {/* The one selection highlight: frame, resize corners, turn handle and label */}
      <SelectionFrame
        engine={engineInstance}
        scope={targetScope}
        visible={isSelectTool}
        followController={showSelectionFrame}
        theme={theme}
      />

      {/* Lasso loop while it is being drawn (points are updated directly, not through React) */}
      {isLassoVisible && (
        <svg className="pointer-events-none absolute inset-0 w-full h-full z-[23] overflow-visible" aria-hidden="true">
          <polyline
            ref={lassoPathRef}
            fill={theme === 'light' ? 'rgb(8 145 178 / 0.10)' : 'rgb(34 211 238 / 0.10)'}
            stroke={theme === 'light' ? '#0891b2' : '#22d3ee'}
            strokeWidth={2}
            strokeDasharray="6 4"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Visual Ruler & Precision Straight-Line Drafting Overlay */}
      {rulerDrag?.active && (
        <svg className="pointer-events-none fixed inset-0 w-full h-full z-20 overflow-visible">
          <line
            x1={rulerDrag.startX}
            y1={rulerDrag.startY}
            x2={rulerDrag.currentX}
            y2={rulerDrag.currentY}
            stroke="#38bdf8"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <circle cx={rulerDrag.startX} cy={rulerDrag.startY} r={4} fill="#38bdf8" />
          <circle cx={rulerDrag.currentX} cy={rulerDrag.currentY} r={4} fill="#38bdf8" />
          <g transform={`translate(${(rulerDrag.startX + rulerDrag.currentX) / 2}, ${(rulerDrag.startY + rulerDrag.currentY) / 2 - 14})`}>
            <rect
              x={-50}
              y={-11}
              width={100}
              height={22}
              rx={6}
              fill="rgba(15, 23, 42, 0.9)"
              stroke="#38bdf8"
              strokeWidth={1}
            />
            <text
              x={0}
              y={4}
              fill="#ffffff"
              fontSize={10}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              {`${(Math.hypot(rulerDrag.currentX - rulerDrag.startX, rulerDrag.currentY - rulerDrag.startY) * 0.26).toFixed(1)} mm • ${Math.round((Math.atan2(rulerDrag.currentY - rulerDrag.startY, rulerDrag.currentX - rulerDrag.startX) * 180) / Math.PI)}°`}
            </text>
          </g>
        </svg>
      )}

      {/* Floating Sample DNA Banner with Clear 1-Click Exit */}
      {tool === 'brush_picker' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 dark:bg-white text-white dark:text-zinc-950 px-4 py-2 rounded-full font-semibold shadow-2xl border border-white/20 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-200 select-none">
          <Pipette className="w-4 h-4 stroke-[2.5]" />
          <span className="text-xs">Copy a brush look • Tap any line to copy its look</span>
          <button
            type="button"
            onClick={() => {
              onSelectTool?.('brush');
              showGestureToast('Stopped copying a brush look', 'Back to Brush');
            }}
            className="bg-black text-white px-2.5 py-1 rounded-full text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel ✕
          </button>
        </div>
      )}

      {/* 3-Finger Gesture Floating Live Toast / HUD Indicator */}
      {gestureToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-2 rounded-2xl bg-neutral-900/90 border border-neutral-700 text-white shadow-2xl flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-neutral-900 dark:text-white tracking-wide">
              {gestureToast.title}
            </span>
            {gestureToast.subtitle && (
              <span className="text-[10px] text-neutral-400">{gestureToast.subtitle}</span>
            )}
          </div>
        </div>
      )}

      {/* Invisible Hover-Wakeup Zone near bottom-right corner */}
      <div
        id="viewport-nav-pod-wakeup"
        onPointerEnter={() => showNavPod(3500)}
        className="absolute bottom-0 right-0 w-28 h-72 z-10 pointer-events-auto"
        aria-hidden="true"
      />

      {/* Floating Viewport Navigation Control Pod with Smooth Auto-Hide */}
      <div
        id="viewport-camera-control-pod"
        onPointerEnter={() => {
          if (navPodTimerRef.current) clearTimeout(navPodTimerRef.current);
          setIsNavPodVisible(true);
        }}
        onPointerLeave={() => {
          showNavPod(1500);
        }}
        className={`absolute bottom-6 right-6 z-20 flex flex-col items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-2xl shadow-xl transition-all duration-300 ease-out ${
          isNavPodVisible
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto shadow-[0_12px_32px_rgba(0,0,0,0.6)]'
            : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
        }`}
      >
        <button
          onClick={() => {
            handleZoomIn();
            showNavPod(3000);
          }}
          className="shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            handleZoomOut();
            showNavPod(3000);
          }}
          className="shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            handleResetView();
            showNavPod(3000);
          }}
          className="shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          title="Reset Camera View"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setIsPanMode(!isPanMode);
            showNavPod(3000);
          }}
          className={`shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl border transition-colors duration-150 ease-out ${
            isPanMode
              ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-zinc-950'
              : 'border-transparent text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
          title="Pan Mode Toggle"
        >
          <Move className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Selection Options Action Bar (Delete, Clone, Reset, Deselect) */}
      <SelectionActionBar
        selection={activeSelection}
        onClone={handleCloneSelection}
        onDelete={handleDeleteSelection}
        onResetTransform={handleResetSelectionTransform}
        onDeselect={handleDeselect}
        theme={theme}
      />

      {/* S-Pen Hardware Radial Context Menu (At Stylus Tip) */}
      <StylusRadialMenu
        isOpen={isRadialMenuOpen}
        position={radialMenuPos}
        onClose={() => setIsRadialMenuOpen(false)}
        tool={tool}
        onSelectTool={(newTool) => {
          if (onSelectTool) onSelectTool(newTool);
        }}
        brushSettings={brushSettings}
        onUpdateBrushSettings={(newSettings) => {
          if (onUpdateBrushSettings) onUpdateBrushSettings(newSettings);
        }}
        symmetry={symmetry}
        onSelectSymmetry={(newSym) => {
          if (onSelectSymmetry) onSelectSymmetry(newSym);
        }}
        onUndo={() => {
          if (onUndo) onUndo();
        }}
        onRedo={() => {
          if (onRedo) onRedo();
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        onResetView={handleResetView}
        onRecalculateNormals={() => engineRef.current?.recalculateMeshNormals()}
        onOpenColorPanel={onOpenColorPanel}
        onOpenNumpad={onOpenNumpad}
        theme={theme}
      />
    </div>
  );
};
