import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Color, MeshPhysicalMaterial, PlaneGeometry } from 'three';

import { TANK, TANK_INNER } from '@/components/three/tank-constants';
import type { QualityPreset } from '@/lib/store/quality-store';

export type WaterProps = {
  quality: QualityPreset;
};

function segmentsForQuality(quality: QualityPreset): number {
  switch (quality) {
    case 'low':
      return 24;
    case 'medium':
      return 42;
    case 'high':
    default:
      return 64;
  }
}

function normalRecomputeStride(quality: QualityPreset): number {
  switch (quality) {
    case 'low':
      return 4;
    case 'medium':
      return 2;
    case 'high':
    default:
      return 1;
  }
}

export function Water({ quality }: WaterProps) {
  const { geometry, basePositions } = useMemo(() => {
    const seg = segmentsForQuality(quality);
    const g = new PlaneGeometry(TANK_INNER.width - 0.08, TANK_INNER.depth - 0.08, seg, seg);
    const positions = g.attributes.position.array as Float32Array;
    return { geometry: g, basePositions: positions.slice() };
  }, [quality]);

  const material = useMemo(() => {
    return new MeshPhysicalMaterial({
      color: new Color('#0a5e7a'),
      roughness: 0.045,
      metalness: 0,
      transmission: 0.9,
      thickness: 0.65,
      ior: 1.33,
      attenuationColor: new Color('#0a2a33'),
      attenuationDistance: 1.65,
      clearcoat: 0.6,
      clearcoatRoughness: 0.035,
      specularIntensity: 0.85,
      specularColor: new Color('#bfefff'),
      transparent: true,
      opacity: 0.62,
    });
  }, []);

  const ref = useRef<PlaneGeometry>(geometry);
  useEffect(() => {
    ref.current = geometry;
  }, [geometry]);
  const normalStride = useMemo(() => normalRecomputeStride(quality), [quality]);
  const frameRef = useRef<number>(0);

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
    frameRef.current += 1;
    if (frameRef.current % normalStride === 0) {
      g.computeVertexNormals();
    }
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
