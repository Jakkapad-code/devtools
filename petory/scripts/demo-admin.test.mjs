import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyPassword } from "../src/server/auth/password.js";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, ensureDemoAdmin } from "./demo-admin.mjs";

const originalNodeEnv = process.env.NODE_ENV;
afterEach(() => { process.env.NODE_ENV = originalNodeEnv; });

describe("demo admin bootstrap", () => {
  it("creates an actual admin with a hashed demo password", async () => {
    const client = { query: vi.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: 0 }] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }) };
    expect(await ensureDemoAdmin(client)).toBe(true);
    const [sql, args] = client.query.mock.calls[3];
    expect(sql).toContain("'admin'");
    expect(args[0]).toBe(DEMO_ADMIN_EMAIL);
    expect(args[2]).not.toBe(DEMO_ADMIN_PASSWORD);
    expect(await verifyPassword(DEMO_ADMIN_PASSWORD, args[2])).toBe(true);
  });

  it("preserves an existing admin, including any changed password", async () => {
    const client = { query: vi.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: 0 }] }).mockResolvedValueOnce({ rows: [{ role: "admin" }] }) };
    expect(await ensureDemoAdmin(client)).toBe(false);
    expect(client.query).toHaveBeenCalledTimes(3);
  });

  it("does not promote an existing member with the same email", async () => {
    const client = { query: vi.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: 0 }] }).mockResolvedValueOnce({ rows: [{ role: "member" }] }) };
    await expect(ensureDemoAdmin(client)).rejects.toThrow("non-admin");
    expect(client.query).toHaveBeenCalledTimes(3);
  });

  it("refuses databases containing non-demo accounts", async () => {
    const client = { query: vi.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: 1 }] }) };
    await expect(ensureDemoAdmin(client)).rejects.toThrow("non-demo accounts");
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  it("refuses production before touching the database", async () => {
    process.env.NODE_ENV = "production";
    const client = { query: vi.fn() };
    await expect(ensureDemoAdmin(client)).rejects.toThrow("production");
    expect(client.query).not.toHaveBeenCalled();
  });
});
