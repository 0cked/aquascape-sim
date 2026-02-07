import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { AdditiveBlending, Color, ShaderMaterial, PlaneGeometry } from 'three';

import { TANK, TANK_INNER } from '@/components/three/tank-constants';

export function CausticsPlane() {
  const geometry = useMemo(() => {
    return new PlaneGeometry(TANK_INNER.width - 0.12, TANK_INNER.depth - 0.12, 1, 1);
  }, []);

  const material = useMemo(() => {
    return new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        time: { value: 0 },
        color: { value: new Color('#7dd3fc') },
        intensity: { value: 0.75 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        uniform float time;
        uniform vec3 color;
        uniform float intensity;

        float caustic(vec2 p, float t) {
          // Cheap "watery" interference pattern using a few phase-shifted waves.
          float v = 0.0;
          v += sin(p.x * 3.2 + t * 0.9) * cos(p.y * 3.0 - t * 0.8);
          v += sin(p.x * 4.7 - t * 1.1) * sin(p.y * 4.1 + t * 0.7);
          v += cos((p.x + p.y) * 2.6 + t * 0.6);
          v = abs(v);
          v = pow(v, 2.6);
          return v;
        }

        void main() {
          vec2 p = vWorldPos.xz * 1.35;
          float t = time * 0.55;
          float c = caustic(p, t);
          c = clamp(c, 0.0, 1.0);
          // Emphasize bright filaments.
          float a = smoothstep(0.45, 1.0, c);
          vec3 col = color * (a * intensity);
          gl_FragColor = vec4(col, a * 0.35);
        }
      `,
    });
  }, []);

  useFrame(({ clock }) => {
    material.uniforms.time.value = clock.getElapsedTime();
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, TANK.glass + 0.1 + 0.012, 0]}
      geometry={geometry}
      material={material}
      renderOrder={2}
    />
  );
}

