import { Scene } from '@/components/three/scene';

export default function EditorPage() {
  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-black text-zinc-100">
      <Scene />

      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs text-zinc-200 backdrop-blur">
        AquascapeSim Editor (bootstrap)
      </div>
    </main>
  );
}
