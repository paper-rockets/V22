# Technical Specifications (Remix 3D Studio / Spatial Draw)

**Folder Location:** `E:\X\AiStudio Workflow\V22 Test`  
**Last Updated:** September 15, 2026

---

## 1. Project Overview & Packaging

* **Project Title:** Remix 3D Studio (Native package name: **Spatial Draw**)
* **Folder Path:** `E:\X\AiStudio Workflow\V22 Test`
* **Purpose:** An accessible, spatial 3D drawing application designed for Android touchscreens, tablets, and desktop web browsers. It allows users to sketch freehand in 3D space or draw directly onto imported 3D models.
* **Android Application ID:** `com.paperrockets.v22`
* **Native Packaging Tool:** Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli` version 8.5.2). *Capacitor is the software that wraps the web app into an installable Android APK file.*
* **Web Build Directory:** `E:\X\AiStudio Workflow\V22 Test\dist`
* **Android Scheme:** `https` (`androidScheme: 'https'`, mixed content disabled for security).

---

## 2. Technology Stack & Software Versions

* **Runtime Environment:** Node.js 20+ (Node.js 22 LTS recommended), npm 10+
* **User Interface Framework:** React 19 (`react` and `react-dom` version 19.0.1)
* **Code Language:** TypeScript version 5.8.2 (configured with strict type-checking to catch bugs before runtime)
* **Build System & Dev Server:** Vite version 6.2.3 (`@vitejs/plugin-react` version 5.0.4)
* **CSS & Styling:** Tailwind CSS version 4 (`tailwindcss` and `@tailwindcss/vite` version 4.1.14)
* **3D Graphics Engine:** Three.js version 0.185.1 (the WebGL graphics engine that renders 3D models and strokes in the browser)
* **Fast Spatial Geometry Snapping:** `three-mesh-bvh` version 0.9.14 (Bounding Volume Hierarchy, an acceleration structure that allows instantaneous mathematical raycasting and surface snapping onto complex 3D meshes)
* **Mesh Compression:** `meshoptimizer` version 1.2.0 (optimizes and compresses 3D vertex data to maintain high frame rates and reduce memory consumption)
* **Motion & Transitions:** Motion version 12.23.24 (delivers smooth UI panel transitions)
* **Icon Libraries:** `lucide-react` version 0.546.0 and `iconoir-react` version 7.12.1
* **Archive Packaging:** JSZip version 3.10.1 (compresses and unpacks zipped 3D project files)
* **Automated Browser Testing:** Playwright version 1.63.0 (runs automated smoke tests across multiple virtual device viewports)

---

## 3. Device & Hardware Support Matrix

| Device Class | Screen Resolution | Target Hardware Profile | Key Technical Targets |
| :--- | :--- | :--- | :--- |
| **Small Phone** | 360×800 to 390×844 px | Low-to-mid mobile GPUs (Mali / Adreno) | Single full-width bottom sheet dock, thumb zone ergonomics, zero top-bar button clipping. |
| **Large Phone** | 412×915 to 1440×3120 px | Flagship phones (Galaxy S24/S25 Ultra, Pixel) | High-DPI crisp stroke rendering, targeting 60 to 120 FPS sustained drawing. |
| **Budget Tablet** | 1200×2000 px | Samsung Galaxy Tab S6 Lite (Mali-G72 GPU) | Total memory consumption under 450 MB; 3D models compressed under 3 MB to prevent memory crashes. |
| **Modern Tablet** | 1024×768 to 1600×2560 px | Apple iPad / Samsung Galaxy Tab S9 | Seamless portrait/landscape rotation, expanded side panel docking. |
| **Desktop / Laptop** | Standard 1080p and 4K displays | Mouse, trackpad, and keyboard setups | Persistent left rail with docked right inspector and keyboard shortcuts. |

---

## 4. User Interface (UI) & Interaction Specifications

* **Touch Target Size Floor:** Every clickable button, icon, and slider handle must be at least 44×44 CSS pixels. Primary phone actions target 48–56 CSS pixels so fingers can tap accurately.
* **Viewport Standards:** Uses `100dvh` (dynamic viewport height) and safe-area insets (`env(safe-area-inset-*)`) so physical camera cutouts, rounded screen corners, and navigation bars do not obscure controls.
* **Screen Usability Guarantee:** 3D artwork retains roughly 65% to 75% of visible screen area even when drawers, inspectors, or color sheets are open.
* **Color Role Palette:**
  * *Cyan:* Active drawing state, selection, and primary focus rings.
  * *Amber / Warm Gold:* Lighting and illumination adjustments.
  * *Red:* Destructive operations (clear canvas, delete stroke/layer).
  * *Warm Neutral / Charcoal:* Background toolbars and panels.
* **Typography:** 100% self-hosted local fonts (`Plus Jakarta Sans` for interface copy, `JetBrains Mono` for numeric readouts). Minimum 16px font size for phone body text; 12–14px for compact tags.
* **Protected Orientation Gizmo:** The 3D orientation sphere controller located at `E:\X\AiStudio Workflow\V22 Test\src\components\TransformNavigator\Option3SphereNavigator.tsx` is an established, protected component whose visual styling, menus, and interaction logic are preserved.

---

## 5. 3D Engine & Drawing Specifications

* **Drawing Modes:**
  * *Surface Conformal Snapping:* Strokes automatically cling and conform directly to the polygonal face of imported 3D models.
  * *Free-Space Drawing:* Strokes float freely in 3D space along camera depth planes.
* **Stroke Geometries:**
  * *Ribbon:* Flat continuous polygonal strip.
  * *Tube:* Extruded cylindrical 3D line.
  * *Decal:* Flat surface-attached projection.
  * *Chisel Marker:* Angled flat stroke.
* **Default Brush Specification:**
  ```typescript
  {
    tool: 'brush',
    drawingMode: 'surface',
    profile: 'ribbon',
    materialType: 'shadeless',
    patternType: 'none'
  }
  ```
* **Procedural Shader System:** Features animated real-time surface shaders (Inferno, Lava, Neon Rim, Ocean/Water, Sparkle, Rainbow, Hologram, Slime, and Aurora). Selecting a shader applies its authored appearance cleanly without unwanted mixing into previous solid paint colors.
* **Stylus & Input Handling:** Active stylus support (Samsung S-Pen, Apple Pencil) with pressure sensitivity, stroke smoothing, and a palm-rejection toggle in settings.

---

## 6. Storage, Performance & Offline Specifications

* **Cold Launch Offline Requirement:** Zero external network calls on launch. Fonts, scripts, and Draco 3D decoders (`E:\X\AiStudio Workflow\V22 Test\public\draco`) are self-hosted locally in the repository.
* **Local Session Storage:** Project autosaves and undo stacks use IndexedDB (`remix3d_sessions`) paired with the browser's `navigator.storage.persist()` API.
* **Service Worker Caching:** Handled by `E:\X\AiStudio Workflow\V22 Test\public\sw.js`, caching the core application shell and up to 80 recent assets using LRU (Least Recently Used) automatic cache eviction.
* **Bundle Budget:** Heavy secondary tools (Illumination Studio, Model Converter, Studio Importer, Color Studio Shaders, AR Viewer) use deferred loading (`React.lazy`), keeping the initial JavaScript bundle under ~560 KB.
* **Supported 3D Formats:**
  * *Import:* GLB, glTF, OBJ, STL, PLY.
  * *Export:* GLB (standard binary 3D format for Blender, game engines, and web viewers), high-resolution PNG/JPEG images, and project session zip files.
* **Privacy & Telemetry:** Zero external telemetry, zero ads, and zero user tracking. All computation and file generation execute strictly on the local device.

---

## 7. Quality Gates & Release Verification

Before any build is packaged or published, it must pass three verification steps:
1. `npm run lint` — Runs TypeScript (`tsc --noEmit`) to verify zero code errors.
2. `npm test` — Executes automated smoke tests (`E:\X\AiStudio Workflow\V22 Test\scripts\smoke-test.mjs`) across Phone, Tablet, and Desktop screen sizes.
3. `npm run build` — Compiles the production bundle via Vite (`vite build`).
4. **12-Layer App Audit (`E:\X\AiStudio Workflow\V22 Test\APP_AUDIT_PROTOCOL.md`):** Verifies absence of ghost objects, frame-zero layout flashes, silent blank canvas renders, light/dark theme clashes, touch event traps (`touch-action: none`), on-screen keyboard compression, and background memory leaks.
