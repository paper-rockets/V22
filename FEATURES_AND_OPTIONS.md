# Remix 3D Studio — Features & Options Reference

Complete inventory of all features, tools, menus, and configuration options available in the application.

---

## 1. Top Bar & Workspace Navigation

- **Project Title & Sessions Button**: Displays the active project name. Tapping opens the project sessions manager to save, open, export, or download projects.
- **Autosave Status Indicator**: Real-time status display:
  - *Saving*: Indicates that current changes are being written to local storage.
  - *Saved*: Displays confirmation with the timestamp of the last successful local save.
  - *Retry save*: Alerts if browser storage failed so you can retry or export a manual backup.
- **Undo & Redo**: Dedicated step-by-step history buttons for undoing and redoing strokes and edits.
- **Studio Illumination Quick Access**: Direct button (Sun icon) to open the lighting and shadow studio.
- **Studio More Menu** (Settings icon):
  - **Projects**: Direct shortcut to open, save, or download projects.
  - **Studio Settings**: Opens the consolidated preferences sheet.
  - **Full Screen Toggle**: Switches between native browser view and distraction-free full-screen display.

---

## 2. Main Tool Dock (Bottom Toolbar)

### Primary Modes

- **Draw**: Primary freeform spatial and surface painting mode.
- **Erase**: Stroke-crossing eraser. Dragging across any line in 3D space removes the stroke cleanly. Includes a contextual helper notice.
- **Select**: Spatial transformation and manipulation tool:
  - **Selection Method**:
    - *Tap*: Select individual lines or models directly.
    - *Lasso*: Draw an enclosed loop to group-select multiple strokes.
  - **Selection Target Scope**:
    - *Current Layer*: Targets all strokes on the currently active layer.
    - *Lines*: Targets individual selected strokes.
    - *3D Models*: Targets imported or spawned 3D meshes.
    - *3D Guide*: Targets active curved guide rails or mannequins.
    - *Everything*: Manipulates the canvas, strokes, and models together.
  - **Transform Action**:
    - *Move*: Position along 3D axes.
    - *Rotate*: Spin around the selection pivot.
    - *Resize*: Scale uniformly or along dimensions.
  - **Quick Manipulation Actions**:
    - *To Ground*: Drops the selection down flat onto the 3D ground plane.
    - *Duplicate*: Creates an exact duplicate of the active selection.
    - *Delete*: Removes the selected item (can be undone with Undo).
    - *View Controls Toggle*: Shows or hides the 3D orientation gizmo.
- **Add (3D Shapes, Mannequins & Models)**:
  - **Basic 3D Primitives**:
    - *Cube*: Volumetric box mesh.
    - *Sphere*: Smooth 3D sphere mesh.
    - *Cylinder*: Radial cylinder mesh.
    - *Plane*: Flat 2D drawing plane.
  - **Drawing Mannequins & Armatures** (Scaffolding):
    - *Mannequin Torso*: Anatomical ribcage, pelvis, spine, and shoulder guides.
    - *Loomis Head Cage*: Proportional head sphere and jaw guide for portrait drawing.
    - *Vehicle Chassis*: Aerodynamic cabin, hood, and wheel arches.
    - *Limb Armature*: Jointed cylinder armature for posing arms and legs.
    - *Dome & Column*: Classical architectural guide primitives.
    - *Organic Capsule*: Rounded capsule for organic sketching.
  - **Bend Path (Curved Guides)**:
    - *Presets*: Wave, Arch, Spiral, and Saddle 3D guide curves.
    - *From Stroke*: Converts any drawn line into a curved drawing guide.
  - **Model Library**: Browse built-in sample models or load saved catalog assets.
  - **Import 3D Model File**: Load user files in GLB, OBJ, or STL format.
