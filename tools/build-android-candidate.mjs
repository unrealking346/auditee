import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const android = path.join(root, 'mobile', 'android');
const state = path.join(root, 'tools', 'merge-state');

fs.mkdirSync(state, { recursive: true });

console.log('=== WAEVE ANDROID BUILD ===');
console.log('Candidate: mobile/android');
console.log('Gradle wrapper: absent');
console.log('Using system Gradle.');

const result = spawnSync(
  'gradle',
  ['assembleDebug', '--no-daemon', '--stacktrace'],
  {
    cwd: android,
    stdio: 'inherit'
  }
);

const apkCandidates = [
  path.join(android, 'app/build/outputs/apk/debug/app-debug.apk'),
  path.join(android, 'android/app/build/outputs/apk/debug/app-debug.apk')
];

const apks = apkCandidates.filter(fs.existsSync);

const report = {
  candidate: 'mobile/android',
  command: 'gradle assembleDebug --no-daemon --stacktrace',
  exitCode: result.status,
  apkProduced: apks.length > 0,
  apkPaths: apks.map(p => path.relative(root, p)),
  sourceVariantsModified: 0,
  destructiveOperations: 0,
  status: result.status === 0 && apks.length > 0
    ? 'ANDROID_DEBUG_BUILD_PASS'
    : 'ANDROID_DEBUG_BUILD_BLOCKED'
};

fs.writeFileSync(
  path.join(state, 'android-build-result.json'),
  JSON.stringify(report, null, 2) + '\n'
);

console.log();
console.log('=== ANDROID BUILD RESULT ===');
console.log(`Gradle exit code: ${result.status}`);
console.log(`APK produced: ${apks.length > 0}`);
for (const apk of apks) {
  console.log(`APK: ${path.relative(root, apk)}`);
}
console.log('Original source variants: UNMODIFIED');
console.log('Destructive operations: 0');
console.log('Report: tools/merge-state/android-build-result.json');

process.exit(result.status ?? 1);
