import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email());
const password = z.string().min(12, "Password must be at least 12 characters.").max(128);

export const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email,
  password,
});

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
