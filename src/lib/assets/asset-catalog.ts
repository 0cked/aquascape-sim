import type { AssetDefinition } from '@/types/scene';

export const ASSET_CATALOG: readonly AssetDefinition[] = [
  {
    type: 'rock_small',
    name: 'Small Rock',
    category: 'rocks',
    shape: 'box',
    defaultSize: [0.6, 0.4, 0.6],
    color: '#6b7280',
  },
  {
    type: 'rock_large',
    name: 'Large Rock',
    category: 'rocks',
    shape: 'box',
    defaultSize: [0.9, 0.6, 0.75],
    color: '#4b5563',
  },
  {
    type: 'driftwood',
    name: 'Driftwood',
    category: 'wood',
    shape: 'cylinder',
    defaultSize: [0.4, 1.2, 0.4],
    color: '#8b5e34',
  },
  {
    type: 'java_fern',
    name: 'Java Fern',
    category: 'plants',
    shape: 'cylinder',
    defaultSize: [0.25, 0.8, 0.25],
    color: '#22c55e',
  },
  {
    type: 'anubias',
    name: 'Anubias',
    category: 'plants',
    shape: 'sphere',
    defaultSize: [0.45, 0.45, 0.45],
    color: '#16a34a',
  },
  {
    type: 'filter_box',
    name: 'Filter',
    category: 'equipment',
    shape: 'box',
    defaultSize: [0.5, 0.7, 0.3],
    color: '#111827',
  },
  {
    type: 'heater',
    name: 'Heater',
    category: 'equipment',
    shape: 'cylinder',
    defaultSize: [0.18, 1.0, 0.18],
    color: '#111827',
  },
] as const;

export const ASSET_BY_TYPE: Readonly<Record<string, AssetDefinition>> = Object.fromEntries(
  ASSET_CATALOG.map((a) => [a.type, a])
) as Record<string, AssetDefinition>;

export function getAssetDefinition(assetType: string): AssetDefinition | undefined {
  return ASSET_BY_TYPE[assetType];
}

