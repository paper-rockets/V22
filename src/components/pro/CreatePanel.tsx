import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Square, User, Spline } from 'lucide-react';
import {
  IcCube as Box,
  IcSphere as Circle,
  IcCylinder as Cylinder,
  IcTorus as Orbit,
  IcCapsule as Disc3,
  IcCone as Cone,
  IcPyramid as Triangle,
  IcDisk as Disc,
  IcPlane,
  IcModelLibrary as FolderOpen,
  IcImport as Upload,
  IcPalette as Palette,
  IcOrigin as Crosshair,
} from './StudioIcons';
import { StudioEngine } from '../../core/studioEngine';
import { SampleModelFactory } from '../../core/sampleModels';
import { ModelDisplayMode } from '../../types';
import { haptics } from '../../utils/haptics';

interface CreatePanelProps {
  engine: StudioEngine | null;
  activeModelName?: string;
  modelDisplayMode: ModelDisplayMode;
  onSetModelDisplayMode: (mode: ModelDisplayMode) => void;
  onOpenModelLibrary: () => void;
  onOpenImporter: () => void;
  onOpenScaffolding?: () => void;
  onOpenBentGuide?: () => void;
  onShapeSpawned?: (shapeName: string) => void;
  theme?: 'light' | 'dark';
}

interface PrimitiveDef {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  factory: () => any;
}

const PRIMITIVES: PrimitiveDef[] = [
  { id: 'cube', name: 'Cube', icon: Box, factory: SampleModelFactory.createCube },
  { id: 'sphere', name: 'Sphere', icon: Circle, factory: SampleModelFactory.createSphere },
  { id: 'cylinder', name: 'Cylinder', icon: Cylinder, factory: SampleModelFactory.createCylinder },
  { id: 'plane', name: 'Plane', icon: IcPlane, factory: SampleModelFactory.createDrawingPlane },
];

