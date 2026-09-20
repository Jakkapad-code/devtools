import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.url(),
  DATABASE_SSL: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  NEXT_PUBLIC_APP_URL: z.url(),
  SESSION_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().default(""),
  BACKEND_URL: z.url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

/** Parse server configuration without reading global state, so it stays testable. */
export function parseServerEnv(values) {
  const parsed = environmentSchema.safeParse(values);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid server environment variables: ${details}`);
  }

  return {
    ...parsed.data,
    ALLOWED_ORIGINS: parsed.data.ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}