- **Layers**: Multi-layer organization panel:
  - **New Layer**: Create an independent drawing layer.
  - **New Group Folder**: Create hierarchical folders to nest layers.
  - **Layer Visibility**: Toggle layer show/hide.
  - **Layer Lock**: Protect layer from accidental edits.
  - **Opacity Slider**: Adjust layer transparency from 0% to 100%.
  - **Color Tags**: 8 organizational label colors (Red, Orange, Amber, Emerald, Cyan, Indigo, Pink, or None).
  - **Reordering**: Move layers up or down in the rendering hierarchy.
  - **Merge Down**: Flatten the active layer into the layer directly below it.
  - **Clear Layer**: Remove all strokes from a layer while preserving the layer itself.
  - **Rename**: Custom inline layer naming.

---

## 3. Frequent Drawing Controls (Dock Quick Group)

- **Draw Placement**:
  - *Surface*: Locks and conforms lines directly to underlying 3D models or canvas.
  - *Open Air*: Draws floating volumetric lines in empty 3D space.
  - *Guide Rail*: Magnetically adheres strokes to the nearest 3D guide curve.
  - *Surface + Air in One Line*: Allows a single stroke to start attached to a surface and continue off into open space.
- **Curated Brushes**:
  - *Flat Brush (Flat Ribbon)*: Smooth ribbon geometry that rotates with stroke direction.
  - *Surface Brush (Surface Decal)*: Snaps flush to 3D geometry without z-fighting.
  - *Round Brush (3D Tube)*: Full volumetric cylindrical pipe geometry.
  - *Wide Marker (Chisel Marker)*: Calligraphic stroke with fixed chisel angle.
  - *Fine Pen (Drafting Wire)*: Ultra-fine precision line for technical outlines.
  - *Neon Glow*: Luminous emissive ribbon with radiant bloom.
  - *Cutout Mask*: Negative-space stencil cutter.
  - *Texture Brushes*: Halftone Dot, Stipple Spray, Line Hatch, Crosshatch, and Terrazzo Fleck.
- **Color Selector**:
  - Active color preview circle with material shader / texture indicator.
  - Quick swatches (recently authored colors and primary presets).
  - Inline opacity slider.
  - Direct trigger to open the complete Color Studio.
- **Size Control**:
  - Interactive glyph showing true tip profile and dimension.
  - Stepped presets and fluid slider adjustment.
- **Line Assist & Stability**:
  - *Steady while drawing (Steady Stroke)*: Leash-based physical stabilizer to eliminate hand tremor (Off, Low, Medium, High).
  - *Live line feel*: Real-time smoothing algorithms (Smooth Glide / Streamline, Natural / Exponential, Direct Raw) with strength slider.
  - *Clean up after drawing (Predictive Stroke)*: Post-stroke geometric curve refinement (Off, Low, Medium, High).
  - *Turn lines into shapes*: Automatic shape intent recognition that converts rough loops into clean circles, ellipses, rectangles, or triangles.
  - *Ruler*: Constrains freehand strokes into exact straight lines.
  - *Auto-Align to Axes & Isometric Steps*: Automatically snaps straight lines to vertical (90°), horizontal, and 30° isometric angles.

---

## 4. Color Studio

- **Color Wheel Tab**:
  - 360-degree HSV hue ring and saturation/brightness gradient square.
  - Numerical Hex code display, input field, and clipboard copy.
  - Native system color picker trigger.
  - Screen eyedropper tool to sample colors from any pixel.
- **OKLCH Tab**:
  - Perceptually uniform Lightness, Chroma, and Hue sliders.
  - Multi-step gradient ramps.
  - Posterization slider to reduce continuous tones into distinct graphic bands.
- **Harmonies Tab**:
  - Automated Complementary and Analogous harmony generation.
  - Curated architectural and design palettes (*Drafting Neon*, *Clay & Terracotta*, *Nordic Architecture*, *Cyberpunk Synth*, *Monochrome & Ink*).
- **Shaders & Materials Tab**:
  - 27 animated GLSL procedural materials:
    - *Flat White Clay*
    - *Classic 2-Tone Cel Shading*
    - *Crystal Clear Glass & Rainbow Prism*
    - *Summer Ocean Water*
    - *Polished Gold & Burnished Copper*
    - *Electric Neon Cyan*
    - *Hot Molten Lava*
    - *Manga Ink & White*
  - Support for custom GLSL vertex and fragment shader code with editable uniforms.
