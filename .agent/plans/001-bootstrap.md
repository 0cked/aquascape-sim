# Bootstrap AquascapeSim: From Empty Directory to Deployed 3D Aquascaping Editor

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

AquascapeSim is a browser-based 3D aquarium aquascaping simulator. After this bootstrap is complete, a user can visit a live URL on Vercel and do the following: view a landing page, click "Launch Editor", see a realistic 3D glass aquarium tank filled with water sitting on a stand, with substrate (gravel/soil) on the bottom, illuminated by aquarium-style overhead lighting with visible light rays through the water, ambient environment lighting, and post-processing effects (bloom, ambient occlusion, tone mapping). The user can orbit, pan, and zoom the camera. They can open a sidebar, select placeholder objects (rocks, driftwood, plants), and click in the scene to place them. Objects rest on the substrate via physics (Rapier rigid bodies with gravity). Objects collide with each other and the tank walls. The user can sign up or log in (Supabase Auth), save their aquascape as a "build", and load it later. The entire application is deployed on Vercel, with the database and auth running on a live Supabase project, and the source code pushed to GitHub at `0cked/aquascape-sim`.

## Progress

- [x] (2026-02-07) Bootstrapped a Next.js App Router + Tailwind + TypeScript project via `create-next-app`, synced into repo root, and pinned Next.js to v15.x to match the canonical stack.
- [x] (2026-02-07) Added baseline repo hygiene: `.gitignore` includes `.secrets/` and `.env*.local`, created `.env.local.example`, and installed the core 3D/physics/state/auth dependencies.
- [x] (2026-02-07) Milestone 1: Repository creation, tooling setup, and first deploy (GitHub repo created; Vercel project linked; env vars set; production deploy live at `https://aquascape-sim.vercel.app`).
- [x] (2026-02-07) Milestone 2: 3D scene foundation — tank, water, substrate, lighting, camera
- [x] (2026-02-07) Milestone 3: Post-processing pipeline — bloom, SSAO, tone mapping
- [x] (2026-02-07) Milestone 4: Physics integration — Rapier, gravity, collisions, surface placement
- [x] (2026-02-07) Milestone 5: Editor UI — toolbar, sidebar, object placement workflow
- [x] (2026-02-07) Milestone 6: Supabase integration — auth, database schema, save/load builds
- [x] (2026-02-07) Milestone 7: Polish, testing, and final deploy

## Surprises & Discoveries

- Observation: `create-next-app` refuses to scaffold into a non-empty directory (it treated `.agent/`, `.secrets/`, and `AGENTS.md` as conflicts).
  Evidence: `The directory aquascapesim contains files that could conflict: .agent/ .secrets/ AGENTS.md`.

- Observation: `next lint` auto-mutated `tsconfig.json` (changed `jsx` to `preserve`) on first run.
  Evidence: `The following mandatory changes were made to your tsconfig.json: - jsx was set to preserve`.

- Observation: pnpm v10 may ignore some dependency build scripts by default (notably `esbuild`), which can break tools that expect a built binary.
  Evidence: `Ignored build scripts: esbuild@0.27.3. Run "pnpm approve-builds" ...`.

- Observation: Vercel does not allow `--sensitive` environment variables to target `development` via `vercel env add`.
  Evidence: `Error: You cannot set a Sensitive Environment Variable's target to development.`

- Observation: WebGPU renderer setup is not a drop-in change for the current R3F + postprocessing stack and would require additional integration work.
  Evidence: No stable `WebGPURenderer` configuration path was used in this milestone; the editor uses the default WebGL renderer created by R3F.

- Observation: With pnpm's strict dependency isolation, importing `postprocessing` directly from app code failed unless it was a direct dependency (even though `@react-three/postprocessing` depends on it).
  Evidence: `error TS2307: Cannot find module 'postprocessing' or its corresponding type declarations.`

- Observation: Adding Rapier physics increases the editor route bundle substantially (WASM + bindings).
  Evidence: `Route (app) /editor Size 1.19 MB First Load JS 1.3 MB` (from `pnpm build` output after physics integration).

- Observation: Supabase CLI was not authenticated in this environment, despite the repo instructions expecting it to be.
  Evidence: `Access token not provided. Supply an access token by running supabase login or setting the SUPABASE_ACCESS_TOKEN environment variable.`

- Observation: In Next.js v15.5.x, `cookies()` is async (returns a Promise), so server Supabase client helpers must be async as well.
  Evidence: `Property 'getAll' does not exist on type 'Promise<ReadonlyRequestCookies>'.`

- Observation: Dynamically importing the heavy 3D editor scene significantly reduced the `/editor` route's initial JS payload.
  Evidence: `Route (app) /editor Size 64.3 kB First Load JS 166 kB` after introducing a dynamic `SceneShell`.

## Decision Log

- Decision: Scaffold the Next.js app in a temporary directory and sync it into the repo root instead of running `create-next-app` in-place.
  Rationale: The repo already contains `.agent/`, `.secrets/`, and `AGENTS.md`, and `create-next-app` refuses to run when it detects potentially conflicting files in the target directory.
  Date/Author: 2026-02-07 / Codex.

