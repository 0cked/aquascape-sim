# AquascapeSim

Browser-based 3D aquarium aquascaping editor: place placeholder rocks/wood/plants in a glass tank with lighting, post-processing, and physics-based collisions. Builds can be saved and loaded via Supabase.

Live demo: https://aquascape-sim.vercel.app

## Tech Stack

- Next.js 15 (App Router) + TypeScript (strict)
- Three.js via React Three Fiber + Drei
- Rapier physics via `@react-three/rapier`
- Post-processing via `@react-three/postprocessing`
- Zustand state
- Tailwind CSS 4
- Supabase (Auth + Postgres)

## Local Development

Prereqs:

- Node 22+
- pnpm
- Supabase project creds in `.secrets/` (see `AGENTS.md`)

Commands:

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Scripts

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

## Supabase Schema

Migrations live in `supabase/migrations/`. The bootstrap schema creates:

- `profiles`
- `builds` (includes `scene_data` JSONB)
- `asset_catalog`

Row Level Security (RLS) is enabled.

