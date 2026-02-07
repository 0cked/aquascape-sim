# Phase 4: Undo/Redo Command System

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

Aquascaping is iterative. Without undo/redo, users either “play it safe” or constantly delete and re-place objects when experimenting. This phase adds a real undo/redo history to the editor so that the core actions (place, delete, duplicate, transform) are reversible with standard shortcuts (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z) and without state drift. After this phase, a user can place several objects, move one with the gizmo, delete one, and then undo/redo step-by-step back and forth reliably.

## Progress

- [x] (2026-02-07) Milestone 1: Add a command-based history model to the editor store (undo/redo stacks) without changing UI behavior yet.
- [x] (2026-02-07) Milestone 2: Convert editor actions (place, delete, duplicate) to issue commands and record history.
- [x] (2026-02-07) Milestone 3: Record transform edits as commands (gizmo drag end and properties edits) without spamming history during drag.
- [x] (2026-02-07) Milestone 4: Keyboard shortcuts + toolbar buttons for undo/redo, and clear history on load/reset.
- [ ] (2026-02-07) Milestone 5: Tests, validation, and deploy.

## Surprises & Discoveries

(To be updated as surprises occur.)

## Decision Log

(To be updated as decisions are made.)

- Decision: Implement undo/redo as explicit commands (`do`/`undo`) stored in bounded stacks (`undoStack`/`redoStack`) inside the editor store.
  Rationale: Commands make it easier to ensure reversibility for complex multi-field edits (transforms, duplicate/delete) without drift, and they provide a natural place to capture “before/after” snapshots.
  Date/Author: 2026-02-07 / Codex.
- Decision: Keep the existing store API (`addObject/removeObjects/duplicateObjects`) but implement them as thin wrappers around `executeCommand(...)`.
  Rationale: This minimizes UI churn and allows migrating actions to commands incrementally while keeping behavior stable at each milestone.
  Date/Author: 2026-02-07 / Codex.
- Decision: Add `commitTransform(id, before, after, label)` to record a single transform command at “commit points” (gizmo drag end and input blur) while allowing live store updates during drag.
  Rationale: Users need live visual feedback while dragging, but history must remain readable and not contain hundreds of micro-steps. Capturing before/after at commit time prevents drift and keeps undo intuitive.
  Date/Author: 2026-02-07 / Codex.
- Decision: Implement standard undo/redo shortcuts (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z, Cmd/Ctrl+Y) and surface Undo/Redo buttons in the toolbar.
  Rationale: Users expect editor-grade keybindings; the toolbar buttons also make undo/redo discoverable and help confirm whether history is being recorded.
  Date/Author: 2026-02-07 / Codex.

## Outcomes & Retrospective

(To be updated at milestone completions.)

- (2026-02-07) Milestone 1 outcome: The editor store now contains undo/redo stacks plus `executeCommand/undo/redo/clearHistory` actions, with no behavior changes yet. All tests still pass.
- (2026-02-07) Milestone 2 outcome: Place/delete/duplicate now go through `executeCommand(...)` and produce undoable history entries, while preserving the existing editor UI behavior.
- (2026-02-07) Milestone 3 outcome: Gizmo transforms and properties panel edits now push one undoable transform command per completed edit (drag end / input blur), instead of spamming the history during live interaction.
- (2026-02-07) Milestone 4 outcome: Undo/redo is accessible via Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z (plus Ctrl/Cmd+Y), and Undo/Redo toolbar buttons reflect stack availability. Loading a build clears history to avoid undoing across unrelated scenes.

---

## Context and Orientation

The editor store is `src/lib/store/editor-store.ts` (Zustand + Immer). It currently owns:

- Scene objects (`objects: PlacedObject[]`).
- Selection state (multi-select + active selection).
- Transform UI state (`transformMode`, `isTransforming`).
- A small physics ergonomics flag (`dynamicObjectIds`) to keep newly placed/duplicated objects dynamic until they sleep.

The UI routes actions into the store:

