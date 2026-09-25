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
const SOURCE = join(
  ROOT,
  "_sources",
  "WAEVE-Global-Production-Services-4.0.0",
  "Waeve",
  "backend"
);
const DEST = join(ROOT, "apps", "api");
const STATE_FILE = join(ROOT, "tools", "merge-state", "state.json");

if (!existsSync(SOURCE)) {
  throw new Error(`Production backend source not found: ${SOURCE}`);
}

function walk(dir) {
  const result = [];

  for (const name of readdirSync(dir)) {
    if (["node_modules", ".git", "dist", "build"].includes(name)) continue;

    const path = join(dir, name);
    const info = statSync(path);

    if (info.isDirectory()) {
      result.push(...walk(path));
    } else {
      result.push(path);
    }
  }

  return result;
}

const copied = [];
const preserved = [];

for (const source of walk(SOURCE)) {
  const rel = relative(SOURCE, source).replaceAll("\\", "/");

  /*
   * Keep the canonical integration manifests and future canonical files
   * untouched. Everything else from the selected production baseline may
   * populate currently-empty API locations.
   */
  const destination = join(DEST, rel);

  if (existsSync(destination)) {
    preserved.push(rel);
    continue;
  }

  mkdirSync(join(destination, ".."), { recursive: true });
  copyFileSync(source, destination);
  copied.push(rel);
}

const manifest = {
  canonicalPackage: "@waeve/api",
  implementationBaseline:
    "WAEVE-Global-Production-Services-4.0.0",
  sourcePath:
    "backend",
  copied,
  preserved,
  rules: [
    "The selected production backend is the canonical implementation baseline.",
    "Other preserved backend variants remain reconciliation inputs.",
    "Existing canonical files are never overwritten.",
    "Original source variants remain untouched.",
    "Feature completion requires build, tests, integration and verification."
  ]
};

writeFileSync(
  join(DEST, "BACKEND_IMPLEMENTATION_MANIFEST.json"),
  JSON.stringify(manifest, null, 2)
);

const state = JSON.parse(readFileSync(STATE_FILE, "utf8"));

state.completed = state.completed.filter(
  x => x !== "backend-implementation-baseline"
);
state.completed.push("backend-implementation-baseline");

state.backendImplementation = {
  status: "production-baseline-activated",
  source: "WAEVE-Global-Production-Services-4.0.0",
  copied: copied.length,
  preserved: preserved.length
};

writeFileSync(
  STATE_FILE,
  JSON.stringify(state, null, 2)
);

console.log("=== WAEVE BACKEND IMPLEMENTATION ===");
console.log(`Baseline: WAEVE-Global-Production-Services-4.0.0`);
console.log(`Implementation files activated: ${copied.length}`);
console.log(`Canonical files preserved: ${preserved.length}`);
console.log("Original source variants: UNMODIFIED");
console.log("Backend implementation baseline: ACTIVATED");
