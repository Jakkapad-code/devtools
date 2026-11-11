import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/session", () => ({ getCurrentAccount: vi.fn() }));
vi.mock("@/server/matching/repository", () => ({ listCandidates: vi.fn() }));
vi.mock("@/server/security/rate-limit", () => ({ checkRateLimit: vi.fn(), rateLimitResponse: () => new Response(null, { status: 429 }) }));
import { GET } from "./route";
import { getCurrentAccount } from "@/server/auth/session";
import { listCandidates } from "@/server/matching/repository";
import { checkRateLimit } from "@/server/security/rate-limit";

const id = "00000000-0000-4000-8000-000000000001";
const request = (params = "") => ({ nextUrl: new URL(`http://localhost/api/matching/candidates?actorPetId=${id}${params}`) });

describe("matching filters", () => {
  beforeEach(() => { vi.resetAllMocks(); getCurrentAccount.mockResolvedValue({ id: "owner" }); listCandidates.mockResolvedValue([]); checkRateLimit.mockResolvedValue({ allowed: true }); });
  it("passes validated age and distance filters to the repository", async () => {
    expect((await GET(request("&minAge=0&maxAge=5&distance=25"))).status).toBe(200);
    expect(listCandidates).toHaveBeenCalledWith("owner", id, expect.objectContaining({ minAge: 0, maxAge: 5, distance: 25 }));
  });
  it.each(["&minAge=5&maxAge=1", "&minAge=-1", "&distance=0", "&distance=1.23", "&distance=NaN", "&species=invalid"])("rejects invalid filters %s", async (params) => {
    expect((await GET(request(params))).status).toBe(422);
    expect(listCandidates).not.toHaveBeenCalled();
  });
  it("rejects unauthenticated requests", async () => {
    getCurrentAccount.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
  });
  it("limits repeated candidate queries", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, retryAfter: 60 });
    expect((await GET(request())).status).toBe(429);
    expect(listCandidates).not.toHaveBeenCalled();
  });
});
