import { useMemo } from 'react';
import { Color, MeshPhysicalMaterial } from 'three';

import { TANK } from '@/components/three/tank-constants';

export function AquariumTank() {
  const glassMaterial = useMemo(() => {
    const m = new MeshPhysicalMaterial({
      color: new Color('#d8fff0'),
      roughness: 0.08,
      metalness: 0,
      transmission: 0.96,
      thickness: 0.6,
      ior: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      attenuationColor: new Color('#9cffc8'),
      attenuationDistance: 0.8,
    });
    return m;
  }, []);

  const w = TANK.width;
  const d = TANK.depth;
  const h = TANK.height;
  const t = TANK.glass;

  return (
    <group>
      {/* Bottom */}
      <mesh
        position={[0, t / 2, 0]}
        castShadow={false}
        receiveShadow
        material={glassMaterial}
      >
        <boxGeometry args={[w, t, d]} />
      </mesh>

      {/* Front */}
      <mesh
        position={[0, h / 2, d / 2 - t / 2]}
        castShadow={false}
        receiveShadow
        material={glassMaterial}
      >
        <boxGeometry args={[w, h, t]} />
      </mesh>

      {/* Back */}
      <mesh
        position={[0, h / 2, -d / 2 + t / 2]}
        castShadow={false}
        receiveShadow
        material={glassMaterial}
      >
        <boxGeometry args={[w, h, t]} />
      </mesh>

      {/* Left */}
      <mesh
        position={[-w / 2 + t / 2, h / 2, 0]}
        castShadow={false}
        receiveShadow
        material={glassMaterial}
      >
        <boxGeometry args={[t, h, d]} />
      </mesh>

      {/* Right */}
      <mesh
        position={[w / 2 - t / 2, h / 2, 0]}
        castShadow={false}
        receiveShadow
        material={glassMaterial}
      >
        <boxGeometry args={[t, h, d]} />
      </mesh>
    </group>
  );
}

