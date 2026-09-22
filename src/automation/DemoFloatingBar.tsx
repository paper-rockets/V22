import React from 'react';
import { Play, Pause, SkipForward, Square, Maximize2, Minimize2 } from 'lucide-react';

interface DemoFloatingBarProps {
  title: string;
  stepText: string;
  isPaused: boolean;
  onTogglePause: () => void;
  onSkip: () => void;
  onStop: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const DemoFloatingBar: React.FC<DemoFloatingBarProps> = ({
  title,
  stepText,
  isPaused,
  onTogglePause,
  onSkip,
  onStop,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100001] pointer-events-auto select-none">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 shadow-2xl text-neutral-200">
        <div className="flex flex-col pr-2 border-r border-neutral-700/70 max-w-[160px] sm:max-w-[240px]">
          <span className="text-[11px] font-semibold text-white truncate">{title}</span>
          <span className="text-[9px] text-neutral-400 truncate font-mono">{stepText}</span>
        </div>

        {/* Pause / Resume */}
        <button
          type="button"
          onClick={onTogglePause}
          className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          title={isPaused ? 'Resume' : 'Pause'}
          aria-label={isPaused ? 'Resume demonstration' : 'Pause demonstration'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        {/* Skip Step */}
        <button
          type="button"
          onClick={onSkip}
          className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          title="Skip to next step"
          aria-label="Skip to next step"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen toggle (Mobile & Tablet friendly) */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          title={isFullscreen ? 'Exit Full Screen' : 'Go Full Screen'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Stop / Exit */}
        <button
          type="button"
          onClick={onStop}
          className="p-1.5 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors ml-1"
          title="Exit Demonstration"
          aria-label="Stop and exit demonstration"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
};
