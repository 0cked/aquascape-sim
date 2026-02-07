'use client';

import { useMemo, useState, useEffect } from 'react';

import { useEditorStore } from '@/lib/store/editor-store';
import { deserializeScene } from '@/lib/store/serialization';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthUser } from '@/lib/supabase/use-auth-user';

type BuildListItem = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  scene_data: unknown;
};

export type LoadDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function LoadDialog({ open, onClose }: LoadDialogProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { user } = useAuthUser();
  const setObjects = useEditorStore((s) => s.setObjects);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [builds, setBuilds] = useState<BuildListItem[]>([]);

  useEffect(() => {
    if (!open) return;
    if (!user) return;

    let canceled = false;
    const run = async () => {
      setError(null);
      setLoading(true);
      try {
        const { data, error: selectError } = await supabase
          .from('builds')
          .select('id,name,created_at,updated_at,scene_data')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        if (selectError) throw selectError;

        if (canceled) return;
        setBuilds((data ?? []) as BuildListItem[]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Load failed';
        setError(message);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    run();
    return () => {
      canceled = true;
    };
  }, [open, supabase, user]);

  if (!open) return null;

  const loadBuild = (build: BuildListItem) => {
    if (typeof build.scene_data !== 'string') {
      setError('Build scene data is not a string (unexpected format).');
      return;
    }

    const objects = deserializeScene(build.scene_data);
    setObjects(objects);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#06080b] shadow-[0_40px_140px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-medium text-zinc-100">Load Build</div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-zinc-300 hover:bg-white/5"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="space-y-3 px-4 pb-4 pt-4">
          {!user ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200">
              Sign in to load your saved builds.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="max-h-[50vh] overflow-auto rounded-xl border border-white/10">
            {loading ? (
              <div className="px-3 py-3 text-sm text-zinc-300">Loading…</div>
            ) : builds.length === 0 ? (
              <div className="px-3 py-3 text-sm text-zinc-400">No builds yet.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {builds.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-zinc-100">{b.name}</div>
                      <div className="mt-0.5 text-[11px] text-zinc-400">
                        Updated {new Date(b.updated_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadBuild(b)}
                      className="h-9 shrink-0 rounded-full bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200"
                    >
                      Load
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

