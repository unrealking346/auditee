#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCES = path.join(ROOT, "_sources");
const STATE = path.join(ROOT, "tools", "merge-state");

fs.mkdirSync(STATE, { recursive: true });

const CANONICAL = {
  apps: {
    web: "apps/web",
    api: "apps/api",
    artist: "apps/artist",
    admin: "apps/admin",
    developer: "apps/developer"
  },
  packages: {
    shared: "packages/shared",
    contracts: "packages/contracts",
    database: "packages/database",
    security: "packages/security",
    ui: "packages/ui"
  },
  services: {
    catalog: "services/catalog",
    playback: "services/playback",
    search: "services/search",
    discovery: "services/discovery",
    recommendations: "services/recommendations",
    rights: "services/rights",
    royalties: "services/royalties",
    territory: "services/territory",
    knowledge: "services/knowledge",
    trust: "services/trust",
    editorial: "services/editorial",
    analytics: "services/analytics",
    payments: "services/payments",
    media: "services/media",
    notifications: "services/notifications"
  },
  mobile: {
    android: "mobile/android"
  },
  infrastructure: {
    root: "infrastructure"
  },
  tests: {
    root: "tests"
  }
};

const SOURCE_PATTERNS = {
  web: [
    /(^|\/)frontend\//,
    /(^|\/)apps\/web\//,
    /(^|\/)web\//
  ],
  api: [
    /(^|\/)backend\//,
    /(^|\/)server\//,
    /(^|\/)apps\/api\//,
    /(^|\/)api\//
  ],
  artist: [
    /artist-studio/i,
    /apps\/artist/i
  ],
  admin: [
    /apps\/admin/i,
    /admin/i
  ],
  developer: [
    /apps\/developer/i,
    /developer/i
  ],
  contracts: [
    /contracts/i,
    /openapi/i,
    /swagger/i
  ],
  database: [
    /\.sql$/i,
    /schema\.prisma$/i,
    /migrations?\//i,
    /(^|\/)database\//i,
    /(^|\/)db\//i
  ],
  security: [
    /security/i,
    /auth/i,
    /permission/i,
    /rbac/i
  ],
  ui: [
    /(^|\/)ui\//i,
    /design-system/i,
    /components/i
  ],
  catalog: [
    /catalog/i,
    /music\.json/i,
    /release/i,
    /album/i,
    /track/i
  ],
  playback: [
    /player/i,
    /playback/i,
    /audio/i,
    /media3/i
  ],
  search: [
    /search/i,
    /meilisearch/i,
    /elasticsearch/i
  ],
  discovery: [
    /discover/i,
    /discovery/i,
    /radio/i,
    /chart/i,
    /mix/i
  ],
  recommendations: [
    /recommend/i,
    /personaliz/i
  ],
  rights: [
    /rights/i,
    /license/i,
    /territor/i
  ],
  royalties: [
    /royalt/i,
    /payout/i,
    /split/i,
    /statement/i
  ],
  territory: [
    /territor/i,
    /region/i,
    /country/i
  ],
  knowledge: [
    /knowledge/i,
    /music.*graph/i,
    /metadata/i
  ],
  trust: [
    /trust/i,
    /fraud/i,
    /moderation/i,
    /abuse/i
  ],
  editorial: [
    /editorial/i,
    /cms/i,
    /featured/i
  ],
  analytics: [
    /analytic/i,
    /metric/i,
    /warehouse/i,
    /event/i
  ],
  payments: [
    /payment/i,
    /billing/i,
    /subscription/i,
    /commerce/i
  ],
  media: [
    /media/i,
    /transcod/i,
    /ffmpeg/i,
    /storage/i,
    /cdn/i
  ],
  notifications: [
    /notification/i,
    /push/i,
    /fcm/i,
    /apns/i
  ],
  infrastructure: [
    /docker/i,
    /compose/i,
    /nginx/i,
    /deployment/i,
    /infrastructure/i,
    /terraform/i,
    /kubernetes/i,
    /\.ya?ml$/i
  ],
  android: [
    /(^|\/)mobile\/android\//i,
    /(^|\/)android\//i,
    /AndroidManifest\.xml$/i,
    /\.gradle(?:\.kts)?$/i,
    /(^|\/)src\/main\/.*\.(kt|java)$/i
  ],
  tests: [
    /(^|\/)tests?\//i,
    /__tests__\//i,
    /\.(test|spec)\.(js|jsx|ts|tsx)$/i
  ]
};

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const result = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (["node_modules", ".git", "dist", "build", ".gradle"].includes(entry.name))
        continue;

      const absolute = path.join(current, entry.name);

      if (entry.isDirectory()) walk(absolute);
      else result.push(absolute);
    }
  }

  walk(dir);
  return result;
}

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function ensure(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeCopy(source, destination) {
  ensure(path.dirname(destination));

  if (fs.existsSync(destination)) {
    const a = read(source);
    const b = read(destination);

    if (a === b) return "identical";
    return "conflict";
  }

  fs.copyFileSync(source, destination);
  return "copied";
}

function classify(relative) {
  const matches = [];

  for (const [domain, patterns] of Object.entries(SOURCE_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(relative))) {
      matches.push(domain);
    }
  }

  return matches;
}

