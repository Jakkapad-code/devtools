import { describe, expect, it } from "vitest";
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
});
