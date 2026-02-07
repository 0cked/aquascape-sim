# Phase 7: Rendering and Simulation Polish

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

AquascapeSim already works as an editor, but the scene still reads as a “nice 3D demo” more than an aquarium: water lacks believable depth cues, lighting lacks underwater haze, and the tank floor does not get convincing caustics. At the same time, Phase 6 established a strict requirement: polish must not destroy performance, and expensive effects must remain optional.

This phase improves the “aquarium vibe” with targeted, toggleable rendering upgrades:

- Better water appearance (absorption/attenuation tuning, nicer surface response, quality-tiered geometry updates).
- Optional underwater haze (scene fog) and optional light shafts (God rays) behind a quality toggle.
- Optional caustics projection (even if faked) that makes the substrate “feel wet” and reactive to the surface.
- Safer handling for WebGL context loss so a GPU glitch doesn’t strand the user in a broken editor.

After this phase, users should see obvious quality improvements on High quality, while Low/Medium remain performant and stable.

## Progress

- [x] (2026-02-07) Milestone 1: Water material + animation polish (quality-tiered detail, improved absorption look).
- [x] (2026-02-07) Milestone 2: Underwater haze (toggleable scene fog with tuned colors/density).
- [x] (2026-02-07) Milestone 3: Caustics (toggleable caustics projection near the substrate).
- [x] (2026-02-07) Milestone 4: Optional light shafts (God rays) integrated into post-processing on High.
- [x] (2026-02-07) Milestone 5: WebGL context loss handling + full validation + deploy.

## Surprises & Discoveries

(To be updated as surprises occur.)

## Decision Log

(To be updated as decisions are made.)

- Decision: Tie water surface geometry resolution and normal recomputation frequency to the existing quality presets.
  Rationale: Water is always visible; this gives an immediate polish win on High while allowing meaningful CPU savings on Medium/Low.
  Date/Author: 2026-02-07 / Codex.
- Decision: Implement underwater haze using a toggleable `fogExp2` attached to the scene.
  Rationale: Fog is a low-code way to add depth cues and “water volume” feeling, and it is easy to disable via quality settings.
  Date/Author: 2026-02-07 / Codex.
- Decision: Implement caustics as a lightweight animated shader plane near the substrate (instead of a multi-pass caustics simulation).
  Rationale: The visual win is large while the perf and implementation risk is low; the effect remains fully toggleable via quality settings.
  Date/Author: 2026-02-07 / Codex.
- Decision: Implement light shafts using `GodRays` in post-processing, driven by an invisible “sun” mesh near the key directional light.
  Rationale: This yields a recognizable volumetric look with minimal scene complexity and remains easy to disable via quality settings/presets.
  Date/Author: 2026-02-07 / Codex.
- Decision: Handle WebGL context loss by listening on the canvas element and rendering a fullscreen `Html` overlay with reload guidance.
  Rationale: Context loss is a common real-world failure mode; surfacing a clear recovery path is better than a silent black canvas.
  Date/Author: 2026-02-07 / Codex.

## Outcomes & Retrospective

(To be updated at milestone completions.)

(2026-02-07) Milestone 1 outcome: Water shading was tuned (absorption/specular/clearcoat) and the surface mesh now adapts its geometry detail and normal recomputation rate to the selected quality preset.
(2026-02-07) Milestone 2 outcome: The scene now supports an “Underwater fog” toggle (wired through quality settings) that adds haze/depth cues using `fogExp2`.
(2026-02-07) Milestone 3 outcome: The scene now supports a toggleable caustics layer (`src/components/three/caustics-plane.tsx`) that projects animated highlights near the substrate on High quality.
(2026-02-07) Milestone 4 outcome: Post-processing can now optionally render subtle light shafts via `GodRays` when enabled, using an invisible sun proxy mesh in the scene.
(2026-02-07) Milestone 5 outcome: The editor now detects WebGL context loss/restoration events and shows a clear fullscreen overlay. Full validation passed: `pnpm type-check && pnpm lint && pnpm test && pnpm build`.

(2026-02-07) Plan retrospective: Visual polish now scales with quality settings (water detail, fog, caustics, light shafts). The editor also fails more gracefully under GPU instability. Remaining polish work should focus on better tank glass dispersion, more physically based water volume cues, and per-device tuning defaults.
## Context and Orientation

Current relevant files:

