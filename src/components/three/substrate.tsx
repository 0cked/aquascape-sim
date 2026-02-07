import { Suspense, useEffect } from 'react';
import { Mesh } from 'three';

import { CuboidCollider, RigidBody } from '@react-three/rapier';

import { ThreeErrorBoundary } from '@/components/three/three-error-boundary';
import { TANK, TANK_INNER } from '@/components/three/tank-constants';
import { useAquascapeGLTF } from '@/lib/assets/use-aquascape-gltf';

function SubstrateModel() {
  const gltf = useAquascapeGLTF('/models/substrate.glb');

  useEffect(() => {
    gltf.scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.receiveShadow = true;
      }
    });
  }, [gltf]);

  const scale: [number, number, number] = [TANK_INNER.width - 0.1, 1, TANK_INNER.depth - 0.1];

  return (
    <group scale={scale}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function SubstrateFallback() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[TANK_INNER.width - 0.1, TANK_INNER.depth - 0.1, 1, 1]} />
      <meshStandardMaterial color="#3b2f25" roughness={1} metalness={0} />
    </mesh>
  );
}

export function Substrate() {
  const thickness = 0.2;

  return (
    <RigidBody type="fixed" colliders={false} position={[0, TANK.glass + 0.1, 0]}>
      <CuboidCollider
        args={[(TANK_INNER.width - 0.1) / 2, thickness / 2, (TANK_INNER.depth - 0.1) / 2]}
        position={[0, -thickness / 2, 0]}
        friction={1.2}
      />
      <Suspense fallback={<SubstrateFallback />}>
        <ThreeErrorBoundary label="substrate" fallback={<SubstrateFallback />}>
          <SubstrateModel />
        </ThreeErrorBoundary>
      </Suspense>
    </RigidBody>
  );
}
