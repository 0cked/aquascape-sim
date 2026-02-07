import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#05070a] text-zinc-100">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(0,170,255,0.18),transparent_35%),radial-gradient(circle_at_80%_60%,rgba(0,255,170,0.12),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.08),transparent_55%)]" />
        <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          AquascapeSim
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-300">
          Design your dream aquascape in 3D. Place rocks, wood, and plants with
          real-time lighting and physics.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/editor"
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-black shadow-[0_0_0_1px_rgba(255,255,255,0.1)] transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Launch Editor
          </Link>
          <div className="text-sm text-zinc-400">
            Early bootstrap build. Expect rough edges.
          </div>
        </div>
      </main>
    </div>
  );
}
