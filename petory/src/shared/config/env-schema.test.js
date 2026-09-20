import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env-schema";

const validEnvironment = {
  DATABASE_URL: "postgresql://petory:password@db.petory.test:5432/petory",
  DATABASE_SSL: "true",
  NEXT_PUBLIC_APP_URL: "https://petory.test",
  SESSION_SECRET: "a-unique-test-secret-that-is-long-enough",
  ALLOWED_ORIGINS: "https://petory.test, https://staging.petory.test",
  NODE_ENV: "test",
};

describe("parseServerEnv", () => {
  it("returns validated values and normalized origin entries", () => {
    expect(parseServerEnv(validEnvironment)).toMatchObject({
      DATABASE_URL: "postgresql://petory:password@db.petory.test:5432/petory",
      DATABASE_SSL: true,
      ALLOWED_ORIGINS: ["https://petory.test", "https://staging.petory.test"],
      NODE_ENV: "test",
    });
  });

  it("rejects missing server secrets", () => {
    expect(() => parseServerEnv({ ...validEnvironment, SESSION_SECRET: "" })).toThrow(
      "Invalid server environment variables: SESSION_SECRET"
    );
  });
});
