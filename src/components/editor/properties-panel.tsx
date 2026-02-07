'use client';

import Image from 'next/image';
import { useMemo } from 'react';

import { getAssetDefinition } from '@/lib/assets/asset-catalog';
import { useEditorStore } from '@/lib/store/editor-store';

function degrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

function radians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function PropertiesPanel() {
  const objects = useEditorStore((s) => s.objects);
  const selectedObjectIds = useEditorStore((s) => s.selectedObjectIds);
  const activeObjectId = useEditorStore((s) => s.activeObjectId);
  const updateObject = useEditorStore((s) => s.updateObject);
  const removeObjects = useEditorStore((s) => s.removeObjects);
  const duplicateObjects = useEditorStore((s) => s.duplicateObjects);

  const activeObject = useMemo(() => {
    if (!activeObjectId) return null;
    return objects.find((o) => o.id === activeObjectId) ?? null;
  }, [activeObjectId, objects]);

  const asset = activeObject ? getAssetDefinition(activeObject.assetType) : undefined;
  const selectionCount = selectedObjectIds.length;

  return (
    <aside className="absolute bottom-4 right-4 top-16 w-72 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="text-sm font-medium text-zinc-100">Properties</div>
        <div className="text-[11px] text-zinc-400">{selectionCount} selected</div>
      </div>

      <div className="max-h-full overflow-auto p-3">
        {!activeObject ? (
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
            Select an object to edit transforms.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {asset ? (
                <div
                  className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/30"
                  aria-hidden="true"
                >
                  <Image
                    src={asset.thumbnailUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9"
                  />
                </div>
              ) : (
                <div className="h-11 w-11 rounded-xl border border-white/10 bg-black/30" />
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-zinc-100">
                  {asset?.name ?? activeObject.assetType}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-zinc-400">{activeObject.id}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] font-medium tracking-wide text-zinc-300">Transform</div>

              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400">Position</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['x', 'y', 'z'] as const).map((axis, idx) => (
                    <label key={axis} className="block">
                      <div className="text-[10px] uppercase text-zinc-500">{axis}</div>
                      <input
                        type="number"
                        step={0.05}
                        value={activeObject.position[idx]}
                        onChange={(e) => {
                          const next = Number(e.target.value);
                          const pos = [...activeObject.position] as [number, number, number];
                          pos[idx] = Number.isFinite(next) ? next : pos[idx];
                          updateObject(activeObject.id, { position: pos });
                        }}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-white/20"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400">Rotation (deg)</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['x', 'y', 'z'] as const).map((axis, idx) => (
                    <label key={axis} className="block">
                      <div className="text-[10px] uppercase text-zinc-500">{axis}</div>
                      <input
                        type="number"
                        step={1}
                        value={Number(degrees(activeObject.rotation[idx]).toFixed(1))}
                        onChange={(e) => {
                          const nextDeg = Number(e.target.value);
                          const rot = [...activeObject.rotation] as [number, number, number];
                          if (Number.isFinite(nextDeg)) rot[idx] = radians(nextDeg);
                          updateObject(activeObject.id, { rotation: rot });
                        }}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-white/20"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400">Scale</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['x', 'y', 'z'] as const).map((axis, idx) => (
                    <label key={axis} className="block">
                      <div className="text-[10px] uppercase text-zinc-500">{axis}</div>
                      <input
                        type="number"
                        step={0.05}
                        min={0.1}
                        value={activeObject.scale[idx]}
                        onChange={(e) => {
                          const next = Number(e.target.value);
                          const scl = [...activeObject.scale] as [number, number, number];
                          if (Number.isFinite(next)) scl[idx] = next;
                          updateObject(activeObject.id, { scale: scl });
                        }}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-white/20"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => duplicateObjects(selectedObjectIds)}
                className="h-10 rounded-xl border border-white/10 bg-white/5 text-sm text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => removeObjects(selectedObjectIds)}
                className="h-10 rounded-xl border border-white/10 bg-white/5 text-sm text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
              >
                Delete
              </button>
            </div>

            <div className="text-[11px] text-zinc-400">
              Editing the active object. Shift-click to add/remove from the selection.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
