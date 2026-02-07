import { BallCollider, CylinderCollider, CuboidCollider, RigidBody } from '@react-three/rapier';
import type { ThreeEvent } from '@react-three/fiber';
import { Suspense, useEffect, useMemo } from 'react';
import { Mesh } from 'three';

import { ThreeErrorBoundary } from '@/components/three/three-error-boundary';
import { useAquascapeGLTF } from '@/lib/assets/use-aquascape-gltf';
import type { AssetDefinition, PlaceableShape, Vec3 } from '@/types/scene';

type PlacedAssetProps = {
  asset: AssetDefinition;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  selected?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
};

function ShapeGeometry({ shape, size }: { shape: PlaceableShape; size: Vec3 }) {
  const [sx, sy, sz] = size;
  switch (shape) {
    case 'sphere': {
      const r = sx / 2;
      return <sphereGeometry args={[r, 24, 24]} />;
    }
    case 'cylinder': {
      const r = sx / 2;
      const h = sy;
      return <cylinderGeometry args={[r, r, h, 28]} />;
    }
    case 'box':
    default:
      return <boxGeometry args={[sx, sy, sz]} />;
  }
}

function ShapeCollider({ shape, size }: { shape: PlaceableShape; size: Vec3 }) {
  const [sx, sy, sz] = size;
  switch (shape) {
    case 'sphere':
      return <BallCollider args={[sx / 2]} />;
    case 'cylinder':
      return <CylinderCollider args={[sy / 2, sx / 2]} />;
    case 'box':
    default:
      return <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} />;
  }
}

function AssetModel({ url, scale }: { url: string; scale: Vec3 }) {
  const gltf = useAquascapeGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <group scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

function AssetFallback({
  shape,
  size,
  color,
  selected = false,
}: {
  shape: PlaceableShape;
  size: Vec3;
  color: string;
  selected?: boolean;
}) {
  return (
    <mesh castShadow receiveShadow>
      <ShapeGeometry shape={shape} size={size} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? '#ffffff' : '#000000'}
        emissiveIntensity={selected ? 0.18 : 0}
        roughness={0.95}
        metalness={0.02}
      />
    </mesh>
  );
}

function AssetErrorFallback({ shape, size }: { shape: PlaceableShape; size: Vec3 }) {
  return (
    <mesh castShadow receiveShadow>
      <ShapeGeometry shape={shape} size={size} />
      <meshStandardMaterial
        color="#ef4444"
        emissive="#ef4444"
        emissiveIntensity={0.25}
        roughness={0.9}
        metalness={0}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

export function PlacedAsset({
  asset,
  position,
  rotation,
  scale,
  selected = false,
  onClick,
}: PlacedAssetProps) {
  const size: Vec3 = [
    asset.defaultSize[0] * scale[0],
    asset.defaultSize[1] * scale[1],
    asset.defaultSize[2] * scale[2],
  ];

  return (
    <RigidBody
      type="dynamic"
      position={position}
      rotation={rotation}
      colliders={false}
      linearDamping={0.75}
      angularDamping={0.8}
    >
      <ShapeCollider shape={asset.shape} size={size} />
      <group onClick={onClick}>
        {/* Invisible hit target so objects are selectable even before the glTF finishes loading. */}
        <mesh>
          <ShapeGeometry shape={asset.shape} size={size} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {selected ? (
          <mesh scale={[1.03, 1.03, 1.03]}>
            <ShapeGeometry shape={asset.shape} size={size} />
            <meshBasicMaterial color="#e5e7eb" wireframe transparent opacity={0.35} />
          </mesh>
        ) : null}

        <Suspense
          fallback={
            <AssetFallback shape={asset.shape} size={size} color={asset.color} selected={selected} />
          }
        >
          <ThreeErrorBoundary
            label={asset.type}
            fallback={<AssetErrorFallback shape={asset.shape} size={size} />}
          >
            <AssetModel url={asset.modelUrl} scale={scale} />
          </ThreeErrorBoundary>
        </Suspense>
      </group>
    </RigidBody>
  );
}
