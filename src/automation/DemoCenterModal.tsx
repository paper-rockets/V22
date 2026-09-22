import React, { useState } from 'react';
import { Play, X, Monitor, Tablet, Smartphone, Sparkles, CheckCircle2, Maximize2 } from 'lucide-react';
import { DemoScene, DeviceTarget, DemoCategory } from './types';
import { ALL_DEMOS, HERO_DEMO, CANONICAL_DEMOS } from './demos';

interface DemoCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayScene: (scene: DemoScene, target: DeviceTarget) => void;
  currentDeviceTarget: DeviceTarget;
  onDeviceTargetChange: (target: DeviceTarget) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const CATEGORIES: DemoCategory[] = ['Learn', 'Draw', 'Control', 'Build', 'Present', 'Export'];

export const DemoCenterModal: React.FC<DemoCenterModalProps> = ({
  isOpen,
  onClose,
  onPlayScene,
  currentDeviceTarget,
  onDeviceTargetChange,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DemoCategory | 'All'>('All');

  if (!isOpen) return null;

  const filteredDemos =
    selectedCategory === 'All'
      ? CANONICAL_DEMOS
      : CANONICAL_DEMOS.filter((d) => d.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[85vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-200">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Interactive AI Demonstrations</h2>
              <p className="text-[11px] text-neutral-400">
                20 canonical task-based actions showing real 3D studio workflows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              aria-label="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Device Mode Switcher */}
        <div className="px-5 py-2.5 bg-neutral-950/60 border-b border-neutral-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-neutral-400 font-medium">Demonstration Device Target:</span>
          <div className="flex items-center gap-1 bg-neutral-800/80 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => onDeviceTargetChange('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                currentDeviceTarget === 'desktop'
                  ? 'bg-blue-600 text-white shadow-sm font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC</span>
            </button>
            <button
              type="button"
              onClick={() => onDeviceTargetChange('tablet')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                currentDeviceTarget === 'tablet'
                  ? 'bg-blue-600 text-white shadow-sm font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => onDeviceTargetChange('phone')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                currentDeviceTarget === 'phone'
                  ? 'bg-blue-600 text-white shadow-sm font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone</span>
            </button>
          </div>
        </div>

        {/* Hero Continuous Workflow Spotlight */}
        <div className="p-4 mx-5 mt-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-neutral-800/50 to-neutral-800/30 border border-blue-500/20 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Hero Flow
              </span>
              <h3 className="text-xs font-semibold text-white">{HERO_DEMO.title}</h3>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed max-w-md">
              Continuous creation: Blank project → Mannequin → Surface sketch → Spatial curves → Neon accent → Lighting → 3D Orbit.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onPlayScene(HERO_DEMO, currentDeviceTarget);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Hero</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-2 overflow-x-auto text-xs shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-neutral-800 text-white font-medium'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All (20)
          </button>
          {CATEGORIES.map((cat) => {
            const count = CANONICAL_DEMOS.filter((d) => d.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] text-neutral-500">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Actions List */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2">
          {filteredDemos.map((demo) => (
            <div
              key={demo.id}
              onClick={() => {
                onClose();
                onPlayScene(demo, currentDeviceTarget);
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/40 hover:bg-neutral-800/80 border border-neutral-800 transition-colors gap-3 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-400 font-mono text-[11px] flex items-center justify-center shrink-0">
                  {demo.number}
                </span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-neutral-200 truncate">
                      {demo.title}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/50">
                      {demo.featureTaught}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {demo.goal}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPlayScene(demo, currentDeviceTarget);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-700/70 hover:bg-blue-600 text-neutral-200 hover:text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                title={`Play Demonstration ${demo.number}: ${demo.title}`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Play</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="px-5 py-2.5 border-t border-neutral-800 bg-neutral-950/40 text-[11px] text-neutral-500 flex items-center justify-between">
          <span>Semantic action layer translates coordinates for PC, Tablet, and Phone</span>
          <span className="text-neutral-400">Full screen enabled</span>
        </footer>
      </div>
    </div>
  );
};
