import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("accepts the original password and rejects an incorrect password", async () => {
    const hash = await hashPassword("this-is-a-test-password");

    await expect(verifyPassword("this-is-a-test-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("incorrect-password", hash)).resolves.toBe(false);
  });

  it("rejects malformed stored hashes", async () => {
    await expect(verifyPassword("this-is-a-test-password", "not-a-password-hash")).resolves.toBe(false);
  });
});
