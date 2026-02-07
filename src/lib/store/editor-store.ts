import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { EditorMode, PlacedObject } from '@/types/scene';

export type EditorStore = {
  mode: EditorMode;
  selectedAssetType: string | null;
  objects: PlacedObject[];
  selectedObjectId: string | null;

  reset: () => void;
  setMode: (mode: EditorMode) => void;
  selectAsset: (assetType: string) => void;

  addObject: (object: PlacedObject) => void;
  removeObject: (id: string) => void;
  setObjects: (objects: PlacedObject[]) => void;

  selectObject: (id: string | null) => void;
  clearSelection: () => void;
  updateObject: (id: string, patch: Partial<Pick<PlacedObject, 'position' | 'rotation' | 'scale'>>) => void;
};

export const useEditorStore = create<EditorStore>()(
  immer((set) => ({
    mode: 'select',
    selectedAssetType: null,
    objects: [],
    selectedObjectId: null,

    reset: () => {
      set((s) => {
        s.mode = 'select';
        s.selectedAssetType = null;
        s.objects = [];
        s.selectedObjectId = null;
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
        s.selectedObjectId = null;
      });
    },

    addObject: (object) => {
      set((s) => {
        s.objects.push(object);
        s.selectedObjectId = object.id;
        s.mode = 'select';
        s.selectedAssetType = null;
      });
    },

    removeObject: (id) => {
      set((s) => {
        s.objects = s.objects.filter((o) => o.id !== id);
        if (s.selectedObjectId === id) {
          s.selectedObjectId = null;
        }
      });
    },

    setObjects: (objects) => {
      set((s) => {
        s.objects = objects;
        s.mode = 'select';
        s.selectedAssetType = null;
        s.selectedObjectId = null;
      });
    },

    selectObject: (id) => {
      set((s) => {
        s.selectedObjectId = id;
      });
    },

    clearSelection: () => {
      set((s) => {
        s.selectedObjectId = null;
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
