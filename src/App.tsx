import React, { useState, useEffect, useCallback, useRef, lazy, Suspense, useMemo } from 'react';
import * as THREE from 'three';
import {
  ToolType,
  BrushSettings,
  SymmetryMode,
  Layer,
  LightingPreset,
  PostProcessSettings,
  PerfectViewInfo,
  PerfectViewType,
  GPUInfo,
  SkyPresetName,
  ModelDisplayMode,
  ModelMetadata,
  GizmoMode,
  ActiveControllerType,
  ProjectSaveData,
  PathTracingProgressInfo,
} from './types';
import { StudioEngine } from './core/studioEngine';
import { Viewport } from './components/Viewport';
import { LayerPanel } from './components/LayerPanel';
import { BrushSettingsPanel } from './components/BrushSettingsPanel';
import { ModelDisplayPanel } from './components/ModelDisplayPanel';
import { ScreenCenterCrosshair } from './components/ScreenCenterCrosshair';
import { Option3SphereNavigator } from './components/TransformNavigator/Option3SphereNavigator';
import { JoystickNavigator, type NavigatorLayout } from './components/TransformNavigator/JoystickNavigator';
import { FpsCounter } from './components/FpsCounter';
import { DeferredPanel } from './components/DeferredPanel';
import { publishCameraPose, publishFps } from './core/telemetryStore';
import { useHasOnboarded, setHasOnboarded, getHasOnboarded } from './core/onboardingStore';
import { FirstStrokeHint } from './components/studio/FirstStrokeHint';
import { ProShell } from './components/pro/ProShell';
import { GuideControlBar } from './components/studio/GuideControlBar';
import { useOpenSheet, useStudioShelfOpen, openSheetId, closeSheet, toggleSheet } from './components/studio/panelStore';
import { StudioTopStrip } from './components/studio/StudioTopStrip';
import { StudioSettingsSheet } from './components/studio/StudioSettingsSheet';
import { WorkLossDecisionSheet } from './components/WorkLossDecisionSheet';
const StudioImporter = lazy(() =>
  import('./components/studio/StudioImporter').then((m) => ({ default: m.StudioImporter }))
);
import { ShapesSheet } from './components/studio/ShapesSheet';
import { DeviceSimulatorFrame } from './components/DeviceSimulatorFrame';
import { Compass } from 'lucide-react';
import { CameraRecoveryPill } from './components/CameraRecoveryPill';
import { AutoSaveToast, AutoSaveStatus } from './components/AutoSaveToast';
import {
  checkStoragePersistence,
  requestStoragePersistence,
  getStorageEstimate,
  saveAutoSaveProject,
  loadAutoSaveProject,
  hasAutoSaveProject,
  clearAutoSaveProject,
  saveProjectSession,
  StorageEstimateInfo,
  AutoSaveMetaInfo,
} from './utils/storagePermission';

import { AppModalHost } from './components/modals/AppModalHost';
import { useAppShortcuts } from './hooks/useAppShortcuts';
import { useAppAutoSave } from './hooks/useAppAutoSave';
import { haptics } from './utils/haptics';
import { setGlobalSoundEnabled } from './utils/audio';
import { PlatformBridge } from './core/platformBridge';

import { DebugTestPanel } from '@debug-panel';
import {
  LiquifySettings,
  CustomMirrorConfig,
  TranslationEventPayload,
  RotationEventPayload,
  ScaleEventPayload,
  NumpadTarget,
  HolisticStrokeDNA,
  ReferenceImageItem,
  LoadedModelInfo,
  TransformTargetScope,
  SavedProjectSession,
  ActiveGuideReference,
} from './types';

const DEFAULT_BRUSH_SETTINGS: BrushSettings = {
  // With the default 1.5× ribbon width this reads as 10 in the brush-size UI.
  size: 0.01,
  opacity: 1.0,
  color: '#000000',
  solidColor: '#000000',
  eraserMode: 'vacuum',
  roughness: 0.8,
  metalness: 0.0,
  emissiveIntensity: 0.0,
  pressureSensitivity: true,
  archSegments: 3,
  domeFactor: 0.0,
  surfaceOffset: 0.002,
  taperLength: 0.05,
  silhouetteClamping: true,
  stencilMasking: false,
  autoRecalculateNormals: true,
  smoothingAlgorithm: 'streamline',
  smoothingStrength: 0.55,
  materialType: 'shadeless',
  profile: 'ribbon',
  patternType: 'none',
  patternScale: 4.0,
  patternIntensity: 1.0,
  patternAngle: 45,
  patternContrast: 1.0,
  chiselAngle: 45,
  aspectRatio: 3.5,
  brushShape: 'wide_flat',
  brushWidthMultiplier: 1.5,
  straightLineMode: false,
  magneticEndpointSnapping: true,
  adaptableCorners: true,
  // Live glide is the default. Release-time refitting is deliberately opt-in:
  // artists should never see a finished stroke change shape after lifting a pen.
  shapeSnapping: false,
  shapeSnapTolerance: undefined,
  predictiveLevel: 3,
  shapeRecognition: false,
  angleSnapping: true,
  steadyStrokeLevel: 0,
};

type CanvasPreset = 'portrait' | 'square' | 'landscape';
type CanvasFormat = CanvasPreset | 'custom';

const CANVAS_FORMATS: Record<CanvasPreset, { width: number; height: number }> = {
  portrait: { width: 2.7, height: 3.6 },
  square: { width: 3.2, height: 3.2 },
  landscape: { width: 3.6, height: 2.7 },
};

const BRUSH_PRESET_STORAGE_KEY = 'paperrocket_last_brush_preset';
const CANVAS_PRESET_STORAGE_KEY = 'paperrocket_last_canvas_preset';

interface CanvasPreferences {
  format: CanvasFormat;
  width: number;
  height: number;
  opacity: number;
  color: string;
}

const DEFAULT_CANVAS_PREFERENCES: CanvasPreferences = {
  format: 'portrait',
  ...CANVAS_FORMATS.portrait,
  opacity: 1,
  color: '#ffffff',
};

const readCanvasPreferences = (): CanvasPreferences => {
  try {
    const stored = JSON.parse(localStorage.getItem(CANVAS_PRESET_STORAGE_KEY) || 'null');
    if (!stored || typeof stored !== 'object') return DEFAULT_CANVAS_PREFERENCES;
    const format: CanvasFormat = ['portrait', 'square', 'landscape', 'custom'].includes(stored.format)
      ? stored.format
      : 'portrait';
    return {
      format,
      width: Number.isFinite(stored.width) ? Math.min(8, Math.max(1, stored.width)) : DEFAULT_CANVAS_PREFERENCES.width,
      height: Number.isFinite(stored.height) ? Math.min(8, Math.max(1, stored.height)) : DEFAULT_CANVAS_PREFERENCES.height,
      opacity: Number.isFinite(stored.opacity) ? Math.min(1, Math.max(0, stored.opacity)) : 1,
      color: typeof stored.color === 'string' && /^#[0-9a-f]{6}$/i.test(stored.color) ? stored.color : '#ffffff',
    };
  } catch (_) {
    return DEFAULT_CANVAS_PREFERENCES;
  }
};

const MATERIAL_LABELS: Partial<Record<BrushSettings['materialType'], string>> = {
  shadeless: 'Flat Paint',
  shaded: 'Lit',
  glow: 'Glow',
  cutout: 'Cutout',
  animated_fx: 'FX',
  matcap: 'Material',
};

/** Keep repeated menu controls as views of one canonical brush state. */
const synchronizeBrushSettings = (previous: BrushSettings, next: BrushSettings): BrushSettings => {
  if (next === previous) return previous;
  const synchronized = { ...next };
  const colorChanged = next.color !== previous.color;
  const solidColorChanged = next.solidColor !== previous.solidColor;

  if (colorChanged && !solidColorChanged) synchronized.solidColor = next.color;
  if (solidColorChanged && !colorChanged && next.solidColor) synchronized.color = next.solidColor;

  if (next.materialType !== previous.materialType && next.activeLookName === previous.activeLookName) {
    synchronized.activeLookName = MATERIAL_LABELS[next.materialType] || next.activeLookName;
  }

  return synchronized;
};

const readLastBrushPreset = (): BrushSettings => {
  try {
    const stored = JSON.parse(localStorage.getItem(BRUSH_PRESET_STORAGE_KEY) || 'null');
    if (stored && typeof stored === 'object') {
      return synchronizeBrushSettings(DEFAULT_BRUSH_SETTINGS, {
        ...DEFAULT_BRUSH_SETTINGS,
        ...stored,
        size: Number.isFinite(stored.size)
          ? Math.min(0.25, Math.max(0.002, stored.size))
          : DEFAULT_BRUSH_SETTINGS.size,
      });
    }
  } catch (_) {}
  return DEFAULT_BRUSH_SETTINGS;
};

const DEFAULT_POST_SETTINGS: PostProcessSettings = {
  renderMode: 'draft',
  toonShading: false,
  toonSteps: 3,
  bloom: true,
  bloomIntensity: 1.2,
  bloomRadius: 0.8,
  bloomThreshold: 0.85,
  dof: false,
  dofFocusDistance: 2.5,
  dofAperture: 0.015,
  grain: false,
  grainIntensity: 0.08,
  pixelation: false,
  pixelSize: 4,
  rayTracing: false,
  contactShadowSharpness: 1.5,
  denoiser: true,
  rayTracingBounces: 3,
  rayTracingSamples: 48,
};

const DEFAULT_LAYERS: Layer[] = [
  {
    id: 'layer_base_1',
    name: 'Layer 1',
    visible: true,
    locked: false,
    opacity: 1.0,
    blendMode: 'normal',
    strokeIds: [],
  },
];

