import { z } from "zod";

const category = z.enum(["story", "recipe", "place", "clinic", "tips", "event", "question"]);

export const postInputSchema = z.object({
  category,
  caption: z.string().trim().min(1).max(5_000),
  title: z.string().trim().max(180).default(""),
  locationLabel: z.string().trim().max(120).default(""),
  petId: z.string().uuid().nullable().optional(),
  photoMediaId: z.string().uuid().nullable().default(null),
});

export const postIdSchema = z.string().uuid();
export const interactionSchema = z.object({ active: z.boolean() });
export const commentInputSchema = z.object({ body: z.string().trim().min(1).max(2_000) });