- Scene root: `src/components/three/scene.tsx`
- Lighting: `src/components/three/lighting.tsx`
- Water surface: `src/components/three/water.tsx`
- Post-processing: `src/components/three/effects.tsx`
- Quality presets: `src/lib/store/quality-store.ts` and `src/components/editor/quality-menu.tsx`

Key constraints from Phase 6:

- Expensive effects must be disableable via quality settings.
- The editor must remain interactive for large scenes, and auto-degrade should be able to turn off expensive visuals by switching presets.

## Plan of Work

### Milestone 1: Water Material + Animation Polish

Update `src/components/three/water.tsx` to make water feel less like a flat transmissive plane:

- Tune absorption/attenuation colors to look like “aquarium water” rather than glass.
- Add subtle fresnel-like response via physical material parameters (clearcoat, specular) and slightly richer color.
- Make geometry/animation quality-tiered:
  - High: current 64x64 surface with per-frame normal update.
  - Medium: lower resolution or reduced normal recomputation frequency.
  - Low: lower resolution and reduced animation cost.

Wire these choices from the quality store (pass a prop from `src/components/three/scene.tsx`).

Acceptance:

- High quality water looks richer (stronger depth/edge response).
- Low quality water still looks acceptable but costs less CPU/GPU.

### Milestone 2: Underwater Haze (Fog)

Add a toggleable fog/haze that improves depth cues:

- In `src/components/three/scene.tsx`, conditionally attach `fogExp2` to the scene when enabled.
- Expose this as a quality-controlled toggle (High + Medium enable fog by default; Low disables).
- Make fog color match the water palette and avoid washing out UI.

Acceptance:

- With fog enabled, distant objects in the tank feel “underwater” and slightly hazier.
- Disabling fog has an obvious visual difference and can improve performance.

### Milestone 3: Caustics Projection

Add a tasteful caustics layer near the substrate:

- Use `@react-three/drei`’s `Caustics` component (or a simple shader fallback if it proves too expensive).
- Position/scale it to cover the substrate area inside the tank.
- Make it optional and default it to High quality only.

Acceptance:

- On High quality, the substrate has moving caustic highlights that sell the aquarium look.
- On Medium/Low, caustics are off.

### Milestone 4: Optional Light Shafts (God Rays)

Add optional light shafts using `@react-three/postprocessing`’s `GodRays`:

- Create a small invisible “sun” mesh positioned near the main directional light.
- Add `GodRays` to `src/components/three/effects.tsx` behind a `godRaysEnabled` toggle (High only).

Acceptance:

- On High quality with post-processing enabled, subtle shafts are visible in the water volume.
- Switching to Medium/Low disables them.

### Milestone 5: WebGL Context Loss + Full Validation

Improve resilience:

- Listen for `webglcontextlost` / `webglcontextrestored` on the canvas element.
- Show a clear on-screen banner with a “Reload” suggestion when context is lost.
- Ensure `pnpm type-check && pnpm lint && pnpm test && pnpm build` all pass.

Acceptance:

- Context loss triggers a visible message rather than a silent black canvas.
- Production build remains green.

## Concrete Steps

All commands are run from the repository root (`/Users/jacob/Projects/aquascapesim`).

At each milestone boundary:

    pnpm type-check
    pnpm lint
    pnpm test

At Milestone 5:

    pnpm build

## Validation and Acceptance

Manual:

1. Run `pnpm dev` and open `http://localhost:3000/editor`.
2. Toggle quality presets and confirm:
   - Water/fog/caustics/shafts change noticeably between Medium and High.
   - Low disables expensive extras.
3. Use the dev-only “Stress” button to populate the scene and confirm the editor stays responsive and auto-degrade can kick in.

Automated:

- `pnpm type-check && pnpm lint && pnpm test` must pass at each milestone boundary.
- `pnpm build` must pass at Milestone 5.

## Idempotence and Recovery

- All polish features must be behind toggles. If an effect is unstable on a device/browser, default it off and record the decision.
- If `Caustics` or `GodRays` proves too expensive, keep the wiring but make the preset default off and add a simpler fallback (static caustics plane or no shafts).

## Artifacts and Notes

(Attach short build output snippets and any performance observations as they arise.)

---

Plan Revision Note (2026-02-07):

Updated the living sections to record Milestone 5 completion after adding WebGL context loss handling and validating production builds.
