'use client';

import { Html, OrbitControls, PerformanceMonitor, TransformControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Color, Group, NoToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';

import { AquariumTank } from '@/components/three/aquarium-tank';
import { CausticsPlane } from '@/components/three/caustics-plane';
import { Effects } from '@/components/three/effects';
import { InstancedAssetLayer } from '@/components/three/instanced-asset-layer';
import { Lighting } from '@/components/three/lighting';
import { PlacedAsset } from '@/components/three/placed-asset';
import { PlacementHandler } from '@/components/three/placement-handler';
import { Substrate } from '@/components/three/substrate';
import { TANK, TANK_INNER } from '@/components/three/tank-constants';
import { Water } from '@/components/three/water';
import { getAssetDefinition } from '@/lib/assets/asset-catalog';
import { useEditorStore } from '@/lib/store/editor-store';
import type { TransformSnapshot } from '@/lib/store/editor-store';
import { useQualityStore } from '@/lib/store/quality-store';
import type { PlaceableShape, Vec3 } from '@/types/scene';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function halfExtents(shape: PlaceableShape, size: Vec3): Vec3 {
  const [sx, sy, sz] = size;
  switch (shape) {
    case 'sphere': {
      const r = sx / 2;
      return [r, r, r];
    }
    case 'cylinder': {
      const r = sx / 2;
      return [r, sy / 2, r];
    }
    case 'box':
    default:
      return [sx / 2, sy / 2, sz / 2];
  }
}

export function Scene() {
  const background = useMemo(() => new Color('#05070a'), []);
  const preset = useQualityStore((s) => s.preset);
  const dprMax = useQualityStore((s) => s.dprMax);
  const shadowsEnabled = useQualityStore((s) => s.shadowsEnabled);
  const shadowMapSize = useQualityStore((s) => s.shadowMapSize);
  const postprocessingEnabled = useQualityStore((s) => s.postprocessingEnabled);
  const aoQuality = useQualityStore((s) => s.aoQuality);
  const fogEnabled = useQualityStore((s) => s.fogEnabled);
  const causticsEnabled = useQualityStore((s) => s.causticsEnabled);
  const godRaysEnabled = useQualityStore((s) => s.godRaysEnabled);
  const autoDegradeEnabled = useQualityStore((s) => s.autoDegradeEnabled);
  const setAutoDegradeEnabled = useQualityStore((s) => s.setAutoDegradeEnabled);
  const setAutoNotice = useQualityStore((s) => s.setAutoNotice);
  const setPreset = useQualityStore((s) => s.setPreset);
  const mode = useEditorStore((s) => s.mode);
  const objects = useEditorStore((s) => s.objects);
  const dynamicObjectIds = useEditorStore((s) => s.dynamicObjectIds);
  const selectedObjectIds = useEditorStore((s) => s.selectedObjectIds);
  const activeObjectId = useEditorStore((s) => s.activeObjectId);
  const selectObject = useEditorStore((s) => s.selectObject);
  const transformMode = useEditorStore((s) => s.transformMode);
  const isTransforming = useEditorStore((s) => s.isTransforming);
  const setTransforming = useEditorStore((s) => s.setTransforming);
  const updateObject = useEditorStore((s) => s.updateObject);
  const setObjectDynamic = useEditorStore((s) => s.setObjectDynamic);
  const commitTransform = useEditorStore((s) => s.commitTransform);
  const selectedSet = useMemo(() => new Set(selectedObjectIds), [selectedObjectIds]);

  const settledObjects = useMemo(() => {
    return objects.filter((o) => dynamicObjectIds[o.id] !== true);
  }, [dynamicObjectIds, objects]);

  const activeObject = useMemo(() => {
    if (!activeObjectId) return null;
    return objects.find((o) => o.id === activeObjectId) ?? null;
  }, [activeObjectId, objects]);

  const activeAsset = useMemo(() => {
    if (!activeObject) return undefined;
    return getAssetDefinition(activeObject.assetType);
  }, [activeObject]);

  const [transformProxy, setTransformProxy] = useState<Group | null>(null);
  const transformProxyRef = useCallback((node: Group | null) => {
    setTransformProxy(node);
  }, []);

  useEffect(() => {
    setTransforming(false);
  }, [activeObjectId, setTransforming]);

  useLayoutEffect(() => {
    if (!transformProxy) return;
    if (!activeObject) return;
    if (isTransforming) return;

    transformProxy.position.set(...activeObject.position);
    transformProxy.rotation.set(...activeObject.rotation);
    transformProxy.scale.set(...activeObject.scale);
  }, [activeObject, isTransforming, transformProxy]);

  const applyProxyTransform = useCallback(() => {
    if (!transformProxy) return;
    if (!activeObject) return;
    if (!activeAsset) return;

    const proxy = transformProxy;

    const nextScale: Vec3 = [
      clamp(proxy.scale.x, 0.2, 3.0),
      clamp(proxy.scale.y, 0.2, 3.0),
      clamp(proxy.scale.z, 0.2, 3.0),
    ];

    const size: Vec3 = [
      activeAsset.defaultSize[0] * nextScale[0],
      activeAsset.defaultSize[1] * nextScale[1],
      activeAsset.defaultSize[2] * nextScale[2],
    ];

    const [hx, hy, hz] = halfExtents(activeAsset.shape, size);

    const margin = 0.04;
    const floorY = TANK.glass + 0.1;
    const minY = floorY + hy + 0.02;
    const maxY = TANK.height - margin - hy;

    const minX = -TANK_INNER.width / 2 + margin + hx;
    const maxX = TANK_INNER.width / 2 - margin - hx;
    const minZ = -TANK_INNER.depth / 2 + margin + hz;
    const maxZ = TANK_INNER.depth / 2 - margin - hz;

    const nextPos: Vec3 = [
      clamp(proxy.position.x, minX, maxX),
      clamp(proxy.position.y, minY, maxY),
      clamp(proxy.position.z, minZ, maxZ),
    ];

    proxy.position.set(...nextPos);
    proxy.scale.set(...nextScale);

    updateObject(activeObject.id, {
      position: nextPos,
      rotation: [proxy.rotation.x, proxy.rotation.y, proxy.rotation.z],
      scale: nextScale,
    });
  }, [activeAsset, activeObject, transformProxy, updateObject]);

  const transformBeforeRef = useRef<TransformSnapshot | null>(null);
  const sunRef = useRef<import('three').Mesh>(null!);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [contextLost, setContextLost] = useState<boolean>(false);

  useEffect(() => {
    if (!canvasEl) return;

    const onLost = (e: Event) => {
      // Prevent the default browser behavior which can make restoration unpredictable.
      if ('preventDefault' in e) (e as Event).preventDefault();
      setContextLost(true);
    };
    const onRestored = () => {
      setContextLost(false);
    };

    canvasEl.addEventListener('webglcontextlost', onLost, { passive: false } as AddEventListenerOptions);
    canvasEl.addEventListener('webglcontextrestored', onRestored);
    return () => {
      canvasEl.removeEventListener('webglcontextlost', onLost);
      canvasEl.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [canvasEl]);

  return (
    <Canvas
      id="aquascape-canvas"
      shadows={shadowsEnabled}
      dpr={[1, dprMax]}
      camera={{ position: [9, 6.5, 9], fov: 42, near: 0.1, far: 200 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      }}
      onCreated={({ gl, scene }) => {
        gl.shadowMap.type = PCFSoftShadowMap;
        // Post-processing owns tone mapping to avoid double application.
        gl.toneMapping = NoToneMapping;
        gl.outputColorSpace = SRGBColorSpace;

        scene.background = background;

        // Used for WebGL context loss handling.
        setCanvasEl(gl.domElement);
      }}
    >
      {contextLost ? (
        <Html fullscreen>
          <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-zinc-100">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/70 p-6 shadow-[0_40px_140px_rgba(0,0,0,0.85)] backdrop-blur">
              <div className="text-base font-semibold">WebGL Context Lost</div>
              <div className="mt-2 text-sm leading-6 text-zinc-300">
                Your browser lost the GPU rendering context. This can happen after a driver reset or when the tab is
                backgrounded under memory pressure. Reloading usually fixes it.
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="h-10 rounded-full bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200"
                >
                  Reload
                </button>
                <button
                  type="button"
                  onClick={() => setContextLost(false)}
                  className="h-10 rounded-full border border-white/10 bg-white/5 px-5 text-sm text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </Html>
      ) : null}

      <PerformanceMonitor
        onDecline={() => {
          if (!autoDegradeEnabled) return;

          const next = preset === 'high' ? 'medium' : preset === 'medium' ? 'low' : null;
          if (!next) return;

          setPreset(next);
          setAutoDegradeEnabled(false);
          setAutoNotice(`Auto lowered quality to ${next} to keep interaction responsive.`);
        }}
      />
      <Lighting shadowsEnabled={shadowsEnabled} shadowMapSize={shadowMapSize} />
      {fogEnabled ? <fogExp2 attach="fog" args={['#07222c', 0.075]} /> : null}

      <mesh ref={sunRef} position={[5, 9.5, 6]} visible={false}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Stand / stage */}
      <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.2, 1.1, 4.6]} />
        <meshStandardMaterial color="#1b1f22" roughness={0.9} />
      </mesh>

      <Physics gravity={[0, -4.9, 0]} debug={false}>
        <AquariumTank />
        <Substrate />
        <PlacementHandler />

        {objects.map((obj) => {
          const asset = getAssetDefinition(obj.assetType);
          if (!asset) return null;

          return (
            <PlacedAsset
              key={obj.id}
              id={obj.id}
              asset={asset}
              position={obj.position}
              rotation={obj.rotation}
              scale={obj.scale}
              selected={selectedSet.has(obj.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (mode === 'place') return;
                selectObject(obj.id, { additive: e.nativeEvent.shiftKey });
              }}
            />
          );
        })}
      </Physics>

      {causticsEnabled ? <CausticsPlane /> : null}

      <Suspense fallback={null}>
        <InstancedAssetLayer objects={settledObjects} />
      </Suspense>

      {mode === 'select' && activeObject && activeAsset && transformProxy ? (
        <TransformControls
          mode={transformMode}
          object={transformProxy}
          onMouseDown={() => {
            transformBeforeRef.current = {
              position: [...activeObject.position] as Vec3,
              rotation: [...activeObject.rotation] as Vec3,
              scale: [...activeObject.scale] as Vec3,
            };
            setTransforming(true);
          }}
          onMouseUp={() => {
            applyProxyTransform();
            const before = transformBeforeRef.current;
            transformBeforeRef.current = null;
            const afterObj = useEditorStore
              .getState()
              .objects.find((o) => o.id === activeObject.id);
            if (before && afterObj) {
              commitTransform(
                activeObject.id,
                before,
                {
                  position: [...afterObj.position] as Vec3,
                  rotation: [...afterObj.rotation] as Vec3,
                  scale: [...afterObj.scale] as Vec3,
                },
                'gizmo'
              );
            } else {
              setObjectDynamic(activeObject.id, false);
            }
            setTransforming(false);
          }}
          onObjectChange={() => {
            if (!isTransforming) return;
            applyProxyTransform();
          }}
        />
      ) : null}

      {/* Proxy object that TransformControls manipulates; we translate it into store updates. */}
      <group ref={transformProxyRef} />
      <Water quality={preset} />

      <Effects enabled={postprocessingEnabled} aoQuality={aoQuality} godRaysEnabled={godRaysEnabled} sun={sunRef} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={5.5}
        maxDistance={22}
        target={[0, 1.7, 0]}
        maxPolarAngle={Math.PI * 0.48}
      />
    </Canvas>
  );
}
