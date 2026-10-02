import { z } from "zod";

const positiveInteger = (fallback, maximum) => z.coerce.number().int().min(1).max(maximum).default(fallback);

const databaseSchema = z.object({
  DATABASE_URL: z.url().refine((value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol)),
  DATABASE_SSL: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  DB_POOL_MAX: positiveInteger(10, 100),
  DB_IDLE_TIMEOUT_MS: positiveInteger(30_000, 300_000),
  DB_CONNECTION_TIMEOUT_MS: positiveInteger(5_000, 60_000),
});

const environmentSchema = databaseSchema.extend({
  NEXT_PUBLIC_APP_URL: z.url(),
  SESSION_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().default(""),
  BACKEND_URL: z.url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SESSION_LIFETIME_SECONDS: positiveInteger(60 * 60 * 24 * 15, 60 * 60 * 24 * 90),
  MAX_MEDIA_BYTES: positiveInteger(2 * 1024 * 1024, 2 * 1024 * 1024),
  MAX_MEDIA_PER_ACCOUNT: positiveInteger(50, 1_000),
  PASSWORD_RESET_TTL_MINUTES: positiveInteger(30, 120),
  RATE_LIMIT_LOGIN: positiveInteger(10, 1_000),
  RATE_LIMIT_LOGIN_GLOBAL: positiveInteger(120, 10_000),
  RATE_LIMIT_REGISTER: positiveInteger(5, 1_000),
  RATE_LIMIT_REGISTER_GLOBAL: positiveInteger(30, 10_000),
  RATE_LIMIT_RESET_REQUEST: positiveInteger(3, 1_000),
  RATE_LIMIT_RESET_REQUEST_GLOBAL: positiveInteger(60, 10_000),
  RATE_LIMIT_RESET_CONFIRM: positiveInteger(10, 1_000),
  RATE_LIMIT_UPLOAD: positiveInteger(30, 1_000),
  RATE_LIMIT_REPORT: positiveInteger(10, 1_000),
  MAIL_PROVIDER: z.enum(["disabled", "resend"]).default("disabled"),
  MAIL_FROM: z.email().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  MAIL_API_URL: z.url().optional(),
}).superRefine((values, context) => {
  if (values.MAIL_PROVIDER !== "resend") return;
  for (const name of ["MAIL_FROM", "RESEND_API_KEY"]) {
    if (!values[name]) context.addIssue({ code: "custom", path: [name], message: `${name} is required for Resend mail` });
  }
  if (values.NODE_ENV === "production" && values.MAIL_API_URL && values.MAIL_API_URL !== "https://api.resend.com/emails") {
    context.addIssue({ code: "custom", path: ["MAIL_API_URL"], message: "Production mail must use the official Resend endpoint" });
  }
});

function parse(schema, values, label) {
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid ${label} environment variables: ${details}`);
  }
  return parsed.data;
}

/** CLI scripts and the web app share this DB-only parser. */
export function parseDatabaseEnv(values) {
  return parse(databaseSchema, values, "database");
}

/** Parse server configuration without reading global state, so it stays testable. */
export function parseServerEnv(values) {
  const parsed = parse(environmentSchema, values, "server");

  return {
    ...parsed,
    ALLOWED_ORIGINS: parsed.ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}
