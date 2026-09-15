import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useHasOnboarded, setHasOnboarded } from '../../core/onboardingStore';
import { BrushSettings } from '../../types';

interface FirstStrokeHintProps {
  brushSettings: BrushSettings;
  activeGuide?: any;
  theme?: 'light' | 'dark';
  hidden?: boolean;
}

export const FirstStrokeHint: React.FC<FirstStrokeHintProps> = ({
  brushSettings,
  activeGuide,
  theme = 'dark',
  hidden = false,
}) => {
  const hasOnboarded = useHasOnboarded();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    try {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    } catch (_) {}
  }, []);

  if (hasOnboarded || hidden) return null;

  const isLight = theme === 'light';

  // Determine drawing instruction based on placement mode
  let primaryHint = 'Drag to draw on a surface';
  if (brushSettings.stickAndAirDraw) {
    primaryHint = 'Drag to draw on a surface or into open air';
  } else if (activeGuide) {
    primaryHint = 'Drag to draw along the guide';
  } else if (brushSettings.drawingMode === 'spatial_3d') {
    primaryHint = 'Drag to draw in open air';
  } else {
    primaryHint = 'Drag to draw on a surface';
  }

  const navHint = isTouchDevice
    ? 'Two fingers to orbit view'
    : 'Right-click or drag corner navigator to orbit';

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="first-stroke-hint"
      className="pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 z-30 select-none animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl shadow-lg border backdrop-blur-md transition-all ${
          isLight
            ? 'bg-white/90 border-black/10 text-neutral-800 shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
            : 'bg-[#181a1f]/90 border-white/15 text-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
        }`}
      >
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold leading-tight tracking-tight">
            {primaryHint}
          </span>
          <span className={`text-[10px] leading-tight mt-0.5 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
            {navHint}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setHasOnboarded(true)}
          className={`pointer-events-auto min-w-[44px] min-h-[44px] w-11 h-11 ml-1 rounded-xl flex items-center justify-center transition-colors ${
            isLight
              ? 'text-neutral-400 hover:text-neutral-700 hover:bg-black/5'
              : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/10'
          }`}
          aria-label="Dismiss first-stroke hint"
          title="Dismiss hint"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
