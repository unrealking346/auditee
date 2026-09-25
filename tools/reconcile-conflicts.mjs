#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const SOURCES = path.join(ROOT, "_sources");
const STATE = path.join(ROOT, "tools", "merge-state");
const REPORT = path.join(STATE, "full-ecosystem-integration.json");

fs.mkdirSync(STATE, { recursive: true });

const domains = [
  "web","api","artist","admin","developer",
  "contracts","database","security","ui",
  "catalog","playback","search","discovery",
  "recommendations","rights","royalties","territory",
  "knowledge","trust","editorial","analytics",
  "payments","media","notifications",
  "infrastructure","android","tests"
];

const canonicalRoots = {
  web:"apps/web",
  api:"apps/api",
  artist:"apps/artist",
  admin:"apps/admin",
  developer:"apps/developer",
  contracts:"packages/contracts",
  database:"packages/database",
  security:"packages/security",
  ui:"packages/ui",
  catalog:"services/catalog",
  playback:"services/playback",
  search:"services/search",
  discovery:"services/discovery",
  recommendations:"services/recommendations",
  rights:"services/rights",
  royalties:"services/royalties",
  territory:"services/territory",
  knowledge:"services/knowledge",
  trust:"services/trust",
  editorial:"services/editorial",
  analytics:"services/analytics",
  payments:"services/payments",
  media:"services/media",
  notifications:"services/notifications",
  infrastructure:"infrastructure",
  android:"mobile/android",
  tests:"tests"
};

function hash(file) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(file))
    .digest("hex");
}

function read(file) {
  try { return fs.readFileSync(file, "utf8"); }
  catch { return ""; }
}

