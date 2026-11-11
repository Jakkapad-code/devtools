import { describe, expect, it } from "vitest";
import { petInputSchema } from "./schema";

const validPet = {
  name: "Bella",
  species: "Dog",
  breed: "Corgi",
  age: 2,
  gender: "Female",
  size: "Medium",
  bio: "Friendly pup",
  personality: ["Playful"],
  interests: ["Walks"],
};

describe("petInputSchema", () => {
  it("accepts the fields collected by the pet form", () => {
    expect(petInputSchema.parse(validPet)).toMatchObject(validPet);
  });

  it("rejects an unsupported species and an impossible age", () => {
    expect(petInputSchema.safeParse({ ...validPet, species: "Bird" }).success).toBe(false);
    expect(petInputSchema.safeParse({ ...validPet, age: 41 }).success).toBe(false);
  });

  it("accepts up to five distinct gallery photos and rejects duplicates or six photos", () => {
    const ids = Array.from({ length: 6 }, (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
    expect(petInputSchema.safeParse({ ...validPet, photoMediaIds: ids.slice(0, 5) }).success).toBe(true);
    expect(petInputSchema.safeParse({ ...validPet, photoMediaIds: ids }).success).toBe(false);
    expect(petInputSchema.safeParse({ ...validPet, photoMediaIds: [ids[0], ids[0]] }).success).toBe(false);
  });
});
