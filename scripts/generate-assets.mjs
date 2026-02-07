import { mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { Document, Logger, NodeIO, Verbosity } from '@gltf-transform/core';
import { PNG } from 'pngjs';
import {
  BoxGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  PlaneGeometry,
  SphereGeometry,
} from 'three';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function jitterPositions(geometry, seed, strength) {
  const rand = mulberry32(seed);
  const pos = geometry.getAttribute('position');
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    pos.setXYZ(
      i,
      x + (rand() - 0.5) * strength,
      y + (rand() - 0.5) * strength,
      z + (rand() - 0.5) * strength
    );
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

function createPngNoise(width, height, seed, baseRgb) {
  const rand = mulberry32(seed);
  const png = new PNG({ width, height });

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (width * y + x) << 2;
      const n = rand();
      // Subtle, earthy noise variation.
      png.data[i + 0] = Math.max(0, Math.min(255, baseRgb[0] + Math.floor((n - 0.5) * 70)));
      png.data[i + 1] = Math.max(0, Math.min(255, baseRgb[1] + Math.floor((n - 0.5) * 55)));
      png.data[i + 2] = Math.max(0, Math.min(255, baseRgb[2] + Math.floor((n - 0.5) * 45)));
      png.data[i + 3] = 255;
    }
  }

  return PNG.sync.write(png);
}

function geometryToGLTFPrimitive(doc, geometry) {
  geometry.computeVertexNormals();

  const buffer = doc.getRoot().listBuffers()[0] ?? doc.createBuffer();

  const pos = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  const index = geometry.getIndex();

  const positionAccessor = doc
    .createAccessor('POSITION')
    .setType('VEC3')
    .setArray(pos.array.slice())
    .setBuffer(buffer);

  const primitive = doc.createPrimitive();
  primitive.setAttribute('POSITION', positionAccessor);

  if (normal) {
    const normalAccessor = doc
      .createAccessor('NORMAL')
      .setType('VEC3')
      .setArray(normal.array.slice())
      .setBuffer(buffer);
    primitive.setAttribute('NORMAL', normalAccessor);
  }

  if (uv) {
    const uvAccessor = doc
      .createAccessor('TEXCOORD_0')
      .setType('VEC2')
      .setArray(uv.array.slice())
      .setBuffer(buffer);
    primitive.setAttribute('TEXCOORD_0', uvAccessor);
  }

  if (index) {
    const indicesAccessor = doc
      .createAccessor('indices')
      .setType('SCALAR')
      .setArray(index.array.slice())
      .setBuffer(buffer);
    primitive.setIndices(indicesAccessor);
  }

  return primitive;
}

async function writeGLB(filepath, build) {
  const doc = new Document();
  doc.setLogger(new Logger(Verbosity.ERROR));

  build(doc);

  const io = new NodeIO();
  const glb = await io.writeBinary(doc);
  await writeFile(filepath, Buffer.from(glb));
}