export function App() {
  const [engine, setEngine] = useState<StudioEngine | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('mody_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (_) {}
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('mody_theme', theme);
    } catch (_) {}
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.classList.toggle('light', theme === 'light');
      document.body.className = theme === 'dark'
        ? 'bg-[#0f1117] text-neutral-100 overflow-hidden select-none dark'
        : 'bg-[#f4f0e9] text-neutral-800 overflow-hidden select-none light';
    }
    if (engine) {
      engine.setTheme(theme);
    }
  }, [theme, engine]);

  const openSheet = useOpenSheet();
  const studioShelfOpen = useStudioShelfOpen();
  const hasOnboarded = useHasOnboarded();
  const [showPerformanceStats, setShowPerformanceStats] = useState<boolean>(false);
  const [showStudioNavigator, setShowStudioNavigator] = useState<boolean>(() => {
    try {
      const savedCtrl = localStorage.getItem('mody_active_controller');
      if (savedCtrl === 'hidden') return true; // Fix restart lockout: default to active on app restart
      const navVisible = localStorage.getItem('paperrocket_show_navigator');
      if (navVisible !== null) return navVisible === 'true';
    } catch (_) {}
    return true;
  });
  const [isModelImporterOpen, setIsModelImporterOpen] = useState<boolean>(false);
  const [tool, setTool] = useState<ToolType>('brush');
  const [brushSettings, setBrushSettingsState] = useState<BrushSettings>(readLastBrushPreset);
  const setBrushSettings = useCallback<React.Dispatch<React.SetStateAction<BrushSettings>>>((action) => {
    setBrushSettingsState((previous) => {
      const next = typeof action === 'function'
        ? (action as (value: BrushSettings) => BrushSettings)(previous)
        : action;
      return synchronizeBrushSettings(previous, next);
    });
  }, []);
  useEffect(() => {
    try {
      const { matcapTexture: _texture, customShader: _customShader, ...serializablePreset } = brushSettings;
      localStorage.setItem(BRUSH_PRESET_STORAGE_KEY, JSON.stringify(serializablePreset));
    } catch (_) {}
  }, [brushSettings]);
  const [postSettings, setPostSettings] = useState<PostProcessSettings>(DEFAULT_POST_SETTINGS);
  const [pathTracingProgress, setPathTracingProgress] = useState<PathTracingProgressInfo | null>(null);

  useEffect(() => {
    if (!engine) return;
    engine.setPostProcessSettings(postSettings);
  }, [engine, postSettings]);
  const [symmetry, setSymmetry] = useState<SymmetryMode>('none');
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const [activeLayerId, setActiveLayerId] = useState<string>(DEFAULT_LAYERS[0].id);

  // Model & Sky Environment State
  const [activeModelName, setActiveModelName] = useState<string>('Drawing Canvas');
  const [modelMetadata, setModelMetadata] = useState<ModelMetadata | null>(null);

  // Safe Debug/Test Mode state (Gated by native build authorization)
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const [debugAuthorized, setDebugAuthorized] = useState(false);
  const debugPointerTelemetryRef = useRef({
    lastType: 'none',
    lastPressure: 0,
    eventCount: 0,
    maxPressure: 0,
  });

  useEffect(() => {
    if (typeof __IS_DEBUG_BUILD__ !== 'undefined' && __IS_DEBUG_BUILD__) {
      import('@debug-bridge').then((mod) => {
        mod.authorize().then((auth) => {
          setDebugAuthorized(auth);
        });
      });
    }
  }, []);
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('clay_neutral');
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>(() => {
    try {
      const savedCtrl = localStorage.getItem('mody_active_controller');
      if (savedCtrl === 'hidden') return 'Standard';
    } catch (_) {}
    return 'Standard';
  });
  const [activeController, setActiveController] = useState<ActiveControllerType>(() => {
    try {
      const saved = localStorage.getItem('mody_active_controller');
      if (saved === 'navigator' || saved === 'tactile' || saved === 'both') {
        return saved as ActiveControllerType;
      }
    } catch (_) {}
    return 'tactile';
  });

  const handleControllerChange = (ctrl: ActiveControllerType) => {
    setActiveController(ctrl);
    try {
      localStorage.setItem('mody_active_controller', ctrl);
    } catch (_) {}
    if (ctrl === 'hidden') {
      setGizmoMode('Hidden');
      setShowStudioNavigator(false);
      try {
        localStorage.setItem('paperrocket_show_navigator', 'false');
      } catch (_) {}
    } else {
      setGizmoMode('Standard');
      setShowStudioNavigator(true);
      try {
        localStorage.setItem('paperrocket_show_navigator', 'true');
      } catch (_) {}
    }
  };

  const handleToggleNavigator = (show: boolean) => {
    setShowStudioNavigator(show);
    try {
      localStorage.setItem('paperrocket_show_navigator', String(show));
    } catch (_) {}
    if (show) {
      setActiveController('navigator');
      setGizmoMode('Standard');
      try {
        localStorage.setItem('mody_active_controller', 'navigator');
      } catch (_) {}
    } else {
      setActiveController('hidden');
      setGizmoMode('Hidden');
      try {
        localStorage.setItem('mody_active_controller', 'hidden');
      } catch (_) {}
    }
  };

  const handleToggleGizmo = () => {
    const isCurrentlyHidden = gizmoMode === 'Hidden' || activeController === 'hidden' || !showStudioNavigator;
    if (isCurrentlyHidden) {
      setGizmoMode('Standard');
      setActiveController('navigator');
      setShowStudioNavigator(true);
      try {
        localStorage.setItem('mody_active_controller', 'navigator');
        localStorage.setItem('paperrocket_show_navigator', 'true');
      } catch (_) {}
    } else {
      setGizmoMode('Hidden');
      setActiveController('hidden');
      setShowStudioNavigator(false);
      try {
        localStorage.setItem('mody_active_controller', 'hidden');
        localStorage.setItem('paperrocket_show_navigator', 'false');
      } catch (_) {}
    }
  };

  const [navigatorStyle, setNavigatorStyle] = useState<NavigatorLayout>(() => {
    try {
      const saved = localStorage.getItem('paperrocket_nav_style');
      if (saved === 'disc' || saved === 'petal' || saved === 'collar') return saved;
    } catch (_) {}
    return 'sphere';
  });

  const [pendingWorkLoss, setPendingWorkLoss] = useState<{
    title: string;
    description: string;
    actionLabel: string;
    action: () => Promise<void> | void;
  } | null>(null);
  const [workLossBusy, setWorkLossBusy] = useState<boolean>(false);

  const handleNavigatorStyleChange = (style: NavigatorLayout) => {
    setNavigatorStyle(style);
    // Explicitly restore visibility and controller state whenever a layout is picked
    setActiveController('navigator');
    setGizmoMode('Standard');
    setShowStudioNavigator(true);
    try {
      localStorage.setItem('paperrocket_nav_style', style);
      localStorage.setItem('mody_active_controller', 'navigator');
      localStorage.setItem('paperrocket_show_navigator', 'true');
    } catch (_) {}
  };

  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    try {
      localStorage.setItem('mody_sound_enabled', 'false');
    } catch (_) {}
    return false;
  });

  const handleToggleSound = () => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mody_sound_enabled', String(next));
      } catch (_) {}
      haptics.setAudioFeedbackEnabled(next);
      setGlobalSoundEnabled(next);
      return next;
    });
  };

  // Global UI Scale state with persistence
  const [uiScale, setUiScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mody_global_ui_scale');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.65 && parsed <= 1.8) {
          return parsed;
        }
      }
    } catch (_) {}
    return 1.0;
  });

  const [isNarrowScreen, setIsNarrowScreen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 840 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsNarrowScreen(window.innerWidth < 840);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleUiScaleChange = useCallback((newScale: number) => {
    const clamped = Math.max(0.65, Math.min(1.6, Math.round(newScale * 100) / 100));
    setUiScale(clamped);
    try {
      localStorage.setItem('mody_global_ui_scale', clamped.toString());
    } catch (_) {}
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--remix-ui-scale', uiScale.toString());
  }, [uiScale]);

  const [perfectView, setPerfectView] = useState<PerfectViewInfo>({
    isPerfect: false,
    view: null,
    depthAxis: null,
  });

  const [crosshairActive, setCrosshairActive] = useState<boolean>(false);
  const [crosshairAction, setCrosshairAction] = useState<string>('');
  const [crosshairValue, setCrosshairValue] = useState<string>('');

  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [cameraInteracting, setCameraInteracting] = useState<boolean>(false);
  const [gpuInfo, setGpuInfo] = useState<GPUInfo>({
    backend: 'webgl2',
    adapterName: 'Universal GPU Device',
    vendor: 'Universal GPU Device',
    architecture: 'Universal Raster Pipeline',
    isWebGPUSupported: false,
    maxTextureDimension2D: 4096,
    computeSupport: false,
    powerPreference: 'high-performance',
  });

  // Modals & Panels
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isRenderSettingsOpen, setIsRenderSettingsOpen] = useState<boolean>(false);
  const [isModelsOpen, setIsModelsOpen] = useState<boolean>(false);
  const [isModelDisplayOpen, setIsModelDisplayOpen] = useState<boolean>(false);
  const [modelDisplayMode, setModelDisplayMode] = useState<ModelDisplayMode>('texture');
  const [isModelVisible, setIsModelVisible] = useState<boolean>(true);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [isIlluminationOpen, setIsIlluminationOpen] = useState<boolean>(false);
  const [windowDragOver, setWindowDragOver] = useState<boolean>(false);

  // Sprint 1-5 Spatial Editing & Hardware States
  const [fingerPenMode, setFingerPenMode] = useState<boolean>(true);
  const [navigatorSensitivity, setNavigatorSensitivity] = useState<number>(1.0);

  useEffect(() => {
    engine?.setNavigatorSensitivity(navigatorSensitivity);
  }, [engine, navigatorSensitivity]);
  const [projectionMode, setProjectionMode] = useState<'perspective' | 'orthographic'>('perspective');
  const [isStylusDetected, setIsStylusDetected] = useState<boolean>(false);
  const [isLiquifyOpen, setIsLiquifyOpen] = useState<boolean>(false);
  const [isCompareActive, setIsCompareActive] = useState<boolean>(false);
  const [liquifySettings, setLiquifySettings] = useState<LiquifySettings>({
    mode: 'push',
    brushRadius: 0.25,
    influenceStrength: 0.6,
    iterations: 1,
  });
  const [isDecimateOpen, setIsDecimateOpen] = useState<boolean>(false);
  const [isBentGuideOpen, setIsBentGuideOpen] = useState<boolean>(false);
  const [isScaffoldingOpen, setIsScaffoldingOpen] = useState<boolean>(false);
  const [isCustomMirrorOpen, setIsCustomMirrorOpen] = useState<boolean>(false);
  const [customMirrorConfig, setCustomMirrorConfig] = useState<CustomMirrorConfig>({
    planeOrigin: [0, 0, 0],
    planeNormal: [1, 0, 0],
    visible: true,
  });
  const [isARViewerOpen, setIsARViewerOpen] = useState<boolean>(false);
  const [showPlane, setShowPlane] = useState<boolean>(true);
  const initialCanvasPreferences = useMemo(readCanvasPreferences, []);
  const [canvasFormat, setCanvasFormat] = useState<CanvasFormat>(initialCanvasPreferences.format);
  const [canvasWidth, setCanvasWidth] = useState(initialCanvasPreferences.width);
  const [canvasHeight, setCanvasHeight] = useState(initialCanvasPreferences.height);
  const [canvasOpacity, setCanvasOpacity] = useState(initialCanvasPreferences.opacity);
  const [canvasColor, setCanvasColor] = useState(initialCanvasPreferences.color);

  useEffect(() => {
    try {
      localStorage.setItem(CANVAS_PRESET_STORAGE_KEY, JSON.stringify({
        format: canvasFormat,
        width: canvasWidth,
        height: canvasHeight,
        opacity: canvasOpacity,
        color: canvasColor,
      } satisfies CanvasPreferences));
    } catch (_) {}
  }, [canvasColor, canvasFormat, canvasHeight, canvasOpacity, canvasWidth]);

  // Phase 4 Stage Assets & Reference Clipboard States
  const [isClipboardOpen, setIsClipboardOpen] = useState<boolean>(false);
  const [referenceImages, setReferenceImages] = useState<ReferenceImageItem[]>([]);

  // Dev Settings: Disable Right-Click Radial Menu
  const [disableContextMenu, setDisableContextMenu] = useState<boolean>(() => {
    try {
      return localStorage.getItem('remix3d_disable_context_menu') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleDisableContextMenu = useCallback(() => {
    setDisableContextMenu((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('remix3d_disable_context_menu', String(next));
      } catch {}
      return next;
    });
  }, []);

  const handleToggleProjection = useCallback(() => {
    if (!engine) return;
    const nextMode = engine.toggleProjectionMode();
    setProjectionMode(nextMode);
  }, [engine]);

  // Phase 3 Color Studio, Holistic DNA & Shape Snapping States
  const [isColorStudioOpen, setIsColorStudioOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('remix3d.colorStudioPinned') === 'true';
    } catch {
      return false;
    }
  });
  const [colorStudioAllowsWorkspaceInteraction, setColorStudioAllowsWorkspaceInteraction] = useState<boolean>(() => {
    try {
      return localStorage.getItem('remix3d.colorStudioPinned') === 'true' ||
        localStorage.getItem('remix3d.colorStudioMini') === 'true';
    } catch {
      return false;
    }
  });
  const [activeDNA, setActiveDNA] = useState<HolisticStrokeDNA | null>(null);
  const [snappedShapeNotice, setSnappedShapeNotice] = useState<string | null>(null);

  const isInitialMountRef = React.useRef<boolean>(true);

  // Multi-Model & Target Scope State
  const [loadedModels, setLoadedModels] = useState<LoadedModelInfo[]>([]);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [targetScope, setTargetScope] = useState<TransformTargetScope>('all');
  const [activeGuide, setActiveGuide] = useState<ActiveGuideReference | null>(null);

  // Storage Permission & Bulletproof IndexedDB Auto-Save Hook
  const {
    autoSaveStatus,
    lastSavedTime,
    isStoragePersistent,
    storageEstimate,
    autoSaveMeta,
    handleRequestStoragePermission,
    handleRestoreAutoSave,
    handleClearAutoSave,
    triggerAutoSave,
  } = useAppAutoSave({
    engine,
    layers,
    activeModelName,
    lightingPreset,
    brushSettings,
    tool,
    setActiveModelName,
    setActiveModelId,
    setLayers,
    setActiveLayerId,
    setLightingPreset,
    setShowGrid,
    setShowPlane,
    setShowWireframe,
  });

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  useEffect(() => {
    if (typeof __IS_DEBUG_BUILD__ !== 'undefined' && __IS_DEBUG_BUILD__ && debugAuthorized && engine) {
      (window as any).__V22_TEST_API__ = {
        getStrokeCount: () => {
          try {
            return engine.getStrokeCount?.() ?? 0;
          } catch {
            return 0;
          }
        },
        getCameraPose: () => {
          const cam = engine.getCamera();
          if (!cam) return null;
          return {
            x: Number(cam.position.x.toFixed(3)),
            y: Number(cam.position.y.toFixed(3)),
            z: Number(cam.position.z.toFixed(3)),
          };
        },
        snapView: async (view: 'isometric' | 'front' | 'right' | 'top') => {
          if (view === 'isometric') {
            engine.resetCamera(true);
            engine.snapToView('isometric', true);
          } else {
            engine.snapToView(view, true);
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
          const cam = engine.getCamera();
          if (!cam) return null;
          const perfect = engine.getPerfectView?.();
          return {
            pose: {
              x: Number(cam.position.x.toFixed(3)),
              y: Number(cam.position.y.toFixed(3)),
              z: Number(cam.position.z.toFixed(3)),
            },
            perfectView: perfect?.view ?? null,
          };
        },
        resetView: async () => {
          engine.resetCamera(true);
          await new Promise((resolve) => setTimeout(resolve, 50));
          const cam = engine.getCamera();
          if (!cam) return null;
          const perfect = engine.getPerfectView?.();
          return {
            pose: {
              x: Number(cam.position.x.toFixed(3)),
              y: Number(cam.position.y.toFixed(3)),
              z: Number(cam.position.z.toFixed(3)),
            },
            perfectView: perfect?.view ?? null,
          };
        },
        addTestStroke: () => {
          try {
            return engine.addDebugTestStroke?.(brushSettings, activeLayerId || undefined) ?? -1;
          } catch (e) {
            console.error('addTestStroke error:', e);
          }
          return -1;
        },
        eraseTestStroke: () => {
          try {
            return engine.eraseDebugTestStroke?.() === true;
          } catch (e) {
            console.error('eraseTestStroke error:', e);
            return false;
          }
        },
        testShaderEffects: async (requestedEffects?: string[]) => {
          const effects = requestedEffects?.length ? requestedEffects : [
            'fire', 'ocean_wave', 'anime_cel', 'galaxy', 'lava', 'jelly', 'hologram', 'electric_arc',
          ];
          const errors: Array<{ effect: string; error: string }> = [];
          const rendered: string[] = [];
          for (const effect of effects) {
            try {
              engine.addDebugTestStroke?.({ ...brushSettings, shaderEffect: effect as any, animatedEffect: effect as any }, activeLayerId || undefined);
              const renderer = engine.getRenderer?.();
              if (renderer) {
                renderer.compile(engine.getScene(), engine.getCamera());
                if (renderer.getContext().isContextLost()) throw new Error('WebGL context lost');
              }
              rendered.push(effect);
            } catch (error: any) {
              errors.push({ effect, error: String(error?.message || error) });
            }
          }
          const strokeCount = engine.getStrokeCount?.() ?? 0;
          engine.clearAllStrokes();
          return { requested: effects, rendered, errors, strokeCount, contextLost: engine.getRenderer?.()?.getContext().isContextLost() === true };
        },
        testModels: async (requestedModels?: string[]) => {
          const fixtures = [
            { id: 'debug_box_fixture', variant: 'box' as const },
            { id: 'debug_sphere_fixture', variant: 'sphere' as const },
          ];
          const requested = requestedModels?.length ? new Set(requestedModels) : null;
          const modelFixtures = requested ? fixtures.filter((fixture) => requested.has(fixture.id)) : fixtures;
          const results: Array<{ id: string; name?: string; meshCount?: number; vertexCount?: number; ok: boolean; error?: string }> = [];
          for (const fixture of modelFixtures) {
            try {
              const metadata = engine.setDebugModelFixture?.(fixture.variant);
              if (!metadata) throw new Error('Debug model fixture unavailable');
              results.push({ id: fixture.id, name: metadata.name, meshCount: metadata.meshCount, vertexCount: metadata.vertexCount, ok: metadata.meshCount > 0 });
            } catch (error: any) {
              results.push({ id: fixture.id, ok: false, error: String(error?.message || error) });
            }
          }
          // Return the assertion before resetting the scene. A model teardown
          // can trigger renderer/resource disposal on older WebViews; doing
          // that work on the next turn keeps the bridge response bounded.
          const response = { results, allOk: results.every((result) => result.ok) };
          setTimeout(() => {
            try { engine.clearModel(true, false); } catch (_) { /* debug cleanup only */ }
          }, 0);
          return response;
        },
        testDrawErase: () => {
          const before = engine.getStrokeCount?.() ?? 0;
          const afterDraw = engine.addDebugTestStroke?.(brushSettings, activeLayerId || undefined) ?? before;
          const erased = engine.eraseDebugTestStroke?.() === true;
          const afterErase = engine.getStrokeCount?.() ?? afterDraw;
          return { before, afterDraw, erased, afterErase, drawIncreased: afterDraw > before, eraseDecreased: erased && afterErase < afterDraw };
        },
        openModal: (modal: string) => {
          if (modal === 'more') return false;
          else if (modal === 'settings') setIsSettingsOpen(true);
          else if (modal === 'export') setIsExportOpen(true);
          else if (modal === 'illumination') setIsIlluminationOpen(true);
          else if (modal === 'sessions') setIsSessionModalOpen(true);
          else if (modal === 'color') setIsColorStudioOpen(true);
          return true;
        },
        closeModal: () => {
          setIsSettingsOpen(false);
          setIsExportOpen(false);
          setIsIlluminationOpen(false);
          setIsSessionModalOpen(false);
          setIsColorStudioOpen(false);
          return true;
        },
        inspectOpenModal: () => {
          const dialog = document.querySelector('[role="dialog"]') as HTMLElement | null;
          if (!dialog) return { found: false };
          const titleEl = dialog.querySelector('h1, h2, h3, [id*="title"]') as HTMLElement | null;
          const titleText = titleEl ? (titleEl.textContent || '').trim() : '';
          const closeBtn = dialog.querySelector('button[aria-label*="Close"], button[aria-label*="close"], button:has(svg.lucide-x)') as HTMLElement | null;
          let closeBtnWidth = 0;
          let closeBtnHeight = 0;
          if (closeBtn) {
            const rect = closeBtn.getBoundingClientRect();
            closeBtnWidth = Math.round(rect.width);
            closeBtnHeight = Math.round(rect.height);
          }
          const scrollable = dialog.scrollHeight >= dialog.clientHeight || dialog.querySelector('.overflow-y-auto, [class*="scroll"]') !== null;
          const backdrop = document.querySelector('.fixed.inset-0, [aria-hidden="true"].bg-black') !== null;
          return {
            found: true,
            title: titleText,
            closeBtnWidth,
            closeBtnHeight,
            closeBtnValid: closeBtnWidth >= 44 && closeBtnHeight >= 44,
            isScrollable: scrollable,
            hasBackdrop: backdrop,
          };
        },
        getAutoSaveStatus: () => autoSaveStatus,
        saveTestProject: async () => {
          await triggerAutoSave('debug_test');
          return { status: autoSaveStatus };
        },
        setOfflineSimulation: async (enabled: boolean) => {
          const state = (window as any).__V22_TEST_SIMULATION_STATE__;
          if (!state) throw new Error('Debug simulation state unavailable');
          state.simulateOffline = Boolean(enabled);
          return {
            enabled: state.simulateOffline,
            onlineState: state.simulateOffline ? 'offline' : (navigator.onLine ? 'online' : 'offline'),
          };
        },
        getPointerTelemetry: () => ({ ...debugPointerTelemetryRef.current }),
        resetPointerTelemetry: () => {
          debugPointerTelemetryRef.current = {
            lastType: 'none',
            lastPressure: 0,
            eventCount: 0,
            maxPressure: 0,
          };
          return true;
        },
        exportGlbData: async () => {
          let debugShaderStrokeAdded = false;
          try {
            // Add one deterministic animated-FX stroke so this assertion
            // proves ShaderMaterial colors were converted to portable COLOR_0
            // data, rather than merely finding a normal PBR material.
            const before = engine.getStrokeCount?.() ?? 0;
            engine.addDebugTestStroke?.({
              ...brushSettings,
              materialType: 'animated_fx',
              shaderEffect: 'fire',
              animatedEffect: 'fire',
            }, activeLayerId || undefined);
            debugShaderStrokeAdded = (engine.getStrokeCount?.() ?? before) > before;
            const glb = await engine.exportGLB?.();
            if (!glb) return { success: false, reason: 'No GLB returned' };
            const bytes = new Uint8Array(await glb.arrayBuffer());
            const magic = bytes.slice(0, 4);
            const magicStr = String.fromCharCode(...magic);
            let bakedColorMaterials = 0;
            try {
              const jsonLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(12, true);
              const jsonText = new TextDecoder().decode(bytes.slice(20, 20 + jsonLength)).trim();
              const document = JSON.parse(jsonText);
              bakedColorMaterials = (document.materials || []).filter((material: any) =>
                Array.isArray(material?.pbrMetallicRoughness?.baseColorFactor)
              ).length;
              const bakedVertexColorPrimitives = (document.meshes || []).flatMap((mesh: any) => mesh.primitives || [])
                .filter((primitive: any) => primitive?.attributes?.COLOR_0 !== undefined).length;
              return {
                success: true,
                byteLength: bytes.byteLength,
                magic: magicStr,
                isValidGlb: magicStr === 'glTF',
                bakedColorMaterials,
                bakedVertexColorPrimitives,
                hasBakedColors: bakedColorMaterials > 0 && bakedVertexColorPrimitives > 0,
              };
            } catch (_) {
              bakedColorMaterials = 0;
            }
            return {
              success: true,
              byteLength: bytes.byteLength,
              magic: magicStr,
              isValidGlb: magicStr === 'glTF',
              bakedColorMaterials,
              bakedVertexColorPrimitives: 0,
              hasBakedColors: bakedColorMaterials > 0,
            };
          } catch (err: any) {
            return { success: false, reason: err?.message };
          } finally {
            if (debugShaderStrokeAdded) {
              try { engine.eraseDebugTestStroke?.(); } catch (_) { /* debug cleanup only */ }
            }
          }
        },
        exportPngData: () => {
          try {
            const canvas = engine.getRenderer?.()?.domElement;
            if (!canvas) return { success: false, reason: 'No canvas' };
            const dataUrl = canvas.toDataURL('image/png');
            return {
              success: true,
              dataUrlLength: dataUrl.length,
              isValidPng: dataUrl.startsWith('data:image/png;base64,'),
            };
          } catch (err: any) {
            return { success: false, reason: err?.message };
          }
        },
        getSystemInfo: async () => {
          const simulatedOffline = Boolean((window as any).__V22_TEST_SIMULATION_STATE__?.simulateOffline);
          return {
            onLine: navigator.onLine,
            simulatedOffline,
            onlineState: simulatedOffline ? 'offline' : (navigator.onLine ? 'online' : 'offline'),
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
          };
        },
      };

      const handleDebugPointer = (event: PointerEvent) => {
        const pressure = Number.isFinite(event.pressure) ? event.pressure : 0;
        const telemetry = debugPointerTelemetryRef.current;
        telemetry.lastType = event.pointerType || 'unknown';
        telemetry.lastPressure = Number(pressure.toFixed(3));
        telemetry.eventCount += 1;
        telemetry.maxPressure = Math.max(telemetry.maxPressure, pressure);
      };
      window.addEventListener('pointerdown', handleDebugPointer, { passive: true });
      window.addEventListener('pointermove', handleDebugPointer, { passive: true });

      const interval = setInterval(() => {
        let strokeCount = 0;
        try {
          strokeCount = engine.getStrokeCount?.() || 0;
        } catch (_) {}
        const cam = engine.getCamera();
        const pose = cam ? `${cam.position.x.toFixed(2)},${cam.position.y.toFixed(2)},${cam.position.z.toFixed(2)}` : 'none';
        import('@debug-bridge').then((mod) => {
          mod.emitTelemetry({
            strokeCount,
            cameraPose: pose,
            autoSaveStatus,
            activeTool: tool,
          });
        });
      }, 1000);
      return () => {
        clearInterval(interval);
        window.removeEventListener('pointerdown', handleDebugPointer);
        window.removeEventListener('pointermove', handleDebugPointer);
        delete (window as any).__V22_TEST_API__;
        delete (window as any).__V22_TEST_RESULTS__;
      };
    }
  }, [debugAuthorized, engine, autoSaveStatus, tool, activeLayerId, triggerAutoSave]);

  useEffect(() => {
    if (!engine) return;
    setActiveGuide(engine.getActiveGuide());
    return engine.subscribeActiveGuideChange((guide) => {
      setActiveGuide(guide);
      if (guide) {
        setTargetScope('guide');
        setGizmoMode('Standard');
        setActiveController('navigator');
        setShowStudioNavigator(true);
      }
    });
  }, [engine]);

  useEffect(() => {
    const handleModelsChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setLoadedModels(e.detail);
      }
      if (engine) {
        const selId = engine.getActiveSelectedModelId();
        if (selId) setActiveModelId(selId);
      }
    };
    window.addEventListener('MODELS_CHANGED', handleModelsChanged);
    return () => window.removeEventListener('MODELS_CHANGED', handleModelsChanged);
  }, [engine]);

  const handleSelectModel = useCallback((modelId: string | null) => {
    setActiveModelId(modelId);
    if (engine) {
      engine.setActiveSelectedModel(modelId);
    }
  }, [engine]);

  const handleSelectLayer = useCallback((layerId: string) => {
    setActiveLayerId(layerId);
    if (engine) {
      engine.setActiveLayer(layerId);
    }
  }, [engine]);

  const handleSelectTargetScope = useCallback((scope: TransformTargetScope) => {
    setTargetScope(scope);
  }, []);

  const handleEngineReady = useCallback((inst: StudioEngine) => {
    setEngine(inst);
    inst.setSkyPreset('off');
    inst.setTheme(theme);
    inst.setGrid(showGrid);
    inst.setupDefaultDrawingPlane();
    inst.setDrawingCanvasSize(canvasWidth, canvasHeight);
    inst.setDrawingCanvasOpacity(canvasOpacity);
    inst.setDrawingCanvasColor(canvasColor);
    inst.toggleDrawingPlane(true);
    inst.setPostProcessSettings(DEFAULT_POST_SETTINGS);
    setGpuInfo(inst.getGPUInfo());
    setLoadedModels(inst.getLoadedModels());
    inst.onModelsChanged = (models) => {
      setLoadedModels(models);
      if (models.length > 0 && !activeModelId) {
        setActiveModelId(models[0].id);
      }
    };
    inst.onGPUInfoUpdate = (info) => {
      setGpuInfo(info);
    };
    inst.onPathTracingProgress = (info) => {
      setPathTracingProgress(info);
    };
    // FPS and camera pose arrive every frame. They go to the telemetry store, not
    // React state - FpsCounter and any pose consumer subscribe as leaves, so a
    // 60 fps stream never re-renders this component tree.
    inst.onFpsUpdate = (f) => {
      publishFps(f);
    };
    inst.onProjectionChange = (mode) => {
      setProjectionMode(mode);
    };
    inst.onHistoryChange = (u, r) => {
      setCanUndo(u);
      setCanRedo(r);
      if (u && !getHasOnboarded()) {
        setHasOnboarded(true);
      }
    };
    inst.onMetadataUpdate = (meta) => {
      setModelMetadata(meta);
      setActiveModelName(meta.name);
    };
    inst.onViewChange = (pv) => {
      setPerfectView(pv);
    };
    inst.onCameraChange = (sph) => {
      // sph is a pooled object owned by the engine; only its numbers are read.
      publishCameraPose(sph.radius, sph.theta, sph.phi);
    };
    inst.onAutoSaveTrigger = (reason) => {
      triggerAutoSave(reason === 'model_loaded' ? 'model' : 'changes');
    };
    inst.onDNAInjected = (dna: HolisticStrokeDNA) => {
      setActiveDNA(dna);
      setBrushSettings((prev) => ({
        ...prev,
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
      }));
    };
    inst.onShapeSnapped = (result) => {
      const typeLabels: Record<string, string> = {
        line: 'Straight Line',
        circle: 'Perfect Circle',
        ellipse: 'Clean Ellipse',
        arc: 'Circular Arc',
        triangle: 'Triangle',
        rectangle: 'Rectangle',
        polygon: 'Closed Polygon',
      };
      const shapeType = result.detectedShape;
      const label = typeLabels[shapeType] || shapeType;
      setSnappedShapeNotice(`Snapped to ${label} (${Math.round(result.confidence * 100)}% fit)`);
      setTimeout(() => {
        setSnappedShapeNotice((cur) => (cur?.includes(label) ? null : cur));
      }, 2400);
    };
  }, [triggerAutoSave, activeModelId, theme, showGrid, canvasColor, canvasHeight, canvasOpacity, canvasWidth]);

  // Transform Navigator Gizmo Handlers
  const [isGizmoLocked, setIsGizmoLocked] = useState<boolean>(false);

  const handleGizmoTranslate = useCallback(
    (payload: TranslationEventPayload) => {
      if (!engine) return;
      if (payload.source.startsWith('2d-move-stick')) {
        // Dial emits screen px for this frame already (time-based glide) - do not rescale
        engine.translateScreenSpace(payload.deltaX, payload.deltaY, targetScope, isGizmoLocked);
      } else if (payload.source.startsWith('3d-node')) {
        // Dial emits world units already (time-based glide) - do not rescale here
        if (payload.x !== 0) engine.translateAxis3D('x', payload.x, targetScope);
        if (payload.y !== 0) engine.translateAxis3D('y', payload.y, targetScope);
        if (payload.z !== 0) engine.translateAxis3D('z', payload.z, targetScope);
      }
    },
    [engine, isGizmoLocked, targetScope]
  );

  const handleGizmoRotate = useCallback(
    (payload: RotationEventPayload) => {
      if (!engine) return;
      if (payload.source === '2d-rotate-handle') {
        engine.rotateAxis3D('z', (payload.deltaAngle * Math.PI) / 180, targetScope, isGizmoLocked);
      } else if (payload.source === '3d-trackball-sphere') {
        engine.rotateTrackball(payload.ry, payload.rx, targetScope);
      } else if (payload.axis === 'x' || payload.axis === 'y' || payload.axis === 'z') {
        engine.rotateAxis3D(payload.axis, (payload.deltaAngle * Math.PI) / 180, targetScope, isGizmoLocked);
      }
    },
    [engine, isGizmoLocked, targetScope]
  );

  const handleGizmoScale = useCallback(
    (payload: ScaleEventPayload) => {
      if (!engine) return;
      if (payload.handle === 'scale-y') {
        engine.scaleAxis('y', 1 + payload.deltaScale, targetScope, isGizmoLocked);
      } else if (payload.handle === 'scale-x') {
        engine.scaleAxis('x', 1 + payload.deltaScale, targetScope, isGizmoLocked);
      } else if (payload.handle === 'scale-uniform') {
        engine.scaleAxis('uniform', 1 + payload.deltaScale, targetScope, isGizmoLocked);
      } else if (payload.deltaScale) {
        engine.scaleAxis('uniform', 1 + payload.deltaScale, targetScope, isGizmoLocked);
      }
    },
    [engine, isGizmoLocked, targetScope]
  );

  const handleGizmoReset = useCallback(() => {
    if (!engine) return;
    engine.resetTransform(targetScope);
    engine.snapToView('isometric');
  }, [engine, targetScope]);

  const handleGizmoInteractionStart = useCallback(
    (handleName: string) => {
      if (!engine) return;
      engine.beginTransform(targetScope);
    },
    [engine, targetScope]
  );

  const handleGizmoInteractionEnd = useCallback(
    (handleName: string) => {
      if (!engine) return;
      engine.endTransform();
    },
    [engine]
  );

  // Watch layer modifications for auto-save
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    triggerAutoSave('layers');
  }, [layers, triggerAutoSave]);

  // Sync theme to engine & persist
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem('mody_theme', nextTheme);
    } catch (_) {}
    engine?.setTheme(nextTheme);
  };

  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    try {
      localStorage.setItem('mody_theme', newTheme);
    } catch (_) {}
    engine?.setTheme(newTheme);
  };

  // Full Project State Save (.remix3d JSON file)
  const handleSaveProject = useCallback(async () => {
    if (!engine) return;
    const projectData = engine.exportProjectData(activeModelName || 'Remix 3D Project', layers);
    const jsonStr = JSON.stringify(projectData, null, 2);
    const filename = `${(projectData.name || 'Remix3D_Project').replace(/\s+/g, '_')}_${Date.now()}.remix3d`;
    await PlatformBridge.saveModelFile(filename, jsonStr, [
      { name: 'Remix 3D Project', extensions: ['remix3d', 'json'] },
    ]);
    PlatformBridge.triggerHaptic('success');
  }, [engine, layers, activeModelName]);

  // Save current project session directly to a folder chosen by the user
  const handleSaveProjectToFolder = useCallback(async (customName?: string) => {
    if (!engine) return;
    const nameToUse = (typeof customName === 'string' && customName.trim()) ? customName.trim() : (activeModelName || 'Remix 3D Project');
    const projectData = engine.exportProjectData(nameToUse, layers);
    const jsonStr = JSON.stringify(projectData, null, 2);
    const filename = `${(projectData.name || 'Remix3D_Project').replace(/\s+/g, '_')}_${Date.now()}.remix3d`;
    const result = await PlatformBridge.saveFileToChosenFolder(filename, jsonStr, [
      { name: 'Remix 3D Project', extensions: ['remix3d', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ]);
    if (result) {
      PlatformBridge.triggerHaptic('success');
    }
  }, [engine, layers, activeModelName]);

  // Full Project State Load (.remix3d JSON file)
  const handleLoadProject = useCallback((file: File) => {
    if (!engine) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const projectData: ProjectSaveData = JSON.parse(content);
        await engine.importProjectData(projectData);
        if (projectData.layers && projectData.layers.length > 0) {
          setLayers(projectData.layers);
          setActiveLayerId(projectData.layers[0].id);
        }
        if (projectData.lightingPreset) {
          setLightingPreset(projectData.lightingPreset);
        }
        if (projectData.showGrid !== undefined) {
          setShowGrid(projectData.showGrid);
        }
        if (projectData.showWireframe !== undefined) {
          setShowWireframe(projectData.showWireframe);
        }
        if (projectData.activeModelName || projectData.name) {
          setActiveModelName(projectData.activeModelName || projectData.name);
        }
        if (projectData.activeModelId) {
          setActiveModelId(projectData.activeModelId);
        }
        if (projectData.showPlane !== undefined) {
          setShowPlane(projectData.showPlane);
        }
        haptics.trigger('success');
      } catch (err) {
        console.error('Failed to parse .remix3d project file:', err);
        alert('Invalid or corrupted .remix3d project file.');
      }
    };
    reader.readAsText(file);
  }, [engine]);

  // Save named project session to local IndexedDB storage
  const handleSaveNamedSession = useCallback(async (name: string) => {
    if (!engine) return;
    const projectData = engine.exportProjectData(name, layers);
    let thumbnail: string | undefined;
    try {
      thumbnail = engine.captureSnapshot();
    } catch (_) {}
    const session: SavedProjectSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name || activeModelName || 'Untitled Session',
      timestamp: Date.now(),
      thumbnail,
      strokeCount: projectData.strokes?.length || 0,
      layerCount: layers.length,
      activeModelName,
      projectData,
    };
    await saveProjectSession(session);
    haptics.trigger('success');
  }, [engine, layers, activeModelName]);

  // Automated Testing / Robot Tester Hook
  useEffect(() => {
    (window as any).__testApp = {
      getEngine: () => engine,
      setTheme: handleSetTheme,
      setTool,
      setBrushSettings,
      openSheet: (sheet: any) => openSheetId(sheet),
      toggleSheet: (sheet: any) => toggleSheet(sheet),
      openModal: (modalName: string) => {
        switch (modalName) {
          case 'settings': toggleSheet('settings'); break;
          case 'sessions': setIsSessionModalOpen(true); break;
          case 'illumination': setIsIlluminationOpen(true); break;
          case 'models': setIsModelsOpen(true); break;
          case 'importer': setIsModelImporterOpen(true); break;
          case 'colorStudio': setIsColorStudioOpen(true); break;
          case 'renderSettings': setIsRenderSettingsOpen(true); break;
          case 'export': setIsExportOpen(true); break;
          case 'deform':
          case 'curveDecimate': setIsDecimateOpen(true); break;
          case 'bentGuide': setIsBentGuideOpen(true); break;
          case 'scaffolding': setIsScaffoldingOpen(true); break;
          case 'customMirror': setIsCustomMirrorOpen(true); break;
          case 'arViewer': setIsARViewerOpen(true); break;
          case 'clipboard': setIsClipboardOpen(true); break;
          case 'dna': setActiveDNA({
            sourceType: 'stroke',
            colorHex: '#38bdf8',
            size: 0.04,
            opacity: 1.0,
            roughness: 0.3,
            metalness: 0.2,
            emissiveIntensity: 0.5,
            materialType: 'shaded',
            profile: 'tube',
            patternType: 'none',
            patternScale: 1.0,
            patternIntensity: 1.0,
            shaderEffect: 'none',
            timestamp: Date.now()
          }); break;
        }
      },
      closeAllModals: () => {
        setPendingWorkLoss(null);
        closeSheet();
        setIsSessionModalOpen(false);
        setIsIlluminationOpen(false);
        setIsModelsOpen(false);
        setIsModelImporterOpen(false);
        setIsColorStudioOpen(false);
        setIsRenderSettingsOpen(false);
        setIsExportOpen(false);
        setIsDecimateOpen(false);
        setIsBentGuideOpen(false);
        setIsScaffoldingOpen(false);
        setIsCustomMirrorOpen(false);
        setIsARViewerOpen(false);
        setActiveDNA(null);
        setIsClipboardOpen(false);
      },
      getActiveGuide: () => activeGuide,
      getTargetScope: () => targetScope,
      setTargetScope: (scope: any) => handleSelectTargetScope(scope),
    };
  }, [engine, handleSetTheme, setTool, setBrushSettings, activeGuide, targetScope, handleSelectTargetScope]);

  // 1-Tap Quick Save (Ctrl+S / Top Bar Quick Save button)
  const handleQuickSave = useCallback(async () => {
    if (!engine) return;
    const name = activeModelName ? `${activeModelName} Session` : 'Quick Session';
    await handleSaveNamedSession(name);
    setSnappedShapeNotice('Session saved with full undo history!');
    setTimeout(() => {
      setSnappedShapeNotice((cur) => (cur === 'Session saved with full undo history!' ? null : cur));
    }, 2200);
  }, [engine, activeModelName, handleSaveNamedSession]);

  const handleBeforeReplace = useCallback((modelName: string, action: () => Promise<void>) => {
    setPendingWorkLoss({
      title: `Replace scene with "${modelName}"?`,
      description: 'Loading this model will replace your current workspace. You can save your work first or proceed without saving.',
      actionLabel: 'Load Model',
      action,
    });
  }, []);

  const handleBeforeDestructiveAction = useCallback((title: string, description: string, actionLabel: string, action: () => Promise<void> | void) => {
    setPendingWorkLoss({
      title,
      description,
      actionLabel,
      action,
    });
  }, []);
  const handleClearCanvas = useCallback(() => {
    handleBeforeDestructiveAction(
      'Clear canvas?',
      'This removes every stroke from all layers. The canvas surface and your layer structure stay in place.',
      'Clear Canvas',
      () => {
        engine?.clearAllStrokes();
        triggerAutoSave('canvas_cleared');
      }
    );
  }, [engine, handleBeforeDestructiveAction, triggerAutoSave]);

  const handleWorkLossSave = useCallback(async () => {
    if (!pendingWorkLoss) return;
    setWorkLossBusy(true);
    try {
      const defaultName = activeModelName ? `${activeModelName} (Auto-Saved)` : 'Session (Auto-Saved)';
      await handleSaveNamedSession(defaultName);
      const action = pendingWorkLoss.action;
      setPendingWorkLoss(null);
      await action();
    } catch (err) {
      console.error('Failed to save before replacement:', err);
    } finally {
      setWorkLossBusy(false);
    }
  }, [pendingWorkLoss, activeModelName, handleSaveNamedSession]);

  const handleWorkLossReplace = useCallback(async () => {
    if (!pendingWorkLoss) return;
    setWorkLossBusy(true);
    try {
      const action = pendingWorkLoss.action;
      setPendingWorkLoss(null);
      await action();
    } catch (err) {
      console.error('Failed to proceed with replacement:', err);
    } finally {
      setWorkLossBusy(false);
    }
  }, [pendingWorkLoss]);

  const handleWorkLossCancel = useCallback(() => {
    if (workLossBusy) return;
    setPendingWorkLoss(null);
  }, [workLossBusy]);

  // Load named project session from local IndexedDB storage
  const handleLoadNamedSession = useCallback(async (session: SavedProjectSession) => {
    if (!engine || !session?.projectData) return;
    await engine.importProjectData(session.projectData);
    if (session.projectData.layers && session.projectData.layers.length > 0) {
      setLayers(session.projectData.layers);
      setActiveLayerId(session.projectData.layers[0].id);
    }
    if (session.projectData.lightingPreset) {
      setLightingPreset(session.projectData.lightingPreset);
    }
    if (session.projectData.showGrid !== undefined) {
      setShowGrid(session.projectData.showGrid);
    }
    if (session.projectData.showWireframe !== undefined) {
      setShowWireframe(session.projectData.showWireframe);
    }
    if (session.projectData.activeModelName || session.name) {
      setActiveModelName(session.projectData.activeModelName || session.name);
    }
    if (session.projectData.activeModelId) {
      setActiveModelId(session.projectData.activeModelId);
    }
    if (session.projectData.showPlane !== undefined) {
      setShowPlane(session.projectData.showPlane);
    }
    haptics.trigger('success');
  }, [engine]);


  // Sync grid toggle
  const handleToggleGrid = () => {
    const next = !showGrid;
    setShowGrid(next);
    engine?.toggleGrid(next);
  };

  // Sync drawing plane toggle
  const handleTogglePlane = () => {
    if (engine) {
      const next = engine.toggleDrawingPlane();
      setShowPlane(next);
    } else {
      setShowPlane((prev) => !prev);
    }
  };

  const handleCanvasFormatChange = useCallback((format: CanvasPreset) => {
    setCanvasFormat(format);
    const dimensions = CANVAS_FORMATS[format];
    setCanvasWidth(dimensions.width);
    setCanvasHeight(dimensions.height);
    engine?.setDrawingCanvasSize(dimensions.width, dimensions.height);
  }, [engine]);

  const handleCanvasSizeChange = useCallback((width: number, height: number) => {
    const safeWidth = Math.min(8, Math.max(1, width));
    const safeHeight = Math.min(8, Math.max(1, height));
    setCanvasFormat('custom');
    setCanvasWidth(safeWidth);
    setCanvasHeight(safeHeight);
    engine?.setDrawingCanvasSize(safeWidth, safeHeight);
  }, [engine]);

  const handleCanvasTransparencyChange = useCallback((transparency: number) => {
    const nextTransparency = Math.min(100, Math.max(0, transparency));
    const opacity = 1 - nextTransparency / 100;
    setCanvasOpacity(opacity);
    engine?.setDrawingCanvasOpacity(opacity);
  }, [engine]);

  const handleCanvasColorChange = useCallback((color: string) => {
    setCanvasColor(color);
    engine?.setDrawingCanvasColor(color);
  }, [engine]);

  // Cycle lighting presets
  const handleCycleLighting = () => {
    const presets: LightingPreset[] = ['studio', 'daylight', 'neon', 'sunset', 'clay_neutral'];
    const idx = presets.indexOf(lightingPreset);
    const next = presets[(idx + 1) % presets.length];
    setLightingPreset(next);
    engine?.setLightingPreset(next);
  };

  const handleResetCamera = () => {
    engine?.snapToView('isometric');
  };

  const handleUndo = useCallback(() => {
    engine?.undo();
  }, [engine]);

  const handleRedo = useCallback(() => {
    engine?.redo(layers);
  }, [engine, layers]);

  const [clipboardCount, setClipboardCount] = useState(0);

  const handleCopyStrokes = useCallback(() => {
    if (!engine) return;
    const count = engine.copyStrokes(activeLayerId);
    setClipboardCount(count);
    triggerAutoSave('curves_copied');
  }, [engine, activeLayerId, triggerAutoSave]);

  const handlePasteStrokes = useCallback(() => {
    if (!engine) return;
    const pasted = engine.pasteStrokes(activeLayerId);
    if (pasted > 0) {
      triggerAutoSave('curves_pasted');
    }
  }, [engine, activeLayerId, triggerAutoSave]);

  const handleClearLayerStrokes = useCallback(
    (layerId: string) => {
      engine?.deleteLayerStrokes(layerId);
    },
    [engine]
  );

  const handleMergeLayerDown = useCallback(
    (topLayerId: string) => {
      const topIdx = layers.findIndex((l) => l.id === topLayerId);
      if (topIdx < 0 || topIdx >= layers.length - 1) return;
      const bottomLayer = layers[topIdx + 1];
      const topLayer = layers[topIdx];

      engine?.mergeLayerDown(topLayer.id, bottomLayer.id, topLayer.opacity, topLayer.blendMode || 'normal');

      // Remove merged top layer from state
      setLayers((prev) => prev.filter((l) => l.id !== topLayerId));

      if (activeLayerId === topLayerId) {
        setActiveLayerId(bottomLayer.id);
      }
    },
    [engine, layers, activeLayerId]
  );

  // Sync layers state (opacities, visibility, GPU blend modes) to engine
  useEffect(() => {
    if (!engine) return;
    engine.syncLayers(layers);
    const active = layers.find((l) => l.id === activeLayerId);
    if (active) {
      engine.setActiveLayer(activeLayerId, active.opacity);
    }
  }, [engine, layers, activeLayerId]);

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S, brush size, tools)
  useAppShortcuts({
    handleUndo,
    handleRedo,
    handleCopyStrokes,
    handlePasteStrokes,
    handleQuickSave,
    setTool,
    setBrushSettings,
  });

  // Global Drag & Drop for 3D Models
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setWindowDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      // Check if left window
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setWindowDragOver(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setWindowDragOver(false);
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file && engine) {
          try {
            const buffer = await file.arrayBuffer();
            await engine.loadGLTF(buffer, file.name);
            setActiveModelName(file.name);
          } catch (err) {
            console.warn('Failed to load dropped 3D file directly:', err);
          }
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [engine]);

  const isNonColorModalActive =
    isIlluminationOpen ||
    isModelImporterOpen ||
    isModelsOpen ||
    isSessionModalOpen ||
    isExportOpen ||
    isBentGuideOpen ||
    isCustomMirrorOpen ||
    isDecimateOpen ||
    isSettingsOpen ||
    isARViewerOpen ||
    isClipboardOpen ||
    isScaffoldingOpen ||
    isRenderSettingsOpen ||
    isModelDisplayOpen ||
    isLiquifyOpen;

  // A color editor may block drawing without removing the workspace tools.
  const isAnyModalActive = isNonColorModalActive ||
    (isColorStudioOpen && !colorStudioAllowsWorkspaceInteraction);

  return (
    <DeviceSimulatorFrame>
      <div
        className={`paperrocket-ui relative w-full h-full overflow-hidden select-none transition-colors duration-200 ${
          theme === 'light' ? 'bg-[#ebe5dc] text-neutral-800' : 'bg-[#242629] text-neutral-100'
        }`}
      >
      {/* Main 3D Viewport */}
      <Viewport
        tool={tool}
        onSelectTool={setTool}
        brushSettings={brushSettings}
        onUpdateBrushSettings={(newSettings) =>
          setBrushSettings((prev) => ({ ...prev, ...newSettings }))
        }
        activeLayer={activeLayer}
        layers={layers}
        symmetry={symmetry}
        onSelectSymmetry={setSymmetry}
        lightingPreset={lightingPreset}
        showWireframe={showWireframe}
        showGrid={showGrid}
        onEngineReady={handleEngineReady}
        onColorPick={(hex) => {
          setBrushSettings((prev) => ({
            ...prev,
            color: hex,
            solidColor: hex,
            materialType: 'shadeless',
            shaderEffect: undefined,
            customShader: undefined,
            matcapUrl: undefined,
            previewUrl: undefined,
            matcapTexture: undefined,
            activeLookName: 'Flat Paint',
          }));
          setTool('brush');
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        cameraInteracting={cameraInteracting}
        setCameraInteracting={setCameraInteracting}
        fingerPenMode={fingerPenMode}
        onToggleFingerPenMode={setFingerPenMode}
        liquifySettings={liquifySettings}
        onOpenColorPanel={() => setIsColorStudioOpen(true)}
        disableContextMenu={disableContextMenu}
        onToggleDisableContextMenu={handleToggleDisableContextMenu}
        theme={theme}
        onStylusDetected={setIsStylusDetected}
      />

      {/* Top Strip (Studio Workspace Surface) */}
      <StudioTopStrip
        projectName={activeModelName}
        autoSaveStatus={autoSaveStatus}
        lastSavedTime={lastSavedTime}
        onRetrySave={triggerAutoSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        theme={theme}
        onOpenIllumination={() => setIsIlluminationOpen(true)}
        onOpenSessions={() => setIsSessionModalOpen(true)}
      />

      {/* Developer & Test Panel (Exclusively rendered when native debug is authorized) */}
      {typeof __IS_DEBUG_BUILD__ !== 'undefined' && __IS_DEBUG_BUILD__ && debugAuthorized && DebugTestPanel && (
        <Suspense fallback={null}>
          <DebugTestPanel
            open={isDebugPanelOpen}
            onClose={() => setIsDebugPanelOpen(false)}
            engine={engine}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            lastAutoSaveTime={lastSavedTime}
            lastAutoSaveResult={autoSaveStatus}
            currentTool={tool}
          />
        </Suspense>
      )}

      {/* Omnipresent Safety & Recovery Anchor: "Lost? Tap to return to artwork" */}
      <CameraRecoveryPill engine={engine} theme={theme} />

      {/* Shared 3D Model Importer */}
      <DeferredPanel active={isModelImporterOpen}>
        <StudioImporter
          isOpen={isModelImporterOpen}
          engine={engine}
          onClose={() => setIsModelImporterOpen(false)}
          onSaved={(n) => setActiveModelName(n)}
          theme={theme}
          onBeforeReplace={handleBeforeReplace}
        />
      </DeferredPanel>

      {/* Studio Workspace Shell */}
      {(() => {
        return null;
      })()}
      <ProShell
        isModalActive={Boolean(isNonColorModalActive || openSheet === 'settings')}
        theme={theme}
            engine={engine}
            tool={tool}
            setTool={setTool}
            brushSettings={brushSettings}
            setBrushSettings={setBrushSettings}
            isGizmoActive={gizmoMode !== 'Hidden' && activeController !== 'hidden' && showStudioNavigator}
            onToggleGizmo={handleToggleGizmo}
            isGizmoLocked={isGizmoLocked}
            onToggleLock={() => setIsGizmoLocked((prev) => !prev)}
            targetScope={targetScope}
            onSelectTargetScope={handleSelectTargetScope}
            activeGuide={activeGuide}
            onGizmoReset={handleGizmoReset}
            onOpenColorStudio={() => {
              closeSheet();
              setIsColorStudioOpen(true);
            }}
            activeModelName={activeModelName}
            modelDisplayMode={modelDisplayMode}
            onSetModelDisplayMode={(mode) => {
              setModelDisplayMode(mode);
              engine?.setModelDisplayMode(mode);
            }}
            onOpenModelLibrary={() => {
              closeSheet();
              setIsModelsOpen(true);
            }}
            onOpenImporter={() => {
              closeSheet();
              setIsModelImporterOpen(true);
            }}
            liquifySettings={liquifySettings}
            setLiquifySettings={setLiquifySettings}
            isLiquifyOpen={isLiquifyOpen}
            onOpenLiquify={() => {
              setTool('liquify');
              setIsLiquifyOpen(true);
              engine?.startLiquifySession();
            }}
            isCompareActive={isCompareActive}
            onToggleCompare={(active) => {
              setIsCompareActive(active);
              engine?.toggleLiquifyCompare(active);
            }}
            onApplyLiquify={() => {
              engine?.commitLiquify();
              setIsLiquifyOpen(false);
              setTool('brush');
            }}
            onCancelLiquify={() => {
              engine?.cancelLiquify();
              setIsLiquifyOpen(false);
              setTool('brush');
            }}
            onOpenBentGuide={() => {
              closeSheet();
              setIsBentGuideOpen(true);
            }}
            onOpenScaffolding={() => {
              closeSheet();
              setIsScaffoldingOpen(true);
            }}
            onOpenCustomMirror={() => {
              closeSheet();
              setIsCustomMirrorOpen(true);
            }}
            onOpenDecimate={() => {
              closeSheet();
              setIsDecimateOpen(true);
            }}
            layers={layers}
            setLayers={setLayers}
            activeLayerId={activeLayerId}
            setActiveLayerId={setActiveLayerId}
            onClearLayerStrokes={handleClearLayerStrokes}
            onMergeLayerDown={handleMergeLayerDown}
            onBeforeDestructiveAction={handleBeforeDestructiveAction}
            onOpenIllumination={() => {
              closeSheet();
              setIsIlluminationOpen(true);
            }}
            isIlluminationOpen={isIlluminationOpen}
          />

      {/* First-Stroke Teaching Hint (Non-modal, non-blocking) */}
      <FirstStrokeHint
        brushSettings={brushSettings}
        activeGuide={activeGuide}
        theme={theme}
        hidden={Boolean(isAnyModalActive || openSheet !== null)}
      />

      {/* FPS & Input Lag Diagnostics Counter */}
      {showPerformanceStats && (
        <FpsCounter
          uiScale={uiScale}
          theme={theme}
          fullDebug={showPerformanceStats}
          onToggleFullDebug={() => setShowPerformanceStats((prev) => !prev)}
        />
      )}

      {/* Dynamic Screen Center Crosshair Reticle */}
      <ScreenCenterCrosshair
        active={crosshairActive}
        mode="3d"
        actionLabel={crosshairAction}
        valueLabel={crosshairValue}
      />


      {/* 3D Navigation Controller: Option 3 Sphere Navigator */}
      {gizmoMode !== 'Hidden' && activeController !== 'hidden' && showStudioNavigator &&
        !isAnyModalActive && !isColorStudioOpen && openSheet === null && !studioShelfOpen && (
          navigatorStyle === 'sphere' ? (
            <Option3SphereNavigator
              engine={engine}
              theme={theme}
              targetScope={targetScope}
              onSelectTargetScope={handleSelectTargetScope}
              layers={layers}
              activeLayerId={activeLayerId}
              onSelectLayer={handleSelectLayer}
              models={loadedModels}
              activeModelId={activeModelId}
              onSelectModel={handleSelectModel}
              navigatorLayout={navigatorStyle}
              onNavigatorLayoutChange={handleNavigatorStyleChange}
              onClose={() => handleControllerChange('hidden')}
              navigatorSensitivity={navigatorSensitivity}
              onSensitivityChange={setNavigatorSensitivity}
              projectionMode={projectionMode}
              onToggleProjection={handleToggleProjection}
            />
          ) : (
            <JoystickNavigator
              engine={engine}
              theme={theme}
              layout={navigatorStyle}
              targetScope={targetScope}
              onSelectTargetScope={handleSelectTargetScope}
              layers={layers}
              activeLayerId={activeLayerId}
              onSelectLayer={handleSelectLayer}
              navigatorSensitivity={navigatorSensitivity}
              onSensitivityChange={setNavigatorSensitivity}
              projectionMode={projectionMode}
              onToggleProjection={handleToggleProjection}
              onClose={() => handleControllerChange('hidden')}
            />
          )
      )}

      {/* 3D Navigator Floating Restore Pill when View controls are Closed / Hidden */}
      {(gizmoMode === 'Hidden' || activeController === 'hidden' || !showStudioNavigator) &&
        !isAnyModalActive && !isColorStudioOpen && openSheet === null && !studioShelfOpen && (
          <button
            type="button"
            onClick={() => handleToggleNavigator(true)}
            className="fixed bottom-[max(20px,env(safe-area-inset-bottom))] right-[max(20px,env(safe-area-inset-right))] z-40 flex min-h-[44px] items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3.5 py-2 text-xs font-semibold text-neutral-800 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-white active:scale-95 dark:border-white/15 dark:bg-[#1a1d24]/90 dark:text-neutral-100 dark:hover:bg-[#222630]"
            aria-label="Reopen View controls"
            title="Reopen View controls"
          >
            <Compass className="h-4 w-4 text-sky-500" strokeWidth={2.2} />
            <span>View controls</span>
          </button>
      )}

      {/* 3D Guide On-Canvas HUD Control Bar */}
      <GuideControlBar
        activeGuide={activeGuide}
        engine={engine}
        targetScope={targetScope}
        onSelectTargetScope={handleSelectTargetScope}
        isGizmoActive={gizmoMode !== 'Hidden' && activeController !== 'hidden' && showStudioNavigator}
        onToggleGizmo={handleToggleGizmo}
        onOpenBentGuide={() => setIsBentGuideOpen(true)}
        onOpenScaffolding={() => setIsScaffoldingOpen(true)}
        setTool={setTool}
        onGuideDone={() => {
          setSnappedShapeNotice('Surface snap active: strokes will draw across this 3D guide!');
          setTimeout(() => setSnappedShapeNotice(null), 3000);
        }}
        theme={theme}
      />

      {/* Layer Panel */}
      {isLayersOpen && (
        <LayerPanel
          layers={layers}
          setLayers={setLayers}
          activeLayerId={activeLayerId}
          setActiveLayerId={setActiveLayerId}
          onClose={() => setIsLayersOpen(false)}
          onClearLayerStrokes={handleClearLayerStrokes}
          onMergeLayerDown={handleMergeLayerDown}
          theme={theme}
        />
      )}

      {/* 3D Model Display & Material Settings Panel */}
      {isModelDisplayOpen && (
        <div className="fixed top-16 right-4 z-40">
          <ModelDisplayPanel
            engine={engine}
            activeModelName={activeModelName}
            metadata={modelMetadata}
            displayMode={modelDisplayMode}
            onDisplayModeChange={(mode) => {
              setModelDisplayMode(mode);
              engine?.setModelDisplayMode(mode);
            }}
            onOpenLibrary={() => setIsModelsOpen(true)}
            onClose={() => setIsModelDisplayOpen(false)}
            theme={theme}
          />
        </div>
      )}

      {/* Brush Settings / Color Panel */}
      {isSettingsOpen && (
        <BrushSettingsPanel
          brushSettings={brushSettings}
          setBrushSettings={setBrushSettings}
          onClose={() => setIsSettingsOpen(false)}
          onRecalculateNormals={() => engine?.recalculateMeshNormals()}
          onOpenColorStudio={() => setIsColorStudioOpen(true)}
          theme={theme}
        />
      )}

      {/* All Deferred Modals & Overlays Host */}
      <AppModalHost
        engine={engine}
        theme={theme}
        postSettings={postSettings}
        setPostSettings={setPostSettings}
        isRenderSettingsOpen={isRenderSettingsOpen}
        setIsRenderSettingsOpen={setIsRenderSettingsOpen}
        gpuInfo={gpuInfo}
        pathTracingProgress={pathTracingProgress}
        isModelsOpen={isModelsOpen}
        setIsModelsOpen={setIsModelsOpen}
        activeModelName={activeModelName}
        handleBeforeReplace={handleBeforeReplace}
        isExportOpen={isExportOpen}
        setIsExportOpen={setIsExportOpen}
        isSessionModalOpen={isSessionModalOpen}
        setIsSessionModalOpen={setIsSessionModalOpen}
        handleSaveNamedSession={handleSaveNamedSession}
        handleLoadNamedSession={handleLoadNamedSession}
        handleSaveProjectToFolder={handleSaveProjectToFolder}
        handleSaveProject={handleSaveProject}
        handleLoadProject={handleLoadProject}
        isIlluminationOpen={isIlluminationOpen}
        setIsIlluminationOpen={setIsIlluminationOpen}
        isDecimateOpen={isDecimateOpen}
        setIsDecimateOpen={setIsDecimateOpen}
        isBentGuideOpen={isBentGuideOpen}
        setIsBentGuideOpen={setIsBentGuideOpen}
        isScaffoldingOpen={isScaffoldingOpen}
        setIsScaffoldingOpen={setIsScaffoldingOpen}
        isClipboardOpen={isClipboardOpen}
        setIsClipboardOpen={setIsClipboardOpen}
        referenceImages={referenceImages}
        setReferenceImages={setReferenceImages}
        isCustomMirrorOpen={isCustomMirrorOpen}
        setIsCustomMirrorOpen={setIsCustomMirrorOpen}
        customMirrorConfig={customMirrorConfig}
        setCustomMirrorConfig={setCustomMirrorConfig}
        setSymmetry={setSymmetry}
        isARViewerOpen={isARViewerOpen}
        setIsARViewerOpen={setIsARViewerOpen}
        isColorStudioOpen={isColorStudioOpen}
        setIsColorStudioOpen={setIsColorStudioOpen}
        onColorStudioInteractionModeChange={setColorStudioAllowsWorkspaceInteraction}
        brushSettings={brushSettings}
        setBrushSettings={setBrushSettings}
        setTool={setTool}
        activeDNA={activeDNA}
        setActiveDNA={setActiveDNA}
        snappedShapeNotice={snappedShapeNotice}
        windowDragOver={windowDragOver}
      />

      {/* Consolidated Shared Settings Sheet (Preferences) */}
      <StudioSettingsSheet
        theme={theme}
        onSetTheme={handleSetTheme}
        uiScale={uiScale}
        onUiScaleChange={handleUiScaleChange}
        projectionMode={projectionMode}
        onToggleProjection={handleToggleProjection}
        fingerDraw={fingerPenMode}
        onToggleFingerDraw={setFingerPenMode}
        disableContextMenu={disableContextMenu}
        onToggleDisableContextMenu={handleToggleDisableContextMenu}
        soundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
        showGrid={showGrid}
        onToggleGrid={handleToggleGrid}
        showPlane={showPlane}
        onTogglePlane={handleTogglePlane}
        canvasFormat={canvasFormat}
        onCanvasFormatChange={handleCanvasFormatChange}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onCanvasSizeChange={handleCanvasSizeChange}
        canvasTransparency={Math.round((1 - canvasOpacity) * 100)}
        onCanvasTransparencyChange={handleCanvasTransparencyChange}
        canvasColor={canvasColor}
        onCanvasColorChange={handleCanvasColorChange}
        onClearCanvas={handleClearCanvas}
        modelDisplayMode={modelDisplayMode}
        onSetModelDisplayMode={(mode) => {
          setModelDisplayMode(mode);
          engine?.setModelDisplayMode(mode);
        }}
        onOpenIllumination={() => setIsIlluminationOpen(true)}
        onOpenRenderSettings={() => setIsRenderSettingsOpen(true)}
        onOpenSessions={() => setIsSessionModalOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenARViewer={() => setIsARViewerOpen(true)}
        onOpenClipboard={() => setIsClipboardOpen(true)}
        isStoragePersistent={isStoragePersistent}
        onRequestStoragePermission={handleRequestStoragePermission}
        storageEstimate={storageEstimate}
        autoSaveMeta={autoSaveMeta}
        onRestoreAutoSave={handleRestoreAutoSave}
        navigatorStyle={navigatorStyle}
        onNavigatorStyleChange={handleNavigatorStyleChange}
        navigatorSensitivity={navigatorSensitivity}
        onSensitivityChange={setNavigatorSensitivity}
        showNavigator={showStudioNavigator && activeController !== 'hidden' && gizmoMode !== 'Hidden'}
        onToggleNavigator={handleToggleNavigator}
        showStats={showPerformanceStats}
        onToggleStats={setShowPerformanceStats}
      />

      {/* Plain-language stroke assistance: predictive cleanup, ruler, and smoothing. */}
      <ShapesSheet brushSettings={brushSettings} setBrushSettings={setBrushSettings} theme={theme} />

      {/* Auto-Save Status Notification Toast */}
      <AutoSaveToast
        status={autoSaveStatus}
        lastSaved={lastSavedTime}
        isPersistent={isStoragePersistent}
        theme={theme}
      />

      {/* Work-Loss Decision Modal (Save & Replace / Replace / Cancel) */}
      {pendingWorkLoss && (
        <WorkLossDecisionSheet
          isOpen={Boolean(pendingWorkLoss)}
          title={pendingWorkLoss.title}
          description={pendingWorkLoss.description}
          actionLabel={pendingWorkLoss.actionLabel}
          theme={theme}
          busy={workLossBusy}
          onSave={handleWorkLossSave}
          onReplace={handleWorkLossReplace}
          onCancel={handleWorkLossCancel}
        />
      )}

      </div>
    </DeviceSimulatorFrame>
  );
}

export default App;
