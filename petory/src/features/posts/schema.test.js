import { describe, expect, it } from "vitest";
import { postInputSchema } from "./schema";

const validPost = { category: "story", caption: "A happy day at the park", title: "", locationLabel: "Bangkok", petId: null };

describe("postInputSchema", () => {
  it("accepts a post collected by the compose form", () => {
    expect(postInputSchema.parse(validPost)).toEqual({ ...validPost, photoMediaId: null });
  });

  it("accepts a photo media ID and rejects an invalid one", () => {
    const photoMediaId = "e55a2d3b-f3a9-49a0-8f7d-df867b017cd5";
    expect(postInputSchema.parse({ ...validPost, photoMediaId }).photoMediaId).toBe(photoMediaId);
    expect(postInputSchema.safeParse({ ...validPost, photoMediaId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects unsupported categories and an empty caption", () => {
    expect(postInputSchema.safeParse({ ...validPost, category: "ad" }).success).toBe(false);
    expect(postInputSchema.safeParse({ ...validPost, caption: "   " }).success).toBe(false);
  });
});
