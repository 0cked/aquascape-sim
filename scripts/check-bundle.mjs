import fs from 'node:fs';
import path from 'node:path';

const EDITOR_ROUTE = '/editor/page';
const DEFAULT_LIMIT = 1_000_000;

function parseLimit(raw) {
  if (typeof raw !== 'string') return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

const limit = parseLimit(process.env.MAX_EDITOR_JS_BYTES) ?? DEFAULT_LIMIT;
const manifestPath = path.join(process.cwd(), '.next', 'app-build-manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error('Missing .next/app-build-manifest.json. Run `pnpm build` first.');
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const files = manifest?.pages?.[EDITOR_ROUTE];

if (!Array.isArray(files)) {
  console.error(`Missing route entry ${EDITOR_ROUTE} in app-build-manifest.json.`);
  process.exit(2);
}

let total = 0;
const entries = [];

for (const rel of files) {
  if (typeof rel !== 'string') continue;
  if (!rel.endsWith('.js')) continue;
  const filePath = path.join(process.cwd(), '.next', rel);
  const size = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  total += size;
  entries.push({ rel, size });
}

entries.sort((a, b) => b.size - a.size);

console.log(`Bundle guardrail: ${EDITOR_ROUTE}`);
console.log(`Total JS: ${fmtBytes(total)} (limit: ${fmtBytes(limit)})`);
console.log('Top chunks:');
for (const e of entries.slice(0, 8)) {
  console.log(`- ${fmtBytes(e.size)}  ${e.rel}`);
}

if (total > limit) {
  console.error(`FAIL: ${EDITOR_ROUTE} exceeds limit by ${fmtBytes(total - limit)}.`);
  console.error('Tip: inspect the largest chunks above and consider dynamic imports or removing heavy deps.');
  process.exit(1);
}

console.log('OK');

