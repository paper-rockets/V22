# Code Functions Inventory & Architecture Breakdown

**Folder Path:** `E:\X\AiStudio Workflow\V22 Test`

This document provides a comprehensive technical overview and complete inventory of all **1,225 functions and methods** across **113 source files** in `E:\X\AiStudio Workflow\V22 Test\src`.

## Architecture Overview

The codebase is split into 9 core subsystems:

1. **Core 3D Studio Engine (`src/core/studioEngine.ts`)**: Central coordinator for the entire 3D drawing canvas, WebGL rendering loop, input handling, and 3D scene objects.
2. **Stroke Processing & Mesh Generation (`src/core/`)**: Converts touch/stylus coordinate points into 3D geometry ribbons and tubes, applying jitter smoothing, curve fitting, and geometric shape snapping.
3. **Surface Snapping & UV Painting (`src/core/FastSurfaceRaycaster.ts`, `uvPaintingEngine.ts`)**: Raycasts against 3D models so strokes attach to surfaces and paints color directly onto 2D texture maps wrapped on 3D objects.
4. **3D Transforms & Camera Navigation (`src/core/cameraController.ts`, `transformController.ts`)**: Controls camera orbiting, panning, zooming, and 3D gizmo handles for translating, rotating, and scaling objects.
5. **Deformations, Lofts & Scaffolding (`src/core/liquifyEngine.ts`, `loftEngine.ts`, `scaffoldingEngine.ts`)**: Tools to warp existing 3D strokes, sweep surfaces between guide curves, and set up drawing grids/planes.
6. **Lighting, Shaders & Rendering Pipeline (`src/core/`)**: Realistic studio lighting, procedural skyboxes, bloom and tone-mapping post-processing, and transparent stroke blending.
7. **3D Model Import, Storage & Export (`src/core/`)**: Imports GLTF, GLB, and OBJ models, scales them to fit the workspace, saves user sessions in IndexedDB, and exports clean 3D assets.
8. **Color Mathematics (`src/core/colorMath.ts`)**: Precise perceptual color space conversions (sRGB, Linear RGB, OKLab, OKLCH) for natural blending.
9. **Application Shell & UI Controls (`src/App.tsx`, `src/components/`, `src/hooks/`, `src/utils/`)**: React application root, touch navigator spheres, sliders, layers, modals, and device haptic vibrations.

## Summary by Directory

| Directory / Subsystem | Total Functions / Methods |
| :--- | :--- |
| `src/App.tsx` | 21 |
| `src/components` | 369 |
| `src/core` | 762 |
| `src/engine` | 5 |
| `src/hooks` | 7 |
| `src/icons` | 2 |
| `src/main.tsx` | 3 |
| `src/presets` | 9 |
| `src/registerServiceWorker.ts` | 4 |
| `src/utils` | 43 |
| **Total** | **1,225** |

## Complete Inventory of Functions & Methods

### App.tsx

