import type { ThreeEvent } from '@react-three/fiber';

import { getAssetDefinition } from '@/lib/assets/asset-catalog';
import { useEditorStore } from '@/lib/store/editor-store';
import { newId } from '@/lib/utils/id';
import { TANK, TANK_INNER } from '@/components/three/tank-constants';
import type { PlacedObject } from '@/types/scene';

export function PlacementHandler() {
  const mode = useEditorStore((s) => s.mode);
  const selectedAssetType = useEditorStore((s) => s.selectedAssetType);
  const addObject = useEditorStore((s) => s.addObject);
  const clearSelection = useEditorStore((s) => s.clearSelection);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    if (mode !== 'place' || !selectedAssetType) {
      clearSelection();
      return;
    }

    const asset = getAssetDefinition(selectedAssetType);
    if (!asset) return;

    const size = asset.defaultSize;
    const halfHeight =
      asset.shape === 'sphere' ? size[0] / 2 : asset.shape === 'cylinder' ? size[1] / 2 : size[1] / 2;

    const obj: PlacedObject = {
      id: newId(),
      assetType: asset.type,
      position: [e.point.x, e.point.y + halfHeight + 0.02, e.point.z],
      rotation: [0, Math.random() * Math.PI * 2, 0],
      scale: [1, 1, 1],
    };

    addObject(obj);
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, TANK.glass + 0.101, 0]}
      onClick={handleClick}
    >
      <planeGeometry args={[TANK_INNER.width - 0.1, TANK_INNER.depth - 0.1, 1, 1]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

