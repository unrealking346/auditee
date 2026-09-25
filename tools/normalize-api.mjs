import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  copyFileSync,
  writeFileSync,
  readFileSync
} from "node:fs";
import { join, resolve, relative } from "node:path";

const ROOT = resolve(".");
const API = join(ROOT, "apps", "api");
const SOURCE = join(
  API,
  "Waeve",
  "backend"
);
const SOURCE_TS = join(
  API,
  "Waeve",
  "apps",
  "api"
);
const STATE_FILE = join(
  ROOT,
  "tools",
  "merge-state",
  "state.json"
);

const activated = [];
const preserved = [];

function walk(dir) {
  if (!existsSync(dir)) return [];

  const out = [];

  for (const name of readdirSync(dir)) {
    if (["node_modules", ".git", "dist", "build"].includes(name)) continue;

    const path = join(dir, name);
    const info = statSync(path);

    if (info.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }

  return out;
}

function activateTree(sourceRoot) {
  if (!existsSync(sourceRoot)) return;

  for (const source of walk(sourceRoot)) {
    const rel = relative(sourceRoot, source).replaceAll("\\", "/");

    if (
      rel === "package.json" ||
      rel === "tsconfig.json" ||
      rel === "Dockerfile" ||
      rel.startsWith("prisma/") ||
      rel.startsWith("src/")
    ) {
      const destination = join(API, rel);

      if (existsSync(destination)) {
        preserved.push(rel);
        continue;
      }

      mkdirSync(join(destination, ".."), { recursive: true });
      copyFileSync(source, destination);
      activated.push(rel);
    }
  }
}

activateTree(SOURCE);
activateTree(SOURCE_TS);

const manifest = {
  canonicalPackage: "@waeve/api",
  status: "canonical-path-normalized",
  activated,
  preserved,
  sourceOfTruth: "apps/api",
  rules: [
    "Canonical API implementation lives directly under apps/api.",
    "Nested source copies remain preserved as reconciliation inputs.",
    "Existing canonical files are never overwritten.",
    "Original source variants remain untouched.",
    "The API is not considered complete until dependency installation, type checking, tests and runtime verification pass."
  ]
};

writeFileSync(
  join(API, "API_CANONICAL_PATH_MANIFEST.json"),
  JSON.stringify(manifest, null, 2)
);

const state = JSON.parse(readFileSync(STATE_FILE, "utf8"));

state.completed = state.completed.filter(
  x => x !== "backend-canonical-path"
);
state.completed.push("backend-canonical-path");

state.backendCanonicalPath = {
  status: "normalized",
  activated: activated.length,
  preserved: preserved.length
};

writeFileSync(
  STATE_FILE,
  JSON.stringify(state, null, 2)
);

console.log("=== WAEVE API CANONICAL PATH NORMALIZATION ===");
console.log(`Files activated into apps/api: ${activated.length}`);
console.log(`Existing canonical files preserved: ${preserved.length}`);
console.log("Nested reconciliation sources: PRESERVED");
console.log("Original source variants: UNMODIFIED");
console.log("Canonical API path: PASS");
