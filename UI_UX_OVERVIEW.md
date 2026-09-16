# V22 Studio - UI / UX Overview, Style, and Options

**Folder Location:** `E:\X\AiStudio Workflow\V22 Test`

---

## 1. UI / UX Workspace Overview

The application is a spatial 3D drawing and sculpting studio built for cross-platform creative work across Android phones, tablets, and desktop computers. The design prioritizes an uncluttered, responsive 3D drawing canvas with essential tools surrounding the perimeter.

### Main Workspace Zones

1. **Center 3D Canvas (`Viewport`)**
   - Full-viewport interactive 3D scene where spatial drawing, model inspection, and sculpting take place.
   - Supports touch, stylus (with pressure dynamics), and mouse input.
   - Includes quiet, non-blocking onboarding hints that automatically disappear once the user draws their first stroke.

2. **Top Bar (`StudioTopStrip`)**
   - **Project Name & Live Status**: Displays active project title and live autosave state (`Saving...`, `Saved`, or `Save failed`).
   - **History**: Dedicated touch-accessible Undo and Redo buttons.
   - **More Menu (`StudioTopMoreMenu`)**: Compact dropdown sheet for Projects/Sessions, Fullscreen toggle, and Studio Settings.

3. **Primary Tool Rail (`ProRail`)**
   - Persistent dockable tool rail located along the edge of the workspace (configurable to left or bottom).
   - Houses the five primary creative tools:
     - **Draw**: Direct access to placement mode (*On model* or *In space*), curated brush presets, brush size slider, quick color chips, and a launcher for the full Color Studio.
     - **Erase**: Spatial stroke erasing.
     - **Select**: Object/stroke selection with primary transforms (*Move*, *Turn*, *Resize*).
     - **Add**: Primitives, guides, and access to the 3D model library and custom file importer.
     - **Layers**: Layer stack management (hide, lock, clear, merge).

4. **Context Panels & Sheets (`ProPanel`)**
   - Single-surface rule: Only one contextual panel is open at any time to prevent visual competition and screen clutter.
   - Opens context-sensitive tools based on the active mode (Select, Add, Deform, Layers).

5. **3D View Navigator (`Option3SphereNavigator` / `JoystickNavigator`)**
   - Located in the viewport corner for effortless camera orientation with touch or mouse.
   - Quick one-tap camera alignment buttons: Reset View, Front, Side, and Top views.
   - Projection toggle (Perspective vs. Orthographic).

---

## 2. Responsive Device Layout Strategy

The interface adapts cleanly across distinct screen sizes without squeezing desktop controls into mobile screens:

* **Desktop & Tablet Landscape**:
  - Persistent side rail.
  - Docked side inspector panel that leaves 65%–75% of screen area open for artwork.
  - Generous target spacing with tooltips and keyboard shortcuts.

* **Tablet Portrait**:
  - Persistent side rail.
  - Contextual controls presented as a lower sheet instead of a cramped side panel.

* **Mobile Phone (Touch-First)**:
  - Full-width bottom sheets that slide up smoothly over the lower portion of the screen.
  - No side inspector.
  - Immediate tools remain reachable without obstructing the drawing surface.
  - Deep technical settings tucked behind single-purpose temporary sheets.

---

## 3. Visual Style & Design System

### Color Themes

* **Dark Theme (Default)**:
  - Background: Neutral deep charcoal (`#14161a`).
  - Text & Elements: Off-white (`#e5e7eb` / `#f3f4f6`) with controlled contrast.
  - Dividers & Borders: Hairline borders with subtle opacity (`border-white/10` to `border-white/15`).
* **Light Theme**:
  - Background: Warm parchment / off-white (`#f7f4ee`).
  - Text & Elements: Deep neutral charcoal (`#1f2937` / `#111827`).
  - Dividers & Borders: Soft dark hairline borders (`border-black/10` to `border-black/15`).

### Semantic Color Accents

* **Cyan / Sky Blue**: Dedicated to active selection, focus rings, and active drawing tools.
* **Amber / Warm Gold**: Reserved for scene lighting, shadow controls, and illumination tools.
* **Red**: Strictly reserved for destructive actions (deleting strokes, clearing canvas, discarding work).
* **Neutral Panels**: Opaque surfaces with 14–16px rounded corners, hairline borders, and soft elevation shadows. Eliminates noisy glassmorphism or background blur so UI never clashes with 3D artwork.

### Ergonomics & Touch Standards

