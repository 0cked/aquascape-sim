import { Bloom, EffectComposer, SSAO, ToneMapping, Vignette } from '@react-three/postprocessing';

export function Effects() {
  return (
    <EffectComposer enableNormalPass multisampling={0}>
      <Bloom
        luminanceThreshold={0.65}
        luminanceSmoothing={0.9}
        intensity={0.35}
        mipmapBlur
      />
      <SSAO
        radius={0.75}
        intensity={1.25}
        luminanceInfluence={0.55}
      />
      <ToneMapping />
      <Vignette offset={0.5} darkness={0.38} />
    </EffectComposer>
  );
}
