import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve(".");
const STATE_DIR = join(ROOT, "tools", "merge-state");
const STATE_FILE = join(STATE_DIR, "state.json");
const PLAN_FILE = join(STATE_DIR, "resource-build-plan.json");

mkdirSync(STATE_DIR, { recursive: true });

const memory = spawnSync("sh", ["-c", "free -m 2>/dev/null | awk 'NR==2 {print $2, $3, $4, $7}'"], {
  encoding: "utf8"
}).stdout.trim().split(/\s+/).map(Number);

const [totalMB = 0, usedMB = 0, freeMB = 0, availableMB = 0] = memory;

const workspaces = [
  "packages/shared",
  "packages/database",
  "apps/api",
  "apps/web"
];

const packageInfo = [];

for (const workspace of workspaces) {
  const file = join(ROOT, workspace, "package.json");

  if (!existsSync(file)) {
    packageInfo.push({
      workspace,
      package: "missing",
      active: false
    });
    continue;
  }

  const pkg = JSON.parse(readFileSync(file, "utf8"));

  packageInfo.push({
    workspace,
    package: pkg.name || workspace,
    active: true,
    dependencyCount: Object.keys(pkg.dependencies || {}).length,
    devDependencyCount: Object.keys(pkg.devDependencies || {}).length,
    scripts: Object.keys(pkg.scripts || {})
  });
}

const plan = {
  generatedAt: new Date().toISOString(),
  environment: {
    totalMB,
    usedMB,
    freeMB,
    availableMB,
    node: process.version
  },
  strategy: "resource-aware-incremental",
  installPolicy: {
    maxConcurrency: 1,
    ignoreScripts: true,
    useExistingLockfile: true,
    installOnlyActiveCore: true,
    avoidEmptyWorkspaces: true
  },
  activeWorkspaces: workspaces,
  packageInfo,
  deferredDomains: [
    "artist",
    "admin",
    "developer",
    "catalog service",
    "playback service",
    "search service",
    "discovery service",
    "recommendations service",
    "rights service",
    "royalties service",
    "territory service",
    "knowledge service",
    "trust service",
    "editorial service",
    "analytics service",
    "payments service",
    "media service",
    "notifications service"
  ],
  reason:
    "Termux has limited physical RAM; dependency installation must proceed incrementally."
};

writeFileSync(
  PLAN_FILE,
  JSON.stringify(plan, null, 2)
);

const state = existsSync(STATE_FILE)
  ? JSON.parse(readFileSync(STATE_FILE, "utf8"))
  : {};

state.resourceBuild = {
  status: "plan-created",
  totalMB,
  availableMB,
  strategy: "incremental-core-first"
};

state.completed = (state.completed || []).filter(
  x => x !== "resource-aware-build-plan"
);
state.completed.push("resource-aware-build-plan");

writeFileSync(
  STATE_FILE,
  JSON.stringify(state, null, 2)
);

console.log("=== WAEVE RESOURCE-AWARE BUILD PLAN ===");
console.log(`RAM total: ${totalMB} MB`);
console.log(`RAM available: ${availableMB} MB`);
console.log(`Node: ${process.version}`);
console.log("");
console.log("Core workspaces:");

for (const p of packageInfo) {
  console.log(
    `${p.active ? "ACTIVE" : "SKIP"} ${p.workspace} ` +
    `deps=${p.dependencyCount ?? 0} ` +
    `devDeps=${p.devDependencyCount ?? 0}`
  );
}

console.log("");
console.log("npm concurrency: 1");
console.log("Existing lockfile: REQUIRED");
console.log("Install scripts: DISABLED");
console.log("Large/empty service workspaces: DEFERRED");
console.log("");
console.log("PLAN CREATED — no dependency installation started.");