- **Workspace Integration**:
  - Non-blocking floating window mode allows drawing on canvas while panel remains open.

---

## 5. Studio Settings & Preferences

### Studio
- **Theme**: Toggle between Light Mode and Dark Mode.
- **UI Scale**: Adjustable interface zoom factor (70% to 150%) for phones, tablets, or high-density monitors.
- **Touch Input Drawing**: Enable or disable capacitive touch stroke generation (permits stylus-only drawing with passive touch palm rejection).
- **Tool Dock Alignment**: Responsive auto-placement, pinned to Left, or pinned to Right.
- **Auto-hide Tool Dock**: Automatically collapses dock to maximize drawing area; revealed via edge grab handle.
- **Radial Quick Menu**: Enables or disables the circular context menu triggered by stylus side button or mouse right-click.
- **Tactile Sound & Feedback**: Auditory click feedback and vibration haptics.

### Scene & Canvas
- **Canvas Format Presets**: Rapidly re-aspect the drawing plane to Portrait, Square, or Wide/Landscape without clearing artwork.
- **Manual Canvas Dimensions**: Dedicated width and height sliders.
- **Canvas Color**: Custom color picker for the drawing plane background.
- **Canvas Transparency**: Sliders from 0% (fully opaque) to 100% (transparent glass view into 3D space).
- **Clear Canvas**: Removes all drawn strokes while retaining layer structures and imported meshes.
- **Ground Grid**: Toggles the 3D floor reference grid.
- **Drawing Plane**: Toggles the physical canvas surface mesh.
- **Model Appearance**: Toggles loaded 3D models between original material textures and uniform White Clay.

### Storage & Diagnostics
- **Storage Protection**: Prompts for persistent browser storage permissions (`navigator.storage.persist()`) to avoid cache eviction.
- **Autosave Recovery**: Restores project state from background IndexedDB auto-save snapshot.
- **Performance Diagnostics**: Displays real-time frames per second (FPS) and render loop latency.

---

## 6. Studio Illumination (Lighting Setup)

- **3D Dome Trackball**: Interactive hemispherical trackball to intuitively orient key light direction.
- **Lighting Presets**: Studio, North Light, Softbox, and Silhouette.
- **Light Intensity**: Linear illuminance slider.
- **Shadow Softness**: Penumbra spread adjustment for soft ambient shadow diffusion.
- **Color Tones**: Quick temperature selections (*Warm*, *White*, *Cool*, *Golden*).
- **Floor Shadows**: Real-time ground plane contact shadow generation.
- **Reference Grid**: Toggles ground grid alignment inside the illumination preview.

---

## 7. Picture Quality (Render Settings & Post-Processing)

- **Display Modes**: Fast (low-overhead drafting) vs Best Look (full-quality composition).
- **Path Tracing & Global Illumination**: Physically based ambient light transport with sampling presets (Quick 24, Good 48, Best 64 passes).
- **Vivid Color (Vibrance)**: Perceptual saturation lift that enriches muted colors while preserving skin tones and bright highlights.
- **Bloom & Glow Halo**: Full-screen emissive glow filter with intensity and spread radius controls.
- **Toon / Cel Shading**: Multi-step posterized lighting (2 to 6 discrete steps).
- **Depth of Field (DoF)**: Camera focus distance and aperture blur diameter.
- **Cinematic Film Grain**: Micro-grain noise overlay with intensity slider.
- **Retro Pixelation Grid**: Screen-space downsampling grid with pixel size control.
- **Recalculate Normals**: One-click smoothing tool to recompute surface normals across strokes and meshes.
- **Hardware Diagnostics**: Readout of active GPU adapter, WebGL/WebGPU backend, and maximum 2D texture dimensions.

---

## 8. Export Capabilities

