import React from 'react';
import { StrokeProfile, MaterialType } from '../../types';

export interface BrushShapeGlyphProps {
  brushId?: string;
  profile?: StrokeProfile;
  materialType?: MaterialType;
  patternType?: string;
  /** World size, e.g. 0.015 to 0.14 */
  size?: number;
  color?: string;
  theme?: 'light' | 'dark';
  /** Bounding box width and height in px (default: 44) */
  boxSize?: number;
  className?: string;
}

const PROFILE_BY_BRUSH: Record<string, StrokeProfile> = {
  streamline_ink: 'ribbon',
  spatial_pipe: 'tube',
  drafting_wire: 'ribbon',
  neon_cable: 'ribbon',
  chisel_marker: 'marker',
  conformal_bead: 'conformal',
  terrazzo_fleck: 'conformal',
  matte_clay: 'conformal',
};

const PATTERN_BRUSHES = new Set(['halftone_dot', 'stipple_texture', 'line_hatch', 'crosshatch', 'terrazzo_fleck']);

export const BrushShapeGlyph: React.FC<BrushShapeGlyphProps> = ({
  brushId = 'clay',
  profile,
  materialType,
  patternType,
  boxSize = 44,
  className = '',
}) => {
  const resolvedProfile = profile || PROFILE_BY_BRUSH[brushId] || 'ribbon';
  const isGlow = materialType === 'glow' || brushId === 'neon_cable';
  const isFinePen = brushId === 'drafting_wire';
  const isCutout = materialType === 'cutout' || brushId === 'mask_cutout';
  const showPattern = patternType !== 'none' && (Boolean(patternType) || PATTERN_BRUSHES.has(brushId));

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none text-current ${className}`}
      style={{ width: boxSize, height: boxSize }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="h-full w-full fill-none stroke-current" role="presentation">
        {/* 1. Neon Glow Ribbon */}
        {isGlow && (
          <>
            {/* Outer radiant halo */}
            <path d="M6 26 C 14 10, 24 30, 34 13" strokeWidth="6" strokeLinecap="round" opacity="0.25" />
            {/* Mid bloom */}
            <path d="M6 26 C 14 10, 24 30, 34 13" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            {/* Bright inner core */}
            <path d="M6 26 C 14 10, 24 30, 34 13" strokeWidth="1.5" strokeLinecap="round" />
            {/* Luminous glint at the tip */}
            <circle cx="34" cy="13" r="2.5" fill="currentColor" stroke="none" opacity="0.9" />
          </>
        )}

        {/* 2. Fine Pen / Technical Line */}
        {!isGlow && isFinePen && (
          <>
            <path d="M7 27 C 15 12, 23 29, 33 13" strokeWidth="1.2" strokeLinecap="round" />
            {/* Pen nib accent */}
            <circle cx="33" cy="13" r="1.2" fill="currentColor" stroke="none" />
          </>
        )}

        {/* 3. Flat Ribbon (Primary Creative Brush) */}
        {!isGlow && !isFinePen && resolvedProfile === 'ribbon' && (
          <>
            {/* Smooth calligraphic ribbon stroke that turns and tapers */}
            <path
              d="M5 28 C 12 10, 23 32, 35 12 C 28 26, 17 14, 5 28 Z"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="currentColor"
              fillOpacity="0.18"
            />
          </>
        )}

        {/* 4. Chisel Marker */}
        {!isGlow && resolvedProfile === 'marker' && (
          <>
            {/* Angled marker stroke with crisp flat chisel cut ends */}
            <path
              d="M7 29 L 26 10 L 33 14 L 14 33 Z"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="currentColor"
              fillOpacity="0.2"
            />
            {/* Chisel tip edge highlight */}
            <line x1="26" y1="10" x2="33" y2="14" strokeWidth="2.2" strokeLinecap="square" />
            <line x1="7" y1="29" x2="14" y2="33" strokeWidth="2.2" strokeLinecap="square" />
          </>
        )}

        {/* 5. Surface Decal / Conformal */}
        {!isGlow && resolvedProfile === 'conformal' && (
          <>
            {/* Surface curvature reference line */}
            <path d="M4 31 Q 20 27, 36 31" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2.5 2.5" opacity="0.4" />
            {/* Conformal bead paint draping over surface */}
            <path d="M6 25 C 14 15, 26 15, 34 25" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.2" />
            <path d="M6 25 C 14 15, 26 15, 34 25" strokeWidth="1.6" strokeLinecap="round" />
          </>
        )}

        {/* 6. 3D Tube (Clean round stroke without confusing hollow pipe ring) */}
        {!isGlow && !isFinePen && resolvedProfile === 'tube' && (
          <>
            <path d="M6 26 C 14 11, 24 30, 34 14" strokeWidth="5" strokeLinecap="round" opacity="0.18" />
            <path d="M6 26 C 14 11, 24 30, 34 14" strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}

        {/* 7. Stencil / Cutout Mask */}
        {isCutout && (
          <path d="M6 26 C 14 10, 24 30, 34 13" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" opacity="0.8" />
        )}

        {/* Pattern Texture Overlay (dots, stipple, hatch) */}
        {showPattern && (
          <>
            <circle cx="12" cy="14" r="1.3" fill="currentColor" stroke="none" opacity="0.8" />
            <circle cx="19" cy="10" r="1.3" fill="currentColor" stroke="none" opacity="0.8" />
            <circle cx="27" cy="13" r="1.3" fill="currentColor" stroke="none" opacity="0.8" />
          </>
        )}
      </svg>
    </div>
  );
};
