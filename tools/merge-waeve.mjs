import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = resolve(".");
const SOURCES = join(ROOT, "_sources");
const STATE_DIR = join(ROOT, "tools", "merge-state");
const STATE_FILE = join(STATE_DIR, "state.json");
const LOG_FILE = join(STATE_DIR, "merge.log");

mkdirSync(STATE_DIR, { recursive: true });

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  writeFileSync(LOG_FILE, line + "\n", { flag: "a" });
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadState() {
  if (!existsSync(STATE_FILE)) {
    return {
      version: 1,
      project: "Waeve",
      completed: [],
      startedAt: new Date().toISOString()
    };
  }

  return JSON.parse(readFileSync(STATE_FILE, "utf8"));
}

function countFiles(directory) {
  let count = 0;

  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const info = statSync(path);

    if (info.isDirectory()) {
      count += countFiles(path);
    } else {
      count++;
    }
  }

  return count;
}

function run(command, args = []) {
  return execFileSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

const state = loadState();

log("=== WAEVE TERMUX MERGE ORCHESTRATOR ===");
log(`Workspace: ${ROOT}`);

if (!existsSync(SOURCES)) {
  throw new Error(`Preserved source directory missing: ${SOURCES}`);
}

const sourceVariants = readdirSync(SOURCES)
  .filter(name => statSync(join(SOURCES, name)).isDirectory())
  .sort();

log(`Preserved source variants: ${sourceVariants.length}`);

if (!state.completed.includes("source-integrity")) {
  let totalFiles = 0;

  for (const variant of sourceVariants) {
    totalFiles += countFiles(join(SOURCES, variant));
  }

  state.sourceVariants = sourceVariants;
  state.sourceFileCount = totalFiles;
  state.completed.push("source-integrity");
  saveState(state);

  log(`Source integrity recorded: ${totalFiles} files.`);
} else {
  log("Source integrity already recorded; skipping.");
}

if (!state.completed.includes("workspace-check")) {
  const required = [
    "apps",
    "packages",
    "services",
    "database",
    "infrastructure",
    "docs",
    "tests"
  ];

  const missing = required.filter(
    directory => !existsSync(join(ROOT, directory))
  );

  if (missing.length) {
    throw new Error(`Canonical directories missing: ${missing.join(", ")}`);
  }

  state.completed.push("workspace-check");
  saveState(state);

  log("Canonical workspace check passed.");
} else {
  log("Workspace check already completed; skipping.");
}

if (!state.completed.includes("toolchain-check")) {
  const checks = [
    ["node", ["--version"]],
    ["npm", ["--version"]],
    ["java", ["-version"]]
  ];

  for (const [command, args] of checks) {
    try {
      const output = run(command, args).trim();
      log(`${command}: ${output || "available"}`);
    } catch {
      throw new Error(`Required Termux tool unavailable: ${command}`);
    }
  }

  state.completed.push("toolchain-check");
  saveState(state);

  log("Termux toolchain check passed.");
} else {
  log("Toolchain check already completed; skipping.");
}

log("Controller is ready.");
log(`Checkpoint: ${STATE_FILE}`);
log("No source variant was modified.");
log("No source variant was deleted.");
log("No merge operation has been performed yet.");

import { copyFileSync } from "node:fs";

const CANONICAL = {
  web: join(ROOT, "apps", "web"),
  api: join(ROOT, "apps", "api"),
  artist: join(ROOT, "apps", "artist"),
  admin: join(ROOT, "apps", "admin"),
  developer: join(ROOT, "apps", "developer"),
  shared: join(ROOT, "packages", "shared"),
  contracts: join(ROOT, "packages", "contracts"),
  database: join(ROOT, "packages", "database"),
  security: join(ROOT, "packages", "security"),
  ui: join(ROOT, "packages", "ui"),
  services: join(ROOT, "services"),
  infrastructure: join(ROOT, "infrastructure"),
  docs: join(ROOT, "docs"),
  tests: join(ROOT, "tests")
};

const SKIP = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".gradle",
  ".idea"
]);

const SOURCE_RULES = [
  { test: /(^|\/)(frontend|web|apps\/web)(\/|$)/i, target: "web" },
  { test: /(^|\/)(backend|server|api|apps\/api)(\/|$)/i, target: "api" },
  { test: /(^|\/)(artist|artist-studio)(\/|$)/i, target: "artist" },
  { test: /(^|\/)(admin)(\/|$)/i, target: "admin" },
  { test: /(^|\/)(developer|sdk)(\/|$)/i, target: "developer" },
  { test: /(^|\/)(database|db|migrations)(\/|$)/i, target: "database" },
  { test: /(^|\/)(services)(\/|$)/i, target: "services" },
  { test: /(^|\/)(infrastructure|infra|docker|deployment)(\/|$)/i, target: "infrastructure" },
  { test: /(^|\/)(tests?|__tests__)(\/|$)/i, target: "tests" },
  { test: /(^|\/)(docs?|documentation)(\/|$)/i, target: "docs" }
];

