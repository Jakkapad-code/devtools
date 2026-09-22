import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 12;

const email = z.string().trim().toLowerCase().pipe(z.email());
const password = z.string().min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`).max(128);

export const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email,
  password,
});

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
