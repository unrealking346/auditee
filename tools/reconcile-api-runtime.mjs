import {
  existsSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(".");
const API = join(ROOT, "apps", "api");
const STATE_FILE = join(ROOT, "tools", "merge-state", "state.json");

const candidates = [
  {
    name: "typescript-api",
    entry: "src/server.ts",
    package: "package.json",
    database: "prisma/schema.prisma"
  },
  {
    name: "global-javascript-api",
    entry: "src/server.js",
    package: "package.json",
    database: "prisma/schema.prisma"
  },
  {
    name: "legacy-backend",
    entry: "backend/server.js",
    package: "backend/package.json",
    database: "prisma/schema.prisma"
  },
  {
    name: "nested-server",
    entry: "waeve/server/server.js",
    package: "waeve/server/package.json",
    database: null
  }
];

function inspect(candidate) {
  const entry = join(API, candidate.entry);
  const pkg = join(API, candidate.package);
  const db = candidate.database
    ? join(API, candidate.database)
    : null;

  const result = {
    ...candidate,
    entryExists: existsSync(entry),
    packageExists: existsSync(pkg),
    databaseExists: db ? existsSync(db) : false
  };

  if (existsSync(pkg)) {
    try {
      const p = JSON.parse(readFileSync(pkg, "utf8"));
      result.packageName = p.name;
      result.moduleType = p.type || "commonjs";
      result.scripts = Object.keys(p.scripts || {});
      result.dependencies = Object.keys(p.dependencies || {});
    } catch {
      result.packageParseable = false;
    }
  }

  if (existsSync(entry)) {
    result.entryBytes = readFileSync(entry).length;
  }

  return result;
}

const inspected = candidates.map(inspect);

const schemaFiles = [
  join(API, "prisma", "schema.prisma"),
  join(
    ROOT,
    "_sources",
    "WAEVE-Global-Production-Services-4.0.0",
    "Waeve",
    "backend",
    "prisma",
    "schema.prisma"
  ),
  join(
    ROOT,
    "_sources",
    "WAEVE-Android-production-project",
    "Waeve",
    "infra",
    "schema.sql"
  ),
  join(
    ROOT,
    "_sources",
    "Waeve_2.0_EVERYTHING_GLOBAL_FINAL_SOURCE",
    "waeve",
    "server",
    "migrations"
  )
];

const schemaEvidence = [];

for (const file of schemaFiles) {
  if (!existsSync(file)) continue;

  if (file.endsWith(".prisma") || file.endsWith(".sql")) {
    const text = readFileSync(file, "utf8");

    schemaEvidence.push({
      path: file.replace(ROOT + "/", ""),
      bytes: text.length,
      models:
        (text.match(/^\s*model\s+\w+/gm) || []).length,
      tables:
        (text.match(/CREATE TABLE/gi) || []).length,
      enums:
        (text.match(/^\s*enum\s+\w+/gm) || []).length
    });
  }
}

const report = {
  candidates: inspected,
  schemaEvidence,
  selectionPolicy: [
    "Prefer a buildable TypeScript production API when dependencies and scripts support it.",
    "Prefer the broadest production schema only after compatibility is verified.",
    "Do not delete competing implementations.",
    "Do not overwrite existing source variants.",
    "Runtime selection is provisional until build and tests pass."
  ]
};

writeFileSync(
  join(ROOT, "tools", "merge-state", "api-runtime-reconciliation.json"),
  JSON.stringify(report, null, 2)
);

const state = JSON.parse(readFileSync(STATE_FILE, "utf8"));

state.apiRuntimeReconciliation = {
  status: "candidates-inspected",
  candidateCount: inspected.length,
  schemaEvidenceCount: schemaEvidence.length
};

state.completed = state.completed.filter(
  x => x !== "api-runtime-reconciliation"
);
state.completed.push("api-runtime-reconciliation");

writeFileSync(
  STATE_FILE,
  JSON.stringify(state, null, 2)
);

console.log("=== API RUNTIME RECONCILIATION ===");

for (const c of inspected) {
  console.log(
    `${c.name}: entry=${c.entryExists ? "yes" : "no"} ` +
    `package=${c.packageExists ? "yes" : "no"} ` +
    `db=${c.databaseExists ? "yes" : "no"}`
  );
}

console.log("\n=== DATABASE EVIDENCE ===");

for (const s of schemaEvidence) {
  console.log(
    `${s.path}: ${s.bytes} bytes, ` +
    `${s.models} models, ${s.tables} tables, ${s.enums} enums`
  );
}

console.log("\nAPI runtime reconciliation: REGISTERED");
console.log("No competing implementation deleted.");
console.log("Original source variants: UNMODIFIED");