- **3D Model (GLB)**: Self-contained binary glTF file including all stroke geometry, materials, and imported models.
- **Wavefront OBJ**: Standard polygon mesh file for 3D modeling and animation suites.
- **Texture Image (2K PNG)**: 2048 × 2048 painted surface texture map for UV-mapped models.
- **Screenshot (Rendered PNG)**: High-resolution clean view capture of the 3D canvas.
- **Save to In-App Library**: Stores the model in local IndexedDB storage with an auto-generated thumbnail.

---

## 9. Projects & File Management

- **Save Project Session**: Saves the complete scene state, layer hierarchy, and undo history.
- **Project Browser**: Visual card list of saved projects with dates, stroke counts, layer counts, and thumbnail previews.
- **Export to Folder**: Native file system integration (File System Access API) to save directly to local directories.
- **Download Project File**: Exports a portable `.remix3d` archive file.
- **Upload / Import File**: Opens project archives from local storage.
- **Delete Project**: Removes stored project sessions.

---

## 10. 3D Navigation, Camera & Viewport Tools

- **Option 3 Sphere Navigator**:
  - Layout styles: *3D Sphere*, *Flat Disc*, *Petal*, and *Collar*.
  - Manipulation modes: *Orbit* (camera view), *Move* (translate), *Rotate*, and *Resize*.
  - Orthographic snap points: *Front*, *Back*, *Top*, *Bottom*, *Left*, *Right*, and *Isometric*.
  - Camera projection: Perspective vs Orthographic.
  - Step quantizing: Angular snapping (Free, 5°, 15°, 45°) and distance increments (Free, 0.25, 0.5, 1.0).
- **Camera Recovery Pill**: Contextual helper pill (*"Lost? Tap to return to artwork"*) triggered whenever artwork leaves the camera frustum.
- **Screen Center Crosshair**: Central viewport alignment indicator.

---

## 11. Reference Images (Floating Clipboard)

- **Input Methods**: Upload image file or paste directly from system clipboard (`Ctrl+V`).
- **Interactive Manipulation**: Move, scale, and rotate reference image overlays.
- **Opacity Slider**: Adjust transparency for tracing.
- **Color Filters**: Grayscale conversion and color inversion toggles.
- **Tracing Mode (Click-Through)**: Passes touch/stylus events through the image directly to the 3D drawing canvas.
- **Multi-Image Sheets**: Pin, hide, lock, or delete multiple reference boards simultaneously.

---

## 12. Augmented Reality (AR Viewer)

- **WebXR Immersive AR**: Places 3D sketches onto real-world floors using camera-based hit testing.
- **Simulated AR Mode**: Viewport-based scale preview (1 unit = 1 meter) for hardware without WebXR support.
- **Elevation Slider**: Adjusts artwork altitude relative to the detected floor.

---

## 13. Radial Menu & Keyboard Shortcuts

- **Radial Quick Menu**: Circular wheel triggered by stylus barrel button or right-click:
  - Direct access to Brush, Eraser, Eyedropper, Undo, Redo, Swatches, Symmetry, Reset View, and Brush Size.
- **Keyboard Shortcuts**:
  - `Ctrl+S` / `Cmd+S`: Quick save project.
  - `Ctrl+Z`: Undo.
  - `Ctrl+Shift+Z` / `Ctrl+Y`: Redo.
  - `Ctrl+C`: Copy selected strokes.
  - `Ctrl+V`: Paste copied strokes.
  - `B`: Activate Brush tool.
  - `U`: Activate 3D Spatial Brush.
  - `I`: Toggle Eyedropper / Paint Picker.
  - `J`: Toggle Brush Picker.
  - `[` / `]`: Decrease / Increase brush size.

---

## 14. Mobile Device Simulator Frame

- Embedded test frame simulating specific mobile device resolutions:
  - *Galaxy S25 Ultra* (phone form factor).
  - *Galaxy Tab S6 Lite* (tablet form factor with S-Pen aspect ratio).
  - *Orientation Rotation*: Quick toggle between Portrait and Landscape viewports.
  - *Desktop Mode*: Native unrestricted window display.