- Decision: Pin Next.js to v15.x (15.5.12) even though the latest `create-next-app` template installs Next v16.x.
  Rationale: `AGENTS.md` defines Next.js 15 as the canonical framework version for this repository.
  Date/Author: 2026-02-07 / Codex.

- Decision: Use `.eslintrc.json` (ESLint legacy config) instead of the `eslint.config.mjs` flat config generated by the latest `create-next-app`.
  Rationale: `AGENTS.md` expects an `.eslintrc.json` at repo root, and Next.js v15 linting is most consistently supported with that configuration.
  Date/Author: 2026-02-07 / Codex.

- Decision: Set Vercel `development` env vars without `--sensitive`.
  Rationale: The Vercel CLI rejects sensitive variables for the `development` target; production/preview were set as sensitive, and development values still come from `.env.local` for local work.
  Date/Author: 2026-02-07 / Codex.

- Decision: Use R3F's default WebGL renderer for the editor canvas in Milestone 2 (no WebGPU attempt).
  Rationale: WebGPU in Three.js is not currently a low-risk swap-in for R3F + `@react-three/postprocessing`; bootstrap prioritizes a working editor foundation over renderer experimentation.
  Date/Author: 2026-02-07 / Codex.

- Decision: Use `SSAO` from `@react-three/postprocessing` (with `EffectComposer enableNormalPass`) instead of `N8AO`.
  Rationale: The current `N8AO` wrapper includes an explicit note about memory leaks without upstream disposal; bootstrap favors stable lifecycle/disposal behavior.
  Date/Author: 2026-02-07 / Codex.

- Decision: Represent the aquarium tank boundaries as 5 fixed cuboid colliders (bottom + 4 walls) sized to match the visible glass panels.
  Rationale: Simple, stable colliders are sufficient for bootstrap placement/collision behavior; later milestones can swap in more accurate colliders or mesh colliders if needed.
  Date/Author: 2026-02-07 / Codex.

- Decision: Use reduced gravity (`[0, -4.9, 0]`) and high damping on dynamic objects to approximate underwater resistance.
  Rationale: Objects should settle quickly and feel “heavier” in water without introducing buoyancy complexity at bootstrap time.
  Date/Author: 2026-02-07 / Codex.

- Decision: Implement placement with an invisible click-target plane (PlacementHandler) aligned to the substrate surface.
  Rationale: Pointer events become deterministic and decoupled from the substrate’s visual mesh/rigid-body implementation details.
  Date/Author: 2026-02-07 / Codex.

- Decision: Skip undo/redo in Milestone 5 (toolbar includes Select/Delete only).
  Rationale: Undo/redo is valuable but not required for bootstrap acceptance; it is easier to add once object transforms and persistence are stabilized.
  Date/Author: 2026-02-07 / Codex.

- Decision: Push Supabase migrations via `npx supabase db push --db-url ...` instead of `supabase link` (no access token available).
  Rationale: The CLI required an access token for project linking, but direct DB URL push works with the DB password and pooler host.
  Date/Author: 2026-02-07 / Codex.

- Decision: Store `scene_data` in the `builds` table as a JSONB string payload produced by `serializeScene(...)` (versioned, `{ version, objects }`).
  Rationale: Keeps bootstrap serialization simple and self-contained; can be migrated to structured JSON objects later without changing the DB schema.
  Date/Author: 2026-02-07 / Codex.

- Decision: Wrap the editor scene in a client-side `SceneShell` with dynamic import and an error boundary.
  Rationale: Improves perceived performance (loading UI while bundles download) and provides a friendly fallback if WebGL/Three throws during render.
  Date/Author: 2026-02-07 / Codex.

- Decision: Add a minimal Vitest suite for editor state and serialization.
  Rationale: Locks in core behaviors needed for save/load and future refactors, without needing browser/E2E infra at bootstrap time.
  Date/Author: 2026-02-07 / Codex.

- Decision: Use `@react-three/rapier` instead of raw Rapier bindings.
  Rationale: It integrates natively with R3F's scene graph and handles the WASM init lifecycle. Less boilerplate, fewer bugs.
  Date/Author: Plan creation.

- Decision: Use `@react-three/postprocessing` instead of Three.js raw EffectComposer.
  Rationale: Declarative, composable with R3F, and handles disposal/lifecycle correctly in React strict mode.
  Date/Author: Plan creation.

- Decision: Use pnpm, not npm or yarn.
  Rationale: Faster installs, strict dependency resolution, smaller node_modules. Specified in AGENTS.md.
  Date/Author: Plan creation.

- Decision: Use placeholder geometries (boxes, spheres, cylinders with PBR materials) instead of real 3D models for bootstrap.
  Rationale: Eliminates asset pipeline blockers. Proves the architecture works. Real models can be dropped in later without changing code.
  Date/Author: Plan creation.

- Decision: WebGPU with WebGL2 fallback via Three.js `WebGPURenderer`.
  Rationale: WebGPU is the future of browser 3D. Three.js r165+ supports `WebGPURenderer` which falls back gracefully. This gives us the best graphics ceiling without breaking compatibility.
  Date/Author: Plan creation.

- Decision: Use `@supabase/ssr` for Next.js App Router integration instead of the older `@supabase/auth-helpers-nextjs`.
  Rationale: `@supabase/ssr` is the current recommended package for App Router server components and middleware auth.
  Date/Author: Plan creation.

