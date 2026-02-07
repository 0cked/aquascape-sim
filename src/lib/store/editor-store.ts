import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Draft } from 'immer';

import type { EditorMode, PlacedObject } from '@/types/scene';
import { newId } from '@/lib/utils/id';

export type TransformMode = 'translate' | 'rotate' | 'scale';

export type EditorCommand = {
  name: string;
  do: (state: Draft<EditorStore>) => void;
  undo: (state: Draft<EditorStore>) => void;
};

export type EditorStore = {
  mode: EditorMode;
  selectedAssetType: string | null;
  objects: PlacedObject[];
  selectedObjectIds: string[];
  activeObjectId: string | null;
  transformMode: TransformMode;
  isTransforming: boolean;
  dynamicObjectIds: Record<string, true>;
  undoStack: EditorCommand[];
  redoStack: EditorCommand[];
  historyLimit: number;

  reset: () => void;
  setMode: (mode: EditorMode) => void;
  selectAsset: (assetType: string) => void;
  setTransformMode: (mode: TransformMode) => void;
  setTransforming: (value: boolean) => void;
  setObjectDynamic: (id: string, dynamic: boolean) => void;
  executeCommand: (command: EditorCommand) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  addObject: (object: PlacedObject) => void;
  removeObject: (id: string) => void;
  removeObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => void;
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
    transformMode: 'translate',
    isTransforming: false,
    dynamicObjectIds: {},
    undoStack: [],
    redoStack: [],
    historyLimit: 100,

    reset: () => {
      set((s) => {
        s.mode = 'select';
        s.selectedAssetType = null;
        s.objects = [];
        s.selectedObjectIds = [];
        s.activeObjectId = null;
        s.transformMode = 'translate';
        s.isTransforming = false;
        s.dynamicObjectIds = {};
        s.undoStack = [];
        s.redoStack = [];
      });
    },

    setMode: (mode) => {
      set((s) => {
        s.mode = mode;
        s.isTransforming = false;
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
        s.isTransforming = false;
      });
    },

    setTransformMode: (mode) => {
      set((s) => {
        s.transformMode = mode;
      });
    },

    setTransforming: (value) => {
      set((s) => {
        s.isTransforming = value;
      });
    },

    setObjectDynamic: (id, dynamic) => {
      set((s) => {
        if (dynamic) {
          s.dynamicObjectIds[id] = true;
        } else {
          delete s.dynamicObjectIds[id];
        }
      });
    },

    executeCommand: (command) => {
      set((s) => {
        command.do(s);
        s.undoStack.push(command);
        s.redoStack = [];
        if (s.undoStack.length > s.historyLimit) {
          s.undoStack.shift();
        }
      });
    },

    undo: () => {
      set((s) => {
        const cmd = s.undoStack.pop();
        if (!cmd) return;
        cmd.undo(s);
        s.redoStack.push(cmd);
      });
    },

    redo: () => {
      set((s) => {
        const cmd = s.redoStack.pop();
        if (!cmd) return;
        cmd.do(s);
        s.undoStack.push(cmd);
      });
    },

    clearHistory: () => {
      set((s) => {
        s.undoStack = [];
        s.redoStack = [];
      });
    },

    addObject: (object) => {
      set((s) => {
        s.objects.push(object);
        s.selectedObjectIds = [object.id];
        s.activeObjectId = object.id;
        s.mode = 'select';
        s.selectedAssetType = null;
        s.isTransforming = false;
        s.dynamicObjectIds[object.id] = true;
      });
    },

    removeObject: (id) => {
      set((s) => {
        s.objects = s.objects.filter((o) => o.id !== id);
        s.selectedObjectIds = s.selectedObjectIds.filter((selId) => selId !== id);
        if (s.activeObjectId === id) {
          s.activeObjectId = s.selectedObjectIds.at(-1) ?? null;
        }
        delete s.dynamicObjectIds[id];
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

        ids.forEach((id) => {
          delete s.dynamicObjectIds[id];
        });
      });
    },

    duplicateObjects: (ids) => {
      set((s) => {
        const toDuplicate = new Set(ids);
        const copies: PlacedObject[] = [];

        for (const obj of s.objects) {
          if (!toDuplicate.has(obj.id)) continue;

          const id = newId();
          copies.push({
            ...obj,
            id,
            position: [obj.position[0] + 0.25, obj.position[1], obj.position[2] + 0.25],
          });
          s.dynamicObjectIds[id] = true;
        }

        if (copies.length === 0) return;
        s.objects.push(...copies);

        s.selectedObjectIds = copies.map((o) => o.id);
        s.activeObjectId = copies.at(-1)?.id ?? null;
        s.mode = 'select';
        s.selectedAssetType = null;
      });
    },

    setObjects: (objects) => {
      set((s) => {
        s.objects = objects;
        s.mode = 'select';
        s.selectedAssetType = null;
        s.selectedObjectIds = [];
        s.activeObjectId = null;
        s.dynamicObjectIds = {};
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
