import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProMode, useOpenSheet, closeSheet, openSheetId } from '../studio/panelStore';
import { haptics } from '../../utils/haptics';
import { ToolType, BrushSettings } from '../../types';
import { RealBrushSizeControl } from '../common/RealBrushSizeControl';
import {
  CURATED_BRUSHES,
  getActiveCuratedBrush,
  applyCuratedBrush,
} from '../../presets/curatedBrushes';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Palette,
  GripHorizontal,
  Ruler,
} from 'lucide-react';
import {
  IcPointer,
  IcCreate,
  IcDeform,
  IcLayers,
  IcDraw,
  IcErase,
  IcMirror,
  IcBrushRibbon,
} from './StudioIcons';
import { useDismissibleSurface } from '../../hooks/useDismissibleSurface';
import { MenuShelf } from '../ui/MenuPrimitives';
import { BrushShapeGlyph } from '../studio/BrushShapeGlyph';
import {
  readStudioDockPreferences,
  STUDIO_DOCK_EVENT,
  StudioDockPreferences,
} from '../studio/studioDockPreferences';
import { StudioEngine } from '../../core/studioEngine';
import './ProResponsive.css';

export interface ProRailProps {
  theme?: 'light' | 'dark';
  tool?: ToolType;
  setTool?: (tool: ToolType) => void;
  brushSettings?: BrushSettings;
  setBrushSettings?: React.Dispatch<React.SetStateAction<BrushSettings>>;
  onOpenColorStudio?: () => void;
  onOpenIllumination?: () => void;
  isIlluminationOpen?: boolean;
  engine?: StudioEngine | null;
  onOpenCustomMirror?: () => void;
}

interface ModeButton {
  id: ProMode;
  label: string;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
}

const MODES: ModeButton[] = [
  { id: 'select', label: 'Select', icon: IcPointer },
  { id: 'create', label: 'Create', icon: IcCreate },
  { id: 'deform', label: 'Deform', icon: IcDeform },
  { id: 'layers', label: 'Layers', icon: IcLayers },
];

const STAPLE_COLORS = ['#2563eb', '#ef4444', '#f59e0b', '#10b981'];
const DEFAULT_RECENT_COLORS = ['#000000', '#ffffff'];
const QUICK_BRUSH_IDS = ['streamline_ink', 'conformal_bead', 'spatial_pipe', 'chisel_marker'];
const QUICK_BRUSH_HELP: Record<string, string> = {
  streamline_ink: 'Flat paint',
  conformal_bead: 'Hugs models',
  spatial_pipe: 'Round line',
  chisel_marker: 'Wide edge',
};

