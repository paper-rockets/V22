# Complete Studio Menu & Submenu Layout

This document provides a comprehensive overview of the menu structure, navigation bars, context panels, popovers, submenus, and modals across the application.

---

## 1. Top Header Bar (`StudioTopStrip`)

Located across the top of the workspace.

*   **Project Selector & Identity Button** (Left)
    *   Displays current project/model name (e.g., `Model`).
    *   Clicking opens the **Project Session Management Modal**.
*   **Autosave Status Indicator**
    *   **Saving**: Animated indicator indicating background save in progress.
    *   **Saved**: Timestamped confirmation that changes are persisted.
    *   **Retry save**: Alert button to manually retry if storage write fails.
*   **History Action Controls**
    *   **Undo**: Revert the previous stroke or edit action.
    *   **Redo**: Re-apply the previously undone action.
*   **Studio Illumination Shortcut** (Sun icon)
    *   Opens the **Simple Scene Illumination Modal** for lighting adjustments.
*   **Top "More" Menu Button** (Gear icon)
    *   Opens the **Studio Top More Menu** dialog:
        *   **Projects**: Save, open, and manage projects.
        *   **Studio Settings**: Opens the consolidated preferences sheet.
        *   **Full Screen / Exit Full Screen**: Toggles browser fullscreen view.

---

## 2. Main Studio Dock & Rail (`ProRail`)

The primary dock for switching between studio modes and managing active drawing tools.

### A. Studio Mode Buttons
1.  **Draw**
    *   Switches active tool to drawing.
    *   Directs touch/pen inputs into 3D stroke creation.
2.  **Erase**
    *   Activates the stroke eraser.
    *   Displays on-screen status toast: *"Drag across any line to erase"*.
3.  **Select**
    *   Opens the **Select Submenu Panel** (`SelectPanel`):
        *   **Status Readout**: Displays currently active selection scope (e.g., *Selected: Current layer*, *Selected: Lines*, or *Nothing selected*).
        *   **How to Select**:
            *   *Tap*: Single-item tap or pick-and-drag.
            *   *Lasso*: Loop selection around multiple lines.
        *   **What to Select (Scope)**:
            *   *Current layer*: Edits all strokes belonging to the active layer.
            *   *Lines*: Selects individual drawn strokes.
            *   *3D models*: Selects loaded 3D meshes.
            *   *Everything*: Selects canvas, strokes, and models simultaneously.
            *   *3D guide*: Selects the active guide (visible when a guide is loaded).
        *   **Dragging the Selection (Transform Mode)**:
            *   *Move*: Translate selection position.
            *   *Rotate*: Rotate selection around center.
            *   *Resize*: Scale selection proportionally.
            *   *View Controls Toggle*: Show or hide the 3D navigator gizmo.
        *   **Selection Actions**:
            *   *To ground*: Drops the selection flush onto the ground grid plane.
            *   *Duplicate*: Clones the selected content.
            *   *Delete*: Removes the selected item (reversible via Undo).
4.  **Add (Create)**
    *   Opens the **Add Submenu Panel** (`CreatePanel`):
        *   **3D Shapes (Primitives)**:
            *   *Cube*
            *   *Sphere*
            *   *Cylinder*
            *   *Plane* (Flat drawing surface)
        *   **More Ways to Add (Expandable Drawer)**:
            *   *Drawing Guides & Mannequins*:
                *   *Mannequins*: Opens the **3D Mannequins Modal** (Human figure, head cage, vehicle chassis, limb guides).
                *   *Bend Path*: Opens the **Bent 3D Guide Modal** (Curved ribbon guides).
            *   *3D Models*:
                *   *Browse Model Library*: Opens the built-in preset and saved model library.
                *   *Import 3D Model File*: Opens file browser for GLB, OBJ, STL files.
