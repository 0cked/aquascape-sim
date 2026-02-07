import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { EditorMode, PlacedObject } from '@/types/scene';

export type EditorStore = {
  mode: EditorMode;
  selectedAssetType: string | null;
  objects: PlacedObject[];
  selectedObjectIds: string[];
  activeObjectId: string | null;

  reset: () => void;
  setMode: (mode: EditorMode) => void;
  selectAsset: (assetType: string) => void;

  addObject: (object: PlacedObject) => void;
  removeObject: (id: string) => void;
  removeObjects: (ids: string[]) => void;
  setObjects: (objects: PlacedObject[]) => void;

  selectObject: (id: string | null, opts?: { additive?: boolean }) => void;
  clearSelection: () => void;
  updateObject: (id: string, patch: Partial<Pick<PlacedObject, 'position' | 'rotation' | 'scale'>>) => void;
};

export const useEditorStore = create<EditorStore>()(
  immer((set) => ({
    mode: 'select',
    selectedAssetType: null,
    objects: [],
    selectedObjectIds: [],
    activeObjectId: null,

    reset: () => {
      set((s) => {
        s.mode = 'select';
        s.selectedAssetType = null;
        s.objects = [];
        s.selectedObjectIds = [];
        s.activeObjectId = null;
      });
    },

    setMode: (mode) => {
      set((s) => {
        s.mode = mode;
        if (mode === 'select') {
          s.selectedAssetType = null;
        }
      });
    },

    selectAsset: (assetType) => {
      set((s) => {
        s.mode = 'place';
        s.selectedAssetType = assetType;
        s.selectedObjectIds = [];
        s.activeObjectId = null;
      });
    },

    addObject: (object) => {
      set((s) => {
        s.objects.push(object);
        s.selectedObjectIds = [object.id];
        s.activeObjectId = object.id;
        s.mode = 'select';
        s.selectedAssetType = null;
      });
    },

    removeObject: (id) => {
      set((s) => {
        s.objects = s.objects.filter((o) => o.id !== id);
        s.selectedObjectIds = s.selectedObjectIds.filter((selId) => selId !== id);
        if (s.activeObjectId === id) {
          s.activeObjectId = s.selectedObjectIds.at(-1) ?? null;
        }
      });
    },

    removeObjects: (ids) => {
      set((s) => {
        const toRemove = new Set(ids);
        s.objects = s.objects.filter((o) => !toRemove.has(o.id));

        s.selectedObjectIds = s.selectedObjectIds.filter((selId) => !toRemove.has(selId));
        if (s.activeObjectId && toRemove.has(s.activeObjectId)) {
          s.activeObjectId = s.selectedObjectIds.at(-1) ?? null;
        }
      });
    },

    setObjects: (objects) => {
      set((s) => {
        s.objects = objects;
        s.mode = 'select';
        s.selectedAssetType = null;
        s.selectedObjectIds = [];
        s.activeObjectId = null;
      });
    },

    selectObject: (id, opts) => {
      set((s) => {
        if (!id) {
          s.selectedObjectIds = [];
          s.activeObjectId = null;
          return;
        }

        if (opts?.additive) {
          const exists = s.selectedObjectIds.includes(id);
          if (exists) {
            s.selectedObjectIds = s.selectedObjectIds.filter((selId) => selId !== id);
            if (s.activeObjectId === id) {
              s.activeObjectId = s.selectedObjectIds.at(-1) ?? null;
            }
          } else {
            s.selectedObjectIds.push(id);
            s.activeObjectId = id;
          }
          return;
        }

        s.selectedObjectIds = [id];
        s.activeObjectId = id;
      });
    },

    clearSelection: () => {
      set((s) => {
        s.selectedObjectIds = [];
        s.activeObjectId = null;
      });
    },

    updateObject: (id, patch) => {
      set((s) => {
        const obj = s.objects.find((o) => o.id === id);
        if (!obj) return;
        if (patch.position) obj.position = patch.position;
        if (patch.rotation) obj.rotation = patch.rotation;
        if (patch.scale) obj.scale = patch.scale;
      });
    },
  }))
);
