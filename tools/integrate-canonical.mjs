import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  copyFileSync
} from "node:fs";
import { join, resolve, relative, dirname } from "node:path";

const ROOT = resolve(".");
const SOURCES = join(ROOT, "_sources");
const STATE = join(ROOT, "tools", "merge-state");
const STATE_FILE = join(STATE, "state.json");
const REPORT_FILE = join(STATE, "canonical-integration-report.json");

const state = JSON.parse(readFileSync(STATE_FILE, "utf8"));

const productionSources = [
  "WAEVE-Global-Production-Services-4.0.0",
  "WAEVE-Complete-2.4.0-12-Screens",
  "WAEVE-Complete-2.2.0-UI-Matched",
  "WAEVE-Android-production-project",
  "Waeve_2.0_EVERYTHING_GLOBAL_FINAL_SOURCE"
];

const legacySource = "Waeve";

const report = {
  generatedAt: new Date().toISOString(),
  preservedSources: true,
  phases: [],
  selectedImplementations: [],
  retainedLegacyCapabilities: [],
  unresolvedConflicts: []
};

function walk(dir) {
  const result = [];

  if (!existsSync(dir)) return result;

  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", "dist", "build"].includes(entry)) continue;

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

function findFirst(sourceNames, patterns) {
  for (const sourceName of sourceNames) {
    const root = join(SOURCES, sourceName);

    for (const file of walk(root)) {
      const rel = relative(root, file).replaceAll("\\", "/");

      if (patterns.some(pattern => pattern.test(rel))) {
        return { sourceName, file, rel };
      }
    }
  }

  return null;
}

function recordSelection(role, item) {
  if (!item) return;

  report.selectedImplementations.push({
    role,
    source: item.sourceName,
    path: item.rel
  });
}

function copyIfMissing(item, destination) {
  if (!item) return false;

  if (!existsSync(destination)) {
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(item.file, destination);
    return true;
  }

  return false;
}

/*
 * 1. Production web foundation.
 */
const webApp = findFirst(
  productionSources,
  [
    /apps\/web\/src\/App\.tsx$/i,
    /apps\/web\/src\/main\.tsx$/i
  ]
);

if (webApp) {
  recordSelection("production-web-foundation", webApp);
}

/*
 * 2. Production API foundation.
 */
const apiPackage = findFirst(
  productionSources,
  [
    /apps\/api\/package\.json$/i,
    /backend\/package\.json$/i,
    /server\/package\.json$/i
  ]
);

if (apiPackage) {
  recordSelection("production-api-foundation", apiPackage);
}

/*
 * 3. Production database foundation.
 */
const databaseSchema = findFirst(
  productionSources,
  [
    /infra\/schema\.sql$/i,
    /backend\/prisma\/schema\.prisma$/i,
    /server\/migrations\/001_init\.sql$/i
  ]
);

if (databaseSchema) {
  recordSelection("production-database-reference", databaseSchema);
}

/*
 * 4. Native Android production implementation.
 */
const androidRoot = findFirst(
  [
    "WAEVE-Android-production-project",
    "WAEVE-Global-Production-Services-4.0.0",
    "WAEVE-Complete-2.4.0-12-Screens"
  ],
  [
    /mobile\/android\/.*build\.gradle/i,
    /mobile\/android\/.*settings\.gradle/i,
    /mobile\/android\/.*MainActivity/i
  ]
);

if (androidRoot) {
  recordSelection("android-production-foundation", androidRoot);
}

/*
 * 5. Explicitly preserve the richest legacy playback/playlist capabilities
 * as canonical integration inputs. They are not discarded in favor of the
 * smaller React implementation.
 */
const legacyFiles = [
  "frontend/js/music.js",
  "frontend/js/player.js",
  "frontend/js/playlist-player.js",
  "frontend/js/playlists.js",
  "frontend/js/playlist-management.js",
  "frontend/js/library-playlist-ui.js",
  "frontend/js/playlist-ui.js",
  "frontend/js/library-playlist-ui.js",
  "frontend/js/router.js",
  "frontend/js/storage.js",
  "frontend/js/app.js"
];

for (const rel of legacyFiles) {
  const source = join(SOURCES, legacySource, rel);

  if (existsSync(source)) {
    report.retainedLegacyCapabilities.push({
      capability: rel.includes("playlist")
        ? "playlist-system"
        : rel.includes("player")
          ? "playback-system"
          : rel.includes("music")
            ? "catalogue-system"
            : rel.includes("library")
              ? "library-system"
              : rel.includes("router")
                ? "routing-system"
                : "application-foundation",
      source: legacySource,
      path: rel
    });
  }
}

/*
 * 6. Create explicit integration areas rather than polluting the canonical
 * React application with incompatible legacy globals.
 */
const integrationRoot = join(ROOT, "apps", "web", "src", "integration");
mkdirSync(integrationRoot, { recursive: true });

const integrationManifest = {
  purpose:
    "Canonical Waeve integration boundary for capabilities originating from preserved source variants.",
  legacy: {
    source: legacySource,
    capabilities: report.retainedLegacyCapabilities
  },
  production: {
    preferredSources: productionSources
  },
  rules: [
    "Production implementations are preferred for security, authentication, API and deployment foundations.",
    "Legacy playback and playlist behavior is retained as an integration input.",
    "Existing canonical files are never silently overwritten.",
    "Preserved source variants remain immutable.",
    "No capability is marked complete until compilation, testing and integration verification succeed."
  ]
};

writeFileSync(
  join(integrationRoot, "integration-manifest.json"),
  JSON.stringify(integrationManifest, null, 2)
);

report.phases.push("production-foundations-identified");
report.phases.push("legacy-playback-capabilities-retained");
report.phases.push("canonical-integration-boundary-created");

/*
 * 7. Generate a compact machine-readable conflict index.
 */
const mergeReport = JSON.parse(
  readFileSync(join(STATE, "merge-assets-report.json"), "utf8")
);

report.unresolvedConflicts = mergeReport.conflicts.map(conflict => ({
  target: conflict.target,
  path: conflict.relative,
  candidates: conflict.candidates,
  selectedByAssetPass: conflict.selected
}));

writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

if (!state.completed.includes("canonical-integration")) {
  state.completed.push("canonical-integration");
}

state.integrationConflictCount = report.unresolvedConflicts.length;
state.legacyCapabilitiesRetained = report.retainedLegacyCapabilities.length;
state.integrationReport = REPORT_FILE;

writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

console.log("=== CANONICAL INTEGRATION PASS ===");
console.log(`Production foundation selections: ${report.selectedImplementations.length}`);
console.log(`Legacy capabilities retained: ${report.retainedLegacyCapabilities.length}`);
console.log(`Conflicts carried forward for implementation: ${report.unresolvedConflicts.length}`);
console.log(`Integration boundary: ${integrationRoot}`);
console.log(`Report: ${REPORT_FILE}`);
console.log("Preserved source variants: UNMODIFIED");
console.log("=== PASS COMPLETE ===");
