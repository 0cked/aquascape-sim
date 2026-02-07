import { Environment } from '@react-three/drei';

export type LightingProps = {
  shadowsEnabled: boolean;
  shadowMapSize: number;
};

export function Lighting({ shadowsEnabled, shadowMapSize }: LightingProps) {
  const mapSize = shadowMapSize > 0 ? shadowMapSize : 512;
  return (
    <>
      <ambientLight intensity={0.28} />

      <directionalLight
        position={[5, 9.5, 6]}
        intensity={3.2}
        castShadow={shadowsEnabled}
        shadow-mapSize-width={mapSize}
        shadow-mapSize-height={mapSize}
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
