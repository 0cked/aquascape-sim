import type { PlacedObject } from '@/types/scene';

type SerializedSceneV1 = {
  version: 1;
  objects: PlacedObject[];
};

export function serializeScene(objects: PlacedObject[]): string {
  const payload: SerializedSceneV1 = { version: 1, objects };
  return JSON.stringify(payload);
}

function isVec3(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number' &&
    typeof value[2] === 'number'
  );
}

function isPlacedObject(value: unknown): value is PlacedObject {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.assetType === 'string' &&
    isVec3(v.position) &&
    isVec3(v.rotation) &&
    isVec3(v.scale)
  );
}

export function deserializeScene(data: string): PlacedObject[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data) as unknown;
  } catch {
    return [];
  }

  if (Array.isArray(parsed)) {
    return parsed.filter(isPlacedObject);
  }

  if (!parsed || typeof parsed !== 'object') return [];
  const obj = parsed as Record<string, unknown>;
  const objects = obj.objects;
  if (!Array.isArray(objects)) return [];
  return objects.filter(isPlacedObject);
}