5.  **Layers**
    *   Opens the **Layers Studio Submenu Panel** (`LayerPanel`):
        *   **Top Action Buttons**:
            *   *New Layer*: Creates an independent drawing layer.
            *   *New Group*: Creates a collapsible organizational folder.
        *   **Layer Hierarchy List (Tree View)**:
            *   *Expand / Collapse*: For group folders.
            *   *Visibility Toggle (Eye icon)*: Hide or show individual layers/groups.
            *   *Lock Toggle (Lock icon)*: Protect layers from unwanted edits.
            *   *Double-click Label*: In-line layer renaming.
        *   **Selected Layer Actions (Expanded Drawer)**:
            *   *Indent*: Move layer inside the preceding group folder.
            *   *Outdent*: Move layer out of its parent folder.
            *   *Color Tag*: Popover to assign colored identification dots (Red, Orange, Amber, Emerald, Cyan, Indigo, Pink, or None).
            *   *Duplicate*: Clones layer and its geometry.
            *   *Delete*: Deletes layer and its strokes.
            *   *Opacity Slider*: Adjusts layer opacity from 0% to 100%.
            *   *Add Layer Inside Group*: Available when a group folder is selected.

---

### B. Frequent Drawing Quick Controls (Dock Popovers)
1.  **Draw Placement ("Draw on...")**
    *   **Surface**: Draw directly onto 3D models or the canvas plane.
    *   **Open Air**: Draw floating 3D strokes freehand in mid-air.
    *   **Guide Rail**: Snap strokes along curved 3D guide wires.
    *   **Surface + Air in One Line (Toggle)**: Start drawing on a surface and continue smoothly into open 3D space.
2.  **Brush Shelf**
    *   **Curated Quick Brushes**:
        *   *Flat Brush* (`streamline_ink`): Everyday ribbon drawing.
        *   *Surface Brush* (`conformal_bead`): Surface-following bead stroke.
        *   *Round Brush* (`spatial_pipe`): Volumetric 3D tube.
        *   *Wide Marker* (`chisel_marker`): Broad chisel tip.
    *   **More Brushes Button**: Expands full library of curated presets.
3.  **Color Shelf**
    *   Current color preview circle with hex / look name readout.
    *   Native OS color picker button.
    *   6 Quick color swatches with active selection checkmark.
    *   Inline Opacity Slider (5% to 100%).
    *   **More Colors Button**: Opens the full Color Studio.
4.  **Size Shelf**
    *   Physical millimeter brush size slider (2mm to 250mm).
    *   Live stroke dimension preview circle.
5.  **Assist (Line Assist Sheet - `ShapesSheet`)**
    *   **Steady while drawing (Stabilizer)**: Leash offset to reduce hand tremor (Off, Low, Medium, High).
    *   **Live line feel**: Real-time algorithm selector (*Smooth Glide*, *Natural*, *Direct Raw*) with strength percentage slider.
    *   **Clean up after drawing (Predictive refitting)**: Smoothing applied upon pen lift (Off, Low, Medium, High).
        *   *Also turn lines into shapes*: Automatic geometric shape recognition (lines, circles, rectangles, triangles).
    *   **Ruler**: Straight-line enforcement mode.
    *   **Auto-Align to Axes & Isometric Steps**: Snaps lines to 90° axes and 30° isometric construction angles.
6.  **Dock Expand / Collapse Control**
    *   Minimizes or expands the dock rail. Auto-hides to a subtle edge grip handle when enabled.

---

## 3. Studio Settings & Preferences (`StudioSettingsSheet`)

Accessible via the Top Strip Menu or settings buttons.

*   **Section 1: Studio**
    *   *Studio Theme*: Toggle Light or Dark appearance.
    *   *UI Scale*: `[-]`, `[100%]`, `[+]` interface sizing controls.
    *   *Touch Input Drawing*: Toggle to enable finger drawing without a stylus.
    *   *Tool Dock Position*: Select placement (`Auto`, `Left`, `Right`).
    *   *Auto-hide Tool Dock*: Toggle automatic collapse when inactive.
    *   *Radial Quick Menu*: Toggle stylus barrel / right-click radial menu.
    *   *Tactile Sound*: Audio clicks and haptic vibration feedback.
*   **Section 2: Scene**
    *   *Canvas Size Presets*: Quick aspect buttons (`Portrait`, `Square`, `Wide`).
    *   *Manual Size Sliders*: Independent Width (W) and Height (H) dimension sliders.
    *   *Canvas Color*: Background color picker.
    *   *Canvas Transparency*: Slider from 0% (solid surface) to 100% (see-through window).
    *   *Clear Canvas*: Removes strokes while maintaining canvas and layer configuration.
    *   *Ground Grid*: Toggle ground reference grid.
