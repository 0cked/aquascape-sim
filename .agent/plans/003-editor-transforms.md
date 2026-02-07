# Phase 3: Transform Tools and Properties Panel

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

AquascapeSim currently supports placing assets and selecting a single object, but it is not yet an editor. This phase adds the core editing workflow: selecting one or more objects, moving/rotating/scaling them with a gizmo, and editing exact numeric transform values in a right-side properties panel. After this phase, a user can place a rock, select it, translate/rotate/scale it in the tank without fighting the camera controls, and save/load preserves all transforms.

## Progress

- [x] (2026-02-07) Milestone 1: Upgrade the editor selection model (multi-select + active selection) and update the toolbar/scene to match.
- [ ] (2026-02-07) Milestone 2: Add a right-side properties panel that edits position/rotation/scale numerically and supports duplicate/delete.
- [ ] (2026-02-07) Milestone 3: Add transform mode state + UI (translate/rotate/scale) with keyboard shortcuts.
- [ ] (2026-02-07) Milestone 4: Integrate `TransformControls` (gizmo) with Rapier bodies, snapping/clamping rules, and “don’t crash the scene” ergonomics.
- [ ] (2026-02-07) Milestone 5: Validation, regression tests, and deploy polish.

## Surprises & Discoveries

(To be updated as surprises occur.)

## Decision Log

(To be updated as decisions are made.)

- Decision: Represent selection as `selectedObjectIds: string[]` + `activeObjectId: string | null`, where the active object is the last selected and is the gizmo/panel target.
  Rationale: Multi-select needs both “the set” and “the focused object”; this matches common DCC/editor UX and keeps later `TransformControls` wiring simple.
  Date/Author: 2026-02-07 / Codex.
- Decision: Shift-click toggles selection membership; Delete removes the full selection (not just the active object).
  Rationale: This is the smallest multi-select behavior that feels like an editor and enables batch delete/duplicate without additional UI.
  Date/Author: 2026-02-07 / Codex.

## Outcomes & Retrospective

(To be updated at milestone completions.)

- (2026-02-07) Milestone 1 outcome: The editor supports multi-select (Shift-click) with an active selection, and the toolbar/scene highlight state reflect the selection model. Store tests updated and still passing.

---

## Context and Orientation

The editor page is `src/app/editor/page.tsx`, which renders:

- `src/components/three/scene-shell.tsx` to host the R3F canvas.
- `src/components/editor/toolbar.tsx` for top actions (save/load/select/delete).
- `src/components/editor/sidebar.tsx` for asset browsing/placing.

The 3D scene root is `src/components/three/scene.tsx`. It renders:

- Tank + substrate + water + postprocessing.
- Placed objects from the Zustand editor store (`src/lib/store/editor-store.ts`), using a Rapier `RigidBody` per object (`src/components/three/placed-asset.tsx`).

Current editor state lives in `src/lib/store/editor-store.ts`. It stores:

- `mode`: `'select' | 'place'`
- `objects`: an array of `PlacedObject` (`src/types/scene.ts`)
- selection: currently single-object only (`selectedObjectId`)

Placed objects are serialized to JSON and stored in Supabase builds (`src/lib/store/serialization.ts`). Selection state is not serialized.

Important constraints for this phase:

1. We want a “real editor feel”. `TransformControls` (gizmo) must not fight the `OrbitControls`. The gizmo should disable orbit/pan while dragging.
2. The gizmo must move the physics body, not just the mesh. Rapier’s `RigidBody` group is driven by the physics engine; moving only a child mesh will desync visuals and collisions.
3. Snapping/clamping: objects must not be draggable through the tank floor or outside the glass bounds. We clamp translation based on tank inner dimensions and the object’s collider size.

## Plan of Work

### Milestone 1: Selection Model

Upgrade selection from a single `selectedObjectId` to:

- `selectedObjectIds: string[]` for multi-select.
- `activeObjectId: string | null` for “the one the gizmo attaches to” and “the one the properties panel edits by default”.

Update:

- `src/lib/store/editor-store.ts` to provide selection actions:
  - clear selection
  - select one (replace selection)
  - toggle selection with Shift-click semantics
  - remove selected objects
- `src/components/three/scene.tsx` and `src/components/three/placed-asset.tsx` to highlight all selected objects.
- `src/components/editor/toolbar.tsx` to delete the whole selection (and disable delete button when selection is empty).

### Milestone 2: Properties Panel

Add `src/components/editor/properties-panel.tsx` and render it in `src/app/editor/page.tsx` (right side).

Behavior:

