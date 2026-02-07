'use client';

import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { KTX2Loader, type GLTF, type GLTFLoader } from 'three-stdlib';

export function useAquascapeGLTF(url: string): GLTF {
  const gl = useThree((s) => s.gl);

  const ktx2 = useMemo(() => {
    const loader = new KTX2Loader();
    loader.setTranscoderPath('/basis/');
    loader.detectSupport(gl);
    return loader;
  }, [gl]);

  useEffect(() => {
    return () => {
      ktx2.dispose();
    };
  }, [ktx2]);

  return useGLTF(
    url,
    '/draco/',
    false,
    (loader: GLTFLoader) => {
      loader.setKTX2Loader(ktx2);
    }
  );
}
