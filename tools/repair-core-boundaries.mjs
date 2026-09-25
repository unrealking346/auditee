import fs from 'fs';
import path from 'path';

const root = process.cwd();
const security = path.join(root, 'packages/security');

const tsconfigPath = path.join(security, 'tsconfig.json');
const tsconfig = {
  compilerOptions: {
    target: "ES2022",
    module: "NodeNext",
    moduleResolution: "NodeNext",
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true
  },
  files: [
    "src/index.ts",
    "src/test/security.test.ts"
  ]
};

fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');

const packagePath = path.join(security, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  pkg.scripts ??= {};
  pkg.scripts.check = "tsc --noEmit";
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
}

const report = {
  status: "BOUNDARY_REPAIRED",
  package: "@waeve/security",
  canonicalCompilation: [
    "src/index.ts",
    "src/test/security.test.ts"
  ],
  preservedOutOfBoundaryFiles: [],
  originalSourceVariantsModified: 0
};

console.log("=== WAEVE CORE BOUNDARY REPAIR ===");
console.log("Security package compilation scope repaired.");
console.log("API-specific route files are not part of @waeve/security.");
console.log("Existing implementation files were not deleted or overwritten.");
console.log("Original source variants modified: 0");
console.log(JSON.stringify(report, null, 2));
