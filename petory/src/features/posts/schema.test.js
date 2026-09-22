import { describe, expect, it } from "vitest";
import { postInputSchema } from "./schema";

const validPost = { category: "story", caption: "A happy day at the park", title: "", locationLabel: "Bangkok", petId: null };

describe("postInputSchema", () => {
  it("accepts a post collected by the compose form", () => {
    expect(postInputSchema.parse(validPost)).toEqual(validPost);
  });

  it("rejects unsupported categories and an empty caption", () => {
    expect(postInputSchema.safeParse({ ...validPost, category: "ad" }).success).toBe(false);
    expect(postInputSchema.safeParse({ ...validPost, caption: "   " }).success).toBe(false);
  });
});
