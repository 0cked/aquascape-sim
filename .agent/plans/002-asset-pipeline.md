# Phase 2: Real Assets and Asset Pipeline (glTF + Draco + KTX2)

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

The bootstrap editor proves that lighting, physics, and save/load work, but it uses placeholder primitives. This phase upgrades the editor to load and place real glTF assets, using Draco-compressed geometry and KTX2/BasisU compressed textures. After this phase, the sidebar shows thumbnails, placing an asset spawns an actual glTF model (not a cube), and the substrate uses a compressed texture. The result should feel like a real aquascaping tool, while keeping load time and GPU memory predictable.

## Progress

- [x] (2026-02-07) Milestone 1: Add Draco + BasisU runtime decoders under `public/` and a reusable glTF loader wrapper for R3F.
- [x] (2026-02-07) Milestone 2: Add an asset generation pipeline (script) and commit starter Draco-compressed `.glb` assets in `public/models/`.
- [x] (2026-02-07) Milestone 3: Add a KTX2-compressed substrate texture and render it in the scene (via KTX2Loader in glTF pipeline).
- [x] (2026-02-07) Milestone 4: Wire the editor asset catalog to include `modelUrl` + `thumbnailUrl`, render thumbnails in the sidebar, and spawn glTF models in the scene.
- [ ] Milestone 5: Error handling and loading states for asset load failures; validation and deploy.

## Surprises & Discoveries

- Observation: Drei’s `useGLTF` types are based on `three-stdlib` (not Three.js example loaders), and pnpm’s strict dependency resolution requires `three-stdlib` to be a direct dependency to import it in app code.
  Evidence: `error TS2307: Cannot find module 'three-stdlib' or its corresponding type declarations.`
- Observation: `@gltf-transform/cli` texture compression to KTX2 requires the KTX-Software `ktx` CLI binary to be available on `$PATH`; on macOS that binary depends on a dynamic library (`libktx.*.dylib`) that must be discoverable at runtime.
  Evidence: `uastc [FAILED: Command failed: command -v ktx ...]` and `dyld: Library not loaded: @rpath/libktx.4.dylib`.

## Decision Log

- Decision: Add `three-stdlib` as a direct dependency and use its `KTX2Loader`/`GLTFLoader` types when extending Drei `useGLTF`.
  Rationale: Keeps types aligned with Drei and avoids incompatible loader type errors when wiring KTX2Loader into `useGLTF`.
  Date/Author: 2026-02-07 / Codex.
- Decision: Add a deterministic procedural asset generator script (`scripts/generate-assets.mjs`) and commit the generated `.glb` outputs under `public/models/`.
  Rationale: Keeps the repo self-contained and exercises the full runtime glTF pipeline (Draco + later KTX2) without waiting on external art assets.
  Date/Author: 2026-02-07 / Codex.
- Decision: Treat local KTX-Software binaries as developer machine tooling, and gitignore `scripts/bin/` + `scripts/lib/` rather than committing OS-specific binaries.
  Rationale: Committing platform-specific executables is fragile and noisy; we only need the resulting KTX2-compressed assets at runtime.
  Date/Author: 2026-02-07 / Codex.
- Decision: Commit lightweight SVG thumbnails under `public/thumbnails/` and render them via `next/image` in the asset sidebar.
  Rationale: Thumbnails make the editor feel like a real asset browser, and using `next/image` keeps `next lint` clean without introducing remote image hosting.
  Date/Author: 2026-02-07 / Codex.

## Outcomes & Retrospective

(To be updated at milestone completions.)

- (2026-02-07) Milestone 2 outcome: The repo can generate and regenerate starter Draco-compressed assets via `pnpm assets:generate`, and `public/models/` now contains committed `.glb` models for rocks, plants, wood, and equipment.
- (2026-02-07) Milestone 3 outcome: The scene substrate uses a glTF model with an embedded KTX2/BasisU texture (`KHR_texture_basisu`), proving the runtime decoders and `KTX2Loader` wiring work end-to-end.
- (2026-02-07) Milestone 4 outcome: The editor sidebar shows thumbnails for each asset, and placing assets spawns the corresponding glTF models (with physics colliders) instead of primitives.

---

## Context and Orientation

Current repo status (after `.agent/plans/001-bootstrap.md`):

The app is a Next.js 15 App Router project. The editor lives at `src/app/editor/page.tsx` and uses a dynamically imported R3F scene (`src/components/three/scene.tsx`) wrapped by `src/components/three/scene-shell.tsx`. Editor state is in a Zustand store (`src/lib/store/editor-store.ts`). The sidebar lists assets from a static catalog (`src/lib/assets/asset-catalog.ts`) and placement is handled by an invisible plane click target (`src/components/three/placement-handler.tsx`). Physics is provided by `@react-three/rapier`.