console.log("=== WAEVE FULL ECOSYSTEM RECONCILIATION ===");

if (!fs.existsSync(SOURCES)) {
  console.error("BLOCKER: _sources directory is missing.");
  process.exit(1);
}

const sourceVariants = fs.readdirSync(SOURCES, { withFileTypes: true })
  .filter(e => e.isDirectory());

console.log(`Preserved source variants: ${sourceVariants.length}`);

if (sourceVariants.length < 18) {
  console.error("BLOCKER: expected at least 18 preserved source variants.");
  process.exit(1);
}

const report = {
  generatedAt: new Date().toISOString(),
  sourceVariants: sourceVariants.map(e => e.name),
  preserved: true,
  domains: {},
  copied: 0,
  identical: 0,
  conflicts: 0,
  sourceFiles: 0
};

for (const group of Object.values(CANONICAL)) {
  for (const rel of Object.values(group)) {
    ensure(path.join(ROOT, rel));
  }
}

for (const domain of Object.keys(SOURCE_PATTERNS)) {
  report.domains[domain] = {
    sourceFiles: 0,
    copied: 0,
    identical: 0,
    conflicts: 0,
    sourceVariants: new Set(),
    canonicalPath:
      CANONICAL.apps?.[domain] ||
      CANONICAL.packages?.[domain] ||
      CANONICAL.services?.[domain] ||
      CANONICAL.mobile?.[domain] ||
      CANONICAL.infrastructure?.[domain] ||
      CANONICAL.tests?.[domain] ||
      null
  };
}

