import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/session", () => ({ getCurrentAccount: vi.fn() }));
vi.mock("@/server/matching/repository", () => ({ unmatch: vi.fn() }));
vi.mock("@/server/security/origin", () => ({ requireSameOrigin: vi.fn() }));

import { DELETE } from "./route";
import { getCurrentAccount } from "@/server/auth/session";
import { unmatch } from "@/server/matching/repository";
import { requireSameOrigin } from "@/server/security/origin";

const matchId = "00000000-0000-4000-8000-000000000001";
const context = (id = matchId) => ({ params: Promise.resolve({ matchId: id }) });

describe("DELETE match", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentAccount.mockResolvedValue({ id: "owner" });
    unmatch.mockResolvedValue({ matchId, conversationId: "room" });
  });
  it("uses the authenticated owner and awaits the database cancellation", async () => {
    const response = await DELETE(null, context());
    expect(response.status).toBe(200);
    expect(unmatch).toHaveBeenCalledWith("owner", matchId);
    expect(await response.json()).toEqual({ match: { matchId, conversationId: "room" } });
  });
  it("rejects anonymous requests", async () => {
    getCurrentAccount.mockResolvedValue(null);
    expect((await DELETE(null, context())).status).toBe(401);
    expect(unmatch).not.toHaveBeenCalled();
  });
  it("rejects cross-origin mutations", async () => {
    requireSameOrigin.mockRejectedValue(new Error("Forbidden cross-origin request"));
    expect((await DELETE(null, context())).status).toBe(403);
    expect(unmatch).not.toHaveBeenCalled();
  });
  it("rejects malformed identifiers before querying", async () => {
    expect((await DELETE(null, context("invalid"))).status).toBe(422);
    expect(unmatch).not.toHaveBeenCalled();
  });
  it("does not reveal foreign or missing matches", async () => {
    unmatch.mockResolvedValue(null);
    expect((await DELETE(null, context())).status).toBe(404);
  });
  it("does not report success when the database fails", async () => {
    unmatch.mockRejectedValue(new Error("database unavailable"));
    expect((await DELETE(null, context())).status).toBe(500);
  });
});
