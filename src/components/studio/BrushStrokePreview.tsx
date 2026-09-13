import React from 'react';

interface BrushStrokePreviewProps {
  brushId: string;
  className?: string;
}

export const BrushStrokePreview: React.FC<BrushStrokePreviewProps> = ({ brushId, className = '' }) => {
  const isSurface = brushId === 'conformal_bead' || brushId === 'terrazzo_fleck';
  const isRound = brushId === 'spatial_pipe';
  const isMarker = brushId === 'chisel_marker';
  const isFine = brushId === 'drafting_wire';
  const isGlow = brushId === 'neon_cable';
  const isTexture = ['halftone_dot', 'stipple_texture', 'line_hatch', 'crosshatch', 'terrazzo_fleck'].includes(brushId);

  return (
    <svg
      viewBox="0 0 120 36"
      preserveAspectRatio="none"
      className={`h-9 w-full overflow-visible text-current ${className}`}
      aria-hidden="true"
    >
      {isSurface ? (
        <>
          <path d="M4 27 Q60 38 116 27" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity=".32" />
          <path d="M5 22 Q60 5 115 22" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity=".16" />
          <path d="M5 22 Q60 5 115 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </>
      ) : isRound ? (
        <>
          <path d="M5 25 C28 7 54 31 115 10" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" opacity=".18" />
          <path d="M5 25 C28 7 54 31 115 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : isMarker ? (
        <path d="M5 29 L18 14 C45 19 72 8 115 6 L108 20 C72 23 42 31 5 29 Z" fill="currentColor" opacity=".82" />
      ) : isFine ? (
        <path d="M4 25 C31 8 58 30 116 9" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      ) : isGlow ? (
        <>
          <path d="M4 25 C31 7 61 31 116 9" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" opacity=".12" />
          <path d="M4 25 C31 7 61 31 116 9" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity=".35" />
          <path d="M4 25 C31 7 61 31 116 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <path d="M4 27 C28 5 56 31 116 8 L112 17 C58 34 31 14 4 30 Z" fill="currentColor" opacity=".78" />
      )}
      {isTexture && (
        <g fill="currentColor" opacity=".7">
          <circle cx="42" cy="17" r="1.2" /><circle cx="50" cy="13" r="1" /><circle cx="58" cy="18" r="1.2" />
          <circle cx="67" cy="13" r="1" /><circle cx="76" cy="16" r="1.2" />
        </g>
      )}
    </svg>
  );
};
