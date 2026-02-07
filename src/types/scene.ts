export type Vec3 = [number, number, number];

export type EditorMode = 'select' | 'place';

export type PlaceableShape = 'box' | 'sphere' | 'cylinder';

export type AssetCategory = 'rocks' | 'wood' | 'plants' | 'equipment';

export type AssetDefinition = {
  type: string;
  name: string;
  category: AssetCategory;
  modelUrl: string;
  thumbnailUrl: string;
  shape: PlaceableShape;
  defaultSize: Vec3;
  color: string;
};

export type PlacedObject = {
  id: string;
  assetType: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
};
