'use client';

import { useEffect, useMemo } from 'react';

import { getAssetDefinition } from '@/lib/assets/asset-catalog';
import { useEditorStore } from '@/lib/store/editor-store';

export function Toolbar() {
  const mode = useEditorStore((s) => s.mode);
  const selectedAssetType = useEditorStore((s) => s.selectedAssetType);
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId);
  const setMode = useEditorStore((s) => s.setMode);
  const removeObject = useEditorStore((s) => s.removeObject);

  const modeLabel = useMemo(() => {
    if (mode !== 'place' || !selectedAssetType) return 'Select';
    const asset = getAssetDefinition(selectedAssetType);
    return asset ? `Place: ${asset.name}` : 'Place';
  }, [mode, selectedAssetType]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTextInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (isTextInput) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectId) {
        e.preventDefault();
        removeObject(selectedObjectId);
      }
      if (e.key === 'Escape') {
        setMode('select');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [removeObject, selectedObjectId, setMode]);

  return (
    <header className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-zinc-100">AquascapeSim</div>
        <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
          {modeLabel}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode('select')}
          className="h-9 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
        >
          Select
        </button>
        <button
          type="button"
          onClick={() => {
            if (selectedObjectId) removeObject(selectedObjectId);
          }}
          disabled={!selectedObjectId}
          className="h-9 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-zinc-100 transition enabled:hover:border-white/20 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </header>
  );
}

