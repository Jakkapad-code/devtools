import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/session", () => ({ getCurrentAccount: vi.fn() }));
vi.mock("@/server/db/pool", () => ({ query: vi.fn() }));
vi.mock("@/server/security/origin", () => ({ requireSameOrigin: vi.fn() }));

import { POST } from "./route";
import { getCurrentAccount } from "@/server/auth/session";
import { query } from "@/server/db/pool";

const id = "00000000-0000-4000-8000-000000000001";
const req = (body) => new Request("http://localhost/api/notifications/read", { method: "POST", body: JSON.stringify(body) });

describe("mark visible notifications read", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentAccount.mockResolvedValue({ id: "owner" });
    query.mockResolvedValue({ rows: [] });
  });
  it("only updates submitted IDs for the authenticated account, leaving new arrivals unread", async () => {
    expect((await POST(req({ ids: [id] }))).status).toBe(204);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("account_id = $1 AND id = ANY($2::uuid[])"), ["owner", [id]]);
  });
  it("rejects missing, invalid, and oversized lists", async () => {
    for (const ids of [undefined, [], ["bad"], Array(101).fill(id)]) {
      expect((await POST(req({ ids }))).status).toBe(422);
    }
    expect(query).not.toHaveBeenCalled();
  });
  it("requires authentication", async () => {
    getCurrentAccount.mockResolvedValue(null);
    expect((await POST(req({ ids: [id] }))).status).toBe(401);
  });
});
