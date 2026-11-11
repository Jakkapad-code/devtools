import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/pool", () => ({ query: vi.fn(), getPool: vi.fn() }));
import { query } from "@/server/db/pool";
import { listCandidates } from "./repository";

describe("matching candidate query", () => {
  beforeEach(() => { vi.resetAllMocks(); query.mockResolvedValueOnce({ rows: [{ id: "pet" }] }).mockResolvedValueOnce({ rows: [] }); });
  it("applies range and distance constraints in SQL, without exposing coordinates", async () => {
    await listCandidates("owner", "pet", { minAge: 1, maxAge: 5, distance: 10 });
    const [sql, values] = query.mock.calls[1];
    expect(sql).toContain("ST_DWithin");
    expect(sql).toContain("p.birth_date IS NOT NULL");
    expect(sql).toContain("ST_Distance");
    expect(sql).not.toMatch(/ST_[XY]\(/);
    expect(values).toEqual(["pet", "owner", 1, 5, 10000]);
  });
  it("does not query candidates for an unowned pet", async () => {
    query.mockReset().mockResolvedValueOnce({ rows: [] });
    expect(await listCandidates("owner", "foreign-pet", {})).toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
  });
});
