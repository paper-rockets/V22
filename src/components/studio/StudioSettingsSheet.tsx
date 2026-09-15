import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Gauge,
  Compass,
  Hand,
  Box,
  HardDrive,
  ShieldCheck,
  Shield,
  RotateCcw,
  Sliders,
  Volume2,
  Grid,
  Layers,
  Download,
  Glasses,
  Image,
  Smartphone,
  Check,
  ChevronRight,
  ChevronDown,
  FolderArchive,
  PanelLeft,
  EyeOff,
  SunMedium,
  Trash2,
  Droplets,
  Palette,
  MoveDiagonal2,
} from 'lucide-react';
import { StudioSheet } from './StudioSheet';
import { closeSheet } from './panelStore';
import { haptics } from '../../utils/haptics';
import { StorageEstimateInfo, AutoSaveMetaInfo } from '../../utils/storagePermission';
import {
  readStudioDockPreferences,
  StudioDockPosition,
  writeStudioDockPreferences,
} from './studioDockPreferences';

export interface StudioSettingsSheetProps {
  theme: 'light' | 'dark';
  onSetTheme: (t: 'light' | 'dark') => void;
  // UI Scale
  uiScale?: number;
  onUiScaleChange?: (scale: number) => void;
  // Sensitivity
  navigatorSensitivity?: number;
  onSensitivityChange?: (sens: number) => void;
  // Camera Projection
  projectionMode?: 'perspective' | 'orthographic';
  onToggleProjection?: () => void;
  // Touch drawing
  fingerDraw: boolean;
  onToggleFingerDraw: (on: boolean) => void;
  // Radial menu
  disableContextMenu?: boolean;
  onToggleDisableContextMenu?: () => void;
  // Sound
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  // Scene
  showGrid?: boolean;
  onToggleGrid?: () => void;
  showPlane?: boolean;
  onTogglePlane?: () => void;
  canvasFormat?: 'portrait' | 'square' | 'landscape' | 'custom';
  onCanvasFormatChange?: (format: 'portrait' | 'square' | 'landscape') => void;
  canvasWidth?: number;
  canvasHeight?: number;
  onCanvasSizeChange?: (width: number, height: number) => void;
  canvasTransparency?: number;
  onCanvasTransparencyChange?: (transparency: number) => void;
  canvasColor?: string;
  onCanvasColorChange?: (color: string) => void;
  onClearCanvas?: () => void;
  modelDisplayMode: 'texture' | 'clay';
  onSetModelDisplayMode: (mode: 'texture' | 'clay') => void;
  onOpenIllumination?: () => void;
  onOpenRenderSettings?: () => void;
  // Share & Export
  onOpenSessions?: () => void;
  onOpenExport?: () => void;
  onOpenARViewer?: () => void;
  // Reference Images
  onOpenClipboard?: () => void;
  // Storage & Autosave
  isStoragePersistent?: boolean;
  onRequestStoragePermission?: () => Promise<boolean>;
  storageEstimate?: StorageEstimateInfo | null;
  autoSaveMeta?: AutoSaveMetaInfo;
  onRestoreAutoSave?: () => void;
  // Navigator Style & Toggle
  navigatorStyle?: 'sphere' | 'disc' | 'petal' | 'collar';
  onNavigatorStyleChange?: (style: 'sphere' | 'disc' | 'petal' | 'collar') => void;
  // Navigator & Stats
  showNavigator?: boolean;
  onToggleNavigator?: (show: boolean) => void;
  showStats?: boolean;
  onToggleStats?: (show: boolean) => void;
}



const Row: React.FC<{
  icon: React.FC<{ className?: string }>;
  label: string;
  hint?: string;
  children: React.ReactNode;
  isLight: boolean;
}> = ({ icon: Icon, label, hint, children, isLight }) => (
  <div
    className={`paperrocket-settings-row flex items-center gap-3.5 py-3 border-b last:border-b-0 min-h-[52px] ${
      isLight ? 'border-neutral-200' : 'border-neutral-800'
    }`}
  >
    <Icon className="w-5 h-5 shrink-0 opacity-80" />
    <div className="flex-1 min-w-0">
      <div className="text-sm font-bold leading-tight">{label}</div>
      {hint && <div className="text-xs text-neutral-400 leading-tight mt-0.5">{hint}</div>}
    </div>
    <div className="paperrocket-settings-control shrink-0">{children}</div>
  </div>
);

