import { z } from "zod";

export const interactionInputSchema = z.object({
  actorPetId: z.string().uuid(),
  targetPetId: z.string().uuid(),
  action: z.enum(["pass", "interest"]),
});