This phase introduces:

- **Draco**: geometry compression for glTF meshes. Three.js needs decoder files (`draco_decoder.*`) available at runtime.
- **KTX2/BasisU**: GPU texture compression. Three.js needs BasisU transcoder files (`basis_transcoder.*`) available at runtime, and a KTX2Loader wired into GLTFLoader.

All paths in this plan are repo-root-relative.

## Plan of Work

1. Provide runtime decoder artifacts:
   Copy Draco decoder files and BasisU transcoder files from the Three.js package into `public/draco/` and `public/basis/`. This avoids reliance on third-party CDNs and works offline.

2. Provide a reusable glTF loader wrapper:
   Add a small helper hook that configures `useGLTF` to use local Draco decoders and a KTX2Loader with `/basis/` transcoder path.

3. Add starter assets:
   Add a script that programmatically generates simple but non-primitive-looking glTF assets (rocks, driftwood, plants, equipment) and writes them into `public/models/`. Then run `gltf-transform optimize` to Draco-compress geometry and keep the output small. These are placeholders in the sense that they’re procedurally generated, but they are real glTF assets and exercise the pipeline.

4. Add a KTX2 texture:
   Generate a substrate texture as PNG bytes in the asset script, attach it to a glTF plane, and run `gltf-transform optimize --texture-compress ktx2` to embed a KTX2/BasisU texture using `KHR_texture_basisu`.

5. Wire assets into the editor:
   Extend the asset catalog entries with `modelUrl` and `thumbnailUrl`. Update the sidebar to show a thumbnail image. Update the runtime object renderer to render a loaded glTF scene for each placed object, and update the substrate component to render the textured glTF substrate.

6. Validate:
   Run `pnpm type-check && pnpm lint && pnpm test && pnpm build`. Push commits per milestone and ensure Vercel production deploy remains healthy.

## Concrete Steps

All commands run from the repo root.

Milestone 1:

1. Create `public/draco/` and `public/basis/`.
2. Copy decoder/transcoder files from `node_modules/three/examples/jsm/libs/` into those directories.
3. Add a loader hook in `src/lib/assets/` that configures Draco + KTX2 for Drei `useGLTF`.

Milestone 2-3:

1. Add `scripts/generate-assets.mjs` that writes `public/models/*.glb` (including a substrate model).
2. Run the script, then run `pnpm exec gltf-transform optimize ...` to create Draco + KTX2 optimized outputs.
3. Commit the resulting `.glb` assets.

Milestone 4:

1. Update `src/lib/assets/asset-catalog.ts` to include `modelUrl` and `thumbnailUrl`.
2. Update `src/components/editor/sidebar.tsx` to render thumbnails.
3. Replace primitive rendering in `src/components/three/scene.tsx` with glTF model rendering per object.
4. Replace `src/components/three/substrate.tsx` with a glTF-based substrate mesh (keeping the collider).

Milestone 5:

1. Add user-facing error boundaries/loading for asset load failures (Suspense + fallback already exists for the scene shell; add a smaller, in-canvas fallback for missing assets).
2. Validate and deploy.

## Validation and Acceptance

Local:

1. `pnpm dev` and open `http://localhost:3000/editor`.
2. The sidebar shows thumbnails for assets.
3. Placing an asset spawns a glTF model (not a box/sphere/cylinder primitive).
4. The substrate renders with a texture (not vertex-color noise).
5. No console errors about missing Draco or BasisU decoder files.

CI/build:

- `pnpm type-check && pnpm lint && pnpm test && pnpm build` all pass.

Prod:

- `https://aquascape-sim.vercel.app/editor` works and loads assets.

## Idempotence and Recovery

Copying decoder files is idempotent; re-running the asset generation script overwrites files deterministically. If an asset change causes regressions, revert to the previous milestone commit and re-run validation.

## Artifacts and Notes

(Attach short transcripts, bundle size notes, or relevant diffs as they arise.)

---

Plan Revision Notes:

- (2026-02-07) Recorded Milestone 2 completion, and documented the `ktx` tooling requirement for KTX2 texture compression (discovered while implementing the generation pipeline).
- (2026-02-07) Recorded Milestone 3 completion, including the first committed KTX2-compressed texture used in the running scene.
- (2026-02-07) Recorded Milestone 4 completion, wiring the catalog + sidebar to thumbnails and swapping placed objects to glTF model rendering.
