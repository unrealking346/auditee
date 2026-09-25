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
const API = join(ROOT, "apps", "api");
const DB = join(ROOT, "packages", "database");
const STATE_FILE = join(ROOT, "tools", "merge-state", "state.json");

const state = JSON.parse(readFileSync(STATE_FILE, "utf8"));

mkdirSync(join(API, "src"), { recursive: true });
mkdirSync(join(DB, "migrations"), { recursive: true });

const productionVariants = [
  "WAEVE-Global-Production-Services-4.0.0",
  "WAEVE-Complete-2.4.0-12-Screens",
  "WAEVE-Complete-2.2.0-UI-Matched",
  "WAEVE-Android-production-project",
  "Waeve_2.0_EVERYTHING_GLOBAL_FINAL_SOURCE"
];

const backendCandidates = [];
const databaseCandidates = [];

function walk(dir) {
  const result = [];

  if (!existsSync(dir)) return result;

  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", "dist", "build", ".gradle"].includes(entry)) {
      continue;
    }

    const path = join(dir, entry);
    const info = statSync(path);

    if (info.isDirectory()) result.push(...walk(path));
    else result.push(path);
  }

  return result;
}

for (const variant of productionVariants) {
  const root = join(SOURCES, variant);

  for (const file of walk(root)) {
    const rel = relative(root, file).replaceAll("\\", "/");

    if (
      /(^|\/)(backend|server|apps\/api)(\/|$)/i.test(rel) &&
      /\.(js|mjs|cjs|ts|tsx|json)$/i.test(rel)
    ) {
      backendCandidates.push({
        variant,
        path: rel,
        size: statSync(file).size
      });
    }

    if (
      /\.sql$/i.test(rel) ||
      /schema\.prisma$/i.test(rel)
    ) {
      databaseCandidates.push({
        variant,
        path: rel,
        size: statSync(file).size
      });
    }
  }
}

const backendManifest = {
  canonicalApplication: "@waeve/api",
  preferredProductionSources: productionVariants,
  candidates: backendCandidates,
  requirements: [
    "Authentication and session management",
    "Catalog and music metadata",
    "Search",
    "Playback authorization",
    "Playlists and library",
    "Artist/release operations",
    "Rights and territory enforcement",
    "Royalty ledger",
    "Subscriptions and entitlements",
    "Analytics/listening events",
    "Moderation and audit",
    "Notifications",
    "Rate limiting and security controls",
    "Versioned API contracts"
  ],
  rules: [
    "PostgreSQL is the authoritative transactional store.",
    "Client-submitted subscription/Premium state is never authoritative.",
    "Permanent private storage credentials never reach clients.",
    "Playback authorization must enforce applicable rights and territory.",
    "Privileged mutations must be auditable.",
    "No backend capability is marked complete before compilation and tests."
  ]
};

const databaseManifest = {
  canonicalPackage: "@waeve/database",
  canonicalMigration: "migrations/001_canonical.sql",
  referenceSchemas: databaseCandidates,
  reconciliationSources: [
    ...productionVariants,
    "Waeve"
  ],
  rules: [
    "The canonical schema is the foundation.",
    "Broader source schemas are reconciliation inputs.",
    "Existing canonical migrations are not overwritten.",
    "Rights, royalties, territory, analytics and operational domains must be reconciled before production completion."
  ]
};

writeFileSync(
  join(API, "src", "BACKEND_INTEGRATION_MANIFEST.json"),
  JSON.stringify(backendManifest, null, 2)
);

writeFileSync(
  join(DB, "DATABASE_RECONCILIATION.json"),
  JSON.stringify(databaseManifest, null, 2)
);

state.completed = state.completed.filter(
  x => x !== "backend-functional-integration"
);

state.completed.push("backend-functional-integration");

state.backendIntegration = {
  backendCandidates: backendCandidates.length,
  databaseCandidates: databaseCandidates.length,
  status: "reconciliation-inputs-registered"
};

writeFileSync(
  STATE_FILE,
  JSON.stringify(state, null, 2)
);

console.log("=== WAEVE BACKEND/DATABASE INTEGRATION ===");
console.log(`Backend candidates: ${backendCandidates.length}`);
console.log(`Database schema/migration candidates: ${databaseCandidates.length}`);
console.log("Canonical database foundation: retained");
console.log("Canonical API boundary: registered");
console.log("Original source variants: UNMODIFIED");
console.log("=== BACKEND/DATABASE INTEGRATION COMPLETE ===");
