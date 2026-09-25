import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const android = path.join(root, 'mobile', 'android');
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

const files = walk(android);
const gradleEntrypoints = files.filter(p =>
  /(^|\/)(settings\.gradle(\.kts)?|build\.gradle(\.kts)?|gradle\.properties)$/.test(p)
);

console.log('=== WAEVE ANDROID BUILD PREPARATION ===');
console.log(`Canonical Android files: ${files.length}`);
console.log(`Gradle entrypoints: ${gradleEntrypoints.length}`);

const report = {
  canonicalAndroid: 'mobile/android',
  files: files.length,
  gradleEntrypoints: gradleEntrypoints.map(p => path.relative(root, p)),
  wrapperPresent: fs.existsSync(path.join(android, 'gradlew')),
  sourceVariantsModified: 0,
  destructiveOperations: 0,
  status: 'INSPECTED'
};

fs.writeFileSync(
  path.join(state, 'android-build-preparation.json'),
  JSON.stringify(report, null, 2) + '\n'
);

console.log(`Gradle wrapper present: ${report.wrapperPresent}`);
console.log('Original source variants: UNMODIFIED');
console.log('Destructive operations: 0');

if (!gradleEntrypoints.length) process.exit(2);
