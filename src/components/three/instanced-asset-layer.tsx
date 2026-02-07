import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { DynamicDrawUsage, InstancedMesh, Matrix4, Mesh, Object3D } from 'three';

import { useAquascapeGLTF } from '@/lib/assets/use-aquascape-gltf';
import { getAssetDefinition } from '@/lib/assets/asset-catalog';
import { useInstancingStore } from '@/lib/store/instancing-store';
import type { PlacedObject } from '@/types/scene';

type InstancedAssetLayerProps = {
  objects: PlacedObject[];
};

type Grouped = {
  assetType: string;
  modelUrl: string;
  objects: PlacedObject[];
};

function findSingleMesh(root: Object3D): Mesh | null {
  let found: Mesh | null = null;
  let count = 0;
  root.traverse((obj) => {
    if (obj instanceof Mesh) {
      count += 1;
      if (count === 1) found = obj;
    }
  });
  if (count !== 1) return null;
  return found;
}

function InstancedAssetGroup({ assetType, modelUrl, objects }: Grouped) {
  const gltf = useAquascapeGLTF(modelUrl);
  const markReady = useInstancingStore((s) => s.markReady);

  const sourceMesh = useMemo(() => findSingleMesh(gltf.scene), [gltf.scene]);
  const meshRef = useRef<InstancedMesh>(null);
  const temp = useMemo(() => new Object3D(), []);
  const baseMatrix = useMemo(() => {
    if (!sourceMesh) return null;
    gltf.scene.updateWorldMatrix(true, true);
    const invRoot = new Matrix4().copy(gltf.scene.matrixWorld).invert();
    return invRoot.multiply(sourceMesh.matrixWorld.clone());
  }, [gltf.scene, sourceMesh]);

  useEffect(() => {
    if (!sourceMesh) return;
    markReady(assetType);
  }, [assetType, markReady, sourceMesh]);

  useLayoutEffect(() => {
    const instanced = meshRef.current;
    if (!instanced) return;
    if (!sourceMesh) return;

    // Ensure instance buffer uploads efficiently.
    instanced.instanceMatrix.setUsage(DynamicDrawUsage);

    for (let i = 0; i < objects.length; i += 1) {
      const obj = objects[i];
      temp.position.set(obj.position[0], obj.position[1], obj.position[2]);
      temp.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
      temp.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
      temp.updateMatrix();
      if (baseMatrix) temp.matrix.multiply(baseMatrix);
      instanced.setMatrixAt(i, temp.matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingBox();
    instanced.computeBoundingSphere();
  }, [baseMatrix, objects, sourceMesh, temp]);

  if (!sourceMesh) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[sourceMesh.geometry, sourceMesh.material, objects.length]}
      castShadow
      receiveShadow
    />
  );
}

export function InstancedAssetLayer({ objects }: InstancedAssetLayerProps) {
  const groups = useMemo(() => {
    const byType = new Map<string, Grouped>();
    for (const obj of objects) {
      const asset = getAssetDefinition(obj.assetType);
      if (!asset) continue;
      const existing = byType.get(obj.assetType);
      if (existing) {
        existing.objects.push(obj);
      } else {
        byType.set(obj.assetType, { assetType: obj.assetType, modelUrl: asset.modelUrl, objects: [obj] });
      }
    }
    return Array.from(byType.values());
  }, [objects]);

  return (
    <>
      {groups.map((g) => (
        <InstancedAssetGroup key={g.assetType} assetType={g.assetType} modelUrl={g.modelUrl} objects={g.objects} />
      ))}
    </>
  );
}
