import { beforeEach, describe, expect, it } from 'vitest';

import { useEditorStore } from '@/lib/store/editor-store';
import type { PlacedObject } from '@/types/scene';

function makeObject(id: string, x: number): PlacedObject {
  return {
    id,
    assetType: 'rock_small',
    position: [x, 1, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  };
}

describe('undo/redo', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('undoes and redoes a place/transform/delete sequence without drift', () => {
    const s0 = useEditorStore.getState();

    s0.addObject(makeObject('obj_1', 0));
    s0.addObject(makeObject('obj_2', 1));
    s0.addObject(makeObject('obj_3', 2));

    // Transform obj_2 (simulate: live update, then commit).
    const before = useEditorStore.getState().objects.find((o) => o.id === 'obj_2');
    expect(before).toBeTruthy();
    const beforeSnap = {
      position: [...(before?.position ?? [0, 0, 0])] as [number, number, number],
      rotation: [...(before?.rotation ?? [0, 0, 0])] as [number, number, number],
      scale: [...(before?.scale ?? [1, 1, 1])] as [number, number, number],
    };

    useEditorStore.getState().updateObject('obj_2', { position: [3, 1.5, -0.5] });
    const afterObj = useEditorStore.getState().objects.find((o) => o.id === 'obj_2');
    expect(afterObj?.position).toEqual([3, 1.5, -0.5]);

    useEditorStore.getState().commitTransform(
      'obj_2',
      beforeSnap,
      {
        position: [...(afterObj?.position ?? [0, 0, 0])] as [number, number, number],
        rotation: [...(afterObj?.rotation ?? [0, 0, 0])] as [number, number, number],
        scale: [...(afterObj?.scale ?? [1, 1, 1])] as [number, number, number],
      },
      'test'
    );

    // Delete obj_1.
    useEditorStore.getState().removeObjects(['obj_1']);

    const end = useEditorStore.getState();
    expect(end.objects.map((o) => o.id).sort()).toEqual(['obj_2', 'obj_3']);
    expect(end.objects.find((o) => o.id === 'obj_2')?.position).toEqual([3, 1.5, -0.5]);

    // Undo delete.
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().objects).toHaveLength(3);
    expect(useEditorStore.getState().objects.some((o) => o.id === 'obj_1')).toBe(true);

    // Undo transform.
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().objects.find((o) => o.id === 'obj_2')?.position).toEqual(
      beforeSnap.position
    );

    // Undo 3 placements (back to empty).
    useEditorStore.getState().undo();
    useEditorStore.getState().undo();
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().objects).toHaveLength(0);

    // Redo 3 placements, transform, delete.
    useEditorStore.getState().redo();
    useEditorStore.getState().redo();
    useEditorStore.getState().redo();
    useEditorStore.getState().redo();
    useEditorStore.getState().redo();

    const final = useEditorStore.getState();
    expect(final.objects.map((o) => o.id).sort()).toEqual(['obj_2', 'obj_3']);
    expect(final.objects.find((o) => o.id === 'obj_2')?.position).toEqual([3, 1.5, -0.5]);
  });
});

