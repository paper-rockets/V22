# Handoff — Select tool: auto pick, auto let go

**Branch:** `select-auto-pick` (off `main`)
**Commit:** `a601ef8` — "Select tool: tap picks whatever you touch, tap empty space to let go"
**Working tree:** clean apart from five untracked doc files (see *Loose ends*).

---

## What this change is

Picking something used to take two steps: choose a kind of thing in **What to
select**, then tap it. And once something was picked there was no way to let go
of it.

Now the tap decides for itself, and a tap on nothing lets go.

| Before | After |
| --- | --- |
| Pick "3D models", then tap the model | Tap the model |
| Pick "Current layer", then tap a line | Tap a line — you get its whole layer |
| Selection stuck until you picked something else | Tap empty space, or leave Select, and it lets go |
| Move / Rotate / Resize were three buttons to switch between | One finger moves, two fingers pinch to resize and twist to turn |

Auto is on by default and is remembered between sessions
(`localStorage: remix3d.autoSelect`). The four old rows still sit under the Auto
button; tapping one pins that kind of thing and turns Auto off, and the Auto
button turns it back on.

---

## How it is put together

### The `none` scope

`TransformTargetScope` in `src/types.ts` gained a `'none'` member, which carries
"nothing is picked". `getSelectionSummary` reports it as empty, so the on-screen
frame hides and the action buttons grey out on their existing `isEmpty` checks.
Nothing else needed a branch for it: `transformController` resolves scopes
through `if` chains with no final `else`, so a `'none'` scope simply moves
nothing.

App now starts at `'none'` instead of `'active_layer'`.

### The stale-scope trap (read this before touching the gesture code)

A tap that picks something also changes the scope up in `App`, and that only
lands on the **next render**. The rest of the gesture — the grab-and-drag that
picks a model and moves it in one motion — runs inside the same event, still
holding the old prop.

`Viewport.tsx` keeps `pendingScopeRef` for this. `setScopeNow(scope)` writes the
ref and calls the parent; `scopeNow()` reads the ref, falling back to the prop;
an effect clears the ref whenever the prop changes. **Every engine call inside a
select gesture goes through `scopeNow()`, never the `targetScope` prop.** Using
the prop instead makes press-and-drag on a model orbit the camera rather than
move the model, which is a confusing failure to chase down later.

### Gestures instead of modes

`dragActionForMode` is now just `shiftKey ? 'turn' : 'move'`. It no longer reads
`transformMode`, so the View controls' mode cannot change what a drag on the
canvas does. Pinch-to-resize and twist-to-turn were already implemented in the
two-pointer path and are untouched.

`transformMode` / `onSelectTransformMode` still exist as props on `SelectPanel`
for the navigator's sake, but the panel no longer renders the three buttons and
no longer sets them.

### Models settle on the ground

`transformController.liftOntoGround(scope)` lifts a selection that has sunk
below `groundY = -1.2` back onto it, and does nothing to one resting on it or
floating above. It deliberately does **not** call `beginTransform` /
`endTransform`: `Viewport.finishGesture` calls it while the drag is still open,
so settling down is part of the same undo step as the move.

Two guards worth keeping:

- it only ever lifts, so a model raised into the air on purpose stays there;
- the drawing canvas is exempt (`engine.isCanvasSelected()`), because it is a
  surface you place where you like. Without that guard, dragging the canvas
  downwards fights you — this was caught in testing.

Toggle lives in the panel, on by default
(`localStorage: remix3d.keepModelsOnGround`).

### Letting go

Three routes, all doing the same thing:

1. a tap on empty space with Auto on (`selectAtPoint`, the fall-through case);
2. leaving the Select tool — `App.handleSetTool` wraps `setTool` and clears on
   the way out. Every tool switch in `App.tsx` now goes through this wrapper;
3. the **Let go** button in the panel and the **X** in the on-canvas bar.

With a row pinned by hand, the pin stays put and only the picked lines and model
are dropped.

---

## Files touched

| File | What changed |
| --- | --- |
| `src/types.ts` | `'none'` added to `TransformTargetScope` |
| `src/core/studioEngine.ts` | `'none'` summary case, `liftOntoGround` passthrough |
| `src/core/transformController.ts` | `liftOntoGround` |
| `src/components/Viewport.tsx` | `selectAtPoint` rewrite, `pendingScopeRef` / `scopeNow`, gesture-only drag, ground settle in `finishGesture` |
| `src/components/pro/SelectPanel.tsx` | Auto button, gesture list, ground toggle, Let go button, three mode buttons removed |
| `src/components/pro/ProPanel.tsx` | passes the two new settings through |
| `src/App.tsx` | `autoSelect` and `keepModelsOnGround` state, `handleSetTool`, `handleClearSelection` |

`SelectionFrame.tsx` and `selectionFrame.css` also appear in the commit. Those
were already modified in the working tree before this work started — the frame
rewrite — and went in alongside because they are part of the same select work
and are what the app runs.

---

## Tested, and not tested

Checked in the browser against the dev server on port 5174:

- tapping the canvas picks it, frame and label appear;
- tapping a line picks `Layer 1 · 1 line` and raises the action bar;
- tapping empty space clears back to "Tap anything to pick it";
- press-and-drag on the canvas picks it and moves it in one motion, with no
  camera orbit — the stale-scope path;
- `npx tsc --noEmit` is clean.

**Still to check:**

- the ground rule with a real 3D model — a cube was being added when the session
  ended. The canvas exemption went in after seeing the rule fight a canvas drag,
  and has not been run since;
- pinch and twist, which need real fingers on the tablet;
- tapping a line and dragging in the same motion (layer grab-and-drag);
- a pinned row still behaving as it used to with Auto off.

---

## Loose ends

- Five untracked docs sit in the folder and are **not** in the commit:
  `FEATURES_AND_OPTIONS.md`, `FUNCTIONS_INVENTORY.md`, `MENU_LAYOUT.md`,
  `TECH_SPECS.md`, `UI_UX_OVERVIEW.md`. They pre-date this work.
- `MENU_LAYOUT.md` and `UI_UX_OVERVIEW.md` still describe the old Select panel
  with its three transform buttons, so they are now out of date.
- The dev server is started from the global launch config entry `v22-test`
  (port 5174). This folder has no `.claude/launch.json` and does not need one.

---

## Where this was heading next

The stated goal is **no separate gizmo at all: hand moves things, pen draws.**

This change is the first half of it. Transform modes no longer live in the
Select panel, so the View controls are the only place left that still switches
between Move, Rotate and Resize — which makes the gizmo removable in a way it
was not before.

The next piece is routing by pointer type in `Viewport.handlePointerDown`: pen
draws whatever the tool says, finger handles and moves objects. The palm
rejection already there (`lastPenEventTimeRef`, a 500 ms window) is the place
that logic has to live alongside, and the stylus lock (`isStylusLockEnabled`)
overlaps with it. Worth doing as its own change rather than bolting onto this
one.
