# AGENTS.md — AquascapeSim

This file guides autonomous coding agents working in the AquascapeSim repository. AquascapeSim is a browser-based 3D aquarium aquascaping simulator with realistic physics, PBR lighting, and a full editor experience. The project is greenfield — you are building it from scratch.

## Project Identity

- **Name**: AquascapeSim
- **Repo**: `0cked/aquascape-sim` (GitHub, created during bootstrap)
- **Hosting**: Vercel (Next.js app) + Cloudflare R2 (asset CDN)
- **Database / Auth / Storage**: Supabase (new project, credentials in `.secrets/`)
- **Domain**: None yet. Use the default Vercel `.vercel.app` URL. Do not configure custom domains.

## Tech Stack (canonical, do not deviate without logging a decision)

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router, TypeScript strict) | `src/` directory layout |
| 3D Engine | Three.js r170+ via React Three Fiber (R3F) + Drei | WebGPU renderer with WebGL2 fallback |
| Physics | Rapier 3D (`@dimforge/rapier3d-compat`) via `@react-three/rapier` | WASM, rigid bodies for placement/collision |
| Post-processing | `@react-three/postprocessing` (EffectComposer) | Bloom, SSAO/GTAO, tone mapping, vignette |
| State management | Zustand | Scene state, editor state, undo/redo stack |
| Styling | Tailwind CSS 4 | UI panels, overlays, menus |
| Auth / DB / Storage | Supabase (postgres + auth + storage buckets) | Builds, user profiles, thumbnails, shared links |
| Asset format | glTF 2.0 + Draco + KTX2/BasisU | All 3D models and textures |
| Deployment | Vercel | Automatic preview deploys on PR, production on `main` |
| Asset CDN | Cloudflare R2 (if needed) or Supabase Storage | Large model/texture hosting |
| Package manager | pnpm | Lockfile committed. Do not use npm or yarn. |
| Node version | 22 LTS | |

## Secrets and Credentials

All secrets live in `.secrets/` at the repo root. This folder is gitignored and must NEVER be committed.

```
.secrets/
  supabase/
    SUPABASE_URL.txt
    SUPABASE_PUBLISHABLE_KEY.txt  # anon/public key (safe for client)
    SUPABASE_SECRET_KEY.txt       # service role key (server-side only)
    DB_PASSWORD.txt
    SESSION_POOLER.txt            # connection pooler string
  cloudflare/
    ACCOUNT_ID.txt
    API_TOKEN.txt
```

**Reading secrets**: Use `cat .secrets/supabase/SUPABASE_URL.txt` etc. Trim whitespace. When setting environment variables (Vercel, `.env.local`), read from these files. Never hardcode secret values in source code or plans.

**Environment variables to configure**:
- `NEXT_PUBLIC_SUPABASE_URL` — from `SUPABASE_URL.txt`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from `SUPABASE_PUBLISHABLE_KEY.txt`
- `SUPABASE_SERVICE_ROLE_KEY` — from `SUPABASE_SECRET_KEY.txt` (server-side only, never expose to client)

## Pre-authenticated CLIs

The environment has the following CLIs pre-authenticated:
- **GitHub CLI** (`gh`): authenticated as `0cked`. Use `gh repo create`, `gh pr create`, etc.
- **Vercel CLI** (`vercel`): authenticated. Use `vercel link`, `vercel env add`, `vercel deploy`, etc.
- **Supabase CLI** (`npx supabase`): use with the project credentials in `.secrets/`.
- **pnpm**: available globally.

## Repository Layout (target structure)

```
aquascape-sim/
├── .github/
│   └── workflows/
│       └── ci.yml                    # lint + type-check + test on PR
├── .secrets/                         # gitignored, credentials
├── .agent/
│   └── PLANS.md                      # ExecPlan rules (read before any major work)
│   └── plans/                        # individual ExecPlan files per feature
├── public/
│   ├── models/                       # starter glTF assets (rocks, driftwood, tank)
│   ├── textures/                     # HDR env maps, substrate textures
│   └── favicon.ico
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # landing / marketing
│   │   ├── editor/
│   │   │   └── page.tsx              # main 3D editor page
│   │   ├── gallery/
│   │   │   └── page.tsx              # community gallery
│   │   └── api/                      # Route handlers (server-side)
│   ├── components/
│   │   ├── ui/                       # Tailwind UI primitives (buttons, modals, panels)
│   │   ├── editor/                   # Editor UI (toolbar, sidebar, properties panel)
│   │   └── three/                    # R3F components (Scene, Tank, Plants, Lights, etc.)
│   ├── lib/
│   │   ├── supabase/                 # Supabase client, server client, helpers
│   │   ├── store/                    # Zustand stores (editor, scene, auth)
│   │   ├── physics/                  # Rapier setup, collision helpers
│   │   ├── assets/                   # Asset loading, LOD, instancing helpers
│   │   └── utils/                    # General utilities
│   ├── types/                        # Shared TypeScript types and interfaces
│   └── styles/
│       └── globals.css               # Tailwind directives + custom CSS vars
├── supabase/
│   ├── migrations/                   # SQL migration files
│   └── seed.sql                      # Seed data (starter assets catalog)
├── AGENTS.md                         # this file
├── README.md
├── .env.local.example                # template (no real secrets)
├── .gitignore
├── .eslintrc.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── pnpm-lock.yaml
└── package.json
```

## ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in `.agent/PLANS.md`) from design to implementation. For the initial bootstrap, use the ExecPlan at `.agent/plans/001-bootstrap.md`.

## Build, Lint, and Test Commands

All commands are run from the repository root.

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Type checking
pnpm type-check        # tsc --noEmit

# Linting
pnpm lint              # next lint

# Build for production
pnpm build             # next build

# Run tests
pnpm test              # vitest run
pnpm test:watch        # vitest

# Supabase local (if needed)
npx supabase db push   # push migrations to remote project
npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
```

After modifying any source file, run `pnpm type-check && pnpm lint` before committing. After modifying Supabase migrations, run `npx supabase db push` and regenerate types.

## Code Style and Conventions

- **TypeScript strict mode**. No `any` types. Use explicit return types on exported functions.
- **React**: Functional components only. Use `'use client'` directive only where needed (components with hooks, browser APIs, Three.js).
- **Imports**: Use `@/` path alias mapped to `src/`. Example: `import { useEditorStore } from '@/lib/store/editor'`.
- **File naming**: `kebab-case.tsx` for components, `kebab-case.ts` for utilities. Directories are `kebab-case`.
- **Component naming**: `PascalCase` for React components. One component per file (colocate small sub-components if tightly coupled).
- **Three.js / R3F**: All 3D scene content lives in `src/components/three/`. Canvas and scene root live in the editor page. Use Drei helpers wherever possible.
- **State**: Zustand stores in `src/lib/store/`. Each store in its own file. Use `immer` middleware for complex nested updates.
- **Environment variables**: Client-exposed vars use `NEXT_PUBLIC_` prefix. Server-only vars have no prefix. Never import server-only vars in client components.

## Commit Conventions

- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`.
- Commit frequently — at least at every milestone checkpoint.
- Write meaningful commit messages that describe what changed and why.
- After each milestone, push to `main` and let Vercel deploy.

## Git Workflow

- Work directly on `main` for the initial bootstrap phase.
- Push frequently so Vercel preview deploys validate the build.
- After bootstrap is complete, switch to feature branches + PRs for subsequent work.

## Performance Budgets

- Target: 60 FPS on mid-range laptop (integrated GPU, e.g., M1 MacBook Air or Intel Iris Xe).
- Scene budget: ~500K triangles max rendered at any time. Use instancing for repeated objects (plants, rocks).
- Texture budget: KTX2/BasisU compressed. No uncompressed textures over 1MB.
- Bundle: Initial JS bundle under 500KB gzipped (use dynamic imports for Three.js/R3F).
- Largest Contentful Paint under 2.5 seconds on 4G.

## Asset Pipeline

- All 3D assets: glTF 2.0 binary (`.glb`).
- Geometry: Draco-compressed.
- Textures: KTX2 with BasisU transcoding (via Three.js `KTX2Loader`).
- For the initial build, use placeholder geometries (boxes, cylinders, spheres) with PBR materials. Real assets come later.
- HDRI environment maps: `.hdr` format, loaded via `RGBELoader` or `@react-three/drei`'s `Environment` component. Use a free underwater/studio HDRI from Poly Haven or similar (download and include in `public/textures/`).

## Supabase Schema Guidance

Tables to create (via migrations in `supabase/migrations/`):

- `profiles` — extends Supabase auth. Fields: `id` (FK to auth.users), `username`, `display_name`, `avatar_url`, `created_at`.
- `builds` — saved aquascapes. Fields: `id`, `user_id` (FK profiles), `name`, `description`, `scene_data` (JSONB — serialized scene graph), `thumbnail_url`, `is_public`, `created_at`, `updated_at`.
- `build_likes` — many-to-many. Fields: `build_id`, `user_id`, `created_at`.
- `asset_catalog` — reference catalog of available assets (plants, rocks, equipment). Fields: `id`, `name`, `category`, `model_url`, `thumbnail_url`, `metadata` (JSONB).

Enable Row Level Security on all tables. Users can read public builds, read/write their own builds, read asset catalog.

## Error Handling

- Use error boundaries in React for 3D scene crashes (WebGL context loss, asset load failures).
- All Supabase calls: handle errors explicitly, never swallow them.
- Display user-friendly error messages in the UI. Log detailed errors to console in development.

## What "Done" Looks Like for Bootstrap

After the initial bootstrap milestone, a user should be able to:

1. Visit the Vercel deployment URL.
2. See a landing page with a "Launch Editor" button.
3. Enter the 3D editor and see a glass aquarium tank with water, substrate, and ambient lighting.
4. Place placeholder objects (rocks, plants) by clicking a toolbar button and clicking in the scene.
5. Objects snap to the substrate surface and collide with each other (Rapier physics).
6. Orbit/pan/zoom camera controls work smoothly.
7. Post-processing effects are visible (bloom on water caustics, SSAO on objects, tone mapping).
8. Sign up / log in via Supabase Auth (email/password or magic link).
9. Save a build (scene serialized to JSONB in Supabase).
10. Load a saved build.

This is the acceptance criteria for the first ExecPlan.