function files(dir) {
  if (!fs.existsSync(dir)) return [];

  const out = [];

  function walk(d) {
    for (const e of fs.readdirSync(d, {withFileTypes:true})) {
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

function classifyText(file) {
  const text = read(file);

  const signals = {
    auth:/auth|jwt|session|password|login|register/i,
    playback:/playback|player|audio|queue|seek|shuffle|repeat/i,
    playlist:/playlist/i,
    catalogue:/catalog|track|album|artist|release/i,
    search:/search|meilisearch|elasticsearch/i,
    discovery:/discover|radio|chart|mix|recommend/i,
    rights:/rights|license|territory/i,
    royalty:/royalt|payout|split|statement/i,
    payment:/payment|billing|subscription/i,
    analytics:/analytics|metric|event|warehouse/i,
    security:/security|permission|rbac|rate.?limit/i,
    media:/media|storage|cdn|ffmpeg|transcod/i,
    notification:/notification|fcm|apns|push/i,
    moderation:/moderation|fraud|abuse|report/i
  };

  return Object.entries(signals)
    .filter(([,r]) => r.test(text))
    .map(([k]) => k);
}

console.log("=== WAEVE AUTOMATED CONFLICT RECONCILIATION ===");

if (!fs.existsSync(REPORT)) {
  console.error("Integration report missing.");
  process.exit(1);
}

const integration = JSON.parse(read(REPORT));

const result = {
  generatedAt:new Date().toISOString(),
  sourceVariants:integration.sourceVariants,
  originalSourcesModified:0,
  conflicts:[],
  classifications:{
    identical:0,
    canonical_retained:0,
    compatible:0,
    missing_functionality:0,
    parallel_implementation:0,
    external_dependency:0
  },
  domains:{},
  adapters:[]
};

for (const domain of domains) {
  result.domains[domain] = {
    canonical:canonicalRoots[domain],
    files:files(path.join(ROOT,canonicalRoots[domain])).length,
    status:"registered"
  };
}

/*
 * Locate same-relative-path alternatives in _sources.
 * We never modify or delete these files.
 */
const variants = fs.readdirSync(SOURCES,{withFileTypes:true})
  .filter(e=>e.isDirectory());

const byRelative = new Map();

for (const variant of variants) {
  const root = path.join(SOURCES,variant.name);

  for (const file of files(root)) {
    const relative = path.relative(root,file).replaceAll("\\","/");

    if (!byRelative.has(relative))
      byRelative.set(relative,[]);

    byRelative.get(relative).push({
      variant:variant.name,
      file,
      hash:hash(file),
      bytes:fs.statSync(file).size,
      signals:classifyText(file)
    });
  }
}

for (const [relative, candidates] of byRelative) {
  if (candidates.length < 2) continue;

  const hashes = new Set(candidates.map(x=>x.hash));

  if (hashes.size === 1) {
    result.classifications.identical++;
    continue;
  }

  const sizes = candidates.map(x=>x.bytes);
  const largest = Math.max(...sizes);
  const smallest = Math.min(...sizes);

  /*
   * Same file path but substantially different content.
   * We do not overwrite either implementation.
   */
  let classification = "parallel_implementation";

  if (largest === smallest) {
    classification = "compatible";
  }

  const allSignals = [...new Set(
    candidates.flatMap(x=>x.signals)
  )];

  if (
    allSignals.includes("rights") &&
    allSignals.includes("royalty")
  ) {
    classification = "parallel_implementation";
  }

  if (
    allSignals.includes("payment") &&
    allSignals.includes("security")
  ) {
    classification = "parallel_implementation";
  }

  result.classifications[classification]++;

  result.conflicts.push({
    relative,
    classification,
    variants:candidates.map(x=>({
      variant:x.variant,
      bytes:x.bytes,
      sha256:x.hash,
      signals:x.signals
    }))
  });
}

/*
 * Create explicit reconciliation boundaries for domains that have
 * multiple independent implementations.
 */
for (const [domain, root] of Object.entries(canonicalRoots)) {
  const dir = path.join(ROOT,root);

  if (!fs.existsSync(dir)) continue;

  const sourceCount = result.conflicts.filter(c =>
    c.variants.some(v =>
      v.signals.some(signal =>
        signal === domain ||
        (domain === "catalog" && signal === "catalogue") ||
        (domain === "royalties" && signal === "royalty")
      )
    )
  ).length;

  result.domains[domain].conflictingInputs = sourceCount;

  if (sourceCount > 0) {
    const boundary = path.join(dir,"RECONCILIATION_BOUNDARY.json");

    if (!fs.existsSync(boundary)) {
      fs.writeFileSync(boundary,JSON.stringify({
        domain,
        purpose:"Controlled integration boundary for multiple preserved Waeve implementations.",
        sourceVariantsPreserved:true,
        automaticDestructiveMerge:false,
        conflictCount:sourceCount,
        generatedAt:result.generatedAt
      },null,2)+"\n");
    }

    result.domains[domain].status="multi-implementation-boundary";
  }
}

/*
 * Register canonical buildable workspaces for domains where source
 * implementation exists but no package boundary exists.
 */
const workspaceChanges=[];

const rootPackage=JSON.parse(read(path.join(ROOT,"package.json")));
const workspaceSet=new Set(rootPackage.workspaces||[]);

for (const [domain,root] of Object.entries(canonicalRoots)) {
  if (
    !root.startsWith("services/") &&
    !root.startsWith("apps/")
  ) continue;

  const dir=path.join(ROOT,root);

  if (!fs.existsSync(dir)) continue;

  const sourceFiles=files(dir);

  if (!sourceFiles.length) continue;

  const packageFile=path.join(dir,"package.json");

  if (!fs.existsSync(packageFile)) {
    const name="@waeve/"+root
      .replaceAll("/","-")
      .replace(/[^a-zA-Z0-9_-]/g,"-");

    fs.writeFileSync(
      packageFile,
      JSON.stringify({
        name,
        private:true,
        version:"1.0.0",
        type:"module"
      },null,2)+"\n"
    );

    workspaceChanges.push(root);
  }

  if (!workspaceSet.has(root)) {
    workspaceSet.add(root);
    workspaceChanges.push(root);
  }
}

rootPackage.workspaces=[...workspaceSet];

fs.writeFileSync(
  path.join(ROOT,"package.json"),
  JSON.stringify(rootPackage,null,2)+"\n"
);

result.workspaceChanges=[...new Set(workspaceChanges)];

/*
 * Android evidence.
 */
const android=path.join(ROOT,"mobile/android");
result.android={
  files:files(android).length,
  gradle:files(android).filter(f =>
    /(^|\/)(settings\.gradle(?:\.kts)?|build\.gradle(?:\.kts)?|gradlew)$/.test(f)
  ).length,
  manifest:fs.existsSync(
    path.join(android,"app","src","main","AndroidManifest.xml")
  )
};

if (result.android.files && result.android.gradle) {
  result.android.status="BUILDABLE_CANDIDATE";
} else if (result.android.files) {
  result.android.status="SOURCE_PRESENT";
} else {
  result.android.status="MISSING";
}

result.status="RECONCILIATION_REGISTERED";

fs.writeFileSync(
  path.join(STATE,"conflict-reconciliation.json"),
  JSON.stringify(result,null,2)
);

console.log("\n=== RECONCILIATION SUMMARY ===");
console.log(`Conflict records: ${result.conflicts.length}`);

for (const [k,v] of Object.entries(result.classifications)) {
  console.log(`${k}: ${v}`);
}

console.log(`Workspace boundaries added: ${result.workspaceChanges.length}`);
console.log(`Android files: ${result.android.files}`);
console.log(`Android Gradle entrypoints: ${result.android.gradle}`);
console.log("Original source variants modified: 0");
console.log("Destructive conflict resolution: 0");
console.log("\nReport: tools/merge-state/conflict-reconciliation.json");
console.log("Status: RECONCILIATION_REGISTERED");
