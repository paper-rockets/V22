import React, { lazy, Suspense, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { StudioEngine } from '../../core/studioEngine';
import { DeferredPanel } from '../DeferredPanel';
import {
  PostProcessSettings,
  GPUInfo,
  PathTracingProgressInfo,
  CustomMirrorConfig,
  SymmetryMode,
  BrushSettings,
  ToolType,
  HolisticStrokeDNA,
  ReferenceImageItem,
  NumpadTarget,
} from '../../types';

// Deferred Modals
const RenderSettingsPanel = lazy(() =>
  import('../RenderSettingsPanel').then((m) => ({ default: m.RenderSettingsPanel }))
);
const ModelLibraryModal = lazy(() =>
  import('../ModelLibraryModal').then((m) => ({ default: m.ModelLibraryModal }))
);
const ExportModal = lazy(() => import('../ExportModal').then((m) => ({ default: m.ExportModal })));
const ProjectSessionModal = lazy(() =>
  import('../ProjectSessionModal').then((m) => ({ default: m.ProjectSessionModal }))
);
const SimpleSceneIlluminationModal = lazy(() =>
  import('../SimpleSceneIlluminationModal').then((m) => ({ default: m.SimpleSceneIlluminationModal }))
);
const CurveDecimateModal = lazy(() =>
  import('../CurveDecimateModal').then((m) => ({ default: m.CurveDecimateModal }))
);
const CustomMirrorModal = lazy(() =>
  import('../CustomMirrorModal').then((m) => ({ default: m.CustomMirrorModal }))
);
const BentGuideModal = lazy(() => import('../BentGuideModal').then((m) => ({ default: m.BentGuideModal })));
const LoftSurfacingModal = lazy(() =>
  import('../LoftSurfacingModal').then((m) => ({ default: m.LoftSurfacingModal }))
);
const ScaffoldingModal = lazy(() =>
  import('../ScaffoldingModal').then((m) => ({ default: m.ScaffoldingModal }))
);
const ARViewerModal = lazy(() => import('../ARViewerModal').then((m) => ({ default: m.ARViewerModal })));
// Keep the color studio lazy for initial load, but give it a stable loader so
// the Draw panel can warm it while the artist is choosing a brush.  Opening a
// color control must never begin a multi-second module download.
const loadColorStudioModal = () =>
  import('../CompactColorStudioModal').then((m) => ({ default: m.ColorStudioModal }));
const ColorStudioModal = lazy(loadColorStudioModal);
const HolisticDNAInspector = lazy(() =>
  import('../HolisticDNAInspector').then((m) => ({ default: m.HolisticDNAInspector }))
);
const FloatingReferenceClipboard = lazy(() =>
  import('../FloatingReferenceClipboard').then((m) => ({ default: m.FloatingReferenceClipboard }))
);

export interface AppModalHostProps {
  engine: StudioEngine | null;
  theme: string;
  // Render settings
  postSettings: PostProcessSettings;
  setPostSettings: React.Dispatch<React.SetStateAction<PostProcessSettings>>;
  isRenderSettingsOpen: boolean;
  setIsRenderSettingsOpen: (open: boolean) => void;
  gpuInfo: GPUInfo | null;
  pathTracingProgress: PathTracingProgressInfo | null;
  // Model library
  isModelsOpen: boolean;
  setIsModelsOpen: (open: boolean) => void;
  activeModelName: string;
  handleBeforeReplace: (opts: { title: string; description: string; actionLabel: string; onProceed: () => Promise<void> | void }) => void;
  // Export
  isExportOpen: boolean;
  setIsExportOpen: (open: boolean) => void;
  // Project Sessions
  isSessionModalOpen: boolean;
  setIsSessionModalOpen: (open: boolean) => void;
  handleSaveNamedSession: (name: string) => Promise<void>;
  handleLoadNamedSession: (session: any) => Promise<void>;
  handleSaveProjectToFolder: () => Promise<void>;
  handleSaveProject: () => void;
  handleLoadProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Illumination
  isIlluminationOpen: boolean;
  setIsIlluminationOpen: (open: boolean) => void;
  // Curve Decimate
  isDecimateOpen: boolean;
  setIsDecimateOpen: (open: boolean) => void;
  // Bent Guide
  isBentGuideOpen: boolean;
  setIsBentGuideOpen: (open: boolean) => void;
  // Multi-Curve Lofting
  isLoftModalOpen: boolean;
  setIsLoftModalOpen: (open: boolean) => void;
  // Scaffolding
  isScaffoldingOpen: boolean;
  setIsScaffoldingOpen: (open: boolean) => void;
  // Reference Clipboard
  isClipboardOpen: boolean;
  setIsClipboardOpen: (open: boolean) => void;
  referenceImages: ReferenceImageItem[];
  setReferenceImages: React.Dispatch<React.SetStateAction<ReferenceImageItem[]>>;
  // Custom Mirror
  isCustomMirrorOpen: boolean;
  setIsCustomMirrorOpen: (open: boolean) => void;
  // Precision Numpad
  onOpenNumpad?: (target: NumpadTarget) => void;
  customMirrorConfig: CustomMirrorConfig;
  setCustomMirrorConfig: React.Dispatch<React.SetStateAction<CustomMirrorConfig>>;
  setSymmetry: (mode: SymmetryMode) => void;
  // AR Viewer
  isARViewerOpen: boolean;
  setIsARViewerOpen: (open: boolean) => void;
  // Color Studio
  isColorStudioOpen: boolean;
  setIsColorStudioOpen: (open: boolean) => void;
  onColorStudioInteractionModeChange?: (allowsWorkspaceInteraction: boolean) => void;
  brushSettings: BrushSettings;
  setBrushSettings: React.Dispatch<React.SetStateAction<BrushSettings>>;
  setTool: (tool: ToolType) => void;
  // Holistic DNA
  activeDNA: HolisticStrokeDNA | null;
  setActiveDNA: (dna: HolisticStrokeDNA | null) => void;
  // Overlay & Toasts
  snappedShapeNotice: string | null;
  windowDragOver: boolean;
}

export const AppModalHost: React.FC<AppModalHostProps> = ({
  engine,
  theme,
  postSettings,
  setPostSettings,
  isRenderSettingsOpen,
  setIsRenderSettingsOpen,
  gpuInfo,
  pathTracingProgress,
  isModelsOpen,
  setIsModelsOpen,
  activeModelName,
  handleBeforeReplace,
  isExportOpen,
  setIsExportOpen,
  isSessionModalOpen,
  setIsSessionModalOpen,
  handleSaveNamedSession,
  handleLoadNamedSession,
  handleSaveProjectToFolder,
  handleSaveProject,
  handleLoadProject,
  isIlluminationOpen,
  setIsIlluminationOpen,
  isDecimateOpen,
  setIsDecimateOpen,
  isBentGuideOpen,
  setIsBentGuideOpen,
  isLoftModalOpen,
  setIsLoftModalOpen,
  isScaffoldingOpen,
  setIsScaffoldingOpen,
  isClipboardOpen,
  setIsClipboardOpen,
  referenceImages,
  setReferenceImages,
  isCustomMirrorOpen,
  setIsCustomMirrorOpen,
  onOpenNumpad,
  customMirrorConfig,
  setCustomMirrorConfig,
  setSymmetry,
  isARViewerOpen,
  setIsARViewerOpen,
  isColorStudioOpen,
  setIsColorStudioOpen,
  onColorStudioInteractionModeChange,
  brushSettings,
  setBrushSettings,
  setTool,
  activeDNA,
  setActiveDNA,
  snappedShapeNotice,
  windowDragOver,
}) => {
  const handleCloseColorStudio = useCallback(() => setIsColorStudioOpen(false), [setIsColorStudioOpen]);

  useEffect(() => {
    const warm = () => { void loadColorStudioModal(); };
    const idle = window.requestIdleCallback?.(warm, { timeout: 1200 });
    const timeout = idle === undefined ? window.setTimeout(warm, 450) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      {/* Visual Render Post-Processing Settings Panel */}
      {isRenderSettingsOpen && (
        <Suspense fallback={null}>
          <RenderSettingsPanel
            settings={postSettings}
            setSettings={setPostSettings}
            onClose={() => setIsRenderSettingsOpen(false)}
            onRecalculateNormals={() => engine?.recalculateMeshNormals()}
            gpuInfo={gpuInfo}
            theme={theme}
            pathTracingProgress={pathTracingProgress}
          />
        </Suspense>
      )}

      {/* 3D Model Ingestion / Presets Modal */}
      {isModelsOpen && (
        <Suspense fallback={null}>
          <ModelLibraryModal
            engine={engine}
            onClose={() => setIsModelsOpen(false)}
            activeModelName={activeModelName}
            theme={theme}
            onBeforeReplace={handleBeforeReplace}
          />
        </Suspense>
      )}

      {/* Export 3D / Textures Modal */}
      {isExportOpen && (
        <Suspense fallback={null}>
          <ExportModal
            engine={engine}
            onClose={() => setIsExportOpen(false)}
            activeModelName={activeModelName}
            theme={theme}
          />
        </Suspense>
      )}

      {/* Project Session Management Modal */}
      {isSessionModalOpen && (
        <Suspense fallback={null}>
          <ProjectSessionModal
            isOpen={isSessionModalOpen}
            onClose={() => setIsSessionModalOpen(false)}
            onSaveSession={handleSaveNamedSession}
            onLoadSession={handleLoadNamedSession}
            onSaveToFolder={handleSaveProjectToFolder}
            onExportFile={handleSaveProject}
            onImportFile={handleLoadProject}
            theme={theme}
            activeProjectName={activeModelName}
          />
        </Suspense>
      )}

      {/* Studio Illumination Modal */}
      <DeferredPanel active={isIlluminationOpen}>
        <SimpleSceneIlluminationModal
          engine={engine}
          isOpen={isIlluminationOpen}
          onClose={() => setIsIlluminationOpen(false)}
          theme={theme}
        />
      </DeferredPanel>

      {/* RDP Curve Decimation Modal */}
      <DeferredPanel active={isDecimateOpen}>
        <CurveDecimateModal
          isOpen={isDecimateOpen}
          onClose={() => setIsDecimateOpen(false)}
          onOpenNumpad={onOpenNumpad}
          onApplyDecimation={(epsilon, preserveTopology) => {
            engine?.decimateActiveLayerCurves(epsilon, preserveTopology);
          }}
          theme={theme}
        />
      </DeferredPanel>

      {/* Bent 3D Manifold Guide & Lofting Modal */}
      <DeferredPanel active={isBentGuideOpen}>
        <BentGuideModal
          isOpen={isBentGuideOpen}
          onClose={() => setIsBentGuideOpen(false)}
          engine={engine}
          theme={theme}
        />
      </DeferredPanel>

      {/* Multi-Curve 3D Lofting & Surface Skinning Modal */}
      <DeferredPanel active={isLoftModalOpen}>
        <LoftSurfacingModal
          isOpen={isLoftModalOpen}
          onClose={() => setIsLoftModalOpen(false)}
          engine={engine}
          onOpenNumpad={onOpenNumpad}
          theme={theme === 'light' ? 'light' : 'dark'}
        />
      </DeferredPanel>

      {/* 3D Scaffolding & Armature Guides Modal */}
      <DeferredPanel active={isScaffoldingOpen}>
        <ScaffoldingModal
          isOpen={isScaffoldingOpen}
          onClose={() => setIsScaffoldingOpen(false)}
          onOpenNumpad={onOpenNumpad}
          engine={engine}
          theme={theme === 'light' ? 'light' : 'dark'}
        />
      </DeferredPanel>

      {/* Floating 2D Blueprint Clipboard & Reference Moodboard */}
      <DeferredPanel active={isClipboardOpen}>
        <FloatingReferenceClipboard
          isOpen={isClipboardOpen}
          onClose={() => setIsClipboardOpen(false)}
          referenceImages={referenceImages}
          setReferenceImages={setReferenceImages}
          theme={theme}
        />
      </DeferredPanel>

      {/* Arbitrary 3D Mirror Plane Modal */}
      <DeferredPanel active={isCustomMirrorOpen}>
        <CustomMirrorModal
          isOpen={isCustomMirrorOpen}
          onClose={() => setIsCustomMirrorOpen(false)}
          onOpenNumpad={onOpenNumpad}
          config={customMirrorConfig}
          onConfigChange={(newCfg) => {
            setCustomMirrorConfig(newCfg);
            if (engine) {
              engine.updateCustomMirrorPlane(newCfg.planeOrigin, newCfg.planeNormal);
              setSymmetry('custom_plane');
            }
          }}
          onAlignToCamera={() => {
            if (engine) {
              const viewDir = engine.camera.getWorldDirection(new THREE.Vector3()).negate();
              const camPos = engine.camera.position.clone().add(viewDir.clone().multiplyScalar(-1.5));
              const newCfg = {
                planeOrigin: [camPos.x, camPos.y, camPos.z] as [number, number, number],
                planeNormal: [viewDir.x, viewDir.y, viewDir.z] as [number, number, number],
                visible: true,
              };
              setCustomMirrorConfig(newCfg);
              engine.updateCustomMirrorPlane(newCfg.planeOrigin, newCfg.planeNormal);
              setSymmetry('custom_plane');
            }
          }}
          theme={theme}
        />
      </DeferredPanel>

      {/* WebXR AR Viewer Modal */}
      <DeferredPanel active={isARViewerOpen}>
        <ARViewerModal
          isOpen={isARViewerOpen}
          onClose={() => setIsARViewerOpen(false)}
          engine={engine}
          theme={theme}
        />
      </DeferredPanel>

      {/* Advanced Color Studio Modal */}
      <DeferredPanel active={isColorStudioOpen}>
        <ColorStudioModal
          isOpen={isColorStudioOpen}
          onClose={handleCloseColorStudio}
          onInteractionModeChange={onColorStudioInteractionModeChange}
          currentColor={brushSettings.color || '#000000'}
          onChangeColor={(hex) => {
            setBrushSettings((prev) => ({ ...prev, color: hex, solidColor: hex }));
            setTool('brush');
          }}
          onApplyBrushSettings={(newSettings) => {
            setBrushSettings((prev) => ({ ...prev, ...newSettings }));
            setTool('brush');
          }}
          onApplyToModel={(mat) => engine?.setModelCustomMaterial(mat)}
          onSampleFromScreen={() => {
            setIsColorStudioOpen(false);
            setTool('eyedropper');
          }}
          theme={theme}
          brushSettings={brushSettings}
        />
      </DeferredPanel>

      {/* Holistic DNA Inspector & Injector Popup */}
      <DeferredPanel active={activeDNA !== null}>
        <HolisticDNAInspector
          dna={activeDNA}
          onClose={() => setActiveDNA(null)}
          onInjectDNA={(dna) => {
            setBrushSettings((prev) => ({
              ...prev,
              color: dna.colorHex,
              size: dna.size,
              opacity: dna.opacity,
              roughness: dna.roughness,
              metalness: dna.metalness,
              emissiveIntensity: dna.emissiveIntensity,
              materialType: dna.materialType,
              profile: dna.profile,
              patternType: dna.patternType,
              patternScale: dna.patternScale,
              patternIntensity: dna.patternIntensity,
              shaderEffect: dna.shaderEffect,
            }));
          }}
          theme={theme}
        />
      </DeferredPanel>

      {/* Snapped Shape Notice Toast */}
      {snappedShapeNotice && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs shadow-xl border ${
              theme === 'light'
                ? 'bg-neutral-900 text-white border-neutral-800'
                : 'bg-[#18191d] text-white border-white/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full animate-ping bg-white" />
            <span>{snappedShapeNotice}</span>
          </div>
        </div>
      )}

      {/* Drag & Drop Overlay Indicator */}
      {windowDragOver && (
        <div
          className={`fixed inset-0 z-50 pointer-events-none border-4 border-dashed flex items-center justify-center animate-in fade-in duration-100 ${
            theme === 'light'
              ? 'bg-neutral-900/40 border-neutral-500'
              : 'bg-black/60 border-white/50'
          }`}
        >
          <div className="px-6 py-4 rounded-3xl bg-white dark:bg-[#18191d] shadow-2xl text-center space-y-2 border border-neutral-200 dark:border-neutral-800">
            <div className="text-base font-bold text-neutral-900 dark:text-white">
              Drop 3D Model to Import
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Supports GLB, GLTF, OBJ (+MTL), FBX, 3DS, STL, PLY, DAE
            </div>
          </div>
        </div>
      )}
    </>
  );
};
