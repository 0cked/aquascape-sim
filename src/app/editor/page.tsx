import { Scene } from '@/components/three/scene';
import { Sidebar } from '@/components/editor/sidebar';
import { Toolbar } from '@/components/editor/toolbar';

export default function EditorPage() {
  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-black text-zinc-100">
      <Scene />
      <Toolbar />
      <Sidebar />
    </main>
  );
}
