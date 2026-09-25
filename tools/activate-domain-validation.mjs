#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const domains = [
  "apps/artist",
  "services/analytics",
  "services/catalog",
  "services/discovery",
  "services/editorial",
  "services/knowledge",
  "services/media",
  "services/notifications",
  "services/payments",
  "services/playback",
  "services/recommendations",
  "services/rights",
  "services/royalties",
  "services/search",
  "services/territory",
  "services/trust"
];

const state = {
  generatedAt: new Date().toISOString(),
  activated: [],
  skipped: [],
  preserved: true
};

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file,"utf8"));
  } catch {
    return {};
  }
}

function writeJson(file,data) {
  fs.writeFileSync(file,JSON.stringify(data,null,2)+"\n");
}

function walk(dir) {
  const result = [];

  if (!fs.existsSync(dir)) return result;

  function visit(d) {
    for (const entry of fs.readdirSync(d,{withFileTypes:true})) {
      if (["node_modules",".git","dist","build",".gradle"].includes(entry.name))
        continue;

      const p = path.join(d,entry.name);

      if (entry.isDirectory()) visit(p);
      else result.push(p);
    }
  }

  visit(dir);
  return result;
}

for (const rel of domains) {
  const dir = path.join(ROOT,rel);

  if (!fs.existsSync(dir)) {
    state.skipped.push({domain:rel,reason:"directory missing"});
    continue;
  }

  const source = walk(dir).filter(f =>
    /\.(ts|tsx|js|mjs|cjs)$/.test(f) &&
    !f.endsWith(".d.ts")
  );

  if (!source.length) {
    state.skipped.push({
      domain:rel,
      reason:"no executable JS/TS source detected"
    });
    continue;
  }

  const packageFile = path.join(dir,"package.json");
  const pkg = readJson(packageFile);

  pkg.private = true;
  pkg.type ||= "module";
  pkg.scripts ||= {};

  /*
   * These scripts deliberately validate syntax/type structure only.
   * They do not pretend to provide production runtime integration.
   */
  if (!pkg.scripts.check) {
    const tsFiles = source.filter(f => /\.(ts|tsx)$/.test(f));

    if (tsFiles.length) {
      pkg.scripts.check =
        "tsc --noEmit -p tsconfig.json";
    } else {
      pkg.scripts.check =
        "node --check src/index.js";
    }
  }

  if (!pkg.dependencies) pkg.dependencies = {};

  const sourceText = source.map(f => {
    try { return fs.readFileSync(f,"utf8"); }
    catch { return ""; }
  }).join("\n");

  if (
    sourceText.includes("@waeve/shared") &&
    !pkg.dependencies["@waeve/shared"]
  ) {
    pkg.dependencies["@waeve/shared"] = "*";
  }

  writeJson(packageFile,pkg);

  const tsFiles = source.filter(f => /\.(ts|tsx)$/.test(f));

  if (tsFiles.length) {
    const tsconfig = path.join(dir,"tsconfig.json");

    if (!fs.existsSync(tsconfig)) {
      writeJson(tsconfig,{
        compilerOptions:{
          target:"ES2022",
          module:"NodeNext",
          moduleResolution:"NodeNext",
          strict:true,
          skipLibCheck:true,
          noEmit:true,
          allowJs:false
        },
        include:["**/*.ts","**/*.tsx"],
        exclude:["node_modules","dist","build"]
      });
    }
  }

  state.activated.push({
    domain:rel,
    sourceFiles:source.length,
    typescriptFiles:tsFiles.length,
    validation:pkg.scripts.check
  });
}

const android = path.join(ROOT,"mobile/android");

state.android = {
  exists:fs.existsSync(android),
  gradlew:fs.existsSync(path.join(android,"gradlew")),
  settings:
    fs.existsSync(path.join(android,"settings.gradle")) ||
    fs.existsSync(path.join(android,"settings.gradle.kts")),
  action:"No Android files modified; build will occur only when a valid Gradle entrypoint exists."
};

const out = path.join(
  ROOT,
  "tools",
  "merge-state",
  "domain-validation-activation.json"
);

fs.mkdirSync(path.dirname(out),{recursive:true});
writeJson(out,state);

console.log("=== WAEVE DOMAIN VALIDATION ACTIVATION ===");
console.log(`Domains activated: ${state.activated.length}`);
console.log(`Domains skipped: ${state.skipped.length}`);

for (const item of state.activated) {
  console.log(
    `${item.domain} -> source=${item.sourceFiles} ` +
    `ts=${item.typescriptFiles} validation=registered`
  );
}

console.log("\n=== ANDROID ===");
console.log(`exists=${state.android.exists}`);
console.log(`gradlew=${state.android.gradlew}`);
console.log(`settings=${state.android.settings}`);

console.log("\nOriginal source variants: UNMODIFIED");
console.log("Destructive conflict resolution: 0");
console.log(`Report: ${path.relative(ROOT,out)}`);