- If nothing is selected: show “No selection”.
- If objects are selected: show active object summary (asset name + thumbnail) and “N selected”.
- Numeric fields:
  - Position: X, Y, Z (world units).
  - Rotation: X, Y, Z in degrees (store remains radians).
  - Scale: X, Y, Z.
- Buttons:
  - Duplicate selection (offset slightly so duplicates are visible).
  - Delete selection.
  - Reset transforms for active object (position unchanged; rotation=0; scale=1), optional.

The panel should update store state immediately. Physics body sync is handled in Milestone 4.

### Milestone 3: Transform Mode + Shortcuts

Add to the editor store:

- `transformMode: 'translate' | 'rotate' | 'scale'` (default `'translate'`).
- `isTransforming: boolean` (true while dragging the gizmo).

Update the toolbar to include a small “Transform” control group with three buttons (Move/Rotate/Scale) and implement keyboard shortcuts:

- `W` -> translate
- `E` -> rotate
- `R` -> scale
- `Esc` -> select mode (existing) and stop transforming

### Milestone 4: TransformControls + Rapier Sync + Clamping

Integrate Drei `TransformControls` into `src/components/three/scene.tsx`.

Key implementation details:

1. Keep a runtime map from `objectId -> { objectRef, rigidBody }`:
   - Use `useRigidBodyContext()` inside `src/components/three/placed-asset.tsx` to get the underlying Object3D ref (`ref`) and `getRigidBody()` API.
   - Register/unregister into a `useRef(new Map())` stored in `Scene`.
2. Render exactly one `TransformControls` for the current `activeObjectId`:
   - `object={objectRef}` (Drei supports `RefObject<Object3D>`).
   - `mode={transformMode}`.
   - `onMouseDown` sets `isTransforming=true`.
   - `onMouseUp` sets `isTransforming=false`.
   - `onObjectChange` reads the active object’s Object3D transform, clamps it, writes it back to the Object3D, and updates:
     - the editor store (`updateObject(...)`)
     - the Rapier body (use `setNextKinematicTranslation`/`setNextKinematicRotation` when kinematic).
3. Body types:
   - Newly placed objects should begin as dynamic so they can “drop” and resolve collisions.
   - Once they go to sleep, freeze them to kinematic (so transforms are stable and editor-driven).
   - While the gizmo is dragging, keep the active object kinematic.
4. Clamping rules:
   - `x` and `z` must stay within tank inner bounds minus half-extents of the collider.
   - `y` must be at least substrate top + half-height.
   - Clamp `scale` to a sane range (e.g. 0.2–3.0 per axis) to avoid degeneracies.

### Milestone 5: Validation + Tests + Deploy

Add/extend tests so transform math stays stable:

- Update existing store tests in `src/__tests__/editor-store.test.ts` for the new selection model and duplicate/delete behavior.

Run:

    pnpm type-check
    pnpm lint
    pnpm test
    pnpm build

Push all milestone commits so Vercel deploys the new editor UX.

## Concrete Steps

All commands run from the repo root.

1. Implement Milestone 1 changes. Validate by running `pnpm test` and manually verifying Shift-click multi-select in `/editor`.
2. Implement Milestone 2 properties panel. Validate by selecting an object and editing numeric fields (position/rotation/scale) and observing it move in the scene (after Milestone 4 sync).
3. Implement Milestone 3 toolbar + shortcuts. Validate: W/E/R switches gizmo mode; orbit controls disable while dragging.
4. Implement Milestone 4 transform controls + clamping. Validate: object cannot be dragged outside the tank; object cannot be dragged below substrate.
5. Implement Milestone 5: run all validations and ensure `https://aquascape-sim.vercel.app/editor` works.

## Validation and Acceptance

Local acceptance:

1. `pnpm dev`
2. Open `http://localhost:3000/editor`.
3. Place two objects.
4. Shift-click to multi-select both (both show selection highlight).
5. Active object shows a transform gizmo.
6. Dragging the gizmo moves the object(s) without moving the camera; releasing re-enables orbit controls.
7. Properties panel shows numeric transforms and changing values updates the scene.
8. Save a build, reload it, and transforms persist.

CI/build acceptance:

- `pnpm type-check && pnpm lint && pnpm test && pnpm build` all pass.

## Idempotence and Recovery

All changes are additive or local refactors. If transform controls destabilize the scene, the safe recovery path is to revert to the previous milestone commit where the store model changes landed, then reintroduce the gizmo integration behind a conditional render until stable.

## Artifacts and Notes

(Attach short transcripts or key diffs as they arise.)

---

Plan Revision Note (2026-02-07):

Updated the living sections to record Milestone 1 completion and logged the selection semantics decisions, since subsequent milestones build on this selection model.
