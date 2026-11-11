import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/session", () => ({ getCurrentAccount: vi.fn() }));
vi.mock("@/server/conversations/repository", () => ({ listMessages: vi.fn(), addMessage: vi.fn() }));
vi.mock("@/server/security/origin", () => ({ requireSameOrigin: vi.fn() }));

import { GET } from "./route";
import { getCurrentAccount } from "@/server/auth/session";
import { listMessages } from "@/server/conversations/repository";

const id = "00000000-0000-4000-8000-000000000001";
const cursor = "00000000-0000-4000-8000-000000000002";
const context = { params: Promise.resolve({ conversationId: id }) };
const request = (query = "") => new Request(`http://localhost/api/conversations/${id}/messages${query}`);

describe("GET conversation messages", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentAccount.mockResolvedValue({ id: "owner" });
    listMessages.mockResolvedValue({ messages: [], hasMore: false });
  });
  it("forwards a valid before cursor", async () => {
    const response = await GET(request(`?before=${cursor}`), context);
    expect(response.status).toBe(200);
    expect(listMessages).toHaveBeenCalledWith("owner", id, { before: cursor, after: null });
  });
  it("rejects malformed or conflicting cursors", async () => {
    expect((await GET(request("?before=bad"), context)).status).toBe(422);
    expect((await GET(request(`?before=${cursor}&after=${cursor}`), context)).status).toBe(422);
    expect(listMessages).not.toHaveBeenCalled();
  });
  it("does not reveal unavailable conversations", async () => {
    listMessages.mockResolvedValue(null);
    expect((await GET(request(), context)).status).toBe(404);
    getCurrentAccount.mockResolvedValue(null);
    expect((await GET(request(), context)).status).toBe(401);
  });
});
