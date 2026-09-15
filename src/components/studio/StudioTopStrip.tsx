import React, { useState, useEffect, useCallback } from 'react';
import {
  Redo2,
  Settings,
  Undo2,
  Box,
  Sun,
} from 'lucide-react';
import { toggleSheet } from './panelStore';
import { StudioTopMoreMenu } from './StudioTopMoreMenu';
import { AutoSaveStatus } from '../AutoSaveToast';

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
    setMoreOpen(true);
  }, []);
  const closeMore = useCallback(() => {
    setMoreOpen(false);
  }, []);

  return (
    <header className={`studio-top-strip fixed inset-x-0 top-0 ${moreOpen ? 'z-50' : 'z-30'} flex h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-between px-1.5 pb-0 pt-[env(safe-area-inset-top)] sm:h-[calc(4rem+env(safe-area-inset-top))] sm:px-4 pl-[max(0.375rem,env(safe-area-inset-left))] pr-[max(0.375rem,env(safe-area-inset-right))] pointer-events-none select-none`}>
      <div className="pointer-events-auto studio-top-strip-left shrink inline-flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={onOpenSessions}
          className={`inline-flex items-center gap-1.5 sm:gap-2 h-11 min-h-[44px] min-w-[44px] px-2.5 sm:px-3 rounded-xl transition-colors hover:bg-current/[0.045] active:bg-current/[0.075] ${ink}`}
          aria-label="Open projects"
        >
          <Box className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={1.7} />
          <span className="text-[11px] sm:text-[13px] font-medium tracking-[0.01em] whitespace-nowrap truncate max-w-[70px] sm:max-w-[160px]">
            {projectName || 'Model'}
          </span>
        </button>

        {/* Quiet Save Status Indicator */}
        {autoSaveStatus === 'saving' && (
          <span
            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-neutral-400 select-none px-1.5 py-0.5"
            aria-live="polite"
            title="Saving changes..."
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="hidden xs:inline">Saving</span>
          </span>
        )}
        {(autoSaveStatus === 'saved' || autoSaveStatus === 'idle') && (
          <span
            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-neutral-400/80 dark:text-neutral-500 select-none px-1.5 py-0.5"
            aria-live="polite"
            title={lastSavedTime ? `Saved at ${lastSavedTime.toLocaleTimeString()}` : 'Saved'}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
            <span className="hidden xs:inline">Saved</span>
          </span>
        )}
        {autoSaveStatus === 'error' && (
          <button
            type="button"
            onClick={onRetrySave || onOpenSessions}
            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg px-2 py-0.5 transition-colors cursor-pointer select-none"
            aria-live="assertive"
            title="Autosave failed. Tap to retry or backup."
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>Retry save</span>
          </button>
        )}
      </div>
      <nav className="flex items-center gap-0.5 sm:gap-1.5 pointer-events-auto shrink-0 py-0.5 overflow-x-auto no-scrollbar" aria-label="History and studio actions">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`${button} disabled:opacity-25`}
          aria-label="Undo"
        >
          <Undo2 className="w-[18px] h-[18px] sm:w-[21px] sm:h-[21px]" strokeWidth={1.7} />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`${button} disabled:opacity-25`}
          aria-label="Redo"
        >
          <Redo2 className="w-[18px] h-[18px] sm:w-[21px] sm:h-[21px]" strokeWidth={1.7} />
        </button>
        {onOpenIllumination && (
          <button
            type="button"
            onClick={onOpenIllumination}
            className={`${button} flex text-amber-400 hover:text-amber-300`}
            aria-label="Studio Illumination"
            title="Studio Illumination"
          >
            <Sun className="w-[18px] h-[18px] sm:w-[21px] sm:h-[21px]" strokeWidth={1.7} />
          </button>
        )}
        <button
          type="button"
          onClick={handleOpenMore}
          className={`${button}`}
          aria-label="Settings and more"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-controls="studio-top-more-menu"
        >
          <Settings className="h-5 w-5" strokeWidth={1.6} />
        </button>
      </nav>
      <StudioTopMoreMenu
        open={moreOpen}
        theme={theme}
        isFullscreen={isFsActive}
        onClose={closeMore}
        onOpenSessions={onOpenSessions}
        onOpenSettings={openSettings}
        onToggleFullscreen={handleToggleFullscreen}
      />
    </header>
  );
};

