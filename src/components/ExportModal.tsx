import React, { useState, useEffect, useRef } from 'react';
import { StudioEngine } from '../core/studioEngine';
import { Download, Camera, Image, Box, X, Check, Loader2, FolderHeart, Video, RotateCw, Film, Square, Glasses } from 'lucide-react';
import { ModelStorage } from '../core/modelStorage';
import { Saved3DModel } from '../types';

import { PlatformBridge } from '../core/platformBridge';
import { isVideoRecordingSupported } from '../core/mediaRecorderService';

interface ExportModalProps {
  engine: StudioEngine | null;
  onClose: () => void;
  activeModelName: string;
  theme?: 'light' | 'dark';
  onOpenARViewer?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  engine,
  onClose,
  activeModelName,
  theme = 'dark',
  onOpenARViewer,
}) => {
  const isLight = theme === 'light';
  const [exporting, setExporting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recordingType, setRecordingType] = useState<'turntable' | 'timelapse' | null>(null);
  const [recordingProgress, setRecordingProgress] = useState<number | null>(null);
  const [turntableDuration, setTurntableDuration] = useState<number>(6);
  const [timelapseDuration, setTimelapseDuration] = useState<number>(8);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const handleExportGLB = async () => {
    if (!engine) return;
    setExporting('glb');
    try {
      const blob = await engine.exportGLB();
      const savedPath = await PlatformBridge.saveModelFile(
        `${activeModelName.replace(/\s+/g, '_')}_painted.glb`,
        blob,
        [{ name: 'GLB 3D Model', extensions: ['glb'] }]
      );
      if (savedPath) {
        PlatformBridge.triggerHaptic('success');
        setSuccess('GLB export completed successfully!');
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const handleExportOBJ = async () => {
    if (!engine) return;
    setExporting('obj');
    try {
      const text = engine.exportOBJ();
      const savedPath = await PlatformBridge.saveModelFile(
        `${activeModelName.replace(/\s+/g, '_')}_painted.obj`,
        text,
        [{ name: 'Wavefront OBJ', extensions: ['obj'] }]
      );
      if (savedPath) {
        PlatformBridge.triggerHaptic('success');
        setSuccess('OBJ export completed successfully!');
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const handleExportUVTexture = async () => {
    if (!engine) return;
    setExporting('uv');
    try {
      const dataUrl = engine.uvEngine.exportPNG();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const savedPath = await PlatformBridge.saveModelFile(
        `${activeModelName.replace(/\s+/g, '_')}_texture_2048.png`,
        blob,
        [{ name: 'PNG Texture Map', extensions: ['png'] }]
      );
      if (savedPath) {
        PlatformBridge.triggerHaptic('success');
        setSuccess('Painted surface image exported!');
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const handleCaptureSnapshot = async () => {
    if (!engine) return;
    setExporting('snapshot');
    try {
      const dataUrl = engine.captureSnapshot();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const savedPath = await PlatformBridge.saveModelFile(
        `${activeModelName.replace(/\s+/g, '_')}_studio_render.png`,
        blob,
        [{ name: 'PNG Studio Render', extensions: ['png'] }]
      );
      if (savedPath) {
        PlatformBridge.triggerHaptic('success');
        setSuccess('Studio render snapshot captured!');
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!engine) return;
    setExporting('storage');
    try {
      const glbBlob = await engine.exportGLB();
      const arrayBuffer = await glbBlob.arrayBuffer();
      const snapshot = engine.captureSnapshot();
      const meta = (engine as any).getModelMetadata?.() || {
        triangleCount: 0,
        vertexCount: 0,
        meshCount: 1,
        materialCount: 1,
        dimensions: { x: 1, y: 1, z: 1 },
      };

      const savedModel: Saved3DModel = {
        id: `model_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: `${activeModelName}_painted`,
        originalName: activeModelName,
        originalFormat: 'glb',
        originalSize: arrayBuffer.byteLength,
        compressedSize: arrayBuffer.byteLength,
        savedDate: Date.now(),
        thumbnail: snapshot,
        blob: arrayBuffer,
        triangleCount: meta.triangleCount || 0,
        vertexCount: meta.vertexCount || 0,
        meshCount: meta.meshCount || 1,
        materialCount: meta.materialCount || 1,
        dimensions: meta.dimensions || { x: 1, y: 1, z: 1 },
        dracoCompressed: false,
        isBaked: true,
      };

      await ModelStorage.saveModel(savedModel);
      PlatformBridge.triggerHaptic('success');
      setSuccess('Model & Auto Preview saved to your library!');
    } catch (e: any) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const handleRecordTurntable = async () => {
    if (!engine) return;
    const ac = new AbortController();
    abortControllerRef.current = ac;
    setRecordingType('turntable');
    setRecordingProgress(0);
    try {
      const result = await engine.recordTurntableVideo({
        durationSec: turntableDuration,
        fps: 60,
        onProgress: (p) => setRecordingProgress(p),
        signal: ac.signal,
      });
      const ext = result.extension || 'webm';
      const filename = `${activeModelName.replace(/\s+/g, '_')}_360_turntable.${ext}`;
      const savedPath = await PlatformBridge.saveModelFile(
        filename,
        result.blob,
        [{ name: `Video (${ext.toUpperCase()})`, extensions: [ext] }]
      );
      if (savedPath) {
        PlatformBridge.triggerHaptic('success');
        setSuccess('360° Turntable video exported successfully!');
      }
    } catch (e: any) {
      if (e?.message !== 'Turntable recording aborted') {
        console.error(e);
      }
    } finally {
      setRecordingType(null);
      setRecordingProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleRecordTimelapse = async () => {
    if (!engine) return;
    const ac = new AbortController();
    abortControllerRef.current = ac;
    setRecordingType('timelapse');
    setRecordingProgress(0);
    try {
      const result = await engine.recordTimelapseVideo({
        durationSec: timelapseDuration,
        fps: 60,
        onProgress: (p) => setRecordingProgress(p),
        signal: ac.signal,
      });
      const ext = result.extension || 'webm';
      const filename = `${activeModelName.replace(/\s+/g, '_')}_creation_timelapse.${ext}`;
      const savedPath = await PlatformBridge.saveModelFile(
        filename,
        result.blob,
        [{ name: `Video (${ext.toUpperCase()})`, extensions: [ext] }]
      );
      if (savedPath) {
        PlatformBridge.triggerHaptic('success');
        setSuccess('Stroke-by-stroke timelapse video exported successfully!');
      }
    } catch (e: any) {
      if (e?.message !== 'Timelapse recording aborted') {
        console.error(e);
      }
    } finally {
      setRecordingType(null);
      setRecordingProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleCancelRecording = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="paperrocket-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        id="export-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Export"
        className={`pr-surface w-full max-w-lg max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col p-4 sm:p-6 rounded-3xl border shadow-2xl overflow-hidden my-auto ${
          isLight
            ? 'bg-white border-black/10 text-neutral-800 shadow-2xl'
            : 'bg-[#18191d] border-neutral-800 text-neutral-100 shadow-2xl'
        }`}
      >
        {/* Header - Sticky non-scrolling */}
        <div className={`shrink-0 flex items-center justify-between pb-3 sm:pb-4 border-b ${isLight ? 'border-black/10' : 'border-neutral-800'}`}>
          <div className={`flex items-center gap-2.5 font-semibold text-base ${isLight ? 'text-neutral-900' : 'text-neutral-100'}`}>
            <Download className="w-5 h-5 text-neutral-700 dark:text-zinc-300" />
            <span>Export</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            data-testid="modal-close"
            className={`min-w-[44px] min-h-[44px] p-2 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              isLight ? 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900' : 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options - Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto studio-scroll space-y-2.5 sm:space-y-3 my-2 sm:my-4 pr-1">
          {/* GLB Option - Recommended */}
          <div
            onClick={handleExportGLB}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
              isLight
                ? 'bg-[#f4f0e9]/80 hover:bg-[#ede8e0] border-black/10'
                : 'bg-neutral-950/50 hover:bg-neutral-800/60 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl transition-all ${
                isLight ? 'bg-black/5 text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white' : 'bg-white/10 text-white group-hover:bg-white group-hover:text-zinc-950'
              }`}>
                <Box className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold transition-colors ${
                    isLight ? 'text-neutral-900 group-hover:text-neutral-900' : 'text-neutral-100 group-hover:text-white'
                  }`}>
                    3D Model (GLB)
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    Recommended
                  </span>
                </div>
                <span className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Full 3D model with all your lines included
                </span>
              </div>
            </div>
            {exporting === 'glb' ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-700 dark:text-zinc-300" />
            ) : (
              <Download className={`w-4 h-4 transition-colors ${isLight ? 'text-neutral-400 group-hover:text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-200'}`} />
            )}
          </div>

          {/* OBJ Option */}
          <div
            onClick={handleExportOBJ}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
              isLight
                ? 'bg-[#f4f0e9]/80 hover:bg-[#ede8e0] border-black/10'
                : 'bg-neutral-950/50 hover:bg-neutral-800/60 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl transition-all ${
                isLight ? 'bg-black/5 text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white' : 'bg-white/10 text-white group-hover:bg-white group-hover:text-zinc-950'
              }`}>
                <Box className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className={`text-sm font-semibold transition-colors ${
                  isLight ? 'text-neutral-900 group-hover:text-neutral-900' : 'text-neutral-100 group-hover:text-white'
                }`}>
                  OBJ Model
                </span>
                <span className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Standard OBJ geometry compatible with Blender, Maya, and Unity
                </span>
              </div>
            </div>
            {exporting === 'obj' ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-700 dark:text-zinc-300" />
            ) : (
              <Download className={`w-4 h-4 transition-colors ${isLight ? 'text-neutral-400 group-hover:text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-200'}`} />
            )}
          </div>

          {/* UV Map Texture PNG */}
          <div
            onClick={handleExportUVTexture}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
              isLight
                ? 'bg-[#f4f0e9]/80 hover:bg-[#ede8e0] border-black/10'
                : 'bg-neutral-950/50 hover:bg-neutral-800/60 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl transition-all ${
                isLight ? 'bg-black/5 text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white' : 'bg-white/10 text-white group-hover:bg-white group-hover:text-zinc-950'
              }`}>
                <Image className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className={`text-sm font-semibold transition-colors ${
                  isLight ? 'text-neutral-900 group-hover:text-neutral-900' : 'text-neutral-100 group-hover:text-white'
                }`}>
                  Texture Image · 2K PNG
                </span>
                <span className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  2048 × 2048 image of the paint on your model
                </span>
              </div>
            </div>
            {exporting === 'uv' ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-700 dark:text-zinc-300" />
            ) : (
              <Download className={`w-4 h-4 transition-colors ${isLight ? 'text-neutral-400 group-hover:text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-200'}`} />
            )}
          </div>

          {/* Screenshot */}
          <div
            onClick={handleCaptureSnapshot}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
              isLight
                ? 'bg-[#f4f0e9]/80 hover:bg-[#ede8e0] border-black/10'
                : 'bg-neutral-950/50 hover:bg-neutral-800/60 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl transition-all ${
                isLight ? 'bg-black/5 text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white' : 'bg-white/10 text-white group-hover:bg-white group-hover:text-zinc-950'
              }`}>
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className={`text-sm font-semibold transition-colors ${
                  isLight ? 'text-neutral-900 group-hover:text-neutral-900' : 'text-neutral-100 group-hover:text-white'
                }`}>
                  Screenshot
                </span>
                <span className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  High-resolution rendered PNG image of current view
                </span>
              </div>
            </div>
            {exporting === 'snapshot' ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-700 dark:text-zinc-300" />
            ) : (
              <Download className={`w-4 h-4 transition-colors ${isLight ? 'text-neutral-400 group-hover:text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-200'}`} />
            )}
          </div>

          {/* Save to In-App Library */}
          <div
            onClick={handleSaveToLibrary}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
              isLight
                ? 'bg-[#f4f0e9]/80 hover:bg-[#ede8e0] border-black/10'
                : 'bg-neutral-950/50 hover:bg-neutral-800/60 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl transition-all ${
                isLight ? 'bg-black/5 text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white' : 'bg-white/10 text-white group-hover:bg-white group-hover:text-zinc-950'
              }`}>
                <FolderHeart className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className={`text-sm font-semibold transition-colors ${
                  isLight ? 'text-neutral-900 group-hover:text-neutral-900' : 'text-neutral-100 group-hover:text-white'
                }`}>
                  Save to In-App Library
                </span>
                <span className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Store painted model inside your local app collection
                </span>
              </div>
            </div>
            {exporting === 'storage' ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-700 dark:text-zinc-300" />
            ) : (
              <Download className={`w-4 h-4 transition-colors ${isLight ? 'text-neutral-400 group-hover:text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-200'}`} />
            )}
          </div>

          {/* View in AR Option */}
          {onOpenARViewer && (
            <div
              onClick={() => {
                onClose();
                onOpenARViewer();
              }}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                isLight
                  ? 'bg-[#f4f0e9]/80 hover:bg-[#ede8e0] border-black/10'
                  : 'bg-neutral-950/50 hover:bg-neutral-800/60 border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-all ${
                  isLight ? 'bg-black/5 text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white' : 'bg-white/10 text-white group-hover:bg-white group-hover:text-zinc-950'
                }`}>
                  <Glasses className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className={`text-sm font-semibold transition-colors ${
                    isLight ? 'text-neutral-900 group-hover:text-neutral-900' : 'text-neutral-100 group-hover:text-white'
                  }`}>
                    View in AR
                  </span>
                  <span className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    Experience model in real space with augmented reality
                  </span>
                </div>
              </div>
              <Glasses className={`w-4 h-4 transition-colors ${isLight ? 'text-neutral-400 group-hover:text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-200'}`} />
            </div>
          )}

          {/* Section Divider: Video & Animation Studio */}
          <div className="pt-2 pb-1">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                3D Video & Replay Capture
              </span>
              <div className={`flex-1 h-px ${isLight ? 'bg-black/10' : 'bg-neutral-800'}`} />
            </div>
          </div>

          {/* 360 Turntable Video */}
          <div
            className={`flex flex-col p-4 rounded-2xl border transition-all ${
              isLight
                ? 'bg-[#f4f0e9]/80 border-black/10'
                : 'bg-neutral-950/50 border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-all ${
                  isLight ? 'bg-black/5 text-neutral-900' : 'bg-white/10 text-white'
                }`}>
                  <RotateCw className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isLight ? 'text-neutral-900' : 'text-neutral-100'}`}>
                      360° Turntable Video
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      HD WebM
                    </span>
                  </div>
                  <span className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    Smooth full 360-degree rotation video around your model
                  </span>
                </div>
              </div>

              <button
                disabled={Boolean(recordingType || exporting)}
                onClick={handleRecordTurntable}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                {recordingType === 'turntable' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Video className="w-3.5 h-3.5" />
                )}
                <span>Record</span>
              </button>
            </div>

            {/* Duration Selector */}
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-neutral-800/40">
              <span className={`text-[10px] uppercase font-semibold ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Duration:
              </span>
              {[4, 6, 10].map((dur) => (
                <button
                  key={dur}
                  disabled={Boolean(recordingType)}
                  onClick={() => setTurntableDuration(dur)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-colors ${
                    turntableDuration === dur
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40 font-bold'
                      : isLight
                      ? 'bg-black/5 text-neutral-600 hover:bg-black/10'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>
          </div>

          {/* Stroke-by-Stroke Timelapse Video */}
          <div
            className={`flex flex-col p-4 rounded-2xl border transition-all ${
              isLight
                ? 'bg-[#f4f0e9]/80 border-black/10'
                : 'bg-neutral-950/50 border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-all ${
                  isLight ? 'bg-black/5 text-neutral-900' : 'bg-white/10 text-white'
                }`}>
                  <Film className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isLight ? 'text-neutral-900' : 'text-neutral-100'}`}>
                      Stroke Creation Timelapse
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Replay
                    </span>
                  </div>
                  <span className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    Replays artwork stroke by stroke from blank canvas to finished model
                  </span>
                </div>
              </div>

              <button
                disabled={Boolean(recordingType || exporting)}
                onClick={handleRecordTimelapse}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                {recordingType === 'timelapse' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Video className="w-3.5 h-3.5" />
                )}
                <span>Record</span>
              </button>
            </div>

            {/* Duration Selector */}
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-neutral-800/40">
              <span className={`text-[10px] uppercase font-semibold ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Replay Length:
              </span>
              {[5, 8, 15].map((dur) => (
                <button
                  key={dur}
                  disabled={Boolean(recordingType)}
                  onClick={() => setTimelapseDuration(dur)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-colors ${
                    timelapseDuration === dur
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40 font-bold'
                      : isLight
                      ? 'bg-black/5 text-neutral-600 hover:bg-black/10'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Recording Progress Banner */}
        {recordingType && (
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-purple-500/40 text-neutral-100 flex flex-col gap-2.5 shadow-xl animate-in fade-in my-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-semibold">
                  Recording {recordingType === 'turntable' ? '360° Turntable' : 'Creation Timelapse'}...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-purple-300 font-bold">
                  {recordingProgress !== null ? `${recordingProgress}%` : 'Processing...'}
                </span>
                <button
                  onClick={handleCancelRecording}
                  className="px-2 py-0.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium border border-red-500/30 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all duration-150 ease-out"
                style={{ width: `${recordingProgress ?? 10}%` }}
              />
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900 dark:bg-white/10 border border-neutral-900 dark:border-white/30 text-xs text-neutral-900 dark:text-white font-medium">
            <Check className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}
      </div>
    </div>
  );
};
