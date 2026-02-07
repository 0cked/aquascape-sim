import { describe, expect, it, beforeEach } from 'vitest';

import { useEditorStore } from '@/lib/store/editor-store';
import type { PlacedObject } from '@/types/scene';

describe('editor-store', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('enters placement mode when selecting an asset', () => {
    useEditorStore.getState().selectAsset('rock_small');
    const s = useEditorStore.getState();
    expect(s.mode).toBe('place');
    expect(s.selectedAssetType).toBe('rock_small');
  });

  it('adds an object and returns to select mode', () => {
    useEditorStore.getState().selectAsset('rock_small');

    const obj: PlacedObject = {
      id: 'obj_1',
      assetType: 'rock_small',
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };

    useEditorStore.getState().addObject(obj);
    const s = useEditorStore.getState();

    expect(s.objects).toHaveLength(1);
    expect(s.objects[0]?.id).toBe('obj_1');
    expect(s.mode).toBe('select');
    expect(s.selectedAssetType).toBeNull();
    expect(s.selectedObjectIds).toEqual(['obj_1']);
    expect(s.activeObjectId).toBe('obj_1');
  });

  it('removes an object and clears selection if needed', () => {
    useEditorStore.getState().addObject({
      id: 'obj_1',
      assetType: 'rock_small',
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });

    useEditorStore.getState().removeObject('obj_1');
    const s = useEditorStore.getState();
    expect(s.objects).toHaveLength(0);
    expect(s.selectedObjectIds).toEqual([]);
    expect(s.activeObjectId).toBeNull();
  });

  it('duplicates the selection and selects the duplicates', () => {
    useEditorStore.getState().addObject({
      id: 'obj_1',
      assetType: 'rock_small',
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });
    useEditorStore.getState().addObject({
      id: 'obj_2',
      assetType: 'rock_small',
      position: [1, 1, 1],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });

    useEditorStore.getState().selectObject('obj_1');
    useEditorStore.getState().selectObject('obj_2', { additive: true });

    const before = useEditorStore.getState();
    const beforeIds = new Set(before.objects.map((o) => o.id));
    expect(before.selectedObjectIds).toEqual(['obj_1', 'obj_2']);

    useEditorStore.getState().duplicateObjects(before.selectedObjectIds);
    const after = useEditorStore.getState();

    expect(after.objects).toHaveLength(4);
    expect(new Set(after.objects.map((o) => o.id)).size).toBe(4);

    expect(after.selectedObjectIds).toHaveLength(2);
    expect(after.activeObjectId).toBe(after.selectedObjectIds[1]);

    for (const id of after.selectedObjectIds) {
      expect(beforeIds.has(id)).toBe(false);
      expect(after.dynamicObjectIds[id]).toBe(true);
    }
  });
});
