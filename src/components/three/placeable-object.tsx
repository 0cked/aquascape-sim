import { BallCollider, CylinderCollider, CuboidCollider, RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';

export type PlaceableShape = 'box' | 'sphere' | 'cylinder';

export type PlaceableObjectProps = {
  position: [number, number, number];
  rotation?: [number, number, number];
  shape: PlaceableShape;
  size: [number, number, number];
  color: string;
};

export function PlaceableObject({
  position,
  rotation,
  shape,
  size,
  color,
}: PlaceableObjectProps) {
  const geometry = useMemo(() => {
    switch (shape) {
      case 'sphere': {
        const r = size[0] / 2;
        return <sphereGeometry args={[r, 24, 24]} />;
      }
      case 'cylinder': {
        const r = size[0] / 2;
        const h = size[1];
        return <cylinderGeometry args={[r, r, h, 28]} />;
      }
      case 'box':
      default:
        return <boxGeometry args={size} />;
    }
  }, [shape, size]);

  const collider = useMemo(() => {
    switch (shape) {
      case 'sphere': {
        return <BallCollider args={[size[0] / 2]} />;
      }
      case 'cylinder': {
        return <CylinderCollider args={[size[1] / 2, size[0] / 2]} />;
      }
      case 'box':
      default:
        return <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />;
    }
  }, [shape, size]);

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
      <mesh castShadow receiveShadow>
        {geometry}
        <meshStandardMaterial color={color} roughness={0.95} metalness={0.02} />
      </mesh>
    </RigidBody>
  );
}

