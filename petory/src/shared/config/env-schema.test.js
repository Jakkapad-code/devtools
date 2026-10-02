import { describe, expect, it } from "vitest";
import { parseDatabaseEnv, parseServerEnv } from "./env-schema";

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

  it("provides safe app and database defaults", () => {
    const parsed = parseServerEnv(validEnvironment);
    expect(parsed.SESSION_LIFETIME_SECONDS).toBe(1_296_000);
    expect(parsed.MAX_MEDIA_BYTES).toBe(2_097_152);
    expect(parsed.DB_POOL_MAX).toBe(10);
    expect(parsed.RATE_LIMIT_REGISTER_GLOBAL).toBe(30);
    expect(parsed.MAIL_PROVIDER).toBe("disabled");
  });

  it("accepts bounded overrides and rejects malformed settings", () => {
    expect(parseServerEnv({ ...validEnvironment, SESSION_LIFETIME_SECONDS: "3600", MAX_MEDIA_BYTES: "1048576" }))
      .toMatchObject({ SESSION_LIFETIME_SECONDS: 3600, MAX_MEDIA_BYTES: 1_048_576 });
    expect(() => parseServerEnv({ ...validEnvironment, MAX_MEDIA_BYTES: "0" })).toThrow("MAX_MEDIA_BYTES");
    expect(() => parseServerEnv({ ...validEnvironment, DATABASE_SSL: "maybe" })).toThrow("DATABASE_SSL");
    expect(() => parseServerEnv({ ...validEnvironment, RATE_LIMIT_LOGIN_GLOBAL: "0" })).toThrow("RATE_LIMIT_LOGIN_GLOBAL");
    expect(() => parseDatabaseEnv({ ...validEnvironment, DATABASE_URL: "https://petory.test" })).toThrow("DATABASE_URL");
  });

  it("requires Resend mail secrets only when Resend is enabled", () => {
    expect(() => parseServerEnv({ ...validEnvironment, MAIL_PROVIDER: "resend" })).toThrow("MAIL_FROM");
    expect(parseServerEnv({ ...validEnvironment, MAIL_PROVIDER: "resend", MAIL_FROM: "hello@petory.test", RESEND_API_KEY: "test-key" }).MAIL_PROVIDER).toBe("resend");
  });

  it("lets CLI scripts parse only the database settings", () => {
    expect(parseDatabaseEnv({ DATABASE_URL: validEnvironment.DATABASE_URL })).toMatchObject({
      DATABASE_SSL: false,
      DB_POOL_MAX: 10,
    });
  });
});
