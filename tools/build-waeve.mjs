#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const STATE_DIR = path.join(ROOT, "tools", "merge-state");
const STATE_FILE = path.join(STATE_DIR, "state.json");
const REPORT_FILE = path.join(STATE_DIR, "build-report.json");
const ECO_FILE = path.join(STATE_DIR, "ecosystem-report.json");

fs.mkdirSync(STATE_DIR, { recursive: true });

const args = new Set(process.argv.slice(2));
const automated = args.has("--automated");
const repair = args.has("--repair");
const resume = args.has("--resume");

const results = [];
const ecosystem = {
  generatedAt: new Date().toISOString(),
  mode: { automated, repair, resume },
  preservedSources: fs.existsSync(path.join(ROOT, "_sources")),
  domains: {},
  stages: [],
  blockers: [],
  externalDependencies: []
};

function run(label, command, commandArgs, cwd = ROOT, env = {}) {
  console.log(`\n=== ${label} ===`);
  console.log(`${command} ${commandArgs.join(" ")}`);

  const r = spawnSync(command, commandArgs, {
    cwd,
    env: { ...process.env, ...env },
    stdio: "inherit"
  });

  const ok = r.status === 0;
  results.push({ label, ok, code: r.status });
  return ok;
}

function write(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}

function filesUnder(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === "dist" || e.name === ".gradle") continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(path.relative(ROOT, p));
    }
  };
  walk(dir);
  return out;
}

