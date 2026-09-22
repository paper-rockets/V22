import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getMenuSurfaceClasses } from '../ui/MenuPrimitives';
import {
  Box,
  Compass,
  Droplets,
  Grid,
  Layers,
  Maximize2,
  Minimize2,
  MoveDiagonal2,
  Palette,
  Sliders,
  Sun,
  X,
  ChevronRight,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface StudioTopMoreMenuProps {
  open: boolean;
  theme: 'light' | 'dark';
  isFullscreen: boolean;
  onClose: () => void;
  // Canvas controls
  canvasFormat?: 'portrait' | 'square' | 'landscape' | 'custom';
  onCanvasFormatChange?: (format: 'portrait' | 'square' | 'landscape') => void;
  canvasWidth?: number;
  canvasHeight?: number;
  onCanvasSizeChange?: (width: number, height: number) => void;
  canvasTransparency?: number;
  onCanvasTransparencyChange?: (transparency: number) => void;
  canvasColor?: string;
  onCanvasColorChange?: (color: string) => void;
  // Scene controls
  showGrid?: boolean;
  onToggleGrid?: () => void;
  showPlane?: boolean;
  onTogglePlane?: () => void;
  onOpenIllumination?: () => void;
  onOpenRenderSettings?: () => void;
  // View controls
  isGizmoActive?: boolean;
  onToggleGizmo?: () => void;
  onToggleFullscreen: () => void;
}

const Row: React.FC<{
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint?: string;
  children: React.ReactNode;
  isLight: boolean;
}> = ({ icon: Icon, label, hint, children, isLight }) => (
  <div
    className={`flex items-center gap-2.5 py-1.5 border-b last:border-b-0 min-h-[38px] ${
      isLight ? 'border-neutral-200/70' : 'border-neutral-800/70'
    }`}
  >
    <Icon className="w-3.5 h-3.5 shrink-0 opacity-75" strokeWidth={1.75} />
    <div className="flex-1 min-w-0 pr-1">
      <div className="text-[12px] font-medium leading-tight">{label}</div>
      {hint && (
        <div className={`text-[10px] leading-tight mt-0.5 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
          {hint}
        </div>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const ActionRow: React.FC<{
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint?: string;
  onClick: () => void;
  isLight: boolean;
  chevron?: boolean;
}> = ({ icon: Icon, label, hint, onClick, isLight, chevron = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 py-1.5 px-1.5 rounded-lg text-left transition-colors cursor-pointer min-h-[38px] ${
      isLight ? 'hover:bg-neutral-100 text-neutral-900 active:bg-neutral-200' : 'hover:bg-white/[0.08] text-white active:bg-white/[0.12]'
    }`}
  >
    <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
    <div className="flex-1 min-w-0">
      <div className="text-[12px] font-medium leading-tight">{label}</div>
      {hint && (
        <div className={`text-[10px] leading-tight mt-0.5 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
          {hint}
        </div>
      )}
    </div>
    {chevron && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-45" />}
  </button>
);

const SectionHeader: React.FC<{ title: string; isLight: boolean }> = ({ title, isLight }) => (
  <div
    className={`pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wider ${
      isLight ? 'text-neutral-500' : 'text-neutral-400'
    }`}
  >
    {title}
  </div>
);

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string }> = ({
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

export const StudioTopMoreMenu: React.FC<StudioTopMoreMenuProps> = ({
  open,
  theme,
  isFullscreen,
  onClose,
  canvasFormat = 'portrait',
  onCanvasFormatChange,
  canvasWidth = 2.7,
  canvasHeight = 3.6,
  onCanvasSizeChange,
  canvasTransparency = 0,
  onCanvasTransparencyChange,
  canvasColor = '#ffffff',
  onCanvasColorChange,
  showGrid = true,
  onToggleGrid,
  showPlane = false,
  onTogglePlane,
  onOpenIllumination,
  onOpenRenderSettings,
  isGizmoActive = true,
  onToggleGizmo,
  onToggleFullscreen,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const controls = Array.from(
        dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
      ) as HTMLElement[];
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const closeWhenFocusLeaves = (event: PointerEvent) => {
      if (!dialogRef.current?.contains(event.target as Node)) onClose();
    };
    window.addEventListener('pointerdown', closeWhenFocusLeaves);
    return () => window.removeEventListener('pointerdown', closeWhenFocusLeaves);
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <div
        id="studio-top-more-menu"
        data-theme={theme}
        ref={dialogRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="studio-more-title"
        className={`pointer-events-auto absolute right-3 top-2 sm:top-[calc(env(safe-area-inset-top)+3.25rem)] w-[min(264px,calc(100vw-1.5rem))] flex flex-col rounded-2xl p-2.5 shadow-2xl ${
          getMenuSurfaceClasses(isLight)
        }`}
      >
        {/* Header */}
        <div className="shrink-0 mb-0.5 flex min-h-8 items-center justify-between border-b border-black/5 dark:border-white/5 pb-1">
          <div>
            <h2 id="studio-more-title" className="text-xs font-semibold tracking-tight">
              Scene
            </h2>
            <span className={`block text-[10px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Canvas & workspace
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`grid h-7 w-7 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer ${
              isLight ? 'hover:bg-neutral-100 text-neutral-600' : 'hover:bg-white/10 text-neutral-300'
            }`}
            aria-label="Close menu"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>

        {/* 1. Canvas Dimensions & Appearance */}
        <SectionHeader title="Canvas" isLight={isLight} />

        {onCanvasFormatChange && (
          <Row icon={Box} label="Canvas size" hint="Preset proportions" isLight={isLight}>
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
                  className={`min-h-[26px] h-[26px] rounded-md px-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    canvasFormat === format
                      ? isLight ? 'bg-neutral-900 text-white shadow-sm' : 'bg-white text-zinc-950 shadow-sm'
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
          <div className={`border-b py-1.5 ${isLight ? 'border-neutral-200/70' : 'border-neutral-800/70'}`}>
            <div className="mb-1.5 flex items-center gap-2">
              <MoveDiagonal2 className="h-3.5 w-3.5 opacity-75" strokeWidth={1.75} />
              <div className="text-[12px] font-medium">Manual size</div>
              <div className="ml-auto text-[11px] font-mono tabular-nums opacity-65">
                {(canvasWidth ?? 2.7).toFixed(1)} × {(canvasHeight ?? 3.6).toFixed(1)}
              </div>
            </div>
            <div className="grid grid-cols-[16px_1fr] items-center gap-x-2 gap-y-1">
              <label htmlFor="top-menu-canvas-w" className="text-[10px] font-medium opacity-70">W</label>
              <input
                id="top-menu-canvas-w"
                type="range"
                min="1"
                max="8"
                step="0.1"
                value={canvasWidth ?? 2.7}
                onChange={(event) => onCanvasSizeChange(Number(event.target.value), canvasHeight ?? 3.6)}
                onPointerUp={() => haptics.trigger('light')}
                className="h-5 w-full cursor-ew-resize accent-sky-500"
                aria-label="Canvas width"
              />
              <label htmlFor="top-menu-canvas-h" className="text-[10px] font-medium opacity-70">H</label>
              <input
                id="top-menu-canvas-h"
                type="range"
                min="1"
                max="8"
                step="0.1"
                value={canvasHeight ?? 3.6}
                onChange={(event) => onCanvasSizeChange(canvasWidth ?? 2.7, Number(event.target.value))}
                onPointerUp={() => haptics.trigger('light')}
                className="h-5 w-full cursor-ns-resize accent-sky-500"
                aria-label="Canvas height"
              />
            </div>
          </div>
        )}

        {onCanvasColorChange && (
          <Row icon={Palette} label="Canvas color" hint="Surface background" isLight={isLight}>
            <label className={`flex h-7 items-center gap-1.5 rounded-md border px-2 cursor-pointer ${
              isLight ? 'border-neutral-300 bg-neutral-100' : 'border-neutral-700 bg-neutral-800'
            }`}>
              <input
                type="color"
                value={canvasColor ?? '#ffffff'}
                onInput={(event) => onCanvasColorChange((event.target as HTMLInputElement).value)}
                onChange={(event) => onCanvasColorChange(event.target.value)}
                className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0"
                aria-label="Canvas background color"
              />
              <span className="text-[10.5px] font-mono font-medium tabular-nums">
                {(canvasColor ?? '#ffffff').toUpperCase()}
              </span>
            </label>
          </Row>
        )}

        {onCanvasTransparencyChange && (
          <Row icon={Droplets} label="Canvas transparency" hint="Show 3D space through" isLight={isLight}>
            <div className="w-32">
              <div className="mb-0.5 flex justify-between text-[10px] font-mono tabular-nums opacity-70">
                <span>Opaque</span>
                <span>{Math.round(canvasTransparency ?? 0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={canvasTransparency ?? 0}
                onChange={(event) => onCanvasTransparencyChange(Number(event.target.value))}
                onPointerUp={() => haptics.trigger('light')}
                className="h-5 w-full cursor-pointer accent-sky-500"
                aria-label="Canvas transparency"
              />
            </div>
          </Row>
        )}

        {/* 2. Scene */}
        <SectionHeader title="Scene" isLight={isLight} />

        {onToggleGrid && (
          <Row icon={Grid} label="Ground Grid" hint="Floor reference plane" isLight={isLight}>
            <Toggle on={Boolean(showGrid)} onChange={() => onToggleGrid()} label="Ground Grid" />
          </Row>
        )}

        {onTogglePlane && (
          <Row icon={Layers} label="Drawing Plane" hint="Flat surface for drawing lines" isLight={isLight}>
            <Toggle on={Boolean(showPlane)} onChange={() => onTogglePlane()} label="Drawing Plane" />
          </Row>
        )}

        {onOpenIllumination && (
          <ActionRow
            icon={Sun}
            label="Studio Lighting"
            hint="Sunlight, angles & shadows"
            onClick={() => {
              onClose();
              onOpenIllumination();
            }}
            isLight={isLight}
            chevron
          />
        )}

        {onOpenRenderSettings && (
          <ActionRow
            icon={Sliders}
            label="Picture Quality"
            hint="Bloom, glow & anti-aliasing"
            onClick={() => {
              onClose();
              onOpenRenderSettings();
            }}
            isLight={isLight}
            chevron
          />
        )}

        {/* 3. View */}
        <SectionHeader title="View" isLight={isLight} />

        {onToggleGizmo && (
          <Row icon={Compass} label="3D Navigator" hint="Corner view controller" isLight={isLight}>
            <Toggle on={Boolean(isGizmoActive)} onChange={() => onToggleGizmo()} label="3D Navigator" />
          </Row>
        )}

        <Row
          icon={isFullscreen ? Minimize2 : Maximize2}
          label="Full Screen"
          hint={isFullscreen ? 'Return to window' : 'Use whole screen'}
          isLight={isLight}
        >
          <button
            type="button"
            onClick={() => {
              haptics.trigger('light');
              onToggleFullscreen();
            }}
            className={`h-[26px] px-2.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
              isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
            }`}
          >
            {isFullscreen ? 'Exit' : 'Enter'}
          </button>
        </Row>
      </div>
    </div>,
    document.body
  );
};
