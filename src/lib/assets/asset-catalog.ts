import type { AssetDefinition } from '@/types/scene';

export const ASSET_CATALOG: readonly AssetDefinition[] = [
  {
    type: 'rock_small',
    name: 'Small Rock',
    category: 'rocks',
    modelUrl: '/models/rock_small.glb',
    thumbnailUrl: '/thumbnails/rock_small.svg',
    shape: 'box',
    defaultSize: [1.1, 1.05, 1.1],
    color: '#6b7280',
  },
  {
    type: 'rock_large',
    name: 'Large Rock',
    category: 'rocks',
    modelUrl: '/models/rock_large.glb',
    thumbnailUrl: '/thumbnails/rock_large.svg',
    shape: 'box',
    defaultSize: [1.15, 1.13, 1.15],
    color: '#4b5563',
  },
  {
    type: 'driftwood',
    name: 'Driftwood',
    category: 'wood',
    modelUrl: '/models/driftwood.glb',
    thumbnailUrl: '/thumbnails/driftwood.svg',
    shape: 'cylinder',
    defaultSize: [0.5, 1.05, 0.5],
    color: '#8b5e34',
  },
  {
    type: 'java_fern',
    name: 'Java Fern',
    category: 'plants',
    modelUrl: '/models/java_fern.glb',
    thumbnailUrl: '/thumbnails/java_fern.svg',
    shape: 'cylinder',
    defaultSize: [0.4, 1.02, 0.4],
    color: '#22c55e',
  },
  {
    type: 'anubias',
    name: 'Anubias',
    category: 'plants',
    modelUrl: '/models/anubias.glb',
    thumbnailUrl: '/thumbnails/anubias.svg',
    shape: 'sphere',
    defaultSize: [1.0, 1.0, 1.0],
    color: '#16a34a',
  },
  {
    type: 'filter_box',
    name: 'Filter',
    category: 'equipment',
    modelUrl: '/models/filter_box.glb',
    thumbnailUrl: '/thumbnails/filter_box.svg',
    shape: 'box',
    defaultSize: [1.0, 1.0, 0.6],
    color: '#111827',
  },
  {
    type: 'heater',
    name: 'Heater',
    category: 'equipment',
    modelUrl: '/models/heater.glb',
    thumbnailUrl: '/thumbnails/heater.svg',
    shape: 'cylinder',
    defaultSize: [0.32, 1.0, 0.32],
    color: '#111827',
  },
] as const;

export const ASSET_BY_TYPE: Readonly<Record<string, AssetDefinition>> = Object.fromEntries(
  ASSET_CATALOG.map((a) => [a.type, a])
) as Record<string, AssetDefinition>;

export function getAssetDefinition(assetType: string): AssetDefinition | undefined {
  return ASSET_BY_TYPE[assetType];
}
