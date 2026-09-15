# Simplicity Implementation Plan

Target executor: Gemini 3.8 Flash

## Product Rule

Keep the power; simplify how users reach it.

Powerful tools are allowed. Simultaneous complexity is not. Beginners should see outcomes such as **Move**, **Turn**, **Resize**, **Smooth**, and **Draw on model**. Technical controls remain available one level deeper.

## Tool Hierarchy

1. **Immediate tools:** Draw, Erase, Select, Add, Layers
2. **Frequent drawing controls:** On model / In space, Brush, Color, Size
3. **Contextual tools:** Move handles, guide controls, layer actions
4. **Advanced tools:** precise X/Y/Z, snapping, smoothing algorithms, navigator variants, rendering, and diagnostics

Do not remove advanced capabilities during testing. Reorganize access to them.

## Token-Saving Rules for Gemini

- Read only the files named in the active task.
- Do not scan lockfiles, generated folders, media, screenshots, scripts, audit documents, PRODUCT.md, DESIGN.md, or README.md.
- Do not capture screenshots. Validate using DOM state, computed layout, keyboard focus, and existing automated checks.
- Do not inspect or modify shaders, rendering pipelines, model assets, serialization formats, export internals, or engine math.
- Complete one task at a time. Report only changed files, checks run, and blockers.
- Preserve `Option3SphereNavigator` appearance, behavior, motion, menus, and positioning logic.
- Keep all interactive targets at least 44x44 CSS pixels; primary actions should be 48-56px.
- Keep visible labels readable. Never solve space problems by shrinking text or touch targets.
- Do not add GSAP. This is an operating interface; frequent actions should feel immediate.

## Device Layout Contract

### Tablet landscape

- Persistent side tool rail
- One docked contextual inspector
- Contextual drawing controls along the bottom
- Artwork retains approximately 65-75% of usable screen area while the inspector is open
- Primary actions use 48-56px targets and readable labels

### Tablet portrait

- Persistent side tool rail
- One lower contextual sheet rather than a squeezed side inspector
- Artwork retains approximately 65-75% of usable screen area where practical
- Only one contextual surface is open at a time

### Cellphone

- One full-width bottom sheet or decision at a time
- No side inspector
- Advanced sections collapsed by default
- Precise numeric values open in a separate temporary sheet
- Short labels are allowed; small touch targets and unreadable text are not
- Preserve capability through progressive disclosure rather than fitting tablet controls onto the phone

Use shared state and capabilities across devices, but distinct phone, tablet-portrait, and tablet-landscape presentations.

## Task 1: Establish the responsive workspace

Files:

- `src/index.css`
- `src/components/pro/ProResponsive.css`
- `src/components/pro/ProShell.tsx`
- `src/components/pro/ProRail.tsx`
- `src/components/pro/ProPanel.tsx`

Implementation:

1. Introduce explicit phone, tablet-portrait, and tablet-landscape layout behavior instead of scaling one layout.
2. Tablet landscape uses a side rail plus one docked inspector and bottom contextual controls.
3. Tablet portrait uses a side rail plus one lower sheet.
4. Phone panels are genuinely full-width bottom sheets with no side inspector.
5. Ensure immediate tools remain reachable while a contextual surface is open.
6. Closed or visually hidden surfaces must not accept pointer events or keyboard focus.
7. Respect `100dvh`, safe-area insets, browser chrome changes, and both left/right-handed rail placement where supported.

Acceptance:

- Validate 360x800 and 390x844 phone layouts, 768x1024 portrait tablet, and 1024x768 landscape tablet.
- Only one panel is open at a time.
- No control overlaps the rail, sheet, navigator, or bottom controls.
- Tablet artwork retains approximately 65-75% of usable area with a panel open.
- Phone does not render a desktop/tablet side inspector.

## Task 2: Enforce the tool hierarchy

Files:

- `src/components/pro/ProRail.tsx`
- `src/components/pro/ProPanel.tsx`
- `src/components/pro/DrawPanel.tsx`
- `src/components/pro/SelectPanel.tsx`
- `src/components/pro/CreatePanel.tsx`
- `src/components/LayerPanel.tsx`
- `src/components/studio/StudioTopMoreMenu.tsx`

Implementation:

1. Make Draw, Erase, Select, Add, and Layers the persistent immediate tools.
2. Keep On model / In space, Brush, Color, and Size visible as frequent drawing controls while Draw is active.
3. Show move handles, guide controls, and layer actions only when their context is active.
4. Move precise coordinates, snapping details, smoothing algorithms, rendering, and diagnostics under a single clear Advanced level.
5. Group no more than four labeled actions at one decision point.
6. Keep the current or recommended choice visually dominant.
7. Preserve all callbacks and features. This task changes information architecture, not engine behavior.

Acceptance:

- A new user can locate Draw, Erase, Select, Add, and Layers without opening More or Preferences.
- The default Draw surface contains only the frequent drawing controls.
- Advanced tools remain reachable in one additional deliberate step.
- Closing and reopening a panel preserves active tool state without preserving unnecessary nested disclosures.

## Task 3: Consolidate navigation into View controls

Files:

- `src/components/TransformNavigator/Option3SphereNavigator.tsx`
- `src/components/studio/StudioTopMoreMenu.tsx`
- `src/components/studio/StudioSettingsSheet.tsx`
- `src/components/studio/GuideControlBar.tsx`
- `src/App.tsx`

Keep visible:

- The corner navigator
- Reset view
- Front, Side, and Top views
- A compact More button

The View controls More menu contains:

- Navigator style
- Sensitivity
- Projection
- Navigator visibility

Implementation:

1. Preserve all navigator variants during testing.
2. Remove navigator variants and sensitivity from primary Preferences surfaces when duplicated.
3. Rename visible `Gizmo` language to `View controls` for camera/navigation or `Move handles` for object transforms. Do not use one label for both concepts.
4. Keep precise camera and transform settings under Advanced.
5. Do not alter the protected navigator’s visuals or interaction behavior; change only how secondary settings are reached.

Acceptance:

- Reset and orthographic view shortcuts are directly accessible.
- Variant, sensitivity, projection, and visibility settings exist in exactly one compact menu.
- Camera navigation and object transformation use distinct plain-language labels.
- No navigation capability is removed.

## Task 4: Teach the first stroke without onboarding friction

Files:

- `src/App.tsx`
- `src/core/onboardingStore.ts`
- `src/components/Viewport.tsx`

Implementation:

1. On a new empty project, show one non-modal hint: `Drag to draw on the model` when On model is active, or `Drag to draw in space` when In space is active.
2. Add one device-appropriate view-navigation hint only when needed.
3. Dismiss after the first completed stroke or explicit close and persist through the existing onboarding store.
4. Do not block canvas input, dim the canvas, launch a tour, or require confirmation.
5. Give the drawing canvas a meaningful accessible name and concise instructions instead of `nv-canvas`.

Acceptance:

- A first-time user understands how to begin within five seconds.
- The hint reflects the selected placement mode.
- It never intercepts drawing input and stays dismissed after completion.
- Screen readers announce the canvas purpose and starting action.

## Task 5: Simplify panels through progressive disclosure

Files:

- `src/components/pro/DrawPanel.tsx`
- `src/components/pro/SelectPanel.tsx`
- `src/components/pro/CreatePanel.tsx`
- `src/components/pro/DeformPanel.tsx`
- `src/components/studio/StudioTopMoreMenu.tsx`

Implementation:

1. Draw defaults to placement, brush, color, and size. Put material variants and smoothing mechanics under Advanced.
2. Select defaults to selection method, target, and Move / Turn / Resize. Put lock, nearby-stroke behavior, reset, and precise transforms under Advanced.
3. Precise X/Y/Z controls open as a temporary dedicated sheet on phone.
4. Add shows the four most common actions first; remaining imports and guides live under More ways to add.
5. Deform uses outcome labels such as Smooth rather than algorithm names.
6. More groups project safety/output first, workspace/view second, and preferences last.

Acceptance:

- Each surface asks the user to make one understandable decision at a time.
- No default group contains more than four labeled choices.
- Expert controls remain available without appearing in beginner-facing views.
- Phone never stacks two sheets or shows precision controls inline with the main panel.

## Task 6: Make saving and export unmistakable

Files:

- `src/components/AutoSaveToast.tsx`
- `src/components/pro/ProResponsive.css`
- `src/components/studio/StudioTopStrip.tsx`
- `src/components/studio/StudioTopMoreMenu.tsx`
- `src/components/studio/StudioSettingsSheet.tsx`
- `src/components/ExportModal.tsx`
- `src/App.tsx`

Implementation:

1. Show a quiet status near the project name: Saving, Saved, or Save failed.
2. Keep success subdued; keep failure persistent and actionable.
3. Rename Projects / Save & Backup to Projects with the description Open, save, or restore.
4. Place Export in the first group of More and remove duplicate routes unless they serve distinct advanced export settings.
5. Preserve existing autosave, recovery, project-session, and export behavior.

Acceptance:

- Users can see whether work is safe without opening a menu.
- Export is reachable in two taps or fewer from the canvas.
- Save failure offers retry or backup without losing work.
- No recovery path or export format is removed.

## Task 7: Plain language, accessibility, and restrained motion

Files:

- Only UI files changed by Tasks 1-6
- `src/components/Viewport.tsx`

Implementation:

1. Use Move, Turn, Resize, Smooth, Draw on model, Draw in space, View controls, and Move handles as primary labels.
2. Keep expert terminology only in optional explanatory text where necessary.
3. Replace `transition-all` in touched controls with explicit properties.
4. Frequent controls respond immediately; occasional entrances stay under 200ms with ease-out.
5. Use subtle press feedback where it does not disturb precision input.
6. Gate hover-only behavior behind `(hover: hover) and (pointer: fine)`.
7. Preserve visible focus, Escape dismissal, focus restoration, reduced motion, ARIA names, and pressed/disabled states.

Acceptance:

- Primary UI contains no unexplained graphics-engine vocabulary.
- The primary workflow is keyboard accessible outside freehand canvas drawing.
- Closed sheets are absent from keyboard and accessibility navigation.
- Reduced motion retains useful state feedback without spatial movement.
- Touch devices do not receive sticky hover behavior.

## Verification

Run after each task where relevant:

```text
npm run lint
npm run build
npm run test
```

Validate without screenshots:

1. New user identifies how to draw within five seconds and makes a stroke.
2. Draw, Erase, Select, Add, and Layers are immediately discoverable.
3. Phone presents one full-width bottom sheet at a time and no side inspector.
4. Tablet portrait and landscape use their specified layouts and preserve the artwork-area target.
5. View controls expose reset and Front / Side / Top directly; secondary navigation settings exist in one More menu.
6. Autosave survives reload and communicates Saving / Saved / Save failed.
7. Export is reachable in two taps or fewer.
8. Tab and Escape behavior work, focus returns to the trigger, and closed panels receive no focus.

## Gemini Execution Order

Execute Tasks 1 through 7 in order. Do not combine them into a single rewrite. After each task, run the relevant checks and stop with a compact handoff before proceeding.
