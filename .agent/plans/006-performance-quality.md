# Phase 6: Performance, Quality Settings, and Regression Guardrails

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

AquascapeSim is now a functional editor with saves and a public gallery. The next failure mode is performance: as soon as users place dozens of assets, the editor can become stuttery, battery-hungry, or crashy on integrated GPUs and mobile browsers.

This phase adds practical performance controls and guardrails. After this phase, the editor exposes quality settings (shadows and post-processing tiers, DPR control), uses safer defaults on constrained devices, reduces physics work for “settled” objects, and introduces CI checks that catch accidental bundle-size regressions. The result should remain interactive at 60 FPS for “normal” scenes and degrade gracefully for large scenes.

## Progress

- [x] (2026-02-07) Milestone 1: Quality store + UI menu with presets that affect DPR, shadows, and post-processing.
- [x] (2026-02-07) Milestone 2: Adaptive performance fallback (auto-degrade on sustained low FPS; user can override).
- [ ] (2026-02-07) Milestone 3: Rendering optimizations for repeated assets (reduce cloning; add instanced static rendering where safe).
- [ ] (2026-02-07) Milestone 4: Physics tuning (fixed bodies for settled objects; safer collider/body updates during transforms).
- [ ] (2026-02-07) Milestone 5: Regression guardrails (bundle size check script + CI `pnpm build` + documented thresholds).

## Surprises & Discoveries

(To be updated as surprises occur.)

## Decision Log

(To be updated as decisions are made.)

- Decision: Implement quality as a small persisted Zustand store (`src/lib/store/quality-store.ts`) with three presets (Low/Medium/High) that map to concrete render toggles.
  Rationale: Presets are easy for users to understand, and persisting only the preset keeps future preset tuning centralized.
  Date/Author: 2026-02-07 / Codex.
- Decision: Wire quality into rendering via explicit props for `Lighting` and `Effects`, and via `<Canvas dpr/shadows>` in `src/components/three/scene.tsx`.
  Rationale: Keeping `Lighting` and `Effects` as mostly “pure” components avoids accidental server/client boundary issues and makes behavior easy to audit.
  Date/Author: 2026-02-07 / Codex.
- Decision: Make auto-degrade “one-shot” by disabling auto-degrade after it triggers, and expose a toggle to re-enable it.
  Rationale: This avoids fighting user intent (repeatedly downgrading after manual changes) while still giving a safety valve for runaway scenes.
  Date/Author: 2026-02-07 / Codex.

## Outcomes & Retrospective

(To be updated at milestone completions.)

(2026-02-07) Milestone 1 outcome: The editor toolbar now includes a “Quality” menu that switches between Low/Medium/High presets, controlling Canvas DPR, shadow enablement, and post-processing (including AO tiers).
(2026-02-07) Milestone 2 outcome: The scene now uses Drei `PerformanceMonitor` to auto-lower quality on sustained performance decline, shows a dismissible on-screen notice, and disables further auto-degrades until the user re-enables the toggle.

## Context and Orientation

Relevant current code paths:

- The 3D editor is at `src/app/editor/page.tsx` and renders the client-only scene via `src/components/three/scene-shell.tsx`.
- The R3F scene root is `src/components/three/scene.tsx`. It creates the `<Canvas>` and mounts:
  - `src/components/three/lighting.tsx` for lights and shadows.
  - `src/components/three/effects.tsx` for post-processing (Bloom + SSAO + ToneMapping + Vignette).
  - `src/components/three/placed-asset.tsx` for each object, including a Rapier rigid body and collider.
- Editor state is stored in Zustand in `src/lib/store/editor-store.ts`. Dynamic bodies are tracked in `dynamicObjectIds`.
- Assets are loaded via `src/lib/assets/use-aquascape-gltf.ts` (Draco + KTX2 support).

Definitions used in this plan:

- “DPR” means device pixel ratio. Higher DPR looks sharper but costs GPU time. In R3F it is controlled by the `<Canvas dpr={...} />` prop.
- “Post-processing” means effects applied after rendering the main scene (Bloom, SSAO). These can be expensive and should be toggleable.
- “Instancing” means drawing many copies of the same mesh with a single draw call using `THREE.InstancedMesh`. It reduces CPU/GPU overhead when many identical assets exist.
- “Settled object” means a placed asset that finished falling/settling and no longer needs to be simulated as a dynamic rigid body.

## Plan of Work

### Milestone 1: Quality Settings (Store + UI + Wiring)

Create a new Zustand store in `src/lib/store/quality-store.ts` that represents quality presets and the underlying toggles. The store should be used only from client components.

Add a small “Quality” menu to the editor toolbar (`src/components/editor/toolbar.tsx`). This menu lets users switch presets:

