import { z } from "zod";

const optionalText = z.string().trim().max(2_000).default("");
const tag = z.string().trim().min(1).max(40);

export const petInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  species: z.enum(["Dog", "Cat", "Other"]),
  breed: z.string().trim().max(120).default(""),
  age: z.coerce.number().int().min(0).max(40),
  weightKg: z.coerce.number().positive().max(500).nullable().default(null),
  photoMediaId: z.string().uuid().nullable().default(null),
  gender: z.enum(["Male", "Female", "Unknown"]),
  size: z.enum(["Small", "Medium", "Large", "Unknown"]),
  bio: optionalText,
  personality: z.array(tag).max(10).default([]),
  interests: z.array(tag).max(20).default([]),
});

export const petIdSchema = z.string().uuid();
