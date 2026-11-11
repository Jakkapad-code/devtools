import { describe, expect, it } from "vitest";
import { mergeMessages } from "./messages";

describe("mergeMessages", () => {
  it("deduplicates sent and polled messages and keeps PostgreSQL microsecond order", () => {
    const earlier = { id: "ffffffff-ffff-4fff-8fff-ffffffffffff", createdAt: "2026-01-01T12:00:00.000001Z" };
    const later = { id: "00000000-0000-4000-8000-000000000001", createdAt: "2026-01-01T12:00:00.000002Z" };
    expect(mergeMessages([later], [earlier, later])).toEqual([earlier, later]);
  });
  it("breaks equal timestamps by UUID like the database cursor", () => {
    const a = { id: "00000000-0000-4000-8000-000000000001", createdAt: "2026-01-01T12:00:00.000000Z" };
    const b = { id: "00000000-0000-4000-8000-000000000002", createdAt: a.createdAt };
    expect(mergeMessages([b], [a])).toEqual([a, b]);
  });
});