* Minimum interactive touch target: **44 × 44 CSS pixels** on all platforms.
* Primary phone actions: **48 to 56 CSS pixels** for effortless thumb reach.
* Typography: Clean, self-hosted sans-serif interface font. Minimum 16px font size on phone body text.
* Restrained Motion: Transitions stay under 150–200ms with ease-out timing; no bouncy or slow decorative animations.

---

## 4. Comprehensive Inventory of Options & Settings

### Workspace & Canvas Settings (`StudioSettingsSheet`)
* **Theme**: Dark Mode or Light Mode toggle.
* **UI Scale**: Adjustable scaling for UI density.
* **Dock Position**: Primary tool rail positioned on Left or Bottom.
* **Display Mode**: Normal browser viewport or immersive Fullscreen mode.
* **Aspect Ratio / Format**: Square (1:1), Portrait (9:16), Landscape (16:9), or Custom canvas bounds.
* **Canvas Background**: Solid color selection and background transparency slider.
* **Reference Aids**: Toggle floor grid and ground reference plane on or off.
* **Performance Telemetry**: Toggle real-time FPS and draw statistics.
* **Audio & Haptics**: Toggle UI sound feedback and tactile haptics.

### Drawing & Brush Settings
* **Placement Modes**:
  * *On model*: Conforms strokes to the surface geometry of loaded 3D models.
  * *In space*: Freehand drawing in 3D space with depth planes.
* **Curated Brush Presets**:
  * *Flat Brush* (`streamline_ink`): Ribbon brush for everyday painting and sketching.
  * *Surface Brush* (`conformal_bead`): Surface-attached stroke with bead profile.
  * *Round Brush* (`spatial_pipe`): Volumetric 3D tube stroke.
  * *Wide Marker* (`chisel_marker`): Broad calligraphic stroke.
* **Brush Adjustments**:
  * Size slider (with real-time stroke preview glyph).
  * Opacity and stroke smoothing parameters.
  * Finger Draw toggle (allows disabling finger drawing so finger touches only rotate the camera while stylus draws).
* **Materials & Shader Looks**:
  * Solid paint color chips and hex palette picker.
  * Authoring shaders and animated materials: Glow, Slime, Hologram, Inferno, Lava, Neon Rim, Ocean Water, Rainbow, Aurora.

### 3D Navigation & Camera Controls
* **Navigator Style**: Sphere, Disc, Petal, or Collar interactive 3D navigator.
* **Navigator Controller**: 3D Sphere Trackball or 2D Joystick mode.
* **Sensitivity**: Adjustable camera rotation and panning sensitivity.
* **Camera Projections**:
  * *Perspective*: Natural human optical depth.
  * *Orthographic*: True isometric/flat architectural projection.
* **Model Display Style**:
  * *Texture*: Realistic materials and imported surface textures.
  * *Clay*: Uniform matte clay render for silhouette and stroke checking.

### Specialized Studio Modals & Tools (`AppModalHost`)
* **Color Studio (`CompactColorStudioModal`)**: Comprehensive color wheel, hex input, custom palette saving, and shader library.
* **Scene Illumination (`SimpleSceneIlluminationModal`)**: Sunlight angles, intensity, ambient sky light, and shadow toggles.
* **Render & Post-Processing (`RenderSettingsPanel`)**: Bloom, depth of field, ambient occlusion, mesh normal recalculation, and path tracing renderer.
* **Model Library & Importer (`ModelLibraryModal` / `StudioImporter`)**: Built-in 3D reference templates and local `.glb` / `.obj` file import with safety checks against accidental work loss.
* **Project Sessions & Autosave (`ProjectSessionModal`)**: Local browser autosave recovery, named local project sessions, and folder backups.
* **Export Studio (`ExportModal`)**: High-resolution image export (PNG) and 3D file export (GLB).
* **Sculpting & Deform Suite**:
  * *Liquify*: Push, pull, smooth, and nudge existing 3D strokes with compare toggle.
  * *Curve Decimate*: Reduce point density on strokes to optimize performance.
  * *Custom Mirror & Symmetry*: Symmetrical drawing across customizable spatial mirror planes.
  * *Bent Guides & Scaffolding*: Cylindrical, spherical, and planar geometric guides.
* **Reference Clipboard (`FloatingReferenceClipboard`)**: Floating 2D reference images pinned above the canvas.
* **AR Viewer (`ARViewerModal`)**: Augmented Reality viewing mode for supported mobile devices.
