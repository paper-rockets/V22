import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  IcPalette as Palette,
  IcLitForm as Zap,
  IcFlatPaint as FlatPaintIc,
  IcGlow as Flame,
  IcCutout as Scissors,
  IcCheck as Check,
  IcRuler as Ruler,
} from './StudioIcons';
import { StudioEngine } from '../../core/studioEngine';
import {
  BrushSettings,
  StrokeProfile,
  MaterialType,
  EraserMode,
} from '../../types';
import {
  DEFAULT_BRUSH_PRESETS,
  applyBrushPresetToSettings,
} from '../../presets/brushPresets';
import {
  CURATED_BRUSHES,
  getActiveCuratedBrush,
  applyCuratedBrush,
} from '../../presets/curatedBrushes';
import { BrushShapeGlyph } from '../studio/BrushShapeGlyph';
import { BrushStrokePreview } from '../studio/BrushStrokePreview';
import { RealBrushSizeControl } from '../common/RealBrushSizeControl';
import { haptics } from '../../utils/haptics';
import {
  consumeDrawPanelSection,
  DRAW_PANEL_SECTION_EVENT,
  DrawPanelSection,
} from './drawPanelNavigation';
import { openSheetId } from '../studio/panelStore';

const BRUSH_HELP: Record<string, string> = {
  streamline_ink: 'Everyday painting',
  conformal_bead: 'Follows objects',
  spatial_pipe: 'Raised 3D line',
  chisel_marker: 'Broad line',
  neon_cable: 'Glowing tube',
  halftone_dot: 'Dot pattern',
  stipple_texture: 'Speckled',
  line_hatch: 'Parallel lines',
  crosshatch: 'Grid lines',
  terrazzo_fleck: 'Stone pattern',
  mask_cutout: 'Erase shape',
};
const BRUSH_LABELS: Record<string, string> = {
  streamline_ink: 'Flat Brush',
  conformal_bead: 'Surface Brush',
  spatial_pipe: 'Round Brush',
  chisel_marker: 'Wide Marker',
};

const ESSENTIAL_BRUSH_IDS = ['streamline_ink', 'conformal_bead', 'spatial_pipe', 'chisel_marker'];
const MORE_BRUSH_IDS = ['neon_cable', 'halftone_dot', 'stipple_texture', 'line_hatch', 'crosshatch', 'terrazzo_fleck', 'mask_cutout'];


interface DrawPanelProps {
  engine?: StudioEngine | null;
  brushSettings: BrushSettings;
  setBrushSettings: React.Dispatch<React.SetStateAction<BrushSettings>>;
  onOpenColorStudio?: () => void;
  theme?: 'light' | 'dark';
}

