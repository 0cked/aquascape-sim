'use client';

import { useEffect, useState } from 'react';

import { useQualityStore, type QualityPreset } from '@/lib/store/quality-store';

const PRESET_LABEL: Record<QualityPreset, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function QualityMenu() {
  const preset = useQualityStore((s) => s.preset);
  const setPreset = useQualityStore((s) => s.setPreset);
  const fogEnabled = useQualityStore((s) => s.fogEnabled);
  const causticsEnabled = useQualityStore((s) => s.causticsEnabled);
  const godRaysEnabled = useQualityStore((s) => s.godRaysEnabled);
  const setFogEnabled = useQualityStore((s) => s.setFogEnabled);
  const setCausticsEnabled = useQualityStore((s) => s.setCausticsEnabled);
  const setGodRaysEnabled = useQualityStore((s) => s.setGodRaysEnabled);
  const autoDegradeEnabled = useQualityStore((s) => s.autoDegradeEnabled);
  const setAutoDegradeEnabled = useQualityStore((s) => s.setAutoDegradeEnabled);

  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="hidden sm:inline">Quality: {PRESET_LABEL[preset]}</span>
        <span className="sm:hidden">Q: {PRESET_LABEL[preset]}</span>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+10px)] w-56 overflow-hidden rounded-2xl border border-white/10 bg-black/80 shadow-[0_24px_90px_rgba(0,0,0,0.7)] backdrop-blur"
          role="menu"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <div className="text-xs font-medium text-zinc-100">Rendering Quality</div>
            <div className="mt-1 text-[11px] text-zinc-400">DPR, shadows, and post-processing.</div>
          </div>

          <div className="p-2">
            {(['low', 'medium', 'high'] as const).map((p) => {
              const active = p === preset;
              return (
                <button
                  key={p}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPreset(p);
                    setOpen(false);
                  }}
                  className={[
                    'flex h-10 w-full items-center justify-between rounded-xl px-3 text-sm transition',
                    active ? 'bg-white text-black' : 'text-zinc-200 hover:bg-white/10',
                  ].join(' ')}
                >
                  <div className="font-medium">{PRESET_LABEL[p]}</div>
                  <div className="text-xs opacity-70">
                    {p === 'low' ? 'Fastest' : p === 'medium' ? 'Balanced' : 'Prettiest'}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/10 px-4 py-3">
            <div className="text-[11px] font-medium text-zinc-200">Atmosphere</div>
            <div className="mt-2 space-y-2">
              <label className="flex cursor-pointer items-center justify-between gap-3 text-xs text-zinc-200">
                <span>Underwater fog</span>
                <input
                  type="checkbox"
                  checked={fogEnabled}
                  onChange={(e) => setFogEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/30"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 text-xs text-zinc-200">
                <span>Caustics</span>
                <input
                  type="checkbox"
                  checked={causticsEnabled}
                  onChange={(e) => setCausticsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/30"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 text-xs text-zinc-200">
                <span>Light shafts</span>
                <input
                  type="checkbox"
                  checked={godRaysEnabled}
                  onChange={(e) => setGodRaysEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/30"
                />
              </label>
            </div>
          </div>

          <div className="border-t border-white/10 px-4 py-3">
            <label className="flex cursor-pointer items-center justify-between gap-3 text-xs text-zinc-200">
              <span>Auto-degrade on low FPS</span>
              <input
                type="checkbox"
                checked={autoDegradeEnabled}
                onChange={(e) => setAutoDegradeEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black/30"
              />
            </label>
            <div className="mt-1 text-[11px] text-zinc-400">
              When enabled, AquascapeSim may lower quality to keep interaction responsive.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