## Outcomes & Retrospective

- Milestone 1 (2026-02-07): Repo, CI baseline tooling, and first production deployment are live.
  The GitHub repo is `0cked/aquascape-sim`, the Vercel project is linked, and the production URL is `https://aquascape-sim.vercel.app`. The landing page renders and the `/editor` route exists (placeholder).

- Milestone 2 (2026-02-07): `/editor` renders an R3F scene with a glass tank, animated water surface, substrate plane, environment reflections, and orbit camera controls.

- Milestone 3 (2026-02-07): `/editor` has a post-processing stack (bloom, SSAO, vignette, and filmic tone mapping via `ToneMapping`) that makes the scene noticeably more cinematic.

- Milestone 4 (2026-02-07): Dynamic objects fall under gravity, collide with the substrate, and are constrained by the tank wall colliders (Rapier via `@react-three/rapier`).

- Milestone 5 (2026-02-07): The editor has a working UI overlay (toolbar + sidebar). Users can pick an asset, click the substrate to place it (physics-driven settling/collisions), select objects by clicking them, and delete via the toolbar button or `Delete`/`Backspace`.

- Milestone 6 (2026-02-07): Users can sign up / sign in with Supabase Auth. Signed-in users can save builds (scene serialized from the editor store to `builds.scene_data`) and load saved builds back into the editor.

- Milestone 7 (2026-02-07): Landing page is polished, editor has loading and crash fallbacks, unit tests + Vitest config are in place, and GitHub Actions CI runs type-check/lint/test on PRs. Production deploy remains `https://aquascape-sim.vercel.app`.

Overall (2026-02-07): Bootstrap acceptance is met: a user can reach the landing page, launch the editor, orbit/pan/zoom, place placeholder assets via a UI workflow with collisions and settling, authenticate with Supabase, and save/load builds backed by Postgres. The main gaps intentionally left for post-bootstrap milestones are: real glTF asset pipeline (Draco/KTX2), transform gizmos/properties panel, thumbnails/sharing, and undo/redo.

---

## Context and Orientation

This is a greenfield project. There is no existing code. The working directory starts empty except for:

- `.secrets/supabase/` containing `SUPABASE_URL.txt`, `SUPABASE_PUBLISHABLE_KEY.txt`, `SUPABASE_SECRET_KEY.txt`, `DB_PASSWORD.txt`, `SESSION_POOLER.txt` — these are plain text files each containing a single credential value, possibly with trailing newlines that must be trimmed.
- `.secrets/cloudflare/` containing `ACCOUNT_ID.txt` and `API_TOKEN.txt` — available but not needed for bootstrap.
- The GitHub CLI (`gh`) is authenticated as user `0cked`.
- The Vercel CLI (`vercel`) is authenticated.
- `pnpm` is available globally.
- Node.js 22 LTS is available.

Key technologies used in this project, defined for clarity:

- **Next.js App Router**: A React framework where pages are defined as files in `src/app/`. Files named `page.tsx` become routes. Files named `layout.tsx` wrap child routes. Server Components are the default; add `'use client'` at the top of files that need browser APIs or React hooks.
- **React Three Fiber (R3F)**: A React renderer for Three.js. Instead of imperative Three.js code, you write JSX like `<mesh><boxGeometry /><meshStandardMaterial /></mesh>`. The `<Canvas>` component creates the WebGL/WebGPU context.
- **Drei**: A collection of helper components for R3F — `OrbitControls`, `Environment`, `useGLTF`, `Html`, `TransformControls`, etc.
- **Rapier**: A physics engine compiled to WebAssembly. `@react-three/rapier` wraps it for R3F, providing `<RigidBody>`, `<CuboidCollider>`, etc.
- **Zustand**: A tiny state management library. You define a store as a function returning an object with state and actions. Components subscribe to slices of state reactively.
- **Supabase**: A hosted Postgres database with built-in auth, storage, and realtime. We use it for user accounts, saving builds, and storing thumbnails.
- **KTX2/BasisU**: Compressed GPU texture formats. Three.js can transcode them on the fly via a Web Worker. Much smaller than PNG/JPEG for GPU use.
- **Draco**: A geometry compression library by Google. Reduces glTF file sizes significantly.
- **Post-processing**: Image effects applied after the 3D scene renders — bloom (glow around bright areas), SSAO (ambient occlusion, darkening crevices), tone mapping (HDR to screen color), vignette (darkened edges).

---

## Milestone 1: Repository Creation, Tooling Setup, and First Deploy

After this milestone, a GitHub repository exists at `0cked/aquascape-sim`, a Vercel project is linked to it, environment variables are configured, and pushing to `main` triggers a deployment. Visiting the Vercel URL shows a Next.js page that says "AquascapeSim — Coming Soon".

### Plan of Work

Create the Next.js project with pnpm, configure TypeScript strict mode, Tailwind CSS, ESLint, path aliases. Initialize git, create the GitHub repo, link Vercel, set environment variables from `.secrets/`, deploy.

### Concrete Steps

