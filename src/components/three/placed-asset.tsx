import type { RapierRigidBody } from '@react-three/rapier';
import { BallCollider, CylinderCollider, CuboidCollider, RigidBody } from '@react-three/rapier';
import type { ThreeEvent } from '@react-three/fiber';
import { Clone } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import { Euler, Quaternion } from 'three';

import { ThreeErrorBoundary } from '@/components/three/three-error-boundary';
import { useAquascapeGLTF } from '@/lib/assets/use-aquascape-gltf';
import { useEditorStore } from '@/lib/store/editor-store';
import { useInstancingStore } from '@/lib/store/instancing-store';
import type { AssetDefinition, PlaceableShape, Vec3 } from '@/types/scene';

type PlacedAssetProps = {
  id: string;
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

  return (
    <group scale={scale}>
      <Clone object={gltf.scene} castShadow receiveShadow />
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
  id,
  asset,
  position,
  rotation,
  scale,
  selected = false,
  onClick,
}: PlacedAssetProps) {
  const activeObjectId = useEditorStore((s) => s.activeObjectId);
  const isTransforming = useEditorStore((s) => s.isTransforming);
  const isDynamic = useEditorStore((s) => s.dynamicObjectIds[id] === true);
  const instancedReady = useInstancingStore((s) => s.readyAssetTypes[asset.type] === true);
  const updateObject = useEditorStore((s) => s.updateObject);
  const setObjectDynamic = useEditorStore((s) => s.setObjectDynamic);

  const renderModel = isDynamic || !instancedReady;
  const isActive = id === activeObjectId;
  const bodyType =
    isDynamic && !(isActive && isTransforming)
      ? ('dynamic' as const)
      : isActive && isTransforming
        ? ('kinematicPosition' as const)
        : ('fixed' as const);
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  const size: Vec3 = [
    asset.defaultSize[0] * scale[0],
    asset.defaultSize[1] * scale[1],
    asset.defaultSize[2] * scale[2],
  ];

  useEffect(() => {
    const rb = rigidBodyRef.current;
    if (!rb) return;
    if (bodyType === 'dynamic') return;

    const q = new Quaternion().setFromEuler(new Euler(rotation[0], rotation[1], rotation[2], 'XYZ'));
    rb.setTranslation({ x: position[0], y: position[1], z: position[2] }, false);
    rb.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, false);
  }, [bodyType, position, rotation]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type={bodyType}
      position={position}
      rotation={rotation}
      colliders={false}
      linearDamping={0.75}
      angularDamping={0.8}
      onSleep={() => {
        const rb = rigidBodyRef.current;
        if (!rb) return;

        const t = rb.translation();
        const r = rb.rotation();

        const quat = new Quaternion(r.x, r.y, r.z, r.w);
        const euler = new Euler().setFromQuaternion(quat, 'XYZ');

        updateObject(id, {
          position: [t.x, t.y, t.z],
          rotation: [euler.x, euler.y, euler.z],
        });

        if (isDynamic) {
          setObjectDynamic(id, false);
        }
      }}
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
            {renderModel ? <AssetModel url={asset.modelUrl} scale={scale} /> : null}
          </ThreeErrorBoundary>
        </Suspense>
      </group>
    </RigidBody>
  );
}
