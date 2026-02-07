import { Environment } from '@react-three/drei';

export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.28} />

      <directionalLight
        position={[5, 9.5, 6]}
        intensity={3.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Reflections for glass/water */}
      <Environment preset="warehouse" />
    </>
  );
}

