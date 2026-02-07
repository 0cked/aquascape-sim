import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#05070a] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(0,170,255,0.18),transparent_35%),radial-gradient(circle_at_80%_60%,rgba(0,255,170,0.12),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.08),transparent_55%)]" />

      <main className="mx-auto max-w-5xl px-6 py-16">
        <header className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-wide text-zinc-100">
            AquascapeSim
          </div>
          <Link
            href="/editor"
            className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Launch Editor
          </Link>
        </header>

        <section className="mt-14 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
              Design aquascapes in 3D.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-300">
              A browser-based aquarium editor with realistic lighting,
              physics-based placement, and Supabase-backed save/load.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/editor"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-black shadow-[0_0_0_1px_rgba(255,255,255,0.12)] transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Launch Editor
              </Link>
              <div className="text-sm text-zinc-400">
                Bootstrap build. Expect rough edges.
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_24px_120px_rgba(0,0,0,0.6)] backdrop-blur">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="text-xs font-medium text-zinc-200">
                Editor Preview
              </div>
              <div className="mt-1 text-[11px] text-zinc-400">
                Glass tank, water, substrate, bloom/SSAO, Rapier collisions
              </div>
            </div>
            <div className="p-5">
              <div className="aspect-[4/3] w-full rounded-2xl bg-[radial-gradient(circle_at_20%_30%,rgba(0,170,255,0.28),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(0,255,170,0.18),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] ring-1 ring-white/10" />
              <div className="mt-4 text-xs text-zinc-400">
                Tip: Use the left sidebar to enter placement mode, then click
                the substrate to drop objects.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <div className="text-sm font-medium text-zinc-100">Realistic 3D</div>
            <div className="mt-2 text-sm leading-6 text-zinc-300">
              PBR materials, environment reflections, and filmic tone mapping.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <div className="text-sm font-medium text-zinc-100">
              Physics Placement
            </div>
            <div className="mt-2 text-sm leading-6 text-zinc-300">
              Drop rocks and plants. They collide and settle naturally.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <div className="text-sm font-medium text-zinc-100">
              Save and Load
            </div>
            <div className="mt-2 text-sm leading-6 text-zinc-300">
              Supabase Auth + Postgres JSONB builds to keep your work.
            </div>
          </div>
        </section>

        <footer className="mt-14 border-t border-white/10 pt-6 text-xs text-zinc-500">
          Built with Next.js, React Three Fiber, Rapier, and Supabase.
        </footer>
      </main>
    </div>
  );
}