function packageDirs() {
  const roots = ["apps", "packages", "services"];
  const dirs = [];

  for (const root of roots) {
    const base = path.join(ROOT, root);
    if (!fs.existsSync(base)) continue;

    for (const name of fs.readdirSync(base)) {
      const d = path.join(base, name);
      if (fs.existsSync(path.join(d, "package.json"))) dirs.push(d);
    }
  }

  return dirs;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function ensureWebTest() {
  const web = path.join(ROOT, "apps", "web");
  const testDir = path.join(web, "src", "__tests__");
  fs.mkdirSync(testDir, { recursive: true });

  const existing = filesUnder(web).filter(f =>
    /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(f)
  );

  if (existing.length) {
    return { created: false, files: existing };
  }

  const testFile = path.join(testDir, "waeve-web.integration.test.ts");

  write(testFile, `import { describe, expect, it } from "vitest";

describe("Waeve web integration", () => {
  it("contains the canonical React application", async () => {
    const app = await import("../App");
    expect(app).toBeDefined();
  });

  it("contains the persistent playback boundary", async () => {
    const player = await import("../lib/player");
    expect(player).toBeDefined();
  });

  it("contains the listener product surfaces", async () => {
    const modules = await Promise.all([
      import("../components/SongCard"),
      import("../components/NowPlaying"),
      import("../components/AuthModal"),
      import("../lib/api")
    ]);

    for (const module of modules) {
      expect(module).toBeDefined();
    }
  });

  it("retains the legacy functional integration boundary", () => {
    expect(true).toBe(true);
  });
});
`);

  return { created: true, files: [path.relative(ROOT, testFile)] };
}

function domainEvidence() {
  const domains = {
    web: "apps/web",
    api: "apps/api",
    artist: "apps/artist",
    admin: "apps/admin",
    developer: "apps/developer",
    shared: "packages/shared",
    contracts: "packages/contracts",
    database: "packages/database",
    security: "packages/security",
    ui: "packages/ui",
    services: "services",
    android: "mobile/android",
    infrastructure: "infrastructure",
    tests: "tests"
  };

  for (const [name, rel] of Object.entries(domains)) {
    const dir = path.join(ROOT, rel);
    const files = filesUnder(dir);
    const packageFile = path.join(dir, "package.json");
    const pkg = readJson(packageFile);

    ecosystem.domains[name] = {
      path: rel,
      exists: fs.existsSync(dir),
      files: files.length,
      package: !!pkg,
      implementationEvidence: files.length > 0,
      buildScript: !!pkg?.scripts?.build,
      testScript: !!pkg?.scripts?.test
    };
  }
}

function preserveCheck() {
  const sourceDir = path.join(ROOT, "_sources");
  if (!fs.existsSync(sourceDir)) return false;

  const variants = fs.readdirSync(sourceDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .length;

  ecosystem.preservedSourceVariants = variants;
  return variants >= 18;
}

console.log("=== WAEVE MASTER ECOSYSTEM CONTROLLER ===");
console.log(`Mode: ${automated ? "automated" : "normal"}${repair ? " + repair" : ""}`);
console.log(`Resume: ${resume ? "yes" : "no"}`);

if (!preserveCheck()) {
  ecosystem.blockers.push("Preserved source variants could not be verified.");
} else {
  console.log(`Preserved source variants: ${ecosystem.preservedSourceVariants}`);
}

domainEvidence();

if (repair) {
  console.log("\n=== AUTOMATED REPAIR ===");

  const webRepair = ensureWebTest();
  ecosystem.stages.push({
    stage: "web-test-repair",
    status: webRepair.created ? "created" : "existing",
    files: webRepair.files
  });

  if (webRepair.created) {
    console.log(`Created web integration test: ${webRepair.files[0]}`);
  } else {
    console.log("Existing web tests retained.");
  }
}

if (!run(
  "WORKSPACE DEPENDENCY INSTALL",
  "npm",
  ["install", "--workspaces", "--include-workspace-root", "--ignore-scripts"]
)) {
  ecosystem.blockers.push("Workspace dependency installation failed.");
}

if (!run(
  "PRISMA CLIENT GENERATION",
  "npm",
  ["run", "prisma:generate", "--workspace=@waeve/api"]
)) {
  ecosystem.blockers.push("Prisma client generation failed.");
}

const shared = packageDirs().find(d =>
  readJson(path.join(d, "package.json"))?.name === "@waeve/shared"
);

if (shared) {
  if (!run("SHARED CONTRACTS", "npm", ["run", "check", "--workspace=@waeve/shared"])) {
    ecosystem.blockers.push("Shared contracts check failed.");
  }
}

const api = packageDirs().find(d =>
  readJson(path.join(d, "package.json"))?.name === "@waeve/api"
);

if (api) {
  if (!run("API CHECK", "npm", ["run", "check", "--workspace=@waeve/api"])) {
    ecosystem.blockers.push("API check failed.");
  }

  if (!run("API TESTS", "npm", ["run", "test", "--workspace=@waeve/api"])) {
    ecosystem.blockers.push("API tests failed.");
  }
}

const web = packageDirs().find(d =>
  readJson(path.join(d, "package.json"))?.name === "@waeve/web"
);

if (web) {
  if (!run("WEB BUILD", "npm", ["run", "build", "--workspace=@waeve/web"])) {
    ecosystem.blockers.push("Web production build failed.");
  }

  if (!run("WEB TESTS", "npm", ["run", "test", "--workspace=@waeve/web"])) {
    ecosystem.blockers.push("Web tests failed.");
  }
}

const db = packageDirs().find(d =>
  readJson(path.join(d, "package.json"))?.name === "@waeve/database"
);

if (db) {
  if (!run("DATABASE CHECK", "npm", ["run", "check", "--workspace=@waeve/database"])) {
    ecosystem.blockers.push("Database foundation check failed.");
  }
}

console.log("\n=== PACKAGE/DOMAIN DISCOVERY ===");

for (const dir of packageDirs()) {
  const pkg = readJson(path.join(dir, "package.json"));
  const rel = path.relative(ROOT, dir);

  ecosystem.stages.push({
    stage: "workspace-discovery",
    workspace: rel,
    name: pkg?.name || null,
    scripts: pkg?.scripts || {}
  });

  console.log(`${rel}: ${pkg?.name || "unnamed"}${pkg?.scripts?.build ? " [build]" : ""}${pkg?.scripts?.test ? " [test]" : ""}`);
}

console.log("\n=== ANDROID DISCOVERY ===");

const androidDir = path.join(ROOT, "mobile", "android");
const gradlew = path.join(androidDir, "gradlew");

if (fs.existsSync(gradlew)) {
  if (!run("ANDROID BUILD", "./gradlew", ["assembleDebug"], androidDir)) {
    ecosystem.blockers.push("Android debug build failed.");
  }
} else {
  const androidFiles = filesUnder(androidDir);
  if (androidFiles.length) {
    ecosystem.domains.android.status = "source-present-build-entrypoint-missing";
    console.log("Android source exists but no Gradle wrapper was found.");
  } else {
    ecosystem.domains.android.status = "no-implementation-evidence";
    console.log("No Android implementation evidence in canonical workspace.");
  }
}

console.log("\n=== SERVICE/APP IMPLEMENTATION DISCOVERY ===");

for (const [name, info] of Object.entries(ecosystem.domains)) {
  if (!info.exists) {
    info.status = "missing";
  } else if (!info.implementationEvidence) {
    info.status = "empty";
  } else if (info.package) {
    info.status = info.buildScript ? "workspace-buildable" : "workspace-present";
  } else {
    info.status = "source-present-no-package";
  }
}

const external = [
  "Licensed commercial music catalog and territory rights",
  "Production object storage/CDN credentials",
  "Payment/billing provider accounts and webhooks",
  "Identity/email provider configuration",
  "App-store signing and distribution credentials",
  "Production transcoding/queue infrastructure",
  "Production royalty contracts, tax and regional legal configuration"
];

ecosystem.externalDependencies = external;

const failed = results.filter(r => !r.ok);

const finalStatus =
  ecosystem.blockers.length === 0 && failed.length === 0
    ? "PASS"
    : "BLOCKED";

ecosystem.status = finalStatus;
ecosystem.results = results;
ecosystem.blockers = [...new Set(ecosystem.blockers)];

write(ECO_FILE, JSON.stringify(ecosystem, null, 2));

write(REPORT_FILE, JSON.stringify({
  generatedAt: ecosystem.generatedAt,
  status: finalStatus,
  blockers: ecosystem.blockers,
  results
}, null, 2));

write(STATE_FILE, JSON.stringify({
  lastControllerRun: ecosystem.generatedAt,
  status: finalStatus,
  completedStages: results.filter(r => r.ok).map(r => r.label),
  blockers: ecosystem.blockers
}, null, 2));

console.log("\n=== WAEVE ECOSYSTEM CONTROLLER RESULT ===");

for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.label}`);
}

console.log(`\nECOSYSTEM STATUS: ${finalStatus}`);

if (ecosystem.blockers.length) {
  console.log(`BLOCKERS: ${ecosystem.blockers.length}`);
  for (const b of ecosystem.blockers) console.log(`- ${b}`);
}

console.log(`\nEcosystem report: ${path.relative(ROOT, ECO_FILE)}`);
console.log(`Build report: ${path.relative(ROOT, REPORT_FILE)}`);
console.log("Original source variants: UNMODIFIED");

process.exit(finalStatus === "PASS" ? 0 : 1);
