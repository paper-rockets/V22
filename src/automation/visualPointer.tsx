import React, { useEffect, useState } from 'react';
import { PointerVisualState, DeviceTarget } from './types';

interface VisualPointerProps {
  state: PointerVisualState;
  deviceTarget: DeviceTarget;
}

export const VisualPointer: React.FC<VisualPointerProps> = ({ state, deviceTarget }) => {
  const [trail, setTrail] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (state.isDragging && state.pointerType === 'mouse') {
      setTrail({ x: state.x, y: state.y });
      const timer = setTimeout(() => setTrail(null), 180);
      return () => clearTimeout(timer);
    } else {
      setTrail(null);
    }
  }, [state.x, state.y, state.isDragging, state.pointerType]);

  if (!state.visible) return null;

  const isDesktop = deviceTarget === 'desktop' && state.pointerType === 'mouse';
  const isPhone = deviceTarget === 'phone';

  // Determine callout positioning to never obscure the cursor/touch
  const calloutAbove = state.y > 180;
  const calloutStyle: React.CSSProperties = {
    position: 'absolute',
    left: Math.max(16, Math.min(window.innerWidth - 300, state.x - 140)),
    top: calloutAbove ? Math.max(16, state.y - 74) : state.y + 36,
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[100000] select-none overflow-hidden">
      {/* 1. Subtle Click Ripple */}
      {state.ripple && (
        <div
          key={`ripple-${state.rippleKey}`}
          className="absolute rounded-full border border-white/60 bg-white/10 animate-ping pointer-events-none"
          style={{
            width: isPhone ? 38 : isDesktop ? 26 : 30,
            height: isPhone ? 38 : isDesktop ? 26 : 30,
            left: state.x - (isPhone ? 19 : isDesktop ? 13 : 15),
            top: state.y - (isPhone ? 19 : isDesktop ? 13 : 15),
            animationDuration: '450ms',
          }}
        />
      )}

      {/* 2. Drag Trailing Dot (Desktop only) */}
      {isDesktop && state.isDragging && trail && (
        <div
          className="absolute w-1.5 h-1.5 rounded-full bg-white/40 transition-opacity duration-200 pointer-events-none"
          style={{
            left: trail.x - 3,
            top: trail.y - 3,
          }}
        />
      )}

      {/* 3. Primary Pointer: Desktop Mouse Cursor or Mobile/Tablet Touch Dot */}
      {isDesktop ? (
        // Neutral clean desktop mouse cursor
        <div
          className="absolute transition-transform duration-75 ease-out pointer-events-none filter drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
          style={{
            left: state.x,
            top: state.y,
            transform: state.isDown ? 'scale(0.92)' : 'scale(1)',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z"
              fill="rgba(255, 255, 255, 0.85)"
              stroke="rgba(0, 0, 0, 0.75)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        // Touch Contact Dot (Tablet / Phone)
        <div
          className="absolute rounded-full pointer-events-none transition-transform duration-100 flex items-center justify-center"
          style={{
            width: isPhone ? 32 : 24,
            height: isPhone ? 32 : 24,
            left: state.x - (isPhone ? 16 : 12),
            top: state.y - (isPhone ? 16 : 12),
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            border: '1.5px solid rgba(255, 255, 255, 0.65)',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.35)',
            transform: state.isDown ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          <div
            className="rounded-full bg-white/70"
            style={{
              width: isPhone ? 10 : 8,
              height: isPhone ? 10 : 8,
            }}
          />
        </div>
      )}

      {/* 4. Secondary Touch Point (Pinch / Orbit contact point) */}
      {state.secondaryTouch && (
        <div
          className="absolute rounded-full pointer-events-none flex items-center justify-center"
          style={{
            width: isPhone ? 28 : 22,
            height: isPhone ? 28 : 22,
            left: state.secondaryTouch.x - (isPhone ? 14 : 11),
            top: state.secondaryTouch.y - (isPhone ? 14 : 11),
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            border: '1.5px solid rgba(255, 255, 255, 0.55)',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-white/60" />
        </div>
      )}

      {/* 5. Minimal Conceptual Callout (No noisy text, only key concept) */}
      {state.callout && (
        <div
          style={calloutStyle}
          className="pointer-events-none animate-fade-in bg-neutral-900/90 backdrop-blur-md text-neutral-100 px-4 py-2.5 rounded-xl border border-neutral-700/60 shadow-xl max-w-xs flex flex-col gap-0.5"
        >
          <div className="text-xs font-semibold text-white tracking-wide">
            {state.callout.title}
          </div>
          {state.callout.subtitle && (
            <div className="text-[11px] text-neutral-300 leading-snug">
              {state.callout.subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
