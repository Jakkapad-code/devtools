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
});