for (const variant of sourceVariants) {
  const variantRoot = path.join(SOURCES, variant.name);
  const files = listFiles(variantRoot);

  for (const absolute of files) {
    const relative = path.relative(variantRoot, absolute).replaceAll("\\", "/");
    const domains = classify(relative);

    report.sourceFiles++;

    for (const domain of domains) {
      const d = report.domains[domain];

      d.sourceFiles++;
      d.sourceVariants.add(variant.name);

      let destinationRoot = d.canonicalPath;

      if (!destinationRoot) continue;

      /*
       * Preserve the source's relative structure beneath the canonical
       * domain rather than flattening unrelated implementations.
       */
      let clean = relative;

      clean = clean.replace(/^Waeve\//i, "");
      clean = clean.replace(/^waeve\//i, "");
      clean = clean.replace(/^Waeve_Final_Build_1\.0\.0\//i, "");

      /*
       * Don't inject an entire nested application tree into the canonical
       * root. For known domain roots, remove the matching source prefix.
       */
      clean = clean.replace(/^apps\/(?:web|api|artist|admin|developer)\//i, "");
      clean = clean.replace(/^services\/[^/]+\//i, "");
      clean = clean.replace(/^packages\/[^/]+\//i, "");
      clean = clean.replace(/^mobile\/android\//i, "");

      const destination = path.join(ROOT, destinationRoot, clean);

      const result = safeCopy(absolute, destination);

      if (result === "copied") {
        d.copied++;
        report.copied++;
      } else if (result === "identical") {
        d.identical++;
        report.identical++;
      } else if (result === "conflict") {
        d.conflicts++;
        report.conflicts++;
      }
    }
  }
}

for (const d of Object.values(report.domains)) {
  d.sourceVariants = [...d.sourceVariants];
}

console.log("\n=== DOMAIN RECONCILIATION ===");

for (const [domain, d] of Object.entries(report.domains)) {
  const status =
    d.sourceFiles === 0
      ? "NO_SOURCE_EVIDENCE"
      : d.copied > 0
        ? "INTEGRATED"
        : d.identical > 0
          ? "ALREADY_PRESENT"
          : "CONFLICT_ONLY";

  d.status = status;

  console.log(
    `${domain.padEnd(16)} ${status.padEnd(20)} ` +
    `source=${d.sourceFiles} copied=${d.copied} ` +
    `same=${d.identical} conflicts=${d.conflicts}`
  );
}

console.log("\n=== WORKSPACE RECONCILIATION ===");

const packageFiles = [];

for (const root of ["apps", "packages", "services"]) {
  const dir = path.join(ROOT, root);
  if (!fs.existsSync(dir)) continue;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const packageFile = path.join(dir, entry.name, "package.json");

    if (fs.existsSync(packageFile)) {
      packageFiles.push(path.relative(ROOT, packageFile));
    }
  }
}

console.log(`Detected package workspaces: ${packageFiles.length}`);

const rootPackage = JSON.parse(read(path.join(ROOT, "package.json")));

const expectedWorkspaces = [
  ...Object.values(CANONICAL.apps),
  ...Object.values(CANONICAL.packages),
  ...Object.values(CANONICAL.services)
];

const current = new Set(rootPackage.workspaces || []);
const added = [];

for (const workspace of expectedWorkspaces) {
  if (!current.has(workspace) && fs.existsSync(path.join(ROOT, workspace, "package.json"))) {
    current.add(workspace);
    added.push(workspace);
  }
}

rootPackage.workspaces = [...current];

fs.writeFileSync(
  path.join(ROOT, "package.json"),
  JSON.stringify(rootPackage, null, 2) + "\n"
);

console.log(`Workspace registrations added: ${added.length}`);

for (const item of added) console.log(`+ ${item}`);

console.log("\n=== ANDROID RECONCILIATION ===");

const android = report.domains.android;

if (android.sourceFiles > 0) {
  const androidRoot = path.join(ROOT, "mobile/android");
  const gradleFiles = listFiles(androidRoot).filter(f =>
    /(^|\/)(settings\.gradle(?:\.kts)?|build\.gradle(?:\.kts)?|gradlew)$/.test(f)
  );

  console.log(`Android source files: ${android.sourceFiles}`);
  console.log(`Canonical Android files: ${listFiles(androidRoot).length}`);
  console.log(`Gradle entrypoints: ${gradleFiles.length}`);

  if (gradleFiles.length === 0) {
    android.status = "SOURCE_INTEGRATED_BUILD_ENTRYPOINT_REQUIRED";
  } else {
    android.status = "BUILD_ENTRYPOINT_PRESENT";
  }
} else {
  android.status = "NO_SOURCE_EVIDENCE";
}

console.log("\n=== SERVICE RECONCILIATION ===");

const serviceNames = Object.keys(CANONICAL.services);

for (const service of serviceNames) {
  const d = report.domains[service];

  if (d.sourceFiles === 0) {
    console.log(`${service}: no source evidence`);
    continue;
  }

  const serviceRoot = path.join(ROOT, CANONICAL.services[service]);
  const files = listFiles(serviceRoot);

  console.log(`${service}: ${files.length} canonical files`);
}

console.log("\n=== CONFLICT REGISTER ===");

const conflicts = [];

for (const [domain, d] of Object.entries(report.domains)) {
  if (d.conflicts > 0) {
    conflicts.push({
      domain,
      conflicts: d.conflicts,
      sourceVariants: d.sourceVariants
    });
  }
}

console.log(`Conflicting files: ${report.conflicts}`);

if (conflicts.length) {
  for (const item of conflicts) {
    console.log(`- ${item.domain}: ${item.conflicts}`);
  }
}

report.conflictRegister = conflicts;

report.status =
  report.conflicts > 0
    ? "INTEGRATED_WITH_RECONCILIATION_CONFLICTS"
    : "INTEGRATED";

fs.writeFileSync(
  path.join(STATE, "full-ecosystem-integration.json"),
  JSON.stringify(report, null, 2)
);

fs.writeFileSync(
  path.join(STATE, "ecosystem-integration-status.json"),
  JSON.stringify({
    generatedAt: report.generatedAt,
    status: report.status,
    sourceVariants: sourceVariants.length,
    sourceFiles: report.sourceFiles,
    copied: report.copied,
    identical: report.identical,
    conflicts: report.conflicts,
    domains: Object.fromEntries(
      Object.entries(report.domains).map(([k, v]) => [k, {
        status: v.status,
        sourceFiles: v.sourceFiles,
        copied: v.copied,
        conflicts: v.conflicts
      }])
    )
  }, null, 2)
);

console.log("\n=== FULL ECOSYSTEM RECONCILIATION RESULT ===");
console.log(`Status: ${report.status}`);
console.log(`Source files classified: ${report.sourceFiles}`);
console.log(`Files newly integrated: ${report.copied}`);
console.log(`Identical files retained: ${report.identical}`);
console.log(`Conflicts preserved: ${report.conflicts}`);
console.log(`Source variants modified: 0`);
console.log(`Reports: tools/merge-state/full-ecosystem-integration.json`);

if (report.conflicts > 0) {
  console.log("\nIntegration completed with conflicts preserved for controlled reconciliation.");
}
