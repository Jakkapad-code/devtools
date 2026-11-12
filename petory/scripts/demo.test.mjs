import { describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { demoDatabaseIsSafe, tunnelUrlFromLogs } from "./demo.mjs";

describe("Quick Tunnel demo launcher", () => {
  it("extracts the latest valid Cloudflare hostname, not documentation links", () => {
    expect(tunnelUrlFromLogs("https://developers.cloudflare.com\nhttps://old-demo.trycloudflare.com\nhttps://new-demo.trycloudflare.com |")).toBe("https://new-demo.trycloudflare.com");
    expect(tunnelUrlFromLogs("https://attacker.example.com")).toBeNull();
  });
  it("allows only a verified mock-only database", () => {
    expect(demoDatabaseIsSafe("0|0")).toBe(true);
    expect(demoDatabaseIsSafe("8|0\n")).toBe(true);
    expect(demoDatabaseIsSafe("9|1")).toBe(false);
    expect(demoDatabaseIsSafe("")).toBe(false);
    expect(demoDatabaseIsSafe("error|0")).toBe(false);
  });
  it("reads demo status from the explicitly configured persistent state file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "petory-demo-state-"));
    try {
      const state = join(directory, "state.json");
      await writeFile(state, JSON.stringify({ dbPassword: "a".repeat(48), sessionSecret: "b".repeat(96), publicUrl: "https://example.trycloudflare.com" }));
      await writeFile(join(directory, "docker"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
      const result = spawnSync(process.execPath, ["scripts/demo.mjs", "status"], {
        cwd: process.cwd(), encoding: "utf8",
        env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, PETORY_DEMO_STATE_PATH: state },
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("https://example.trycloudflare.com");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