export const ProRail: React.FC<ProRailProps> = ({
  theme = 'dark',
  tool,
  setTool,
  brushSettings,
  setBrushSettings,
  onOpenColorStudio,
  onOpenIllumination,
  isIlluminationOpen = false,
  engine,
  onOpenCustomMirror,
}) => {
  const openSheet = useOpenSheet();
  const light = theme === 'light';
  const isLight = light;
  const rootRef = useRef<HTMLElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);
  const colorBtnRef = useRef<HTMLButtonElement>(null);
  const sizeBtnRef = useRef<HTMLButtonElement>(null);
  const brushBtnRef = useRef<HTMLButtonElement>(null);
  const straightBtnRef = useRef<HTMLButtonElement>(null);

  const [panel, setPanel] = useState<'color' | 'size' | 'brush' | 'straight' | null>(null);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  const [dockPreferences, setDockPreferences] = useState<StudioDockPreferences>(readStudioDockPreferences);
  const [dockHidden, setDockHidden] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('remix3d.recentColors') || '[]');
      return Array.isArray(stored) && stored.length > 0
        ? stored.filter((color): color is string => typeof color === 'string').slice(0, 2)
        : DEFAULT_RECENT_COLORS;
    } catch {
      return DEFAULT_RECENT_COLORS;
    }
  });

  const activeColor = brushSettings?.color || brushSettings?.solidColor || '#000000';
  const quickColors = useMemo(
    () => Array.from(new Set([...STAPLE_COLORS, ...recentColors])).slice(0, 6),
    [recentColors]
  );

  useEffect(() => {
    if (brushSettings?.previewUrl || brushSettings?.matcapUrl) return;
    const normalized = activeColor.toLowerCase();
    if (STAPLE_COLORS.some((color) => color.toLowerCase() === normalized)) return;
    setRecentColors((previous) => {
      const next = [activeColor, ...previous.filter((color) => color.toLowerCase() !== normalized)].slice(0, 2);
      try {
        localStorage.setItem('remix3d.recentColors', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [activeColor, brushSettings?.previewUrl, brushSettings?.matcapUrl]);

  useEffect(() => {
    const onDockChange = (event: Event) => {
      const next = (event as CustomEvent<StudioDockPreferences>).detail;
      if (next) setDockPreferences(next);
    };
    window.addEventListener(STUDIO_DOCK_EVENT, onDockChange);
    return () => window.removeEventListener(STUDIO_DOCK_EVENT, onDockChange);
  }, []);

  useEffect(() => {
    if (!dockPreferences.autoHide || openSheet || panel) {
      setDockHidden(false);
      return;
    }
    const timer = window.setTimeout(() => setDockHidden(true), 2400);
    return () => window.clearTimeout(timer);
  }, [dockPreferences.autoHide, openSheet, panel]);

  const activeTriggerRef =
    panel === 'color'
      ? colorBtnRef
      : panel === 'size'
      ? sizeBtnRef
      : panel === 'brush'
      ? brushBtnRef
      : panel === 'straight'
      ? straightBtnRef
      : undefined;

  useDismissibleSurface({
    isOpen: panel !== null,
    onClose: () => setPanel(null),
    surfaceRef: shelfRef,
    triggerRef: activeTriggerRef,
    ignoreSelector: '[data-pro-rail-button]',
  });

  const currentBrushSettings: BrushSettings = brushSettings || {
    color: '#000000',
    size: 0.03,
    opacity: 1.0,
    profile: 'tube',
  };

  const activeBrush = getActiveCuratedBrush(currentBrushSettings);
  const displayedBrushes = QUICK_BRUSH_IDS.flatMap((id) => CURATED_BRUSHES.filter((brush) => brush.id === id));



  return (
    <>
      {/* Tap-outside backdrop for shelf popover */}
      {panel && (
        <div
          className="fixed inset-0 z-30 pointer-events-auto"
          onClick={() => setPanel(null)}
          aria-hidden="true"
        />
      )}

      <nav
        ref={rootRef}
        aria-label="Studio and drawing tools"
        data-theme={theme}
        data-expanded={isDesktopExpanded ? 'true' : 'false'}
        data-dock-position={dockPreferences.position}
        data-hidden={dockHidden ? 'true' : 'false'}
        onPointerDown={() => setDockHidden(false)}
        className="paperrocket-studio-rail fixed z-40 select-none pointer-events-none"
      >
        <div className={`paperrocket-studio-rail-inner pointer-events-auto flex items-center ${light ? 'text-neutral-800' : 'text-white/85'}`}>
          {/* Studio Modes: Select, Draw, Create, Deform, Layers */}
          <div className="paperrocket-studio-mode-group">
            {MODES.map(({ id, label, icon: Icon }) => {
              const isActive = openSheet === id;
              return (
                <button
                  key={id}
                  type="button"
                  data-pro-rail-button="true"
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => {
                    haptics.trigger('light');
                    if (id === 'draw' && setTool) {
                      setTool('brush');
                    } else if (id === 'select' && setTool) {
                      setTool('select');
                    }
                    setPanel(null);
                    if (openSheet === id) {
                      closeSheet();
                    } else {
                      openSheetId(id);
                    }
                  }}
                  className={`paperrocket-studio-mode flex items-center justify-center rounded-xl transition-colors active:scale-95 border-0 bg-transparent ${
                    isActive
                      ? light
                        ? 'text-neutral-950 font-bold'
                        : 'text-white font-bold'
                      : light
                        ? 'text-neutral-500 hover:text-neutral-900'
                        : 'text-neutral-400 hover:text-white'
                  }`}
                  aria-label={label}
                  aria-pressed={isActive}
                  title={label}
                >
                  <Icon className="h-[21px] w-[21px] shrink-0" strokeWidth={1.7} />
                  <span className="paperrocket-studio-mode-label">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="paperrocket-studio-quick-group">
            <button
              type="button"
              data-pro-rail-button="true"
              data-active={openSheet === 'draw' && tool === 'brush' ? 'true' : 'false'}
              onClick={() => {
                haptics.trigger('light');
                setTool?.('brush');
                setPanel(null);
                if (openSheet === 'draw') closeSheet();
                else openSheetId('draw');
              }}
              className="paperrocket-studio-quick paperrocket-studio-quick--draw rounded-xl flex items-center justify-center active:scale-95 transition-colors border-0 bg-transparent"
              aria-label="Draw"
              title="Draw"
            >
              <IcDraw className="h-[21px] w-[21px]" strokeWidth={1.7} />
              <span className="paperrocket-studio-quick-label">Draw</span>
            </button>

            <button
              ref={straightBtnRef}
              type="button"
              data-pro-rail-button="true"
              data-tour="straight-btn"
              data-active={brushSettings?.straightLineMode ? 'true' : 'false'}
              onClick={() => {
                haptics.trigger('light');
                const isCurrentlyActive = Boolean(brushSettings?.straightLineMode);
                if (isCurrentlyActive && panel === 'straight') {
                  setBrushSettings?.((prev) => ({
                    ...prev,
                    straightLineMode: false,
                  }));
                  setPanel(null);
                } else {
                  setTool?.('brush');
                  closeSheet();
                  setBrushSettings?.((prev) => ({
                    ...prev,
                    straightLineMode: true,
                    angleSnapping: prev.angleSnapping !== false,
                    profile: 'ribbon',
                    brushShape: 'chisel',
                    brushWidthMultiplier:
                      prev.brushWidthMultiplier && prev.brushWidthMultiplier >= 3.0
                        ? prev.brushWidthMultiplier
                        : 6.0,
                  }));
                  setPanel('straight');
                }
              }}
              className="paperrocket-studio-quick paperrocket-studio-quick--straight rounded-xl flex items-center justify-center active:scale-95 transition-colors border-0 bg-transparent"
              aria-label="Straight lines"
              title="Straight lines & stairs"
            >
              <Ruler className="h-[21px] w-[21px]" strokeWidth={1.7} />
              <span className="paperrocket-studio-quick-label">Straight</span>
            </button>

            <button
              type="button"
              data-pro-rail-button="true"
              data-active={tool === 'eraser' ? 'true' : 'false'}
              onClick={() => {
                haptics.trigger('light');
                setTool?.('eraser');
                closeSheet();
                setPanel(null);
              }}
              className="paperrocket-studio-quick paperrocket-studio-quick--erase rounded-xl flex items-center justify-center active:scale-95 transition-colors border-0 bg-transparent"
              aria-label="Erase"
              title="Erase"
            >
              <IcErase className="h-[21px] w-[21px]" strokeWidth={1.7} />
              <span className="paperrocket-studio-quick-label">Erase</span>
            </button>

            {/* Color swatch disc */}
            <button
            ref={colorBtnRef}
            type="button"
            data-pro-rail-button="true"
            data-active={panel === 'color' ? 'true' : 'false'}
            onClick={() => {
              haptics.trigger('light');
              closeSheet();
              setPanel((prev) => (prev === 'color' ? null : 'color'));
            }}
            className="paperrocket-studio-quick paperrocket-studio-quick--color rounded-xl flex items-center justify-center active:scale-95 transition-transform border-0 bg-transparent"
            aria-label="Color"
            title="Color"
          >
            <span
              className={`w-7 h-7 rounded-full border transition-all ${
                panel === 'color'
                  ? isLight ? 'border-neutral-900 ring-2 ring-neutral-900/40 shadow-xs' : 'border-white ring-2 ring-white/40 shadow-xs'
                  : isLight ? 'border-black/15' : 'border-white/20'
              }`}
              style={{
                background: (brushSettings?.previewUrl || brushSettings?.matcapUrl)
                  ? `url(${brushSettings.previewUrl || brushSettings.matcapUrl}) center/cover no-repeat`
                  : activeColor,
                boxShadow: brushSettings?.materialType === 'glow' ? `0 0 10px ${activeColor}` : undefined,
              }}
            />
            <span className="paperrocket-studio-quick-label">Color</span>
            </button>

          {/* Size button - Sleek concentric target circle */}
            <button
            ref={sizeBtnRef}
            type="button"
            data-pro-rail-button="true"
            data-active={panel === 'size' ? 'true' : 'false'}
            onClick={() => {
              haptics.trigger('light');
              closeSheet();
              setPanel((prev) => (prev === 'size' ? null : 'size'));
            }}
            className={`paperrocket-studio-quick paperrocket-studio-quick--size rounded-xl flex items-center justify-center active:scale-95 transition-colors border-0 bg-transparent ${
              panel === 'size'
                ? isLight
                  ? 'text-neutral-950 font-bold'
                  : 'text-white font-bold'
                : isLight
                ? 'text-neutral-500 hover:text-neutral-900'
                : 'text-neutral-400 hover:text-white'
            }`}
            aria-label="Stroke size"
            title={`Size: ${activeBrush.name}`}
          >
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
              panel === 'size'
                ? isLight ? 'border-neutral-900' : 'border-white'
                : isLight ? 'border-neutral-400' : 'border-white/40'
            }`}>
              <span
                className={`rounded-full transition-all ${
                  panel === 'size'
                    ? isLight ? 'bg-neutral-900' : 'bg-white'
                    : isLight ? 'bg-neutral-900' : 'bg-white'
                }`}
                style={{
                  width: Math.max(4, Math.min(10, currentBrushSettings.size * 100)),
                  height: Math.max(4, Math.min(10, currentBrushSettings.size * 100)),
                }}
              />
            </div>
            <span className="paperrocket-studio-quick-label">Size</span>
            </button>

          {/* Brushes button - Sleek spline wave curve */}
            <button
            ref={brushBtnRef}
            type="button"
            data-pro-rail-button="true"
            data-active={panel === 'brush' ? 'true' : 'false'}
            onClick={() => {
              haptics.trigger('light');
              if (setTool) {
                setTool('brush');
              }
              closeSheet();
              setPanel((prev) => (prev === 'brush' ? null : 'brush'));
            }}
            className={`paperrocket-studio-quick paperrocket-studio-quick--brush rounded-xl flex items-center justify-center active:scale-95 transition-colors border-0 bg-transparent ${
              panel === 'brush'
                ? isLight
                  ? 'text-neutral-950 font-bold'
                  : 'text-white font-bold'
                : isLight
                ? 'text-neutral-500 hover:text-neutral-900'
                : 'text-neutral-400 hover:text-white'
            }`}
            aria-label="Brushes"
            title={`Brush: ${activeBrush.name}`}
          >
            <IcBrushRibbon className="h-5 w-5" strokeWidth={1.7} />
            <span className="paperrocket-studio-quick-label">Brush</span>
            </button>

            <button
              type="button"
              data-pro-rail-button="true"
              data-active={openSheet === 'deform' ? 'true' : 'false'}
              onClick={() => {
                haptics.trigger('light');
                setPanel(null);
                if (openSheet === 'deform') closeSheet();
                else openSheetId('deform');
              }}
              className="paperrocket-studio-quick paperrocket-studio-quick--symmetry rounded-xl flex items-center justify-center active:scale-95 transition-colors border-0 bg-transparent"
              aria-label="Symmetry"
              title="Symmetry and mirror"
            >
              <IcMirror className="h-[21px] w-[21px]" strokeWidth={1.7} />
              <span className="paperrocket-studio-quick-label">Symmetry</span>
            </button>
          </div>

          <button
            type="button"
            className="paperrocket-studio-expand rounded-xl items-center justify-center active:scale-95 transition-colors border-0 bg-transparent"
            onClick={() => setIsDesktopExpanded((expanded) => !expanded)}
            aria-label={isDesktopExpanded ? 'Collapse Studio rail' : 'Expand Studio rail'}
            aria-expanded={isDesktopExpanded}
            title={isDesktopExpanded ? 'Collapse Studio rail' : 'Expand Studio rail'}
          >
            <ChevronLeft className="paperrocket-studio-expand-icon h-4 w-4" />
          </button>
        </div>

        {/* Popover Floating Shelf on the Right of the Dock */}
        {panel && (
          <MenuShelf
            ref={shelfRef}
            theme={theme}
            padding={panel === 'brush' ? 'standard' : 'tight'}
            className={`paperrocket-studio-shelf ${
              panel === 'brush'
                ? 'paperrocket-studio-shelf--brush'
                : panel === 'straight'
                ? 'paperrocket-studio-shelf--straight'
                : 'paperrocket-studio-shelf--compact'
            } pointer-events-auto absolute left-full ml-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
              panel === 'color'
                ? 'w-[154px]'
                : panel === 'size'
                ? 'w-[154px]'
                : panel === 'straight'
                ? 'w-[264px]'
                : 'w-[320px] max-w-[calc(100vw-88px)]'
            }`}
          >

              {/* Color Panel */}
              {panel === 'color' && (
                <div className="flex flex-col gap-2">
                  {/* Active Color Preview & Quick Native Color Picker */}
                  <div className="flex items-center justify-between px-0.5 pb-1 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/20 shadow-xs shrink-0"
                        style={{
                          background: (currentBrushSettings.previewUrl || currentBrushSettings.matcapUrl)
                            ? `url(${currentBrushSettings.previewUrl || currentBrushSettings.matcapUrl}) center/cover no-repeat`
                            : activeColor,
                          boxShadow: currentBrushSettings.materialType === 'glow' ? `0 0 8px ${activeColor}` : undefined,
                        }}
                      />
                      <span className="font-mono text-[10px] font-bold tracking-tight opacity-75 truncate max-w-[85px]">
                        {currentBrushSettings.activeLookName && currentBrushSettings.activeLookName !== 'Flat Paint'
                          ? currentBrushSettings.activeLookName
                          : activeColor.toUpperCase()}
                      </span>
                    </div>
                    {/* Quick Native Color Picker */}
                    <label
                      title="Pick custom color"
                      className="relative cursor-pointer w-5 h-5 rounded-md flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <input
                        type="color"
                        value={currentBrushSettings.color || '#000000'}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          if (setBrushSettings) {
                            setBrushSettings((p) => ({
                              ...p,
                              color: newColor,
                              solidColor: newColor,
                              materialType: 'shadeless',
                              shaderEffect: undefined,
                              customShader: undefined,
                              matcapUrl: undefined,
                              previewUrl: undefined,
                              matcapTexture: undefined,
                              activeLookName: 'Flat Paint',
                            }));
                          }
                        }}
                        className="sr-only"
                      />
                      <Palette className="w-3 h-3 opacity-70" />
                    </label>
                  </div>

                  {/* Preset Swatches with Selection Indicator */}
                  <div className="grid grid-cols-3 gap-2.5 py-1 justify-items-center">
                    {quickColors.map((color) => {
                      const isEquippedShaderOrMatcap = Boolean(currentBrushSettings.previewUrl || currentBrushSettings.matcapUrl);
                      const isSelected =
                        !isEquippedShaderOrMatcap &&
                        (currentBrushSettings.activeLookName === 'Flat Paint' || !currentBrushSettings.activeLookName) &&
                        activeColor.toLowerCase() === color.toLowerCase();
                      const isWhite = color.toLowerCase() === '#ffffff';
                      const isLightColor = color === '#ffffff' || color === '#f59e0b';
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            haptics.trigger('light');
                            setBrushSettings?.((previous) => ({
                              ...previous,
                              color,
                              solidColor: color,
                              materialType: 'shadeless',
                              shaderEffect: undefined,
                              customShader: undefined,
                              matcapUrl: undefined,
                              previewUrl: undefined,
                              matcapTexture: undefined,
                              activeLookName: 'Flat Paint',
                            }));
                            setPanel(null);
                          }}
                          className={`w-5 h-5 rounded-full border transition-transform shadow-xs flex items-center justify-center shrink-0 ${
                            isSelected
                              ? isLight
                                ? 'ring-2 ring-neutral-900 ring-offset-1 ring-offset-[#FAF9F5] scale-105 border-transparent'
                                : 'ring-2 ring-white ring-offset-1 ring-offset-[#131518] scale-105 border-transparent'
                              : isWhite
                              ? isLight
                                ? 'border-black/30 ring-1 ring-black/10 hover:scale-110 active:scale-95'
                                : 'border-white/30 hover:scale-110 active:scale-95'
                              : isLight
                              ? 'border-black/20 hover:scale-110 active:scale-95'
                              : 'border-white/20 hover:scale-110 active:scale-95'
                          }`}
                          style={{ background: color }}
                          aria-label={`Use ${color}`}
                          title={color}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3 h-3 ${isLightColor ? 'text-neutral-950' : 'text-white'}`}
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Opacity Slider */}
                  <div className="flex items-center gap-1.5 px-1 py-1 border-t border-black/10 dark:border-white/10">
                    <span className="text-[10px] font-mono font-bold opacity-75 w-7 shrink-0 text-right">
                      {Math.round((currentBrushSettings.opacity ?? 1) * 100)}%
                    </span>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={currentBrushSettings.opacity ?? 1}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setBrushSettings?.((prev) => ({ ...prev, opacity: val }));
                      }}
                      className="w-full h-1.5 accent-neutral-900 dark:accent-white bg-black/10 dark:bg-white/20 rounded-lg cursor-pointer"
                      title="Brush Opacity"
                    />
                  </div>

                  {/* More Colors Button -> Opens Full Color Studio */}
                  <button
                    type="button"
                    onClick={() => {
                      setPanel(null);
                      onOpenColorStudio?.();
                    }}
                    className={`w-full h-7 rounded-lg border flex items-center justify-center gap-1 text-[11px] font-medium active:scale-95 transition-all ${
                      isLight
                        ? 'border-black/15 text-neutral-800 hover:text-black hover:bg-black/5'
                        : 'border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>More colors</span>
                    <ChevronRight className="w-3 h-3 opacity-70" />
                  </button>
                </div>
              )}

            {/* Size Selector Panel - Actual Shape & Size with Slider */}
            {panel === 'size' && (
              <div className="w-full">
                <RealBrushSizeControl
                  brushSettings={currentBrushSettings}
                  onSizeChange={(newSize) => {
                    if (setBrushSettings) {
                      setBrushSettings((p) => ({ ...p, size: newSize }));
                    }
                  }}
                  theme={theme}
                />
              </div>
            )}

            {/* Brushes Panel */}
            {panel === 'brush' && (
                <div className="paperrocket-brush-browser flex flex-col gap-2 w-full">
                <div>
                  <h3 className={`text-sm font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white/95'}`}>Essential brushes</h3>
                  <p className={`mt-0.5 text-[10px] ${isLight ? 'text-neutral-500' : 'text-white/45'}`}>Four clear shapes for quick drawing.</p>
                </div>

                <div className="paperrocket-brush-grid grid grid-cols-2 gap-2">
                  {displayedBrushes.map((preset) => {
                    const isSelected = activeBrush.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          haptics.trigger('medium');
                          if (setBrushSettings) {
                            setBrushSettings((prev) => applyCuratedBrush(preset, prev));
                          }
                          if (setTool && tool !== 'brush' && tool !== 'draw') {
                            setTool('draw');
                          }
                          setPanel(null);
                        }}
                        className={`paperrocket-brush-card relative min-h-[64px] rounded-xl p-2 flex items-center gap-2 text-left transition-all active:scale-[0.98] border ${
                          isSelected
                            ? isLight
                              ? 'border-neutral-900 bg-black/[0.08] shadow-xs ring-1 ring-neutral-900/60'
                              : 'border-white bg-white/[0.12] shadow-[0_0_12px_rgba(255,255,255,0.2)] ring-1 ring-white/70'
                            : isLight
                            ? 'border-black/10 bg-black/[0.03] hover:border-black/20 hover:bg-black/[0.06]'
                            : 'border-white/[0.06] bg-[#18191e] hover:border-white/20 hover:bg-[#1f2127]'
                        }`}
                        title={preset.description}
                      >
                        <div className={`paperrocket-brush-glyph h-11 w-11 shrink-0 rounded-lg grid place-items-center ${
                          isLight ? 'bg-white/70' : 'bg-white/[0.07]'
                        }`}>
                          <BrushShapeGlyph brushId={preset.id} profile={preset.profile} materialType={preset.materialType} patternType={preset.patternType} boxSize={32} />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span
                          className={`block text-[11px] leading-[1.15] [overflow-wrap:normal] [word-break:normal] ${
                            isSelected
                              ? isLight ? 'text-neutral-950 font-bold' : 'text-white font-semibold'
                              : isLight ? 'text-neutral-700' : 'text-white/70'
                          }`}
                          >
                            {preset.name}
                          </span>
                          <span className={`mt-1 block text-[9px] leading-none ${isLight ? 'text-neutral-500' : 'text-white/40'}`}>
                            {QUICK_BRUSH_HELP[preset.id]}
                          </span>
                        </span>
                        {isSelected && (
                          <span className={`absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full ${isLight ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-950'}`}>
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPanel(null);
                    openSheetId('draw');
                  }}
                  className={`min-h-[40px] rounded-xl border px-3 text-[11px] font-semibold ${isLight ? 'border-black/10 bg-white text-neutral-800' : 'border-white/10 bg-white/[0.05] text-white/80'}`}
                >
                  More brushes and settings
                </button>
              </div>
            )}

            {/* Straight Lines & Steps Quick Shelf */}
            {panel === 'straight' && (
              <div data-tour="straight-shelf" className="flex flex-col gap-2 p-1">
                {/* Header with Title and On/Off Status Button */}
                <div className="flex items-center justify-between pb-1 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 opacity-70" />
                    <span className={`text-[11px] font-bold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white/95'}`}>
                      Straight lines
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      haptics.trigger('light');
                      setBrushSettings?.((prev) => ({
                        ...prev,
                        straightLineMode: !prev.straightLineMode,
                      }));
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      currentBrushSettings.straightLineMode
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                        : isLight
                        ? 'bg-black/5 text-neutral-500 border border-black/10'
                        : 'bg-white/10 text-white/50 border border-white/10'
                    }`}
                  >
                    {currentBrushSettings.straightLineMode ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Line Width / Thickness Slider with Quick Presets */}
                <div className="flex flex-col gap-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold ${isLight ? 'text-neutral-600' : 'text-white/70'}`}>
                      Width
                    </span>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                      {(currentBrushSettings.brushWidthMultiplier || 1).toFixed(0)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={currentBrushSettings.brushWidthMultiplier || 6}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBrushSettings?.((prev) => ({
                        ...prev,
                        brushWidthMultiplier: val,
                      }));
                    }}
                    className="w-full h-1.5 accent-neutral-900 dark:accent-white bg-black/10 dark:bg-white/20 rounded-lg cursor-pointer"
                    title="Stroke Width"
                  />
                  {/* Quick Thickness Buttons */}
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    {[
                      { label: 'Thin', mult: 2 },
                      { label: 'Medium', mult: 6 },
                      { label: 'Thick', mult: 12 },
                    ].map(({ label, mult }) => {
                      const isSelected = Math.round(currentBrushSettings.brushWidthMultiplier || 1) === mult;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            haptics.trigger('light');
                            setBrushSettings?.((prev) => ({
                              ...prev,
                              brushWidthMultiplier: mult,
                            }));
                          }}
                          className={`py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            isSelected
                              ? isLight
                                ? 'border-neutral-900 bg-neutral-900 text-white'
                                : 'border-white bg-white text-neutral-950 font-bold'
                              : isLight
                              ? 'border-black/10 bg-white text-neutral-700 hover:bg-neutral-100'
                              : 'border-white/10 bg-white/[0.05] text-white/80 hover:bg-white/10'
                          }`}
                        >
                          {label} ({mult}x)
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stroke Shape: Ribbon (Stairs/Walls) vs Round (Pipe) */}
                <div className="flex flex-col gap-1 pt-1 border-t border-black/10 dark:border-white/10">
                  <span className={`text-[10px] font-semibold ${isLight ? 'text-neutral-600' : 'text-white/70'}`}>
                    Shape
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        haptics.trigger('light');
                        setBrushSettings?.((prev) => ({
                          ...prev,
                          profile: 'ribbon',
                          brushShape: 'chisel',
                        }));
                      }}
                      className={`py-1 rounded-lg text-[10px] font-semibold border transition-all flex items-center justify-center gap-1 ${
                        currentBrushSettings.profile === 'ribbon'
                          ? isLight
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-white bg-white text-neutral-950 font-bold'
                          : isLight
                          ? 'border-black/10 bg-white text-neutral-700 hover:bg-neutral-100'
                          : 'border-white/10 bg-white/[0.05] text-white/80 hover:bg-white/10'
                      }`}
                    >
                      Flat Ribbon
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptics.trigger('light');
                        setBrushSettings?.((prev) => ({
                          ...prev,
                          profile: 'tube',
                          brushShape: 'circle',
                        }));
                      }}
                      className={`py-1 rounded-lg text-[10px] font-semibold border transition-all flex items-center justify-center gap-1 ${
                        currentBrushSettings.profile !== 'ribbon'
                          ? isLight
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-white bg-white text-neutral-950 font-bold'
                          : isLight
                          ? 'border-black/10 bg-white text-neutral-700 hover:bg-neutral-100'
                          : 'border-white/10 bg-white/[0.05] text-white/80 hover:bg-white/10'
                      }`}
                    >
                      Round Tube
                    </button>
                  </div>
                </div>

                {/* Grid & Angle Auto-alignment */}
                <div className="flex items-center justify-between pt-1 border-t border-black/10 dark:border-white/10">
                  <span className={`text-[10px] font-semibold ${isLight ? 'text-neutral-700' : 'text-white/80'}`}>
                    Snap angles (3D steps)
                  </span>
                  <input
                    type="checkbox"
                    checked={currentBrushSettings.angleSnapping !== false}
                    onChange={(e) => {
                      setBrushSettings?.((prev) => ({
                        ...prev,
                        angleSnapping: e.target.checked,
                      }));
                    }}
                    className="w-4 h-4 rounded cursor-pointer accent-neutral-900 dark:accent-white"
                  />
                </div>

                {/* Magnetic Snap / Connect Steps & Lines */}
                <div className="flex items-center justify-between pt-1 border-t border-black/10 dark:border-white/10">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-semibold ${isLight ? 'text-neutral-700' : 'text-white/80'}`}>
                      Magnetic snap
                    </span>
                    <span className="text-[8.5px] opacity-60">Connect steps &amp; corners</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentBrushSettings.magneticEndpointSnapping !== false}
                    onChange={(e) => {
                      setBrushSettings?.((prev) => ({
                        ...prev,
                        magneticEndpointSnapping: e.target.checked,
                      }));
                    }}
                    className="w-4 h-4 rounded cursor-pointer accent-neutral-900 dark:accent-white"
                  />
                </div>

                {/* 3D View Alignment Button */}
                <div className="pt-1 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      haptics.trigger('light');
                      engine?.snapToView('isometric');
                    }}
                    className={`w-full py-1.5 rounded-lg text-[11px] font-semibold border transition-all flex items-center justify-center gap-1 active:scale-95 ${
                      isLight
                        ? 'border-black/15 bg-white text-neutral-800 hover:bg-neutral-100'
                        : 'border-white/15 bg-white/[0.08] text-white hover:bg-white/15'
                    }`}
                  >
                    <span>Isometric 3D view</span>
                  </button>
                </div>
              </div>
            )}
          </MenuShelf>
        )}
      </nav>

      {dockPreferences.autoHide && dockHidden && (
        <button
          type="button"
          data-dock-position={dockPreferences.position}
          className={`paperrocket-studio-dock-reveal fixed z-40 grid place-items-center border shadow-lg ${
            isLight
              ? 'border-black/15 bg-[#f7f4ee] text-neutral-700'
              : 'border-white/15 bg-[#15171c] text-white/80'
          }`}
          onClick={() => setDockHidden(false)}
          aria-label="Show tool dock"
          title="Show tool dock"
        >
          <GripHorizontal className="h-4 w-4" strokeWidth={1.7} />
        </button>
      )}
    </>
  );
};