*   **"More Settings" (Expandable Accordion)**:
    *   *Drawing Plane*: Toggle visibility of the primary flat drawing sheet.
    *   *Lighting Setup*: Button to open the Studio Illumination modal.
    *   *Picture Quality*: Button to open the Render Settings panel.
    *   *Model Appearance*: Toggle between *Original Colors* (textured) and *White Clay*.
    *   *Share & Export*:
        *   **Projects**: Launch Project Session Manager.
        *   **Export 3D Artwork**: Launch Export Dialog.
        *   **View in AR**: Launch Augmented Reality viewer.
    *   *Reference Images*:
        *   **Reference Images**: Launch Floating Reference Clipboard.
    *   *Storage & Diagnostics*:
        *   **Storage & Autosave**: Check browser persistence and restore from autosave snapshot.
        *   **Performance Diagnostics**: Toggle real-time FPS and latency counter.

---

## 4. 3D View Navigator ("View Controls" - `Option3SphereNavigator` / `JoystickNavigator`)

Floating navigation sphere / joystick positioned in the bottom-right corner (can be collapsed to a corner pill):

*   **Interactive Navigator Orb / Joystick**:
    *   Drag to orbit, pan, or orient the camera around the 3D scene.
*   **On-Screen Mode Switcher**:
    *   *Orbit* (`look`): Rotate camera around the focal point.
    *   *Move* (`move`): Pan position.
    *   *Rotate* (`rotate`): Turn selected item.
    *   *Resize* (`scale`): Scale selected item.
*   **Scope Selector**:
    *   *Current layer*, *Lines*, *3D models*, *Everything*.
*   **View Controls Submenu (`NavigatorSettings`)**:
    *   *Mode*: Segmented switcher between Orbit, Move, Rotate, Resize.
    *   *What to select*: Target scope buttons.
    *   *Active layer*: Dropdown selector for active layer.
    *   *Navigator style*: Switch visual gizmo between `Sphere`, `Disc`, `Petal`, or `Collar`.
    *   *Sensitivity*: Speed presets (`0.5×`, `1×`, `1.5×`, `2×`) + precision slider.
    *   *Camera projection*: Switch between *Perspective* and *Orthographic*.
    *   *Camera view presets*: Quick snap buttons for `Front`, `Side`, `Top`, `Angle`.
    *   *Reset view*: Re-center and frame camera on artwork.
    *   *Hide navigator*: Minimize gizmo into the corner pill button.

---

## 5. Stylus & Right-Click Radial Menu (`StylusRadialMenu`)

Circular 8-slot wheel appearing at stylus contact or cursor location:

*   **Top (-90°)**: *Brush* (Switches to draw mode).
*   **Top-Right (-45°)**: *Eraser* (Switches to erase mode).
*   **Right (0°)**: *Palette* -> Opens **Palette Submenu**:
    *   10 Quick color swatches.
    *   Button to launch full Color Studio.
*   **Bottom-Right (45°)**: *Size* -> Opens **Size Submenu**:
    *   Numeric keypad entry for exact millimeter dimensions.
    *   Continuous line width slider.
    *   Preset size buttons (`5mm`, `15mm`, `35mm`, `80mm`).
*   **Bottom (90°)**: *Undo* (Reverts last action).
*   **Bottom-Left (135°)**: *Redo* (Re-applies action).
*   **Left (180°)**: *Symmetry* -> Opens **Symmetry Submenu**:
    *   *Off* (`none`)
    *   *Mirror X* (Sagittal plane)
    *   *Mirror Y* (Horizontal plane)
    *   *Mirror Z* (Coronal plane)
    *   *Radial 4-Fold* (Kaleidoscopic 4-way symmetry)
    *   *Custom Plane* (User-oriented plane)
*   **Top-Left (-135°)**: *Sampler* (Eyedropper to pick color from canvas).

---

## 6. Active 3D Guide Bar (On-Canvas HUD - `GuideControlBar`)