const SectionHeader: React.FC<{ title: string; isLight: boolean }> = ({ title, isLight }) => (
  <div className={`paperrocket-settings-section pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
    {title}
  </div>
);

/** Minimalist switch. */
const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string; isLight?: boolean }> = ({
  on,
  onChange,
  label,
}) => (
  <button
    type="button"
    role="switch"
    data-state={on ? 'on' : 'off'}
    aria-checked={on}
    aria-label={label}
    onClick={() => {
      haptics.trigger('light');
      onChange(!on);
    }}
    className="paperrocket-toggle cursor-pointer relative bg-transparent border-0 outline-none p-0"
  >
    <span className="absolute rounded-full shadow transition-all duration-150 bg-white" />
  </button>
);

export const StudioSettingsSheet: React.FC<StudioSettingsSheetProps> = ({
  theme,
  onSetTheme,
  uiScale = 1.0,
  onUiScaleChange,
  navigatorSensitivity = 1.0,
  onSensitivityChange,
  projectionMode = 'perspective',
  onToggleProjection,
  fingerDraw,
  onToggleFingerDraw,
  disableContextMenu = false,
  onToggleDisableContextMenu,
  soundEnabled,
  onToggleSound,
  showGrid = true,
  onToggleGrid,
  showPlane = false,
  onTogglePlane,
  canvasFormat = 'portrait',
  onCanvasFormatChange,
  canvasWidth = 2.7,
  canvasHeight = 3.6,
  onCanvasSizeChange,
  canvasTransparency = 0,
  onCanvasTransparencyChange,
  canvasColor = '#ffffff',
  onCanvasColorChange,
  onClearCanvas,
  modelDisplayMode,
  onSetModelDisplayMode,
  onOpenIllumination,
  onOpenRenderSettings,
  onOpenSessions,
  onOpenExport,
  onOpenARViewer,
  onOpenClipboard,
  isStoragePersistent = false,
  onRequestStoragePermission,
  storageEstimate,
  autoSaveMeta,
  onRestoreAutoSave,
  navigatorStyle = 'sphere',
  onNavigatorStyleChange,
  showNavigator = true,
  onToggleNavigator,
  showStats = false,
  onToggleStats,
}) => {
  const isLight = theme === 'light';
  const [internalSound, setInternalSound] = useState<boolean>(() => haptics.getAudioFeedbackEnabled());
  const [showMore, setShowMore] = useState(false);
  const [dockPreferences, setDockPreferences] = useState(readStudioDockPreferences);

  const effectiveSound = soundEnabled !== undefined ? soundEnabled : internalSound;

  const handleToggleSoundFeedback = () => {
    if (onToggleSound) {
      onToggleSound();
    } else {
      const next = haptics.toggleAudioFeedback();
      setInternalSound(next);
    }
  };

  const updateDockPreferences = (next: Partial<typeof dockPreferences>) => {
    const updated = { ...dockPreferences, ...next };
    setDockPreferences(updated);
    writeStudioDockPreferences(updated);
  };

  const pill = (active: boolean) =>
    `flex-1 min-h-[44px] h-11 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
      active
        ? isLight ? 'bg-neutral-900 text-white shadow-sm' : 'bg-white text-zinc-950 shadow-sm'
        : isLight
          ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
    }`;

  const actionBtn = `min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all active:scale-98 cursor-pointer ${
    isLight
      ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
      : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
  }`;

  return (
    <StudioSheet id="settings" title="Preferences" theme={theme} tall>
      <div className="paperrocket-preferences">
      {/* 1. STUDIO */}
      <SectionHeader title="Studio" isLight={isLight} />

      <Row icon={isLight ? Sun : Moon} label="Studio Theme" hint="Light or dark look for the app" isLight={isLight}>
        <div className="flex gap-1 w-40">
          <button
            type="button"
            onClick={() => {
              haptics.trigger('light');
              onSetTheme('light');
            }}
            className={pill(isLight)}
          >
            <Sun className="w-4 h-4" /> Light
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.trigger('light');
              onSetTheme('dark');
            }}
            className={pill(!isLight)}
          >
            <Moon className="w-4 h-4" /> Dark
          </button>
        </div>
      </Row>

      {onUiScaleChange && (
        <Row icon={Sliders} label="UI Scale" hint={`Interface size (${Math.round(uiScale * 100)}%)`} isLight={isLight}>
          <div className="paperrocket-stepper flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                haptics.trigger('light');
                onUiScaleChange(Math.max(0.7, uiScale - 0.1));
              }}
              className={`min-h-[44px] min-w-[44px] px-2 rounded-lg border text-sm font-bold flex items-center justify-center transition-colors ${
                isLight ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-white'
              }`}
            >
              -
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.trigger('light');
                onUiScaleChange(1.0);
              }}
              className={`min-h-[44px] px-3 rounded-lg border text-xs font-mono font-bold flex items-center justify-center transition-colors ${
                isLight ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
              }`}
            >
              100%
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.trigger('light');
                onUiScaleChange(Math.min(1.5, uiScale + 0.1));
              }}
              className={`min-h-[44px] min-w-[44px] px-2 rounded-lg border text-sm font-bold flex items-center justify-center transition-colors ${
                isLight ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-white'
              }`}
            >
              +
            </button>
          </div>
        </Row>
      )}



      <Row icon={Hand} label="Touch Input Drawing" hint="Enable touch drawing when stylus is unavailable" isLight={isLight}>
        <Toggle on={fingerDraw} onChange={onToggleFingerDraw} label="Touch Input Drawing" isLight={isLight} />
      </Row>

      <Row icon={PanelLeft} label="Tool Dock" hint="Responsive placement, or pin it to an edge" isLight={isLight}>
        <div className="grid w-40 grid-cols-3 gap-1">
          {(['auto', 'left', 'right'] as StudioDockPosition[]).map((position) => (
            <button
              key={position}
              type="button"
              onClick={() => {
                haptics.trigger('light');
                updateDockPreferences({ position });
              }}
              className={`min-h-[40px] rounded-lg px-1 text-[10px] font-bold capitalize transition-colors ${
                dockPreferences.position === position
                  ? isLight ? 'bg-neutral-900 text-white' : 'bg-white text-zinc-950'
                  : isLight ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-800 text-neutral-300'
              }`}
              aria-pressed={dockPreferences.position === position}
            >
              {position}
            </button>
          ))}
        </div>
      </Row>

      <Row icon={EyeOff} label="Auto-hide Tool Dock" hint="Reveal it from the small edge handle" isLight={isLight}>
        <Toggle
          on={dockPreferences.autoHide}
          onChange={(autoHide) => updateDockPreferences({ autoHide })}
          label="Auto-hide Tool Dock"
          isLight={isLight}
        />
      </Row>

      {onToggleDisableContextMenu && (
        <Row icon={Compass} label="Radial Quick Menu" hint="Stylus side button or mouse right-click" isLight={isLight}>
          <Toggle on={!disableContextMenu} onChange={() => onToggleDisableContextMenu()} label="Radial Quick Menu" isLight={isLight} />
        </Row>
      )}

            <Row icon={Volume2} label="Tactile Sound" hint="Auditory clicks and vibration feedback" isLight={isLight}>
        <Toggle on={effectiveSound} onChange={handleToggleSoundFeedback} label="Tactile Sound" isLight={isLight} />
      </Row>

      {/* 2. SCENE */}
      <SectionHeader title="Scene" isLight={isLight} />

      {onCanvasFormatChange && (
        <Row icon={Box} label="Canvas size" hint="Resize the drawing surface without clearing artwork" isLight={isLight}>
          <div className="grid w-36 grid-cols-3 gap-1" role="group" aria-label="Canvas size presets">
            {([
              ['portrait', 'Portrait'],
              ['square', 'Square'],
              ['landscape', 'Wide'],
            ] as const).map(([format, label]) => (
              <button
                key={format}
                type="button"
                onClick={() => {
                  haptics.trigger('light');
                  onCanvasFormatChange(format);
                }}
                className={`min-h-[40px] rounded-lg px-1 text-[10px] font-bold transition-colors ${
                  canvasFormat === format
                    ? isLight ? 'bg-neutral-900 text-white' : 'bg-white text-zinc-950'
                    : isLight ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
                aria-pressed={canvasFormat === format}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>
      )}

      {onCanvasSizeChange && (
        <div className={`border-b py-3 ${isLight ? 'border-neutral-200' : 'border-neutral-800'}`}>
          <div className="mb-2 flex items-center gap-2">
            <MoveDiagonal2 className="h-4 w-4 opacity-75" />
            <div className="text-xs font-bold">Manual size</div>
            <div className="ml-auto text-[10px] font-semibold tabular-nums opacity-60">
              {canvasWidth.toFixed(1)} × {canvasHeight.toFixed(1)}
            </div>
          </div>
          <div className="grid grid-cols-[18px_1fr] items-center gap-x-2 gap-y-1.5">
            <label htmlFor="canvas-width" className="text-[10px] font-bold opacity-60">W</label>
            <input
              id="canvas-width"
              type="range"
              min="1"
              max="8"
              step="0.1"
              value={canvasWidth}
              onChange={(event) => onCanvasSizeChange(Number(event.target.value), canvasHeight)}
              onPointerUp={() => haptics.trigger('light')}
              className="h-8 w-full cursor-ew-resize accent-sky-500"
              aria-label="Canvas width"
            />
            <label htmlFor="canvas-height" className="text-[10px] font-bold opacity-60">H</label>
            <input
              id="canvas-height"
              type="range"
              min="1"
              max="8"
              step="0.1"
              value={canvasHeight}
              onChange={(event) => onCanvasSizeChange(canvasWidth, Number(event.target.value))}
              onPointerUp={() => haptics.trigger('light')}
              className="h-8 w-full cursor-ns-resize accent-sky-500"
              aria-label="Canvas height"
            />
          </div>
        </div>
      )}

      {onCanvasColorChange && (
        <Row icon={Palette} label="Canvas color" hint="Preview the drawing surface color as you choose" isLight={isLight}>
          <label className={`flex min-h-[44px] items-center gap-2 rounded-lg border px-2.5 cursor-pointer ${
            isLight ? 'border-neutral-300 bg-neutral-100' : 'border-neutral-700 bg-neutral-800'
          }`}>
            <input
              type="color"
              value={canvasColor}
              onInput={(event) => onCanvasColorChange((event.target as HTMLInputElement).value)}
              onChange={(event) => onCanvasColorChange(event.target.value)}
              className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
              aria-label="Canvas background color"
            />
            <span className="text-[10px] font-bold tabular-nums">{canvasColor.toUpperCase()}</span>
          </label>
        </Row>
      )}

      {onCanvasTransparencyChange && (
        <Row icon={Droplets} label="Canvas transparency" hint="Let the 3D scene show through the drawing surface" isLight={isLight}>
          <div className="w-40">
            <div className="mb-1 flex justify-between text-[10px] font-semibold tabular-nums opacity-65">
              <span>Opaque</span>
              <span>{Math.round(canvasTransparency)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={canvasTransparency}
              onChange={(event) => onCanvasTransparencyChange(Number(event.target.value))}
              onPointerUp={() => haptics.trigger('light')}
              className="h-8 w-full cursor-pointer accent-sky-500"
              aria-label="Canvas transparency"
            />
          </div>
        </Row>
      )}

      {onClearCanvas && (
        <Row icon={Trash2} label="Clear canvas" hint="Remove every line, while keeping the canvas and layers" isLight={isLight}>
          <button
            type="button"
            onClick={() => {
              closeSheet();
              onClearCanvas();
            }}
            className="min-h-[44px] rounded-lg border border-red-500/35 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-300"
          >
            Clear canvas
          </button>
        </Row>
      )}

      {onToggleGrid && (
        <Row icon={Grid} label="Ground Grid" hint="Display reference 3D ground plane grid" isLight={isLight}>
          <Toggle on={showGrid} onChange={() => onToggleGrid()} label="Ground Grid" isLight={isLight} />
        </Row>
      )}

      {/* Accordion toggle: More settings / Fewer settings */}
      <button
        type="button"
        onClick={() => {
          haptics.trigger('light');
          setShowMore((value) => !value);
        }}
        className={`paperrocket-settings-more w-full min-h-[46px] flex items-center gap-2.5 border-b text-left transition-colors ${
          isLight ? 'border-neutral-200 hover:bg-black/[0.025]' : 'border-neutral-800 hover:bg-white/[0.025]'
        }`}
        aria-expanded={showMore}
      >
        {showMore ? <ChevronDown className="w-5 h-5 opacity-70" /> : <ChevronRight className="w-5 h-5 opacity-70" />}
        <span className="flex-1 text-sm font-bold">{showMore ? 'Fewer settings' : 'More settings'}</span>
        <span className="text-xs text-neutral-400">{showMore ? 'Hide details' : 'Scene, export, storage & Pro'}</span>
      </button>

      {/* Advanced Settings Block (Contiguous, revealed directly beneath the toggle) */}
      {showMore && (
        <>
          {onTogglePlane && (
            <Row icon={Layers} label="Drawing Plane" hint="The flat surface you draw lines on" isLight={isLight}>
              <Toggle on={showPlane} onChange={() => onTogglePlane()} label="Drawing Plane" isLight={isLight} />
            </Row>
          )}

          {onOpenIllumination && (
            <Row icon={SunMedium} label="Lighting Setup" hint="Light direction, soft shadows, and lighting presets" isLight={isLight}>
              <button type="button" onClick={onOpenIllumination} className={actionBtn}>
                <SunMedium className="w-4 h-4 text-amber-400" />
                <span>Lighting Setup</span>
              </button>
            </Row>
          )}

          {onOpenRenderSettings && (
            <Row icon={Sliders} label="Picture Quality" hint="How good your drawing looks, plus glow" isLight={isLight}>
              <button type="button" onClick={onOpenRenderSettings} className={actionBtn}>
                <Sliders className="w-4 h-4" />
                <span>Picture Quality</span>
              </button>
            </Row>
          )}

          <Row icon={Box} label="Model Appearance" hint="Show a model's original colors or plain white clay" isLight={isLight}>
            <div className="flex gap-1 shrink-0">
              <button type="button" onClick={() => onSetModelDisplayMode('texture')} className={`${pill(modelDisplayMode === 'texture')} whitespace-nowrap`}>Original Colors</button>
              <button type="button" onClick={() => onSetModelDisplayMode('clay')} className={`${pill(modelDisplayMode === 'clay')} whitespace-nowrap`}>White Clay</button>
            </div>
          </Row>

          {/* 3. SHARE & EXPORT */}
          <SectionHeader title="Share & Export" isLight={isLight} />

          {onOpenSessions && (
            <Row icon={FolderArchive} label="Projects" hint="Open, save, or restore" isLight={isLight}>
              <button type="button" onClick={onOpenSessions} className={actionBtn}>
                <FolderArchive className="w-4 h-4" />
                <span>Manage Projects</span>
              </button>
            </Row>
          )}

          {onOpenExport && (
            <Row icon={Download} label="Export 3D Artwork" hint="Save model as GLB, OBJ, STL, or image capture" isLight={isLight}>
              <button type="button" onClick={onOpenExport} className={actionBtn}>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </Row>
          )}

          {onOpenARViewer && (
            <Row icon={Glasses} label="View in AR" hint="Experience model in real space with augmented reality" isLight={isLight}>
              <button type="button" onClick={onOpenARViewer} className={actionBtn}>
                <Glasses className="w-4 h-4" />
                <span>View in AR</span>
              </button>
            </Row>
          )}

          {/* 4. REFERENCE IMAGES */}
          {onOpenClipboard && (
            <>
              <SectionHeader title="Reference Images" isLight={isLight} />
              <Row icon={Image} label="Reference Images" hint="Pin 2D concept art and blueprint photos on screen" isLight={isLight}>
                <button type="button" onClick={onOpenClipboard} className={actionBtn}>
                  <Image className="w-4 h-4" />
                  <span>Reference Images</span>
                </button>
              </Row>
            </>
          )}

          {/* 5. STORAGE & DIAGNOSTICS */}
          <SectionHeader title="Storage & Diagnostics" isLight={isLight} />

          <Row
            icon={HardDrive}
            label="Storage & Autosave"
            hint={
              isStoragePersistent
                ? `Protected against eviction • ${storageEstimate?.formattedUsage || '0 MB'} used`
                : `Standard browser storage • ${storageEstimate?.formattedUsage || '0 MB'} used`
            }
            isLight={isLight}
          >
            <div className="flex items-center gap-2">
              {isStoragePersistent ? (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    isLight
                      ? 'bg-neutral-100 border-neutral-300 text-neutral-800'
                      : 'bg-white/10 border-white/20 text-white'
                  }`}
                  title="Browser storage permission granted: protected against automatic cache eviction"
                >
                  <ShieldCheck className="w-4 h-4 text-current" />
                  <span>Protected</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    if (onRequestStoragePermission) {
                      await onRequestStoragePermission();
                      haptics.trigger('success');
                    }
                  }}
                  className={`min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                    isLight
                      ? 'bg-neutral-900 border-neutral-900 text-white hover:bg-neutral-800'
                      : 'bg-white border-white text-zinc-950 hover:bg-neutral-200'
                  }`}
                  title="Request browser storage permission so projects are protected from browser cache clearance"
                >
                  <Shield className="w-4 h-4 text-current" />
                  <span>Protect Storage</span>
                </button>
              )}

              {autoSaveMeta?.exists && onRestoreAutoSave && (
                <button
                  type="button"
                  onClick={() => {
                    onRestoreAutoSave();
                    haptics.trigger('success');
                  }}
                  className={`min-h-[44px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                    isLight
                      ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                      : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                  }`}
                  title={`Restore project from ${autoSaveMeta.formattedDate || 'autosave'}`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-current" />
                  <span>Restore</span>
                </button>
              )}
            </div>
          </Row>

          {onToggleStats && (
            <Row icon={Gauge} label="Performance Diagnostics" hint="Display real-time frame rate & engine latency" isLight={isLight}>
              <Toggle on={showStats} onChange={onToggleStats} label="Performance Diagnostics" isLight={isLight} />
            </Row>
          )}
        </>
      )}

      </div>
    </StudioSheet>
  );
};
