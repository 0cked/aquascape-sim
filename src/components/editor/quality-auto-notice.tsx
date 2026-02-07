'use client';

import { useQualityStore } from '@/lib/store/quality-store';

export function QualityAutoNotice() {
  const preset = useQualityStore((s) => s.preset);
  const autoNotice = useQualityStore((s) => s.autoNotice);
  const autoDegradeEnabled = useQualityStore((s) => s.autoDegradeEnabled);
  const setAutoDegradeEnabled = useQualityStore((s) => s.setAutoDegradeEnabled);
  const setAutoNotice = useQualityStore((s) => s.setAutoNotice);

  if (!autoNotice) return null;

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[60] flex justify-center p-3">
      <div className="pointer-events-auto w-full max-w-[min(720px,calc(100vw-24px))] rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-zinc-100 shadow-[0_20px_90px_rgba(0,0,0,0.7)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-medium">{autoNotice}</div>
            <div className="mt-1 text-[11px] text-zinc-400">
              Current quality: <span className="text-zinc-200">{preset}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!autoDegradeEnabled ? (
              <button
                type="button"
                onClick={() => setAutoDegradeEnabled(true)}
                className="h-9 rounded-full bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                Re-enable Auto
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setAutoNotice(null)}
              className="h-9 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

