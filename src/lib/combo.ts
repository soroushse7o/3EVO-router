import { z } from "zod";
export const ComboTier = z.object({
  tier: z.number(),
  provider: z.string(),
  model: z.string(),
  accounts: z.string().optional(),
  trigger: z.string(),
});
export const ComboSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  strategy: z.enum(["priority_fallback","round_robin"]),
  rtk: z.object({ enabled: z.boolean() }).optional(),
  timeoutSeconds: z.number().optional(),
  tiers: z.array(ComboTier),
});
export type Combo = z.infer<typeof ComboSchema>;
