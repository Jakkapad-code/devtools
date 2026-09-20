import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "./origin-policy";

describe("isAllowedOrigin", () => {
  const appUrl = "https://petory.test";
  const allowedOrigins = ["https://staging.petory.test"];

  it("accepts the application and configured origins", () => {
    expect(isAllowedOrigin("https://petory.test/profile", appUrl, allowedOrigins)).toBe(true);
    expect(isAllowedOrigin("https://staging.petory.test", appUrl, allowedOrigins)).toBe(true);
  });

  it("rejects an untrusted or malformed origin", () => {
    expect(isAllowedOrigin("https://attacker.test", appUrl, allowedOrigins)).toBe(false);
    expect(isAllowedOrigin("not-a-url", appUrl, allowedOrigins)).toBe(false);
  });
});
