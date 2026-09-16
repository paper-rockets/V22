import React, { useState, useEffect, useCallback } from 'react';
import {
  Redo2,
  Menu,
  Undo2,
  Check,
  Box,
  ChevronDown,
} from 'lucide-react';
import { toggleSheet } from './panelStore';
import { StudioTopMoreMenu } from './StudioTopMoreMenu';
import { StudioTopLeftMenu } from './StudioTopLeftMenu';
import { AutoSaveStatus } from '../AutoSaveToast';
import type { NavigatorLayout } from '../TransformNavigator/JoystickNavigator';

interface StudioTopStripProps {
  projectName: string;
  autoSaveStatus?: AutoSaveStatus;
  lastSavedTime?: Date | null;
  onRetrySave?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  theme?: 'light' | 'dark';
  onOpenIllumination?: () => void;
  onOpenSessions?: () => void;
  onOpenExport?: () => void;
  onToggleTheme?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  navigatorStyle?: NavigatorLayout;
  onNavigatorStyleChange?: (style: NavigatorLayout) => void;
  isGizmoActive?: boolean;
  onToggleGizmo?: () => void;
  onMoreOpenChange?: (open: boolean) => void;
  // Scene & Canvas controls (Image 3)
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
}

export const StudioTopStrip: React.FC<StudioTopStripProps> = ({
  projectName,
  autoSaveStatus,
  lastSavedTime,
  onRetrySave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  theme = 'dark',
  onOpenIllumination,
  onOpenSessions,
  onOpenExport,
  onToggleTheme,
  showGrid = true,
  onToggleGrid,
  navigatorStyle,
  onNavigatorStyleChange,
  isGizmoActive,
  onToggleGizmo,
  onMoreOpenChange,
  canvasFormat,
  onCanvasFormatChange,
  canvasWidth,
  canvasHeight,
  onCanvasSizeChange,
  canvasTransparency,
  onCanvasTransparencyChange,
  canvasColor,
  onCanvasColorChange,
  onClearCanvas,
}) => {
  const ink = theme === 'light' ? 'text-neutral-800' : 'text-white/90';
  const button = `pointer-events-auto shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 grid place-items-center rounded-xl transition-colors hover:bg-current/[0.045] active:bg-current/[0.075] ${ink}`;

  const isCurrentlyFullscreen = (): boolean => {
    if (typeof document === 'undefined') return false;
    const doc = document as any;
    return Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  };

  const [isFullscreen, setIsFullscreen] = useState(isCurrentlyFullscreen);
  const [simulatedFs, setSimulatedFs] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [leftMenuOpen, setLeftMenuOpen] = useState(false);
  const isFsActive = isFullscreen || simulatedFs;

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = isCurrentlyFullscreen();
      setIsFullscreen(isFs);
      if (isFs) setSimulatedFs(false);
    };

    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ];
    events.forEach((ev) => document.addEventListener(ev, handleFullscreenChange));
    return () => {
      events.forEach((ev) => document.removeEventListener(ev, handleFullscreenChange));
    };
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    const doc = document as any;
    const docEl = (document.documentElement || document.body) as any;
    const nativeFs = isCurrentlyFullscreen();

    if (!nativeFs && !simulatedFs) {
      let enteredNative = false;
      try {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
          enteredNative = true;
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
          enteredNative = true;
        } else if (docEl.webkitRequestFullScreen) {
          await docEl.webkitRequestFullScreen();
          enteredNative = true;
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
          enteredNative = true;
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
          enteredNative = true;
        }
      } catch (err) {
        console.warn('Native fullscreen request failed, falling back to simulated:', err);
      }
      if (!enteredNative) {
        setSimulatedFs(true);
      }
    } else {
      try {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.webkitCancelFullScreen) {
          await doc.webkitCancelFullScreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      } catch (err) {
        console.warn('Native fullscreen exit failed:', err);
      }
      setSimulatedFs(false);
    }
  }, [simulatedFs]);

  const openSettings = useCallback(() => toggleSheet('settings'), []);
  const handleOpenMore = useCallback(() => {
    setLeftMenuOpen(false);
    setMoreOpen(true);
    onMoreOpenChange?.(true);
  }, [onMoreOpenChange]);
  const closeMore = useCallback(() => {
    setMoreOpen(false);
    onMoreOpenChange?.(false);
  }, [onMoreOpenChange]);
  const handleToggleLeftMenu = useCallback(() => {
    setMoreOpen(false);
    onMoreOpenChange?.(false);
    setLeftMenuOpen((prev) => !prev);
  }, [onMoreOpenChange]);
  const closeLeftMenu = useCallback(() => {
    setLeftMenuOpen(false);
  }, []);

  return (
    <header className={`studio-top-strip fixed inset-x-0 top-0 ${(moreOpen || leftMenuOpen) ? 'z-50' : 'z-40'} flex h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-between px-1.5 pb-0 pt-[env(safe-area-inset-top)] sm:h-[calc(4rem+env(safe-area-inset-top))] sm:px-4 pl-[max(0.375rem,env(safe-area-inset-left))] pr-[max(0.375rem,env(safe-area-inset-right))] pointer-events-none select-none`}>
      {/* Top Left: Interactive Project Button & Integrated Autosave Badge */}
      <div className="pointer-events-auto studio-top-strip-left shrink inline-flex items-center gap-2 h-11 px-1 sm:px-2">
        <button
          type="button"
          onClick={handleToggleLeftMenu}
          className={`text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap truncate max-w-[150px] sm:max-w-[240px] select-none inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl transition-colors hover:bg-current/[0.06] active:bg-current/[0.1] cursor-pointer ${ink} ${
            leftMenuOpen ? (theme === 'light' ? 'bg-black/10' : 'bg-white/15') : ''
          }`}
          title={`Project: ${projectName || 'Drawing Canvas'} (Click for Project Menu)`}
          aria-expanded={leftMenuOpen}
          aria-label="Project menu"
        >
          <Box className="w-4 h-4 opacity-75 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{projectName || 'Drawing Canvas'}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
        </button>

        {/* Clear Autosave Status Badge */}
        {autoSaveStatus === 'saving' && (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/25 rounded-full px-2.5 py-0.5 select-none animate-pulse"
            aria-live="polite"
            title="Saving changes..."
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Saving...</span>
          </span>
        )}
        {(autoSaveStatus === 'saved' || autoSaveStatus === 'idle') && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5 select-none transition-opacity ${
              theme === 'light'
                ? 'text-neutral-600 bg-black/[0.04] border border-black/10'
                : 'text-neutral-300 bg-white/[0.06] border border-white/10'
            }`}
            aria-live="polite"
            title={lastSavedTime ? `All changes saved at ${lastSavedTime.toLocaleTimeString()}` : 'All changes saved'}
          >
            <Check className="h-3 w-3 text-emerald-500 shrink-0" strokeWidth={2.5} />
            <span>Saved</span>
          </span>
        )}
        {autoSaveStatus === 'error' && (
          <button
            type="button"
            onClick={onRetrySave || onOpenSessions}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-full px-2.5 py-0.5 transition-colors cursor-pointer select-none"
            aria-live="assertive"
            title="Autosave failed. Tap to retry or backup."
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>Retry save</span>
          </button>
        )}
      </div>

      {/* Top Right: Undo, Redo, and Unified Menu */}
      <nav className="flex items-center gap-0.5 sm:gap-1 pointer-events-auto shrink-0 py-0.5" aria-label="History and studio actions">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`${button} disabled:opacity-25`}
          aria-label="Undo"
          title="Undo"
        >
          <Undo2 className="w-[18px] h-[18px] sm:w-[21px] sm:h-[21px]" strokeWidth={1.7} />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`${button} disabled:opacity-25`}
          aria-label="Redo"
          title="Redo"
        >
          <Redo2 className="w-[18px] h-[18px] sm:w-[21px] sm:h-[21px]" strokeWidth={1.7} />
        </button>
        <button
          type="button"
          onClick={handleOpenMore}
          className={`${button} ${moreOpen ? (theme === 'light' ? 'bg-black/10' : 'bg-white/15') : ''}`}
          aria-label="Menu"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-controls="studio-top-more-menu"
          title="Menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.7} />
        </button>
      </nav>

      <StudioTopLeftMenu
        open={leftMenuOpen}
        theme={theme}
        onClose={closeLeftMenu}
        projectName={projectName}
        onOpenSessions={onOpenSessions}
        onOpenExport={onOpenExport}
        onClearCanvas={onClearCanvas}
        onOpenSettings={openSettings}
      />

      <StudioTopMoreMenu
        open={moreOpen}
        theme={theme}
        isFullscreen={isFsActive}
        onClose={closeMore}
        onOpenIllumination={onOpenIllumination}
        onToggleTheme={onToggleTheme}
        showGrid={showGrid}
        onToggleGrid={onToggleGrid}
        onToggleFullscreen={handleToggleFullscreen}
        isGizmoActive={isGizmoActive}
        onToggleGizmo={onToggleGizmo}
        canvasFormat={canvasFormat}
        onCanvasFormatChange={onCanvasFormatChange}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onCanvasSizeChange={onCanvasSizeChange}
        canvasTransparency={canvasTransparency}
        onCanvasTransparencyChange={onCanvasTransparencyChange}
        canvasColor={canvasColor}
        onCanvasColorChange={onCanvasColorChange}
      />
    </header>
  );
};

