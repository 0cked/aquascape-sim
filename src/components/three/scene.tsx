'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { useMemo } from 'react';
import { Color, NoToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';

import { AquariumTank } from '@/components/three/aquarium-tank';
import { Effects } from '@/components/three/effects';
import { Lighting } from '@/components/three/lighting';
import { PlaceableObject } from '@/components/three/placeable-object';
import { Substrate } from '@/components/three/substrate';
import { Water } from '@/components/three/water';

export function Scene() {
  const background = useMemo(() => new Color('#05070a'), []);

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

        {/* Temporary test objects; editor placement replaces these in Milestone 5. */}
        <PlaceableObject
          position={[-0.9, 3.2, 0.1]}
          shape="box"
          size={[0.7, 0.45, 0.7]}
          color="#6b7280"
        />
        <PlaceableObject
          position={[0.2, 3.5, -0.4]}
          shape="sphere"
          size={[0.55, 0.55, 0.55]}
          color="#4b5563"
        />
        <PlaceableObject
          position={[0.8, 3.0, 0.4]}
          shape="cylinder"
          size={[0.45, 0.85, 0.45]}
          color="#7c3aed"
        />
        <PlaceableObject
          position={[0.0, 3.7, 0.0]}
          shape="box"
          size={[0.85, 0.55, 0.5]}
          color="#9ca3af"
        />
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