export const CreatePanel: React.FC<CreatePanelProps> = ({
  engine,
  activeModelName = 'Default Model',
  modelDisplayMode,
  onSetModelDisplayMode,
  onOpenModelLibrary,
  onOpenImporter,
  onOpenScaffolding,
  onOpenBentGuide,
  onShapeSpawned,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [spawnNotice, setSpawnNotice] = useState<string | null>(null);
  const [showMoreWays, setShowMoreWays] = useState<boolean>(false);

  const handleSpawn = (p: PrimitiveDef) => {
    haptics.trigger('medium');
    if (!engine) return;
    const mesh = p.factory();
    if (mesh) {
      engine.addPrimitiveToScene(mesh, `Primitive ${p.name}`);
      setSpawnNotice(`Added ${p.name} · Move controls ready`);
      setTimeout(() => setSpawnNotice(null), 2400);
      onShapeSpawned?.(p.name);
    }
  };

  const cardClass = isLight
    ? 'p-2.5 rounded-xl bg-neutral-100/50 border border-black/5 space-y-1.5'
    : 'p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5';

  const subHeadingClass = `text-[10px] font-bold uppercase tracking-wider ${
    isLight ? 'text-neutral-500' : 'text-neutral-400'
  }`;

  return (
    <div className="space-y-2 text-xs select-none">
      {/* 1. 3D SHAPES / PRIMITIVES (Primary choices) */}
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div className={subHeadingClass}>3D Shapes</div>
          {spawnNotice && (
            <span className="text-[10px] font-semibold text-emerald-500 animate-in fade-in duration-100">
              {spawnNotice}
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {PRIMITIVES.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSpawn(p)}
                className={`h-12 min-h-[44px] p-1 rounded-lg border flex flex-col items-center justify-center gap-1 transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-95 ${
                  isLight
                    ? 'bg-white border-black/10 hover:bg-neutral-200/50 text-neutral-800'
                    : 'bg-black/30 border-white/10 hover:bg-white/10 text-neutral-200'
                }`}
                title={`Spawn ${p.name}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium leading-none">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PROGRESSIVE DISCLOSURE: MORE WAYS TO ADD */}
      <button
        type="button"
        onClick={() => {
          haptics.trigger('light');
          setShowMoreWays(!showMoreWays);
        }}
        className={`w-full min-h-[44px] px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-semibold transition-colors duration-150 ease-out ${
          isLight
            ? 'bg-neutral-100/70 border-black/10 hover:bg-neutral-200/70 text-neutral-800'
            : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-neutral-200'
        }`}
        aria-expanded={showMoreWays}
      >
        <span className="flex items-center gap-1.5">
          {showMoreWays ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span>More ways to add</span>
        </span>
        <span className="text-[10px] opacity-60 font-normal">Mannequins & 3D models</span>
      </button>

      {showMoreWays && (
        <div className="space-y-2 animate-in fade-in duration-150">
          {/* DRAWING GUIDES & MANNEQUINS */}
          {(onOpenScaffolding || onOpenBentGuide) && (
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <div className={subHeadingClass}>Drawing Guides & Mannequins</div>
                <span className="text-[10px] opacity-65 font-medium">Snap & Sketch</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                {onOpenScaffolding && (
                  <button
                    type="button"
                    onClick={() => {
                      haptics.trigger('light');
                      onOpenScaffolding();
                    }}
                    className={`h-12 min-h-[44px] px-2.5 py-1 rounded-lg border flex items-center gap-2 font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98] ${
                      isLight
                        ? 'bg-white border-black/10 hover:bg-neutral-200/50 text-neutral-900 shadow-xs'
                        : 'bg-black/30 border-white/10 hover:bg-white/10 text-neutral-100 shadow-xs'
                    }`}
                    title="Open 3D Mannequins (Human figure, head cage, car, limb guides)"
                  >
                    <User className="w-4 h-4 shrink-0 text-sky-400" />
                    <div className="flex flex-col text-left leading-tight overflow-hidden">
                      <span className="text-xs font-semibold truncate">Mannequins</span>
                      <span className="text-[9.5px] opacity-65 truncate">Figures & forms</span>
                    </div>
                  </button>
                )}

                {onOpenBentGuide && (
                  <button
                    type="button"
                    onClick={() => {
                      haptics.trigger('light');
                      onOpenBentGuide();
                    }}
                    className={`h-12 min-h-[44px] px-2.5 py-1 rounded-lg border flex items-center gap-2 font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98] ${
                      isLight
                        ? 'bg-white border-black/10 hover:bg-neutral-200/50 text-neutral-900 shadow-xs'
                        : 'bg-black/30 border-white/10 hover:bg-white/10 text-neutral-100 shadow-xs'
                    }`}
                    title="Open Bend Path & Curved Guide"
                  >
                    <Spline className="w-4 h-4 shrink-0 text-teal-400" />
                    <div className="flex flex-col text-left leading-tight overflow-hidden">
                      <span className="text-xs font-semibold truncate">Bend Path</span>
                      <span className="text-[9.5px] opacity-65 truncate">Curved guides</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3D MODELS & IMPORT */}
          <div className={cardClass}>
            <div className={subHeadingClass}>3D Models</div>

            <div className="space-y-1.5">
              {/* Open Model Library Button */}
              <button
                type="button"
                onClick={() => {
                  haptics.trigger('light');
                  onOpenModelLibrary();
                }}
                className={`w-full min-h-[44px] px-3 py-2 rounded-lg border flex items-center justify-between font-medium transition-colors duration-150 ease-out ${
                  isLight
                    ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                    : 'bg-white border-white text-neutral-950 font-bold shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  <span className="text-xs">Browse Model Library</span>
                </div>
                <span className="text-[10px] opacity-75 truncate max-w-[120px]">{activeModelName}</span>
              </button>

              {/* Import 3D File Button */}
              <button
                type="button"
                onClick={() => {
                  haptics.trigger('light');
                  onOpenImporter();
                }}
                className={`w-full min-h-[44px] px-3 py-2 rounded-lg border flex items-center justify-between font-medium transition-colors duration-150 ease-out ${
                  isLight
                    ? 'bg-white border-black/10 hover:bg-neutral-200/50 text-neutral-800'
                    : 'bg-black/30 border-white/10 hover:bg-white/10 text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="text-xs">Import 3D Model File</span>
                </div>
                <span className="text-[10px] opacity-60 font-mono">GLB, OBJ, STL</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
