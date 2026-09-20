import { z } from "zod";

export const profileInputSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(2_000).default(""),
  phone: z.string().trim().max(40).default(""),
  locationLabel: z.string().trim().max(120).default(""),
});
