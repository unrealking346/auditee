import { readFileSync } from "node:fs";

const schema = readFileSync(
  new URL("../migrations/001_canonical.sql", import.meta.url),
  "utf8"
);

const required = [
  "users",
  "artists",
  "albums",
  "releases",
  "tracks",
  "playlists",
  "playlist_tracks",
  "listening_events",
  "rights",
  "royalty_ledger",
  "subscriptions",
  "devices"
];

const missing = required.filter(
  (table) => !new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`, "i").test(schema)
);

if (missing.length) {
  console.error("Missing canonical tables:", missing.join(", "));
  process.exit(1);
}

console.log(`Canonical schema check passed: ${required.length} core tables found.`);
