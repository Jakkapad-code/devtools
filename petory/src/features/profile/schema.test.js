import { describe, expect, it } from "vitest";
import { profileInputSchema } from "./schema";

describe("profileInputSchema", () => {
  it("trims editable profile fields", () => {
    expect(profileInputSchema.parse({
      displayName: "  Pet Parent  ", bio: "  Hello  ", phone: " 0123 ", locationLabel: " Bangkok ",
    })).toEqual({ displayName: "Pet Parent", bio: "Hello", phone: "0123", locationLabel: "Bangkok" });
  });

  it("requires a display name", () => {
    expect(profileInputSchema.safeParse({ displayName: "", bio: "", phone: "", locationLabel: "" }).success).toBe(false);
  });
});