function classify(relative) {
  for (const rule of SOURCE_RULES) {
    if (rule.test.test(relative)) return rule.target;
  }

  if (/\.(sql|prisma)$/i.test(relative)) return "database";
  if (/\.(tsx?|jsx?|css|html|svg)$/i.test(relative)) return "web";
  if (/package\.json$/i.test(relative)) return "shared";
  return "docs";
}

function walk(directory, relative = "") {
  const result = [];

  for (const entry of readdirSync(directory)) {
    if (SKIP.has(entry)) continue;

    const absolute = join(directory, entry);
    const rel = relative ? join(relative, entry) : entry;
    const info = statSync(absolute);

    if (info.isDirectory()) {
      result.push(...walk(absolute, rel));
    } else {
      result.push({ absolute, relative: rel, size: info.size });
    }
  }

  return result;
}

function safeTarget(target, relative) {
  const base = CANONICAL[target] ?? CANONICAL.docs;
  return join(base, relative);
}

if (!state.completed.includes("source-inventory")) {
  const manifest = [];

  for (const variant of sourceVariants) {
    const root = join(SOURCES, variant);
    const files = walk(root);

    for (const file of files) {
      manifest.push({
        variant,
        source: file.relative,
        size: file.size,
        target: classify(file.relative)
      });
    }
  }

  writeFileSync(
    join(STATE_DIR, "source-manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  state.sourceInventoryCount = manifest.length;
  state.completed.push("source-inventory");
  saveState(state);

  log(`Complete source inventory recorded: ${manifest.length} files.`);
} else {
  log("Source inventory already exists; skipping.");
}

if (!state.completed.includes("merge-assets")) {
  const manifest = JSON.parse(
    readFileSync(join(STATE_DIR, "source-manifest.json"), "utf8")
  );

  const grouped = new Map();

  for (const item of manifest) {
    const key = `${item.target}:${item.source}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sourceVariants: sourceVariants.length,
    sourceFiles: manifest.length,
    canonicalTargets: {},
    conflicts: [],
    copied: [],
    preserved: true
  };

  for (const target of Object.keys(CANONICAL)) {
    report.canonicalTargets[target] = 0;
  }

  for (const [key, candidates] of grouped) {
    const [target, relative] = key.split(":");

    candidates.sort((a, b) => {
      const priority = (name) => {
        if (/WAEVE-Global-Production-Services/i.test(name)) return 100;
        if (/WAEVE-Complete-2\.4/i.test(name)) return 90;
        if (/WAEVE-Complete-2\.2/i.test(name)) return 80;
        if (/Android-production/i.test(name)) return 70;
        if (/Everything_Global/i.test(name)) return 60;
        return 10;
      };

      return priority(b.variant) - priority(a.variant);
    });

    const winner = candidates[0];
    const destination = safeTarget(target, relative);

    if (candidates.length > 1) {
      report.conflicts.push({
        target,
        relative,
        candidates: candidates.map(x => x.variant),
        selected: winner.variant
      });
    }

    mkdirSync(join(destination, ".."), { recursive: true });

    /*
     * Never overwrite an existing canonical file.
     * Existing canonical implementations are retained for explicit
     * reconciliation in the integration phase.
     */
    if (!existsSync(destination)) {
      copyFileSync(
        join(SOURCES, winner.variant, winner.source),
        destination
      );

      report.copied.push({
        target,
        source: winner.variant,
        relative
      });

      report.canonicalTargets[target]++;
    }
  }

  writeFileSync(
    join(STATE_DIR, "merge-assets-report.json"),
    JSON.stringify(report, null, 2)
  );

  state.mergeConflicts = report.conflicts.length;
  state.mergeCopied = report.copied.length;
  state.completed.push("merge-assets");
  saveState(state);

  log(`Asset merge pass copied: ${report.copied.length} files.`);
  log(`Detected duplicate/conflicting paths: ${report.conflicts.length}.`);
  log("Existing canonical files were not overwritten.");
} else {
  log("Asset merge pass already completed; skipping.");
}

log("=== AUTOMATED SOURCE MERGE ===");
log("Source inventory and non-destructive asset reconciliation complete.");

log("=== FOUNDATION PASS COMPLETE ===");