export const DrawPanel: React.FC<DrawPanelProps> = ({
  brushSettings,
  setBrushSettings,
  onOpenColorStudio,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const initialSection = consumeDrawPanelSection();
  const [panelView, setPanelView] = useState<'draw' | 'advanced'>('draw');
  const [requestedSection, setRequestedSection] = useState<DrawPanelSection | null>(initialSection);
  const panelRootRef = useRef<HTMLDivElement>(null);
  const brushSectionRef = useRef<HTMLDivElement>(null);
  const colorSectionRef = useRef<HTMLDivElement>(null);
  const sizeSectionRef = useRef<HTMLDivElement>(null);
  const [showMoreBrushes, setShowMoreBrushes] = useState(false);
  const activeBrush = getActiveCuratedBrush(brushSettings);
  const essentialBrushes = ESSENTIAL_BRUSH_IDS.flatMap((id) => CURATED_BRUSHES.filter((brush) => brush.id === id));
  const moreBrushes = MORE_BRUSH_IDS.flatMap((id) => CURATED_BRUSHES.filter((brush) => brush.id === id));

  const isConformal = brushSettings.drawingMode !== 'spatial_3d';
  const isFlat = brushSettings.profile === 'ribbon' || brushSettings.profile === 'conformal';

  const updateSetting = <K extends keyof BrushSettings>(key: K, value: BrushSettings[K]) => {
    setBrushSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Older saved projects may omit drawingMode. Normalize once so the shipped
  // default is explicit and imported models immediately become the draw surface.
  useEffect(() => {
    if (brushSettings.drawingMode) return;
    setBrushSettings((prev) => ({
      ...prev,
      drawingMode: 'surface',
      profile: prev.profile || 'ribbon',
      materialType: prev.materialType || 'shadeless',
      patternType: prev.patternType || 'none',
      solidColor: prev.solidColor || prev.color,
      activeLookName: prev.activeLookName || 'Flat Paint',
    }));
  }, [brushSettings.drawingMode, setBrushSettings]);

  useEffect(() => {
    const handleSectionRequest = (event: Event) => {
      const section = (event as CustomEvent<DrawPanelSection>).detail;
      setRequestedSection(section);
      setPanelView('draw');
    };
    window.addEventListener(DRAW_PANEL_SECTION_EVENT, handleSectionRequest);
    return () => window.removeEventListener(DRAW_PANEL_SECTION_EVENT, handleSectionRequest);
  }, []);

  useEffect(() => {
    if (!requestedSection) return;
    const frame = window.requestAnimationFrame(() => {
      if (requestedSection === 'brushes') brushSectionRef.current?.scrollIntoView({ block: 'nearest' });
      if (requestedSection === 'style') colorSectionRef.current?.scrollIntoView({ block: 'nearest' });
      if (requestedSection === 'size') sizeSectionRef.current?.scrollIntoView({ block: 'nearest' });
      setRequestedSection(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [panelView, requestedSection]);

  // Changing between the main and advanced view is a new navigation level.
  // Always start it at the top rather than inheriting the previous scroll.
  useEffect(() => {
    panelRootRef.current?.closest<HTMLElement>('.paperrocket-pro-content')?.scrollTo({ top: 0 });
  }, [panelView]);

  const selectSolidLook = (materialType: 'shadeless' | 'shaded' | 'glow') => {
    let color = brushSettings.color || brushSettings.solidColor || '#38bdf8';
    if (materialType === 'glow' && (color.toLowerCase() === '#000000' || color.toLowerCase() === '#000')) {
      color = '#00f7ff';
    }
    setBrushSettings((prev) => ({
      ...prev,
      color,
      solidColor: color,
      materialType,
      profile: prev.profile === 'tube' ? 'ribbon' : (prev.profile || 'ribbon'),
      shaderEffect: undefined,
      customShader: undefined,
      matcapUrl: undefined,
      previewUrl: undefined,
      matcapTexture: undefined,
      activeLookName: materialType === 'shadeless' ? 'Flat Paint' : materialType === 'shaded' ? 'Lit' : 'Glow',
    }));
  };

  const renderBrushCards = (presets: typeof CURATED_BRUSHES) => presets.map((preset) => {
    const isSelected = activeBrush.id === preset.id;
    return (
      <button
        key={preset.id}
        type="button"
        onClick={() => {
          haptics.trigger('medium');
          setBrushSettings((prev) => applyCuratedBrush(preset, prev));
        }}
        className={`paperrocket-brush-card relative min-h-[58px] rounded-xl p-2 grid grid-cols-[minmax(96px,1.2fr)_minmax(92px,.8fr)] items-center gap-2.5 text-left transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98] border ${
          isSelected
            ? isLight
              ? 'border-neutral-900 bg-black/[0.08] shadow-xs ring-1 ring-neutral-900/60'
              : 'border-white bg-white/[0.12] shadow-[0_0_10px_rgba(255,255,255,0.2)] ring-1 ring-white/70'
            : isLight
              ? 'border-black/10 bg-white hover:border-black/20 text-neutral-800'
              : 'border-white/[0.06] bg-[#18191e] hover:border-white/20 hover:bg-[#1f2127] text-white/80'
        }`}
        title={BRUSH_HELP[preset.id] || 'Creative brush'}
      >
        {isSelected && (
          <span className={`absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full ${isLight ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-950'}`}>
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
        )}
        <div className={`min-w-0 rounded-lg px-2 py-1 grid place-items-center ${isLight ? 'bg-black/[0.04]' : 'bg-white/[0.07]'}`}>
          <BrushStrokePreview brushId={preset.id} />
        </div>
        <span className="min-w-0 flex-1">
          <span className={`block text-[11px] leading-[1.15] [overflow-wrap:normal] [word-break:normal] ${isSelected ? (isLight ? 'text-neutral-950 font-bold' : 'text-white font-bold') : 'opacity-80 font-medium'}`}>
            {BRUSH_LABELS[preset.id] || preset.name}
          </span>
          <span className={`mt-1 block text-[9px] leading-none ${isLight ? 'text-neutral-500' : 'text-white/45'}`}>
            {BRUSH_HELP[preset.id] || 'Creative brush'}
          </span>
        </span>
      </button>
    );
  });

  const cardClass = isLight
    ? 'p-2.5 rounded-xl bg-neutral-100/50 border border-black/5 space-y-1.5'
    : 'p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5';

  const subHeadingClass = `text-[10px] font-bold uppercase tracking-wider ${
    isLight ? 'text-neutral-500' : 'text-neutral-400'
  }`;

  const PROFILES: { id: StrokeProfile; label: string }[] = [
    { id: 'ribbon', label: 'Ribbon' },
    { id: 'tube', label: '3D Tube' },
    { id: 'marker', label: 'Marker' },
    { id: 'conformal', label: 'Surface Decal' },
  ];

  const MATERIALS: { id: MaterialType; label: string; icon: any }[] = [
    { id: 'shadeless', label: 'Flat Paint', icon: FlatPaintIc },
    { id: 'shaded', label: 'Lit Form', icon: Zap },
    { id: 'glow', label: 'Glow Light', icon: Flame },
    { id: 'cutout', label: 'Cutout', icon: Scissors },
  ];

  return (
    <div ref={panelRootRef} className="space-y-2 text-xs select-none">
      {panelView === 'draw' ? (
        <>
          {/* 1. Placement */}
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div className={subHeadingClass}>Where to draw</div>
              <span className="text-[10px] font-semibold opacity-60">
                {brushSettings.stickAndAirDraw ? 'Surface + Air' : (isConformal ? 'Surface' : 'Open air')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  haptics.trigger('light');
                  updateSetting('drawingMode', 'surface');
                }}
                className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border text-center font-medium transition-colors duration-150 ease-out text-xs flex flex-col items-center justify-center ${
                  isConformal
                    ? isLight
                      ? 'bg-neutral-900 border-neutral-900 text-white font-bold shadow-xs'
                      : 'bg-white border-white text-neutral-950 font-bold shadow-xs'
                    : isLight
                    ? 'bg-white border-black/10 text-neutral-700 hover:bg-neutral-200/50'
                    : 'bg-black/30 border-white/10 text-neutral-300 hover:bg-white/5'
                }`}
                aria-pressed={isConformal}
              >
                <span className="font-bold">Surface</span>
                <span className="text-[9px] opacity-70">Model or canvas</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  haptics.trigger('light');
                  updateSetting('drawingMode', 'spatial_3d');
                }}
                className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border text-center font-medium transition-colors duration-150 ease-out text-xs flex flex-col items-center justify-center ${
                  !isConformal
                    ? isLight
                      ? 'bg-neutral-900 border-neutral-900 text-white font-bold shadow-xs'
                      : 'bg-white border-white text-neutral-950 font-bold shadow-xs'
                    : isLight
                    ? 'bg-white border-black/10 text-neutral-700 hover:bg-neutral-200/50'
                    : 'bg-black/30 border-white/10 text-neutral-300 hover:bg-white/5'
                }`}
                aria-pressed={!isConformal}
              >
                <span className="font-bold">Open air</span>
                <span className="text-[9px] opacity-70">Open Air</span>
              </button>
            </div>
            <label className="flex items-center justify-between min-h-[38px] mt-1.5 px-2.5 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 cursor-pointer">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold leading-tight">Surface + open air in one line</span>
                <span className="text-[9px] opacity-60">Draw on 3D models and continue into mid-air</span>
              </div>
              <input
                type="checkbox"
                checked={brushSettings.stickAndAirDraw || false}
                onChange={(e) => updateSetting('stickAndAirDraw', e.target.checked)}
                className="w-4 h-4 rounded accent-neutral-900 dark:accent-white cursor-pointer ml-2"
              />
            </label>
          </div>

          {/* 2. Choose a brush (4 essential choices + more brushes) */}
          <div ref={brushSectionRef} className={cardClass}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold tracking-tight text-current">Brush</div>
                <div className={`mt-0.5 text-[10px] ${isLight ? 'text-neutral-500' : 'text-white/45'}`}>
                  {BRUSH_LABELS[activeBrush.id] || activeBrush.name} is active
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${isLight ? 'bg-black/[0.05] text-neutral-600' : 'bg-white/[0.06] text-white/55'}`}>
                4 primary
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 pt-2">
              {renderBrushCards(essentialBrushes)}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  haptics.trigger('light');
                  setShowMoreBrushes((visible) => !visible);
                }}
                className={`flex min-h-[42px] w-full items-center justify-between rounded-xl border px-3 text-left text-[11px] font-semibold ${
                  isLight ? 'border-black/10 bg-white text-neutral-800' : 'border-white/10 bg-black/25 text-white/80'
                }`}
                aria-expanded={showMoreBrushes}
              >
                <span>More brushes <span className="opacity-50">({moreBrushes.length})</span></span>
                <ChevronRight className={`h-4 w-4 transition-transform ${showMoreBrushes ? 'rotate-90' : ''}`} />
              </button>
              {showMoreBrushes && <div className="grid grid-cols-1 gap-1.5 pt-2">{renderBrushCards(moreBrushes)}</div>}
            </div>
          </div>

          {/* 3. Color swatches + Color Picker opener */}
          <div ref={colorSectionRef} className={cardClass}>
            <div className="flex items-center justify-between">
              <div className={subHeadingClass}>Color</div>
              <span className="font-mono text-[11px] font-bold opacity-80">
                {(brushSettings.solidColor || brushSettings.color || '#38bdf8').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-4 justify-items-center gap-2 pt-1">
              {['#2563eb', '#38bdf8', '#ef4444', '#f59e0b', '#10b981', '#a855f7', '#000000', '#ffffff'].map((hex) => {
                const isSelected =
                  !brushSettings.previewUrl &&
                  !brushSettings.matcapUrl &&
                  (brushSettings.activeLookName === 'Flat Paint' || !brushSettings.activeLookName) &&
                  (brushSettings.solidColor || brushSettings.color || '#000000').toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      haptics.trigger('light');
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
                    }}
                    className={`paperrocket-color-swatch !min-h-0 !min-w-0 h-9 w-9 shrink-0 rounded-full border transition-transform active:scale-95 ${
                      isSelected
                        ? isLight
                          ? 'ring-2 ring-neutral-900 scale-105 border-white'
                          : 'ring-2 ring-white scale-105 border-black/40'
                        : 'border-black/20 dark:border-white/20 hover:scale-105'
                    }`}
                    style={{ backgroundColor: hex }}
                    aria-label={`Use ${hex}`}
                    title={hex}
                  >
                    <span className="sr-only">{hex}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                haptics.trigger('light');
                onOpenColorStudio?.();
              }}
              className={`w-full min-h-[40px] p-2 rounded-xl border flex items-center justify-between transition-colors duration-150 ease-out group ${
                isLight
                  ? 'bg-white border-black/10 hover:border-black/30 text-neutral-900'
                  : 'bg-black/30 border-white/10 hover:border-white/30 text-white'
              }`}
              title="Open Color Picker"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-6 h-6 rounded-full border border-black/15 dark:border-white/20 shadow-xs shrink-0"
                  style={{
                    background: brushSettings.solidColor || brushSettings.color || '#38bdf8',
                    boxShadow: brushSettings.materialType === 'glow' ? `0 0 8px ${brushSettings.color || '#00f7ff'}` : undefined,
                  }}
                />
                <div className="text-left">
                  <div className="font-semibold text-xs leading-none">Color Picker</div>
                  <div className="text-[10px] opacity-60 mt-0.5">Wheel, palettes, and effects</div>
                </div>
              </div>
              <Palette className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* 4. Brush Size & Intensity */}
          <div ref={sizeSectionRef} className={cardClass}>
            <div className="flex items-center justify-between">
              <div className={subHeadingClass}>Size & Intensity</div>
              <div className="flex items-center gap-1.5">
                <BrushShapeGlyph brushId={activeBrush.id} profile={activeBrush.profile} materialType={activeBrush.materialType} patternType={activeBrush.patternType} boxSize={18} />
                <span className="text-[10.5px] font-semibold text-neutral-950 dark:text-white">{BRUSH_LABELS[activeBrush.id] || activeBrush.name}</span>
              </div>
            </div>

            <RealBrushSizeControl
              brushSettings={brushSettings}
              onSizeChange={(newSize) => updateSetting('size', newSize)}
              theme={theme}
              showHeading={false}
            />

            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-medium text-current">Intensity (Opacity)</span>
                <span className="font-mono text-[10px] font-bold">
                  {Math.round((brushSettings.opacity ?? 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.02"
                value={brushSettings.opacity ?? 1.0}
                onChange={(e) => updateSetting('opacity', parseFloat(e.target.value))}
                className={`w-full h-1.5 rounded cursor-pointer ${
                  isLight ? 'accent-neutral-900 bg-neutral-200' : 'accent-white bg-neutral-800'
                }`}
              />
            </div>
          </div>

          {/* 5. One clear Advanced disclosure */}
          <button
            type="button"
            onClick={() => {
              haptics.trigger('light');
              setPanelView('advanced');
            }}
            className={`flex min-h-[44px] w-full items-center justify-between rounded-xl border px-3 text-left ${
              isLight ? 'border-black/10 bg-white/80' : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            <span>
              <span className="block text-[11px] font-semibold">Advanced</span>
              <span className="block text-[9.5px] opacity-55">Surface finish, line shape, live feel, and assist</span>
            </span>
            <ChevronRight className="h-4 w-4 opacity-60" />
          </button>
        </>
      ) : (
        /* Fine-tuning Advanced View */
        <div className={cardClass}>
          <button
            type="button"
            onClick={() => {
              haptics.trigger('light');
              setPanelView('draw');
            }}
            className="mb-2 flex min-h-[40px] w-full items-center gap-2 border-b border-black/5 text-left dark:border-white/5"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-[11px] font-semibold">Back to drawing tools</span>
          </button>

          <div className="space-y-3">
            {/* Profile Selection */}
            <div className="space-y-1">
              <label className={`text-[10.5px] font-medium ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                Stroke Profile
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PROFILES.map(({ id, label }) => {
                  const isSelected = brushSettings.profile === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        haptics.trigger('light');
                        updateSetting('profile', id);
                      }}
                      className={`min-h-[44px] px-2 py-1.5 rounded-xl border text-center font-medium transition-colors duration-150 ease-out text-xs ${
                        isSelected
                          ? isLight
                            ? 'bg-neutral-900 border-neutral-900 text-white font-bold shadow-xs'
                            : 'bg-white border-white text-neutral-950 font-bold shadow-xs'
                          : isLight
                          ? 'bg-white border-black/10 text-neutral-700 hover:bg-neutral-200/50'
                          : 'bg-black/30 border-white/10 text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Material Type Selection */}
            <div className="space-y-1 pt-1">
              <label className={`text-[10.5px] font-medium ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                Surface Finish
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {MATERIALS.map(({ id, label, icon: Icon }) => {
                  const isSelected = brushSettings.materialType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        haptics.trigger('light');
                        updateSetting('materialType', id);
                      }}
                      className={`min-h-[44px] px-2 py-1.5 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-colors duration-150 ease-out text-xs ${
                        isSelected
                          ? isLight
                            ? 'bg-neutral-900 border-neutral-900 text-white font-bold shadow-xs'
                            : 'bg-white border-white text-neutral-950 font-bold shadow-xs'
                          : isLight
                          ? 'bg-white border-black/10 text-neutral-700 hover:bg-neutral-200/50'
                          : 'bg-black/30 border-white/10 text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawing Assistance & Toggles */}
            <div className="space-y-2 pt-1 border-t border-black/5 dark:border-white/5">
              {/* Ribbon Width Multiplier */}
              {(brushSettings.profile === 'ribbon' || brushSettings.profile === 'marker' || brushSettings.brushShape === 'wide_flat') && (
                <div className="space-y-1 pt-1 border-t border-black/5 dark:border-white/5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-medium text-current">Brush width</span>
                    <span className="font-mono text-[10px] font-bold">
                      {(brushSettings.brushWidthMultiplier || 1.5).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.5"
                    value={brushSettings.brushWidthMultiplier || 1.5}
                    onChange={(e) => updateSetting('brushWidthMultiplier', parseFloat(e.target.value))}
                    className={`w-full h-1.5 rounded cursor-pointer ${
                      isLight ? 'accent-neutral-900 bg-neutral-200' : 'accent-white bg-neutral-800'
                    }`}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  haptics.trigger('light');
                  openSheetId('shapes');
                }}
                className={`flex min-h-[52px] w-full items-center justify-between gap-2 rounded-xl border px-3 text-left transition-colors ${
                  isLight ? 'border-black/10 bg-white hover:bg-neutral-50' : 'border-white/10 bg-black/30 hover:bg-white/5'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Ruler className="h-4 w-4 shrink-0" />
                  <span>
                    <span className="block text-[11px] font-semibold">Line Assist</span>
                    <span className="block text-[9.5px] opacity-60">Stabilizer, cleanup, shapes, and straight lines</span>
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-65" />
              </button>

              {/* Pressure sensitivity */}
              <label className="flex items-center justify-between min-h-[44px] cursor-pointer border-t border-black/5 dark:border-white/5 pt-1">
                <span className="text-[11px] font-medium">Stylus Pressure Sensitivity</span>
                <input
                  type="checkbox"
                  checked={brushSettings.pressureSensitivity !== false}
                  onChange={(e) => updateSetting('pressureSensitivity', e.target.checked)}
                  className="w-4 h-4 rounded accent-neutral-900 dark:accent-white cursor-pointer"
                />
              </label>

              {/* Stick to surface & draw in air */}
              <label className="flex items-center justify-between min-h-[44px] cursor-pointer border-t border-black/5 dark:border-white/5 pt-1">
                <div>
                  <span className="text-[11px] font-medium block">Stick to Surface & Draw in Air</span>
                  <span className="text-[9.5px] opacity-60 block">Draw on 3D models and continue in mid-air in the same line</span>
                </div>
                <input
                  type="checkbox"
                  checked={brushSettings.stickAndAirDraw || false}
                  onChange={(e) => updateSetting('stickAndAirDraw', e.target.checked)}
                  className="w-4 h-4 rounded accent-neutral-900 dark:accent-white cursor-pointer"
                />
              </label>
            </div>

            {/* Eraser Mode: Cutout vs Vacuum */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-medium text-current">Eraser Mode</span>
                <span className="font-mono text-[10px] opacity-70">
                  {brushSettings.eraserMode === 'cutout' ? 'Cut Out Parts' : 'Erase Whole Lines'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['vacuum', 'cutout'] as EraserMode[]).map((mode) => {
                  const isSelected = (brushSettings.eraserMode || 'vacuum') === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        haptics.trigger('light');
                        updateSetting('eraserMode', mode);
                      }}
                      className={`min-h-[44px] px-2 py-1.5 rounded-xl border text-center font-medium transition-colors duration-150 ease-out text-xs ${
                        isSelected
                          ? isLight
                            ? 'bg-neutral-900 border-neutral-900 text-white font-bold shadow-xs'
                            : 'bg-white border-white text-neutral-950 font-bold shadow-xs'
                          : isLight
                          ? 'bg-white border-black/10 text-neutral-700 hover:bg-neutral-200/50'
                          : 'bg-black/30 border-white/10 text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      {mode === 'vacuum' ? 'Erase Whole Lines' : 'Cut Out Parts'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