All commands run from the project root directory (the directory containing this plan's parent `.agent/` folder).

1. Create the Next.js app:

       pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --no-turbopack

   If prompted for experimental features, decline. This creates `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, etc.

2. Enable TypeScript strict mode. In `tsconfig.json`, ensure `"strict": true` is set under `compilerOptions`.

3. Add scripts to `package.json`:

       "type-check": "tsc --noEmit"

4. Install core dependencies:

       pnpm add three @react-three/fiber @react-three/drei @react-three/postprocessing @react-three/rapier @dimforge/rapier3d-compat zustand immer @supabase/supabase-js @supabase/ssr

5. Install dev dependencies:

       pnpm add -D @types/three vitest @testing-library/react @vitejs/plugin-react jsdom

6. Create `.gitignore` that includes at minimum:

       node_modules/
       .next/
       .vercel/
       .env*.local
       .secrets/
       *.tsbuildinfo

7. Create `.env.local` by reading secrets:

       NEXT_PUBLIC_SUPABASE_URL=<contents of .secrets/supabase/SUPABASE_URL.txt, trimmed>
       NEXT_PUBLIC_SUPABASE_ANON_KEY=<contents of .secrets/supabase/SUPABASE_PUBLISHABLE_KEY.txt, trimmed>
       SUPABASE_SERVICE_ROLE_KEY=<contents of .secrets/supabase/SUPABASE_SECRET_KEY.txt, trimmed>

   Read each file with `cat` and trim whitespace. Write the `.env.local` file.

8. Create `.env.local.example` with placeholder values (no real secrets):

       NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
       NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
       SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

9. Update `src/app/page.tsx` to show a simple landing page:

   A centered page with "AquascapeSim" as the title, a brief tagline "Design your dream aquascape in 3D", and a link/button labeled "Launch Editor" that navigates to `/editor`. Use Tailwind for styling. Dark background, clean typography.

10. Create `src/app/editor/page.tsx` as a placeholder:

    A page that says "Editor loading..." — this will be replaced in Milestone 2.

11. Initialize git and push:

        git init
        git add -A
        git commit -m "feat: initial Next.js project with tooling"
        gh repo create 0cked/aquascape-sim --public --source=. --remote=origin --push

12. Link Vercel and set environment variables:

        vercel link --yes
        vercel env add NEXT_PUBLIC_SUPABASE_URL production < .secrets/supabase/SUPABASE_URL.txt
        vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < .secrets/supabase/SUPABASE_PUBLISHABLE_KEY.txt
        vercel env add SUPABASE_SERVICE_ROLE_KEY production < .secrets/supabase/SUPABASE_SECRET_KEY.txt

    Also add the same env vars for `preview` and `development` environments.

13. Deploy:

        git push origin main

    Vercel auto-deploys on push. Alternatively run `vercel deploy --prod` for the first deploy.

14. Verify: visit the Vercel URL. Expect to see the landing page with "AquascapeSim" and the "Launch Editor" button. Clicking it navigates to `/editor`.

### Validation

Run `pnpm build` locally — it should succeed with no errors. Run `pnpm type-check` — should pass. Run `pnpm lint` — should pass. Visit the deployed URL and confirm the landing page renders.

---

## Milestone 2: 3D Scene Foundation — Tank, Water, Substrate, Lighting, Camera

After this milestone, visiting `/editor` shows a full 3D scene: a glass aquarium tank (transparent box with slight refraction/reflection), water inside the tank (translucent blue-green plane or volume), a substrate layer (textured plane at the bottom), overhead directional lighting simulating an aquarium light bar, environment lighting via HDRI, and smooth orbit/pan/zoom camera controls. The scene runs at 60fps on a mid-range device.

### Plan of Work

Create the R3F Canvas in the editor page with WebGPU renderer (fallback to WebGL2). Build components: `TankScene` (root), `AquariumTank` (glass box), `Water` (translucent plane with animated caustics-like effect), `Substrate` (textured ground plane), `Lighting` (directional + ambient + environment). Add `OrbitControls` from Drei. All 3D components go in `src/components/three/`.

The `<Canvas>` component must be rendered in a client component (has `'use client'`). The editor page server component wraps it.

Key implementation details:

The aquarium tank is a box made of 6 faces. The glass is a `MeshPhysicalMaterial` with `transmission: 0.95`, `roughness: 0.05`, `thickness: 0.5`, `ior: 1.5` (index of refraction for glass), and a slight green tint. This gives a realistic glass look.

The water is a plane positioned inside the tank just below the top edge. Use `MeshPhysicalMaterial` with `transmission: 0.8`, `roughness: 0.1`, `color: '#006994'` (deep aqua), and animated distortion via a custom shader or Drei's `MeshDistortMaterial` at very low distortion for subtle movement.

The substrate is a plane at the bottom of the tank. Use `MeshStandardMaterial` with a procedural or noise-based color variation (browns/tans) to simulate aquarium soil or gravel. For now, a solid brown color with slight roughness variation is sufficient.

Lighting setup:
- One `directionalLight` positioned above and slightly in front of the tank, angled down at ~45 degrees, intensity 2-3, casting shadows. This simulates the aquarium light bar.
- One `ambientLight` at low intensity (0.3) for fill.
- An `Environment` component from Drei with a preset (e.g., "sunset" or "warehouse") or an HDRI for realistic reflections on the glass and water. If no HDRI is available locally, use Drei's built-in presets.

Camera: `OrbitControls` with `enableDamping`, reasonable min/max distance (don't let the camera go inside the tank or too far away), and a default position looking at the tank from a 3/4 angle.

### Concrete Steps

1. Create `src/components/three/scene.tsx` — the root scene component containing `<Canvas>`:

   This is a `'use client'` component. It renders `<Canvas>` with `shadows`, `camera` props (position, fov), and contains all scene children. Configure the renderer for WebGPU with fallback. R3F's Canvas accepts a `gl` prop for renderer configuration — use Three.js `WebGPURenderer` if `navigator.gpu` is available, otherwise let R3F use the default WebGL2 renderer.

   Note: As of Three.js r165+, `WebGPURenderer` is available but may require `three/webgpu` imports. If this causes issues, fall back to WebGL2 only and log a decision. Do not block progress on WebGPU.

2. Create `src/components/three/aquarium-tank.tsx` — the glass tank:

   A group containing 5 glass panels (4 walls + bottom) using `MeshPhysicalMaterial`. The tank should be roughly 60cm wide, 36cm deep, 40cm tall (typical aquarium proportions, using arbitrary units where 1 unit = ~10cm). Leave the top open.

3. Create `src/components/three/water.tsx` — the water surface/volume:

   A plane geometry inside the tank, positioned at about 90% of the tank height, with translucent water material.

4. Create `src/components/three/substrate.tsx` — the bottom substrate:

   A plane at the bottom of the tank interior, with a brown PBR material. Slightly above the actual tank bottom to simulate soil depth.

5. Create `src/components/three/lighting.tsx` — the lighting rig:

   Directional light (shadow-casting), ambient light, and `<Environment>` from Drei.

6. Update `src/app/editor/page.tsx` to import and render the scene:

   Server component that renders a full-viewport client wrapper containing the Canvas.

7. Run `pnpm dev`, open `http://localhost:3000/editor` in a browser. Verify: glass tank is visible, water is translucent, substrate is brown, lighting creates shadows and reflections, orbit controls work (left-click drag to rotate, right-click to pan, scroll to zoom).

8. Run `pnpm type-check && pnpm lint`. Fix any errors.

9. Commit and push:

       git add -A
       git commit -m "feat: 3D scene with glass tank, water, substrate, lighting"
       git push origin main

10. Verify the Vercel deployment shows the 3D editor.

### Validation

Open `/editor` in Chrome and Firefox. The 3D scene should render at 60fps (check via browser devtools Performance tab or R3F's `useFrame` with a simple fps counter). The glass tank should look transparent with visible reflections. Orbit controls should be smooth. No console errors related to Three.js or WebGL.

---

## Milestone 3: Post-Processing Pipeline

After this milestone, the 3D scene has visual post-processing effects: bloom (subtle glow on bright surfaces like the water surface and light reflections on glass), SSAO (ambient occlusion that darkens crevices between objects and the tank walls), and filmic tone mapping. The scene should look noticeably more cinematic than raw Three.js output.

### Plan of Work

Add `<EffectComposer>` from `@react-three/postprocessing` wrapping the scene. Add `<Bloom>`, `<SSAO>`, `<ToneMapping>`, and optionally `<Vignette>` as children.

### Concrete Steps

1. Create `src/components/three/effects.tsx` — post-processing component:

   Uses `EffectComposer` from `@react-three/postprocessing`. Contains:
   - `<Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} intensity={0.4} />` — subtle glow
   - `<SSAO radius={0.05} intensity={15} luminanceInfluence={0.6} color="black" />` — ambient occlusion (use N8SSAO or the default SSAO, whichever is more performant)
   - `<ToneMapping mode={ACESFilmicToneMapping} />` — filmic color grading
   - `<Vignette offset={0.5} darkness={0.4} />` — subtle edge darkening

2. Add `<Effects />` as a child of the Canvas in `scene.tsx`.

3. Test performance. If FPS drops below 50 on a mid-range device, reduce SSAO samples or lower bloom resolution. Log any performance tuning in the Decision Log.

4. Commit and push:

       git add -A
       git commit -m "feat: post-processing effects (bloom, SSAO, tone mapping)"
       git push origin main

### Validation

Open `/editor`. The scene should look visually richer — bright spots glow softly, crevices between objects and the tank bottom are subtly shadowed, colors are more cinematic. FPS should remain above 50. Compare before/after by temporarily removing the `<Effects />` component.

---

## Milestone 4: Physics Integration — Rapier, Gravity, Collisions

After this milestone, objects dropped into the scene fall due to gravity, land on the substrate, and collide with each other and the tank walls. This is the foundation for the editor's "place objects" workflow — when a user places a rock, it falls and settles naturally.

### Plan of Work

Wrap the scene in `<Physics>` from `@react-three/rapier`. The tank walls and substrate become static colliders (`type="fixed"`). Placeholder objects (cubes representing rocks) are dynamic rigid bodies that fall and settle. Gravity is set to simulate water resistance (slower than air — gravity reduced or damping increased).

### Concrete Steps

1. Wrap the scene content inside `<Physics gravity={[0, -4.9, 0]} debug={false}>` in `scene.tsx`. The reduced gravity (half of Earth's 9.81) simulates the buoyancy/drag effect of water. The `debug` flag can be temporarily set to `true` to visualize colliders.

2. Update `aquarium-tank.tsx`: wrap the tank in a `<RigidBody type="fixed">` with `<CuboidCollider>` shapes for each wall and the bottom. These are invisible colliders that prevent objects from passing through the glass.

3. Update `substrate.tsx`: the substrate mesh gets a `<RigidBody type="fixed">` with a `<CuboidCollider>` matching its dimensions.

4. Create `src/components/three/placeable-object.tsx` — a component that renders a dynamic rigid body:

   Props: `position`, `shape` (box, sphere, cylinder), `size`, `color`. Wraps a mesh in `<RigidBody type="dynamic">` with appropriate collider. Has linear and angular damping (0.5-0.8) to simulate water resistance — objects should settle relatively quickly instead of bouncing forever.

5. For testing, add 3-4 `<PlaceableObject>` instances at various positions above the substrate in `scene.tsx`. When the scene loads, they should fall and land on the substrate.

6. Verify collisions: objects should not pass through the tank walls or each other. If an object is placed above another, it should stack or slide off.

7. Commit and push:

       git add -A
       git commit -m "feat: Rapier physics with tank colliders and dynamic objects"
       git push origin main

### Validation

Open `/editor`. Objects should fall from their initial positions, land on the substrate, and settle. They should not pass through tank walls. Open browser devtools — no physics errors or WASM init failures.

---

## Milestone 5: Editor UI — Toolbar, Sidebar, Object Placement

After this milestone, the user can interact with the editor: a sidebar shows a list of objects to place (rocks, driftwood, plants — each represented by a placeholder shape with a name and icon). Clicking an object in the sidebar enters "placement mode". Clicking in the 3D scene raycasts to the substrate and spawns the object at that position. The object falls and settles via physics. A toolbar at the top has basic controls. Selected objects can be deleted with a keyboard shortcut.

### Plan of Work

Create Zustand stores for editor state (selected tool, placed objects list, selected object). Build UI components (sidebar, toolbar) overlaid on the Canvas using absolute positioning. Implement raycasting for substrate click detection. Implement the add-object flow: click sidebar item → click scene → spawn object.

### Concrete Steps

1. Create `src/lib/store/editor-store.ts`:

   State: `mode` ('select' | 'place'), `selectedAssetType` (string | null), `objects` (array of `{id, type, position, rotation, scale}`), `selectedObjectId` (string | null).
   Actions: `setMode`, `selectAsset`, `addObject`, `removeObject`, `selectObject`, `updateObject`, `clearSelection`.
   Use `immer` middleware for immutable updates.

2. Create `src/types/scene.ts`:

   Define types: `PlacedObject` (id, type, position as [x,y,z], rotation as [x,y,z], scale as [x,y,z]), `AssetType` (name, category, shape, defaultSize, color).

3. Create `src/lib/assets/asset-catalog.ts`:

   A static array of available assets: e.g., "Small Rock" (box, grey), "Large Rock" (box, dark grey), "Driftwood" (cylinder, brown), "Java Fern" (cylinder, green), "Anubias" (sphere, dark green), "Filter" (box, black), "Heater" (cylinder, black). Each has a `type` key, display name, shape, default size, and color.

4. Create `src/components/editor/sidebar.tsx` (`'use client'`):

   A panel on the left side of the screen (absolute positioned, ~250px wide, dark semi-transparent background). Lists assets from the catalog as clickable cards with name and a small color swatch. Clicking an asset sets `mode: 'place'` and `selectedAssetType` in the store.

5. Create `src/components/editor/toolbar.tsx` (`'use client'`):

   A bar at the top of the editor. Shows the current mode ("Select" / "Place: [asset name]"). Has a "Select" button to exit placement mode. Has a "Delete" button (enabled when an object is selected). Has an "Undo" button (stretch goal — implement if time permits, otherwise skip).

6. Create `src/components/three/placement-handler.tsx`:

   An invisible R3F component that listens for click events on the substrate. When `mode === 'place'` and the user clicks on the substrate, it raycasts to find the click position, calculates the spawn position (substrate surface + half the object height), calls `addObject` on the store, and resets to select mode.

   Use R3F's `useThree` to access the raycaster and camera, or use Drei's `<Plane>` as a click target overlaying the substrate.

7. Update `scene.tsx` to render placed objects dynamically:

   Map over `objects` from the store and render a `<PlaceableObject>` for each one.

8. Implement object selection: clicking on a placed object (not in placement mode) selects it (highlights it with an outline or color change). Pressing `Delete` or `Backspace` removes it.

9. Update `src/app/editor/page.tsx` to include the sidebar and toolbar alongside the Canvas.

10. Test the full flow: open editor → click "Small Rock" in sidebar → cursor changes to indicate placement mode → click on substrate → rock appears and falls → click another spot → another rock appears → click "Select" → click a rock → it highlights → press Delete → it disappears.

11. Commit and push:

        git add -A
        git commit -m "feat: editor UI with sidebar, toolbar, and object placement"
        git push origin main

### Validation

Open `/editor`. Place at least 5 objects. Verify they collide, stack, and don't pass through walls. Select and delete an object. Verify the UI is responsive and doesn't block the 3D scene. FPS should remain above 50 with 20 objects in scene.

---

## Milestone 6: Supabase Integration — Auth, Schema, Save/Load

After this milestone, users can sign up and log in via email/password, save their current scene as a named "build" to Supabase, see a list of their saved builds, and load a build back into the editor. The scene state is serialized as JSON and stored in the `builds` table's `scene_data` JSONB column.

### Plan of Work

Set up Supabase client and server clients for Next.js App Router using `@supabase/ssr`. Create database migrations for `profiles`, `builds`, and `asset_catalog` tables with Row Level Security. Build auth UI (sign up, log in, log out). Build save/load UI in the editor. Serialize/deserialize scene state.

### Concrete Steps

1. Create `src/lib/supabase/client.ts` — browser Supabase client:

   Uses `createBrowserClient` from `@supabase/ssr` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

2. Create `src/lib/supabase/server.ts` — server-side Supabase client:

   Uses `createServerClient` from `@supabase/ssr` with cookie handling for Next.js App Router. Used in Server Components and Route Handlers.

3. Create `src/lib/supabase/middleware.ts` — auth middleware:

   Refreshes the auth session on every request. Export a `updateSession` function.

4. Create `src/middleware.ts` (Next.js middleware at project root `src/`):

   Calls `updateSession` for all routes except static assets.

5. Create Supabase migrations in `supabase/migrations/`:

   File: `supabase/migrations/001_initial_schema.sql`

   Contents:
   - Create `profiles` table with `id` (uuid, PK, FK to auth.users), `username` (text, unique), `display_name` (text), `avatar_url` (text), `created_at` (timestamptz).
   - Create a trigger function that auto-creates a profile row when a new auth user is created.
   - Create `builds` table with `id` (uuid, PK, default gen_random_uuid()), `user_id` (uuid, FK to profiles), `name` (text, not null), `description` (text), `scene_data` (jsonb, not null), `thumbnail_url` (text), `is_public` (boolean, default false), `created_at` (timestamptz), `updated_at` (timestamptz).
   - Create `asset_catalog` table with `id` (uuid, PK), `name` (text), `category` (text), `model_url` (text), `thumbnail_url` (text), `metadata` (jsonb), `created_at` (timestamptz).
   - Enable RLS on all tables.
   - RLS policies: profiles — users can read any profile, update their own. builds — users can read public builds and all their own builds, insert/update/delete their own. asset_catalog — anyone can read.

6. Push the migration:

       npx supabase db push --db-url "postgresql://postgres:<DB_PASSWORD>@<SUPABASE_URL_HOST>:5432/postgres"

   Read the DB password from `.secrets/supabase/DB_PASSWORD.txt` and the host from the Supabase URL. Alternatively, if `supabase link` works, use that.

   Note: The exact supabase CLI command may vary. If `supabase db push` requires linking first, run `npx supabase link --project-ref <ref>` where the project ref is extracted from the Supabase URL (the subdomain before `.supabase.co`).

7. Create `src/components/auth/auth-modal.tsx` (`'use client'`):

   A modal dialog with tabs for "Sign Up" and "Log In". Email and password fields. Uses the browser Supabase client to call `signUp` or `signInWithPassword`. Shows error messages. On success, closes the modal and refreshes the page.

8. Create `src/components/auth/user-menu.tsx` (`'use client'`):

   Shows in the top-right corner of the editor. If not logged in, shows "Sign In" button that opens the auth modal. If logged in, shows the user's email and a "Sign Out" button.

9. Create `src/components/editor/save-dialog.tsx` (`'use client'`):

   A dialog that appears when the user clicks "Save" in the toolbar. Fields: build name, description, public toggle. On submit, serializes the current scene state from the Zustand store (the `objects` array) as JSON, and inserts a row into the `builds` table.

10. Create `src/components/editor/load-dialog.tsx` (`'use client'`):

    A dialog showing the user's saved builds (fetched from Supabase). Each build shows name, date, and a "Load" button. Loading a build deserializes the `scene_data` JSON and replaces the current scene state in the Zustand store.

11. Add "Save" and "Load" buttons to the toolbar. Save is disabled when not logged in.

12. Add serialization helpers in `src/lib/store/serialization.ts`:

    `serializeScene(objects: PlacedObject[]): string` — JSON.stringify with the objects array.
    `deserializeScene(data: string): PlacedObject[]` — JSON.parse with validation.

13. Test the full flow: sign up with a test email → place some objects → save → refresh page → log in → load → objects reappear in correct positions.

14. Commit and push:

        git add -A
        git commit -m "feat: Supabase auth, database schema, save/load builds"
        git push origin main

### Validation

Sign up with a test email. Place 5 objects. Save as "Test Build 1". Refresh the page. Log in. Click Load. Select "Test Build 1". The 5 objects should appear at their saved positions. Open Supabase dashboard — verify the `builds` row exists with valid `scene_data` JSONB.

---

## Milestone 7: Polish, Testing, and Final Deploy

After this milestone, the app is polished and production-ready for its initial state. Landing page is styled, editor is usable, there's basic error handling, and the Vercel deployment is clean.

### Plan of Work

Polish the landing page (hero section, feature highlights, call to action). Add error boundaries around the 3D scene. Add loading states. Write basic tests (at least component render tests). Ensure all type-check and lint passes. Final push and deploy.

### Concrete Steps

1. Polish `src/app/page.tsx` — landing page:

   Dark gradient background. Large hero text "AquascapeSim" with a tagline. A preview image/screenshot of the editor (or a stylized gradient placeholder). "Launch Editor" CTA button. A features section with 3 cards: "Realistic 3D", "Physics Simulation", "Save & Share". Footer with credits.

2. Add a React error boundary around the Canvas in the editor page that catches WebGL errors and shows a friendly fallback message.

3. Add a `<Suspense>` boundary around the Canvas with a loading spinner or "Loading 3D scene..." message.

4. Create `src/app/editor/loading.tsx` — Next.js loading state for the editor route.

5. Write tests in `src/__tests__/`:

   - `editor-store.test.ts` — unit tests for the Zustand store: add object, remove object, select, clear.
   - `serialization.test.ts` — unit tests for serialize/deserialize.

   Configure Vitest: create `vitest.config.ts` at the project root with `jsdom` environment and path aliases.

6. Run full validation:

       pnpm type-check
       pnpm lint
       pnpm test
       pnpm build

   All must pass.

7. Create a basic `README.md` with project description, tech stack, setup instructions, and a link to the live demo.

8. Create `.github/workflows/ci.yml`:

   A GitHub Actions workflow that runs on pull requests: install pnpm, install dependencies, run type-check, lint, and test.

9. Final commit and push:

       git add -A
       git commit -m "feat: polish, tests, CI, and README"
       git push origin main

10. Verify the Vercel deployment is live and working end-to-end.

### Validation

Visit the production Vercel URL. Walk through the full user journey: landing page → Launch Editor → place objects → sign up → save → refresh → log in → load. All should work. GitHub Actions CI should show a green check.

---

## Idempotence and Recovery

Every milestone builds on the previous one additively. If a milestone fails partway through, the previous milestone's state is still valid and the app still runs. Each milestone ends with a commit, so `git stash` or `git reset --hard HEAD` can recover a clean state.

If `pnpm install` fails, delete `node_modules/` and `pnpm-lock.yaml` and try again.

---

## Plan Maintenance Notes

2026-02-07: Updated the living sections (`Progress`, `Surprises & Discoveries`, `Decision Log`) to reflect early bootstrap work and to record deviations from the original step sequence (temporary directory scaffold, Next v15 pin, ESLint config format).

2026-02-07: Marked Milestone 1 complete and recorded the deployed production URL; added Vercel env-var sensitivity discovery and the corresponding implementation decision.

2026-02-07: Marked Milestone 2 complete and recorded the WebGL renderer decision.

2026-02-07: Marked Milestone 3 complete; recorded the pnpm import constraint and the decision to use SSAO over N8AO.

2026-02-07: Marked Milestone 4 complete; recorded physics collider/gravity decisions and the bundle-size impact.

2026-02-07: Marked Milestone 5 complete; recorded placement/undo decisions.

2026-02-07: Marked Milestone 6 complete; recorded Supabase CLI auth surprise, Next.js cookies async behavior, and the migration/serialization decisions.

2026-02-07: Marked Milestone 7 complete; recorded dynamic scene shell decision and added test/CI/polish artifacts.

If Supabase migration fails, check the SQL syntax, fix it, and re-run `npx supabase db push`. Migrations are idempotent if written with `CREATE TABLE IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION`.

If Vercel deployment fails, check `vercel logs` and fix the build error locally with `pnpm build` before pushing again.

## Interfaces and Dependencies

Key npm packages and their purposes:

- `three` (r170+): The 3D engine.
- `@react-three/fiber` (v9+): React renderer for Three.js.
- `@react-three/drei` (v9+): Helpers — `OrbitControls`, `Environment`, `Html`, etc.
- `@react-three/postprocessing` (v3+): Post-processing effects.
- `@react-three/rapier` (v1+): Physics wrapper for R3F.
- `@dimforge/rapier3d-compat` (v0.14+): The Rapier WASM physics engine.
- `zustand` (v5+): State management.
- `immer` (v10+): Immutable state helpers.
- `@supabase/supabase-js` (v2+): Supabase client.
- `@supabase/ssr` (v0.5+): Supabase SSR helpers for Next.js.
- `vitest`: Test runner.

Key TypeScript interfaces that must exist after all milestones:

In `src/types/scene.ts`:

    export interface PlacedObject {
      id: string
      type: string           // matches AssetType.type
      position: [number, number, number]
      rotation: [number, number, number]
      scale: [number, number, number]
    }

    export interface AssetType {
      type: string            // unique key, e.g., "small-rock"
      name: string            // display name, e.g., "Small Rock"
      category: 'hardscape' | 'plant' | 'equipment'
      shape: 'box' | 'sphere' | 'cylinder'
      defaultSize: [number, number, number]
      color: string           // hex color
    }

In `src/lib/store/editor-store.ts`:

    export interface EditorState {
      mode: 'select' | 'place'
      selectedAssetType: string | null
      objects: PlacedObject[]
      selectedObjectId: string | null
      setMode: (mode: 'select' | 'place') => void
      selectAsset: (type: string | null) => void
      addObject: (obj: PlacedObject) => void
      removeObject: (id: string) => void
      selectObject: (id: string | null) => void
      updateObject: (id: string, updates: Partial<PlacedObject>) => void
      clearAll: () => void
    }
