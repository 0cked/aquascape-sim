import { describe, expect, it } from 'vitest';

import { deserializeScene, serializeScene } from '@/lib/store/serialization';
import type { PlacedObject } from '@/types/scene';

describe('serialization', () => {
  it('round-trips objects through serialize/deserialize', () => {
    const objects: PlacedObject[] = [
      {
        id: 'a',
        assetType: 'rock_small',
        position: [1, 2, 3],
        rotation: [0, 0.5, 0],
        scale: [1, 1, 1],
      },
      {
        id: 'b',
        assetType: 'anubias',
        position: [-1, 0.2, 0],
        rotation: [0, 0, 0],
        scale: [0.8, 0.8, 0.8],
      },
    ];

    const data = serializeScene(objects);
    const parsed = deserializeScene(data);
    expect(parsed).toEqual(objects);
  });

  it('returns empty array on invalid JSON', () => {
    expect(deserializeScene('not json')).toEqual([]);
  });
});

