import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/session", () => ({ getCurrentAccount: vi.fn() }));
vi.mock("@/server/media/service", () => ({ createMedia: vi.fn(), readImageFromRequest: vi.fn() }));
vi.mock("@/server/security/origin", () => ({ requireSameOrigin: vi.fn() }));
vi.mock("@/server/security/rate-limit", () => ({ checkRateLimit: vi.fn(), rateLimitResponse: vi.fn() }));
vi.mock("@/server/db/pool", () => ({ query: vi.fn() }));

import { POST as upload } from "./route";
import { POST as avatar } from "./avatar/route";
import { getCurrentAccount } from "@/server/auth/session";
import { createMedia, readImageFromRequest } from "@/server/media/service";
import { UploadError } from "@/server/media/upload";
import { checkRateLimit } from "@/server/security/rate-limit";

describe.each([["media", upload], ["avatar", avatar]])("%s upload error handling", (_, handler) => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentAccount.mockResolvedValue({ id: "owner" });
    checkRateLimit.mockResolvedValue({ allowed: true });
  });
  it("returns the safe validation status without saving", async () => {
    readImageFromRequest.mockRejectedValue(new UploadError("Upload request is too large", 413));
    const response = await handler({});
    expect(response.status).toBe(413);
    expect(createMedia).not.toHaveBeenCalled();
  });
  it("does not expose database error details", async () => {
    readImageFromRequest.mockResolvedValue({});
    createMedia.mockRejectedValue(new Error("private database details"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await handler({});
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("private database details");
    log.mockRestore();
  });
});
