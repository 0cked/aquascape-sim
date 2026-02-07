'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { useMemo } from 'react';
import { Color, NoToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';

import { AquariumTank } from '@/components/three/aquarium-tank';
import { Effects } from '@/components/three/effects';
import { Lighting } from '@/components/three/lighting';
import { PlacedAsset } from '@/components/three/placed-asset';
import { PlacementHandler } from '@/components/three/placement-handler';
import { Substrate } from '@/components/three/substrate';
import { Water } from '@/components/three/water';
import { getAssetDefinition } from '@/lib/assets/asset-catalog';
import { useEditorStore } from '@/lib/store/editor-store';

export function Scene() {
  const background = useMemo(() => new Color('#05070a'), []);
  const mode = useEditorStore((s) => s.mode);
  const objects = useEditorStore((s) => s.objects);
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId);
  const selectObject = useEditorStore((s) => s.selectObject);

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [9, 6.5, 9], fov: 42, near: 0.1, far: 200 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl, scene }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = PCFSoftShadowMap;
        // Post-processing owns tone mapping to avoid double application.
        gl.toneMapping = NoToneMapping;
        gl.outputColorSpace = SRGBColorSpace;

        scene.background = background;
      }}
    >
      <Lighting />

      {/* Stand / stage */}
      <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.2, 1.1, 4.6]} />
        <meshStandardMaterial color="#1b1f22" roughness={0.9} />
      </mesh>

      <Physics gravity={[0, -4.9, 0]} debug={false}>
        <AquariumTank />
        <Substrate />
        <PlacementHandler />

        {objects.map((obj) => {
          const asset = getAssetDefinition(obj.assetType);
          if (!asset) return null;

          return (
            <PlacedAsset
              key={obj.id}
              asset={asset}
              position={obj.position}
              rotation={obj.rotation}
              scale={obj.scale}
              selected={obj.id === selectedObjectId}
              onClick={(e) => {
                e.stopPropagation();
                if (mode === 'place') return;
                selectObject(obj.id);
              }}
            />
          );
        })}
      </Physics>
      <Water />

      <Effects />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={5.5}
        maxDistance={22}
        target={[0, 1.7, 0]}
        maxPolarAngle={Math.PI * 0.48}
      />
    </Canvas>
  );
}
