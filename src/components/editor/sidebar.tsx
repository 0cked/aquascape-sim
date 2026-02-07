'use client';

import { ASSET_CATALOG } from '@/lib/assets/asset-catalog';
import { useEditorStore } from '@/lib/store/editor-store';

export function Sidebar() {
  const mode = useEditorStore((s) => s.mode);
  const selectedAssetType = useEditorStore((s) => s.selectedAssetType);
  const selectAsset = useEditorStore((s) => s.selectAsset);

  return (
    <aside className="absolute bottom-4 left-4 top-16 w-64 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="text-sm font-medium text-zinc-100">Assets</div>
        <div className="text-[11px] text-zinc-400">
          {mode === 'place' ? 'Click substrate to place' : 'Select to place'}
        </div>
      </div>

      <div className="max-h-full overflow-auto p-2">
        {ASSET_CATALOG.map((asset) => {
          const active = selectedAssetType === asset.type && mode === 'place';
          return (
            <button
              key={asset.type}
              type="button"
              onClick={() => selectAsset(asset.type)}
              className={[
                'w-full rounded-xl border px-3 py-2 text-left transition',
                active
                  ? 'border-white/25 bg-white/10'
                  : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-zinc-100">{asset.name}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-400">{asset.category}</div>
                </div>
                <div
                  className="h-5 w-5 shrink-0 rounded-full border border-white/15"
                  style={{ backgroundColor: asset.color }}
                  aria-hidden
                />
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