Floating HUD displayed when a 3D guide is active in the scene:

*   **Guide Identity Badge**: Indicates guide name and type (Bent ribbon or Scaffolding mannequin).
*   **Move / Stretch**: Toggles 3D transform gizmo to position or scale the guide.
*   **Settings**: Opens the specific guide configuration panel.
*   **Draw on Guide**: Locks strokes to glide across the guide wire surface (with *Exit* button).
*   **Delete**: Removes guide from workspace.
*   **Deselect (X)**: Dismisses the guide bar while keeping the guide in scene.

---

## 7. Dedicated Tool Windows & Dialogs (`AppModalHost`)

1.  **Compact Color Studio (`CompactColorStudioModal`)**
    *   *Tab 1: Wheel*: Circular hue ring, saturation/brightness box, hex input, palette management.
    *   *Tab 2: OKLCH*: Perceptual color sliders (Lightness, Chroma, Hue).
    *   *Tab 3: Harmonies*: Complementary and Analogous color rules.
    *   *Tab 4: Shaders*: Material surface finishes (*Clay*, *Toon*, *Gloss*, *Prism*, *Water*, *Metal*, *Copper*, *Glow*, *Lava*, *Ink*).
    *   *Pin Mode*: Pin button to keep Color Studio open alongside active drawing.
2.  **Project Session Manager (`ProjectSessionModal`)**
    *   Project name input and save action.
    *   *Save to Folder*: Direct file system directory export.
    *   *Download Project File*: Save `.paperrocket` file to device.
    *   *Import File*: Open project file from device.
    *   *Saved Sessions List*: History list with thumbnails, timestamps, restore, and delete.
3.  **Export 3D Artwork (`ExportModal`)**
    *   *Export GLB*: Standard binary 3D model with strokes.
    *   *Export OBJ*: Wavefront 3D geometry file.
    *   *Export UV Texture*: Baked texture map image (PNG).
    *   *High-Resolution Snapshot*: Camera viewport image capture (PNG).
    *   *Save to Library*: Save model to internal browser favorites.
4.  **Lighting Setup (`SimpleSceneIlluminationModal`)**
    *   *Lighting Presets*: `Studio`, `North Light`, `Softbox`, `Silhouette`.
    *   *Interactive Dome*: Trackball puck to reposition light direction.
    *   *Tone Presets*: `Warm`, `White`, `Cool`, `Golden`.
    *   *Sliders*: Intensity (Brightness) and Softness.
    *   *Toggles*: Contact Shadow Floor and Ground Grid.
5.  **Picture Quality (`RenderSettingsPanel`)**
    *   *Display Mode*: Segmented switch between `Fast` (Draft) and `Best look` (Render).
    *   *Post-Processing Controls*: Bloom (Glow), Vignette, Tone mapping exposure, Ambient Occlusion, Depth of Field, Ray tracing, and Mesh normal recalculation.
6.  **Model Library (`ModelLibraryModal`)**
    *   *Tabs*: `Presets` vs `Saved Models`.
    *   Search filter, load choice (*Add to scene* vs *Replace scene*), and display mode (*Original Texture* vs *White Clay*).
7.  **3D Mannequins & Form Guides (`ScaffoldingModal`)**
    *   *Proxies*: Mannequin Torso, Loomis Head Cage, Vehicle Chassis, Limb Armature, Architectural Dome.
    *   *Render Modes*: Wireframe cage, solid silhouette, semi-transparent ghost, edge rings.
8.  **Bent 3D Guide (`BentGuideModal`)**
    *   *Presets*: Wave, Arch, Spiral, Saddle.
    *   *Profiles*: Ribbon, Arc, U-Channel, Pipe.
    *   *Sliders*: Width, Opacity, Tension, Divisions, Twist.
9.  **Custom Mirror Plane (`CustomMirrorModal`)**
    *   Origin, normal, and camera-align controls for arbitrary mirror planes.
10. **Reference Clipboard (`FloatingReferenceClipboard`)**
    *   Pin multiple 2D reference images or blueprints with opacity, zoom, and transform controls.
11. **AR Viewer (`ARViewerModal`)**
    *   WebXR augmented reality tool to project 3D models into real physical space.
