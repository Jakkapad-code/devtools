import { describe, expect, it } from "vitest";
import { registerSchema } from "./schema";

describe("registerSchema", () => {
  it("normalizes a valid email address", () => {
    expect(registerSchema.parse({
      displayName: "Jane",
      email: " JANE@PETORY.TEST ",
      password: "this-is-a-long-enough-password",
    }).email).toBe("jane@petory.test");
  });

  it("rejects short passwords", () => {
    expect(registerSchema.safeParse({
      displayName: "Jane",
      email: "jane@petory.test",
      password: "short",
    }).success).toBe(false);
  });
});
