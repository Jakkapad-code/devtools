import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/session", () => ({ getCurrentAccount: vi.fn() }));
vi.mock("@/server/security/origin", () => ({ requireSameOrigin: vi.fn() }));
vi.mock("@/server/db/pool", () => ({ query: vi.fn() }));
vi.mock("@/server/security/rate-limit", () => ({ checkRateLimit: vi.fn(), rateLimitResponse: () => new Response(null, { status: 429 }) }));
import { GET, PUT } from "./route";
import { getCurrentAccount } from "@/server/auth/session";
import { requireSameOrigin } from "@/server/security/origin";
import { query } from "@/server/db/pool";
import { checkRateLimit } from "@/server/security/rate-limit";

const request = (value) => ({ json: async () => value });
describe("matching location consent", () => {
  beforeEach(() => { vi.resetAllMocks(); getCurrentAccount.mockResolvedValue({ id: "owner" }); query.mockResolvedValue({ rows: [{ shared: true }] }); checkRateLimit.mockResolvedValue({ allowed: true }); });
  it("stores coarse coordinates and does not return coordinates", async () => {
    const response = await PUT(request({ latitude: 13.75633, longitude: 100.50176 }));
    expect(query.mock.calls[0][1]).toEqual(["owner", 13.76, 100.5]);
    expect(await response.json()).toEqual({ shared: true });
  });
  it("lets the owner revoke sharing", async () => {
    const response = await PUT(request(null));
    expect(query.mock.calls[0][1]).toEqual(["owner", null, null]);
    expect(await response.json()).toEqual({ shared: false });
  });
  it("rejects invalid and cross-origin updates", async () => {
    expect((await PUT(request({ latitude: 100, longitude: 2 }))).status).toBe(422);
    requireSameOrigin.mockRejectedValue(new Error("Forbidden cross-origin request"));
    expect((await PUT(request(null))).status).toBe(403);
    expect(query).not.toHaveBeenCalled();
  });
  it("only exposes whether the current user shared", async () => {
    expect(await (await GET()).json()).toEqual({ shared: true });
    getCurrentAccount.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });
  it("limits location updates while always allowing revocation", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, retryAfter: 60 });
    expect((await PUT(request({ latitude: 13, longitude: 100 }))).status).toBe(429);
    expect((await PUT(request(null))).status).toBe(200);
    expect(checkRateLimit).toHaveBeenCalledTimes(1);
  });
});
