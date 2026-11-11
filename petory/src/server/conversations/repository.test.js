import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/pool", () => ({ query: vi.fn() }));

import { query } from "@/server/db/pool";
import { addMessage, listMessages } from "./repository";

describe("message pagination", () => {
  beforeEach(() => vi.resetAllMocks());

  it("denies blocked, closed, or non-member conversations before reading messages", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    expect(await listMessages("account", "conversation")).toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain("NOT EXISTS");
    expect(query.mock.calls[0][0]).toContain("c.closed_at IS NULL");
  });

  it("returns the newest 100 in chronological order with a previous-page indicator", async () => {
    const rows = Array.from({ length: 101 }, (_, i) => ({ id: String(100 - i) }));
    query.mockResolvedValueOnce({ rows: [{}] }).mockResolvedValueOnce({ rows });
    const result = await listMessages("account", "conversation");
    expect(result.messages.map((row) => row.id)).toEqual(rows.slice(0, 100).reverse().map((row) => row.id));
    expect(result.hasMore).toBe(true);
    expect(query.mock.calls[1][0]).toContain("ORDER BY created_at DESC, id DESC LIMIT 101");
    expect(query.mock.calls[1][0]).toContain("HH24:MI:SS.US");
  });

  it("uses a stable cursor scoped to the same conversation for older and newer messages", async () => {
    query.mockResolvedValue({ rows: [] });
    query.mockResolvedValueOnce({ rows: [{}] });
    await listMessages("account", "conversation", { before: "cursor" });
    expect(query.mock.calls[1][0]).toContain("(created_at, id) <");
    expect(query.mock.calls[1][0]).toContain("conversation_id = $1 AND deleted_at IS NULL");
    expect(query.mock.calls[1][1]).toEqual(["conversation", "cursor"]);
    query.mockResolvedValueOnce({ rows: [{}] });
    await listMessages("account", "conversation", { after: "cursor" });
    expect(query.mock.calls[3][0]).toContain("(created_at, id) >");
    expect(query.mock.calls[3][0]).toContain("ORDER BY created_at ASC, id ASC");
  });

  it("also returns six-digit timestamp precision for newly sent messages", async () => {
    query.mockResolvedValue({ rows: [{ id: "message" }] });
    await addMessage("account", "conversation", "hello");
    expect(query.mock.calls[0][0]).toContain("HH24:MI:SS.US");
  });
});
