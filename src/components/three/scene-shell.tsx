'use client';

import dynamic from 'next/dynamic';

import { SceneErrorBoundary } from '@/components/three/scene-error-boundary';

const Scene = dynamic(() => import('@/components/three/scene').then((m) => m.Scene), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 backdrop-blur">
        Loading 3D scene…
      </div>
    </div>
  ),
});

export function SceneShell() {
  return (
    <div className="absolute inset-0">
      <SceneErrorBoundary>
        <Scene />
      </SceneErrorBoundary>
    </div>
  );
}

