import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const android = path.join(root, 'mobile', 'android');
const sources = path.join(root, '_sources');
const state = path.join(root, 'tools', 'merge-state');

fs.mkdirSync(state, { recursive: true });

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function files(dir) {
  return walk(dir).map(p => path.relative(dir, p));
}

function exists(p) {
  return fs.existsSync(path.join(root, p));
}

const canonical = files(android);

const roots = [
  'mobile/android',
  'mobile/android/android',
  'mobile/android/platforms/android-native'
];

console.log('=== WAEVE ANDROID BUILD RECONCILIATION ===');
console.log(`Canonical Android files: ${canonical.length}`);
console.log();

for (const r of roots) {
  const abs = path.join(root, r);
  const f = files(abs);
  const settings = f.filter(x => /^settings\.gradle(\.kts)?$/.test(x));
  const builds = f.filter(x => /(^|\/)build\.gradle(\.kts)?$/.test(x));
  const manifests = f.filter(x => /(^|\/)AndroidManifest\.xml$/.test(x));

  console.log(`${r}`);
  console.log(`  files=${f.length} settings=${settings.length} builds=${builds.length} manifests=${manifests.length}`);
  console.log(`  gradle=${builds.map(x => x).join(', ') || 'none'}`);
}

console.log();
console.log('=== PRESERVED SOURCE WRAPPER SEARCH ===');

const wrapperFiles = walk(sources).filter(p =>
  path.basename(p) === 'gradlew'
);

console.log(`Gradle wrappers found in preserved sources: ${wrapperFiles.length}`);

for (const p of wrapperFiles.slice(0, 20)) {
  console.log(`  ${path.relative(root, p)}`);
}

console.log();
console.log('=== ANDROID BUILD TOOLS ===');

let gradleVersion = null;
let sdkManager = null;

try {
  gradleVersion = execFileSync('gradle', ['--version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }).split('\n').slice(0, 5).join('\n');
} catch {}

try {
  sdkManager = execFileSync('which', ['sdkmanager'], {
    encoding: 'utf8'
  }).trim();
} catch {}

console.log(`System Gradle: ${gradleVersion ? 'AVAILABLE' : 'NOT_FOUND'}`);
if (gradleVersion) console.log(gradleVersion);
console.log(`sdkmanager: ${sdkManager || 'NOT_FOUND'}`);

const report = {
  canonicalAndroidFiles: canonical.length,
  candidateRoots: roots.map(r => ({
    root: r,
    files: files(path.join(root, r)).length,
    settings: files(path.join(root, r)).filter(x => /^settings\.gradle(\.kts)?$/.test(x)),
    builds: files(path.join(root, r)).filter(x => /(^|\/)build\.gradle(\.kts)?$/.test(x)),
    manifests: files(path.join(root, r)).filter(x => /(^|\/)AndroidManifest\.xml$/.test(x))
  })),
  preservedSourceWrappers: wrapperFiles.map(p => path.relative(root, p)),
  systemGradle: Boolean(gradleVersion),
  sdkmanager: sdkManager || null,
  sourceVariantsModified: 0,
  destructiveOperations: 0,
  status: 'ANDROID_BUILD_RECONCILIATION_READY'
};

fs.writeFileSync(
  path.join(state, 'android-build-reconciliation.json'),
  JSON.stringify(report, null, 2) + '\n'
);

console.log();
console.log('=== RESULT ===');
console.log('Android build candidates registered.');
console.log('Original source variants: UNMODIFIED');
console.log('Destructive operations: 0');
console.log(`Report: tools/merge-state/android-build-reconciliation.json`);
