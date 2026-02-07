import { BallCollider, CylinderCollider, CuboidCollider, RigidBody } from '@react-three/rapier';
import type { ThreeEvent } from '@react-three/fiber';
import { useMemo } from 'react';

export type PlaceableShape = 'box' | 'sphere' | 'cylinder';

export type PlaceableObjectProps = {
  position: [number, number, number];
  rotation?: [number, number, number];
  shape: PlaceableShape;
  size: [number, number, number];
  color: string;
  selected?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
};

export function PlaceableObject({
  position,
  rotation,
  shape,
  size,
  color,
  selected = false,
  onClick,
}: PlaceableObjectProps) {
  const [sx, sy, sz] = size;

  const geometry = useMemo(() => {
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
  }, [shape, sx, sy, sz]);

  const collider = useMemo(() => {
    switch (shape) {
      case 'sphere': {
        return <BallCollider args={[sx / 2]} />;
      }
      case 'cylinder': {
        return <CylinderCollider args={[sy / 2, sx / 2]} />;
      }
      case 'box':
      default:
        return <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} />;
    }
  }, [shape, sx, sy, sz]);

  return (
    <RigidBody
      type="dynamic"
      position={position}
      rotation={rotation}
      colliders={false}
      linearDamping={0.75}
      angularDamping={0.8}
    >
      {collider}
      <mesh castShadow receiveShadow onClick={onClick}>
        {geometry}
        <meshStandardMaterial
          color={color}
          emissive={selected ? '#ffffff' : '#000000'}
          emissiveIntensity={selected ? 0.18 : 0}
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>
    </RigidBody>
  );
}
