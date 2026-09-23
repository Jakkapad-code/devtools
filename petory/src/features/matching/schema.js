import { z } from "zod";

export const interactionInputSchema = z.object({
  actorPetId: z.string().uuid(),
  targetPetId: z.string().uuid(),
  action: z.enum(["pass", "interest"]),
});

export const MATCHING_PURPOSES = ["playmate", "mate"];

export const matchingPurposeSchema = z.object({
  purpose: z.enum(MATCHING_PURPOSES),
});
