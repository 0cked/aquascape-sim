# Phase 5: Thumbnails, Sharing, and Gallery

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

Saving builds is useful, but without thumbnails and sharing, it is hard to browse or show work to others. This phase adds: (1) thumbnail capture and storage, (2) shareable “open in editor” links for public builds, and (3) a `/gallery` page that lists public builds with pagination and basic likes. After this phase, a signed-in user can save a build with a thumbnail, toggle it public, and anyone can browse `/gallery` and open a public build in the editor via a link.

## Progress

- [x] (2026-02-07) Milestone 1: Database schema for likes and public gallery queries (migrations + RLS).
- [x] (2026-02-07) Milestone 2: Thumbnail capture on save and upload to Supabase Storage via a server route.
- [x] (2026-02-07) Milestone 3: `/gallery` page listing public builds with thumbnails and pagination.
- [ ] (2026-02-07) Milestone 4: Share/open flow: `/editor?build=<id>` loads builds (public or owned) and clears undo history.
- [ ] (2026-02-07) Milestone 5: Likes UI + validation + deploy.

## Surprises & Discoveries

- Observation: Capturing a WebGL canvas thumbnail reliably required `preserveDrawingBuffer: true` on the R3F canvas, and full-size captures can be unexpectedly large on high-DPI screens.
  Evidence: Without `preserveDrawingBuffer`, `canvas.toBlob(...)` can produce empty/blank output depending on browser/GPU. Full-size captures at editor DPR produced multi-megabyte images before downscaling.

## Decision Log

(To be updated as decisions are made.)

- Decision: Add `public.build_likes` with a composite primary key `(build_id, user_id)` and RLS limited to public builds for reads, and authenticated self for writes.
  Rationale: Prevents duplicate likes at the database level and keeps policies simple for the first public gallery.
  Date/Author: 2026-02-07 / Codex.
- Decision: Save the build row first (selecting the new `id`), then upload a best-effort thumbnail and update `thumbnail_url`.
  Rationale: The thumbnail path uses the `buildId`, and making thumbnail upload non-fatal avoids “saved but error” states that would encourage duplicate saves.
  Date/Author: 2026-02-07 / Codex.
- Decision: Downscale thumbnails client-side to a small WebP (max 640px) before upload.
  Rationale: Keeps storage and bandwidth small and makes `/gallery` load quickly, without needing server-side image processing for the MVP.
  Date/Author: 2026-02-07 / Codex.
- Decision: Render gallery thumbnails with a plain `<img>` rather than `next/image`.
  Rationale: Supabase Storage thumbnails are hosted on a remote domain and we have not configured `next.config.ts` `images.remotePatterns` yet; `<img>` avoids build-time config coupling for this milestone.
  Date/Author: 2026-02-07 / Codex.

## Outcomes & Retrospective

(To be updated at milestone completions.)

- (2026-02-07) Milestone 1 outcome: Supabase migration `002_build_likes.sql` adds `build_likes` with RLS policies suitable for a public gallery like count and authenticated like/unlike.
- (2026-02-07) Milestone 2 outcome: Saving a build captures a downscaled WebP thumbnail from the 3D canvas and uploads it via `POST /api/thumbnails`, storing the resulting `thumbnail_url` on the build record.
- (2026-02-07) Milestone 3 outcome: `/gallery` lists public builds with thumbnails, author info, and simple pagination via `?page=`, with cards that open builds in the editor.

---

Plan Revision Note (2026-02-07):

Updated the living sections to record Milestone 3 completion (new `/gallery` page), including a decision to use `<img>` instead of `next/image` for remote Supabase thumbnail URLs.

---

## Context and Orientation

Current state:

- Builds are stored in `public.builds` (Supabase) with fields: `name`, `description`, `scene_data` (jsonb), `thumbnail_url` (text), `is_public` (boolean), timestamps.
- The editor can save and load builds for the current user via `src/components/editor/save-dialog.tsx` and `src/components/editor/load-dialog.tsx`.
- There is no `/gallery` route yet.
- There is no thumbnail capture or storage; `thumbnail_url` is unused.
- The editor now has undo/redo history; `setObjects(...)` clears it (good for loading shared builds).

