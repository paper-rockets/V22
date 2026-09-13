import React, { useEffect } from 'react';
import { BrushSettings } from '../../types';

export interface RealBrushSizeControlProps {
  brushSettings: BrushSettings;
  onSizeChange: (newSize: number) => void;
  theme?: 'light' | 'dark';
  showHeading?: boolean;
}

export const RealBrushSizeControl: React.FC<RealBrushSizeControlProps> = ({
  brushSettings,
  onSizeChange,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const isFlat = brushSettings.profile === 'ribbon' || brushSettings.profile === 'conformal';
  const isMarker = brushSettings.profile === 'marker';
  const isGlow = brushSettings.materialType === 'glow' || (brushSettings.emissiveIntensity && brushSettings.emissiveIntensity > 0.4);
  const isPattern = Boolean(brushSettings.patternType && brushSettings.patternType !== 'none');
  const hasTexture = Boolean(brushSettings.previewUrl || brushSettings.matcapUrl);

  const usesWidthMultiplier = isFlat || isMarker;
  const widthMultiplier = usesWidthMultiplier
    ? Math.max(1, Math.min(6, brushSettings.brushWidthMultiplier ?? 1.5))
    : 1;

  const minimumWorldSize = 0.004;
  const maximumEffectiveSize = 0.12;
  const maximumWorldSize = maximumEffectiveSize / widthMultiplier;
  const normalizedWorldSize = Math.max(
    minimumWorldSize,
    Math.min(maximumWorldSize, brushSettings.size)
  );
  const effectiveSize = normalizedWorldSize * widthMultiplier;

  // Displayed 1-100 value represents the final rendered width
  const displaySizeNumber = Math.max(1, Math.min(100, Math.round(
    ((effectiveSize - minimumWorldSize) / (maximumEffectiveSize - minimumWorldSize)) * 99 + 1
  )));

  const pixelSize = Math.max(4, Math.min(64, Math.round((effectiveSize / maximumEffectiveSize) * 60 + 4)));
  const color = brushSettings.color || brushSettings.solidColor || '#38bdf8';
  const opacity = brushSettings.opacity ?? 1.0;

  // Active brush style label
  const brushDisplayName = brushSettings.activeLookName && brushSettings.activeLookName !== 'Flat Paint'
    ? brushSettings.activeLookName
    : isMarker
    ? 'Chisel Marker'
    : isFlat
    ? 'Ribbon Brush'
    : isGlow
    ? 'Neon Glow'
    : isPattern
    ? 'Pattern Texture'
    : 'Round Tube';

  const shapeBorderColor = isLight ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.3)';

  useEffect(() => {
    if (Math.abs(normalizedWorldSize - brushSettings.size) > 0.00001) {
      onSizeChange(normalizedWorldSize);
    }
  }, [brushSettings.size, normalizedWorldSize, onSizeChange]);

  return (
    <div className="flex flex-col gap-2 w-full select-none">
      {/* Live Actual Shape & Realistic Brush Texture Preview Area */}
      <div
        className={`relative w-full h-14 rounded-lg flex items-center justify-center overflow-hidden border transition-colors ${
          isLight
            ? 'bg-black/[0.03] border-black/10'
            : 'bg-white/[0.04] border-white/[0.08]'
        }`}
        title={`Active Brush: ${brushDisplayName} (${displaySizeNumber})`}
      >
        {/* Brush style name badge on the top left */}
        <span className={`absolute top-1 left-1.5 text-[9px] font-semibold tracking-tight uppercase truncate max-w-[90px] ${
          isLight ? 'text-neutral-500' : 'text-neutral-400'
        }`}>
          {brushDisplayName}
        </span>

        {/* Live size number on the top right */}
        <span className={`absolute top-1 right-1.5 text-[10px] font-mono font-bold ${
          isLight ? 'text-neutral-600' : 'text-neutral-300'
        }`}>
          {displaySizeNumber}
        </span>

        {/* Realistic Brush Stroke Shape */}
        {isFlat ? (
          /* Flat Ribbon Shape with realistic specular ribbon highlight */
          <div
            className="transition-all duration-75 ease-out shadow-xs relative overflow-hidden"
            style={{
              width: `${Math.max(10, Math.round(pixelSize * 1.6))}px`,
              height: `${Math.max(3, Math.round(pixelSize * 0.36))}px`,
              borderRadius: `${Math.max(1.5, Math.round(pixelSize * 0.18))}px`,
              backgroundColor: color,
              backgroundImage: hasTexture
                ? `url(${brushSettings.previewUrl || brushSettings.matcapUrl})`
                : 'linear-gradient(to bottom, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.22) 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: opacity,
              border: `1px solid ${shapeBorderColor}`,
              boxShadow: isGlow ? `0 0 ${Math.max(6, pixelSize * 0.4)}px ${color}` : undefined,
            }}
          />
        ) : isMarker ? (
          /* Chisel Marker: angled calligraphic stroke with sharp bevel */
          <div
            className="transition-all duration-75 ease-out shadow-xs relative overflow-hidden"
            style={{
              width: `${Math.max(10, Math.round(pixelSize * 1.5))}px`,
              height: `${Math.max(3, Math.round(pixelSize * 0.4))}px`,
              borderRadius: '1.5px',
              backgroundColor: color,
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%, rgba(0,0,0,0.2) 100%)',
              opacity: opacity,
              border: `1px solid ${shapeBorderColor}`,
              transform: 'rotate(-35deg)',
              boxShadow: isGlow ? `0 0 ${Math.max(6, pixelSize * 0.4)}px ${color}` : undefined,
            }}
          />
        ) : (
          /* 3D Round Tube / Bead Shape with realistic cylindrical depth */
          <div
            className="rounded-full transition-all duration-75 ease-out shadow-xs relative overflow-hidden shrink-0"
            style={{
              width: `${pixelSize}px`,
              height: `${pixelSize}px`,
              backgroundColor: color,
              backgroundImage: hasTexture
                ? `url(${brushSettings.previewUrl || brushSettings.matcapUrl})`
                : isGlow
                ? `radial-gradient(circle at 50% 50%, #ffffff 0%, ${color} 65%, ${color} 100%)`
                : `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5) 0%, ${color} 55%, rgba(0,0,0,0.35) 100%)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: opacity,
              border: `1px solid ${shapeBorderColor}`,
              boxShadow: isGlow
                ? `0 0 ${Math.max(8, pixelSize * 0.5)}px ${color}, 0 0 3px #ffffff`
                : undefined,
            }}
          />
        )}
      </div>

      {/* Smooth Size Slider */}
      <input
        type="range"
        min={minimumWorldSize}
        max={maximumWorldSize}
        step="0.001"
        value={normalizedWorldSize}
        onChange={(e) => onSizeChange(parseFloat(e.target.value))}
        className={`w-full h-2 rounded-full appearance-none cursor-pointer accent-sky-500 ${
          isLight ? 'bg-black/15' : 'bg-white/20'
        }`}
        aria-label="Brush size"
      />
    </div>
  );
};
