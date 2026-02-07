import { Bloom, EffectComposer, SSAO, ToneMapping, Vignette } from '@react-three/postprocessing';
import type { ReactElement } from 'react';

import type { AoQuality } from '@/lib/store/quality-store';

export type EffectsProps = {
  enabled: boolean;
  aoQuality: AoQuality;
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

export function Effects({ enabled, aoQuality }: EffectsProps): ReactElement | null {
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
      <ToneMapping />
      <Vignette offset={0.5} darkness={0.38} />
    </EffectComposer>
  );
}
