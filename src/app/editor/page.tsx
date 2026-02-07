import { SceneShell } from '@/components/three/scene-shell';
import { BuildQueryLoader } from '@/components/editor/build-query-loader';
import { PropertiesPanel } from '@/components/editor/properties-panel';
import { Sidebar } from '@/components/editor/sidebar';
import { Toolbar } from '@/components/editor/toolbar';

export default function EditorPage() {
  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-black text-zinc-100">
      <BuildQueryLoader />
      <SceneShell />
      <Toolbar />
      <Sidebar />
      <PropertiesPanel />
    </main>
  );
}
