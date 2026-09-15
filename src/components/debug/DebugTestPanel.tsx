import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  RefreshCw,
  Copy,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Activity,
  PenTool,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import {
  isNativeDebugAuthorized,
  getCachedAuthData,
  fetchNativeSystemDiagnostics,
  testSimulationState,
  sanitizeDiagnosticString,
} from '../../core/nativeDebugBridge';
import { StudioEngine } from '../../core/studioEngine';
import { checkStoragePersistence, getStorageEstimate } from '../../utils/storagePermission';

interface DebugTestPanelProps {
  open: boolean;
  onClose: () => void;
  engine?: StudioEngine | null;
  theme: 'light' | 'dark';
  onToggleTheme?: () => void;
  onLoadSampleProject?: () => void;
  onResetTestData?: () => void;
  lastAutoSaveTime?: Date | null;
  lastAutoSaveResult?: string | null;
  currentTool?: string;
}

export const DebugTestPanel: React.FC<DebugTestPanelProps> = ({
  open,
  onClose,
  engine,
  theme,
  onToggleTheme,
  onLoadSampleProject,
  onResetTestData,
  lastAutoSaveTime,
  lastAutoSaveResult,
  currentTool = 'draw',
}) => {
  if (!isNativeDebugAuthorized()) {
    return null;
  }

  const [diagnostics, setDiagnostics] = useState<Record<string, any>>({});
  const [pointerInfo, setPointerInfo] = useState<{ type: string; pressure: number }>({ type: 'none', pressure: 0 });
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [simOffline, setSimOffline] = useState(testSimulationState.simulateOffline);
  const [simAutosaveFail, setSimAutosaveFail] = useState(testSimulationState.simulateAutosaveFailure);
  const [simExportFail, setSimExportFail] = useState(testSimulationState.simulateExportFailure);
  const [simReducedMotion, setSimReducedMotion] = useState(testSimulationState.simulateReducedMotion);
  const [fpsOverlay, setFpsOverlay] = useState(testSimulationState.showFpsOverlay);
  const [pointerDiagnostics, setPointerDiagnostics] = useState(testSimulationState.showPointerDiagnostics);

  const pollIntervalRef = useRef<number | null>(null);

  const collectDiagnostics = useCallback(async () => {
    const auth = getCachedAuthData();
    const nativeDiag = await fetchNativeSystemDiagnostics();

    // Screen & Viewport
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const orientation = window.screen.orientation ? window.screen.orientation.type : 'unknown';

    // Safe area insets (computed from CSS env)
    const testDiv = document.createElement('div');
    testDiv.style.paddingTop = 'env(safe-area-inset-top, 0px)';
    testDiv.style.paddingRight = 'env(safe-area-inset-right, 0px)';
    testDiv.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    testDiv.style.paddingLeft = 'env(safe-area-inset-left, 0px)';
    testDiv.style.position = 'absolute';
    testDiv.style.visibility = 'hidden';
    document.body.appendChild(testDiv);
    const computed = window.getComputedStyle(testDiv);
    const safeInsets = {
      top: computed.paddingTop,
      right: computed.paddingRight,
      bottom: computed.paddingBottom,
      left: computed.paddingLeft,
    };
    document.body.removeChild(testDiv);

    // WebGL / GPU Renderer
    let glRenderer = 'Unknown';
    let webglSupported = false;
    let webgpuSupported = typeof navigator !== 'undefined' && 'gpu' in navigator;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        webglSupported = true;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          glRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (_e) {}

    // Storage
    const isPersistent = await checkStoragePersistence();
    const storageEst = await getStorageEstimate();

    // Scene stats
    let sceneObjects = 0;
    let strokeCount = 0;
    let triangles = 0;
    if (engine) {
      try {
        const scene = engine.getScene();
        sceneObjects = scene.children.length;
        const renderer = engine.getRenderer();
        if (renderer && renderer.info) {
          triangles = renderer.info.render.triangles;
        }
        const strokes = engine.getStrokeManager?.();
        if (strokes && typeof strokes.getStrokes === 'function') {
          strokeCount = strokes.getStrokes().length;
        }
      } catch (_e) {}
    }

    // WebView version
    const ua = navigator.userAgent;
    const chromeMatch = ua.match(/Chrome\/([0-9.]+)/);
    const webViewVersion = chromeMatch ? chromeMatch[1] : 'Standard WebKit';

    const diag: Record<string, any> = {
      appVersion: auth?.versionName || '1.0',
      buildVariant: auth?.buildVariant || 'debug',
      packageName: auth?.appId || 'com.paperrockets.v22.debug',
      androidVersion: auth?.androidVersion || nativeDiag?.androidVersion || 'Android 13',
      manufacturer: auth?.deviceManufacturer || nativeDiag?.manufacturer || 'Samsung',
      model: auth?.deviceModel || nativeDiag?.model || 'SM-P610',
      physicalResolution: nativeDiag?.screenWidth && nativeDiag?.screenHeight
        ? `${nativeDiag.screenWidth}x${nativeDiag.screenHeight}`
        : `${screenWidth * dpr}x${screenHeight * dpr}`,
      cssViewportSize: `${viewportWidth}x${viewportHeight}`,
      devicePixelRatio: dpr,
      orientation,
      safeAreaInsets: safeInsets,
      webViewVersion,
      rendererType: 'WebGL2',
      webglSupported,
      webgpuSupported,
      gpuRenderer: glRenderer,
      sceneObjectCount: sceneObjects,
      strokeCount,
      triangleCount: triangles,
      storageEstimate: storageEst ? `${storageEst.formattedUsage} / ${storageEst.formattedQuota} (${storageEst.percentUsed}%)` : 'Unknown',
      storagePersistence: isPersistent ? 'Granted (Persistent)' : 'Default (Non-persistent)',
      lastAutoSaveTime: lastAutoSaveTime ? lastAutoSaveTime.toLocaleTimeString() : 'None',
      lastAutoSaveResult: lastAutoSaveResult || 'Ready',
      onlineState: testSimulationState.simulateOffline ? 'Simulated Offline' : navigator.onLine ? 'Online' : 'Offline',
      currentTheme: theme,
      currentDrawingMode: currentTool,
    };

    setDiagnostics(diag);
  }, [engine, theme, lastAutoSaveTime, lastAutoSaveResult, currentTool]);

  useEffect(() => {
    if (!open) {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    collectDiagnostics();
    pollIntervalRef.current = window.setInterval(collectDiagnostics, 2500);

    const handlePointer = (e: PointerEvent) => {
      setPointerInfo({
        type: e.pointerType || 'touch',
        pressure: Math.round(e.pressure * 100) / 100,
      });
    };

    window.addEventListener('pointerdown', handlePointer);
    window.addEventListener('pointermove', handlePointer);

    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      window.removeEventListener('pointerdown', handlePointer);
      window.removeEventListener('pointermove', handlePointer);
    };
  }, [open, collectDiagnostics]);

  const handleCopyReport = async () => {
    const report = {
      title: 'V22 Android Debug Diagnostic Report',
      timestamp: new Date().toISOString(),
      diagnostics,
      pointerEvent: pointerInfo,
      simulationToggles: {
        simOffline,
        simAutosaveFail,
        simExportFail,
        simReducedMotion,
      },
    };
    const sanitizedJson = sanitizeDiagnosticString(JSON.stringify(report, null, 2));
    try {
      await navigator.clipboard.writeText(sanitizedJson);
      setCopyFeedback('Report copied to clipboard!');
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch (_e) {
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  const toggleSimOffline = () => {
    const next = !simOffline;
    setSimOffline(next);
    testSimulationState.simulateOffline = next;
  };

  const toggleSimAutosaveFail = () => {
    const next = !simAutosaveFail;
    setSimAutosaveFail(next);
    testSimulationState.simulateAutosaveFailure = next;
  };

  const toggleSimExportFail = () => {
    const next = !simExportFail;
    setSimExportFail(next);
    testSimulationState.simulateExportFailure = next;
  };

  const toggleSimReducedMotion = () => {
    const next = !simReducedMotion;
    setSimReducedMotion(next);
    testSimulationState.simulateReducedMotion = next;
    document.documentElement.classList.toggle('reduce-motion', next);
  };

  const toggleFpsOverlay = () => {
    const next = !fpsOverlay;
    setFpsOverlay(next);
    testSimulationState.showFpsOverlay = next;
  };

  const togglePointerDiagnostics = () => {
    const next = !pointerDiagnostics;
    setPointerDiagnostics(next);
    testSimulationState.showPointerDiagnostics = next;
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Developer Debug Panel"
      aria-modal="true"
      data-testid="debug-test-panel"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="bg-neutral-900 border border-neutral-700 text-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold tracking-tight">Developer & Test Mode [DEBUG ONLY]</h2>
          </div>
          <button
            type="button"
            data-testid="debug-panel-close"
            onClick={onClose}
            aria-label="Close Debug Panel"
            className="min-w-[44px] min-h-[44px] w-11 h-11 grid place-items-center rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Safe Test Controls */}
          <section className="space-y-3">
            <h3 className="font-semibold text-neutral-400 uppercase tracking-wider text-xs">Safe Test Controls</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                data-testid="test-toggle-theme"
                onClick={onToggleTheme}
                className="min-h-[44px] px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg flex items-center gap-2 border border-neutral-700 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
                <span>Theme: {theme}</span>
              </button>

              <button
                type="button"
                data-testid="test-toggle-offline"
                onClick={toggleSimOffline}
                className={`min-h-[44px] px-3 py-2 rounded-lg flex items-center gap-2 border transition-colors ${
                  simOffline ? 'bg-amber-950/80 border-amber-600 text-amber-200' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                {simOffline ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
                <span>Simulate Offline</span>
              </button>

              <button
                type="button"
                data-testid="test-toggle-reduced-motion"
                onClick={toggleSimReducedMotion}
                className={`min-h-[44px] px-3 py-2 rounded-lg flex items-center gap-2 border transition-colors ${
                  simReducedMotion ? 'bg-sky-950/80 border-sky-600 text-sky-200' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Reduced Motion</span>
              </button>

              <button
                type="button"
                data-testid="test-toggle-autosave-fail"
                onClick={toggleSimAutosaveFail}
                className={`min-h-[44px] px-3 py-2 rounded-lg flex items-center gap-2 border transition-colors ${
                  simAutosaveFail ? 'bg-rose-950/80 border-rose-600 text-rose-200' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Fail Autosave</span>
              </button>

              <button
                type="button"
                data-testid="test-toggle-export-fail"
                onClick={toggleSimExportFail}
                className={`min-h-[44px] px-3 py-2 rounded-lg flex items-center gap-2 border transition-colors ${
                  simExportFail ? 'bg-rose-950/80 border-rose-600 text-rose-200' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Fail Export</span>
              </button>

              <button
                type="button"
                data-testid="test-load-sample"
                onClick={onLoadSampleProject}
                className="min-h-[44px] px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg flex items-center gap-2 border border-neutral-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-sky-400" />
                <span>Load Sample</span>
              </button>

              <button
                type="button"
                data-testid="test-reset-data"
                onClick={onResetTestData}
                className="min-h-[44px] px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-200 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Reset Test Data</span>
              </button>

              <button
                type="button"
                data-testid="test-toggle-fps"
                onClick={toggleFpsOverlay}
                className={`min-h-[44px] px-3 py-2 rounded-lg flex items-center gap-2 border transition-colors ${
                  fpsOverlay ? 'bg-sky-950/80 border-sky-600 text-sky-200' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <Activity className="w-4 h-4 text-sky-400" />
                <span>FPS Overlay</span>
              </button>

              <button
                type="button"
                data-testid="test-toggle-pointer"
                onClick={togglePointerDiagnostics}
                className={`min-h-[44px] px-3 py-2 rounded-lg flex items-center gap-2 border transition-colors ${
                  pointerDiagnostics ? 'bg-sky-950/80 border-sky-600 text-sky-200' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <PenTool className="w-4 h-4 text-emerald-400" />
                <span>Pointer Diagnostics</span>
              </button>
            </div>
          </section>

          {/* Pointer / Stylus Live Monitor */}
          <section className="p-3 bg-neutral-800/60 rounded-xl border border-neutral-700/60 space-y-1">
            <h3 className="font-semibold text-neutral-400 uppercase tracking-wider text-xs">Stylus & Pointer Telemetry</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-neutral-400">Pointer Type:</span> <strong className="text-sky-300">{pointerInfo.type}</strong></div>
              <div><span className="text-neutral-400">Stylus Pressure:</span> <strong className="text-sky-300">{pointerInfo.pressure}</strong></div>
            </div>
          </section>

          {/* Read-Only System Diagnostics Table */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-400 uppercase tracking-wider text-xs">Read-Only Diagnostics</h3>
              <button
                type="button"
                data-testid="test-copy-report"
                onClick={handleCopyReport}
                className="min-h-[44px] px-3 py-1 bg-sky-950/80 hover:bg-sky-900 border border-sky-600 text-sky-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copyFeedback ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copyFeedback || 'Copy Sanitized Report'}</span>
              </button>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 divide-y divide-neutral-800 font-mono text-xs">
              {Object.entries(diagnostics).map(([key, value]) => (
                <div key={key} className="py-1.5 flex justify-between gap-4">
                  <span className="text-neutral-400">{key}</span>
                  <span className="text-neutral-200 font-semibold text-right break-all">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
