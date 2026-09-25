import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync
} from "node:fs";
import { join, resolve, relative } from "node:path";

const ROOT = resolve(".");
const SOURCES = join(ROOT, "_sources");
const STATE_DIR = join(ROOT, "tools", "merge-state");
const STATE_FILE = join(STATE_DIR, "state.json");
const REPORT_FILE = join(STATE_DIR, "domain-merge-report.json");

const state = JSON.parse(readFileSync(STATE_FILE, "utf8"));

const DOMAIN_RULES = {
  web: [
    /(^|\/)frontend(\/|$)/i,
    /(^|\/)apps\/web(\/|$)/i,
    /(^|\/)web(\/|$)/i
  ],
  api: [
    /(^|\/)backend(\/|$)/i,
    /(^|\/)server(\/|$)/i,
    /(^|\/)apps\/api(\/|$)/i,
    /(^|\/)api(\/|$)/i
  ],
  database: [
    /(^|\/)database(\/|$)/i,
    /(^|\/)db(\/|$)/i,
    /(^|\/)infra\/schema\.sql$/i,
    /(^|\/)server\/migrations(\/|$)/i,
    /(^|\/)backend\/prisma(\/|$)/i,
    /\.sql$/i,
    /schema\.prisma$/i
  ],
  services: [
    /(^|\/)services(\/|$)/i,
    /(^|\/)catalog(\/|$)/i,
    /(^|\/)playback(\/|$)/i,
    /(^|\/)discovery(\/|$)/i,
    /(^|\/)recommend/i,
    /(^|\/)rights(\/|$)/i,
    /(^|\/)royalt/i,
    /(^|\/)territory(\/|$)/i,
    /(^|\/)knowledge(\/|$)/i,
    /(^|\/)trust(\/|$)/i,
    /(^|\/)editorial(\/|$)/i,
    /(^|\/)analytics(\/|$)/i,
    /(^|\/)payments?(\/|$)/i,
    /(^|\/)media(\/|$)/i,
    /(^|\/)notifications?(\/|$)/i
  ],
  android: [
    /(^|\/)mobile\/android(\/|$)/i,
    /(^|\/)android(\/|$)/i,
    /\.gradle$/i,
    /\.gradle\.kts$/i,
    /AndroidManifest\.xml$/i,
    /(^|\/)src\/main\/.*\.kt$/i,
    /(^|\/)src\/main\/.*\.java$/i
  ],
  tests: [
    /(^|\/)tests?(\/|$)/i,
    /(^|\/)__tests__(\/|$)/i,
    /\.(test|spec)\.(js|jsx|ts|tsx)$/i
  ],
  infrastructure: [
    /(^|\/)infrastructure(\/|$)/i,
    /(^|\/)infra(\/|$)/i,
    /docker/i,
    /deployment/i,
    /nginx/i,
    /compose/i
  ]
};

function walk(dir) {
  const result = [];

  if (!existsSync(dir)) return result;

  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", "dist", "build", ".gradle"].includes(entry)) {
      continue;
    }

    const path = join(dir, entry);
    const info = statSync(path);

    if (info.isDirectory()) {
      result.push(...walk(path));
    } else {
      result.push(path);
    }
  }

  return result;
}

function classify(path) {
  const normalized = path.replaceAll("\\", "/");

  for (const [domain, rules] of Object.entries(DOMAIN_RULES)) {
    if (rules.some(rule => rule.test(normalized))) {
      return domain;
    }
  }

  return null;
}

const report = {
  generatedAt: new Date().toISOString(),
  preservedSources: true,
  sourceVariants: 0,
  totalFiles: 0,
  domains: {},
  capabilityFamilies: {}
};

const variants = readdirSync(SOURCES)
  .filter(name => statSync(join(SOURCES, name)).isDirectory())
  .sort();

report.sourceVariants = variants.length;

for (const domain of Object.keys(DOMAIN_RULES)) {
  report.domains[domain] = {
    files: 0,
    variants: new Set(),
    paths: []
  };
}

for (const variant of variants) {
  const sourceRoot = join(SOURCES, variant);

  for (const file of walk(sourceRoot)) {
    const rel = relative(sourceRoot, file).replaceAll("\\", "/");
    report.totalFiles++;

    const domain = classify(rel);

    if (!domain) continue;

    const entry = {
      source: variant,
      path: rel,
      size: statSync(file).size
    };

    report.domains[domain].files++;
    report.domains[domain].variants.add(variant);
    report.domains[domain].paths.push(entry);
  }
}

for (const domain of Object.keys(report.domains)) {
  report.domains[domain].variants = [
    ...report.domains[domain].variants
  ].sort();
}

/*
 * Capability families are intentionally broad. They allow the later
 * reconciliation pass to combine implementations rather than treating
 * every filename collision as a feature collision.
 */
const capabilityPatterns = {
  playback: /player|playback|audio|media3/i,
  playlists: /playlist/i,
  library: /library/i,
  catalogue: /catalog|music|track|album|artist/i,
  search: /search/i,
  discovery: /discover|recommend|radio|chart/i,
  identity: /auth|login|register|session|user/i,
  rights: /rights?|license|territor/i,
  royalties: /royalt|ledger|payout|split/i,
  analytics: /analytic|event|metric/i,
  moderation: /moderation|report|trust|fraud/i,
  payments: /payment|billing|subscription|premium/i,
  notifications: /notification/i,
  infrastructure: /docker|nginx|deploy|terraform|kubernetes/i
};

for (const [family, pattern] of Object.entries(capabilityPatterns)) {
  const matches = [];

  for (const variant of variants) {
    for (const file of walk(join(SOURCES, variant))) {
      const rel = relative(join(SOURCES, variant), file)
        .replaceAll("\\", "/");

      if (pattern.test(rel)) {
        matches.push({
          source: variant,
          path: rel
        });
      }
    }
  }

  report.capabilityFamilies[family] = {
    files: matches.length,
    variants: [...new Set(matches.map(x => x.source))].sort()
  };
}

const serializable = JSON.parse(
  JSON.stringify(report, null, 2)
);

writeFileSync(
  REPORT_FILE,
  JSON.stringify(serializable, null, 2)
);

if (!state.completed.includes("domain-analysis")) {
  state.completed.push("domain-analysis");
}

state.domainAnalysis = {
  sourceVariants: report.sourceVariants,
  totalFiles: report.totalFiles,
  report: REPORT_FILE
};

writeFileSync(
  STATE_FILE,
  JSON.stringify(state, null, 2)
);

console.log("=== WAEVE DOMAIN ANALYSIS ===");
console.log(`Source variants: ${report.sourceVariants}`);
console.log(`Total source files: ${report.totalFiles}`);

for (const [domain, info] of Object.entries(report.domains)) {
  console.log(
    `${domain}: ${info.files} files / ${info.variants.length} variants`
  );
}

console.log("\nCapability families:");

for (const [family, info] of Object.entries(report.capabilityFamilies)) {
  console.log(
    `${family}: ${info.files} files / ${info.variants.length} variants`
  );
}

console.log(`\nReport: ${REPORT_FILE}`);
console.log("Original sources: UNMODIFIED");
console.log("=== DOMAIN ANALYSIS COMPLETE ===");
