import { useMemo } from 'react';
import { Color, Float32BufferAttribute, PlaneGeometry } from 'three';

import { CuboidCollider, RigidBody } from '@react-three/rapier';

import { TANK, TANK_INNER } from '@/components/three/tank-constants';

export function Substrate() {
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(TANK_INNER.width - 0.1, TANK_INNER.depth - 0.1, 48, 48);

    const colors: number[] = [];
    const c = new Color();
    const temp = new Color();
    const pos = g.attributes.position;

    for (let i = 0; i < pos.count; i += 1) {
      // Slightly warm gravel/soil variation.
      const n = Math.random();
      const hue = 0.08 + n * 0.03; // orange/brown
      const sat = 0.35 + n * 0.15;
      const lit = 0.18 + n * 0.1;
      temp.setHSL(hue, sat, lit);
      c.copy(temp);
      colors.push(c.r, c.g, c.b);
    }

    g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    return g;
  }, []);

  const thickness = 0.2;

  return (
    <RigidBody type="fixed" colliders={false} position={[0, TANK.glass + 0.1, 0]}>
      <CuboidCollider
        args={[(TANK_INNER.width - 0.1) / 2, thickness / 2, (TANK_INNER.depth - 0.1) / 2]}
        position={[0, -thickness / 2, 0]}
        friction={1.2}
      />
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} metalness={0} />
      </mesh>
    </RigidBody>
  );
}
