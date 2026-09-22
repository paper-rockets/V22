import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Gauge,
  Compass,
  Hand,
  HardDrive,
  ShieldCheck,
  Shield,
  RotateCcw,
  Sliders,
  Volume2,
  ChevronRight,
  ChevronDown,
  PanelLeft,
  EyeOff,
} from 'lucide-react';
import { StudioSheet } from './StudioSheet';
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
  onOpenRenderSettings?: () => void;
  // Share & Export
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
  // Stats
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
  onOpenRenderSettings,
  onOpenExport,
  onOpenARViewer,
  onOpenClipboard,
  isStoragePersistent = false,
  onRequestStoragePermission,
  storageEstimate,
  autoSaveMeta,
  onRestoreAutoSave,
  showStats = false,
  onToggleStats,
}) => {
  const isLight = theme === 'light';
  const [internalSound, setInternalSound] = useState<boolean>(() => haptics.getAudioFeedbackEnabled());
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  return (
    <StudioSheet id="settings" title="Preferences" theme={theme} tall>
      <div className="paperrocket-preferences space-y-0.5">
        {/* 1. INTERFACE */}
        <SectionHeader title="Interface" isLight={isLight} />

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
                aria-label="Decrease UI scale"
                onClick={() => {
                  haptics.trigger('light');
                  onUiScaleChange(Math.max(0.7, Math.round((uiScale - 0.1) * 10) / 10));
                }}
                className={`min-h-[44px] min-w-[44px] px-2 rounded-lg border text-sm font-bold flex items-center justify-center transition-colors ${
                  isLight ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-white'
                }`}
              >
                -
              </button>
              <button
                type="button"
                title="Reset to 100%"
                aria-label={`UI scale ${Math.round(uiScale * 100)}%, tap to reset to 100%`}
                onClick={() => {
                  haptics.trigger('light');
                  onUiScaleChange(1.0);
                }}
                className={`min-h-[44px] px-3 rounded-lg border text-xs font-mono font-bold flex items-center justify-center transition-colors ${
                  isLight ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                }`}
              >
                {Math.round(uiScale * 100)}%
              </button>
              <button
                type="button"
                aria-label="Increase UI scale"
                onClick={() => {
                  haptics.trigger('light');
                  onUiScaleChange(Math.min(1.5, Math.round((uiScale + 0.1) * 10) / 10));
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

        {/* 2. INPUT */}
        <SectionHeader title="Input" isLight={isLight} />

        <Row icon={Hand} label="Touch Input Drawing" hint="Enable touch drawing when stylus is unavailable" isLight={isLight}>
          <Toggle on={fingerDraw} onChange={onToggleFingerDraw} label="Touch Input Drawing" isLight={isLight} />
        </Row>

        {onToggleDisableContextMenu && (
          <Row icon={Compass} label="Radial Quick Menu" hint="Stylus side button or mouse right-click" isLight={isLight}>
            <Toggle on={!disableContextMenu} onChange={() => onToggleDisableContextMenu()} label="Radial Quick Menu" isLight={isLight} />
          </Row>
        )}

        {/* 3. TOOL DOCK */}
        <SectionHeader title="Tool Dock" isLight={isLight} />

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

        {/* 4. FEEDBACK */}
        <SectionHeader title="Feedback" isLight={isLight} />

        <Row icon={Volume2} label="Tactile Sound" hint="Auditory clicks and vibration feedback" isLight={isLight}>
          <Toggle on={effectiveSound} onChange={handleToggleSoundFeedback} label="Tactile Sound" isLight={isLight} />
        </Row>

        {/* 5. ADVANCED (Tiny collapsed section) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              haptics.trigger('light');
              setShowAdvanced((value) => !value);
            }}
            className={`paperrocket-settings-more w-full min-h-[46px] flex items-center gap-2.5 border-b text-left transition-colors cursor-pointer ${
              isLight ? 'border-neutral-200 hover:bg-black/[0.025]' : 'border-neutral-800 hover:bg-white/[0.025]'
            }`}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? <ChevronDown className="w-4 h-4 opacity-70" /> : <ChevronRight className="w-4 h-4 opacity-70" />}
            <span className="flex-1 text-sm font-bold">Advanced</span>
            <span className="text-xs text-neutral-400">{showAdvanced ? 'Hide advanced settings' : 'Storage & diagnostics'}</span>
          </button>

          {showAdvanced && (
            <div className="pt-1">
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
            </div>
          )}
        </div>
      </div>
    </StudioSheet>
  );
};
