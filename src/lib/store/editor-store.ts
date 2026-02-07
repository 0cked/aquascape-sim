import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Draft } from 'immer';

import type { EditorMode, PlacedObject } from '@/types/scene';
import { newId } from '@/lib/utils/id';

export type TransformMode = 'translate' | 'rotate' | 'scale';
export type TransformSnapshot = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};

export type EditorCommand = {
  name: string;
  do: (state: Draft<EditorStore>) => void;
  undo: (state: Draft<EditorStore>) => void;
};

function sameVec3(a: [number, number, number], b: [number, number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

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
  commitTransform: (id: string, before: TransformSnapshot, after: TransformSnapshot, label?: string) => void;
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
  immer((set, get) => ({
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

    commitTransform: (id, before, after, label = 'transform') => {
      const beforeSnap: TransformSnapshot = {
        position: [...before.position] as [number, number, number],
        rotation: [...before.rotation] as [number, number, number],
        scale: [...before.scale] as [number, number, number],
      };
      const afterSnap: TransformSnapshot = {
        position: [...after.position] as [number, number, number],
        rotation: [...after.rotation] as [number, number, number],
        scale: [...after.scale] as [number, number, number],
      };

      if (
        sameVec3(beforeSnap.position, afterSnap.position) &&
        sameVec3(beforeSnap.rotation, afterSnap.rotation) &&
        sameVec3(beforeSnap.scale, afterSnap.scale)
      ) {
        return;
      }

      const wasDynamic = get().dynamicObjectIds[id] === true;

      const cmd: EditorCommand = {
        name: `${label}:${id}`,
        do: (s) => {
          const obj = s.objects.find((o) => o.id === id);
          if (!obj) return;
          obj.position = afterSnap.position;
          obj.rotation = afterSnap.rotation;
          obj.scale = afterSnap.scale;
          delete s.dynamicObjectIds[id];
          s.isTransforming = false;
        },
        undo: (s) => {
          const obj = s.objects.find((o) => o.id === id);
          if (!obj) return;
          obj.position = beforeSnap.position;
          obj.rotation = beforeSnap.rotation;
          obj.scale = beforeSnap.scale;
          if (wasDynamic) s.dynamicObjectIds[id] = true;
          else delete s.dynamicObjectIds[id];
          s.isTransforming = false;
        },
      };

      get().executeCommand(cmd);
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
      let prevSelection: string[] = [];
      let prevActive: string | null = null;
      let prevMode: EditorMode = 'select';
      let prevSelectedAssetType: string | null = null;

      const cmd: EditorCommand = {
        name: `place:${object.assetType}`,
        do: (s) => {
          prevSelection = [...s.selectedObjectIds];
          prevActive = s.activeObjectId;
          prevMode = s.mode;
          prevSelectedAssetType = s.selectedAssetType;

          s.objects.push(object);
          s.selectedObjectIds = [object.id];
          s.activeObjectId = object.id;
          s.mode = 'select';
          s.selectedAssetType = null;
          s.isTransforming = false;
          s.dynamicObjectIds[object.id] = true;
        },
        undo: (s) => {
          s.objects = s.objects.filter((o) => o.id !== object.id);
          s.selectedObjectIds = prevSelection;
          s.activeObjectId = prevActive;
          s.mode = prevMode;
          s.selectedAssetType = prevSelectedAssetType;
          s.isTransforming = false;
          delete s.dynamicObjectIds[object.id];
        },
      };

      get().executeCommand(cmd);
    },

    removeObject: (id) => {
      get().removeObjects([id]);
    },

    removeObjects: (ids) => {
      const toRemove = Array.from(new Set(ids));
      if (toRemove.length === 0) return;

      let prevSelection: string[] = [];
      let prevActive: string | null = null;
      let removed: Array<{ index: number; object: PlacedObject; wasDynamic: boolean }> = [];

      const cmd: EditorCommand = {
        name: `delete:${toRemove.length}`,
        do: (s) => {
          prevSelection = [...s.selectedObjectIds];
          prevActive = s.activeObjectId;

          const removeSet = new Set(toRemove);
          removed = [];
          for (let i = 0; i < s.objects.length; i += 1) {
            const obj = s.objects[i];
            if (!obj) continue;
            if (!removeSet.has(obj.id)) continue;
            removed.push({ index: i, object: obj, wasDynamic: s.dynamicObjectIds[obj.id] === true });
          }

          s.objects = s.objects.filter((o) => !removeSet.has(o.id));
          s.selectedObjectIds = s.selectedObjectIds.filter((selId) => !removeSet.has(selId));
          if (s.activeObjectId && removeSet.has(s.activeObjectId)) {
            s.activeObjectId = s.selectedObjectIds.at(-1) ?? null;
          }
          toRemove.forEach((id) => {
            delete s.dynamicObjectIds[id];
          });
          s.isTransforming = false;
        },
        undo: (s) => {
          const sorted = [...removed].sort((a, b) => a.index - b.index);
          for (const entry of sorted) {
            s.objects.splice(entry.index, 0, entry.object);
            if (entry.wasDynamic) {
              s.dynamicObjectIds[entry.object.id] = true;
            }
          }
          s.selectedObjectIds = prevSelection;
          s.activeObjectId = prevActive;
          s.isTransforming = false;
        },
      };

      get().executeCommand(cmd);
    },

    duplicateObjects: (ids) => {
      const state = get();
      const toDuplicate = new Set(ids);
      const copies: PlacedObject[] = [];

      for (const obj of state.objects) {
        if (!toDuplicate.has(obj.id)) continue;
        copies.push({
          ...obj,
          id: newId(),
          position: [obj.position[0] + 0.25, obj.position[1], obj.position[2] + 0.25],
        });
      }

      if (copies.length === 0) return;

      let prevSelection: string[] = [];
      let prevActive: string | null = null;
      let prevMode: EditorMode = 'select';
      let prevSelectedAssetType: string | null = null;

      const cmd: EditorCommand = {
        name: `duplicate:${copies.length}`,
        do: (s) => {
          prevSelection = [...s.selectedObjectIds];
          prevActive = s.activeObjectId;
          prevMode = s.mode;
          prevSelectedAssetType = s.selectedAssetType;

          s.objects.push(...copies);
          for (const obj of copies) {
            s.dynamicObjectIds[obj.id] = true;
          }

          s.selectedObjectIds = copies.map((o) => o.id);
          s.activeObjectId = copies.at(-1)?.id ?? null;
          s.mode = 'select';
          s.selectedAssetType = null;
          s.isTransforming = false;
        },
        undo: (s) => {
          const copySet = new Set(copies.map((o) => o.id));
          s.objects = s.objects.filter((o) => !copySet.has(o.id));
          for (const obj of copies) {
            delete s.dynamicObjectIds[obj.id];
          }
          s.selectedObjectIds = prevSelection;
          s.activeObjectId = prevActive;
          s.mode = prevMode;
          s.selectedAssetType = prevSelectedAssetType;
          s.isTransforming = false;
        },
      };

      get().executeCommand(cmd);
    },

    setObjects: (objects) => {
      set((s) => {
        s.objects = objects;
        s.mode = 'select';
        s.selectedAssetType = null;
        s.selectedObjectIds = [];
        s.activeObjectId = null;
        s.isTransforming = false;
        s.dynamicObjectIds = {};
        s.undoStack = [];
        s.redoStack = [];
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