We will introduce:

- A `build_likes` table with RLS so authenticated users can like/unlike builds.
- A `build_thumbnails` storage bucket (public) to host small images.
- A server route handler to upload thumbnails with the Supabase service role key (never exposed to clients).
- A gallery page that selects public builds and displays cards.
- An editor query loader to fetch and load a build by id when using a share link.

## Plan of Work

### Milestone 1: Schema + RLS

Create a new migration under `supabase/migrations/` to add:

1. `public.build_likes`:
   - columns: `build_id uuid references public.builds (id) on delete cascade`, `user_id uuid references public.profiles (id) on delete cascade`, `created_at timestamptz default now()`.
   - primary key: `(build_id, user_id)` to prevent duplicate likes.
2. RLS:
   - Enable RLS on `build_likes`.
   - Allow authenticated users to insert/delete their own likes.
   - Allow anyone to select likes for public builds (for counts).

Push migrations to Supabase using the existing “db-url push” approach (Supabase CLI is not assumed authenticated).

### Milestone 2: Thumbnail Capture + Upload

1. Ensure the WebGL canvas supports screenshots:
   - Add `preserveDrawingBuffer: true` to the R3F `<Canvas gl={...}>` config (tradeoff: small perf hit, acceptable for MVP thumbnails).
2. Add a server route: `src/app/api/thumbnails/route.ts`:
   - Verify the user session using the Supabase server client (anon key + cookies).
   - Use a Supabase admin client (service role key) to:
     - Create bucket `build_thumbnails` if missing (public).
     - Upload the thumbnail blob to a path like `${userId}/${buildId}.webp` (or random uuid).
     - Return the public URL.
3. Update `src/components/editor/save-dialog.tsx` to:
   - Capture a thumbnail from the canvas (`toBlob` preferred).
   - Upload it to `/api/thumbnails` before inserting the build row.
   - Store the returned `thumbnail_url` in the `builds` insert.

### Milestone 3: Gallery Page

Add `src/app/gallery/page.tsx` (server component) that:

- Uses the Supabase server client to query `builds` where `is_public=true`.
- Selects fields needed for cards (`id`, `name`, `description`, `thumbnail_url`, timestamps, and profile display name).
- Paginates with `limit` and `offset` (query params: `?page=`).
- Renders a responsive grid of cards with thumbnails and “Open in editor” links.

### Milestone 4: Share/Open Flow

Add a client-side loader component on the editor page:

- Reads `build` from `useSearchParams()`.
- Fetches the build row from Supabase (public builds readable by anyone; owned builds readable by owner).
- Calls `setObjects(deserializeScene(...))` and clears selection.
- Shows a small toast/banner on successful load (“Loaded shared build: …”).

Gallery cards link to `/editor?build=<id>`.

### Milestone 5: Likes + Validation

1. Add likes UI to gallery cards:
   - Show like count.
   - If logged in: toggle like/unlike.
   - Use Supabase browser client to insert/delete `build_likes`.
2. Validate:
   - `pnpm type-check && pnpm lint && pnpm test && pnpm build`.
   - Ensure `https://aquascape-sim.vercel.app/gallery` loads and cards open in editor.

## Validation and Acceptance

1. `pnpm dev`
2. Save a build: the save request uploads a thumbnail and inserts a build row with `thumbnail_url`.
3. Mark build public; it appears in `/gallery`.
4. Open a public build via `/editor?build=<id>` and confirm objects load.
5. Like/unlike a public build; count updates.

## Idempotence and Recovery

- Migrations are idempotent (use `create table if not exists`, `drop policy if exists` patterns).
- Thumbnail upload route should be safe to retry; use `upsert` for storage uploads.
- If gallery queries fail due to RLS, confirm policies and re-run `npx supabase db push --db-url ...`.

## Artifacts and Notes

(Attach short transcripts, build URLs, or policy snippets as they arise.)
