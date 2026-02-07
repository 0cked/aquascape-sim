'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useEditorStore } from '@/lib/store/editor-store';
import { serializeScene } from '@/lib/store/serialization';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthUser } from '@/lib/supabase/use-auth-user';

export type SaveDialogProps = {
  open: boolean;
  onClose: () => void;
};

async function canvasToWebpBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  // Downscale the capture to keep thumbnail size small and uploads fast.
  const maxDim = 640;
  const srcW = canvas.width;
  const srcH = canvas.height;

  if (!srcW || !srcH) return null;

  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const dstW = Math.max(1, Math.round(srcW * scale));
  const dstH = Math.max(1, Math.round(srcH * scale));

  const tmp = document.createElement('canvas');
  tmp.width = dstW;
  tmp.height = dstH;
  const ctx = tmp.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(canvas, 0, 0, dstW, dstH);
  return await new Promise<Blob | null>((resolve) => {
    tmp.toBlob(resolve, 'image/webp', 0.78);
  });
}

export function SaveDialog({ open, onClose }: SaveDialogProps) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { user } = useAuthUser();
  const objects = useEditorStore((s) => s.objects);

  const [name, setName] = useState<string>('My Aquascape');
  const [description, setDescription] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Please sign in to save builds.');
      return;
    }

    setLoading(true);
    try {
      const sceneData = serializeScene(objects);

      const { data: inserted, error: insertError } = await supabase
        .from('builds')
        .insert({
          user_id: user.id,
          name,
          description,
          scene_data: sceneData,
          thumbnail_url: null,
          is_public: isPublic,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;

      const buildId = typeof inserted?.id === 'string' ? inserted.id : null;
      if (buildId) {
        // Best-effort: the build is already saved. Thumbnail upload failure should not
        // block saving or prompt the user to accidentally save duplicates.
        try {
          const el = document.getElementById('aquascape-canvas');
          const canvas = el instanceof HTMLCanvasElement ? el : null;
          if (!canvas) throw new Error('Aquascape canvas not found');

          const blob = await canvasToWebpBlob(canvas);
          if (!blob) throw new Error('Failed to capture thumbnail');

          const form = new FormData();
          form.set('buildId', buildId);
          form.set('thumbnail', blob, `${buildId}.webp`);

          const res = await fetch('/api/thumbnails', { method: 'POST', body: form });
          if (!res.ok) throw new Error(`Thumbnail upload failed (${res.status})`);

          const payload = (await res.json()) as { url?: unknown };
          const url = typeof payload.url === 'string' ? payload.url : null;
          if (!url) throw new Error('Thumbnail upload returned no url');

          const { error: updateError } = await supabase
            .from('builds')
            .update({ thumbnail_url: url })
            .eq('id', buildId);
          if (updateError) throw updateError;
        } catch (thumbErr) {
          // Non-fatal (see comment above).
          // eslint-disable-next-line no-console
          console.warn('Thumbnail upload skipped/failed:', thumbErr);
        }
      }

      onClose();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
    } finally {
      setLoading(false);
    }
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
          <div className="text-sm font-medium text-zinc-100">Save Build</div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-zinc-300 hover:bg-white/5"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form className="space-y-3 px-4 pb-4 pt-4" onSubmit={save}>
          <label className="block">
            <div className="text-xs font-medium text-zinc-200">Name</div>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/20"
            />
          </label>

          <label className="block">
            <div className="text-xs font-medium text-zinc-200">Description</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/20"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/30"
            />
            Make public
          </label>

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-xl bg-white text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>

          <div className="text-xs text-zinc-400">
            Saving {objects.length} object{objects.length === 1 ? '' : 's'}.
          </div>
        </form>
      </div>
    </div>
  );
}
