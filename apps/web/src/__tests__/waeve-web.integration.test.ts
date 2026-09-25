import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "..");

describe("Waeve web integration", () => {
  it("contains the canonical React application", () => {
    expect(fs.existsSync(path.join(root, "src", "App.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(root, "src", "main.tsx"))).toBe(true);
  });

  it("contains the persistent playback boundary", () => {
    expect(fs.existsSync(path.join(root, "src", "lib", "player.ts"))).toBe(true);
    expect(fs.existsSync(path.join(root, "src", "components", "PlayerBar.tsx"))).toBe(true);
  });

  it("contains the listener product surfaces", () => {
    const required = [
      ["src", "components", "SongCard.tsx"],
      ["src", "components", "NowPlaying.tsx"],
      ["src", "components", "AuthModal.tsx"],
      ["src", "lib", "api.ts"]
    ];

    for (const parts of required) {
      expect(fs.existsSync(path.join(root, ...parts))).toBe(true);
    }
  });

  it("retains the legacy functional integration boundary", () => {
    const integration = path.join(root, "src", "integration");
    expect(fs.existsSync(integration)).toBe(true);
  });
});