#### [src/App.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`readCanvasPreferences`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L146) | arrow/var | 146 | No |
| [`synchronizeBrushSettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L175) | arrow/var | 175 | No |
| [`readLastBrushPreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L191) | arrow/var | 191 | No |
| [`App`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L243) | function | 243 | Yes |
| [`handleControllerChange`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L351) | arrow/var | 351 | No |
| [`handleToggleNavigator`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L371) | arrow/var | 371 | No |
| [`handleToggleGizmo`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L391) | arrow/var | 391 | No |
| [`handleNavigatorStyleChange`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L428) | arrow/var | 428 | No |
| [`handleToggleSound`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L448) | arrow/var | 448 | No |
| [`handleResize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L479) | arrow/var | 479 | No |
| [`handleDebugPointer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L943) | arrow/var | 943 | No |
| [`handleModelsChanged`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L995) | arrow/var | 995 | No |
| [`handleToggleTheme`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L1133) | arrow/var | 1133 | No |
| [`handleSetTheme`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L1142) | arrow/var | 1142 | No |
| [`handleToggleGrid`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L1415) | arrow/var | 1415 | No |
| [`handleTogglePlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L1422) | arrow/var | 1422 | No |
| [`handleCycleLighting`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L1461) | arrow/var | 1461 | No |
| [`handleResetCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L1469) | arrow/var | 1469 | No |
| [`handleDragOver`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L1547) | arrow/var | 1547 | No |
| [`handleDragLeave`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L1552) | arrow/var | 1552 | No |
| [`handleDrop`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/App.tsx#L1559) | arrow/var | 1559 | No |

### components/ARViewerModal.tsx

#### [src/components/ARViewerModal.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ARViewerModal.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`ARViewerModal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ARViewerModal.tsx#L25) | arrow/var | 25 | Yes |
| [`checkXR`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ARViewerModal.tsx#L48) | arrow/var | 48 | No |
| [`handleStartRealAR`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ARViewerModal.tsx#L68) | arrow/var | 68 | No |
| [`handleStopAR`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ARViewerModal.tsx#L89) | arrow/var | 89 | No |
| [`handleElevationChange`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ARViewerModal.tsx#L98) | arrow/var | 98 | No |

### components/AutoSaveToast.tsx

#### [src/components/AutoSaveToast.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/AutoSaveToast.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`AutoSaveToast`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/AutoSaveToast.tsx#L15) | arrow/var | 15 | Yes |

### components/BentGuideModal.tsx

#### [src/components/BentGuideModal.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/BentGuideModal.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`BentGuideModal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/BentGuideModal.tsx#L28) | arrow/var | 28 | Yes |
| [`handleCreatePresetGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/BentGuideModal.tsx#L53) | arrow/var | 53 | No |
| [`handleRemoveGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/BentGuideModal.tsx#L68) | arrow/var | 68 | No |
| [`handleToggleVisibility`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/BentGuideModal.tsx#L75) | arrow/var | 75 | No |
| [`handleCreateFromActiveStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/BentGuideModal.tsx#L81) | arrow/var | 81 | No |
| [`handleUpdateSelected`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/BentGuideModal.tsx#L96) | arrow/var | 96 | No |

### components/CameraRecoveryPill.tsx

#### [src/components/CameraRecoveryPill.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CameraRecoveryPill.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`CameraRecoveryPill`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CameraRecoveryPill.tsx#L12) | arrow/var | 12 | Yes |

### components/common

#### [src/components/common/Model3DPreview.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/common/Model3DPreview.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`Model3DPreview`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/common/Model3DPreview.tsx#L31) | arrow/var | 31 | Yes |
| [`onVisChange`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/common/Model3DPreview.tsx#L164) | arrow/var | 164 | No |
| [`animate`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/common/Model3DPreview.tsx#L174) | arrow/var | 174 | No |
| [`setupLoadedObject`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/common/Model3DPreview.tsx#L266) | arrow/var | 266 | No |

#### [src/components/common/RealBrushSizeControl.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/common/RealBrushSizeControl.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`RealBrushSizeControl`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/common/RealBrushSizeControl.tsx#L11) | arrow/var | 11 | Yes |

#### [src/components/common/StudioCloseButton.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/common/StudioCloseButton.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`StudioCloseButton`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/common/StudioCloseButton.tsx#L13) | arrow/var | 13 | Yes |

### components/CompactColorStudioModal.tsx

#### [src/components/CompactColorStudioModal.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`ColorStudioModal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L122) | arrow/var | 122 | Yes |
| [`toggleMiniMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L165) | arrow/var | 165 | No |
| [`handleUniformChange`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L324) | arrow/var | 324 | No |
| [`togglePinned`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L337) | arrow/var | 337 | No |
| [`onKeyDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L372) | arrow/var | 372 | No |
| [`showColorPicker`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L380) | arrow/var | 380 | No |
| [`closeColorStudio`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L386) | arrow/var | 386 | No |
| [`applyHsv`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L409) | arrow/var | 409 | No |
| [`pointerPosition`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L494) | arrow/var | 494 | No |
| [`updateHue`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L501) | arrow/var | 501 | No |
| [`updateSatVal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L506) | arrow/var | 506 | No |
| [`handleWheelPointerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L511) | arrow/var | 511 | No |
| [`handleWheelPointerMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L523) | arrow/var | 523 | No |
| [`handleWheelPointerUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L529) | arrow/var | 529 | No |
| [`handleOklchChange`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L540) | arrow/var | 540 | No |
| [`applyPreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L554) | arrow/var | 554 | No |
| [`applyMatcapTextureAndSettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L645) | arrow/var | 645 | No |
| [`slider`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L749) | arrow/var | 749 | No |
| [`baseColorControl`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CompactColorStudioModal.tsx#L758) | arrow/var | 758 | No |

### components/CurveDecimateModal.tsx

#### [src/components/CurveDecimateModal.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CurveDecimateModal.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`CurveDecimateModal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CurveDecimateModal.tsx#L24) | arrow/var | 24 | Yes |
| [`handleApplyDecimation`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CurveDecimateModal.tsx#L41) | arrow/var | 41 | No |

### components/CustomMirrorModal.tsx

#### [src/components/CustomMirrorModal.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CustomMirrorModal.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`CustomMirrorModal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CustomMirrorModal.tsx#L33) | arrow/var | 33 | Yes |
| [`handleAlignToCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CustomMirrorModal.tsx#L60) | arrow/var | 60 | No |
| [`handleResetToCenter`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CustomMirrorModal.tsx#L82) | arrow/var | 82 | No |
| [`handleToggleEnable`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/CustomMirrorModal.tsx#L104) | arrow/var | 104 | No |

### components/debug

#### [src/components/debug/DebugTestPanel.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/debug/DebugTestPanel.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`DebugTestPanel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/debug/DebugTestPanel.tsx#L39) | arrow/var | 39 | Yes |
| [`handlePointer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/debug/DebugTestPanel.tsx#L187) | arrow/var | 187 | No |
| [`handleCopyReport`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/debug/DebugTestPanel.tsx#L207) | arrow/var | 207 | No |
| [`toggleSimOffline`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/debug/DebugTestPanel.tsx#L231) | arrow/var | 231 | No |
| [`toggleSimAutosaveFail`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/debug/DebugTestPanel.tsx#L237) | arrow/var | 237 | No |
| [`toggleSimExportFail`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/debug/DebugTestPanel.tsx#L243) | arrow/var | 243 | No |
| [`toggleSimReducedMotion`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/debug/DebugTestPanel.tsx#L249) | arrow/var | 249 | No |
| [`toggleFpsOverlay`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/debug/DebugTestPanel.tsx#L256) | arrow/var | 256 | No |
| [`togglePointerDiagnostics`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/debug/DebugTestPanel.tsx#L262) | arrow/var | 262 | No |

### components/DeferredPanel.tsx

#### [src/components/DeferredPanel.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/DeferredPanel.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`DeferredPanel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/DeferredPanel.tsx#L21) | arrow/var | 21 | Yes |

### components/DeviceSimulatorFrame.tsx

#### [src/components/DeviceSimulatorFrame.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/DeviceSimulatorFrame.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`DeviceSimulatorFrame`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/DeviceSimulatorFrame.tsx#L55) | arrow/var | 55 | Yes |
| [`handleResize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/DeviceSimulatorFrame.tsx#L90) | arrow/var | 90 | No |
| [`handleSelectDevice`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/DeviceSimulatorFrame.tsx#L100) | arrow/var | 100 | No |

### components/ExportModal.tsx

#### [src/components/ExportModal.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ExportModal.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`ExportModal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ExportModal.tsx#L16) | arrow/var | 16 | Yes |
| [`handleKeyDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ExportModal.tsx#L27) | arrow/var | 27 | No |
| [`handleExportGLB`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ExportModal.tsx#L37) | arrow/var | 37 | No |
| [`handleExportOBJ`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ExportModal.tsx#L58) | arrow/var | 58 | No |
| [`handleExportUVTexture`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ExportModal.tsx#L79) | arrow/var | 79 | No |
| [`handleCaptureSnapshot`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ExportModal.tsx#L102) | arrow/var | 102 | No |
| [`handleSaveToLibrary`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ExportModal.tsx#L125) | arrow/var | 125 | No |

### components/FloatingReferenceClipboard.tsx

#### [src/components/FloatingReferenceClipboard.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FloatingReferenceClipboard.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`FloatingReferenceClipboard`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FloatingReferenceClipboard.tsx#L37) | arrow/var | 37 | Yes |
| [`handlePaste`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FloatingReferenceClipboard.tsx#L69) | arrow/var | 69 | No |
| [`handleMouseMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FloatingReferenceClipboard.tsx#L97) | arrow/var | 97 | No |
| [`handleMouseUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FloatingReferenceClipboard.tsx#L107) | arrow/var | 107 | No |
| [`addImageItem`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FloatingReferenceClipboard.tsx#L122) | arrow/var | 122 | No |
| [`handleFileUpload`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FloatingReferenceClipboard.tsx#L146) | arrow/var | 146 | No |
| [`updateActiveItem`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FloatingReferenceClipboard.tsx#L165) | arrow/var | 165 | No |
| [`handleDeleteItem`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FloatingReferenceClipboard.tsx#L172) | arrow/var | 172 | No |

### components/FpsCounter.tsx

#### [src/components/FpsCounter.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FpsCounter.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`FpsCounterComponent`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FpsCounter.tsx#L21) | arrow/var | 21 | No |
| [`onDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FpsCounter.tsx#L44) | arrow/var | 44 | No |
| [`onMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FpsCounter.tsx#L48) | arrow/var | 48 | No |
| [`onUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FpsCounter.tsx#L53) | arrow/var | 53 | No |
| [`tick`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FpsCounter.tsx#L64) | arrow/var | 64 | No |
| [`handleToggle`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/FpsCounter.tsx#L94) | arrow/var | 94 | No |

### components/HolisticDNAInspector.tsx

#### [src/components/HolisticDNAInspector.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/HolisticDNAInspector.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`HolisticDNAInspector`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/HolisticDNAInspector.tsx#L25) | arrow/var | 25 | Yes |
| [`handleInject`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/HolisticDNAInspector.tsx#L35) | arrow/var | 35 | No |
| [`getSourceLabel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/HolisticDNAInspector.tsx#L44) | arrow/var | 44 | No |

### components/LayerPanel.tsx

#### [src/components/LayerPanel.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`LayerPanelComponent`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L76) | arrow/var | 76 | Yes |
| [`getInheritedState`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L98) | arrow/var | 98 | No |
| [`getNodeDepth`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L119) | arrow/var | 119 | No |
| [`isAncestorCollapsed`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L134) | arrow/var | 134 | No |
| [`handleAddLayer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L152) | arrow/var | 152 | No |
| [`handleAddGroup`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L170) | arrow/var | 170 | No |
| [`handleToggleCollapse`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L190) | arrow/var | 190 | No |
| [`handleDuplicate`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L197) | arrow/var | 197 | No |
| [`handleDelete`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L220) | arrow/var | 220 | No |
| [`performDelete`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L237) | arrow/var | 237 | No |
| [`handleToggleVisibility`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L262) | arrow/var | 262 | No |
| [`handleToggleLock`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L269) | arrow/var | 269 | No |
| [`handleSetOpacity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L276) | arrow/var | 276 | No |
| [`handleSetColorTag`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L282) | arrow/var | 282 | No |
| [`handleMoveUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L289) | arrow/var | 289 | No |
| [`handleMoveDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L301) | arrow/var | 301 | No |
| [`handleIndent`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L314) | arrow/var | 314 | No |
| [`handleOutdent`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L330) | arrow/var | 330 | No |
| [`handleStartRename`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L340) | arrow/var | 340 | No |
| [`handleSaveRename`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LayerPanel.tsx#L346) | arrow/var | 346 | No |

### components/LiquifyPanel.tsx

#### [src/components/LiquifyPanel.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LiquifyPanel.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`LiquifyPanel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LiquifyPanel.tsx#L33) | arrow/var | 33 | Yes |
| [`updateSetting`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/LiquifyPanel.tsx#L53) | arrow/var | 53 | No |

### components/modals

#### [src/components/modals/AppModalHost.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/modals/AppModalHost.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`loadColorStudioModal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/modals/AppModalHost.tsx#L45) | arrow/var | 45 | No |
| [`AppModalHost`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/modals/AppModalHost.tsx#L122) | arrow/var | 122 | Yes |
| [`warm`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/modals/AppModalHost.tsx#L177) | arrow/var | 177 | No |

### components/ModelLibraryModal.tsx

#### [src/components/ModelLibraryModal.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ModelLibraryModal.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`ModelLibraryModal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ModelLibraryModal.tsx#L30) | arrow/var | 30 | Yes |
| [`handleSetLoadChoice`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ModelLibraryModal.tsx#L92) | arrow/var | 92 | No |
| [`executeOrPrompt`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ModelLibraryModal.tsx#L99) | arrow/var | 99 | No |
| [`handleSelectPreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ModelLibraryModal.tsx#L111) | arrow/var | 111 | No |
| [`handleSelectSavedModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ModelLibraryModal.tsx#L128) | arrow/var | 128 | No |
| [`handleDeleteSavedModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ModelLibraryModal.tsx#L146) | arrow/var | 146 | No |
| [`handleUrlLoad`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ModelLibraryModal.tsx#L156) | arrow/var | 156 | No |
| [`handleFileUpload`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ModelLibraryModal.tsx#L192) | arrow/var | 192 | No |
| [`handleDrop`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ModelLibraryModal.tsx#L228) | arrow/var | 228 | No |

### components/pro

#### [src/components/pro/CreatePanel.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/CreatePanel.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`CreatePanel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/CreatePanel.tsx#L50) | arrow/var | 50 | Yes |
| [`handleSpawn`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/CreatePanel.tsx#L66) | arrow/var | 66 | No |

#### [src/components/pro/DeformPanel.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/DeformPanel.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`DeformPanel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/DeformPanel.tsx#L40) | arrow/var | 40 | Yes |
| [`handleStartPushPull`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/DeformPanel.tsx#L65) | arrow/var | 65 | No |
| [`handleApplyPushPull`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/DeformPanel.tsx#L75) | arrow/var | 75 | No |
| [`handleCancelPushPull`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/DeformPanel.tsx#L85) | arrow/var | 85 | No |
| [`handleToggleAxis`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/DeformPanel.tsx#L95) | arrow/var | 95 | No |
| [`handleAlignMirrorToView`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/DeformPanel.tsx#L107) | arrow/var | 107 | No |
| [`handleRunSimplify`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/DeformPanel.tsx#L116) | arrow/var | 116 | No |

#### [src/components/pro/ProPanel.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/ProPanel.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`ProPanel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/ProPanel.tsx#L82) | arrow/var | 82 | Yes |
| [`handleDockChange`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/ProPanel.tsx#L129) | arrow/var | 129 | No |

#### [src/components/pro/ProRail.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/ProRail.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`ProRail`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/ProRail.tsx#L88) | arrow/var | 88 | Yes |
| [`closeColorStudio`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/ProRail.tsx#L105) | arrow/var | 105 | No |
| [`onDockChange`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/ProRail.tsx#L165) | arrow/var | 165 | No |
| [`selectPlacement`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/ProRail.tsx#L224) | arrow/var | 224 | No |

#### [src/components/pro/ProShell.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/ProShell.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`ProShell`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/ProShell.tsx#L11) | arrow/var | 11 | Yes |

#### [src/components/pro/SelectionActionBar.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionActionBar.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`SelectionActionBar`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionActionBar.tsx#L20) | arrow/var | 20 | Yes |
| [`handleCloneClick`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionActionBar.tsx#L32) | arrow/var | 32 | No |
| [`handleDeleteClick`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionActionBar.tsx#L38) | arrow/var | 38 | No |
| [`handleResetClick`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionActionBar.tsx#L44) | arrow/var | 44 | No |
| [`handleDeselectClick`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionActionBar.tsx#L50) | arrow/var | 50 | No |

#### [src/components/pro/SelectionFrame.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`overlaps`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx#L49) | arrow/var | 49 | No |
| [`SelectionFrame`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx#L57) | arrow/var | 57 | Yes |
| [`onNavigatorActive`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx#L78) | arrow/var | 78 | No |
| [`readObstacles`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx#L112) | arrow/var | 112 | No |
| [`tick`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx#L127) | arrow/var | 127 | No |
| [`layout`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx#L156) | arrow/var | 156 | No |
| [`place`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx#L190) | arrow/var | 190 | No |
| [`clampX`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx#L193) | arrow/var | 193 | No |
| [`beginHandleDrag`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx#L233) | arrow/var | 233 | No |
| [`moveHandleDrag`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx#L253) | arrow/var | 253 | No |
| [`endHandleDrag`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx#L276) | arrow/var | 276 | No |
| [`handleProps`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectionFrame.tsx#L285) | arrow/var | 285 | No |

#### [src/components/pro/SelectPanel.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectPanel.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`SelectPanel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectPanel.tsx#L51) | arrow/var | 51 | Yes |
| [`refresh`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectPanel.tsx#L74) | arrow/var | 74 | No |
| [`pickSelectionMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectPanel.tsx#L90) | arrow/var | 90 | No |
| [`pickTransformMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectPanel.tsx#L96) | arrow/var | 96 | No |
| [`segmentClass`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectPanel.tsx#L120) | arrow/var | 120 | No |
| [`actionClass`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/SelectPanel.tsx#L131) | arrow/var | 131 | No |

#### [src/components/pro/StudioIcons.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/StudioIcons.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`wrap`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/StudioIcons.tsx#L62) | arrow/var | 62 | No |
| [`Icon`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/pro/StudioIcons.tsx#L63) | arrow/var | 63 | No |

### components/ProjectSessionModal.tsx

#### [src/components/ProjectSessionModal.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ProjectSessionModal.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`ProjectSessionModal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ProjectSessionModal.tsx#L33) | arrow/var | 33 | Yes |
| [`handleSave`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ProjectSessionModal.tsx#L75) | arrow/var | 75 | No |
| [`handleSaveToFolder`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ProjectSessionModal.tsx#L92) | arrow/var | 92 | No |
| [`handleLoad`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ProjectSessionModal.tsx#L111) | arrow/var | 111 | No |
| [`handleDelete`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ProjectSessionModal.tsx#L122) | arrow/var | 122 | No |
| [`handleFileChange`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ProjectSessionModal.tsx#L134) | arrow/var | 134 | No |

### components/RenderSettingsPanel.tsx

#### [src/components/RenderSettingsPanel.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/RenderSettingsPanel.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`RenderSettingsPanelComponent`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/RenderSettingsPanel.tsx#L30) | arrow/var | 30 | Yes |
| [`update`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/RenderSettingsPanel.tsx#L44) | arrow/var | 44 | No |
| [`handleManualRecalculate`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/RenderSettingsPanel.tsx#L54) | arrow/var | 54 | No |

### components/ScaffoldingModal.tsx

#### [src/components/ScaffoldingModal.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ScaffoldingModal.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`ScaffoldingModal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ScaffoldingModal.tsx#L88) | arrow/var | 88 | Yes |
| [`handleSpawnProxy`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ScaffoldingModal.tsx#L130) | arrow/var | 130 | No |
| [`handleSpawnPrimitive`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ScaffoldingModal.tsx#L138) | arrow/var | 138 | No |
| [`handleImportCollisionMesh`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ScaffoldingModal.tsx#L162) | arrow/var | 162 | No |
| [`handleRemoveScaffold`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ScaffoldingModal.tsx#L183) | arrow/var | 183 | No |
| [`handleUpdateScaffold`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ScaffoldingModal.tsx#L190) | arrow/var | 190 | No |

### components/ScreenCenterCrosshair.tsx

#### [src/components/ScreenCenterCrosshair.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ScreenCenterCrosshair.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`ScreenCenterCrosshair`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ScreenCenterCrosshair.tsx#L12) | arrow/var | 12 | Yes |

### components/ShaderPresetManager.tsx

#### [src/components/ShaderPresetManager.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getPresetSourceFile`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L27) | function | 27 | No |
| [`Shader3DSphereModal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L49) | arrow/var | 49 | No |
| [`onPointerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L131) | arrow/var | 131 | No |
| [`onPointerMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L136) | arrow/var | 136 | No |
| [`onPointerUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L145) | arrow/var | 145 | No |
| [`animate`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L157) | arrow/var | 157 | No |
| [`onResize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L173) | arrow/var | 173 | No |
| [`ShaderPresetManager`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L340) | arrow/var | 340 | Yes |
| [`showToast`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L362) | arrow/var | 362 | No |
| [`selectAllVisible`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L396) | arrow/var | 396 | No |
| [`deselectAll`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L404) | arrow/var | 404 | No |
| [`invertSelection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L408) | arrow/var | 408 | No |
| [`copySelectedList`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L420) | arrow/var | 420 | No |
| [`executeDeleteSelected`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ShaderPresetManager.tsx#L439) | arrow/var | 439 | No |

### components/SimpleSceneIlluminationModal.tsx

#### [src/components/SimpleSceneIlluminationModal.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`SimpleSceneIlluminationModal`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx#L28) | arrow/var | 28 | Yes |
| [`handleDomePointerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx#L164) | arrow/var | 164 | No |
| [`handleDomePointerMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx#L175) | arrow/var | 175 | No |
| [`handleDomePointerUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx#L182) | arrow/var | 182 | No |
| [`handleHeaderPointerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx#L190) | arrow/var | 190 | No |
| [`handleHeaderPointerMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx#L206) | arrow/var | 206 | No |
| [`handleHeaderPointerUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx#L216) | arrow/var | 216 | No |
| [`handleHeaderTouchStart`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx#L226) | arrow/var | 226 | No |
| [`handleHeaderTouchMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx#L231) | arrow/var | 231 | No |
| [`handleHeaderTouchEnd`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx#L241) | arrow/var | 241 | No |
| [`handleKeyDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx#L248) | arrow/var | 248 | No |
| [`handleSelectPreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/SimpleSceneIlluminationModal.tsx#L256) | arrow/var | 256 | No |

### components/studio

#### [src/components/studio/BrushShapeGlyph.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/BrushShapeGlyph.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`BrushShapeGlyph`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/BrushShapeGlyph.tsx#L31) | arrow/var | 31 | Yes |

#### [src/components/studio/BrushStrokePreview.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/BrushStrokePreview.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`BrushStrokePreview`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/BrushStrokePreview.tsx#L8) | arrow/var | 8 | Yes |

#### [src/components/studio/FirstStrokeHint.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/FirstStrokeHint.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`FirstStrokeHint`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/FirstStrokeHint.tsx#L13) | arrow/var | 13 | Yes |

#### [src/components/studio/GuideControlBar.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/GuideControlBar.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`GuideControlBar`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/GuideControlBar.tsx#L21) | arrow/var | 21 | Yes |
| [`handleToggleMoveStretch`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/GuideControlBar.tsx#L44) | arrow/var | 44 | No |
| [`handleOpenSettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/GuideControlBar.tsx#L56) | arrow/var | 56 | No |
| [`handleDoneDrawOnGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/GuideControlBar.tsx#L65) | arrow/var | 65 | No |
| [`handleExitDrawingMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/GuideControlBar.tsx#L75) | arrow/var | 75 | No |
| [`handleDelete`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/GuideControlBar.tsx#L80) | arrow/var | 80 | No |
| [`handleDismissBar`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/GuideControlBar.tsx#L86) | arrow/var | 86 | No |

#### [src/components/studio/panelStore.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/panelStore.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`notify`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/panelStore.ts#L24) | function | 24 | No |
| [`getOpenSheet`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/panelStore.ts#L34) | function | 34 | Yes |
| [`openSheetId`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/panelStore.ts#L39) | function | 39 | Yes |
| [`closeSheet`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/panelStore.ts#L45) | function | 45 | Yes |
| [`toggleSheet`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/panelStore.ts#L52) | function | 52 | Yes |
| [`subscribeSheet`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/panelStore.ts#L57) | function | 57 | Yes |
| [`useOpenSheet`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/panelStore.ts#L64) | function | 64 | Yes |
| [`setStudioShelfOpen`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/panelStore.ts#L69) | function | 69 | Yes |
| [`useStudioShelfOpen`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/panelStore.ts#L75) | function | 75 | Yes |

#### [src/components/studio/ShapesSheet.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/ShapesSheet.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`ShapesSheet`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/ShapesSheet.tsx#L48) | arrow/var | 48 | Yes |
| [`update`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/ShapesSheet.tsx#L66) | arrow/var | 66 | No |

#### [src/components/studio/studioDockPreferences.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/studioDockPreferences.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`readStudioDockPreferences`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/studioDockPreferences.ts#L16) | arrow/var | 16 | Yes |
| [`writeStudioDockPreferences`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/studioDockPreferences.ts#L29) | arrow/var | 29 | Yes |

#### [src/components/studio/StudioImporter.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioImporter.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`StudioImporter`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioImporter.tsx#L37) | arrow/var | 37 | Yes |
| [`resetState`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioImporter.tsx#L81) | arrow/var | 81 | No |
| [`handleRotateAxis`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioImporter.tsx#L150) | arrow/var | 150 | No |
| [`handleResetOrientation`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioImporter.tsx#L158) | arrow/var | 158 | No |
| [`handleScalePreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioImporter.tsx#L165) | arrow/var | 165 | No |
| [`toggleTexture`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioImporter.tsx#L170) | arrow/var | 170 | No |
| [`performLoad`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioImporter.tsx#L175) | arrow/var | 175 | No |
| [`keepAndLoad`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioImporter.tsx#L235) | arrow/var | 235 | No |

#### [src/components/studio/StudioSettingsSheet.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioSettingsSheet.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`Row`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioSettingsSheet.tsx#L107) | arrow/var | 107 | No |
| [`SectionHeader`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioSettingsSheet.tsx#L128) | arrow/var | 128 | No |
| [`Toggle`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioSettingsSheet.tsx#L135) | arrow/var | 135 | No |
| [`StudioSettingsSheet`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioSettingsSheet.tsx#L156) | arrow/var | 156 | Yes |
| [`handleToggleSoundFeedback`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioSettingsSheet.tsx#L212) | arrow/var | 212 | No |
| [`updateDockPreferences`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioSettingsSheet.tsx#L221) | arrow/var | 221 | No |
| [`pill`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioSettingsSheet.tsx#L227) | arrow/var | 227 | No |

#### [src/components/studio/StudioSheet.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioSheet.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`StudioSheet`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioSheet.tsx#L24) | arrow/var | 24 | Yes |
| [`onKey`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioSheet.tsx#L40) | arrow/var | 40 | No |
| [`onPointerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioSheet.tsx#L44) | arrow/var | 44 | No |

#### [src/components/studio/StudioTopMoreMenu.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioTopMoreMenu.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`ActionButton`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioTopMoreMenu.tsx#L29) | arrow/var | 29 | No |
| [`StudioTopMoreMenu`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioTopMoreMenu.tsx#L49) | arrow/var | 49 | Yes |
| [`handleKeyDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioTopMoreMenu.tsx#L69) | arrow/var | 69 | No |
| [`closeWhenFocusLeaves`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioTopMoreMenu.tsx#L101) | arrow/var | 101 | No |
| [`select`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioTopMoreMenu.tsx#L110) | arrow/var | 110 | No |

#### [src/components/studio/StudioTopStrip.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioTopStrip.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`StudioTopStrip`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioTopStrip.tsx#L27) | arrow/var | 27 | Yes |
| [`isCurrentlyFullscreen`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioTopStrip.tsx#L43) | arrow/var | 43 | No |
| [`handleFullscreenChange`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/studio/StudioTopStrip.tsx#L60) | arrow/var | 60 | No |

### components/StylusRadialMenu.tsx

#### [src/components/StylusRadialMenu.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/StylusRadialMenu.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`StylusRadialMenu`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/StylusRadialMenu.tsx#L71) | arrow/var | 71 | Yes |
| [`triggerHaptic`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/StylusRadialMenu.tsx#L103) | arrow/var | 103 | No |

### components/TransformNavigator

#### [src/components/TransformNavigator/joystick/CollarJoystick.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/CollarJoystick.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`pt`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/CollarJoystick.tsx#L11) | arrow/var | 11 | No |
| [`CollarJoystick`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/CollarJoystick.tsx#L16) | arrow/var | 16 | Yes |
| [`centreOf`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/CollarJoystick.tsx#L37) | arrow/var | 37 | No |
| [`handleTabPointerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/CollarJoystick.tsx#L68) | arrow/var | 68 | No |
| [`onPointerMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/CollarJoystick.tsx#L78) | arrow/var | 78 | No |
| [`onPointerUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/CollarJoystick.tsx#L88) | arrow/var | 88 | No |

#### [src/components/TransformNavigator/joystick/DiscJoystick.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/DiscJoystick.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`polar`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/DiscJoystick.tsx#L12) | arrow/var | 12 | No |
| [`arcPath`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/DiscJoystick.tsx#L17) | function | 17 | No |
| [`DiscJoystick`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/DiscJoystick.tsx#L25) | arrow/var | 25 | Yes |
| [`handleAxisPointerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/DiscJoystick.tsx#L69) | arrow/var | 69 | No |
| [`onPointerMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/DiscJoystick.tsx#L79) | arrow/var | 79 | No |
| [`onPointerUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/DiscJoystick.tsx#L89) | arrow/var | 89 | No |

#### [src/components/TransformNavigator/joystick/dragUtils.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/dragUtils.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`useDrag`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/dragUtils.ts#L25) | function | 25 | Yes |
| [`useAngleDrag`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/dragUtils.ts#L82) | function | 82 | Yes |
| [`angleAt`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/dragUtils.ts#L90) | arrow/var | 90 | No |
| [`createStepper`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/dragUtils.ts#L115) | function | 115 | Yes |
| [`push`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/dragUtils.ts#L118) | method | 118 | No |

#### [src/components/TransformNavigator/joystick/JoystickShell.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/JoystickShell.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`JoystickShell`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/JoystickShell.tsx#L13) | arrow/var | 13 | Yes |

#### [src/components/TransformNavigator/joystick/PetalJoystick.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/PetalJoystick.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`pt`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/PetalJoystick.tsx#L13) | arrow/var | 13 | No |
| [`wedge`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/PetalJoystick.tsx#L18) | function | 18 | No |
| [`PetalJoystick`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/PetalJoystick.tsx#L28) | arrow/var | 28 | Yes |
| [`handlePetalPointerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/PetalJoystick.tsx#L75) | arrow/var | 75 | No |
| [`onPointerMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/PetalJoystick.tsx#L85) | arrow/var | 85 | No |
| [`onPointerUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/joystick/PetalJoystick.tsx#L95) | arrow/var | 95 | No |

#### [src/components/TransformNavigator/JoystickNavigator.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`JoystickNavigator`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L43) | arrow/var | 43 | Yes |
| [`setTransformMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L55) | arrow/var | 55 | No |
| [`handleResize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L101) | arrow/var | 101 | No |
| [`handleWindowPointerMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L130) | arrow/var | 130 | No |
| [`handleWindowPointerUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L147) | arrow/var | 147 | No |
| [`handleGlobalPointerUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L177) | arrow/var | 177 | No |
| [`handleGripPointerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L190) | arrow/var | 190 | No |
| [`handleGripPointerMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L217) | arrow/var | 217 | No |
| [`handleGripPointerUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L230) | arrow/var | 230 | No |
| [`handleResetPosition`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L237) | arrow/var | 237 | No |
| [`loop`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L278) | arrow/var | 278 | No |
| [`finish`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L368) | arrow/var | 368 | No |
| [`position`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L382) | arrow/var | 382 | No |
| [`dismiss`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L394) | arrow/var | 394 | No |
| [`escape`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/JoystickNavigator.tsx#L397) | arrow/var | 397 | No |

#### [src/components/TransformNavigator/NavigatorSettings.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/NavigatorSettings.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`NavigatorSettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/NavigatorSettings.tsx#L37) | function | 37 | Yes |
| [`tap`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/NavigatorSettings.tsx#L44) | arrow/var | 44 | No |

#### [src/components/TransformNavigator/Option3SphereNavigator.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`Option3SphereNavigator`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L80) | arrow/var | 80 | Yes |
| [`v`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L203) | arrow/var | 203 | No |
| [`cssPx`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L227) | arrow/var | 227 | No |
| [`fits`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L287) | arrow/var | 287 | No |
| [`metrics`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L489) | arrow/var | 489 | No |
| [`fitGizmo`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L497) | arrow/var | 497 | No |
| [`axisDir`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L518) | arrow/var | 518 | No |
| [`labelFont`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L550) | arrow/var | 550 | No |
| [`hubIcon`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L560) | arrow/var | 560 | No |
| [`pulse`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L592) | arrow/var | 592 | No |
| [`snap`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L898) | arrow/var | 898 | No |
| [`clampPos`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L900) | arrow/var | 900 | No |
| [`tick`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L904) | arrow/var | 904 | No |
| [`camBasis`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L910) | arrow/var | 910 | No |
| [`unitsPerPixel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L923) | arrow/var | 923 | No |
| [`pushHistory`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L934) | arrow/var | 934 | No |
| [`undo`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L942) | arrow/var | 942 | No |
| [`flyTo`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L956) | arrow/var | 956 | No |
| [`stepFlight`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1005) | arrow/var | 1005 | No |
| [`faceDirection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1024) | arrow/var | 1024 | No |
| [`gzPoint`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1031) | arrow/var | 1031 | No |
| [`pickHandle`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1039) | arrow/var | 1039 | No |
| [`setMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1052) | arrow/var | 1052 | No |
| [`setOrient`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1063) | arrow/var | 1063 | No |
| [`lookAtIt`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1070) | arrow/var | 1070 | No |
| [`resetTarget`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1088) | arrow/var | 1088 | No |
| [`stopTour`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1114) | arrow/var | 1114 | No |
| [`startTour`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1130) | arrow/var | 1130 | No |
| [`stepTour`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1150) | arrow/var | 1150 | No |
| [`byScope`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1232) | arrow/var | 1232 | No |
| [`onDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1316) | arrow/var | 1316 | No |
| [`onMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1372) | arrow/var | 1372 | No |
| [`onUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1494) | arrow/var | 1494 | No |
| [`onWheel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1538) | arrow/var | 1538 | No |
| [`onDocDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1567) | arrow/var | 1567 | No |
| [`loop`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1598) | arrow/var | 1598 | No |
| [`onResize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/TransformNavigator/Option3SphereNavigator.tsx#L1651) | arrow/var | 1651 | No |

### components/ui

#### [src/components/ui/MenuPrimitives.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ui/MenuPrimitives.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getMenuSurfaceClasses`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ui/MenuPrimitives.tsx#L15) | function | 15 | Yes |
| [`getMenuDividerClasses`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ui/MenuPrimitives.tsx#L21) | function | 21 | Yes |
| [`MenuHeader`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ui/MenuPrimitives.tsx#L75) | arrow/var | 75 | Yes |
| [`MenuSegmentedToggle`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ui/MenuPrimitives.tsx#L144) | function | 144 | Yes |
| [`MenuGridItem`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ui/MenuPrimitives.tsx#L213) | arrow/var | 213 | Yes |
| [`MenuSliderControl`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/ui/MenuPrimitives.tsx#L279) | arrow/var | 279 | Yes |

### components/Viewport.tsx

#### [src/components/Viewport.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`Viewport`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L94) | arrow/var | 94 | Yes |
| [`showNavPod`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L158) | arrow/var | 158 | No |
| [`refresh`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L204) | arrow/var | 204 | No |
| [`handleKeyDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L264) | arrow/var | 264 | No |
| [`showGestureToast`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L312) | arrow/var | 312 | No |
| [`triggerHaptic`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L322) | arrow/var | 322 | No |
| [`invalidate`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L411) | arrow/var | 411 | No |
| [`getSafeNormalizedPoint`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L427) | arrow/var | 427 | No |
| [`getNormalizedCoords`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L443) | arrow/var | 443 | No |
| [`onNavActive`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L462) | arrow/var | 462 | No |
| [`getFovDescription`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L474) | arrow/var | 474 | No |
| [`toContainerPoint`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L488) | arrow/var | 488 | No |
| [`isOverSelection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L493) | arrow/var | 493 | No |
| [`dragActionForMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L502) | arrow/var | 502 | No |
| [`selectAtPoint`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L509) | arrow/var | 509 | No |
| [`startSelectTransform`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L559) | arrow/var | 559 | No |
| [`dragSelectionBetween`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L565) | arrow/var | 565 | No |
| [`ndc`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L568) | arrow/var | 568 | No |
| [`applySelectTransform`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L574) | arrow/var | 574 | No |
| [`pinchValues`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L587) | arrow/var | 587 | No |
| [`updateLassoPath`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L598) | arrow/var | 598 | No |
| [`finishGesture`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L602) | arrow/var | 602 | No |
| [`handleSelectPointerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L608) | arrow/var | 608 | No |
| [`handleSelectPointerMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L654) | arrow/var | 654 | No |
| [`handleSelectPointerUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L740) | arrow/var | 740 | No |
| [`handlePointerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L794) | arrow/var | 794 | No |
| [`handlePointerMove`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L1104) | arrow/var | 1104 | No |
| [`handlePointerUp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L1390) | arrow/var | 1390 | No |
| [`handleWheel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L1501) | arrow/var | 1501 | No |
| [`handleContextMenu`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L1519) | arrow/var | 1519 | No |
| [`handleZoomIn`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L1532) | arrow/var | 1532 | No |
| [`handleZoomOut`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L1537) | arrow/var | 1537 | No |
| [`handleResetView`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L1542) | arrow/var | 1542 | No |
| [`handleToggleProjection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/Viewport.tsx#L1548) | arrow/var | 1548 | No |

### components/WorkLossDecisionSheet.tsx

#### [src/components/WorkLossDecisionSheet.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/WorkLossDecisionSheet.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`WorkLossDecisionSheet`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/WorkLossDecisionSheet.tsx#L16) | arrow/var | 16 | Yes |
| [`onKeyDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/components/WorkLossDecisionSheet.tsx#L34) | arrow/var | 34 | No |

### core/animatedShaders.ts

#### [src/core/animatedShaders.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/animatedShaders.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getEffectFragmentShader`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/animatedShaders.ts#L150) | function | 150 | Yes |
| [`register`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/animatedShaders.ts#L315) | method | 315 | No |
| [`unregister`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/animatedShaders.ts#L319) | method | 319 | No |
| [`setLightDirection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/animatedShaders.ts#L323) | method | 323 | No |
| [`setResolution`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/animatedShaders.ts#L327) | method | 327 | No |
| [`update`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/animatedShaders.ts#L331) | method | 331 | No |
| [`clear`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/animatedShaders.ts#L353) | method | 353 | No |

### core/cameraController.ts

#### [src/core/cameraController.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`markDirty`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L64) | method | 64 | No |
| [`getCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L68) | method | 68 | No |
| [`setNavigatorSensitivity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L72) | method | 72 | No |
| [`getNavigatorSensitivity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L76) | method | 76 | No |
| [`orbit`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L80) | method | 80 | No |
| [`orbitNavigator`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L90) | method | 90 | No |
| [`pan`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L102) | method | 102 | No |
| [`zoom`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L113) | method | 113 | No |
| [`getCameraSpherical`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L120) | method | 120 | No |
| [`orbitCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L128) | method | 128 | No |
| [`setCameraView`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L136) | method | 136 | No |
| [`zoomCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L151) | method | 151 | No |
| [`resetView`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L156) | method | 156 | No |
| [`resetCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L182) | method | 182 | No |
| [`setTargetPosition`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L186) | method | 186 | No |
| [`getFov`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L191) | method | 191 | No |
| [`setFov`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L195) | method | 195 | No |
| [`adjustFov`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L205) | method | 205 | No |
| [`getProjectionMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L210) | method | 210 | No |
| [`setProjectionMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L214) | method | 214 | No |
| [`toggleProjectionMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L226) | method | 226 | No |
| [`snapToView`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L232) | method | 232 | No |
| [`getPerfectView`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L265) | method | 265 | No |
| [`updateCameraPosition`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L303) | method | 303 | No |
| [`isCameraSettling`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L317) | method | 317 | No |
| [`resize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/cameraController.ts#L328) | method | 328 | No |

### core/colorMath.ts

#### [src/core/colorMath.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`srgbChannelToLinear`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L47) | function | 47 | Yes |
| [`linearChannelToSRGB`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L58) | function | 58 | Yes |
| [`srgbToLinearRGB`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L69) | function | 69 | Yes |
| [`linearRGBToSRGB`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L80) | function | 80 | Yes |
| [`linearRGBToLMS`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L99) | function | 99 | Yes |
| [`lmsToLinearRGB`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L114) | function | 114 | Yes |
| [`lmsToOKLab`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L130) | function | 130 | Yes |
| [`oklabToLMS`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L145) | function | 145 | Yes |
| [`linearRGBToOKLab`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L164) | function | 164 | Yes |
| [`oklabToLinearRGB`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L172) | function | 172 | Yes |
| [`hexToOKLab`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L180) | function | 180 | Yes |
| [`oklabToHex`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L190) | function | 190 | Yes |
| [`oklabToOKLCH`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L205) | function | 205 | Yes |
| [`oklchToOKLab`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L215) | function | 215 | Yes |
| [`hexToOKLCH`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L231) | function | 231 | Yes |
| [`oklchToHex`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L239) | function | 239 | Yes |
| [`hsvToRgb`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L257) | function | 257 | Yes |
| [`rgbToHsv`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L291) | function | 291 | Yes |
| [`hexToHsv`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L323) | function | 323 | Yes |
| [`hsvToHex`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L331) | function | 331 | Yes |
| [`hexToRgb`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L342) | function | 342 | Yes |
| [`rgbToHex`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L354) | function | 354 | Yes |
| [`oklabMix`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L380) | function | 380 | Yes |
| [`oklchMix`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L405) | function | 405 | Yes |
| [`generateOKLabGradient`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L450) | function | 450 | Yes |
| [`generateOKLCHGradient`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L463) | function | 463 | Yes |
| [`generateHarmonies`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L496) | function | 496 | Yes |
| [`makeColorAtHue`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L502) | arrow/var | 502 | No |
| [`posterizeOKLCH`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L585) | function | 585 | Yes |
| [`computeLinearIllumination`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L609) | function | 609 | Yes |
| [`convertColorArrayToLinearGLTF`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L665) | function | 665 | Yes |
| [`ensureGeometryLinearVertexColors`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/colorMath.ts#L688) | function | 688 | Yes |

### core/conformalBeadGenerator.ts

#### [src/core/conformalBeadGenerator.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`get`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L11) | method | 11 | No |
| [`reset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L18) | method | 18 | No |
| [`generateGeometry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L66) | method | 66 | No |
| [`updateBufferGeometry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L80) | method | 80 | No |
| [`applyDataToGeometry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L214) | method | 214 | No |
| [`computeBishopRMF`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L346) | method | 346 | No |
| [`populateTubeData`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L471) | method | 471 | No |
| [`populateRibbonData`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L580) | method | 580 | No |
| [`populateMarkerData`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L693) | method | 693 | No |
| [`populateConformalData`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L815) | method | 815 | No |
| [`addEndCap`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L904) | method | 904 | No |
| [`addRoundedRibbonCap`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L946) | method | 946 | No |
| [`addSphericalEndCap`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L1002) | method | 1002 | No |
| [`populateDabData`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L1041) | method | 1041 | No |
| [`resampleCurve`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/conformalBeadGenerator.ts#L1089) | method | 1089 | No |

### core/debugBridge.release.ts

#### [src/core/debugBridge.release.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/debugBridge.release.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`authorize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/debugBridge.release.ts#L3) | function | 3 | Yes |
| [`emitTelemetry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/debugBridge.release.ts#L7) | function | 7 | Yes |

### core/FastSurfaceRaycaster.ts

#### [src/core/FastSurfaceRaycaster.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/FastSurfaceRaycaster.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`setCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/FastSurfaceRaycaster.ts#L164) | method | 164 | No |
| [`setViewport`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/FastSurfaceRaycaster.ts#L173) | method | 173 | No |
| [`updateMeshBVH`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/FastSurfaceRaycaster.ts#L183) | method | 183 | No |
| [`updateMeshBVHAsync`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/FastSurfaceRaycaster.ts#L219) | method | 219 | No |
| [`updateObjectBVH`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/FastSurfaceRaycaster.ts#L243) | method | 243 | No |
| [`_evaluateAt`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/FastSurfaceRaycaster.ts#L254) | method | 254 | No |
| [`intersect`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/FastSurfaceRaycaster.ts#L384) | method | 384 | No |
| [`_calculateInterpolatedData`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/FastSurfaceRaycaster.ts#L417) | method | 417 | No |
| [`dispose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/FastSurfaceRaycaster.ts#L534) | method | 534 | No |

### core/layerCompositor.ts

#### [src/core/layerCompositor.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/layerCompositor.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`setRenderer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/layerCompositor.ts#L179) | method | 179 | No |
| [`getCompositeTexture`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/layerCompositor.ts#L183) | method | 183 | No |
| [`blendModeToEnum`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/layerCompositor.ts#L187) | method | 187 | No |
| [`composite`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/layerCompositor.ts#L208) | method | 208 | No |
| [`mergeTwoLayers`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/layerCompositor.ts#L269) | method | 269 | No |
| [`dispose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/layerCompositor.ts#L304) | method | 304 | No |

### core/lightingController.ts

#### [src/core/lightingController.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`initLightingAndStage`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L85) | method | 85 | No |
| [`setLightingPreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L140) | method | 140 | No |
| [`getStudioLightingState`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L161) | method | 161 | No |
| [`updateStudioExposure`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L168) | method | 168 | No |
| [`setStudioLightingMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L179) | method | 179 | No |
| [`setStudioSoftness`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L266) | method | 266 | No |
| [`setStudioLightDirection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L279) | method | 279 | No |
| [`setStudioLightIntensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L304) | method | 304 | No |
| [`setStudioLightColor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L317) | method | 317 | No |
| [`setStudioFloorShadow`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L330) | method | 330 | No |
| [`setStudioGridVisible`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L342) | method | 342 | No |
| [`applyStudioBackdrop`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L350) | method | 350 | No |
| [`random`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L374) | arrow/var | 374 | No |
| [`grainRandom`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L411) | arrow/var | 411 | No |
| [`setTheme`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L437) | method | 437 | No |
| [`toggleGrid`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L503) | method | 503 | No |
| [`setGrid`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L510) | method | 510 | No |
| [`ensureBaselineLighting`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/lightingController.ts#L514) | method | 514 | No |

### core/liquifyEngine.ts

#### [src/core/liquifyEngine.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`startSession`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L18) | method | 18 | No |
| [`beginSession`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L64) | method | 64 | No |
| [`applyDeformation`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L77) | method | 77 | No |
| [`toggleCompare`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L134) | method | 134 | No |
| [`commit`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L153) | method | 153 | No |
| [`discard`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L161) | method | 161 | No |
| [`decimateStrokes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L181) | method | 181 | No |
| [`applyDeformationRaw`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L215) | method | 215 | No |
| [`setCompareMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L296) | method | 296 | No |
| [`isCompareActive`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L300) | method | 300 | No |
| [`getCurrentDescriptors`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L307) | method | 307 | No |
| [`commitSession`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L315) | method | 315 | No |
| [`discardSession`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L327) | method | 327 | No |
| [`decimateCurveRDP`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L339) | method | 339 | No |
| [`getPerpendicularDistance`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L346) | arrow/var | 346 | No |
| [`rdpRecursive`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L361) | arrow/var | 361 | No |
| [`computeBishopFrames`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/liquifyEngine.ts#L409) | method | 409 | No |

### core/loftEngine.ts

#### [src/core/loftEngine.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getGuideRoot`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L15) | method | 15 | No |
| [`createBentGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L23) | method | 23 | No |
| [`updateBentGuideParameters`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L116) | method | 116 | No |
| [`toggleGuideVisibility`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L157) | method | 157 | No |
| [`buildSweptGeometry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L166) | method | 166 | No |
| [`removeBentGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L284) | method | 284 | No |
| [`removeGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L298) | method | 298 | No |
| [`getBentGuides`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L302) | method | 302 | No |
| [`getGuides`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L306) | method | 306 | No |
| [`createBentGuideFromPoints`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L310) | method | 310 | No |
| [`createPresetGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L320) | method | 320 | No |
| [`createOrUpdateMirrorPlaneMesh`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L372) | method | 372 | No |
| [`getActiveGuideMeshes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L381) | method | 381 | No |
| [`mirrorPointAcrossPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L395) | method | 395 | No |
| [`mirrorNormalAcrossPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L406) | method | 406 | No |
| [`updateCustomPlaneVisual`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L418) | method | 418 | No |
| [`dispose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/loftEngine.ts#L473) | method | 473 | No |

### core/materialCache.ts

#### [src/core/materialCache.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/materialCache.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`normalizeHexColor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/materialCache.ts#L15) | function | 15 | Yes |
| [`getStrokeMaterial`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/materialCache.ts#L49) | method | 49 | No |
| [`getPatternTexture`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/materialCache.ts#L372) | method | 372 | No |
| [`createSculptorClayMaterial`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/materialCache.ts#L502) | method | 502 | No |
| [`createModelDisplayMaterial`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/materialCache.ts#L519) | method | 519 | No |
| [`configureModelMaterial`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/materialCache.ts#L540) | method | 540 | No |
| [`clear`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/materialCache.ts#L554) | method | 554 | No |

### core/modelConverter.ts

#### [src/core/modelConverter.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getDRACOLoader`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L62) | method | 62 | No |
| [`getFormatFromFilename`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L74) | method | 74 | No |
| [`parseFiles`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L91) | method | 91 | No |
| [`loadByFormat`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L207) | method | 207 | No |
| [`normalizeMeshMaterials`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L332) | method | 332 | No |
| [`handleMat`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L345) | arrow/var | 345 | No |
| [`inspect`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L436) | method | 436 | No |
| [`applyTransforms`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L507) | method | 507 | No |
| [`bakeGeometryMatrices`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L570) | method | 570 | No |
| [`simplifyGeometry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L596) | method | 596 | No |
| [`simplifyObject`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L680) | method | 680 | No |
| [`fitToTarget`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L721) | method | 721 | No |
| [`fitTo1Meter`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L733) | method | 733 | No |
| [`detectUnitScale`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L740) | method | 740 | No |
| [`autoDetectOrientation`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L765) | method | 765 | No |
| [`exportToGLB`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L781) | method | 781 | No |
| [`generateThumbnail`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L868) | method | 868 | No |
| [`autoConvertAndSave`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelConverter.ts#L928) | method | 928 | No |

### core/modelExporter.ts

#### [src/core/modelExporter.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelExporter.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`exportModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelExporter.ts#L105) | method | 105 | No |
| [`optimizeTextures`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelExporter.ts#L311) | method | 311 | No |
| [`checkMap`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelExporter.ts#L317) | arrow/var | 317 | No |
| [`processMat`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelExporter.ts#L321) | arrow/var | 321 | No |

### core/modelLoader.ts

#### [src/core/modelLoader.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`loadFromFiles`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L129) | method | 129 | No |
| [`cleanupUrls`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L168) | arrow/var | 168 | No |
| [`loadFromUrl`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L274) | method | 274 | No |
| [`loadFromArrayBuffer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L286) | method | 286 | No |
| [`executeTier1Load`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L299) | method | 299 | No |
| [`executeTier2SafeLoad`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L409) | method | 409 | No |
| [`executeTier3VertexRecovery`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L436) | method | 436 | No |
| [`executeTier4PointCloudFallback`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L499) | method | 499 | No |
| [`detectMagicBytes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L540) | method | 540 | No |
| [`unpackZipArchive`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L564) | method | 564 | No |
| [`findPrimaryFile`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L582) | method | 582 | No |
| [`determineFormat`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L591) | method | 591 | No |
| [`sanitizeLoadedHierarchy`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L599) | method | 599 | No |
| [`processMaterial`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L671) | arrow/var | 671 | No |
| [`autoSlimDenseMeshes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L819) | method | 819 | No |
| [`simplifyBufferGeometry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L872) | method | 872 | No |
| [`calculateDeepMetadata`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L978) | method | 978 | No |
| [`measureTexture`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L1027) | arrow/var | 1027 | No |
| [`inspectMat`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelLoader.ts#L1040) | arrow/var | 1040 | No |

### core/modelNormalization.ts

#### [src/core/modelNormalization.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelNormalization.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`analyzeScale`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelNormalization.ts#L16) | method | 16 | No |
| [`normalizeModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelNormalization.ts#L50) | method | 50 | No |
| [`bakeTransforms`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelNormalization.ts#L86) | method | 86 | No |
| [`invertNormalsAndWinding`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelNormalization.ts#L128) | method | 128 | No |
| [`repairNormals`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelNormalization.ts#L167) | method | 167 | No |

### core/modelStorage.ts

#### [src/core/modelStorage.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelStorage.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getDB`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelStorage.ts#L10) | method | 10 | No |
| [`saveModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelStorage.ts#L45) | method | 45 | No |
| [`getAllModels`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelStorage.ts#L60) | method | 60 | No |
| [`getModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelStorage.ts#L80) | method | 80 | No |
| [`deleteModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelStorage.ts#L97) | method | 97 | No |
| [`renameModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelStorage.ts#L112) | method | 112 | No |
| [`getStorageUsage`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelStorage.ts#L122) | method | 122 | No |
| [`clearAllModels`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/modelStorage.ts#L155) | method | 155 | No |

### core/nativeDebugBridge.ts

#### [src/core/nativeDebugBridge.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/nativeDebugBridge.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`logDebugMessage`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/nativeDebugBridge.ts#L69) | function | 69 | Yes |
| [`getInMemoryLogs`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/nativeDebugBridge.ts#L82) | function | 82 | Yes |
| [`clearInMemoryLogs`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/nativeDebugBridge.ts#L86) | function | 86 | Yes |
| [`sanitizeDiagnosticString`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/nativeDebugBridge.ts#L93) | function | 93 | Yes |
| [`checkDebugAuthorization`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/nativeDebugBridge.ts#L107) | function | 107 | Yes |
| [`isNativeDebugAuthorized`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/nativeDebugBridge.ts#L126) | function | 126 | Yes |
| [`getCachedAuthData`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/nativeDebugBridge.ts#L130) | function | 130 | Yes |
| [`fetchNativeSystemDiagnostics`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/nativeDebugBridge.ts#L134) | function | 134 | Yes |
| [`broadcastTestTelemetry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/nativeDebugBridge.ts#L143) | function | 143 | Yes |

### core/onboardingStore.ts

#### [src/core/onboardingStore.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/onboardingStore.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`readStored`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/onboardingStore.ts#L19) | function | 19 | No |
| [`writeStored`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/onboardingStore.ts#L27) | function | 27 | No |
| [`notify`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/onboardingStore.ts#L35) | function | 35 | No |
| [`getHasOnboarded`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/onboardingStore.ts#L48) | function | 48 | Yes |
| [`setHasOnboarded`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/onboardingStore.ts#L52) | function | 52 | Yes |
| [`subscribeHasOnboarded`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/onboardingStore.ts#L59) | function | 59 | Yes |
| [`useHasOnboarded`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/onboardingStore.ts#L66) | function | 66 | Yes |

### core/platformBridge.ts

#### [src/core/platformBridge.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/platformBridge.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getHardwareReport`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/platformBridge.ts#L32) | method | 32 | No |
| [`saveFileToChosenFolder`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/platformBridge.ts#L49) | method | 49 | No |
| [`saveFileToPickedDirectory`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/platformBridge.ts#L137) | method | 137 | No |
| [`saveModelFile`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/platformBridge.ts#L179) | method | 179 | No |
| [`openModelFile`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/platformBridge.ts#L212) | method | 212 | No |
| [`triggerHaptic`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/platformBridge.ts#L245) | method | 245 | No |

### core/postProcessingEngine.ts

#### [src/core/postProcessingEngine.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/postProcessingEngine.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`targetWidth`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/postProcessingEngine.ts#L354) | method | 354 | No |
| [`targetHeight`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/postProcessingEngine.ts#L358) | method | 358 | No |
| [`bloomWidth`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/postProcessingEngine.ts#L362) | method | 362 | No |
| [`bloomHeight`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/postProcessingEngine.ts#L366) | method | 366 | No |
| [`ensureTargets`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/postProcessingEngine.ts#L378) | method | 378 | No |
| [`releaseTargets`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/postProcessingEngine.ts#L432) | method | 432 | No |
| [`setSize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/postProcessingEngine.ts#L443) | method | 443 | No |
| [`updateSettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/postProcessingEngine.ts#L464) | method | 464 | No |
| [`getSettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/postProcessingEngine.ts#L499) | method | 499 | No |
| [`render`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/postProcessingEngine.ts#L514) | method | 514 | No |
| [`dispose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/postProcessingEngine.ts#L574) | method | 574 | No |

### core/primitiveGenerator.ts

#### [src/core/primitiveGenerator.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/primitiveGenerator.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`createPrimitiveGeometry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/primitiveGenerator.ts#L5) | method | 5 | No |
| [`calculateStats`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/primitiveGenerator.ts#L84) | method | 84 | No |
| [`createPrimitiveMesh`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/primitiveGenerator.ts#L97) | method | 97 | No |

### core/proceduralSky.ts

#### [src/core/proceduralSky.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`setRenderer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L340) | method | 340 | No |
| [`setCustomOffBackground`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L345) | method | 345 | No |
| [`init`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L352) | method | 352 | No |
| [`setLights`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L410) | method | 410 | No |
| [`getPresetsList`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L423) | method | 423 | No |
| [`getCurrentPreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L427) | method | 427 | No |
| [`getSettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L431) | method | 431 | No |
| [`applyPreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L462) | method | 462 | No |
| [`setTimeOfDay`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L589) | method | 589 | No |
| [`getTimeOfDay`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L597) | method | 597 | No |
| [`setSunIntensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L601) | method | 601 | No |
| [`setSunColor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L605) | method | 605 | No |
| [`setAmbientIntensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L609) | method | 609 | No |
| [`setSunCoronaIntensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L613) | method | 613 | No |
| [`getIlluminationState`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L617) | method | 617 | No |
| [`setSunAngles`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L629) | method | 629 | No |
| [`setSunPositionVector`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L635) | method | 635 | No |
| [`updatePresetSettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L642) | method | 642 | No |
| [`setCloudCoverage`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L657) | method | 657 | No |
| [`setCloudDensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L661) | method | 661 | No |
| [`setCloudSpeed`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L665) | method | 665 | No |
| [`setCloudWindAngle`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L669) | method | 669 | No |
| [`setCloudScale`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L675) | method | 675 | No |
| [`setCloudTurbulence`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L681) | method | 681 | No |
| [`setCloudOpacity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L685) | method | 685 | No |
| [`setCloudColor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L689) | method | 689 | No |
| [`setCloudShadow`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L693) | method | 693 | No |
| [`setEnableClouds`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L697) | method | 697 | No |
| [`setEnableGodRays`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L701) | method | 701 | No |
| [`setGodRaysIntensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L705) | method | 705 | No |
| [`setGodRaysDensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L709) | method | 709 | No |
| [`setGodRaysDecay`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L713) | method | 713 | No |
| [`setGodRaysColor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L717) | method | 717 | No |
| [`update`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L721) | method | 721 | No |
| [`updateSkyReflection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L736) | method | 736 | No |
| [`dispose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/proceduralSky.ts#L779) | method | 779 | No |

### core/ProgressiveRayTracer.ts

#### [src/core/ProgressiveRayTracer.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`_initCapabilities`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L572) | method | 572 | No |
| [`enable`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L598) | method | 598 | No |
| [`setBloomEnabled`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L610) | method | 610 | No |
| [`setBloomIntensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L620) | method | 620 | No |
| [`reset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L628) | method | 628 | No |
| [`setQuality`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L637) | method | 637 | No |
| [`setSize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L662) | method | 662 | No |
| [`_createRenderTargets`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L678) | method | 678 | No |
| [`_disposeRenderTargets`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L707) | method | 707 | No |
| [`_checkCameraMovement`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L725) | method | 725 | No |
| [`_renderBloom`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L744) | method | 744 | No |
| [`render`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L770) | method | 770 | No |
| [`dispose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/ProgressiveRayTracer.ts#L914) | method | 914 | No |

### core/projectSerializer.ts

#### [src/core/projectSerializer.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/projectSerializer.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getInstance`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/projectSerializer.ts#L40) | method | 40 | No |
| [`exportProjectData`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/projectSerializer.ts#L50) | method | 50 | No |
| [`serializeStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/projectSerializer.ts#L55) | arrow/var | 55 | No |
| [`exportProjectFile`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/projectSerializer.ts#L162) | method | 162 | No |
| [`importProjectData`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/projectSerializer.ts#L178) | method | 178 | No |

### core/sampleModels.ts

#### [src/core/sampleModels.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getPresets`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L19) | method | 19 | No |
| [`createCyberHelmet`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L622) | method | 622 | No |
| [`createSculptedBust`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L695) | method | 695 | No |
| [`createCeramicVase`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L750) | method | 750 | No |
| [`createSciFiDrone`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L789) | method | 789 | No |
| [`createDrawingPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L840) | method | 840 | No |
| [`createTorusKnot`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L881) | method | 881 | No |
| [`createCube`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L900) | method | 900 | No |
| [`createSphere`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L918) | method | 918 | No |
| [`createCylinder`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L936) | method | 936 | No |
| [`createTorus`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L954) | method | 954 | No |
| [`createCapsule`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L972) | method | 972 | No |
| [`createCone`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L990) | method | 990 | No |
| [`createPyramid`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1008) | method | 1008 | No |
| [`createDisk`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1026) | method | 1026 | No |
| [`createProceduralGridTexture`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1044) | method | 1044 | No |
| [`createCyberDrone`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1068) | method | 1068 | No |
| [`createRoboticArm`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1159) | method | 1159 | No |
| [`createSciFiGenerator`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1227) | method | 1227 | No |
| [`createPusheenCat`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1292) | method | 1292 | No |
| [`createPompompurinDog`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1414) | method | 1414 | No |
| [`createPokemonCreature`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1481) | method | 1481 | No |
| [`createFantasyCottage`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1552) | method | 1552 | No |
| [`createCyberBike`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1581) | method | 1581 | No |
| [`createCapybaraBath`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1619) | method | 1619 | No |
| [`createFallbackModelForPreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1652) | method | 1652 | No |
| [`createRetroArcade`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/sampleModels.ts#L1683) | method | 1683 | No |

### core/scaffoldingEngine.ts

#### [src/core/scaffoldingEngine.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getScaffoldRoot`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts#L20) | method | 20 | No |
| [`getScaffolds`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts#L24) | method | 24 | No |
| [`getActiveColliderMeshes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts#L28) | method | 28 | No |
| [`createProxyScaffold`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts#L45) | method | 45 | No |
| [`loadCollisionMeshFromObject`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts#L78) | method | 78 | No |
| [`registerScaffold`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts#L138) | method | 138 | No |
| [`removeScaffold`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts#L156) | method | 156 | No |
| [`updateScaffold`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts#L175) | method | 175 | No |
| [`applyRenderMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts#L210) | method | 210 | No |
| [`getDefaultProxyName`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts#L271) | method | 271 | No |
| [`buildProxyGeometry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts#L291) | method | 291 | No |
| [`dispose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/scaffoldingEngine.ts#L483) | method | 483 | No |

### core/shapeSnapping.ts

#### [src/core/shapeSnapping.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`fitStraightLine3D_PCA`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L86) | function | 86 | Yes |
| [`fitStraightLine`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L236) | function | 236 | Yes |
| [`fitPolylineOrStraightLine`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L277) | function | 277 | Yes |
| [`NONE_RESULT`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L468) | arrow/var | 468 | No |
| [`snapStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L480) | method | 480 | No |
| [`score`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L585) | arrow/var | 585 | No |
| [`fitLine`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L603) | method | 603 | No |
| [`fitEllipse`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L703) | method | 703 | No |
| [`fitPolygon`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L768) | method | 768 | No |
| [`rmsAgainst`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L891) | arrow/var | 891 | No |
| [`fitArc`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L982) | method | 982 | No |
| [`normalize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1007) | arrow/var | 1007 | No |
| [`toConfidence`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1049) | method | 1049 | No |
| [`toPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1053) | method | 1053 | No |
| [`fromPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1058) | method | 1058 | No |
| [`screenBasisInPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1063) | method | 1063 | No |
| [`pointToSegment2D`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1077) | method | 1077 | No |
| [`makePoint`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1089) | method | 1089 | No |
| [`transformSnappedPoints`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1113) | method | 1113 | No |
| [`fitLineTotalLeastSquares`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1162) | function | 1162 | No |
| [`shortestSpanCorner`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1183) | function | 1183 | No |
| [`projectOnLine`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1195) | function | 1195 | No |
| [`intersectLines`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1201) | function | 1201 | No |
| [`squareUpQuad`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1218) | function | 1218 | No |
| [`corner`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1274) | arrow/var | 1274 | No |
| [`signedArea`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1295) | function | 1295 | No |
| [`fitCircleAlgebraic`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1306) | function | 1306 | No |
| [`solve3x3`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1342) | function | 1342 | No |
| [`fitConicDirect`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1374) | function | 1374 | Yes |
| [`invert3x3`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1462) | function | 1462 | No |
| [`eigenvectors3`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1481) | function | 1481 | No |
| [`cross3`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1516) | function | 1516 | No |
| [`solveCubic`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1525) | function | 1525 | No |
| [`conicToEllipse`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1558) | function | 1558 | Yes |
| [`ellipseDistance`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1601) | function | 1601 | Yes |
| [`f`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/shapeSnapping.ts#L1630) | arrow/var | 1630 | No |

### core/strokeFitting.ts

#### [src/core/strokeFitting.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`distanceToSegment`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L41) | function | 41 | Yes |
| [`simplifyPath`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L53) | function | 53 | Yes |
| [`cumulativeLengths`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L87) | function | 87 | Yes |
| [`detectCorners`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L107) | function | 107 | Yes |
| [`symmetricEigen3`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L160) | function | 160 | Yes |
| [`bestFitPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L215) | function | 215 | Yes |
| [`evaluateCubic`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L269) | function | 269 | Yes |
| [`cubicTangent`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L282) | function | 282 | No |
| [`chordLengthParameterize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L290) | function | 290 | No |
| [`generateBezier`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L300) | function | 300 | No |
| [`computeMaxError`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L361) | function | 361 | No |
| [`reparameterize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L380) | function | 380 | No |
| [`fitCubicRecursive`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L396) | function | 396 | No |
| [`smoothRun`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L474) | function | 474 | Yes |
| [`endTangent`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L500) | function | 500 | No |
| [`fitCubicPath`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L515) | function | 515 | Yes |
| [`sampleCubicPath`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L533) | function | 533 | Yes |
| [`rebuildStrokePoints`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L555) | function | 555 | Yes |
| [`refitStrokePoints`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeFitting.ts#L611) | function | 611 | Yes |

### core/strokePipeline.ts

#### [src/core/strokePipeline.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getSymmetryCount`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L59) | method | 59 | No |
| [`applySymmetry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L78) | method | 78 | No |
| [`updateActiveStrokeGeometry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L151) | method | 151 | No |
| [`purgeStrokesIntersecting`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L170) | method | 170 | No |
| [`sampleHolisticDNA`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L234) | method | 234 | No |
| [`cancelStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L329) | method | 329 | No |
| [`clearAllStrokes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L357) | method | 357 | No |
| [`purgeGroup`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L382) | arrow/var | 382 | No |
| [`deleteLayerStrokes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L407) | method | 407 | No |
| [`recalculateMeshNormals`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L427) | method | 427 | No |
| [`copyStrokes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L451) | method | 451 | No |
| [`copyStrokeIds`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L457) | method | 457 | No |
| [`copyMatchingStrokes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L462) | method | 462 | No |
| [`pasteStrokes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L492) | method | 492 | No |
| [`getClipboardCount`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L549) | method | 549 | No |
| [`raycastStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L556) | method | 556 | No |
| [`selectStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L584) | method | 584 | No |
| [`selectMultipleStrokes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L618) | method | 618 | No |
| [`getSelectedStrokeId`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L646) | method | 646 | No |
| [`getSelectedStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L650) | method | 650 | No |
| [`deleteSelectedStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L656) | method | 656 | No |
| [`recreateStrokeFromDescriptor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokePipeline.ts#L685) | method | 685 | No |

### core/strokeSmoother.ts

#### [src/core/strokeSmoother.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeSmoother.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`reset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeSmoother.ts#L29) | method | 29 | No |
| [`releaseTether`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeSmoother.ts#L39) | method | 39 | No |
| [`tetherLag`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeSmoother.ts#L48) | method | 48 | No |
| [`processPoint`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/strokeSmoother.ts#L57) | method | 57 | No |

### core/studioEngine.ts

#### [src/core/studioEngine.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`distanceToSegment`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L128) | function | 128 | No |
| [`refreshRect`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L749) | method | 749 | No |
| [`screenToWorld`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L762) | method | 762 | No |
| [`checkHover`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L805) | method | 805 | No |
| [`getDRACOLoader`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L813) | method | 813 | No |
| [`getModelMetadata`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L822) | method | 822 | No |
| [`getStrokeCount`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L831) | method | 831 | No |
| [`getStrokeIds`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L835) | method | 835 | No |
| [`eraseDebugTestStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L840) | method | 840 | No |
| [`setDebugModelFixture`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L848) | method | 848 | No |
| [`addDebugTestStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L869) | method | 869 | No |
| [`loadPresetModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L910) | method | 910 | No |
| [`setModelObject`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L969) | method | 969 | No |
| [`sanitizeMat`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1096) | arrow/var | 1096 | No |
| [`loadDirectObject3D`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1357) | method | 1357 | No |
| [`addPrimitiveToScene`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1365) | method | 1365 | No |
| [`snapActiveToGround`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1426) | method | 1426 | No |
| [`deleteActiveSelection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1433) | method | 1433 | No |
| [`selectLayer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1530) | method | 1530 | No |
| [`notifySelectionTargetChanged`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1540) | method | 1540 | No |
| [`getSelectionRevision`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1549) | method | 1549 | No |
| [`setSelectedStrokes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1553) | method | 1553 | No |
| [`getSelectedStrokeIds`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1559) | method | 1559 | No |
| [`getSelectionBox`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1564) | method | 1564 | No |
| [`getSelectionScreenRect`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1572) | method | 1572 | No |
| [`getSelectionSummary`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1597) | method | 1597 | No |
| [`plural`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1598) | arrow/var | 1598 | No |
| [`countLayerLines`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1599) | arrow/var | 1599 | No |
| [`pickSelectable`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1641) | method | 1641 | No |
| [`isCanvasSelected`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1671) | method | 1671 | No |
| [`findStrokeNearScreenPoint`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1675) | method | 1675 | No |
| [`deleteSelection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1700) | method | 1700 | No |
| [`cloneSelection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1735) | method | 1735 | No |
| [`lassoSelect`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1757) | method | 1757 | No |
| [`pointInPoly`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1767) | arrow/var | 1767 | No |
| [`toScreenInside`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1777) | arrow/var | 1777 | No |
| [`hasActiveDrawings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1810) | method | 1810 | No |
| [`loadGLTF`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1817) | method | 1817 | No |
| [`onLoad`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1844) | arrow/var | 1844 | No |
| [`loadOBJ`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1875) | method | 1875 | No |
| [`handleObj`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1877) | arrow/var | 1877 | No |
| [`loadUniversalFiles`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1923) | method | 1923 | No |
| [`raycastSpatialPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L1965) | method | 1965 | No |
| [`collectRaycastTargets`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2009) | method | 2009 | No |
| [`raycastModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2070) | method | 2070 | No |
| [`updateCursor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2153) | method | 2153 | No |
| [`hideCursor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2183) | method | 2183 | No |
| [`getStabilization`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2201) | method | 2201 | No |
| [`getSnapOptions`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2237) | method | 2237 | No |
| [`findNearestStrokeEndpoint`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2253) | method | 2253 | No |
| [`refitActiveStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2303) | method | 2303 | No |
| [`startStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2312) | method | 2312 | No |
| [`addStrokePoint`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2444) | method | 2444 | No |
| [`addStrokePointsBatch`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2815) | method | 2815 | No |
| [`commitActiveSegment`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2847) | method | 2847 | No |
| [`endStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L2888) | method | 2888 | No |
| [`snapActiveStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3072) | method | 3072 | No |
| [`purgeStrokesIntersecting`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3097) | method | 3097 | No |
| [`sampleHolisticDNA`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3105) | method | 3105 | No |
| [`cancelStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3117) | method | 3117 | No |
| [`updateActiveStrokeGeometry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3124) | method | 3124 | No |
| [`applySymmetry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3132) | method | 3132 | No |
| [`getSymmetryCount`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3136) | method | 3136 | No |
| [`undo`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3143) | method | 3143 | No |
| [`redo`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3218) | method | 3218 | No |
| [`setActiveLayer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3284) | method | 3284 | No |
| [`getActiveLayerId`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3292) | method | 3292 | No |
| [`syncLayers`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3299) | method | 3299 | No |
| [`getEffectiveState`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3306) | arrow/var | 3306 | No |
| [`mergeLayerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3353) | method | 3353 | No |
| [`clearAllStrokes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3370) | method | 3370 | No |
| [`setDrawingCanvasSize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3394) | method | 3394 | No |
| [`setDrawingCanvasOpacity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3416) | method | 3416 | No |
| [`setDrawingCanvasColor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3439) | method | 3439 | No |
| [`deleteLayerStrokes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3455) | method | 3455 | No |
| [`recalculateMeshNormals`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3462) | method | 3462 | No |
| [`clearModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3469) | method | 3469 | No |
| [`setupDefaultDrawingPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3549) | method | 3549 | No |
| [`notifyModelsChanged`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3644) | method | 3644 | No |
| [`getLoadedModels`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3654) | method | 3654 | No |
| [`setActiveSelectedModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3675) | method | 3675 | No |
| [`getActiveSelectedModelId`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3682) | method | 3682 | No |
| [`getDrawingPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3686) | method | 3686 | No |
| [`getModelRoot`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3690) | method | 3690 | No |
| [`getStrokeRoot`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3694) | method | 3694 | No |
| [`toggleDrawingPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3698) | method | 3698 | No |
| [`copyStrokes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3716) | method | 3716 | No |
| [`pasteStrokes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3723) | method | 3723 | No |
| [`getClipboardCount`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3730) | method | 3730 | No |
| [`setNavigatorSensitivity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3734) | method | 3734 | No |
| [`getNavigatorSensitivity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3738) | method | 3738 | No |
| [`raycastStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3745) | method | 3745 | No |
| [`selectStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3752) | method | 3752 | No |
| [`getSelectedStrokeId`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3756) | method | 3756 | No |
| [`getSelectedStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3760) | method | 3760 | No |
| [`deleteSelectedStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3764) | method | 3764 | No |
| [`getLayersSnapshot`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3768) | method | 3768 | No |
| [`recreateStrokeFromDescriptor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3775) | method | 3775 | No |
| [`getSerializationState`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3779) | method | 3779 | No |
| [`exportProjectData`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3808) | method | 3808 | No |
| [`exportProjectFile`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3815) | method | 3815 | No |
| [`importProjectData`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3822) | method | 3822 | No |
| [`orbit`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3861) | method | 3861 | No |
| [`orbitNavigator`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3866) | method | 3866 | No |
| [`pan`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3870) | method | 3870 | No |
| [`zoom`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3874) | method | 3874 | No |
| [`getCameraSpherical`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3878) | method | 3878 | No |
| [`orbitCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3882) | method | 3882 | No |
| [`setCameraView`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3886) | method | 3886 | No |
| [`zoomCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3890) | method | 3890 | No |
| [`updateGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3894) | method | 3894 | No |
| [`resetView`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3927) | method | 3927 | No |
| [`setTargetPosition`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3934) | method | 3934 | No |
| [`getSelectionCenter`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3945) | method | 3945 | No |
| [`getScreenCenterWorldAnchor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3952) | method | 3952 | No |
| [`beginTransform`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3959) | method | 3959 | No |
| [`endTransform`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3966) | method | 3966 | No |
| [`applyTransformMatrix`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3973) | method | 3973 | No |
| [`translateScreenExact`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3982) | method | 3982 | No |
| [`dragSelection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3987) | method | 3987 | No |
| [`rotateAroundViewAxis`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L3992) | method | 3992 | No |
| [`translateScreenSpace`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4000) | method | 4000 | No |
| [`scaleScreenSpace`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4013) | method | 4013 | No |
| [`rotateScreenSpace`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4026) | method | 4026 | No |
| [`translateWorldAxis`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4038) | method | 4038 | No |
| [`rotateWorldAxis`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4050) | method | 4050 | No |
| [`rotateTrackball`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4063) | method | 4063 | No |
| [`translateOnPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4076) | method | 4076 | No |
| [`rotateOnPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4088) | method | 4088 | No |
| [`alignSurfaceToCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4099) | method | 4099 | No |
| [`setSurfaceOrientation`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4106) | method | 4106 | No |
| [`translateAxis3D`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4113) | method | 4113 | No |
| [`rotateAxis3D`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4124) | method | 4124 | No |
| [`scaleAxis`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4138) | method | 4138 | No |
| [`scaleAxis3D`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4150) | method | 4150 | No |
| [`snapModelToGround`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4160) | method | 4160 | No |
| [`getPerfectView`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4168) | method | 4168 | No |
| [`getCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4172) | method | 4172 | No |
| [`getScene`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4176) | method | 4176 | No |
| [`getRenderer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4180) | method | 4180 | No |
| [`getFov`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4191) | method | 4191 | No |
| [`setFov`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4195) | method | 4195 | No |
| [`adjustFov`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4199) | method | 4199 | No |
| [`getProjectionMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4203) | method | 4203 | No |
| [`setProjectionMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4207) | method | 4207 | No |
| [`toggleProjectionMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4211) | method | 4211 | No |
| [`resetCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4215) | method | 4215 | No |
| [`snapToView`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4222) | method | 4222 | No |
| [`orientModelOrSurface`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4229) | method | 4229 | No |
| [`rotateModelOrSurface`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4236) | method | 4236 | No |
| [`scaleModelOrSurface`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4243) | method | 4243 | No |
| [`resetPickedModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4248) | method | 4248 | No |
| [`setLightingPreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4255) | method | 4255 | No |
| [`getStudioLightingState`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4259) | method | 4259 | No |
| [`setStudioLightingMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4263) | method | 4263 | No |
| [`setStudioSoftness`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4267) | method | 4267 | No |
| [`setStudioLightDirection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4271) | method | 4271 | No |
| [`setStudioLightIntensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4275) | method | 4275 | No |
| [`setStudioLightColor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4279) | method | 4279 | No |
| [`setStudioFloorShadow`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4283) | method | 4283 | No |
| [`setStudioGridVisible`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4287) | method | 4287 | No |
| [`applyStudioBackdrop`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4292) | method | 4292 | No |
| [`setTheme`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4296) | method | 4296 | No |
| [`toggleWireframe`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4300) | method | 4300 | No |
| [`setWireframe`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4314) | method | 4314 | No |
| [`toggleGrid`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4318) | method | 4318 | No |
| [`setGrid`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4322) | method | 4322 | No |
| [`setModelDisplayMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4326) | method | 4326 | No |
| [`setModelCustomMaterial`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4368) | method | 4368 | No |
| [`setModelOpacity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4379) | method | 4379 | No |
| [`setModelWireframeOpacity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4393) | method | 4393 | No |
| [`getModelDisplayMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4406) | method | 4406 | No |
| [`getIsModelVisible`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4410) | method | 4410 | No |
| [`toggleModelVisibility`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4414) | method | 4414 | No |
| [`cloneModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4433) | method | 4433 | No |
| [`centerModelToOrigin`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4488) | method | 4488 | No |
| [`setSkyPreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4497) | method | 4497 | No |
| [`applySkyPresetIfEnabled`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4504) | method | 4504 | No |
| [`setSunAngles`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4509) | method | 4509 | No |
| [`setSunPositionVector`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4513) | method | 4513 | No |
| [`setTimeOfDay`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4517) | method | 4517 | No |
| [`getTimeOfDay`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4521) | method | 4521 | No |
| [`setSunIntensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4525) | method | 4525 | No |
| [`setSunColor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4529) | method | 4529 | No |
| [`setAmbientIntensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4533) | method | 4533 | No |
| [`setSunCoronaIntensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4537) | method | 4537 | No |
| [`getIlluminationState`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4541) | method | 4541 | No |
| [`setCloudCoverage`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4545) | method | 4545 | No |
| [`setCloudDensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4549) | method | 4549 | No |
| [`setCloudSpeed`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4553) | method | 4553 | No |
| [`setCloudWindAngle`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4557) | method | 4557 | No |
| [`setCloudScale`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4561) | method | 4561 | No |
| [`setCloudTurbulence`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4565) | method | 4565 | No |
| [`setCloudOpacity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4569) | method | 4569 | No |
| [`setCloudColor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4573) | method | 4573 | No |
| [`setCloudShadow`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4577) | method | 4577 | No |
| [`setEnableClouds`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4581) | method | 4581 | No |
| [`setEnableGodRays`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4585) | method | 4585 | No |
| [`setGodRaysIntensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4589) | method | 4589 | No |
| [`setGodRaysDensity`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4593) | method | 4593 | No |
| [`setGodRaysDecay`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4597) | method | 4597 | No |
| [`setGodRaysColor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4601) | method | 4601 | No |
| [`getSkySettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4605) | method | 4605 | No |
| [`ensureBaselineLighting`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4609) | method | 4609 | No |
| [`exportGLB`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4616) | method | 4616 | No |
| [`prepareExportMaterials`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4651) | method | 4651 | No |
| [`bakeShaderMaterial`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4657) | arrow/var | 4657 | No |
| [`exportOBJ`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4718) | method | 4718 | No |
| [`captureSnapshot`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4730) | method | 4730 | No |
| [`resize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4746) | method | 4746 | No |
| [`applyResize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4765) | method | 4765 | No |
| [`ensureRayTracer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4785) | method | 4785 | No |
| [`setPostProcessSettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4799) | method | 4799 | No |
| [`getPostProcessSettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4816) | method | 4816 | No |
| [`updateCameraPosition`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4840) | method | 4840 | No |
| [`notifyHistory`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4844) | method | 4844 | No |
| [`startLoop`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4853) | method | 4853 | No |
| [`loop`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4854) | arrow/var | 4854 | No |
| [`isCameraSettling`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4975) | method | 4975 | No |
| [`setHasAnimatedContent`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4983) | method | 4983 | No |
| [`markDirty`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4988) | method | 4988 | No |
| [`getQualityProfile`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L4994) | method | 4994 | No |
| [`sampleColorAtScreen`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5001) | method | 5001 | No |
| [`detectGPUHardware`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5058) | method | 5058 | No |
| [`getGPUInfo`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5096) | method | 5096 | No |
| [`startLiquifySession`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5107) | method | 5107 | No |
| [`applyLiquifyAtScreen`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5114) | method | 5114 | No |
| [`setLiquifyCompare`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5136) | method | 5136 | No |
| [`commitLiquify`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5143) | method | 5143 | No |
| [`discardLiquify`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5151) | method | 5151 | No |
| [`decimateCurves`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5158) | method | 5158 | No |
| [`setCustomMirrorPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5178) | method | 5178 | No |
| [`toggleCustomMirrorPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5195) | method | 5195 | No |
| [`getCameraOrientationForMirror`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5208) | method | 5208 | No |
| [`createPresetBentGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5225) | method | 5225 | No |
| [`createBentGuideFromSelectedStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5240) | method | 5240 | No |
| [`removeBentGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5268) | method | 5268 | No |
| [`updateBentGuideParameters`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5276) | method | 5276 | No |
| [`toggleBentGuideVisibility`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5280) | method | 5280 | No |
| [`getBentGuides`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5284) | method | 5284 | No |
| [`getActiveGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5292) | method | 5292 | No |
| [`setActiveGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5296) | method | 5296 | No |
| [`subscribeActiveGuideChange`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5304) | method | 5304 | No |
| [`getActiveGuideMesh`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5309) | method | 5309 | No |
| [`removeActiveGuide`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5321) | method | 5321 | No |
| [`getScaffoldingEngine`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5334) | method | 5334 | No |
| [`createProxyScaffold`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5338) | method | 5338 | No |
| [`loadCollisionMeshFromObject`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5346) | method | 5346 | No |
| [`removeScaffold`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5354) | method | 5354 | No |
| [`updateScaffold`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5362) | method | 5362 | No |
| [`getScaffolds`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5366) | method | 5366 | No |
| [`importImageBillboardToStage`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5377) | method | 5377 | No |
| [`toggleMeshGuideCollider`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5420) | method | 5420 | No |
| [`startWebXRSession`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5442) | method | 5442 | No |
| [`stopWebXRSession`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5471) | method | 5471 | No |
| [`enableSimulatedARMode`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5484) | method | 5484 | No |
| [`setARSceneElevation`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5501) | method | 5501 | No |
| [`dispose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5510) | method | 5510 | No |
| [`disposeSceneGraph`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5595) | method | 5595 | No |
| [`disposeMaterial`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/studioEngine.ts#L5598) | arrow/var | 5598 | No |

### core/telemetryStore.ts

#### [src/core/telemetryStore.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/telemetryStore.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`notify`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/telemetryStore.ts#L29) | function | 29 | No |
| [`publishCameraPose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/telemetryStore.ts#L42) | function | 42 | Yes |
| [`getCameraPose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/telemetryStore.ts#L56) | function | 56 | Yes |
| [`subscribeCameraPose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/telemetryStore.ts#L60) | function | 60 | Yes |
| [`publishFps`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/telemetryStore.ts#L70) | function | 70 | Yes |
| [`getFps`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/telemetryStore.ts#L76) | function | 76 | Yes |
| [`subscribeFps`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/telemetryStore.ts#L80) | function | 80 | Yes |

### core/transformController.ts

#### [src/core/transformController.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`clearHistory`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L70) | method | 70 | No |
| [`getSelectionCenter`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L78) | method | 78 | No |
| [`getSelectionBox`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L90) | method | 90 | No |
| [`expandByStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L101) | arrow/var | 101 | No |
| [`expandByModels`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L110) | arrow/var | 110 | No |
| [`modelChildren`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L118) | arrow/var | 118 | No |
| [`getScreenCenterWorldAnchor`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L176) | method | 176 | No |
| [`beginTransform`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L190) | method | 190 | No |
| [`endTransform`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L203) | method | 203 | No |
| [`applyTransformMatrix`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L236) | method | 236 | No |
| [`translateScreenSpace`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L371) | method | 371 | No |
| [`translateScreenExact`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L412) | method | 412 | No |
| [`dragSelection`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L439) | method | 439 | No |
| [`rotateAroundViewAxis`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L476) | method | 476 | No |
| [`scaleScreenSpace`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L503) | method | 503 | No |
| [`rotateScreenSpace`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L550) | method | 550 | No |
| [`translateWorldAxis`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L584) | method | 584 | No |
| [`rotateWorldAxis`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L603) | method | 603 | No |
| [`rotateTrackball`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L639) | method | 639 | No |
| [`translateOnPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L674) | method | 674 | No |
| [`rotateOnPlane`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L710) | method | 710 | No |
| [`alignSurfaceToCamera`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L751) | method | 751 | No |
| [`setSurfaceOrientation`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L768) | method | 768 | No |
| [`translateAxis3D`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L786) | method | 786 | No |
| [`rotateAxis3D`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L797) | method | 797 | No |
| [`scaleAxis`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L811) | method | 811 | No |
| [`scaleAxis3D`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L845) | method | 845 | No |
| [`snapModelToGround`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L855) | method | 855 | No |
| [`snapActiveToGround`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L867) | method | 867 | No |
| [`orientModelOrSurface`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L887) | method | 887 | No |
| [`rotateModelOrSurface`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L917) | method | 917 | No |
| [`scaleModelOrSurface`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L924) | method | 924 | No |
| [`getPickedModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L930) | method | 930 | No |
| [`rememberPickedModelHome`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L936) | method | 936 | No |
| [`resetPickedModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/transformController.ts#L948) | method | 948 | No |

### core/uvPaintingEngine.ts

#### [src/core/uvPaintingEngine.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`setRenderer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L55) | method | 55 | No |
| [`setActiveLayer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L60) | method | 60 | No |
| [`getOrCreateLayerEntry`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L65) | method | 65 | No |
| [`getCompositeTexture`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L92) | method | 92 | No |
| [`getActiveCanvas`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L96) | method | 96 | No |
| [`getLayerCanvas`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L100) | method | 100 | No |
| [`clearActiveCanvas`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L104) | method | 104 | No |
| [`clearLayer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L108) | method | 108 | No |
| [`deleteLayer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L118) | method | 118 | No |
| [`clearAllLayers`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L128) | method | 128 | No |
| [`clearCanvas`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L137) | method | 137 | No |
| [`resetHistory`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L141) | method | 141 | No |
| [`compositeLayers`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L153) | method | 153 | No |
| [`mergeLayerDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L190) | method | 190 | No |
| [`attachToModel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L265) | method | 265 | No |
| [`generateFallbackUVs`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L321) | method | 321 | No |
| [`requestComposite`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L339) | method | 339 | No |
| [`beginStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L355) | method | 355 | No |
| [`paintTo`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L367) | method | 367 | No |
| [`paintStamp`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L410) | method | 410 | No |
| [`sampleColorAtUV`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L424) | method | 424 | No |
| [`renderBrushAtPixel`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L442) | method | 442 | No |
| [`endStroke`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L488) | method | 488 | No |
| [`saveLayerState`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L501) | method | 501 | No |
| [`undo`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L523) | method | 523 | No |
| [`redo`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L536) | method | 536 | No |
| [`exportPNG`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L549) | method | 549 | No |
| [`exportAllCanvases`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L554) | method | 554 | No |
| [`importCanvases`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L566) | method | 566 | No |
| [`dispose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/uvPaintingEngine.ts#L589) | method | 589 | No |

### core/wboitPipeline.ts

#### [src/core/wboitPipeline.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/wboitPipeline.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`setSize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/wboitPipeline.ts#L202) | method | 202 | No |
| [`setEnabled`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/wboitPipeline.ts#L215) | method | 215 | No |
| [`getEnabled`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/wboitPipeline.ts#L219) | method | 219 | No |
| [`clearBuffers`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/wboitPipeline.ts#L226) | method | 226 | No |
| [`renderComposite`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/wboitPipeline.ts#L241) | method | 241 | No |
| [`dispose`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/wboitPipeline.ts#L250) | method | 250 | No |

### core/webgpuPipeline.ts

#### [src/core/webgpuPipeline.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/webgpuPipeline.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getInstance`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/webgpuPipeline.ts#L50) | method | 50 | No |
| [`initWebGPU`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/webgpuPipeline.ts#L60) | method | 60 | No |
| [`getReadyInfo`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/webgpuPipeline.ts#L115) | method | 115 | No |
| [`dispatchVolumetricCompute`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/core/webgpuPipeline.ts#L125) | method | 125 | No |

### engine

#### [src/engine/colorUtils.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/engine/colorUtils.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`hexToRgb`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/engine/colorUtils.ts#L2) | function | 2 | Yes |
| [`rgbToHex`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/engine/colorUtils.ts#L18) | function | 18 | Yes |
| [`kelvinToRgb`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/engine/colorUtils.ts#L26) | function | 26 | Yes |
| [`sphericalToCartesian`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/engine/colorUtils.ts#L67) | function | 67 | Yes |
| [`timeOfDayToSunAngles`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/engine/colorUtils.ts#L80) | function | 80 | Yes |

### hooks

#### [src/hooks/useAppAutoSave.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/hooks/useAppAutoSave.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`useAppAutoSave`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/hooks/useAppAutoSave.ts#L35) | function | 35 | Yes |

#### [src/hooks/useAppShortcuts.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/hooks/useAppShortcuts.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`useAppShortcuts`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/hooks/useAppShortcuts.ts#L14) | function | 14 | Yes |
| [`handleKeyDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/hooks/useAppShortcuts.ts#L25) | arrow/var | 25 | No |
| [`handleKeyDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/hooks/useAppShortcuts.ts#L37) | arrow/var | 37 | No |

#### [src/hooks/useDismissibleSurface.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/hooks/useDismissibleSurface.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`useDismissibleSurface`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/hooks/useDismissibleSurface.ts#L39) | function | 39 | Yes |
| [`handlePointerDownCapture`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/hooks/useDismissibleSurface.ts#L62) | arrow/var | 62 | No |
| [`handleKeyDown`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/hooks/useDismissibleSurface.ts#L114) | arrow/var | 114 | No |

### icons

#### [src/icons/iconoirLucideAdapter.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/icons/iconoirLucideAdapter.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`w`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/icons/iconoirLucideAdapter.tsx#L13) | arrow/var | 13 | No |
| [`Wrapped`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/icons/iconoirLucideAdapter.tsx#L14) | arrow/var | 14 | No |

### main.tsx

#### [src/main.tsx](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/main.tsx)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getDerivedStateFromError`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/main.tsx#L25) | method | 25 | No |
| [`componentDidCatch`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/main.tsx#L28) | method | 28 | No |
| [`render`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/main.tsx#L31) | method | 31 | No |

### presets

#### [src/presets/brushPresets.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/presets/brushPresets.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getCustomBrushPresets`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/presets/brushPresets.ts#L239) | function | 239 | Yes |
| [`saveCustomBrushPreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/presets/brushPresets.ts#L250) | function | 250 | Yes |
| [`deleteCustomBrushPreset`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/presets/brushPresets.ts#L263) | function | 263 | Yes |
| [`applyBrushPresetToSettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/presets/brushPresets.ts#L275) | function | 275 | Yes |
| [`createPresetFromCurrentSettings`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/presets/brushPresets.ts#L303) | function | 303 | Yes |

#### [src/presets/curatedBrushes.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/presets/curatedBrushes.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`brushIcon`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/presets/curatedBrushes.ts#L5) | arrow/var | 5 | No |
| [`getBrushesForTab`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/presets/curatedBrushes.ts#L182) | function | 182 | Yes |
| [`getActiveCuratedBrush`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/presets/curatedBrushes.ts#L200) | function | 200 | Yes |
| [`applyCuratedBrush`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/presets/curatedBrushes.ts#L251) | function | 251 | Yes |

### registerServiceWorker.ts

#### [src/registerServiceWorker.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/registerServiceWorker.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`registerPWA`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/registerServiceWorker.ts#L15) | function | 15 | Yes |
| [`canInstallPWA`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/registerServiceWorker.ts#L67) | function | 67 | Yes |
| [`promptPWAInstall`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/registerServiceWorker.ts#L74) | function | 74 | Yes |
| [`subscribeInstallAvailability`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/registerServiceWorker.ts#L94) | function | 94 | Yes |

### utils

#### [src/utils/assetUrl.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/assetUrl.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`resolveAssetUrl`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/assetUrl.ts#L6) | function | 6 | Yes |

#### [src/utils/audio.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/audio.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getAudioContext`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/audio.ts#L9) | function | 9 | No |
| [`setGlobalSoundEnabled`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/audio.ts#L27) | arrow/var | 27 | Yes |
| [`getGlobalSoundEnabled`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/audio.ts#L36) | arrow/var | 36 | Yes |
| [`playHapticSound`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/audio.ts#L40) | arrow/var | 40 | Yes |

#### [src/utils/autoPreviewGenerator.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/autoPreviewGenerator.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`generateFromObject`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/autoPreviewGenerator.ts#L18) | method | 18 | No |
| [`autoPreviewAndSaveFile`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/autoPreviewGenerator.ts#L35) | method | 35 | No |
| [`autoPreviewAndSaveBuffer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/autoPreviewGenerator.ts#L108) | method | 108 | No |

#### [src/utils/deviceProfile.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/deviceProfile.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`probeGPURenderer`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/deviceProfile.ts#L125) | function | 125 | Yes |
| [`readOverride`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/deviceProfile.ts#L164) | function | 164 | No |
| [`normalize`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/deviceProfile.ts#L167) | arrow/var | 167 | No |
| [`gatherSignals`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/deviceProfile.ts#L208) | function | 208 | No |
| [`classify`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/deviceProfile.ts#L228) | function | 228 | No |
| [`buildProfile`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/deviceProfile.ts#L308) | function | 308 | No |
| [`getQualityProfile`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/deviceProfile.ts#L438) | function | 438 | Yes |
| [`setQualityTier`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/deviceProfile.ts#L470) | function | 470 | Yes |
| [`isLowPowerDevice`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/deviceProfile.ts#L493) | function | 493 | Yes |
| [`resolvePixelRatio`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/deviceProfile.ts#L498) | function | 498 | Yes |

#### [src/utils/haptics.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/haptics.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`setAudioFeedbackEnabled`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/haptics.ts#L40) | method | 40 | No |
| [`getAudioFeedbackEnabled`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/haptics.ts#L51) | method | 51 | No |
| [`toggleAudioFeedback`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/haptics.ts#L55) | method | 55 | No |
| [`setEnabled`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/haptics.ts#L60) | method | 60 | No |
| [`getEnabled`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/haptics.ts#L71) | method | 71 | No |
| [`toggleEnabled`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/haptics.ts#L75) | method | 75 | No |
| [`getAudioContext`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/haptics.ts#L87) | method | 87 | No |
| [`playMicroClick`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/haptics.ts#L109) | method | 109 | No |
| [`trigger`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/haptics.ts#L117) | method | 117 | No |
| [`checkAngleDetent`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/haptics.ts#L249) | method | 249 | No |

#### [src/utils/storagePermission.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`isPersistenceSupported`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L24) | function | 24 | Yes |
| [`checkStoragePersistence`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L36) | function | 36 | Yes |
| [`requestStoragePersistence`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L51) | function | 51 | Yes |
| [`formatBytes`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L66) | function | 66 | Yes |
| [`getStorageEstimate`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L78) | function | 78 | Yes |
| [`getAutosaveDB`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L124) | function | 124 | No |
| [`saveAutoSaveProject`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L154) | function | 154 | Yes |
| [`loadAutoSaveProject`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L183) | function | 183 | Yes |
| [`hasAutoSaveProject`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L206) | function | 206 | Yes |
| [`clearAutoSaveProject`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L239) | function | 239 | Yes |
| [`saveProjectSession`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L262) | function | 262 | Yes |
| [`getAllProjectSessions`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L282) | function | 282 | Yes |
| [`loadProjectSession`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L306) | function | 306 | Yes |
| [`deleteProjectSession`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/storagePermission.ts#L328) | function | 328 | Yes |

#### [src/utils/themeStyles.ts](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/themeStyles.ts)

| Function / Method | Type | Line | Exported |
| :--- | :--- | :--- | :--- |
| [`getThemeClasses`](file:///E:/X/AiStudio%20Workflow/V22%20Test/src/utils/themeStyles.ts#L50) | function | 50 | Yes |

