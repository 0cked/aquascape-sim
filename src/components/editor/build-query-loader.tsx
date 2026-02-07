'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useEditorStore } from '@/lib/store/editor-store';
import { deserializeScene } from '@/lib/store/serialization';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type LoaderState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; name: string }
  | { status: 'error'; message: string };

export function BuildQueryLoader() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const setObjects = useEditorStore((s) => s.setObjects);

  const [state, setState] = useState<LoaderState>({ status: 'idle' });
  const hideTimerRef = useRef<number | null>(null);
  const lastLoadedIdRef = useRef<string | null>(null);

  const buildId = searchParams.get('build');

  useEffect(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (!buildId) {
      lastLoadedIdRef.current = null;
      setState({ status: 'idle' });
      return;
    }

    if (buildId === lastLoadedIdRef.current) return;
    if (buildId.length < 8) {
      setState({ status: 'error', message: 'Invalid build id.' });
      return;
    }

    let canceled = false;
    const run = async () => {
      setState({ status: 'loading' });
      try {
        const { data, error } = await supabase
          .from('builds')
          .select('id,name,scene_data')
          .eq('id', buildId)
          .maybeSingle();
        if (canceled) return;
        if (error) throw error;
        if (!data) {
          setState({ status: 'error', message: 'Build not found or you do not have access.' });
          return;
        }

        if (typeof data.scene_data !== 'string') {
          setState({ status: 'error', message: 'Build data format is invalid (expected string scene_data).' });
          return;
        }

        const objects = deserializeScene(data.scene_data);
        setObjects(objects);

        lastLoadedIdRef.current = data.id;
        setState({ status: 'loaded', name: data.name });

        hideTimerRef.current = window.setTimeout(() => {
          setState({ status: 'idle' });
        }, 3200);
      } catch (err) {
        if (canceled) return;
        const message = err instanceof Error ? err.message : 'Failed to load build.';
        setState({ status: 'error', message });
      }
    };

    run();
    return () => {
      canceled = true;
    };
  }, [buildId, setObjects, supabase]);

  if (state.status === 'idle') return null;

  const className =
    state.status === 'error'
      ? 'border-red-500/20 bg-red-500/10 text-red-100'
      : state.status === 'loading'
        ? 'border-white/10 bg-white/5 text-zinc-100'
        : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100';

  const label =
    state.status === 'loading'
      ? 'Loading build…'
      : state.status === 'loaded'
        ? `Loaded build: ${state.name}`
        : `Load failed: ${state.message}`;

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[60] flex justify-center p-3">
      <div
        className={`pointer-events-auto max-w-[min(680px,calc(100vw-24px))] rounded-2xl border px-4 py-2 text-sm shadow-[0_20px_80px_rgba(0,0,0,0.65)] backdrop-blur ${className}`}
        role={state.status === 'error' ? 'alert' : undefined}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 truncate">{label}</div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xs text-zinc-200 hover:bg-white/10"
            onClick={() => setState({ status: 'idle' })}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
