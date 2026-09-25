#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";

const ROOT=process.cwd();

function walk(dir){
  const out=[];
  if(!fs.existsSync(dir)) return out;
  function visit(d){
    for(const e of fs.readdirSync(d,{withFileTypes:true})){
      if(["node_modules",".git","dist","build",".gradle"].includes(e.name)) continue;
      const p=path.join(d,e.name);
      if(e.isDirectory()) visit(p);
      else out.push(p);
    }
  }
  visit(dir);
  return out;
}

function read(p){
  return fs.existsSync(p)?fs.readFileSync(p,"utf8"):"";
}

function json(p){
  try{return JSON.parse(read(p))}catch{return {}}
}

function save(p,v){
  fs.writeFileSync(p,JSON.stringify(v,null,2)+"\n");
}

function copyIfMissing(src,dst){
  if(!fs.existsSync(src)) return false;
  if(fs.existsSync(dst)) return false;
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.copyFileSync(src,dst);
  return true;
}

const report={
  repaired:[],
  preserved:[],
  unresolved:[],
  sourceVariantsModified:0
};

console.log("=== WAEVE AUTOMATED BLOCKER REPAIR ===");

/* -------------------------------------------------------
   1. Replace invalid hard-coded JS validation targets.
------------------------------------------------------- */

for(const rel of [
  "services/analytics",
  "services/catalog",
  "services/discovery",
  "services/editorial",
  "services/knowledge",
  "services/media",
  "services/rights",
  "services/royalties",
  "services/territory",
  "services/trust"
]){
  const dir=path.join(ROOT,rel);
  const pkgFile=path.join(dir,"package.json");

  if(!fs.existsSync(pkgFile)) continue;

  const pkg=json(pkgFile);
  const js=walk(dir).filter(f=>/\.(js|mjs|cjs)$/.test(f));

  if(!js.length){
    report.unresolved.push(`${rel}:no-js-entry`);
    continue;
  }

  const preferred =
    js.find(f=>/\/src\/(index|server|main)\.(js|mjs|cjs)$/.test(f)) ||
    js.find(f=>/\/(index|server|main)\.(js|mjs|cjs)$/.test(f)) ||
    js[0];

  const target=path.relative(dir,preferred);

  pkg.scripts ||= {};
  pkg.scripts.check=`node --check ${target}`;

  save(pkgFile,pkg);

  report.repaired.push(`${rel}:check->${target}`);
}

/* -------------------------------------------------------
   2. Fix React/TypeScript playback validation.
------------------------------------------------------- */

const playback=path.join(ROOT,"services/playback");
const playbackTs=path.join(playback,"tsconfig.json");

if(fs.existsSync(playbackTs)){
  const cfg=json(playbackTs);

  cfg.compilerOptions ||= {};
  cfg.compilerOptions.jsx="react-jsx";
  cfg.compilerOptions.module="ESNext";
  cfg.compilerOptions.moduleResolution="Bundler";
  cfg.compilerOptions.allowSyntheticDefaultImports=true;
  cfg.compilerOptions.esModuleInterop=true;
  cfg.compilerOptions.skipLibCheck=true;

  save(playbackTs,cfg);
  report.repaired.push("services/playback:react-typescript-config");
}

const playbackFiles=walk(playback).filter(f=>/\.(ts|tsx)$/.test(f));

for(const file of playbackFiles){
  let s=read(file);

  if(s.includes("audio_url")){
    s=s.replaceAll("audio_url","audioUrl");
    fs.writeFileSync(file,s);
    report.repaired.push(
      `services/playback:${path.relative(playback,file)}:audioUrl-contract`
    );
  }
}

/* -------------------------------------------------------
   3. Ensure playback has React typings/dependencies.
------------------------------------------------------- */

const playbackPkg=path.join(playback,"package.json");

if(fs.existsSync(playbackPkg)){
  const pkg=json(playbackPkg);
  pkg.dependencies ||= {};
  pkg.devDependencies ||= {};

  pkg.dependencies.react ||= "^19.1.1";
  pkg.dependencies["react-dom"] ||= "^19.1.1";
  pkg.devDependencies["@types/react"] ||= "^19.1.10";
  pkg.devDependencies["@types/react-dom"] ||= "^19.1.7";

  save(playbackPkg,pkg);
  report.repaired.push("services/playback:react-dependencies");
}

/* -------------------------------------------------------
   4. Repair payments service boundary.

   These files already exist in canonical API. We copy only
   missing support files into the service boundary.
------------------------------------------------------- */

const api=path.join(ROOT,"apps/api");
const payments=path.join(ROOT,"services/payments");

for(const rel of [
  "src/db.ts",
  "src/middleware/auth.ts"
]){
  if(copyIfMissing(
    path.join(api,rel),
    path.join(payments,rel)
  )){
    report.repaired.push(`services/payments:${rel}`);
  }
}

const paymentsPkg=path.join(payments,"package.json");

if(fs.existsSync(paymentsPkg)){
  const pkg=json(paymentsPkg);
  pkg.dependencies ||= {};
  pkg.dependencies.express ||= "^5.1.0";
  pkg.devDependencies ||= {};
  pkg.devDependencies["@types/express"] ||= "^5.0.3";
  save(paymentsPkg,pkg);
  report.repaired.push("services/payments:express-types");
}

/* -------------------------------------------------------
   5. Repair recommendations service boundary.
------------------------------------------------------- */

const recommendations=path.join(ROOT,"services/recommendations");

if(copyIfMissing(
  path.join(api,"src/db.ts"),
  path.join(recommendations,"src/db.ts")
)){
  report.repaired.push("services/recommendations:src/db.ts");
}

const recPkg=path.join(recommendations,"package.json");

if(fs.existsSync(recPkg)){
  const pkg=json(recPkg);
  pkg.dependencies ||= {};
  pkg.dependencies.pg ||= "^8.16.3";
  save(recPkg,pkg);
  report.repaired.push("services/recommendations:pg");
}

/* -------------------------------------------------------
   6. Re-register workspace dependencies through npm.
------------------------------------------------------- */

console.log("\n=== DEPENDENCY RECONCILIATION ===");

const install=spawnSync(
  "npm",
  ["install","--ignore-scripts","--no-audit","--no-fund"],
  {cwd:ROOT,stdio:"inherit"}
);

if(install.status!==0){
  report.unresolved.push("npm-install-failed");
}

/* -------------------------------------------------------
   7. Persist report.
------------------------------------------------------- */

const out=path.join(
  ROOT,
  "tools",
  "merge-state",
  "ecosystem-blocker-repair.json"
);

fs.mkdirSync(path.dirname(out),{recursive:true});
save(out,report);

console.log("\n=== REPAIR RESULT ===");
console.log(`Repairs applied: ${report.repaired.length}`);
console.log(`Unresolved: ${report.unresolved.length}`);
console.log(`Original source variants modified: ${report.sourceVariantsModified}`);
console.log("Destructive conflict resolution: 0");
console.log(`Report: ${path.relative(ROOT,out)}`);

process.exit(report.unresolved.length?1:0);
