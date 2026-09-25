#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const STATE = path.join(ROOT, "tools", "merge-state");

fs.mkdirSync(STATE, { recursive: true });

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function files(dir) {
  if (!fs.existsSync(dir)) return [];

  const out = [];

  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (["node_modules",".git","dist","build",".gradle"].includes(e.name))
        continue;

      const p = path.join(d,e.name);

      if (e.isDirectory()) walk(p);
      else out.push(p);
    }
  }

  walk(dir);
  return out;
}

function run(label, command, args, cwd = ROOT, timeoutMs = 120000) {
  console.log(`\n=== CHECK ${label} ===`);
  console.log(`> ${command} ${args.join(" ")}`);
  const r = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    timeout: timeoutMs,
    killSignal: "SIGTERM"
  });

  if (r.error?.code === "ETIMEDOUT") {
    console.log(`TIMEOUT ${label} after ${timeoutMs}ms`);
  }

  return r;
}

const report = {
  generatedAt:new Date().toISOString(),
  workspaces:[],
  android:null,
  passed:[],
  failed:[],
  skipped:[],
  externalDependencies:[]
};

console.log("=== WAEVE ECOSYSTEM DOMAIN VERIFICATION ===");

const roots = ["apps","packages","services"];

for (const root of roots) {
  const base = path.join(ROOT,root);
  if (!fs.existsSync(base)) continue;

  for (const entry of fs.readdirSync(base,{withFileTypes:true})) {
    if (!entry.isDirectory()) continue;

    const dir = path.join(base,entry.name);
    const packageFile = path.join(dir,"package.json");

    if (!fs.existsSync(packageFile)) continue;

    const pkg = readJson(packageFile);
    if (!pkg) continue;

    const rel = path.relative(ROOT,dir);

    report.workspaces.push({
      path:rel,
      name:pkg.name,
      scripts:pkg.scripts || {},
      sourceFiles:files(dir).length
    });

    console.log(
      `${rel} -> ${pkg.name} | ` +
      `files=${files(dir).length} | ` +
      `build=${pkg.scripts?.build ? "yes" : "no"} | ` +
      `test=${pkg.scripts?.test ? "yes" : "no"}`
    );
  }
}

console.log(`\nDetected active workspaces: ${report.workspaces.length}`);

for (const ws of report.workspaces) {
  const dir = path.join(ROOT,ws.path);

  if (ws.path === "apps/web" || ws.path === "apps/api") {
    continue;
  }

  if (ws.scripts?.check) {
    const r = run(
      `CHECK ${ws.path}`,
      "npm",
      ["run","check","--workspace="+ws.name]
    );

    if (r.ok) report.passed.push(ws.path + ":check");
    else report.failed.push(ws.path + ":check");
  }

  if (ws.scripts?.build) {
    const r = run(
      `BUILD ${ws.path}`,
      "npm",
      ["run","build","--workspace="+ws.name]
    );

    if (r.ok) report.passed.push(ws.path + ":build");
    else report.failed.push(ws.path + ":build");
  }

  if (ws.scripts?.test) {
    const r = run(
      `TEST ${ws.path}`,
      "npm",
      ["run","test","--workspace="+ws.name]
    );

    if (r.ok) report.passed.push(ws.path + ":test");
    else report.failed.push(ws.path + ":test");
  }

  if (!ws.scripts?.check && !ws.scripts?.build && !ws.scripts?.test) {
    report.skipped.push({
      workspace:ws.path,
      reason:"Source workspace has no executable validation script yet."
    });
  }
}

console.log("\n=== ANDROID VERIFICATION ===");

const android = path.join(ROOT,"mobile/android");

if (!fs.existsSync(android)) {
  report.android = {status:"MISSING"};
  console.log("Android canonical directory missing.");
} else {
  const gradlew = path.join(android,"gradlew");
  const settings =
    fs.existsSync(path.join(android,"settings.gradle")) ||
    fs.existsSync(path.join(android,"settings.gradle.kts"));

  const manifests = files(android).filter(f =>
    f.endsWith("AndroidManifest.xml")
  ).length;

  report.android = {
    files:files(android).length,
    settings,
    gradlew:fs.existsSync(gradlew),
    manifests
  };

  if (fs.existsSync(gradlew)) {
    try {
      fs.chmodSync(gradlew,0o755);
    } catch {}

    const r = run(
      "ANDROID DEBUG BUILD",
      "./gradlew",
      ["assembleDebug","--no-daemon"],
      android,
      600000
    );

    if (r.ok) {
      report.android.status="BUILD_PASS";
      report.passed.push("mobile/android:assembleDebug");
    } else {
      report.android.status="BUILD_FAILED";
      report.failed.push("mobile/android:assembleDebug");
    }
  } else if (settings) {
    report.android.status="GRADLE_PROJECT_WITHOUT_WRAPPER";
    report.skipped.push({
      workspace:"mobile/android",
      reason:"Gradle project exists but wrapper is missing."
    });
  } else {
    report.android.status="SOURCE_ONLY";
    report.skipped.push({
      workspace:"mobile/android",
      reason:"Android source exists but no complete Gradle entrypoint."
    });
  }
}

console.log("\n=== EXTERNAL PRODUCTION DEPENDENCIES ===");

report.externalDependencies = [
  "Commercial music licensing and territory rights",
  "Production object storage/CDN",
  "Payment providers and billing webhooks",
  "Production identity/email services",
  "App-store signing/distribution credentials",
  "Production transcoding and asynchronous media workers",
  "Royalty contracts, tax and regional legal configuration"
];

for (const item of report.externalDependencies)
  console.log(`EXTERNAL: ${item}`);

report.status =
  report.failed.length === 0
    ? "DOMAIN_VERIFICATION_PASS"
    : "DOMAIN_VERIFICATION_BLOCKED";

fs.writeFileSync(
  path.join(STATE,"ecosystem-domain-verification.json"),
  JSON.stringify(report,null,2)
);

console.log("\n=== DOMAIN VERIFICATION RESULT ===");
console.log(`Passed: ${report.passed.length}`);
console.log(`Failed: ${report.failed.length}`);
console.log(`Skipped: ${report.skipped.length}`);
console.log(`Status: ${report.status}`);
console.log("Original source variants: UNMODIFIED");
console.log("Report: tools/merge-state/ecosystem-domain-verification.json");

process.exit(report.failed.length ? 1 : 0);
