import React, { useState, useEffect } from 'react';
import { StudioEngine } from '../core/studioEngine';
import { ARSessionState } from '../types';
import { getThemeClasses } from '../utils/themeStyles';
import {
  Glasses,
  X,
  Maximize2,
  Minimize2,
  MoveVertical,
  CheckCircle2,
  AlertCircle,
  Info,
  Layers,
  Compass,
} from 'lucide-react';

interface ARViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: StudioEngine | null;
  theme?: 'light' | 'dark';
}

export const ARViewerModal: React.FC<ARViewerModalProps> = ({
  isOpen,
  onClose,
  engine,
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const t = getThemeClasses(theme);
  const isLight = theme === 'light';

  const [arState, setArState] = useState<ARSessionState>({
    isSupported: false,
    isActive: false,
    hasHitTest: false,
    elevation: 0.0,
    scale: 1.0,
  });
  const [statusMsg, setStatusMsg] = useState<string>('Checking WebXR capabilities...');
  const [elevation, setElevation] = useState<number>(0.0);
  const [isSimulatedAR, setIsSimulatedAR] = useState<boolean>(false);

  useEffect(() => {
    const checkXR = async () => {
      if (typeof navigator !== 'undefined' && 'xr' in navigator && (navigator as any).xr) {
        try {
          const supported = await (navigator as any).xr.isSessionSupported('immersive-ar');
          setArState((prev) => ({ ...prev, isSupported: supported }));
          if (supported) {
            setStatusMsg('WebXR Ready: Surface placement enabled');
          } else {
            setStatusMsg("Full AR isn't available on this device. Preview mode is available.");
          }
        } catch (e) {
          setStatusMsg('Preview mode ready.');
        }
      } else {
        setStatusMsg('Preview mode: Using studio AR floor simulator.');
      }
    };
    checkXR();
  }, []);

  const handleStartRealAR = async () => {
    if (!engine) return;
    try {
      setStatusMsg('Starting AR view...');
      const success = await engine.startWebXRSession();
      if (success) {
        setArState((prev) => ({ ...prev, isActive: true, hasHitTest: true }));
        setStatusMsg('AR Active: Move device to scan floor and place 3D sketch.');
      } else {
        setIsSimulatedAR(true);
        engine.enableSimulatedARMode(true);
        setStatusMsg('Preview Mode active: 1 unit = 1 m scale');
      }
    } catch (err: any) {
      console.warn('WebXR session error:', err);
      setIsSimulatedAR(true);
      engine.enableSimulatedARMode(true);
      setStatusMsg('Preview mode activated.');
    }
  };

  const handleStopAR = () => {
    if (!engine) return;
    engine.stopWebXRSession();
    engine.enableSimulatedARMode(false);
    setArState((prev) => ({ ...prev, isActive: false }));
    setIsSimulatedAR(false);
    onClose();
  };

  const handleElevationChange = (newElev: number) => {
    setElevation(newElev);
    engine?.setARSceneElevation(newElev);
  };

  return (
    <div className="paperrocket-modal-overlay fixed inset-0 z-50 flex items-center justify-center select-none p-4">
      <div className={`pr-surface w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150 ${t.shell}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${t.header}`}>
          <div className="flex items-center gap-2">
            <Glasses className={`w-5 h-5 ${isLight ? 'text-neutral-900' : 'text-white'}`} />
            <span className={`text-sm font-bold tracking-wide ${t.textPrimary}`}>View in AR</span>
          </div>
          <button
            onClick={handleStopAR}
            className={`p-1 rounded-lg transition-colors ${t.btnGhost}`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status Capsule */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${t.innerCard}`}>
            <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`} />
            <div className="text-xs space-y-0.5">
              <div className={`font-semibold ${t.textPrimary}`}>AR Status</div>
              <div className={t.textSecondary}>{statusMsg}</div>
            </div>
          </div>

          {/* Scale & Feature Highlights */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-3 rounded-xl border ${t.innerCardMuted}`}>
              <span className={`font-bold uppercase text-[10px] ${t.textMuted}`}>Model Scale</span>
              <div className={`font-mono text-sm font-bold ${t.textPrimary} mt-0.5`}>1 unit = 1 m</div>
            </div>
            <div className={`p-3 rounded-xl border ${t.innerCardMuted}`}>
              <span className={`font-bold uppercase text-[10px] ${t.textMuted}`}>Placement</span>
              <div className={`font-mono text-sm font-bold ${t.textPrimary} mt-0.5`}>Floor</div>
            </div>
          </div>

          {/* Height above floor */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className={`flex items-center gap-1.5 font-medium ${t.textPrimary}`}>
                <MoveVertical className={`w-3.5 h-3.5 ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`} />
                <span>Height above floor</span>
              </div>
              <span className={`font-mono text-xs font-bold ${isLight ? 'text-neutral-900' : 'text-neutral-100'}`}>
                {(elevation * 100).toFixed(0)} cm
              </span>
            </div>
            <input
              type="range"
              min="-1.5"
              max="2.0"
              step="0.05"
              value={elevation}
              onChange={(e) => handleElevationChange(parseFloat(e.target.value))}
              className={`w-full h-1.5 rounded-lg cursor-pointer ${
                isLight ? 'accent-neutral-900 bg-neutral-200' : 'accent-white bg-neutral-800'
              }`}
            />
            <div className={`flex justify-between text-[10px] font-mono mt-1 ${t.textMuted}`}>
              <span>-150 cm</span>
              <span>0 cm (Floor)</span>
              <span>+200 cm</span>
            </div>
          </div>

          {/* Actions */}
          <div className={`pt-2 border-t flex items-center gap-2 ${isLight ? 'border-black/10' : 'border-neutral-800'}`}>
            <button
              onClick={handleStopAR}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${t.btnSecondary}`}
            >
              Cancel
            </button>
            <button
              onClick={handleStartRealAR}
              className={`flex-1 py-2 px-3 rounded-xl ${isLight ? 'bg-neutral-900 hover:bg-black text-white' : 'bg-white hover:bg-neutral-100 text-zinc-950'} text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all`}
            >
              <Glasses className="w-4 h-4" />
              <span>Launch AR Viewer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