- Placement: `src/components/three/placement-handler.tsx` calls `addObject(...)`.
- Delete: `src/components/editor/toolbar.tsx` and `src/components/editor/properties-panel.tsx` call `removeObjects(...)`.
- Duplicate: `src/components/editor/properties-panel.tsx` calls `duplicateObjects(...)`.
- Transform edits: `src/components/three/scene.tsx` updates transforms during gizmo drag via `updateObject(...)`, and the properties panel updates transforms via `updateObject(...)`.

Serialization (saving) uses only `objects`, via `src/lib/store/serialization.ts`. The undo/redo stacks must not be persisted in saved builds.

## Plan of Work

### Milestone 1: Store History Model

Add an explicit command model to the editor store:

- A command is an object with:
  - `name` (for debugging)
  - `do(state)` which applies the change
  - `undo(state)` which reverts it
- Store holds:
  - `undoStack: Command[]`
  - `redoStack: Command[]`
  - `historyLimit` (e.g. 100) to bound memory

Add store actions:

- `execute(command)` pushes onto undo stack and clears redo stack.
- `undo()` pops undo stack, calls undo, pushes to redo stack.
- `redo()` pops redo stack, calls do, pushes to undo stack.
- `clearHistory()` empties stacks (called on reset and after load builds).

At this milestone, existing UI can still call the old actions; we will bridge them in Milestone 2.

### Milestone 2: Commands For Place/Delete/Duplicate

Convert:

- `addObject`
- `removeObjects`
- `duplicateObjects`

into thin wrappers that create and `execute(...)` commands.

Requirements:

- Undoing placement removes the object(s) and restores prior selection.
- Undoing delete restores the deleted objects in the same order and restores selection.
- Undoing duplicate removes the duplicates and restores selection.

### Milestone 3: Transform Commands (No Spam)

Transforms happen continuously while dragging, but history should record one entry per “completed” transform.

Implement:

- A “transform transaction” that captures:
  - active object id(s)
  - initial `position/rotation/scale`
  - final `position/rotation/scale`
- When gizmo drag ends (`onMouseUp`), execute one transform command if the final transform differs from initial.
- For the properties panel numeric inputs, execute a transform command on “commit moments”:
  - on blur of a numeric field, or on Enter, capture pre/post and execute a single command.

### Milestone 4: Undo/Redo UX + Shortcuts

Add:

- Toolbar buttons: Undo / Redo (disabled when stacks empty).
- Keyboard shortcuts:
  - Cmd/Ctrl+Z -> undo
  - Shift+Cmd/Ctrl+Z -> redo
  - Cmd/Ctrl+Y -> redo (optional)

Ensure history is cleared when:

- Loading a build (`setObjects`)
- Resetting the editor (`reset`)

### Milestone 5: Tests + Validation

Add a vitest test that simulates the acceptance sequence:

1. Place 3 objects.
2. Transform one.
3. Delete one.
4. Undo step-by-step back to the starting state.
5. Redo step-by-step back to the ending state.

Run:

    pnpm type-check
    pnpm lint
    pnpm test
    pnpm build

## Validation and Acceptance

Local acceptance:

1. `pnpm dev`
2. Open `http://localhost:3000/editor`.
3. Perform: place 3 objects, move 1, delete 1.
4. Press Cmd/Ctrl+Z repeatedly: the actions undo in reverse order without glitches.
5. Press Shift+Cmd/Ctrl+Z repeatedly: the actions redo in forward order.
6. Saving a build still stores only objects, not undo history (loading a build starts with empty undo stack).

CI/build acceptance:

- `pnpm type-check && pnpm lint && pnpm test && pnpm build` all pass.

## Idempotence and Recovery

Undo/redo is an internal refactor plus additive UI. If the command refactor introduces regressions, revert to the last milestone commit and reintroduce command execution behind the old store API, one action at a time, keeping tests passing at each step.

## Artifacts and Notes

(Attach short transcripts or key diffs as they arise.)

---

Plan Revision Notes:

- (2026-02-07) Recorded Milestone 1 completion after adding the command history model to the editor store.
- (2026-02-07) Recorded Milestone 2 completion after converting place/delete/duplicate actions to command execution.
- (2026-02-07) Recorded Milestone 3 completion after introducing `commitTransform` and wiring transform edits to commit-time commands.
- (2026-02-07) Recorded Milestone 4 completion after adding undo/redo shortcuts, toolbar buttons, and clearing history on load.
