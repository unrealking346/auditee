import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DOMAINS = [
  'apps/web','apps/api','apps/artist','apps/admin','apps/developer',
  'packages/shared','packages/contracts','packages/database',
  'packages/security','packages/ui',
  'services/catalog','services/playback','services/search',
  'services/discovery','services/recommendations','services/rights',
  'services/royalties','services/territory','services/knowledge',
  'services/trust','services/editorial','services/analytics',
  'services/payments','services/media','services/notifications'
];

const STATE = path.join(ROOT, 'tools', 'merge-state');
fs.mkdirSync(STATE, { recursive: true });

const readJson = p => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
};

const writeIfMissing = (p, value) => {
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, value);
    return true;
  }
  return false;
};

const findFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  const visit = p => {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      if (['node_modules','.git','dist','build'].includes(e.name)) continue;
      const q = path.join(p, e.name);
      if (e.isDirectory()) visit(q);
      else result.push(q);
    }
  };
  visit(dir);
  return result;
};

const result = {
  generatedAt: new Date().toISOString(),
  domains: {},
  changedPackageManifests: [],
  createdGateFiles: [],
  preservedExistingContent: true
};

for (const domain of DOMAINS) {
  const dir = path.join(ROOT, domain);
  if (!fs.existsSync(dir)) {
    result.domains[domain] = { status: 'MISSING_DOMAIN' };
    continue;
  }

  const packagePath = path.join(dir, 'package.json');
  const pkg = readJson(packagePath);
  const files = findFiles(dir);
  const tsFiles = files.filter(f => /\.tsx?$/.test(f));
  const jsFiles = files.filter(f => /\.m?js$/.test(f));
  const hasSource = tsFiles.length || jsFiles.length;
  const hasTests = files.some(f => /\.(test|spec)\.(ts|tsx|js|mjs)$/.test(f));

  if (!pkg) {
    result.domains[domain] = {
      status: 'NO_PACKAGE_MANIFEST',
      files: files.length,
      sourceFiles: tsFiles.length + jsFiles.length,
      tests: hasTests
    };
    continue;
  }

  const scripts = pkg.scripts ?? {};
  let changed = false;

  if (!scripts.check) {
    if (tsFiles.length) {
      scripts.check = 'tsc --noEmit';
    } else {
      const entry = files.find(f =>
        /(^|\/)(index|server|main|app)\.(m?js)$/.test(f)
      );
      if (entry) {
        scripts.check = `node --check ${path.relative(dir, entry).replaceAll(path.sep,'/')}`;
      }
    }
    if (scripts.check) changed = true;
  }

  if (!scripts.build) {
    if (tsFiles.length) {
      scripts.build = 'tsc';
      changed = true;
    }
  }

  if (!scripts.test && hasTests) {
    if (tsFiles.length && scripts.build) {
      scripts.test = 'npm run build && node --test dist/test/*.test.js';
    } else {
      const testFiles = files.filter(f =>
        /\.(test|spec)\.(js|mjs)$/.test(f)
      );
      if (testFiles.length) {
        scripts.test = 'node --test';
      }
    }
    if (scripts.test) changed = true;
  }

  if (changed) {
    pkg.scripts = scripts;
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
    result.changedPackageManifests.push(domain);
  }

  const gatePath = path.join(dir, 'DOMAIN_GATE.md');
  const gate = `# Waeve Domain Verification Gate

Domain: \`${domain}\`

This domain is part of the canonical Waeve production ecosystem.

## Required verification

1. Static/type validation
2. Build/compile validation where applicable
3. Automated tests where applicable
4. Integration against canonical Waeve contracts
5. Security and permission validation where applicable
6. Runtime/integration verification where the environment supports it

## Policy

Existing implementation files must be preserved during reconciliation.
Source variants under \`_sources/\` are preserved and are not modified by this process.
Environment-specific limitations are recorded separately from implementation status.
`;

  if (writeIfMissing(gatePath, gate)) {
    result.createdGateFiles.push(domain);
  }

  result.domains[domain] = {
    status: 'STANDARDIZED',
    files: files.length,
    sourceFiles: tsFiles.length + jsFiles.length,
    tests: hasTests,
    check: Boolean(pkg.scripts?.check || scripts.check),
    build: Boolean(pkg.scripts?.build || scripts.build),
    test: Boolean(pkg.scripts?.test || scripts.test)
  };
}

fs.writeFileSync(
  path.join(STATE, 'domain-gate-normalization.json'),
  JSON.stringify(result, null, 2)
);

console.log('=== WAEVE DOMAIN GATE NORMALIZATION ===');
console.log(`Domains inspected: ${DOMAINS.length}`);
console.log(`Package manifests changed: ${result.changedPackageManifests.length}`);
console.log(`Gate documents created: ${result.createdGateFiles.length}`);
console.log('Existing implementation files overwritten: 0');
console.log('Original source variants modified: 0');
console.log('Report: tools/merge-state/domain-gate-normalization.json');

console.log('\n=== STANDARDIZED DOMAINS ===');
for (const [domain, r] of Object.entries(result.domains)) {
  console.log(
    `${domain.padEnd(32)} check=${r.check ? 'YES' : 'NO '} build=${r.build ? 'YES' : 'NO '} test=${r.test ? 'YES' : 'NO '}`
  );
}
