import { z } from "zod";

export const reportStatusSchema = z.enum(["pending", "resolved", "dismissed", "all"]);
export const reportTypeSchema = z.enum(["post", "user", "all"]);

export const searchSchema = z.string().trim().max(120).optional().default("");

/** "perm" is the console's word for a suspension with no end date. */
export const suspendSchema = z.object({
  duration: z.union([z.literal("perm"), z.coerce.number().int().min(1).max(3650)]),
  reason: z.string().trim().min(2).max(200),
});

export const resolveReportSchema = z.object({
  status: z.enum(["resolved", "dismissed"]),
  resolution: z.string().trim().min(2).max(200),
});

export const uuidSchema = z.string().uuid();
