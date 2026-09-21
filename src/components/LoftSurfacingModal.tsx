import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { StudioEngine } from '../core/studioEngine';
import { LoftSurfaceConfig, NumpadTarget } from '../types';
import {
  Layers,
  Spline,
  Sliders,
  Check,
  X,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Box,
  Compass,
  Palette,
} from 'lucide-react';
import { haptics } from '../utils/haptics';

interface LoftSurfacingModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: StudioEngine | null;
  onOpenNumpad?: (target: NumpadTarget) => void;
  theme?: 'light' | 'dark';
}

export const LoftSurfacingModal: React.FC<LoftSurfacingModalProps> = ({
  isOpen,
  onClose,
  engine,
  onOpenNumpad,
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  // Curve source: 'layer' (drawn strokes) or 'preset'
  const [sourceMode, setSourceMode] = useState<'layer' | 'preset'>('layer');
  const [presetType, setPresetType] = useState<'parallel_arcs' | 's_curves' | 'wave_ribs' | 'wing'>('parallel_arcs');

  // Available curves on active layer
  const [availableCurves, setAvailableCurves] = useState<
    { id: string; name: string; points: THREE.Vector3[] }[]
  >([]);
  const [selectedCurveIds, setSelectedCurveIds] = useState<string[]>([]);

  // Surface Parameters
  const [surfaceName, setSurfaceName] = useState<string>('Lofted Surface');
  const [tension, setTension] = useState<number>(0.5);
  const [divisionsU, setDivisionsU] = useState<number>(36);
  const [divisionsV, setDivisionsV] = useState<number>(16);
  const [opacity, setOpacity] = useState<number>(0.65);
  const [wireframe, setWireframe] = useState<boolean>(true);
  const [color, setColor] = useState<string>('#38bdf8');

  const [activeLoftId, setActiveLoftId] = useState<string>('preview_loft');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Read available curves on mount or layer change
  useEffect(() => {
    if (!engine) return;
    const curves = engine.getActiveLayerCurves();
    setAvailableCurves(curves);
    if (curves.length >= 2) {
      setSelectedCurveIds(curves.slice(0, 4).map((c) => c.id));
      setSourceMode('layer');
    } else {
      setSourceMode('preset');
    }
  }, [engine, isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Generate preset curves
  const getPresetCurves = useCallback(
    (type: 'parallel_arcs' | 's_curves' | 'wave_ribs' | 'wing'): THREE.Vector3[][] => {
      if (type === 'parallel_arcs') {
        return [
          [
            new THREE.Vector3(-0.8, 0.0, -0.4),
            new THREE.Vector3(0.0, 0.5, -0.4),
            new THREE.Vector3(0.8, 0.0, -0.4),
          ],
          [
            new THREE.Vector3(-0.8, 0.0, 0.4),
            new THREE.Vector3(0.0, 0.6, 0.4),
            new THREE.Vector3(0.8, 0.0, 0.4),
          ],
        ];
      }

      if (type === 's_curves') {
        return [
          [
            new THREE.Vector3(-0.7, -0.2, -0.3),
            new THREE.Vector3(-0.2, 0.3, -0.3),
            new THREE.Vector3(0.3, -0.3, -0.3),
            new THREE.Vector3(0.7, 0.2, -0.3),
          ],
          [
            new THREE.Vector3(-0.7, -0.1, 0.3),
            new THREE.Vector3(-0.2, 0.4, 0.3),
            new THREE.Vector3(0.3, -0.2, 0.3),
            new THREE.Vector3(0.7, 0.3, 0.3),
          ],
        ];
      }

      if (type === 'wave_ribs') {
        return [
          [
            new THREE.Vector3(-0.8, 0.0, -0.5),
            new THREE.Vector3(0.0, 0.4, -0.5),
            new THREE.Vector3(0.8, 0.0, -0.5),
          ],
          [
            new THREE.Vector3(-0.7, 0.1, 0.0),
            new THREE.Vector3(0.0, 0.7, 0.0),
            new THREE.Vector3(0.7, 0.1, 0.0),
          ],
          [
            new THREE.Vector3(-0.8, 0.0, 0.5),
            new THREE.Vector3(0.0, 0.3, 0.5),
            new THREE.Vector3(0.8, 0.0, 0.5),
          ],
        ];
      }

      // Wing profile
      return [
        [
          new THREE.Vector3(-0.6, 0.0, -0.4),
          new THREE.Vector3(-0.2, 0.25, -0.4),
          new THREE.Vector3(0.6, 0.05, -0.4),
        ],
        [
          new THREE.Vector3(-0.5, 0.0, 0.0),
          new THREE.Vector3(-0.1, 0.35, 0.0),
          new THREE.Vector3(0.7, 0.08, 0.0),
        ],
        [
          new THREE.Vector3(-0.4, 0.0, 0.5),
          new THREE.Vector3(0.0, 0.2, 0.5),
          new THREE.Vector3(0.5, 0.02, 0.5),
        ],
      ];
    },
    []
  );

  // Active curves for generation
  const activeCurves = useMemo<THREE.Vector3[][]>(() => {
    if (sourceMode === 'preset') {
      return getPresetCurves(presetType);
    }
    return availableCurves
      .filter((c) => selectedCurveIds.includes(c.id))
      .map((c) => c.points);
  }, [sourceMode, presetType, availableCurves, selectedCurveIds, getPresetCurves]);

  // Update live preview in viewport whenever parameters change
  useEffect(() => {
    if (!engine || activeCurves.length < 2) return;

    engine.createLoftedSurface(activeLoftId, surfaceName, activeCurves, {
      tension,
      divisionsU,
      divisionsV,
      opacity,
      color,
      wireframe,
    });
  }, [
    engine,
    activeLoftId,
    surfaceName,
    activeCurves,
    tension,
    divisionsU,
    divisionsV,
    opacity,
    color,
    wireframe,
  ]);

  const handleToggleCurve = (id: string) => {
    haptics.trigger('light');
    setSelectedCurveIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleKeepAsGuide = () => {
    haptics.trigger('medium');
    if (!engine || activeCurves.length < 2) return;

    const finalId = `loft_${Date.now()}`;
    engine.createLoftedSurface(finalId, surfaceName, activeCurves, {
      tension,
      divisionsU,
      divisionsV,
      opacity,
      color,
      wireframe,
    });

    setFeedbackNotice('Loft surface saved as interactive snapping guide!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleBakeTo3DModel = () => {
    haptics.trigger('medium');
    if (!engine || activeCurves.length < 2) return;

    const mesh = engine.bakeLoftedSurfaceToModel(activeLoftId, surfaceName);
    if (mesh) {
      setFeedbackNotice('Surface baked permanently into 3D scene model!');
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const handleDiscard = () => {
    if (engine) {
      engine.removeLoftedSurface(activeLoftId);
    }
    onClose();
  };

  return (
    <div className="paperrocket-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Multi-Curve Lofting Engine"
        className={`pr-surface w-full max-w-lg max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col p-4 sm:p-6 rounded-3xl border shadow-2xl overflow-hidden my-auto ${
          isLight
            ? 'bg-white border-black/10 text-neutral-800'
            : 'bg-[#18191d] border-neutral-800 text-neutral-100'
        }`}
      >
        {/* Header */}
        <div
          className={`shrink-0 flex items-center justify-between pb-3 sm:pb-4 border-b ${
            isLight ? 'border-black/10' : 'border-neutral-800'
          }`}
        >
          <div className="flex items-center gap-2.5 font-semibold text-base">
            <Spline className="w-5 h-5 text-sky-400" />
            <span>Multi-Curve Loft Surface</span>
          </div>
          <button
            onClick={handleDiscard}
            aria-label="Close"
            className={`min-w-[40px] min-h-[40px] p-2 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                : 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto studio-scroll space-y-3.5 my-2 pr-1">
          {/* 1. Curve Source Selector Tabs */}
          <div className="flex rounded-xl p-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs">
            <button
              onClick={() => {
                haptics.trigger('light');
                setSourceMode('layer');
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                sourceMode === 'layer'
                  ? isLight
                    ? 'bg-white shadow text-neutral-900 font-bold'
                    : 'bg-neutral-800 shadow text-white font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Drawn Layer Curves ({availableCurves.length})
            </button>
            <button
              onClick={() => {
                haptics.trigger('light');
                setSourceMode('preset');
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                sourceMode === 'preset'
                  ? isLight
                    ? 'bg-white shadow text-neutral-900 font-bold'
                    : 'bg-neutral-800 shadow text-white font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Preset Guide Curves
            </button>
          </div>

          {/* Source = Layer Curves List */}
          {sourceMode === 'layer' ? (
            <div
              className={`p-3 rounded-2xl border ${
                isLight ? 'bg-neutral-50 border-black/10' : 'bg-neutral-950/40 border-neutral-800'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Select Curves to Bridge (Min 2)
              </span>

              {availableCurves.length < 2 ? (
                <div className="mt-2 text-xs text-amber-500 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  You need at least 2 strokes drawn on the active layer to loft. Draw another curve with the brush, or switch to the &ldquo;Preset Guide Curves&rdquo; tab above!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 mt-2 max-h-36 overflow-y-auto pr-0.5">
                  {availableCurves.map((curve) => {
                    const isSelected = selectedCurveIds.includes(curve.id);
                    return (
                      <button
                        key={curve.id}
                        onClick={() => handleToggleCurve(curve.id)}
                        className={`p-2 rounded-xl text-left border flex items-center justify-between text-xs transition-all ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-500/40 text-sky-400 font-semibold'
                            : isLight
                            ? 'bg-white border-black/10 text-neutral-700 hover:bg-neutral-100'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <span className="truncate">{curve.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Source = Presets */
            <div
              className={`p-3 rounded-2xl border ${
                isLight ? 'bg-neutral-50 border-black/10' : 'bg-neutral-950/40 border-neutral-800'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Choose Preset Topology
              </span>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {[
                  { id: 'parallel_arcs', label: 'Parallel Arcs (2 Curves)' },
                  { id: 's_curves', label: 'Double S-Curves (2 Curves)' },
                  { id: 'wave_ribs', label: 'Wave Ribs (3 Curves)' },
                  { id: 'wing', label: 'Aerodynamic Wing (3 Curves)' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      haptics.trigger('light');
                      setPresetType(p.id as any);
                    }}
                    className={`p-2.5 rounded-xl text-left border text-xs font-medium transition-all ${
                      presetType === p.id
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-400 font-bold'
                        : isLight
                        ? 'bg-white border-black/10 text-neutral-700 hover:bg-neutral-100'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Catmull-Rom Tension Slider */}
          <div
            className={`p-3 rounded-2xl border space-y-2 ${
              isLight ? 'bg-neutral-50 border-black/10' : 'bg-neutral-950/40 border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Spline Tension (Curvature)</span>
              <button
                onClick={() => {
                  if (onOpenNumpad) {
                    onOpenNumpad({
                      title: 'Spline Tension',
                      value: Math.round(tension * 100),
                      min: 0,
                      max: 100,
                      step: 5,
                      unit: '%',
                      onChange: (val) => setTension(val / 100),
                      onConfirm: (val) => setTension(val / 100),
                    });
                  }
                }}
                className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  isLight ? 'bg-white border-black/10 text-neutral-800' : 'bg-neutral-900 border-neutral-700 text-sky-400'
                }`}
              >
                {Math.round(tension * 100)}%
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={tension}
              onChange={(e) => setTension(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
              <span>0% (Smooth Uniform)</span>
              <span>50% (Centripetal)</span>
              <span>100% (Tight Chordal)</span>
            </div>
          </div>

          {/* 3. Divisions U & V Sliders */}
          <div
            className={`p-3 rounded-2xl border space-y-3 ${
              isLight ? 'bg-neutral-50 border-black/10' : 'bg-neutral-950/40 border-neutral-800'
            }`}
          >
            {/* Length resolution (along curve) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Curve Resolution (Length)</span>
                <span className="text-[11px] font-mono text-neutral-400">{divisionsU} segs</span>
              </div>
              <input
                type="range"
                min="12"
                max="96"
                step="4"
                value={divisionsU}
                onChange={(e) => setDivisionsU(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Cross resolution (across curves) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Skin Resolution (Cross)</span>
                <span className="text-[11px] font-mono text-neutral-400">{divisionsV} segs</span>
              </div>
              <input
                type="range"
                min="4"
                max="48"
                step="2"
                value={divisionsV}
                onChange={(e) => setDivisionsV(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          </div>

          {/* 4. Visual Appearance (Opacity, Wireframe, Palette) */}
          <div
            className={`p-3 rounded-2xl border space-y-2.5 ${
              isLight ? 'bg-neutral-50 border-black/10' : 'bg-neutral-950/40 border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Surface Opacity</span>
              <span className="text-[11px] font-mono text-neutral-400">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium">Show Wireframe Edges</span>
              <button
                onClick={() => setWireframe(!wireframe)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  wireframe
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                    : isLight
                    ? 'bg-neutral-200 text-neutral-600 border-neutral-300'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {wireframe ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Quick Color Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-medium text-neutral-400">Color:</span>
              {['#38bdf8', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#e2e8f0'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    color === c ? 'scale-125 border-white ring-2 ring-sky-400' : 'border-black/20'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Feedback Notice */}
        {feedbackNotice && (
          <div className="my-2 p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-sky-400" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div
          className={`shrink-0 pt-3 sm:pt-4 border-t flex flex-col sm:flex-row gap-2 ${
            isLight ? 'border-black/10' : 'border-neutral-800'
          }`}
        >
          <button
            disabled={activeCurves.length < 2}
            onClick={handleKeepAsGuide}
            className="flex-1 py-2.5 px-3 rounded-xl border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 active:scale-95 disabled:opacity-40 text-sky-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Keep as Snapping Guide</span>
          </button>

          <button
            disabled={activeCurves.length < 2}
            onClick={handleBakeTo3DModel}
            className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-sky-900/30 transition-all cursor-pointer"
          >
            <Box className="w-4 h-4" />
            <span>Bake into 3D Model</span>
          </button>
        </div>
      </div>
    </div>
  );
};
