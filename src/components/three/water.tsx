import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, MeshPhysicalMaterial, PlaneGeometry } from 'three';

import { TANK, TANK_INNER } from '@/components/three/tank-constants';

export function Water() {
  const { geometry, basePositions } = useMemo(() => {
    const g = new PlaneGeometry(TANK_INNER.width - 0.08, TANK_INNER.depth - 0.08, 64, 64);
    const positions = g.attributes.position.array as Float32Array;
    return { geometry: g, basePositions: positions.slice() };
  }, []);

  const material = useMemo(() => {
    return new MeshPhysicalMaterial({
      color: new Color('#006994'),
      roughness: 0.06,
      metalness: 0,
      transmission: 0.8,
      thickness: 0.35,
      ior: 1.33,
      attenuationColor: new Color('#0b3d4f'),
      attenuationDistance: 2.2,
      transparent: true,
      opacity: 0.75,
    });
  }, []);

  const ref = useRef<PlaneGeometry>(geometry);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const g = ref.current;
    const pos = g.attributes.position;
    const arr = pos.array as Float32Array;

    // Update local Z, which becomes world Y after the mesh rotation.
    for (let i = 0; i < arr.length; i += 3) {
      const x = basePositions[i];
      const y = basePositions[i + 1];

      const wave1 = Math.sin(x * 1.35 + t * 0.65) * 0.018;
      const wave2 = Math.cos(y * 1.55 - t * 0.55) * 0.012;
      arr[i + 2] = wave1 + wave2;
    }

    pos.needsUpdate = true;
    g.computeVertexNormals();
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, TANK.height * 0.92, 0]}
      geometry={geometry}
      material={material}
      receiveShadow
    />
  );
}
