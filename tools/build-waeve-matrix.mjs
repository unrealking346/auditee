import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCES = path.join(ROOT, '_sources');
const OUT = path.join(ROOT, 'tools', 'merge-state');

fs.mkdirSync(OUT, { recursive: true });

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const visit = (p) => {
    let entries = [];
    try { entries = fs.readdirSync(p, { withFileTypes: true }); }
    catch { return; }

    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === '.git' ||
          e.name === 'build' || e.name === 'dist') continue;
      const q = path.join(p, e.name);
      if (e.isDirectory()) visit(q);
      else out.push(q);
    }
  };
  visit(dir);
  return out;
};

const read = (p) => {
  try { return fs.readFileSync(p, 'utf8'); }
  catch { return ''; }
};

const rel = (p) => path.relative(ROOT, p).replaceAll(path.sep, '/');

const sourceDirs = fs.existsSync(SOURCES)
  ? fs.readdirSync(SOURCES, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
  : [];

const canonicalDomains = [
  'apps/web',
  'apps/api',
  'apps/artist',
  'apps/admin',
  'apps/developer',
  'packages/shared',
  'packages/contracts',
  'packages/database',
  'packages/security',
  'packages/ui',
  'services/catalog',
  'services/playback',
  'services/search',
  'services/discovery',
  'services/recommendations',
  'services/rights',
  'services/royalties',
  'services/territory',
  'services/knowledge',
  'services/trust',
  'services/editorial',
  'services/analytics',
  'services/payments',
  'services/media',
  'services/notifications',
  'mobile/android'
];

const clientTargets = [
  ['Listener','Android','android'],
  ['Listener','iOS / iPadOS','ios'],
  ['Listener','Web','web'],
  ['Listener','Windows','windows'],
  ['Listener','macOS','macos'],
  ['Listener','Linux','linux'],
  ['Listener','Android / Google TV','tv-android'],
  ['Listener','Apple TV','tv-apple'],
  ['Listener','Samsung / LG TV','tv-smart'],
  ['Listener','PlayStation','playstation'],
  ['Listener','Xbox','xbox'],
  ['Listener','Android Auto','android-auto'],
  ['Listener','Apple CarPlay','carplay'],
  ['Listener','Wear OS','wear-os'],
  ['Listener','Apple Watch','watchos'],
  ['Listener','Garmin / Fitbit / Samsung Wearables','wearables'],
  ['Listener','Connected audio / speakers','audio-devices'],
  ['Listener','Voice integrations','voice'],
  ['Industry','Artist Studio','artist'],
  ['Industry','Label Portal','label'],
  ['Industry','Distributor Portal','distributor'],
  ['Industry','Publisher / Songwriter / Rights Portal','publisher-rights'],
  ['Industry','Royalty Operations','royalties'],
  ['Industry','Advertiser / Partner Portal','partners'],
  ['Industry','Licensing / Rights Operations','licensing'],
  ['Platform','Admin / Moderation / Operations','admin'],
  ['Platform','Developer Portal / API','developer']
];

const domainKeywords = {
  'apps/web':['react','vite','frontend','web'],
  'apps/api':['express','fastify','api','prisma','server'],
  'apps/artist':['artist','release','verification','studio'],
  'apps/admin':['admin','moderation','audit','trust'],
  'apps/developer':['developer','api contract','api scope','credential'],
  'packages/shared':['shared','contract','waeveuser','waevetrack'],
  'packages/contracts':['contract','openapi','api'],
  'packages/database':['schema','migration','postgres','prisma'],
  'packages/security':['security','auth','permission','rbac'],
  'packages/ui':['ui','component','design'],
  'services/catalog':['catalog','metadata','release','track'],
  'services/playback':['playback','audio','media3','queue'],
  'services/search':['search','index','retrieval'],
  'services/discovery':['discovery','recommendation','ranking'],
  'services/recommendations':['recommendation','ranking','candidate'],
  'services/rights':['rights','license','master','publishing'],
  'services/royalties':['royalty','ledger','split','payout'],
  'services/territory':['territory','country','regional'],
  'services/knowledge':['knowledge','entity','relation'],
  'services/trust':['trust','fraud','risk','moderation'],
  'services/editorial':['editorial','collection','chart'],
  'services/analytics':['analytics','event','warehouse','metric'],
  'services/payments':['payment','subscription','billing','entitlement'],
  'services/media':['media','transcode','storage','cdn','asset'],
  'services/notifications':['notification','push','email','delivery'],
  'mobile/android':['android','kotlin','compose','media3']
};

const sourceInventory = {};
for (const s of sourceDirs) {
  const files = walk(path.join(SOURCES, s));
  sourceInventory[s] = {
    files: files.length,
    android: files.filter(f => /android|\.kt$|AndroidManifest|build\.gradle/i.test(f)).length,
    web: files.filter(f => /react|vite|frontend|web/i.test(f)).length,
    api: files.filter(f => /backend|server|api|prisma|schema/i.test(f)).length,
    tests: files.filter(f => /test|spec/i.test(f)).length
  };
}

const canonical = {};
for (const d of canonicalDomains) {
  const dir = path.join(ROOT, d);
  const files = walk(dir);
  const pkg = path.join(dir, 'package.json');
  const pkgText = read(pkg);
  let pkgJson = null;
  try { pkgJson = JSON.parse(pkgText); } catch {}

  canonical[d] = {
    exists: fs.existsSync(dir),
    files: files.length,
    package: pkgJson?.name ?? null,
    build: Boolean(pkgJson?.scripts?.build),
    check: Boolean(pkgJson?.scripts?.check),
    test: Boolean(pkgJson?.scripts?.test),
    gradle: files.some(f => /(^|\/)gradlew$|build\.gradle(\.kts)?$|settings\.gradle(\.kts)?$/i.test(f)),
    typescript: files.some(f => /\.tsx?$/.test(f))
  };
}

const evidence = {};
for (const [domain, keywords] of Object.entries(domainKeywords)) {
  const matches = [];
  for (const s of sourceDirs) {
    const files = walk(path.join(SOURCES, s));
    const hits = files.filter(f => {
      const name = path.basename(f).toLowerCase();
      return keywords.some(k => name.includes(k.toLowerCase()));
    });
    if (hits.length) matches.push({ source: s, files: hits.length });
  }
  evidence[domain] = matches;
}

const clientEvidence = {};
for (const [family, name, key] of clientTargets) {
  const patterns = {
    android:['android','.kt','androidmanifest'],
    ios:['ios','swift','xcode'],
    web:['web','react','vite'],
    windows:['windows','winui','wpf'],
    macos:['macos','swift'],
    linux:['linux','gtk','qt','electron'],
    'tv-android':['tv','androidtv','android'],
    'tv-apple':['tvos','apple tv'],
    'tv-smart':['samsung','tizen','webos','lg'],
    playstation:['playstation','ps4','ps5'],
    xbox:['xbox','uwp'],
    'android-auto':['android auto','automotive'],
    carplay:['carplay','ios'],
    'wear-os':['wear os','wear'],
    watchos:['watchos','apple watch'],
    wearables:['garmin','fitbit','tizen','wear'],
    'audio-devices':['speaker','connect','cast','audio device'],
    voice:['voice','assistant'],
    artist:['artist','studio'],
    label:['label'],
    distributor:['distributor'],
    'publisher-rights':['publisher','songwriter','rights'],
    royalties:['royalty','royalties'],
    partners:['advert','partner'],
    licensing:['license','licensing'],
    admin:['admin','moderation'],
    developer:['developer','api']
  }[key] ?? [key];

  const hits = [];
  for (const s of sourceDirs) {
    const files = walk(path.join(SOURCES, s));
    const count = files.filter(f => {
      const n = f.toLowerCase();
      return patterns.some(p => n.includes(p));
    }).length;
    if (count) hits.push({ source: s, evidence: count });
  }

  const canonicalMatches = canonicalDomains.filter(d =>
    d.toLowerCase().includes(key) ||
    d.toLowerCase().includes(name.toLowerCase().replaceAll(' ','/'))
  );

  clientEvidence[`${family}:${name}`] = {
    family,
    client: name,
    canonicalHints: canonicalMatches,
    sourceEvidence: hits
  };
}

const matrix = {
  generatedAt: new Date().toISOString(),
  sourceVariants: sourceDirs.length,
  sourceFiles: Object.values(sourceInventory).reduce((a,b) => a+b.files, 0),
  canonicalDomains: canonical,
  clientTargets: clientEvidence,
  sourceInventory,
  domainSourceEvidence: evidence,
  externalDependencies: [
    'Commercial music licensing and territorial rights',
    'Production object storage and CDN',
    'Payment providers and billing webhooks',
    'Production identity and email providers',
    'App-store signing and distribution credentials',
    'Production transcoding and asynchronous media workers',
    'Royalty contracts, tax and regional legal configuration',
    'Platform SDKs and hardware required for client-specific builds'
  ]
};

fs.writeFileSync(
  path.join(OUT, 'WAEVE_CLIENT_PLATFORM_MATRIX.json'),
  JSON.stringify(matrix, null, 2)
);

const implemented = canonicalDomains.filter(d => canonical[d].exists).length;
const buildable = canonicalDomains.filter(d => canonical[d].build || canonical[d].gradle).length;
const testable = canonicalDomains.filter(d => canonical[d].test).length;

const lines = [
  '# WAEVE IMPLEMENTATION MATRIX',
  '',
  `Generated: ${matrix.generatedAt}`,
  `Preserved source variants: ${sourceDirs.length}`,
  `Classified source files: ${matrix.sourceFiles}`,
  `Canonical domain paths present: ${implemented}/${canonicalDomains.length}`,
  `Canonical build-capable domains: ${buildable}/${canonicalDomains.length}`,
  `Canonical explicit test scripts: ${testable}/${canonicalDomains.length}`,
  '',
  '## Canonical platform domains',
  '',
  '| Domain | Files | Package | Check | Build | Test | Gradle |',
  '|---|---:|---|:---:|:---:|:---:|:---:|'
];

for (const d of canonicalDomains) {
  const c = canonical[d];
  lines.push(
    `| ${d} | ${c.files} | ${c.package ?? '—'} | ${c.check?'YES':'—'} | ${c.build?'YES':'—'} | ${c.test?'YES':'—'} | ${c.gradle?'YES':'—'} |`
  );
}

lines.push('', '## Client targets', '', '| Family | Client | Source evidence |', '|---|---|---:|');

for (const [key, c] of Object.entries(clientEvidence)) {
  const count = c.sourceEvidence.reduce((a,b) => a+b.evidence, 0);
  lines.push(`| ${c.family} | ${c.client} | ${count} |`);
}

lines.push(
  '',
  '## Engineering policy',
  '',
  '- All required capabilities remain in current implementation scope.',
  '- Preserved source variants are never modified by this matrix.',
  '- Clients consume canonical APIs, contracts and event definitions.',
  '- A platform-specific environment limitation is recorded separately from implementation status.',
  '- No production feature is considered complete without implementation, integration and applicable verification evidence.',
  ''
);

fs.writeFileSync(
  path.join(OUT, 'WAEVE_IMPLEMENTATION_MATRIX.md'),
  lines.join('\n')
);

console.log('=== WAEVE IMPLEMENTATION MATRIX ===');
console.log(`Source variants: ${sourceDirs.length}`);
console.log(`Source files classified: ${matrix.sourceFiles}`);
console.log(`Canonical domains present: ${implemented}/${canonicalDomains.length}`);
console.log(`Build-capable domains: ${buildable}/${canonicalDomains.length}`);
console.log(`Domains with explicit tests: ${testable}/${canonicalDomains.length}`);
console.log(`Client targets registered: ${clientTargets.length}`);
console.log('Reports written:');
console.log('  tools/merge-state/WAEVE_CLIENT_PLATFORM_MATRIX.json');
console.log('  tools/merge-state/WAEVE_IMPLEMENTATION_MATRIX.md');
console.log('Original source variants: UNMODIFIED');
