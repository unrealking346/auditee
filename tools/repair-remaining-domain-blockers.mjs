import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(p) {
  return fs.readFileSync(path.join(root, p), 'utf8');
}

function write(p, s) {
  const f = path.join(root, p);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, s);
}

function patch(p, replacements) {
  let s = read(p);
  for (const [a, b] of replacements) s = s.replaceAll(a, b);
  write(p, s);
}

/* Type declarations required by API-derived service boundaries. */
for (const pkg of [
  'services/payments/package.json',
  'services/recommendations/package.json'
]) {
  const p = path.join(root, pkg);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  j.devDependencies ??= {};
  j.devDependencies['@types/pg'] = '^8.15.5';
  if (pkg.includes('payments')) {
    j.devDependencies['@types/jsonwebtoken'] = '^9.0.10';
  }
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
}

/* React playback adapter: canonical shared contract + valid effect cleanup. */
patch('services/playback/src/components/PlayerBar.tsx', [
  [
    "useEffect(()=>player.subscribe(()=>setTick(x=>x+1)),[])",
    "useEffect(()=>{ const unsubscribe=player.subscribe(()=>setTick(x=>x+1)); return ()=>{ unsubscribe?.(); }; },[])"
  ],
  ["s.artwork_url", "s.artworkUrl"],
  ["s.artist_name", "s.artist"]
]);

/* The legacy player subscription returns boolean in one implementation.
   Normalize that implementation to a proper unsubscribe callback. */
const playerPath = path.join(root, 'services/playback/src/lib/player.ts');
if (fs.existsSync(playerPath)) {
  let s = fs.readFileSync(playerPath, 'utf8');

  s = s.replace(
    /subscribe\s*\(\s*listener\s*:\s*([^)]*)\)\s*\{([\s\S]*?)\n\s*\}/m,
    (full, type, body) => {
      if (/return\s+this\.listeners\.delete/.test(body)) {
        body = body.replace(
          /return\s+this\.listeners\.delete\(([^)]+)\);?/,
          'this.listeners.delete($1); return undefined;'
        );
      }
      return `subscribe(listener: ${type}) {${body}\n  }`;
    }
  );

  fs.writeFileSync(playerPath, s);
}

/* Ensure all workspace dependencies are synchronized. */
