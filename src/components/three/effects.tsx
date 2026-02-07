import { Bloom, EffectComposer, GodRays, SSAO, ToneMapping, Vignette } from '@react-three/postprocessing';
import type { ReactElement } from 'react';
import type { RefObject } from 'react';
import type { Mesh } from 'three';

import type { AoQuality } from '@/lib/store/quality-store';

export type EffectsProps = {
  enabled: boolean;
  aoQuality: AoQuality;
  godRaysEnabled: boolean;
  sun: RefObject<Mesh>;
};

function ssaoProps(
  quality: AoQuality
): null | { samples: number; rings: number; radius: number; intensity: number; resolutionScale: number } {
  switch (quality) {
    case 'off':
      return null;
    case 'low':
      return { samples: 8, rings: 3, radius: 0.65, intensity: 1.05, resolutionScale: 0.75 };
    case 'high':
    default:
      return { samples: 20, rings: 4, radius: 0.75, intensity: 1.25, resolutionScale: 1.0 };
  }
}

export function Effects({ enabled, aoQuality, godRaysEnabled, sun }: EffectsProps): ReactElement | null {
  if (!enabled) return null;
  const ssao = ssaoProps(aoQuality);

  return (
    <EffectComposer enableNormalPass multisampling={0}>
      <Bloom
        luminanceThreshold={0.65}
        luminanceSmoothing={0.9}
        intensity={0.35}
        mipmapBlur
      />
      {ssao ? (
        <SSAO
          samples={ssao.samples}
          rings={ssao.rings}
          resolutionScale={ssao.resolutionScale}
          radius={ssao.radius}
          intensity={ssao.intensity}
          luminanceInfluence={0.55}
        />
      ) : (
        <></>
      )}
      {godRaysEnabled ? (
        <GodRays
          sun={sun}
          samples={40}
          density={0.96}
          decay={0.93}
          weight={0.4}
          exposure={0.22}
          clampMax={1.0}
          resolutionScale={0.6}
          blur
        />
      ) : (
        <></>
      )}
      <ToneMapping />
      <Vignette offset={0.5} darkness={0.38} />
    </EffectComposer>
  );
}