function run(cmd, args, env) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', env });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const scriptsBin = path.join(repoRoot, 'scripts', 'bin');
  const tmpDir = path.join(repoRoot, '.tmp-assets');
  const outDir = path.join(repoRoot, 'public', 'models');

  // Allow placing local tool binaries (e.g. KTX-Software `ktx`) under scripts/bin
  // without requiring a global install.
  const env = { ...process.env };
  if (existsSync(scriptsBin)) {
    env.PATH = `${scriptsBin}:${env.PATH ?? ''}`;
  }

  await rm(tmpDir, { force: true, recursive: true });
  await mkdir(tmpDir, { recursive: true });
  await mkdir(outDir, { recursive: true });

  const assets = [
    {
      key: 'rock_small',
      seed: 101,
      geometry: () => {
        const g = new IcosahedronGeometry(0.5, 1);
        jitterPositions(g, 101, 0.12);
        return g;
      },
      color: [0.42, 0.44, 0.47, 1],
      roughness: 1.0,
      metalness: 0.0,
    },
    {
      key: 'rock_large',
      seed: 202,
      geometry: () => {
        const g = new IcosahedronGeometry(0.55, 2);
        jitterPositions(g, 202, 0.08);
        return g;
      },
      color: [0.26, 0.28, 0.31, 1],
      roughness: 1.0,
      metalness: 0.0,
    },
    {
      key: 'driftwood',
      seed: 303,
      geometry: () => {
        const g = new CylinderGeometry(0.24, 0.18, 1.0, 9, 2);
        jitterPositions(g, 303, 0.05);
        return g;
      },
      color: [0.42, 0.28, 0.16, 1],
      roughness: 0.95,
      metalness: 0.0,
    },
    {
      key: 'java_fern',
      seed: 404,
      geometry: () => {
        const g = new CylinderGeometry(0.18, 0.08, 1.0, 10, 3);
        jitterPositions(g, 404, 0.02);
        return g;
      },
      color: [0.12, 0.62, 0.26, 1],
      roughness: 0.9,
      metalness: 0.0,
    },
    {
      key: 'anubias',
      seed: 505,
      geometry: () => new SphereGeometry(0.5, 18, 14),
      color: [0.08, 0.45, 0.18, 1],
      roughness: 0.9,
      metalness: 0.0,
    },
    {
      key: 'filter_box',
      seed: 606,
      geometry: () => new BoxGeometry(1.0, 1.0, 0.6, 2, 2, 2),
      color: [0.06, 0.07, 0.09, 1],
      roughness: 0.75,
      metalness: 0.2,
    },
    {
      key: 'heater',
      seed: 707,
      geometry: () => new CylinderGeometry(0.16, 0.16, 1.0, 16, 3),
      color: [0.06, 0.07, 0.09, 1],
      roughness: 0.65,
      metalness: 0.3,
    },
  ];

  for (const asset of assets) {
    const rawPath = path.join(tmpDir, `${asset.key}.raw.glb`);
    const outPath = path.join(outDir, `${asset.key}.glb`);

    await writeGLB(rawPath, (doc) => {
      const material = doc
        .createMaterial(`${asset.key}_mat`)
        .setBaseColorFactor(asset.color)
        .setRoughnessFactor(asset.roughness)
        .setMetallicFactor(asset.metalness);

      const geometry = asset.geometry();
      const primitive = geometryToGLTFPrimitive(doc, geometry).setMaterial(material);
      const mesh = doc.createMesh(`${asset.key}_mesh`).addPrimitive(primitive);
      const node = doc.createNode(asset.key).setMesh(mesh);
      const scene = doc.createScene('Scene').addChild(node);
      doc.getRoot().setDefaultScene(scene);
    });

    // Draco compress.
    run(
      'pnpm',
      [
      'exec',
      'gltf-transform',
      'draco',
      rawPath,
      outPath,
      '--encode-speed',
      '6',
      '--decode-speed',
      '6',
      ],
      env
    );
  }

  // Substrate plane with a PNG texture (later compressed to KTX2).
  const substrateRaw = path.join(tmpDir, 'substrate.raw.glb');
  const substrateOut = path.join(outDir, 'substrate.glb');
  const substratePng = createPngNoise(256, 256, 999, [120, 90, 60]);

  await writeGLB(substrateRaw, (doc) => {
    const tex = doc.createTexture('substrate_albedo').setImage(substratePng).setMimeType('image/png');
    const mat = doc
      .createMaterial('substrate_mat')
      .setBaseColorTexture(tex)
      .setRoughnessFactor(1.0)
      .setMetallicFactor(0.0)
      .setDoubleSided(true);

    const g = new PlaneGeometry(1, 1, 1, 1);
    // Make it horizontal (XZ plane).
    g.rotateX(-Math.PI / 2);
    const primitive = geometryToGLTFPrimitive(doc, g).setMaterial(mat);
    const mesh = doc.createMesh('substrate_mesh').addPrimitive(primitive);
    const node = doc.createNode('substrate').setMesh(mesh);
    const scene = doc.createScene('Scene').addChild(node);
    doc.getRoot().setDefaultScene(scene);
  });

  const hasKtx =
    spawnSync('ktx', ['--version'], { stdio: 'ignore', env }).status === 0;

  if (!hasKtx) {
    // Keep the script usable without KTX-Software installed; output will embed
    // PNG instead of KTX2. This is not ideal for runtime perf, but it keeps
    // the pipeline runnable.
    // eslint-disable-next-line no-console
    console.warn(
      '[generate-assets] KTX-Software `ktx` not found in PATH; generating substrate without KTX2 compression.'
    );
    run(
      'pnpm',
      [
        'exec',
        'gltf-transform',
        'draco',
        substrateRaw,
        substrateOut,
        '--encode-speed',
        '6',
        '--decode-speed',
        '6',
      ],
      env
    );
  } else {
    // Draco + KTX2 compress.
    run(
      'pnpm',
      [
        'exec',
        'gltf-transform',
        'optimize',
        substrateRaw,
        substrateOut,
        '--compress',
        'draco',
        '--texture-compress',
        'ktx2',
        '--texture-size',
        '512',
        '--flatten',
        'false',
        '--join',
        'false',
        '--instance',
        'false',
        '--palette',
        'false',
        '--simplify',
        'false',
        '--prune',
        'false',
        '--resample',
        'false',
        '--weld',
        'false',
      ],
      env
    );
  }

  // Clean tmp dir, leave only outputs under public/models/.
  await rm(tmpDir, { force: true, recursive: true });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