- Low: no post-processing, reduced DPR, shadows disabled.
- Medium: post-processing enabled with low AO quality, moderate DPR, shadows enabled.
- High: post-processing enabled with higher AO quality, higher DPR, shadows enabled.

Wire quality into rendering:

- In `src/components/three/scene.tsx`, set `<Canvas dpr={...}>` and `<Canvas shadows={...}>` based on the quality store.
- In `src/components/three/effects.tsx`, make post-processing conditional and parameterize AO quality tiers.

Acceptance for Milestone 1:

- In the editor, switching quality presets visibly changes image sharpness and post-processing presence.
- Low preset disables SSAO/bloom and turns off shadows.

### Milestone 2: Adaptive Performance Fallback

Use `@react-three/drei`’s `PerformanceMonitor` (or similar) to detect sustained frame drops and automatically degrade quality one step (High -> Medium -> Low). This should be non-destructive: if a user explicitly selects a preset, do not keep fighting them. Provide a small on-screen banner when auto-degrade occurs.

Acceptance for Milestone 2:

- With a deliberately heavy scene (use the stress tool added in Milestone 3), the editor can auto-switch down to keep interaction responsive.
- The user can manually switch back up.

### Milestone 3: Rendering Optimizations (Cloning + Static Instancing)

Reduce per-object overhead in `src/components/three/placed-asset.tsx`:

1. Replace manual `gltf.scene.clone(true)` traversal with Drei’s `Clone` component where applicable (it supports `castShadow` / `receiveShadow` and avoids repeated traversal code).
2. Add an instanced static rendering path:
   - For each asset type, render settled (non-dynamic) objects in a single `THREE.InstancedMesh` using geometry/material extracted from the model’s first mesh.
   - Keep per-object Rapier rigid bodies + colliders for collision and selection hit-testing, but skip rendering the full model for settled objects once instanced rendering for that asset type is ready.
   - Dynamic objects (currently falling/settling) continue to render individually so visuals track physics.

Acceptance for Milestone 3:

- Placing 50+ copies of a single asset type results in fewer draw calls (observable in browser devtools or by smoother interaction).
- Visuals remain correct for falling objects and after they settle.

### Milestone 4: Physics Tuning

Tune Rapier usage to reduce steady-state work:

- Use `type="fixed"` for settled objects (instead of `kinematicPosition`) when they are not actively being transformed.
- Ensure transforms from the properties panel and gizmos still update the physics bodies by applying translation/rotation updates for non-dynamic bodies.

Acceptance for Milestone 4:

- After objects settle, physics remains stable (no drifting/jitter).
- Selecting and transforming an object still works, and collisions remain correct.

### Milestone 5: Regression Guardrails (Bundle Size + CI)

Add a bundle-size check that runs in CI to catch accidental growth:

- Add a node script `scripts/check-bundle.mjs` that reads `.next/app-build-manifest.json` and sums `.js` bytes for `/editor/page`. Fail if it exceeds a fixed threshold (start with 1,000,000 bytes raw).
- Add `pnpm build` and `pnpm check:bundle` to `.github/workflows/ci.yml`.
- Add `check:bundle` to `package.json` scripts.

Acceptance for Milestone 5:

- `pnpm build` succeeds locally.
- CI includes a build step and fails if bundle thresholds are exceeded.

## Concrete Steps

All commands are run from the repository root (`/Users/jacob/Projects/aquascapesim`).

During implementation, after any source change, run:

    pnpm type-check
    pnpm lint
    pnpm test

At Milestone 5, also run:

    pnpm build

## Validation and Acceptance

Manual validation:

1. Start the dev server: `pnpm dev`.
2. Open `http://localhost:3000/editor`.
3. Place many assets (or use the stress helper added in this plan) and toggle quality presets.
4. Confirm:
   - Low preset disables post-processing and shadows.
   - Medium/High enable post-processing with visibly different AO strength/quality.
   - Interaction (orbit, selection, transform) remains responsive at high object counts.

Automated validation:

- `pnpm type-check && pnpm lint && pnpm test` must pass at every milestone boundary.
- `pnpm build` must pass at the final milestone.

## Idempotence and Recovery

- Quality store changes are additive and safe to re-run. If a preset feels wrong, adjust the preset mapping rather than deleting the feature.
- If instancing causes a rendering bug for a specific model, add a conservative fallback: keep that asset type on the non-instanced path and record the decision in the Decision Log.

## Artifacts and Notes

(Attach build output snippets and bundle-size measurements once Milestone 5 is implemented.)

---

Plan Revision Note (2026-02-07):

Updated the living sections to record Milestone 2 completion after adding auto-degrade via `PerformanceMonitor`, a banner notice, and an explicit toggle to re-enable auto adjustments.
