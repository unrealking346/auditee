import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const state = path.join(root, 'tools', 'merge-state');

const candidates = [
  'mobile/android',
  'mobile/android/android',
  'mobile/android/platforms/android-native'
];

function read(p) {
  try { return fs.readFileSync(path.join(root, p), 'utf8'); }
  catch { return ''; }
}

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

function count(rootDir, re) {
  return walk(path.join(root, rootDir))
    .filter(p => re.test(p)).length;
}

function extract(text, re) {
  const m = text.match(re);
  return m ? m[1] : null;
}

const results = [];

console.log('=== WAEVE ANDROID CANDIDATE ANALYSIS ===');

for (const candidate of candidates) {
  const base = path.join(root, candidate);
  const settings = fs.readdirSync(base, { withFileTypes: true })
    .filter(e => /^settings\.gradle(\.kts)?$/.test(e.name))
    .map(e => path.join(base, e.name))[0];

  const settingsText = settings
    ? fs.readFileSync(settings, 'utf8')
    : '';

  const buildFiles = walk(base)
    .filter(p => /build\.gradle(\.kts)?$/.test(p));

  const manifests = walk(base)
    .filter(p => path.basename(p) === 'AndroidManifest.xml');

  const manifestText = manifests.length
    ? fs.readFileSync(manifests[0], 'utf8')
    : '';

  const allText = [
    settingsText,
    ...buildFiles.map(p => fs.readFileSync(p, 'utf8'))
  ].join('\n');

  const java = count(candidate, /\.(java|kt)$/);
  const resources = count(candidate, /\/src\/main\/res\//);
  const manifestsCount = manifests.length;

  const plugins = [
    ...allText.matchAll(/id\s*\(?["']([^"']+)["']/g)
  ].map(m => m[1]);

  const namespace =
    extract(allText, /namespace\s*[=:]\s*["']([^"']+)["']/) ||
    extract(allText, /namespace\s*=\s*["']([^"']+)["']/);

  const applicationId =
    extract(allText, /applicationId\s*[=:]\s*["']([^"']+)["']/);

  const compileSdk =
    extract(allText, /compileSdk\s*[=:]?\s*(\d+)/);

  const minSdk =
    extract(allText, /minSdk\s*[=:]?\s*(\d+)/);

  const targetSdk =
    extract(allText, /targetSdk\s*[=:]?\s*(\d+)/);

  const dependencies = [
    ...allText.matchAll(/implementation\s*\(?["']([^"']+)["']/g)
  ].map(m => m[1]);

  const hasAppModule =
    fs.existsSync(path.join(base, 'app', 'build.gradle')) ||
    fs.existsSync(path.join(base, 'app', 'build.gradle.kts'));

  const hasCompose =
    allText.includes('compose') ||
    allText.includes('jetpack');

  const hasMedia3 =
    allText.includes('media3') ||
    allText.includes('exoplayer');

  const score =
    (hasAppModule ? 5 : 0) +
    (java > 0 ? 3 : 0) +
    (resources > 0 ? 2 : 0) +
    (manifestsCount > 0 ? 2 : 0) +
    (namespace ? 2 : 0) +
    (applicationId ? 2 : 0) +
    (compileSdk ? 1 : 0) +
    (hasCompose ? 2 : 0) +
    (hasMedia3 ? 2 : 0);

  const result = {
    candidate,
    files: walk(base).length,
    kotlinJavaSources: java,
    resources,
    manifests: manifestsCount,
    namespace,
    applicationId,
    compileSdk,
    minSdk,
    targetSdk,
    plugins: [...new Set(plugins)],
    dependencies: [...new Set(dependencies)],
    composeEvidence: hasCompose,
    media3Evidence: hasMedia3,
    score
  };

  results.push(result);

  console.log();
  console.log(candidate);
  console.log(`  score=${score}`);
  console.log(`  Kotlin/Java=${java} resources=${resources} manifests=${manifestsCount}`);
  console.log(`  namespace=${namespace || 'none'}`);
  console.log(`  applicationId=${applicationId || 'none'}`);
  console.log(`  compileSdk=${compileSdk || 'unknown'} minSdk=${minSdk || 'unknown'} targetSdk=${targetSdk || 'unknown'}`);
  console.log(`  Compose=${hasCompose} Media3=${hasMedia3}`);
  console.log(`  plugins=${[...new Set(plugins)].join(', ') || 'none'}`);
}

results.sort((a, b) => b.score - a.score);

const report = {
  candidates: results,
  selectedForBuildEvaluation: results[0]?.candidate ?? null,
  selectionBasis: 'technical build evidence only; no source deletion or destructive merge',
  sourceVariantsModified: 0,
  destructiveOperations: 0,
  status: 'ANDROID_CANDIDATES_ANALYZED'
};

fs.mkdirSync(state, { recursive: true });
fs.writeFileSync(
  path.join(state, 'android-candidate-analysis.json'),
  JSON.stringify(report, null, 2) + '\n'
);

console.log();
console.log('=== RESULT ===');
console.log(`Build evaluation candidate: ${results[0]?.candidate ?? 'none'}`);
console.log('Original source variants: UNMODIFIED');
console.log('Destructive operations: 0');
console.log('Report: tools/merge-state/android-candidate-analysis.json');
